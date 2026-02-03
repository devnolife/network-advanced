/**
 * Port Scanner Attack Handler
 * 
 * Simulates network port scanning for educational purposes.
 * Demonstrates various scanning techniques used for reconnaissance.
 */

import {
  AttackHandler,
  AttackSimulator,
  generateId,
  generateIP,
  delay,
} from './AttackSimulator';
import {
  PortScanConfig,
  AttackConfig,
  AttackStatus,
  AttackResult,
  PortScanResult,
  AttackPacket,
} from './types';

// Common ports and their services
const COMMON_PORTS: Record<number, string> = {
  20: 'FTP-DATA',
  21: 'FTP',
  22: 'SSH',
  23: 'Telnet',
  25: 'SMTP',
  53: 'DNS',
  67: 'DHCP-Server',
  68: 'DHCP-Client',
  69: 'TFTP',
  80: 'HTTP',
  110: 'POP3',
  119: 'NNTP',
  123: 'NTP',
  135: 'MS-RPC',
  137: 'NetBIOS-NS',
  138: 'NetBIOS-DGM',
  139: 'NetBIOS-SSN',
  143: 'IMAP',
  161: 'SNMP',
  162: 'SNMP-Trap',
  389: 'LDAP',
  443: 'HTTPS',
  445: 'SMB',
  465: 'SMTPS',
  514: 'Syslog',
  587: 'Submission',
  636: 'LDAPS',
  993: 'IMAPS',
  995: 'POP3S',
  1433: 'MSSQL',
  1521: 'Oracle',
  3306: 'MySQL',
  3389: 'RDP',
  5432: 'PostgreSQL',
  5900: 'VNC',
  6379: 'Redis',
  8080: 'HTTP-Proxy',
  8443: 'HTTPS-Alt',
  27017: 'MongoDB',
};

const COMMON_PORT_LIST = Object.keys(COMMON_PORTS).map(Number);

// Timing profiles (delays in ms)
const TIMING_PROFILES = {
  paranoid: { inter: 300000, intra: 5000 },  // 5 min between hosts, 5 sec between probes
  sneaky: { inter: 15000, intra: 1000 },     // 15 sec between hosts, 1 sec between probes
  polite: { inter: 400, intra: 100 },        // 400ms between hosts, 100ms between probes
  normal: { inter: 100, intra: 10 },         // Fast but not aggressive
  aggressive: { inter: 10, intra: 1 },       // Very fast
  insane: { inter: 0, intra: 0 },            // No delays
};

interface PortScanState {
  config: PortScanConfig;
  status: AttackStatus;
  results: Map<number, PortScanResult>;
  currentPort: number;
  portsScanned: number;
  totalPorts: number;
  startTime: number;
  intervalId?: ReturnType<typeof setInterval>;
}

export class PortScanHandler implements AttackHandler {
  type: 'port-scan' = 'port-scan';
  private attacks: Map<string, PortScanState> = new Map();
  private simulator: AttackSimulator | null = null;

  async start(config: AttackConfig, simulator: AttackSimulator): Promise<void> {
    if (config.type !== 'port-scan') {
      throw new Error('Invalid config type for Port Scanner handler');
    }

    const scanConfig = config as PortScanConfig;
    this.simulator = simulator;

    // Determine ports to scan
    const portsToScan = this.getPortsToScan(scanConfig);

    const state: PortScanState = {
      config: scanConfig,
      status: 'running',
      results: new Map(),
      currentPort: 0,
      portsScanned: 0,
      totalPorts: portsToScan.length,
      startTime: Date.now(),
    };

    this.attacks.set(scanConfig.id, state);

    simulator.addEvent(scanConfig.id, {
      type: 'info',
      severity: 'low',
      message: `Starting ${scanConfig.scanType.toUpperCase()} scan on ${scanConfig.target.ip} (${portsToScan.length} ports)`,
    });

    // Start scanning
    await this.performScan(scanConfig.id, portsToScan);
  }

