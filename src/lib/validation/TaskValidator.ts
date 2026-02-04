/**
 * Task Validator Service
 * 
 * Comprehensive task validation system that checks various types of
 * lab task completions including commands, configurations, packet captures,
 * VPN tunnels, IDS alerts, and more.
 * 
 * Network Security Virtual Lab - Educational Platform
 */

import {
  ValidationType,
  TaskValidation,
  ValidationContext,
  ValidationResult,
  CommandExecutedValidation,
  ConnectivityTestValidation,
  ConfigCheckValidation,
  PacketCaptureValidation,
  PacketAnalysisValidation,
  InterfaceCheckValidation,
  TunnelStatusValidation,
  AlertCheckValidation,
  VPNPacketCapturedValidation,
  TroubleshootCompleteValidation,
  ITaskValidator,
} from './types';

// ============================================================================
// TaskValidator Class
// ============================================================================

export class TaskValidator implements ITaskValidator {
  /**
   * Main validation entry point
   */
  async validate(
    validation: TaskValidation,
    context: ValidationContext
  ): Promise<ValidationResult> {
    switch (validation.type) {
      case 'command-executed':
        return this.validateCommandExecuted(validation, context);
      
      case 'connectivity-test':
        return this.validateConnectivityTest(validation, context);
      
      case 'config-check':
        return this.validateConfigCheck(validation, context);
      
      case 'packet-capture':
        return this.validatePacketCapture(validation, context);
      
      case 'packet-analysis':
        return this.validatePacketAnalysis(validation, context);
      
      case 'interface-check':
        return this.validateInterfaceCheck(validation, context);
      
      case 'tunnel-status':
        return this.validateTunnelStatus(validation, context);
      
      case 'alert-check':
        return this.validateAlertCheck(validation, context);
      
      case 'vpn-packet-captured':
        return this.validateVPNPacketCaptured(validation, context);
      
      case 'troubleshoot-complete':
        return this.validateTroubleshootComplete(validation, context);
      
      default:
        return {
          valid: false,
          message: `Unknown validation type: ${(validation as TaskValidation).type}`,
        };
    }
  }

  // ==========================================================================
  // Command Executed Validation
  // ==========================================================================

  private validateCommandExecuted(
    validation: CommandExecutedValidation,
    context: ValidationContext
  ): ValidationResult {
    const { device, command } = validation;
    const { deviceId, command: userCommand } = context;

    // Check if correct device
    if (device && device !== deviceId) {
      return { valid: false };
    }

    const normalizedUser = this.normalizeCommand(userCommand);
    const normalizedExpected = this.normalizeCommand(command);

    // Direct match
    if (normalizedUser === normalizedExpected) {
      return { valid: true, message: 'Command executed correctly' };
    }

    // Check for abbreviated forms
    if (this.matchAbbreviatedCommand(normalizedUser, normalizedExpected)) {
      return { valid: true, message: 'Command executed correctly' };
    }

    return { valid: false };
  }

