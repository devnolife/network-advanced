/**
 * DNS Poisoning Attack Handler
 * 
 * Simulates DNS cache poisoning attacks for educational purposes.
 * Demonstrates how attackers can redirect users to malicious websites
 * by corrupting DNS resolver cache entries.
 */

import {
  AttackHandler,
  AttackSimulator,
  generateId,
  delay,
} from './AttackSimulator';
import {
  DNSPoisoningConfig,
  AttackConfig,
  AttackStatus,
  AttackResult,
  AttackPacket,
} from './types';

interface DNSPoisoningState {
  config: DNSPoisoningConfig;
  status: AttackStatus;
  intervalId?: ReturnType<typeof setInterval>;
  poisonedDomains: Map<string, {
    domain: string;
    originalIP?: string;
    spoofedIP: string;
    poisonedAt: number;
    queryCount: number;
    successCount: number;
  }>;
  packetCount: number;
  startTime: number;
  pendingQueries: Map<number, { domain: string; timestamp: number }>;
}

export class DNSPoisoningHandler implements AttackHandler {
  type: 'dns-poisoning' = 'dns-poisoning';
  private attacks: Map<string, DNSPoisoningState> = new Map();
  private simulator: AttackSimulator | null = null;

  async start(config: AttackConfig, simulator: AttackSimulator): Promise<void> {
    if (config.type !== 'dns-poisoning') {
      throw new Error('Invalid config type for DNS Poisoning handler');
    }

    const dnsConfig = config as DNSPoisoningConfig;
    this.simulator = simulator;

    const state: DNSPoisoningState = {
      config: dnsConfig,
      status: 'running',
      poisonedDomains: new Map(),
      packetCount: 0,
      startTime: Date.now(),
      pendingQueries: new Map(),
    };

    // Initialize poisoned domains tracking
    for (const record of dnsConfig.spoofedRecords) {
      state.poisonedDomains.set(record.domain, {
        domain: record.domain,
        spoofedIP: record.value,
        poisonedAt: Date.now(),
        queryCount: 0,
        successCount: 0,
      });
    }

    this.attacks.set(dnsConfig.id, state);

    simulator.addEvent(dnsConfig.id, {
      type: 'info',
      severity: 'high',
      message: `Starting DNS poisoning attack - Targeting ${dnsConfig.targetDomains.length} domains`,
    });

    // Start the poisoning process
    if (dnsConfig.cachePoison) {
      // Cache poisoning mode - flood with responses
      await this.startCachePoisoning(dnsConfig.id);
    } else {
      // Inline poisoning - wait for and intercept queries
      await this.startInlinePoisoning(dnsConfig.id);
    }

    // Handle duration
    if (dnsConfig.duration) {
      setTimeout(() => {
        if (this.attacks.get(dnsConfig.id)?.status === 'running') {
          this.stop(dnsConfig.id);
        }
      }, dnsConfig.duration);
    }
  }

  private async startCachePoisoning(attackId: string): Promise<void> {
    const state = this.attacks.get(attackId);
    if (!state || !this.simulator) return;

    const { config } = state;

    this.simulator.addEvent(attackId, {
      type: 'info',
      severity: 'medium',
      message: 'Starting DNS cache poisoning flood...',
    });

    // Send many spoofed DNS responses trying to beat legitimate responses
    const poisonLoop = async () => {
      if (state.status !== 'running') return;

      for (const record of config.spoofedRecords) {
        if (state.status !== 'running') break;

        // Generate multiple responses with different transaction IDs
        const responseCount = config.transactionIdGuessing ? 100 : 1;
        
        for (let i = 0; i < responseCount; i++) {
          const txId = config.transactionIdGuessing 
            ? Math.floor(Math.random() * 65536)
            : Math.floor(Math.random() * 65536);

          const dnsResponse = this.createDNSResponse(
            config.source.ip,
            config.source.mac,
            config.target.ip,
            config.target.mac || 'FF:FF:FF:FF:FF:FF',
            record.domain,
            record.value,
            record.type,
            record.ttl,
            txId
          );

          this.simulator!.addPacket(attackId, dnsResponse);
          state.packetCount++;

          // Track poisoning attempts
          const domainState = state.poisonedDomains.get(record.domain);
          if (domainState) {
            domainState.queryCount++;
          }
        }

        // Simulate successful poisoning with probability
        if (Math.random() > 0.7) {
          const domainState = state.poisonedDomains.get(record.domain);
          if (domainState) {
            domainState.successCount++;
            this.simulator!.addEvent(attackId, {
              type: 'success',
              severity: 'high',
              message: `DNS cache potentially poisoned: ${record.domain} -> ${record.value}`,
            });
          }
        }

        await delay(10);
      }
    };

    // Run poisoning loop
    state.intervalId = setInterval(poisonLoop, 500);
    await poisonLoop();
  }