  private getPortsToScan(config: PortScanConfig): number[] {
    if (config.commonPortsOnly) {
      return COMMON_PORT_LIST.filter(
        p => p >= config.portRange.start && p <= config.portRange.end
      );
    }

    const ports: number[] = [];
    for (let p = config.portRange.start; p <= config.portRange.end; p++) {
      ports.push(p);
    }
    return ports;
  }

  private async performScan(attackId: string, ports: number[]): Promise<void> {
    const state = this.attacks.get(attackId);
    if (!state || !this.simulator) return;

    const { config } = state;
    const timing = TIMING_PROFILES[config.timing];

    for (const port of ports) {
      if (state.status !== 'running') break;

      state.currentPort = port;
      
      // Perform the scan based on type
      const result = await this.scanPort(attackId, port);
      state.results.set(port, result);
      state.portsScanned++;

      // Emit progress
      this.simulator.emit('scan:progress', {
        attackId,
        progress: (state.portsScanned / state.totalPorts) * 100,
        portsScanned: state.portsScanned,
        totalPorts: state.totalPorts,
      });

      // Emit individual result
      this.simulator.emit('scan:result', { attackId, result });

      // Log open ports
      if (result.state === 'open') {
        this.simulator.addEvent(attackId, {
          type: 'success',
          severity: 'medium',
          message: `Port ${port}/${result.protocol} OPEN - ${result.service || 'unknown service'}`,
        });
      }

      // Apply timing delay
      await delay(timing.intra);
    }

    // Complete scan
    if (state.status === 'running') {
      state.status = 'completed';
      
      const openPorts = Array.from(state.results.values()).filter(r => r.state === 'open');
      
      this.simulator.addEvent(attackId, {
        type: 'info',
        severity: 'low',
        message: `Scan complete. ${openPorts.length} open ports found on ${config.target.ip}`,
      });

      // Generate summary
      this.generateScanSummary(attackId);
    }
  }

  private async scanPort(attackId: string, port: number): Promise<PortScanResult> {
    const state = this.attacks.get(attackId);
    if (!state || !this.simulator) {
      return { port, protocol: 'tcp', state: 'closed' };
    }

    const { config } = state;
    const startTime = Date.now();

    // Create and send probe packet based on scan type
    const probePacket = this.createProbePacket(config, port);
    this.simulator.addPacket(attackId, probePacket);

    // Simulate response based on scan type and port
    const { portState, responseTime } = this.simulateResponse(config, port);

    // If we got a response, add it
    if (portState === 'open' || (config.scanType === 'tcp-connect' && portState !== 'filtered')) {
      const responsePacket = this.createResponsePacket(config, port, portState);
      this.simulator.addPacket(attackId, responsePacket);
    }

    const result: PortScanResult = {
      port,
      protocol: config.scanType === 'udp' ? 'udp' : 'tcp',
      state: portState,
      service: COMMON_PORTS[port],
      responseTime,
    };

    // Service detection
    if (config.serviceDetection && portState === 'open') {
      result.version = this.detectServiceVersion(port);
    }

    return result;
  }

  private createProbePacket(
    config: PortScanConfig,
    port: number
  ): Omit<AttackPacket, 'id' | 'timestamp'> {
    const flags = this.getScanFlags(config.scanType);
    const protocol = config.scanType === 'udp' ? 'UDP' : 'TCP';

    return {
      direction: 'outbound',
      protocol,
      sourceIP: config.source.ip,
      sourceMAC: config.source.mac,
      sourcePort: Math.floor(Math.random() * 60000) + 1024,
      destIP: config.target.ip,
      destMAC: config.target.mac || 'FF:FF:FF:FF:FF:FF',
      destPort: port,
      size: config.scanType === 'udp' ? 28 : 40,
      flags,
      payload: this.formatProbePayload(config.scanType, port, flags),
      isSpoofed: false,
      isMalicious: true,
    };
  }