  private normalizeCommand(cmd: string): string {
    return cmd.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private matchAbbreviatedCommand(user: string, expected: string): boolean {
    // Common Cisco IOS abbreviations
    const abbreviations: Record<string, string[]> = {
      'show': ['sh'],
      'interface': ['int', 'interfaces'],
      'brief': ['br'],
      'running-config': ['run', 'running'],
      'startup-config': ['start', 'startup'],
      'configure': ['conf', 'config'],
      'terminal': ['term', 't'],
      'enable': ['en'],
      'disable': ['dis'],
      'no shutdown': ['no shut'],
      'shutdown': ['shut'],
      'access-list': ['access', 'acl'],
      'ip address': ['ip add', 'ip addr'],
      'crypto': ['cry'],
      'isakmp': ['isa'],
      'ipsec': ['ips'],
      'transform-set': ['transform'],
      'gigabitethernet': ['gi', 'gig'],
      'fastethernet': ['fa', 'fast'],
      'ethernet': ['eth', 'e'],
      'vlan': ['vl'],
      'route': ['ro'],
      'router': ['rtr'],
    };

    // Build a version of expected with all abbreviations expanded
    let expandedExpected = expected;
    let expandedUser = user;

    for (const [full, abbrevs] of Object.entries(abbreviations)) {
      for (const abbrev of abbrevs) {
        // Replace abbreviations in user command with full form
        expandedUser = expandedUser.replace(new RegExp(`\\b${abbrev}\\b`, 'gi'), full);
      }
    }

    // Now compare expanded forms
    if (expandedUser === expected) {
      return true;
    }

    // Check if user command starts with expected command words
    const userWords = user.split(' ');
    const expectedWords = expected.split(' ');

    if (userWords.length >= expectedWords.length) {
      let matches = true;
      for (let i = 0; i < expectedWords.length; i++) {
        const expectedWord = expectedWords[i];
        const userWord = userWords[i];
        
        // Check if it's the same or an abbreviation
        if (userWord !== expectedWord) {
          const abbrevs = abbreviations[expectedWord] || [];
          if (!abbrevs.includes(userWord) && !expectedWord.startsWith(userWord)) {
            matches = false;
            break;
          }
        }
      }
      if (matches) return true;
    }

    return false;
  }

  // ==========================================================================
  // Connectivity Test Validation
  // ==========================================================================

  private validateConnectivityTest(
    validation: ConnectivityTestValidation,
    context: ValidationContext
  ): ValidationResult {
    const { from, to, protocol = 'icmp' } = validation;
    const { deviceId, command, commandOutput } = context;

    // Check if correct device
    if (from && from !== deviceId) {
      return { valid: false };
    }

    const normalizedCmd = this.normalizeCommand(command);

    // Check for ping command
    if (protocol === 'icmp') {
      if (!normalizedCmd.startsWith('ping')) {
        return { valid: false };
      }

      // Check target IP
      const targetMatch = command.match(/ping\s+(\d+\.\d+\.\d+\.\d+)/i);
      if (!targetMatch || targetMatch[1] !== to) {
        return { valid: false };
      }

      // Check output for success
      if (commandOutput) {
        const successIndicators = [
          'success rate is 100',
          'success rate is 80',
          '!!!!!',
          '!!!!',
          '!!!',
          'reply from',
          'bytes from',
          '0% packet loss',
          '20% packet loss',
        ];

        const failureIndicators = [
          'request timed out',
          'destination unreachable',
          'host unreachable',
          'network unreachable',
          '100% packet loss',
          '.....',
        ];

        const outputLower = commandOutput.toLowerCase();
        
        const hasSuccess = successIndicators.some(s => outputLower.includes(s.toLowerCase()));
        const hasFailure = failureIndicators.some(f => outputLower.includes(f.toLowerCase()));

        if (hasSuccess && !hasFailure) {
          return { valid: true, message: 'Connectivity test successful' };
        }

        // Partial success
        if (hasSuccess && hasFailure) {
          return {
            valid: true,
            partial: true,
            progress: 50,
            message: 'Partial connectivity established',
          };
        }
      }

      return { valid: false, message: 'Connectivity test failed' };
    }

    // TCP/UDP connectivity (telnet, etc.)
    if (protocol === 'tcp') {
      const { port } = validation;
      if (normalizedCmd.includes('telnet') && normalizedCmd.includes(to)) {
        if (port && normalizedCmd.includes(port.toString())) {
          if (commandOutput?.toLowerCase().includes('connected')) {
            return { valid: true, message: 'TCP connectivity established' };
          }
        }
      }
    }

    return { valid: false };
  }

  // ==========================================================================
  // Config Check Validation
  // ==========================================================================

  private validateConfigCheck(
    validation: ConfigCheckValidation,
    context: ValidationContext
  ): ValidationResult {
    const { device, expected } = validation;
    const { deviceId, deviceConfig, commandHistory, command, commandOutput } = context;

    // Check if correct device
    if (device && device !== deviceId) {
      return { valid: false };
    }

    // Check against device config if available
    if (deviceConfig?.configItems) {
      const allMatch = this.checkConfigItems(expected, deviceConfig.configItems);
      if (allMatch) {
        return { valid: true, message: 'Configuration verified' };
      }
    }

    // Fallback: Check command history or current command
    const configChecks = this.generateConfigChecks(expected);
    
    // Check current command
    const normalizedCmd = this.normalizeCommand(command);
    for (const check of configChecks) {
      if (normalizedCmd.includes(check.toLowerCase())) {
        return { valid: true, message: 'Configuration command executed' };
      }
    }

    // Check command history
    if (commandHistory) {
      for (const entry of commandHistory) {
        const normalizedHistoryCmd = this.normalizeCommand(entry.command);
        for (const check of configChecks) {
          if (normalizedHistoryCmd.includes(check.toLowerCase())) {
            return { valid: true, message: 'Configuration applied' };
          }
        }
      }
    }

    // Check command output for config verification
    if (commandOutput && this.verifyConfigInOutput(expected, commandOutput)) {
      return { valid: true, message: 'Configuration verified in output' };
    }

    return { valid: false };
  }

  private checkConfigItems(
    expected: Record<string, unknown>,
    actual: Record<string, unknown>
  ): boolean {
    for (const [key, value] of Object.entries(expected)) {
      if (Array.isArray(value)) {
        // Check if all expected items are in actual array
        const actualArray = actual[key];
        if (!Array.isArray(actualArray)) return false;
        for (const item of value) {
          if (!actualArray.includes(item)) return false;
        }
      } else if (typeof value === 'object' && value !== null) {
        // Nested object check
        const actualNested = actual[key];
        if (typeof actualNested !== 'object' || actualNested === null) return false;
        if (!this.checkConfigItems(value as Record<string, unknown>, actualNested as Record<string, unknown>)) {
          return false;
        }
      } else {
        // Simple value check
        if (actual[key] !== value) return false;
      }
    }
    return true;
  }

  private generateConfigChecks(expected: Record<string, unknown>): string[] {
    const checks: string[] = [];

    for (const [key, value] of Object.entries(expected)) {
      // Generate different config command patterns based on key
      switch (key) {
        case 'ip':
          checks.push(`ip address ${value}`);
          checks.push(`set ip ${value}`);
          break;
        case 'gateway':
          checks.push(`ip default-gateway ${value}`);
          checks.push(`gateway ${value}`);
          break;
        case 'crypto-policy':
          checks.push(`crypto isakmp policy ${value}`);
          break;
        case 'psk':
          checks.push('crypto isakmp key');
          break;
        case 'transform-set':
          checks.push(`crypto ipsec transform-set ${value}`);
          break;
        case 'crypto-map':
          checks.push(`crypto map ${value}`);
          break;
        case 'zones':
          if (Array.isArray(value)) {
            for (const zone of value) {
              checks.push(`zone security ${zone}`);
            }
          }
          break;
        case 'stateful-inspection':
          checks.push('inspect');
          checks.push('ip inspect');
          break;
        case 'policy':
          checks.push(`zone-pair security ${value}`);
          checks.push(`policy-map ${value}`);
          break;
        case 'app-filter':
          checks.push('application');
          checks.push('app-filter');
          break;
        case 'named-acl':
          checks.push(`ip access-list extended ${value}`);
          checks.push(`ip access-list standard ${value}`);
          break;
        case 'acl-entry':
          checks.push('permit');
          checks.push('deny');
          break;
        case 'time-range':
          checks.push(`time-range ${value}`);
          break;
        case 'static-nat':
          checks.push('ip nat inside source static');
          break;
        case 'pat':
          checks.push('ip nat inside source list');
          checks.push('overload');
          break;
        default:
          checks.push(String(value));
      }
    }

    return checks;
  }

  private verifyConfigInOutput(expected: Record<string, unknown>, output: string): boolean {
    const outputLower = output.toLowerCase();
    
    for (const [key, value] of Object.entries(expected)) {
      if (typeof value === 'string') {
        if (outputLower.includes(value.toLowerCase())) {
          return true;
        }
      }
    }
    
    return false;
  }

  // ==========================================================================
  // Packet Capture Validation
  // ==========================================================================

  private validatePacketCapture(
    validation: PacketCaptureValidation,
    context: ValidationContext
  ): ValidationResult {
    const { protocol, count = 1 } = validation;
    const { capturedPackets } = context;

    if (!capturedPackets || capturedPackets.length === 0) {
      return { valid: false, message: 'No packets captured' };
    }

    // Filter packets by protocol
    const matchingPackets = capturedPackets.filter(
      p => p.protocol.toLowerCase() === protocol.toLowerCase()
    );

    if (matchingPackets.length >= count) {
      return {
        valid: true,
        message: `Captured ${matchingPackets.length} ${protocol} packet(s)`,
        details: { packetCount: matchingPackets.length },
      };
    }

    if (matchingPackets.length > 0) {
      return {
        valid: false,
        partial: true,
        progress: Math.floor((matchingPackets.length / count) * 100),
        message: `Captured ${matchingPackets.length}/${count} ${protocol} packets`,
      };
    }

    return { valid: false, message: `No ${protocol} packets captured` };
  }

  // ==========================================================================
  // Packet Analysis Validation
  // ==========================================================================

  private validatePacketAnalysis(
    validation: PacketAnalysisValidation,
    context: ValidationContext
  ): ValidationResult {
    const { expected } = validation;
    const { capturedPackets } = context;

    if (!capturedPackets || capturedPackets.length === 0) {
      return { valid: false, message: 'No packets to analyze' };
    }

    // Check for expected elements (e.g., SYN, SYN-ACK, ACK for TCP handshake)
    const found: string[] = [];
    const missing: string[] = [];

    for (const expectedItem of expected) {
      const itemLower = expectedItem.toLowerCase();
      
      const hasItem = capturedPackets.some(p => {
        const infoLower = p.info.toLowerCase();
        const flagsLower = (p.flags || []).map(f => f.toLowerCase());
        
        return infoLower.includes(itemLower) || 
               flagsLower.includes(itemLower) ||
               (itemLower === 'syn' && flagsLower.includes('s')) ||
               (itemLower === 'syn-ack' && (flagsLower.includes('s.') || infoLower.includes('syn-ack'))) ||
               (itemLower === 'ack' && flagsLower.includes('.'));
      });

      if (hasItem) {
        found.push(expectedItem);
      } else {
        missing.push(expectedItem);
      }
    }

    if (missing.length === 0) {
      return {
        valid: true,
        message: `All expected packets found: ${found.join(', ')}`,
        details: { found },
      };
    }

    if (found.length > 0) {
      return {
        valid: false,
        partial: true,
        progress: Math.floor((found.length / expected.length) * 100),
        message: `Found: ${found.join(', ')}. Missing: ${missing.join(', ')}`,
        details: { found, missing },
      };
    }

    return { valid: false, message: `Missing packets: ${missing.join(', ')}` };
  }

  // ==========================================================================
  // Interface Check Validation
  // ==========================================================================

  private validateInterfaceCheck(
    validation: InterfaceCheckValidation,
    context: ValidationContext
  ): ValidationResult {
    const { device, interface: iface, expected } = validation;
    const { deviceId, deviceInterfaces, command, commandOutput } = context;

    // Check if correct device
    if (device && device !== deviceId) {
      return { valid: false };
    }

    // Check against interface data if available
    if (deviceInterfaces) {
      const targetInterface = deviceInterfaces.find(
        i => i.name.toLowerCase().includes(iface.toLowerCase()) ||
             iface.toLowerCase().includes(i.name.toLowerCase())
      );

      if (targetInterface) {
        const allMatch = this.checkInterfaceConfig(expected, targetInterface as unknown as Record<string, unknown>);
        if (allMatch) {
          return { valid: true, message: `Interface ${iface} configured correctly` };
        }
      }
    }

    // Fallback: Check command/output for interface configuration
    const normalizedCmd = this.normalizeCommand(command);
    
    // Check for crypto map application
    if (expected['crypto-map'] === 'applied') {
      if (normalizedCmd.includes('crypto map') && normalizedCmd.includes(iface.toLowerCase())) {
        return { valid: true, message: 'Crypto map applied to interface' };
      }
    }

    // Check for ACL application
    if (expected['acl-applied']) {
      if (normalizedCmd.includes('ip access-group') && normalizedCmd.includes(String(expected['acl-applied']).toLowerCase())) {
        return { valid: true, message: 'ACL applied to interface' };
      }
    }

    // Check for zone assignment
    if (expected['zone-assignment']) {
      if (normalizedCmd.includes('zone-member') || normalizedCmd.includes('zone security')) {
        return { valid: true, message: 'Zone assigned to interface' };
      }
    }

    // Check for NAT configuration
    if (expected['nat-inside'] || expected['nat-outside']) {
      if (normalizedCmd.includes('ip nat inside') || normalizedCmd.includes('ip nat outside')) {
        return { valid: true, message: 'NAT configured on interface' };
      }
    }

    return { valid: false };
  }

  private checkInterfaceConfig(
    expected: Record<string, unknown>,
    actual: Record<string, unknown>
  ): boolean {
    for (const [key, value] of Object.entries(expected)) {
      const actualValue = actual[key as keyof typeof actual];
      if (value === 'configured' || value === 'applied') {
        if (!actualValue) return false;
      } else if (actualValue !== value) {
        return false;
      }
    }
    return true;
  }

  // ==========================================================================
  // VPN Tunnel Status Validation
  // ==========================================================================

  private validateTunnelStatus(
    validation: TunnelStatusValidation,
    context: ValidationContext
  ): ValidationResult {
    const { status, tunnelId } = validation;
    const { vpnTunnels, command, commandOutput } = context;

    // Check against VPN tunnel data if available
    if (vpnTunnels && vpnTunnels.length > 0) {
      let targetTunnels = vpnTunnels;
      
      if (tunnelId) {
        targetTunnels = vpnTunnels.filter(t => t.id === tunnelId);
      }

      const matchingTunnel = targetTunnels.find(t => t.status === status);
      
      if (matchingTunnel) {
        return {
          valid: true,
          message: `VPN tunnel ${matchingTunnel.name} is ${status}`,
          details: {
            tunnelId: matchingTunnel.id,
            tunnelName: matchingTunnel.name,
            status: matchingTunnel.status,
          },
        };
      }

      // Check for establishing state
      const establishingTunnel = targetTunnels.find(t => t.status === 'establishing');
      if (establishingTunnel && status === 'up') {
        return {
          valid: false,
          partial: true,
          progress: 50,
          message: `VPN tunnel is establishing...`,
        };
      }
    }

    // Fallback: Check show commands output
    if (commandOutput) {
      const outputLower = commandOutput.toLowerCase();
      
      // Check for IKE SA status
      if (outputLower.includes('qm_idle') || outputLower.includes('active')) {
        if (status === 'up') {
          return { valid: true, message: 'IPSec tunnel is active' };
        }
      }

      // Check for crypto session status
      if (outputLower.includes('session status: up-active')) {
        if (status === 'up') {
          return { valid: true, message: 'Crypto session is up and active' };
        }
      }

      // Check show crypto isakmp sa
      if (command.toLowerCase().includes('show crypto')) {
        if (outputLower.includes('mm_active') || outputLower.includes('qm_idle')) {
          return { valid: true, message: 'IKE SA is established' };
        }
      }
    }

    return { valid: false, message: `VPN tunnel is not ${status}` };
  }

  // ==========================================================================
  // IDS Alert Check Validation
  // ==========================================================================

  private validateAlertCheck(
    validation: AlertCheckValidation,
    context: ValidationContext
  ): ValidationResult {
    const { alertType, severity, count = 1 } = validation;
    const { idsAlerts } = context;

    if (!idsAlerts || idsAlerts.length === 0) {
      return { valid: false, message: 'No IDS alerts generated' };
    }

    // Filter alerts
    let matchingAlerts = idsAlerts;

    if (alertType) {
      matchingAlerts = matchingAlerts.filter(
        a => a.category.toLowerCase() === alertType.toLowerCase() ||
             a.ruleName.toLowerCase().includes(alertType.toLowerCase())
      );
    }

    if (severity) {
      matchingAlerts = matchingAlerts.filter(a => a.severity === severity);
    }

    if (matchingAlerts.length >= count) {
      return {
        valid: true,
        message: `${matchingAlerts.length} IDS alert(s) detected`,
        details: {
          alertCount: matchingAlerts.length,
          alerts: matchingAlerts.slice(0, 5).map(a => ({
            rule: a.ruleName,
            severity: a.severity,
            source: a.sourceIP,
          })),
        },
      };
    }

    if (matchingAlerts.length > 0) {
      return {
        valid: false,
        partial: true,
        progress: Math.floor((matchingAlerts.length / count) * 100),
        message: `${matchingAlerts.length}/${count} alerts detected`,
      };
    }

    return { valid: false, message: 'No matching IDS alerts found' };
  }

  // ==========================================================================
  // VPN Packet Captured Validation
  // ==========================================================================

  private validateVPNPacketCaptured(
    validation: VPNPacketCapturedValidation,
    context: ValidationContext
  ): ValidationResult {
    const { packetType, count = 1 } = validation;
    const { vpnPackets, capturedPackets } = context;

    // Check VPN-specific packets
    if (vpnPackets && vpnPackets.length > 0) {
      const matchingPackets = vpnPackets.filter(p => p.type === packetType);
      
      if (matchingPackets.length >= count) {
        return {
          valid: true,
          message: `Captured ${matchingPackets.length} ${packetType.toUpperCase()} packet(s)`,
          details: {
            packetCount: matchingPackets.length,
            encrypted: matchingPackets.filter(p => p.encrypted).length,
          },
        };
      }
    }

    // Fallback: Check general captured packets for ESP/AH/IKE
    if (capturedPackets) {
      const vpnProtocolMap: Record<string, string[]> = {
        'esp': ['esp', 'ipsec'],
        'ah': ['ah', 'authentication header'],
        'ike': ['ike', 'isakmp', 'udp 500', 'udp 4500'],
      };

      const patterns = vpnProtocolMap[packetType] || [packetType];
      
      const matchingPackets = capturedPackets.filter(p => {
        const protocol = p.protocol.toLowerCase();
        const info = p.info.toLowerCase();
        return patterns.some(pattern => 
          protocol.includes(pattern) || info.includes(pattern)
        );
      });

      if (matchingPackets.length >= count) {
        return {
          valid: true,
          message: `Captured ${matchingPackets.length} ${packetType.toUpperCase()} packet(s)`,
        };
      }

      if (matchingPackets.length > 0) {
        return {
          valid: false,
          partial: true,
          progress: Math.floor((matchingPackets.length / count) * 100),
          message: `Captured ${matchingPackets.length}/${count} ${packetType.toUpperCase()} packets`,
        };
      }
    }

    return { valid: false, message: `No ${packetType.toUpperCase()} packets captured` };
  }

  // ==========================================================================
  // Troubleshoot Complete Validation
  // ==========================================================================

  private validateTroubleshootComplete(
    validation: TroubleshootCompleteValidation,
    context: ValidationContext
  ): ValidationResult {
    const { issues } = validation;
    const { commandHistory } = context;

    if (!commandHistory || commandHistory.length === 0) {
      return { valid: false, message: 'No troubleshooting commands executed' };
    }

    // Define troubleshooting command patterns for common issues
    const issueCommands: Record<string, string[]> = {
      'connectivity': ['ping', 'traceroute', 'tracert', 'show ip route'],
      'interface': ['show interface', 'show ip interface', 'no shutdown'],
      'acl': ['show access-list', 'show ip access-list', 'debug ip packet'],
      'nat': ['show ip nat', 'debug ip nat', 'clear ip nat'],
      'vpn': ['show crypto', 'debug crypto', 'clear crypto'],
      'routing': ['show ip route', 'show ip protocols', 'debug ip routing'],
      'firewall': ['show zone', 'show policy-map', 'debug inspect'],
    };

    const resolvedIssues: string[] = [];
    const unresolvedIssues: string[] = [];

    for (const issue of issues) {
      const issueLower = issue.toLowerCase();
      const relevantCommands = Object.entries(issueCommands)
        .filter(([key]) => issueLower.includes(key))
        .flatMap(([, cmds]) => cmds);

      if (relevantCommands.length === 0) {
        // Generic check - any troubleshooting command
        relevantCommands.push('show', 'debug', 'ping', 'traceroute');
      }

      const hasRelevantCommand = commandHistory.some(entry => {
        const cmd = entry.command.toLowerCase();
        return relevantCommands.some(pattern => cmd.includes(pattern));
      });

      if (hasRelevantCommand) {
        resolvedIssues.push(issue);
      } else {
        unresolvedIssues.push(issue);
      }
    }

    if (unresolvedIssues.length === 0) {
      return {
        valid: true,
        message: `All ${issues.length} issue(s) investigated`,
        details: { resolved: resolvedIssues },
      };
    }

    if (resolvedIssues.length > 0) {
      return {
        valid: false,
        partial: true,
        progress: Math.floor((resolvedIssues.length / issues.length) * 100),
        message: `Investigated ${resolvedIssues.length}/${issues.length} issues`,
        details: { resolved: resolvedIssues, remaining: unresolvedIssues },
      };
    }

    return {
      valid: false,
      message: `Issues to investigate: ${unresolvedIssues.join(', ')}`,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let validatorInstance: TaskValidator | null = null;

export function getTaskValidator(): TaskValidator {
  if (!validatorInstance) {
    validatorInstance = new TaskValidator();
  }
  return validatorInstance;
}

export function resetTaskValidator(): void {
  validatorInstance = null;
}

// ============================================================================
// Export
// ============================================================================

export default TaskValidator;
