/**
 * Man-in-the-Middle Attack Handler
 * 
 * Simulates MITM attacks for educational purposes.
 * Combines multiple techniques (ARP spoofing, DNS spoofing) to
 * intercept and optionally modify network traffic.
 */

import {
  AttackHandler,
  AttackSimulator,
  generateId,
  delay,
} from './AttackSimulator';
import {
  MITMConfig,
  AttackConfig,
  AttackStatus,
  AttackResult,
  AttackPacket,
  CapturedCredential,
  InterceptedSession,
} from './types';

interface MITMState {
  config: MITMConfig;
  status: AttackStatus;
  intervalId?: ReturnType<typeof setInterval>;
  startTime: number;
  interceptedPackets: AttackPacket[];
  capturedCredentials: CapturedCredential[];
  activeSessions: Map<string, InterceptedSession>;
  statistics: {
    packetsIntercepted: number;
    bytesIntercepted: number;
    httpRequests: number;
    dnsQueries: number;
    credentialsCaptured: number;
    sessionsHijacked: number;
  };
}

export class MITMHandler implements AttackHandler {
  type: 'mitm' = 'mitm';
  private attacks: Map<string, MITMState> = new Map();
  private simulator: AttackSimulator | null = null;

  async start(config: AttackConfig, simulator: AttackSimulator): Promise<void> {
    if (config.type !== 'mitm') {
      throw new Error('Invalid config type for MITM handler');
    }

    const mitmConfig = config as MITMConfig;
    this.simulator = simulator;

    const state: MITMState = {
      config: mitmConfig,
      status: 'running',
      startTime: Date.now(),
      interceptedPackets: [],
      capturedCredentials: [],
      activeSessions: new Map(),
      statistics: {
        packetsIntercepted: 0,
        bytesIntercepted: 0,
        httpRequests: 0,
        dnsQueries: 0,
        credentialsCaptured: 0,
        sessionsHijacked: 0,
      },
    };

    this.attacks.set(mitmConfig.id, state);

    simulator.addEvent(mitmConfig.id, {
      type: 'info',
      severity: 'critical',
      message: `Starting MITM attack using ${mitmConfig.technique}. Target: ${mitmConfig.target.ip}`,
    });

    // First, establish position (ARP spoofing or other technique)
    await this.establishPosition(mitmConfig.id);

    // Then start intercepting traffic
    await this.startInterception(mitmConfig.id);

    // Handle duration
    if (mitmConfig.duration) {
      setTimeout(() => {
        if (this.attacks.get(mitmConfig.id)?.status === 'running') {
          this.stop(mitmConfig.id);
        }
      }, mitmConfig.duration);
    }
  }

  private async establishPosition(attackId: string): Promise<void> {
    const state = this.attacks.get(attackId);
    if (!state || !this.simulator) return;

    const { config } = state;

    this.simulator.addEvent(attackId, {
      type: 'info',
      severity: 'medium',
      message: `Establishing MITM position using ${config.technique}...`,
    });

    switch (config.technique) {
      case 'arp-spoofing':
        await this.setupARPSpoofing(attackId);
        break;
      case 'dns-spoofing':
        await this.setupDNSSpoofing(attackId);
        break;
      case 'dhcp-spoofing':
        await this.setupDHCPSpoofing(attackId);
        break;
      case 'icmp-redirect':
        await this.setupICMPRedirect(attackId);
        break;
    }

    // Wait for position to be established
    await delay(1000);

    this.simulator.addEvent(attackId, {
      type: 'success',
      severity: 'high',
      message: `MITM position established. Now intercepting traffic.`,
    });
  }

  private async setupARPSpoofing(attackId: string): Promise<void> {
    const state = this.attacks.get(attackId);
    if (!state || !this.simulator) return;

    const { config } = state;

    // Send ARP spoofing packets
    const arpPacket: Omit<AttackPacket, 'id' | 'timestamp'> = {
      direction: 'outbound',
      protocol: 'ARP',
      sourceIP: config.target.ip,
      sourceMAC: config.source.mac,
      destIP: config.target.ip,
      destMAC: config.target.mac || 'FF:FF:FF:FF:FF:FF',
      size: 42,
      flags: ['ARP-REPLY'],
      payload: 'Spoofed ARP Reply for MITM positioning',
      isSpoofed: true,
      isMalicious: true,
    };

    this.simulator.addPacket(attackId, arpPacket);
  }

  private async setupDNSSpoofing(attackId: string): Promise<void> {
    // Similar to ARP but for DNS
    const state = this.attacks.get(attackId);
    if (!state || !this.simulator) return;

    this.simulator.addEvent(attackId, {
      type: 'info',
      severity: 'medium',
      message: 'Setting up DNS spoofing for MITM...',
    });
  }