  private async startInlinePoisoning(attackId: string): Promise<void> {
    const state = this.attacks.get(attackId);
    if (!state || !this.simulator) return;

    this.simulator.addEvent(attackId, {
      type: 'info',
      severity: 'medium',
      message: 'Monitoring for DNS queries to poison...',
    });

    // Simulate intercepting DNS queries and responding with spoofed answers
    const monitorLoop = async () => {
      if (state.status !== 'running') return;

      // Simulate a DNS query being intercepted
      const { config } = state;
      const targetDomain = config.targetDomains[Math.floor(Math.random() * config.targetDomains.length)];
      const record = config.spoofedRecords.find(r => r.domain === targetDomain || targetDomain.includes(r.domain));

      if (record) {
        // Create fake query (what we intercepted)
        const queryTxId = Math.floor(Math.random() * 65536);
        
        const dnsQuery = this.createDNSQuery(
          config.target.ip,
          config.target.mac || 'unknown',
          '8.8.8.8', // DNS server
          'unknown',
          targetDomain,
          queryTxId
        );

        this.simulator!.addPacket(attackId, dnsQuery);
        this.simulator!.addEvent(attackId, {
          type: 'packet-received',
          severity: 'low',
          message: `Intercepted DNS query for: ${targetDomain}`,
        });

        // Send spoofed response faster than legitimate server
        await delay(5); // Very fast response

        const dnsResponse = this.createDNSResponse(
          '8.8.8.8', // Spoofing DNS server
          config.source.mac,
          config.target.ip,
          config.target.mac || 'FF:FF:FF:FF:FF:FF',
          targetDomain,
          record.value,
          record.type,
          record.ttl,
          queryTxId
        );

        this.simulator!.addPacket(attackId, dnsResponse);
        state.packetCount++;

        const domainState = state.poisonedDomains.get(record.domain);
        if (domainState) {
          domainState.queryCount++;
          domainState.successCount++;
        }

        this.simulator!.addEvent(attackId, {
          type: 'success',
          severity: 'high',
          message: `Sent spoofed DNS response: ${targetDomain} -> ${record.value}`,
        });
      }
    };

    state.intervalId = setInterval(monitorLoop, 2000);
  }

  private createDNSQuery(
    sourceIP: string,
    sourceMAC: string,
    destIP: string,
    destMAC: string,
    domain: string,
    txId: number
  ): Omit<AttackPacket, 'id' | 'timestamp'> {
    return {
      direction: 'inbound',
      protocol: 'DNS',
      sourceIP,
      sourceMAC,
      sourcePort: Math.floor(Math.random() * 60000) + 1024,
      destIP,
      destMAC,
      destPort: 53,
      size: 50 + domain.length,
      flags: ['QR=0', 'QUERY'],
      payload: this.formatDNSQueryPayload(txId, domain),
      isSpoofed: false,
      isMalicious: false,
    };
  }

  private createDNSResponse(
    sourceIP: string,
    sourceMAC: string,
    destIP: string,
    destMAC: string,
    domain: string,
    answer: string,
    recordType: string,
    ttl: number,
    txId: number
  ): Omit<AttackPacket, 'id' | 'timestamp'> {
    return {
      direction: 'outbound',
      protocol: 'DNS',
      sourceIP,
      sourceMAC,
      sourcePort: 53,
      destIP,
      destMAC,
      destPort: Math.floor(Math.random() * 60000) + 1024,
      size: 100 + domain.length + answer.length,
      flags: ['QR=1', 'RESPONSE', 'AA'],
      payload: this.formatDNSResponsePayload(txId, domain, answer, recordType, ttl),
      isSpoofed: true,
      isMalicious: true,
    };
  }