  private createResponsePacket(
    config: PortScanConfig,
    port: number,
    state: PortScanResult['state']
  ): Omit<AttackPacket, 'id' | 'timestamp'> {
    let flags: string[] = [];

    if (state === 'open') {
      flags = ['SYN', 'ACK'];
    } else if (state === 'closed') {
      flags = ['RST', 'ACK'];
    }

    return {
      direction: 'inbound',
      protocol: config.scanType === 'udp' ? 'UDP' : 'TCP',
      sourceIP: config.target.ip,
      sourceMAC: config.target.mac || 'unknown',
      sourcePort: port,
      destIP: config.source.ip,
      destMAC: config.source.mac,
      destPort: Math.floor(Math.random() * 60000) + 1024,
      size: 40,
      flags,
      payload: `Response from port ${port}: ${state}`,
      isSpoofed: false,
      isMalicious: false,
    };
  }

  private getScanFlags(scanType: PortScanConfig['scanType']): string[] {
    switch (scanType) {
      case 'tcp-connect':
      case 'syn':
        return ['SYN'];
      case 'fin':
        return ['FIN'];
      case 'xmas':
        return ['FIN', 'PSH', 'URG'];
      case 'null':
        return [];
      case 'ack':
        return ['ACK'];
      case 'udp':
        return ['UDP'];
      default:
        return ['SYN'];
    }
  }

  private formatProbePayload(
    scanType: PortScanConfig['scanType'],
    port: number,
    flags: string[]
  ): string {
    const scanNames: Record<string, string> = {
      'tcp-connect': 'TCP Connect Scan',
      'syn': 'SYN Stealth Scan',
      'fin': 'FIN Scan',
      'xmas': 'XMAS Scan',
      'null': 'NULL Scan',
      'ack': 'ACK Scan',
      'udp': 'UDP Scan',
    };

    return [
      `Scan Type: ${scanNames[scanType] || scanType}`,
      `Target Port: ${port}`,
      `Flags: ${flags.join(', ') || 'None'}`,
      `Service Hint: ${COMMON_PORTS[port] || 'Unknown'}`,
    ].join('\n');
  }

  private simulateResponse(
    config: PortScanConfig,
    port: number
  ): { portState: PortScanResult['state']; responseTime: number } {
    // Simulate realistic port states
    // Common ports are more likely to be open
    const isCommonPort = COMMON_PORTS[port] !== undefined;
    const openProbability = isCommonPort ? 0.4 : 0.05;
    
    const random = Math.random();
    let portState: PortScanResult['state'];

    if (random < openProbability) {
      portState = 'open';
    } else if (random < openProbability + 0.1) {
      portState = 'filtered';
    } else {
      portState = 'closed';
    }

    // For stealth scans, some responses may be ambiguous
    if (config.scanType === 'fin' || config.scanType === 'xmas' || config.scanType === 'null') {
      if (portState === 'open') {
        portState = 'open|filtered';
      }
    }

    // Simulate response time
    const baseLatency = 1 + Math.random() * 50;
    const responseTime = portState === 'filtered' ? -1 : baseLatency;

    return { portState, responseTime };
  }

  private detectServiceVersion(port: number): string | undefined {
    const versions: Record<number, string> = {
      22: 'OpenSSH 8.4p1',
      80: 'Apache/2.4.46',
      443: 'nginx/1.18.0',
      3306: 'MySQL 8.0.23',
      5432: 'PostgreSQL 13.2',
      6379: 'Redis 6.2.1',
      27017: 'MongoDB 4.4.4',
    };
    return versions[port];
  }

