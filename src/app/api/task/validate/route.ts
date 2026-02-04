import { NextRequest, NextResponse } from 'next/server';
import labsData from '@/data/labs.json';
import { getTaskValidator } from '@/lib/validation';
import type { 
    TaskValidation as TaskValidationType, 
    ValidationContext,
    CapturedPacketInfo,
    VPNTunnelInfo,
    VPNPacketInfo,
    IDSAlertInfo,
    CommandHistoryEntry,
    InterfaceConfiguration,
    DeviceConfiguration,
} from '@/lib/validation/types';

// ============================================================================
// Request/Response Types
// ============================================================================

interface ValidateRequest {
    labId: string;
    deviceId: string;
    command: string;
    commandOutput?: string;
    
    // Extended context for comprehensive validation
    deviceConfig?: DeviceConfiguration;
    deviceInterfaces?: InterfaceConfiguration[];
    capturedPackets?: CapturedPacketInfo[];
    vpnTunnels?: VPNTunnelInfo[];
    vpnPackets?: VPNPacketInfo[];
    idsAlerts?: IDSAlertInfo[];
    commandHistory?: CommandHistoryEntry[];
}

interface TaskValidationResult {
    taskCompleted: boolean;
    taskId?: string;
    taskTitle?: string;
    pointsAwarded?: number;
    message?: string;
    partial?: boolean;
    progress?: number;
    details?: Record<string, unknown>;
}

// ============================================================================
// POST /api/task/validate - Validate if a command/action completes a task
// ============================================================================

export async function POST(request: NextRequest) {
    try {
        const body: ValidateRequest = await request.json();
        const { 
            labId, 
            deviceId, 
            command, 
            commandOutput,
            // Extended context
            deviceConfig,
            deviceInterfaces,
            capturedPackets,
            vpnTunnels,
            vpnPackets,
            idsAlerts,
            commandHistory,
        } = body;

        // Validate required fields
        if (!labId || !deviceId || !command) {
            return NextResponse.json(
                { error: 'labId, deviceId, and command are required' },
                { status: 400 }
            );
        }

        // Find the lab
        const lab = labsData.find(
            l => l.id === labId || l.number.toString() === labId.replace('lab-', '')
        );
        
        if (!lab) {
            return NextResponse.json(
                { error: 'Lab not found' },
                { status: 404 }
            );
        }

        // Build validation context
        const context: ValidationContext = {
            labId,
            deviceId,
            command,
            commandOutput,
            deviceConfig,
            deviceInterfaces,
            capturedPackets,
            vpnTunnels,
            vpnPackets,
            idsAlerts,
            commandHistory,
        };

        // Get validator instance
        const validator = getTaskValidator();

        // Check each task's validation
        const validationResults: TaskValidationResult[] = [];
        const partialResults: TaskValidationResult[] = [];

        for (const task of lab.tasks) {
            const validation = task.validation as TaskValidationType;

            if (!validation) continue;

            // Get the device from validation (support both 'device' and 'from' fields)
            const taskDeviceId = (validation as { device?: string; from?: string }).device || 
                                 (validation as { from?: string }).from;

            // Skip if this validation is for a different device
            if (taskDeviceId && taskDeviceId !== deviceId) continue;

            try {
                // Use the comprehensive validator
                const result = await validator.validate(validation, context);

                if (result.valid) {
                    validationResults.push({
                        taskCompleted: true,
                        taskId: task.id,
                        taskTitle: task.title,
                        pointsAwarded: task.points,
                        message: result.message || `✅ Task "${task.title}" selesai!`,
                        details: result.details,
                    });
                } else if (result.partial) {
                    // Track partial progress
                    partialResults.push({
                        taskCompleted: false,
                        taskId: task.id,
                        taskTitle: task.title,
                        partial: true,
                        progress: result.progress,
                        message: result.message,
                        details: result.details,
                    });
                }
            } catch (validationError) {
                console.error(`Validation error for task ${task.id}:`, validationError);
                // Continue checking other tasks
            }
        }

        // Return completed tasks first, then partial progress
        if (validationResults.length > 0) {
            return NextResponse.json({
                ...validationResults[0],
                allCompletedTasks: validationResults,
                partialProgress: partialResults,
            });
        }

        // If there's partial progress, return that
        if (partialResults.length > 0) {
            return NextResponse.json({
                taskCompleted: false,
                partialProgress: partialResults,
                message: partialResults[0].message,
            });
        }

        // No tasks completed or in progress
        return NextResponse.json({
            taskCompleted: false,
            message: null,
        });

    } catch (error) {
        console.error('Task validation error:', error);
        return NextResponse.json(
            { 
                error: 'Failed to validate task', 
                details: error instanceof Error ? error.message : String(error) 
            },
            { status: 500 }
        );
    }
}