  private async setupDHCPSpoofing(attackId: string): Promise<void> {
    const state = this.attacks.get(attackId);
    if (!state || !this.simulator) return;

    this.simulator.addEvent(attackId, {
      type: 'info',
      severity: 'medium',
      message: 'Setting up rogue DHCP server for MITM...',
    });
  }

  private async setupICMPRedirect(attackId: string): Promise<void> {
    const state = this.attacks.get(attackId);
    if (!state || !this.simulator) return;

    this.simulator.addEvent(attackId, {
      type: 'info',
      severity: 'medium',
      message: 'Sending ICMP redirect messages for MITM...',
    });

    const icmpPacket: Omit<AttackPacket, 'id' | 'timestamp'> = {
      direction: 'outbound',
      protocol: 'ICMP',
      sourceIP: state.config.source.ip,
      sourceMAC: state.config.source.mac,
      destIP: state.config.target.ip,
      destMAC: state.config.target.mac || 'FF:FF:FF:FF:FF:FF',
      size: 56,
      flags: ['REDIRECT'],
      payload: 'ICMP Redirect - Route traffic through attacker',
      isSpoofed: true,
      isMalicious: true,
    };

    this.simulator.addPacket(attackId, icmpPacket);
  }

  private async startInterception(attackId: string): Promise<void> {
    const state = this.attacks.get(attackId);
    if (!state || !this.simulator) return;

    const { config } = state;

    // Simulate intercepting traffic at regular intervals
    state.intervalId = setInterval(() => {
      if (state.status !== 'running') return;

      // Simulate different types of intercepted traffic
      this.simulateInterceptedTraffic(attackId);
    }, 500);
  }

  private simulateInterceptedTraffic(attackId: string): void {
    const state = this.attacks.get(attackId);
    if (!state || !this.simulator) return;

    const { config } = state;
    const random = Math.random();

    // Randomly generate different types of traffic
    if (random < 0.4 && config.interceptProtocols.includes('http')) {
      this.interceptHTTP(attackId);
    } else if (random < 0.6 && config.interceptProtocols.includes('dns')) {
      this.interceptDNS(attackId);
    } else if (random < 0.75 && config.interceptProtocols.includes('ftp')) {
      this.interceptFTP(attackId);
    } else if (random < 0.85) {
      this.interceptGeneric(attackId);
    }

    // Check for credentials with some probability
    if (config.credentialCapture && Math.random() < 0.05) {
      this.captureCredentials(attackId);
    }
  }

  private interceptHTTP(attackId: string): void {
    const state = this.attacks.get(attackId);
    if (!state || !this.simulator) return;

    const { config } = state;
    const isHTTPS = Math.random() > 0.5;
    const isStripped = isHTTPS && config.sslStripping;

    // Simulated HTTP request
    const httpPacket: Omit<AttackPacket, 'id' | 'timestamp'> = {
      direction: 'inbound',
      protocol: isStripped ? 'HTTP (SSL Stripped)' : (isHTTPS ? 'HTTPS' : 'HTTP'),
      sourceIP: config.target.ip,
      sourceMAC: config.target.mac || 'unknown',
      sourcePort: Math.floor(Math.random() * 60000) + 1024,
      destIP: '93.184.216.34', // example.com
      destMAC: 'unknown',
      destPort: isHTTPS ? 443 : 80,
      size: 200 + Math.floor(Math.random() * 1000),
      flags: ['PSH', 'ACK'],
      payload: this.generateHTTPPayload(isStripped),
      isSpoofed: false,
      isMalicious: false,
    };

    state.interceptedPackets.push({ ...httpPacket, id: generateId(), timestamp: Date.now() });
    state.statistics.packetsIntercepted++;
    state.statistics.bytesIntercepted += httpPacket.size;
    state.statistics.httpRequests++;

    this.simulator.addPacket(attackId, httpPacket);
    this.simulator.emit('mitm:intercept', { ...httpPacket, id: generateId(), timestamp: Date.now() });

    if (isStripped) {
      this.simulator.addEvent(attackId, {
        type: 'success',
        severity: 'high',
        message: `SSL Stripped! HTTPS downgraded to HTTP`,
      });
    }
  }

  private generateHTTPPayload(sslStripped: boolean): string {
    const paths = ['/login', '/api/user', '/account', '/dashboard', '/search?q=test'];
    const path = paths[Math.floor(Math.random() * paths.length)];
    
    return [
      `GET ${path} HTTP/1.1`,
      `Host: example.com`,
      `User-Agent: Mozilla/5.0`,
      `Cookie: session_id=abc123xyz`,
      sslStripped ? `[SSL STRIPPED - Originally HTTPS]` : '',
      `[INTERCEPTED BY MITM]`,
    ].filter(Boolean).join('\n');
  }

