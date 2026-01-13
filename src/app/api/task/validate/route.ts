import { NextRequest, NextResponse } from 'next/server';
import labsData from '@/data/labs.json';

interface ValidateRequest {
    labId: string;
    deviceId: string;
    command: string;
    commandOutput?: string;
}

interface TaskValidation {
    taskCompleted: boolean;
    taskId?: string;
    taskTitle?: string;
    pointsAwarded?: number;
    message?: string;
}

// POST /api/task/validate - Validate if a command completes a task
export async function POST(request: NextRequest) {
    try {
        const body: ValidateRequest = await request.json();
        const { labId, deviceId, command, commandOutput } = body;

        if (!labId || !deviceId || !command) {
            return NextResponse.json(
                { error: 'labId, deviceId, and command are required' },
                { status: 400 }
            );
        }

        // Find the lab
        const lab = labsData.find(l => l.id === labId || l.number.toString() === labId.replace('lab-', ''));
        if (!lab) {
            return NextResponse.json(
                { error: 'Lab not found' },
                { status: 404 }
            );
        }

        // Normalize command for comparison
        const normalizedCommand = command.trim().toLowerCase();

        // Check each task's validation
        const validationResults: TaskValidation[] = [];

        for (const task of lab.tasks) {
            const validation = task.validation as {
                type: string;
                device?: string;
                command?: string;
                from?: string;
                to?: string;
                expected?: Record<string, string>;
            };

            if (!validation) continue;

            let isCompleted = false;
            const taskDeviceId = validation.device || validation.from;

            // Skip if wrong device
            if (taskDeviceId && taskDeviceId !== deviceId) continue;

            switch (validation.type) {
                case 'command-executed':
                    // Check if the command matches
                    if (validation.command) {
                        const expectedCmd = validation.command.toLowerCase();
                        // Allow partial match for commands like "show ip interface brief" 
                        // when user types "sh ip int br"
                        if (normalizedCommand === expectedCmd ||
                            normalizedCommand.startsWith(expectedCmd.split(' ')[0])) {

                            // More specific matching for show commands
                            if (expectedCmd.startsWith('show')) {
                                const shortForm = expectedCmd
                                    .replace('show', 'sh')
                                    .replace('interface', 'int')
                                    .replace('brief', 'br');
                                if (normalizedCommand === expectedCmd ||
                                    normalizedCommand === shortForm ||
                                    normalizedCommand.includes(expectedCmd.split(' ').slice(1).join(' '))) {
                                    isCompleted = true;
                                }
                            } else if (normalizedCommand === expectedCmd) {
                                isCompleted = true;
                            }
                        }
                    }
                    break;

                case 'connectivity-test':
                    // Check if ping command to the target was successful
                    if (validation.to && normalizedCommand.startsWith('ping')) {
                        const targetIp = normalizedCommand.split(' ')[1];
                        if (targetIp === validation.to) {
                            // Check if output indicates success
                            if (commandOutput &&
                                (commandOutput.includes('Success rate is 100') ||
                                    commandOutput.includes('!!!!!') ||
                                    !commandOutput.includes('timed out'))) {
                                isCompleted = true;
                            }
                        }
                    }
                    break;

                case 'config-check':
                    // For config checks, we need to verify the device config
                    // This would typically check actual device state
                    // For now, we'll check common config commands
                    if (validation.expected?.ip) {
                        const ipCmd = `ip address ${validation.expected.ip}`;
                        const setCmd = `set ip ${validation.expected.ip}`;
                        if (normalizedCommand.includes(ipCmd) ||
                            normalizedCommand.includes(setCmd) ||
                            normalizedCommand.includes(validation.expected.ip)) {
                            isCompleted = true;
                        }
                    }
                    break;
            }

            if (isCompleted) {
                validationResults.push({
                    taskCompleted: true,
                    taskId: task.id,
                    taskTitle: task.title,
                    pointsAwarded: task.points,
                    message: `✅ Task "${task.title}" selesai!`
                });
            }
        }

        // Return the first completed task (or none)
        if (validationResults.length > 0) {
            return NextResponse.json({
                ...validationResults[0],
                allCompletedTasks: validationResults
            });
        }

        return NextResponse.json({
            taskCompleted: false,
            message: null
        });

    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to validate task', details: String(error) },
            { status: 500 }
        );
    }
}
