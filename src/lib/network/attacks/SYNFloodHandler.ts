/**
 * SYN Flood Attack Handler
 * 
 * Simulates TCP SYN flood denial-of-service attacks for educational purposes.
 * Demonstrates how attackers can exhaust server resources by sending
 * a flood of TCP SYN packets without completing the handshake.
 */

import {
  AttackHandler,
  AttackSimulator,
  generateId,
  generateIP,
  generateMAC,
  delay,
} from './AttackSimulator';
import {
  SYNFloodConfig,
  AttackConfig,
  AttackStatus,
  AttackResult,
  AttackPacket,
} from './types';

interface SYNFloodState {
  config: SYNFloodConfig;
  status: AttackStatus;
  intervalId?: ReturnType<typeof setInterval>;
  packetsSent: number;
  bytesTransferred: number;
  startTime: number;
  currentPPS: number; // Packets per second
  peakPPS: number;
  targetStats: {
    estimatedHalfOpenConnections: number;
    estimatedResourceUsage: number; // percentage
    responseLatency: number; // ms
  };
}

export class SYNFloodHandler implements AttackHandler {
  type: 'syn-flood' = 'syn-flood';
  private attacks: Map<string, SYNFloodState> = new Map();
  private simulator: AttackSimulator | null = null;

  async start(config: AttackConfig, simulator: AttackSimulator): Promise<void> {
    if (config.type !== 'syn-flood') {
      throw new Error('Invalid config type for SYN Flood handler');
    }

    const synConfig = config as SYNFloodConfig;
    this.simulator = simulator;

    const state: SYNFloodState = {
      config: synConfig,
      status: 'running',
      packetsSent: 0,
      bytesTransferred: 0,
      startTime: Date.now(),
      currentPPS: 0,
      peakPPS: 0,
      targetStats: {
        estimatedHalfOpenConnections: 0,
        estimatedResourceUsage: 0,
        responseLatency: 5, // Start with normal latency
      },
    };

    this.attacks.set(synConfig.id, state);

    simulator.addEvent(synConfig.id, {
      type: 'info',
      severity: 'high',
      message: `Starting SYN Flood attack on ${synConfig.target.ip} at ${synConfig.packetsPerSecond} pps`,
    });

    // Start the flood
    await this.startFlood(synConfig.id);

    // Handle duration
    if (synConfig.duration) {
      setTimeout(() => {
        if (this.attacks.get(synConfig.id)?.status === 'running') {
          this.stop(synConfig.id);
        }
      }, synConfig.duration);
    }
  }

  private async startFlood(attackId: string): Promise<void> {
    const state = this.attacks.get(attackId);
    if (!state || !this.simulator) return;

    const { config } = state;
    const intervalMs = 1000 / config.packetsPerSecond;
    let packetsThisSecond = 0;
    let lastSecond = Date.now();

    const sendPacket = () => {
      if (state.status !== 'running') return;

      // Send SYN packet
      const synPacket = this.createSYNPacket(config, state);
      this.simulator!.addPacket(attackId, synPacket);
      
      state.packetsSent++;
      state.bytesTransferred += synPacket.size;
      packetsThisSecond++;

      // Update target stats simulation
      this.updateTargetStats(state);

      // Calculate current PPS every second
      const now = Date.now();
      if (now - lastSecond >= 1000) {
        state.currentPPS = packetsThisSecond;
        if (state.currentPPS > state.peakPPS) {
          state.peakPPS = state.currentPPS;
        }
        packetsThisSecond = 0;
        lastSecond = now;

        // Log progress periodically
        this.logFloodProgress(attackId);
      }
    };

    // High-frequency flood using setInterval
    // Batch packets for performance
    const batchSize = Math.min(config.packetsPerSecond / 10, 100);
    
    state.intervalId = setInterval(() => {
      for (let i = 0; i < batchSize && state.status === 'running'; i++) {
        sendPacket();
      }
    }, 100); // 10 batches per second
  }

