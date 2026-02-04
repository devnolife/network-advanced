/**
 * Task Validation Types
 * 
 * Type definitions for the task validation system.
 * Network Security Virtual Lab - Educational Platform
 */

// ============================================================================
// Validation Types from labs.json
// ============================================================================

export type ValidationType = 
  | 'command-executed'
  | 'connectivity-test'
  | 'config-check'
  | 'packet-capture'
  | 'packet-analysis'
  | 'interface-check'
  | 'tunnel-status'
  | 'alert-check'
  | 'vpn-packet-captured'
  | 'troubleshoot-complete'
  | 'traffic-analysis'
  | 'security-audit';

// ============================================================================
// Base Validation Schema
// ============================================================================

export interface BaseValidation {
  type: ValidationType;
  device?: string;
}

export interface CommandExecutedValidation extends BaseValidation {
  type: 'command-executed';
  device: string;
  command: string;
}

export interface ConnectivityTestValidation extends BaseValidation {
  type: 'connectivity-test';
  from: string;
  to: string;
  protocol?: 'icmp' | 'tcp' | 'udp';
  port?: number;
}

export interface ConfigCheckValidation extends BaseValidation {
  type: 'config-check';
  device: string;
  expected: Record<string, unknown>;
}

export interface PacketCaptureValidation extends BaseValidation {
  type: 'packet-capture';
  protocol: string;
  count?: number;
}

export interface PacketAnalysisValidation extends BaseValidation {
  type: 'packet-analysis';
  expected: string[];
}

export interface InterfaceCheckValidation extends BaseValidation {
  type: 'interface-check';
  device: string;
  interface: string;
  expected: Record<string, unknown>;
}

export interface TunnelStatusValidation extends BaseValidation {
  type: 'tunnel-status';
  status: 'up' | 'down' | 'establishing';
  tunnelId?: string;
}

export interface AlertCheckValidation extends BaseValidation {
  type: 'alert-check';
  alertType?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  count?: number;
}

export interface VPNPacketCapturedValidation extends BaseValidation {
  type: 'vpn-packet-captured';
  packetType: 'esp' | 'ah' | 'ike';
  count?: number;
}

export interface TroubleshootCompleteValidation extends BaseValidation {
  type: 'troubleshoot-complete';
  issues: string[];
}

export interface TrafficAnalysisValidation extends BaseValidation {
  type: 'traffic-analysis';
  trafficType: string;
  expected: Record<string, unknown>;
}

export interface SecurityAuditValidation extends BaseValidation {
  type: 'security-audit';
  checks: string[];
  minimumScore?: number;
}

// Union type for all validations
export type TaskValidation = 
  | CommandExecutedValidation
  | ConnectivityTestValidation
  | ConfigCheckValidation
  | PacketCaptureValidation
  | PacketAnalysisValidation
  | InterfaceCheckValidation
  | TunnelStatusValidation
  | AlertCheckValidation
  | VPNPacketCapturedValidation
  | TroubleshootCompleteValidation
  | TrafficAnalysisValidation
  | SecurityAuditValidation;

// ============================================================================
// Validation Context
// ============================================================================

export interface ValidationContext {
  labId: string;
  deviceId: string;
  command: string;
  commandOutput?: string;
  
  // Device state
  deviceConfig?: DeviceConfiguration;
  deviceInterfaces?: InterfaceConfiguration[];
  
  // Captured packets
  capturedPackets?: CapturedPacketInfo[];
  
  // VPN state
  vpnTunnels?: VPNTunnelInfo[];
  vpnPackets?: VPNPacketInfo[];
  
  // IDS/IPS state
  idsAlerts?: IDSAlertInfo[];
  
  // Firewall state
  firewallRules?: FirewallRuleInfo[];
  firewallZones?: FirewallZoneInfo[];
  
  // Command history
  commandHistory?: CommandHistoryEntry[];
}

export interface DeviceConfiguration {
  id: string;
  hostname: string;
  type: string;
  runningConfig: string;
  startupConfig?: string;
  configItems: Record<string, unknown>;
}

export interface InterfaceConfiguration {
  name: string;
  ip?: string;
  mask?: string;
  status: 'up' | 'down' | 'admin-down';
  zone?: string;
  natType?: 'inside' | 'outside' | 'dmz';
  cryptoMap?: string;
  aclIn?: string;
  aclOut?: string;
}

export interface CapturedPacketInfo {
  id: string;
  timestamp: number;
  sourceIP: string;
  destIP: string;
  protocol: string;
  sourcePort?: number;
  destPort?: number;
  flags?: string[];
  size: number;
  info: string;
}

export interface VPNTunnelInfo {
  id: string;
  name: string;
  status: 'up' | 'down' | 'establishing';
  localEndpoint: string;
  remoteEndpoint: string;
  protocol: 'ipsec' | 'gre' | 'l2tp';
  phase1Status: string;
  phase2Status: string;
  bytesIn: number;
  bytesOut: number;
}

export interface VPNPacketInfo {
  id: string;
  type: 'esp' | 'ah' | 'ike';
  spi: string;
  timestamp: number;
  sourceIP: string;
  destIP: string;
  encrypted: boolean;
}

export interface IDSAlertInfo {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  timestamp: number;
  sourceIP: string;
  destIP: string;
  status: 'new' | 'acknowledged' | 'resolved' | 'false_positive';
}

export interface FirewallRuleInfo {
  id: string;
  name: string;
  action: 'permit' | 'deny';
  source: string;
  destination: string;
  protocol?: string;
  port?: number;
  enabled: boolean;
  hitCount: number;
}

export interface FirewallZoneInfo {
  id: string;
  name: string;
  interfaces: string[];
  securityLevel: number;
}

export interface CommandHistoryEntry {
  command: string;
  output: string;
  timestamp: number;
  deviceId: string;
  success: boolean;
}

// ============================================================================
// Validation Result
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  taskId?: string;
  taskTitle?: string;
  points?: number;
  message?: string;
  details?: Record<string, unknown>;
  partial?: boolean;
  progress?: number; // 0-100 for partial completion
}

// ============================================================================
// Validator Interface
// ============================================================================

export interface ITaskValidator {
  validate(
    validation: TaskValidation,
    context: ValidationContext
  ): Promise<ValidationResult>;
}