  private generateScanSummary(attackId: string): void {
    const state = this.attacks.get(attackId);
    if (!state || !this.simulator) return;

    const results = Array.from(state.results.values());
    const openPorts = results.filter(r => r.state === 'open');
    const filteredPorts = results.filter(r => r.state === 'filtered');
    const closedPorts = results.filter(r => r.state === 'closed');

    const summary = [
      '═══════════════════════════════════════',
      'PORT SCAN SUMMARY',
      '═══════════════════════════════════════',
      `Target: ${state.config.target.ip}`,
      `Scan Type: ${state.config.scanType.toUpperCase()}`,
      `Ports Scanned: ${state.totalPorts}`,
      `Scan Duration: ${((Date.now() - state.startTime) / 1000).toFixed(2)}s`,
      '',
      `Open Ports: ${openPorts.length}`,
      `Filtered Ports: ${filteredPorts.length}`,
      `Closed Ports: ${closedPorts.length}`,
      '',
    ];

    if (openPorts.length > 0) {
      summary.push('OPEN PORTS:');
      for (const port of openPorts) {
        summary.push(`  ${port.port}/${port.protocol} - ${port.service || 'unknown'}${port.version ? ` (${port.version})` : ''}`);
      }
    }

    this.simulator.addEvent(attackId, {
      type: 'info',
      severity: 'low',
      message: summary.join('\n'),
    });
  }

  async stop(attackId: string): Promise<void> {
    const state = this.attacks.get(attackId);
    if (!state) return;

    if (state.intervalId) {
      clearInterval(state.intervalId);
    }

    state.status = 'completed';
  }

  async pause(attackId: string): Promise<void> {
    const state = this.attacks.get(attackId);
    if (state) {
      state.status = 'paused';
    }
  }

  async resume(attackId: string): Promise<void> {
    const state = this.attacks.get(attackId);
    if (state) {
      state.status = 'running';
    }
  }

  getStatus(attackId: string): AttackStatus {
    return this.attacks.get(attackId)?.status || 'idle';
  }

  getResult(attackId: string): Partial<AttackResult> | null {
    const state = this.attacks.get(attackId);
    if (!state) return null;

    return {
      portScanResults: Array.from(state.results.values()),
    };
  }

  getScanProgress(attackId: string): {
    current: number;
    total: number;
    percentage: number;
  } | null {
    const state = this.attacks.get(attackId);
    if (!state) return null;

    return {
      current: state.portsScanned,
      total: state.totalPorts,
      percentage: (state.portsScanned / state.totalPorts) * 100,
    };
  }
}

// ============================================================================
// Educational Content
// ============================================================================

export const PortScanEducation = {
  overview: `
    Port scanning is a reconnaissance technique used to identify open ports and 
    services running on a target system. While legitimate for network administrators, 
    it's often the first step in planning an attack.
  `,

  scanTypes: {
    'tcp-connect': 'Completes full TCP handshake. Reliable but easily logged.',
    'syn': 'Half-open scan. Sends SYN, waits for SYN/ACK. Stealthier than connect.',
    'fin': 'Sends FIN flag. Open ports typically don\'t respond. Evades some firewalls.',
    'xmas': 'Sets FIN, PSH, URG flags. Named for lit up flags like Christmas tree.',
    'null': 'No flags set. Relies on RFC 793 - closed ports should send RST.',
    'ack': 'Used to map firewall rulesets, not port states.',
    'udp': 'Scans UDP ports. Slower due to lack of acknowledgment.',
  },

  howItWorks: [
    '1. Attacker selects target IP and port range',
    '2. Sends probe packets to each port',
    '3. Analyzes responses to determine port state',
    '4. Open ports indicate running services',
    '5. Service/version detection may follow',
    '6. Information used to identify vulnerabilities',
  ],

  impact: [
    'Reveals attack surface of target system',
    'Identifies potentially vulnerable services',
    'Maps network topology and firewall rules',
    'Precursor to more targeted attacks',
    'May trigger IDS/IPS alerts',
  ],

  prevention: [
    'Use firewalls to filter unnecessary ports',
    'Implement port knocking',
    'Use IDS/IPS to detect scanning',
    'Disable unused services',
    'Use non-standard ports for services',
    'Implement rate limiting',
    'Configure SYN cookies against SYN scans',
  ],

  detection: [
    'Monitor for multiple connection attempts',
    'Track incomplete TCP handshakes',
    'Alert on sequential port access patterns',
    'Use honeypots to detect scanners',
    'Analyze firewall and IDS logs',
  ],

  tools: ['nmap', 'masscan', 'zmap', 'unicornscan', 'netcat'],

  mitreAttackId: 'T1046',
};