  private createSYNPacket(
    config: SYNFloodConfig,
    state: SYNFloodState
  ): Omit<AttackPacket, 'id' | 'timestamp'> {
    // Determine source IP/port
    const sourceIP = config.randomSourceIP 
      ? generateIP('192.168.' + Math.floor(Math.random() * 255))
      : config.source.ip;
    
    const sourcePort = config.randomSourcePort
      ? Math.floor(Math.random() * 60000) + 1024
      : 12345;

    const sourceMAC = config.randomSourceIP 
      ? generateMAC()
      : config.source.mac;

    // Select target port
    const targetPort = config.targetPorts[
      Math.floor(Math.random() * config.targetPorts.length)
    ];

    // Build flags
    const flags: string[] = [];
    if (config.tcpFlags.syn) flags.push('SYN');
    if (config.tcpFlags.ack) flags.push('ACK');
    if (config.tcpFlags.fin) flags.push('FIN');
    if (config.tcpFlags.rst) flags.push('RST');
    if (config.tcpFlags.psh) flags.push('PSH');
    if (config.tcpFlags.urg) flags.push('URG');

    return {
      direction: 'outbound',
      protocol: 'TCP',
      sourceIP,
      sourceMAC,
      sourcePort,
      destIP: config.target.ip,
      destMAC: config.target.mac || 'FF:FF:FF:FF:FF:FF',
      destPort: targetPort,
      size: 40 + Math.floor(Math.random() * 20), // TCP header + some variation
      flags,
      payload: this.formatSYNPayload(sourceIP, sourcePort, targetPort, flags),
      isSpoofed: config.randomSourceIP,
      isMalicious: true,
    };
  }

  private formatSYNPayload(
    sourceIP: string,
    sourcePort: number,
    destPort: number,
    flags: string[]
  ): string {
    const seqNum = Math.floor(Math.random() * 0xFFFFFFFF);
    return [
      `TCP SYN Packet`,
      `Seq: ${seqNum}`,
      `Ack: 0`,
      `Flags: ${flags.join(', ')}`,
      `Window: ${Math.floor(Math.random() * 65535)}`,
      `${sourceIP}:${sourcePort} -> ${destPort}`,
      `[FLOOD PACKET]`,
    ].join('\n');
  }

  private updateTargetStats(state: SYNFloodState): void {
    // Simulate target resource exhaustion
    // Half-open connections accumulate (with some decay)
    state.targetStats.estimatedHalfOpenConnections = Math.min(
      65535, // TCP backlog limit
      state.targetStats.estimatedHalfOpenConnections + 0.8 - Math.random() * 0.1
    );

    // Resource usage increases with half-open connections
    state.targetStats.estimatedResourceUsage = Math.min(
      100,
      (state.targetStats.estimatedHalfOpenConnections / 65535) * 100 * 1.5
    );

    // Response latency increases exponentially with resource usage
    state.targetStats.responseLatency = 5 * Math.pow(
      1.5,
      state.targetStats.estimatedResourceUsage / 10
    );
  }