  private interceptDNS(attackId: string): void {
    const state = this.attacks.get(attackId);
    if (!state || !this.simulator) return;

    const { config } = state;
    const domains = ['google.com', 'facebook.com', 'bank.com', 'mail.example.com'];
    const domain = domains[Math.floor(Math.random() * domains.length)];

    const dnsPacket: Omit<AttackPacket, 'id' | 'timestamp'> = {
      direction: 'inbound',
      protocol: 'DNS',
      sourceIP: config.target.ip,
      sourceMAC: config.target.mac || 'unknown',
      sourcePort: Math.floor(Math.random() * 60000) + 1024,
      destIP: '8.8.8.8',
      destMAC: 'unknown',
      destPort: 53,
      size: 50 + domain.length,
      flags: ['QUERY'],
      payload: `DNS Query: ${domain} (A record)\n[INTERCEPTED]`,
      isSpoofed: false,
      isMalicious: false,
    };

    state.interceptedPackets.push({ ...dnsPacket, id: generateId(), timestamp: Date.now() });
    state.statistics.packetsIntercepted++;
    state.statistics.bytesIntercepted += dnsPacket.size;
    state.statistics.dnsQueries++;

    this.simulator.addPacket(attackId, dnsPacket);

    this.simulator.addEvent(attackId, {
      type: 'info',
      severity: 'low',
      message: `Intercepted DNS query: ${domain}`,
    });
  }

  private interceptFTP(attackId: string): void {
    const state = this.attacks.get(attackId);
    if (!state || !this.simulator) return;

    const { config } = state;

    const ftpPacket: Omit<AttackPacket, 'id' | 'timestamp'> = {
      direction: 'inbound',
      protocol: 'FTP',
      sourceIP: config.target.ip,
      sourceMAC: config.target.mac || 'unknown',
      sourcePort: Math.floor(Math.random() * 60000) + 1024,
      destIP: '192.168.1.100',
      destMAC: 'unknown',
      destPort: 21,
      size: 30,
      flags: [],
      payload: 'USER anonymous\n[INTERCEPTED FTP COMMAND]',
      isSpoofed: false,
      isMalicious: false,
    };

    state.interceptedPackets.push({ ...ftpPacket, id: generateId(), timestamp: Date.now() });
    state.statistics.packetsIntercepted++;

    this.simulator.addPacket(attackId, ftpPacket);
  }

  private interceptGeneric(attackId: string): void {
    const state = this.attacks.get(attackId);
    if (!state || !this.simulator) return;

    const { config } = state;

    const packet: Omit<AttackPacket, 'id' | 'timestamp'> = {
      direction: Math.random() > 0.5 ? 'inbound' : 'outbound',
      protocol: 'TCP',
      sourceIP: config.target.ip,
      sourceMAC: config.target.mac || 'unknown',
      sourcePort: Math.floor(Math.random() * 60000) + 1024,
      destIP: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
      destMAC: 'unknown',
      destPort: Math.floor(Math.random() * 65535),
      size: Math.floor(Math.random() * 1500),
      flags: ['PSH', 'ACK'],
      payload: '[INTERCEPTED PACKET]',
      isSpoofed: false,
      isMalicious: false,
    };

    state.statistics.packetsIntercepted++;
    state.statistics.bytesIntercepted += packet.size;

    this.simulator.addPacket(attackId, packet);
  }

  private captureCredentials(attackId: string): void {
    const state = this.attacks.get(attackId);
    if (!state || !this.simulator) return;

    const { config } = state;
    
    // Simulate capturing credentials
    const credentialTypes: Array<{
      protocol: string;
      authType: CapturedCredential['authType'];
      url?: string;
    }> = [
      { protocol: 'HTTP', authType: 'basic', url: 'http://internal.example.com/admin' },
      { protocol: 'HTTP', authType: 'form', url: 'http://example.com/login' },
      { protocol: 'FTP', authType: 'basic' },
      { protocol: 'Telnet', authType: 'other' },
    ];

    const type = credentialTypes[Math.floor(Math.random() * credentialTypes.length)];
    
    const credential: CapturedCredential = {
      id: generateId(),
      timestamp: Date.now(),
      protocol: type.protocol,
      sourceIP: config.target.ip,
      destIP: '192.168.1.100',
      username: `user${Math.floor(Math.random() * 1000)}`,
      password: '********', // Masked for educational purposes
      authType: type.authType,
      url: type.url,
      rawData: '[REDACTED FOR EDUCATIONAL PURPOSES]',
    };

    state.capturedCredentials.push(credential);
    state.statistics.credentialsCaptured++;

    this.simulator.emit('mitm:credential', credential);

    this.simulator.addEvent(attackId, {
      type: 'success',
      severity: 'critical',
      message: `Captured ${type.protocol} credentials from ${config.target.ip}! User: ${credential.username}`,
    });
  }