  private formatDNSQueryPayload(txId: number, domain: string): string {
    return [
      `Transaction ID: 0x${txId.toString(16).padStart(4, '0')}`,
      `Flags: 0x0100 (Standard query)`,
      `Questions: 1`,
      `Answer RRs: 0`,
      `Authority RRs: 0`,
      `Additional RRs: 0`,
      `Query:`,
      `  Name: ${domain}`,
      `  Type: A (Host Address)`,
      `  Class: IN (Internet)`,
    ].join('\n');
  }

  private formatDNSResponsePayload(
    txId: number,
    domain: string,
    answer: string,
    recordType: string,
    ttl: number
  ): string {
    return [
      `Transaction ID: 0x${txId.toString(16).padStart(4, '0')}`,
      `Flags: 0x8580 (Standard response, Authoritative)`,
      `Questions: 1`,
      `Answer RRs: 1`,
      `Authority RRs: 0`,
      `Additional RRs: 0`,
      `Query:`,
      `  Name: ${domain}`,
      `  Type: ${recordType}`,
      `  Class: IN`,
      `Answer:`,
      `  Name: ${domain}`,
      `  Type: ${recordType}`,
      `  Class: IN`,
      `  TTL: ${ttl}`,
      `  Data: ${answer}`,
      `  [SPOOFED RECORD]`,
    ].join('\n');
  }

  async stop(attackId: string): Promise<void> {
    const state = this.attacks.get(attackId);
    if (!state) return;

    if (state.intervalId) {
      clearInterval(state.intervalId);
    }

    state.status = 'completed';

    if (this.simulator) {
      this.simulator.addEvent(attackId, {
        type: 'info',
        severity: 'low',
        message: `DNS poisoning stopped. Poisoned ${state.poisonedDomains.size} domains.`,
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
      // Custom results for DNS poisoning
    };
  }

  getPoisonedDomains(attackId: string): Array<{
    domain: string;
    spoofedIP: string;
    queryCount: number;
    successCount: number;
  }> {
    const state = this.attacks.get(attackId);
    return state ? Array.from(state.poisonedDomains.values()) : [];
  }
}

// ============================================================================
// Educational Content
// ============================================================================

export const DNSPoisoningEducation = {
  overview: `
    DNS Poisoning (DNS Spoofing or DNS Cache Poisoning) is an attack where corrupted 
    DNS data is introduced into the DNS resolver's cache, causing the resolver to 
    return an incorrect IP address and diverting traffic to the attacker's computer.
  `,

  howItWorks: [
    '1. Attacker identifies the target DNS resolver or client',
    '2. Attacker sends forged DNS responses with malicious mappings',
    '3. If using cache poisoning, attacker floods responses trying to beat legitimate server',
    '4. Attacker may need to guess transaction IDs (Kaminsky attack variant)',
    '5. DNS resolver/client accepts spoofed response and caches it',
    '6. Subsequent queries for the poisoned domain return attacker\'s IP',
    '7. Users are redirected to malicious servers without their knowledge',
  ],

  impact: [
    'Phishing attacks - redirect users to fake websites',
    'Credential theft - capture login information',
    'Malware distribution - redirect to malware hosting sites',
    'Email interception - redirect MX records',
    'Man-in-the-Middle - intercept all traffic to poisoned domains',
    'Denial of Service - redirect to non-existent IPs',
  ],

  prevention: [
    'Use DNSSEC (DNS Security Extensions)',
    'Enable DNS-over-HTTPS (DoH) or DNS-over-TLS (DoT)',
    'Use randomized source ports for DNS queries',
    'Implement response rate limiting',
    'Verify DNS responses match queries',
    'Use trusted DNS resolvers',
    'Monitor DNS traffic for anomalies',
    'Keep DNS software updated',
  ],

  detection: [
    'Monitor for DNS response without corresponding query',
    'Check for multiple responses to single query',
    'Verify TTL values are reasonable',
    'Compare authoritative answers with cached data',
    'Use DNS monitoring tools (dnstop, passivedns)',
    'Implement DNSSEC validation',
  ],

  tools: ['dnsspoof', 'ettercap', 'bettercap', 'DNSChef'],

  mitreAttackId: 'T1557.004',
};