  private logFloodProgress(attackId: string): void {
    const state = this.attacks.get(attackId);
    if (!state || !this.simulator) return;

    const duration = (Date.now() - state.startTime) / 1000;
    const avgPPS = state.packetsSent / duration;

    // Log every 5 seconds
    if (Math.floor(duration) % 5 === 0 && duration > 0) {
      this.simulator.addEvent(attackId, {
        type: 'info',
        severity: 'medium',
        message: [
          `Flood Statistics:`,
          `  Packets Sent: ${state.packetsSent.toLocaleString()}`,
          `  Current PPS: ${state.currentPPS}`,
          `  Average PPS: ${avgPPS.toFixed(0)}`,
          `  Target Half-Open: ~${Math.floor(state.targetStats.estimatedHalfOpenConnections)}`,
          `  Target Load: ${state.targetStats.estimatedResourceUsage.toFixed(1)}%`,
          `  Response Latency: ${state.targetStats.responseLatency.toFixed(0)}ms`,
        ].join('\n'),
      });

      // Trigger warning if target seems overwhelmed
      if (state.targetStats.estimatedResourceUsage > 80) {
        this.simulator.addEvent(attackId, {
          type: 'success',
          severity: 'high',
          message: `Target ${state.config.target.ip} appears to be overwhelmed (${state.targetStats.estimatedResourceUsage.toFixed(1)}% resource usage)`,
        });
      }
    }
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
          'SYN FLOOD ATTACK SUMMARY',
          '═══════════════════════════════════════',
          `Target: ${state.config.target.ip}:${state.config.targetPorts.join(',')}`,
          `Duration: ${duration.toFixed(2)}s`,
          `Total Packets: ${state.packetsSent.toLocaleString()}`,
          `Total Bytes: ${(state.bytesTransferred / 1024).toFixed(2)} KB`,
          `Peak PPS: ${state.peakPPS}`,
          `Average PPS: ${(state.packetsSent / duration).toFixed(0)}`,
          '',
          'Estimated Target Impact:',
          `  Max Half-Open Connections: ${Math.floor(state.targetStats.estimatedHalfOpenConnections)}`,
          `  Peak Resource Usage: ${state.targetStats.estimatedResourceUsage.toFixed(1)}%`,
          `  Max Response Latency: ${state.targetStats.responseLatency.toFixed(0)}ms`,
        ].join('\n'),
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

    return {};
  }

  getFloodStats(attackId: string): {
    packetsSent: number;
    bytesTransferred: number;
    currentPPS: number;
    peakPPS: number;
    targetStats: SYNFloodState['targetStats'];
  } | null {
    const state = this.attacks.get(attackId);
    if (!state) return null;

    return {
      packetsSent: state.packetsSent,
      bytesTransferred: state.bytesTransferred,
      currentPPS: state.currentPPS,
      peakPPS: state.peakPPS,
      targetStats: { ...state.targetStats },
    };
  }
}

// ============================================================================
// Educational Content
// ============================================================================

export const SYNFloodEducation = {
  overview: `
    A SYN Flood is a type of Denial-of-Service (DoS) attack that exploits the 
    TCP three-way handshake. The attacker sends a rapid succession of SYN 
    requests to a target, overwhelming its ability to respond and causing 
    legitimate traffic to be denied.
  `,

  howItWorks: [
    '1. Attacker sends massive number of TCP SYN packets',
    '2. Target responds with SYN-ACK to each request',
    '3. Attacker never sends final ACK to complete handshake',
    '4. Target keeps half-open connections in memory',
    '5. Connection table fills up (SYN queue exhaustion)',
    '6. Legitimate connections cannot be established',
    '7. Server resources (CPU, memory) become exhausted',
  ],

  impact: [
    'Service unavailability for legitimate users',
    'Server resource exhaustion (memory, CPU)',
    'Network bandwidth consumption',
    'Potential cascading failures',
    'Financial losses due to downtime',
    'Reputation damage',
  ],

  variants: [
    'Basic SYN Flood - High volume from single source',
    'Spoofed SYN Flood - Random source IPs to evade blocking',
    'Distributed SYN Flood (DDoS) - Multiple attack sources',
    'SYN-ACK Flood - Reflecting off third parties',
    'PSH+ACK Flood - Targeting application layer',
  ],

  prevention: [
    'Enable SYN Cookies on servers',
    'Increase TCP backlog queue size',
    'Reduce SYN-RECEIVED timer',
    'Use rate limiting and traffic shaping',
    'Deploy hardware firewalls/IPS',
    'Use CDN with DDoS protection',
    'Implement BGP Flowspec for upstream filtering',
    'Enable TCP Fast Open (TFO)',
  ],

  detection: [
    'Monitor for high volume of SYN packets',
    'Track ratio of SYN to SYN-ACK to ACK',
    'Check for half-open connection accumulation',
    'Monitor server CPU and memory usage',
    'Look for traffic from spoofed/bogon IPs',
    'Analyze netflow data for anomalies',
  ],

  tools: ['hping3', 'scapy', 'LOIC', 'Xerxes', 'Saddam'],

  mitreAttackId: 'T1498.001',
};