  async stop(attackId: string): Promise<void> {
    const state = this.attacks.get(attackId);
    if (!state) return;

    if (state.intervalId) {
      clearInterval(state.intervalId);
    }

    state.status = 'completed';

    if (this.simulator) {
      const duration = (Date.now() - state.startTime) / 1000;
      
      this.simulator.addEvent(attackId, {
        type: 'info',
        severity: 'low',
        message: [
          '═══════════════════════════════════════',
          'MITM ATTACK SUMMARY',
          '═══════════════════════════════════════',
          `Technique: ${state.config.technique}`,
          `Target: ${state.config.target.ip}`,
          `Duration: ${duration.toFixed(2)}s`,
          '',
          'Interception Statistics:',
          `  Packets Intercepted: ${state.statistics.packetsIntercepted}`,
          `  Bytes Intercepted: ${(state.statistics.bytesIntercepted / 1024).toFixed(2)} KB`,
          `  HTTP Requests: ${state.statistics.httpRequests}`,
          `  DNS Queries: ${state.statistics.dnsQueries}`,
          '',
          'Capture Results:',
          `  Credentials Captured: ${state.statistics.credentialsCaptured}`,
          `  Sessions Active: ${state.activeSessions.size}`,
          '',
          state.config.sslStripping ? '  [SSL Stripping was ENABLED]' : '',
        ].filter(Boolean).join('\n'),
      });
    }
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
      capturedCredentials: state.capturedCredentials,
      interceptedPackets: state.interceptedPackets,
    };
  }

  getCapturedCredentials(attackId: string): CapturedCredential[] {
    return this.attacks.get(attackId)?.capturedCredentials || [];
  }

  getActiveSessions(attackId: string): InterceptedSession[] {
    const state = this.attacks.get(attackId);
    return state ? Array.from(state.activeSessions.values()) : [];
  }
}

// ============================================================================
// Educational Content
// ============================================================================

export const MITMEducation = {
  overview: `
    A Man-in-the-Middle (MITM) attack occurs when an attacker secretly intercepts 
    and potentially alters communications between two parties who believe they are 
    communicating directly with each other. The attacker can eavesdrop, inject 
    malicious content, or steal sensitive information.
  `,

  howItWorks: [
    '1. Attacker positions themselves between victim and network',
    '2. Traffic from victim is routed through attacker\'s machine',
    '3. Attacker can read all unencrypted communications',
    '4. SSL stripping can downgrade HTTPS to HTTP',
    '5. Attacker may modify packets before forwarding',
    '6. Credentials and sensitive data can be captured',
    '7. Sessions can be hijacked using stolen cookies',
  ],

  techniques: {
    'arp-spoofing': 'Poison ARP caches to redirect traffic',
    'dns-spoofing': 'Provide false DNS responses',
    'dhcp-spoofing': 'Act as rogue DHCP server',
    'icmp-redirect': 'Send ICMP redirects to reroute traffic',
    'ssl-stripping': 'Downgrade HTTPS connections to HTTP',
    'evil-twin': 'Create fake Wi-Fi access point',
  },

  impact: [
    'Complete loss of data confidentiality',
    'Credential theft (usernames, passwords)',
    'Session hijacking',
    'Data manipulation and injection',
    'Financial fraud',
    'Identity theft',
    'Malware injection',
  ],

  prevention: [
    'Always use HTTPS and verify certificates',
    'Enable HSTS (HTTP Strict Transport Security)',
    'Use VPN on untrusted networks',
    'Enable certificate pinning in applications',
    'Use encrypted DNS (DoH/DoT)',
    'Avoid public Wi-Fi for sensitive activities',
    'Implement mutual TLS authentication',
    'Use secure protocols (SSH instead of Telnet)',
  ],

  detection: [
    'Certificate warnings in browser',
    'Unexpected certificate changes',
    'ARP cache showing duplicate IPs',
    'Slow network performance',
    'Connections downgraded from HTTPS to HTTP',
    'Multiple gateways in ARP table',
  ],

  tools: ['ettercap', 'bettercap', 'mitmproxy', 'sslstrip', 'Wireshark'],

  mitreAttackId: 'T1557',
};