// ============================================================================
// GET /api/task/validate - Get validation types info (for debugging/docs)
// ============================================================================

export async function GET() {
    const validationTypes = [
        {
            type: 'command-executed',
            description: 'Validates that a specific command was executed on a device',
            requiredFields: ['device', 'command'],
            example: { type: 'command-executed', device: 'router1', command: 'show ip route' },
        },
        {
            type: 'connectivity-test',
            description: 'Validates connectivity between devices using ping/telnet',
            requiredFields: ['from', 'to'],
            optionalFields: ['protocol', 'port'],
            example: { type: 'connectivity-test', from: 'pc1', to: '10.1.1.1' },
        },
        {
            type: 'config-check',
            description: 'Validates device configuration matches expected values',
            requiredFields: ['device', 'expected'],
            example: { 
                type: 'config-check', 
                device: 'router1', 
                expected: { 'crypto-policy': '10', 'psk': 'configured' } 
            },
        },
        {
            type: 'packet-capture',
            description: 'Validates that packets of a specific protocol were captured',
            requiredFields: ['protocol'],
            optionalFields: ['count'],
            example: { type: 'packet-capture', protocol: 'ICMP', count: 4 },
        },
        {
            type: 'packet-analysis',
            description: 'Validates that specific packet types/flags were found in capture',
            requiredFields: ['expected'],
            example: { type: 'packet-analysis', expected: ['SYN', 'SYN-ACK', 'ACK'] },
        },
        {
            type: 'interface-check',
            description: 'Validates interface configuration on a device',
            requiredFields: ['device', 'interface', 'expected'],
            example: { 
                type: 'interface-check', 
                device: 'router1', 
                interface: 'GigabitEthernet0/1',
                expected: { 'crypto-map': 'applied' }
            },
        },
        {
            type: 'tunnel-status',
            description: 'Validates VPN tunnel status',
            requiredFields: ['status'],
            optionalFields: ['tunnelId'],
            example: { type: 'tunnel-status', status: 'up' },
        },
        {
            type: 'alert-check',
            description: 'Validates IDS/IPS alerts were generated',
            optionalFields: ['alertType', 'severity', 'count'],
            example: { type: 'alert-check', severity: 'high', count: 1 },
        },
        {
            type: 'vpn-packet-captured',
            description: 'Validates that VPN protocol packets (ESP/AH/IKE) were captured',
            requiredFields: ['packetType'],
            optionalFields: ['count'],
            example: { type: 'vpn-packet-captured', packetType: 'esp', count: 2 },
        },
        {
            type: 'troubleshoot-complete',
            description: 'Validates that troubleshooting steps were performed for issues',
            requiredFields: ['issues'],
            example: { type: 'troubleshoot-complete', issues: ['connectivity', 'routing'] },
        },
    ];

    return NextResponse.json({
        validationTypes,
        totalTypes: validationTypes.length,
        documentation: 'Send POST request with labId, deviceId, command, and optional context data',
    });
}
