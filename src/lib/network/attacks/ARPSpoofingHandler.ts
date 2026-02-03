/**
 * ARP Spoofing Attack Handler
 * 
 * Simulates ARP cache poisoning attacks for educational purposes.
 * Demonstrates how attackers can redirect network traffic by sending
 * forged ARP replies to associate their MAC with a target IP.
 */

import {
  AttackHandler,
  AttackSimulator,
  generateId,
  delay,
} from './AttackSimulator';
import {
  ARPSpoofingConfig,
  AttackConfig,
  AttackStatus,
  AttackResult,
  PoisonedHost,
  AttackPacket,
} from './types';

interface ARPSpoofingState {
  config: ARPSpoofingConfig;
  status: AttackStatus;
  intervalId?: ReturnType<typeof setInterval>;
  poisonedHosts: Map<string, PoisonedHost>;
  packetCount: number;
  startTime: number;
}

export class ARPSpoofingHandler implements AttackHandler {
  type: 'arp-spoofing' = 'arp-spoofing';
  private attacks: Map<string, ARPSpoofingState> = new Map();
  private simulator: AttackSimulator | null = null;

  async start(config: AttackConfig, simulator: AttackSimulator): Promise<void> {
    if (config.type !== 'arp-spoofing') {
      throw new Error('Invalid config type for ARP Spoofing handler');
    }

    const arpConfig = config as ARPSpoofingConfig;
    this.simulator = simulator;

    const state: ARPSpoofingState = {
      config: arpConfig,
      status: 'running',
      poisonedHosts: new Map(),
      packetCount: 0,
      startTime: Date.now(),
    };

    this.attacks.set(arpConfig.id, state);

    // Log attack start
    simulator.addEvent(arpConfig.id, {
      type: 'info',
      severity: 'medium',
      message: `Starting ARP spoofing attack - Target: ${arpConfig.target.ip}, Gateway: ${arpConfig.gateway.ip}`,
    });

    // Send initial ARP packets
    await this.sendARPPoison(arpConfig.id);

    // Set up interval for continuous ARP poisoning
    const interval = arpConfig.arpInterval || 1000;
    state.intervalId = setInterval(() => {
      if (state.status === 'running') {
        this.sendARPPoison(arpConfig.id);
      }
    }, interval);

    // Handle duration-based stop
    if (arpConfig.duration) {
      setTimeout(() => {
        if (this.attacks.get(arpConfig.id)?.status === 'running') {
          this.stop(arpConfig.id);
          simulator.addEvent(arpConfig.id, {
            type: 'info',
            severity: 'low',
            message: 'Attack duration completed',
          });
        }
      }, arpConfig.duration);
    }
  }

  private async sendARPPoison(attackId: string): Promise<void> {
    const state = this.attacks.get(attackId);
    if (!state || state.status !== 'running' || !this.simulator) return;

    const { config } = state;

    // Send spoofed ARP reply to target (claiming to be gateway)
    const arpToTarget = this.createARPPacket(
      config.source.ip,
      config.source.mac,
      config.target.ip,
      config.target.mac || 'FF:FF:FF:FF:FF:FF',
      config.gateway.ip, // Spoofing gateway IP
      config.source.mac, // With attacker's MAC
      'reply'
    );

    this.simulator.addPacket(attackId, arpToTarget);
    state.packetCount++;

    // Log poisoning attempt
    this.simulator.addEvent(attackId, {
      type: 'packet-sent',
      severity: 'medium',
      message: `ARP Reply sent to ${config.target.ip}: ${config.gateway.ip} is at ${config.source.mac}`,
      packet: { ...arpToTarget, id: generateId(), timestamp: Date.now() },
    });

    // If two-way mode, also poison the gateway
    if (config.mode === 'two-way') {
      const arpToGateway = this.createARPPacket(
        config.source.ip,
        config.source.mac,
        config.gateway.ip,
        config.gateway.mac,
        config.target.ip, // Spoofing target IP
        config.source.mac, // With attacker's MAC
        'reply'
      );

      this.simulator.addPacket(attackId, arpToGateway);
      state.packetCount++;

      this.simulator.addEvent(attackId, {
        type: 'packet-sent',
        severity: 'medium',
        message: `ARP Reply sent to ${config.gateway.ip}: ${config.target.ip} is at ${config.source.mac}`,
        packet: { ...arpToGateway, id: generateId(), timestamp: Date.now() },
      });
    }

    // Send gratuitous ARP if enabled
    if (config.gratuitousArp) {
      const gratuitousArp = this.createARPPacket(
        config.gateway.ip,
        config.source.mac,
        'FF:FF:FF:FF:FF:FF',
        'FF:FF:FF:FF:FF:FF',
        config.gateway.ip,
        config.source.mac,
        'reply'
      );

      this.simulator.addPacket(attackId, gratuitousArp);
      state.packetCount++;
    }

    // Update poisoned hosts tracking
    this.updatePoisonedHost(state, config.target.ip, config.target.mac || 'unknown');

    // Emit poison success
    const poisonedHost = state.poisonedHosts.get(config.target.ip);
    if (poisonedHost) {
      this.simulator.emit('poison:success', poisonedHost);
    }

    // Simulate target response (cache update) with some probability
    if (Math.random() > 0.3) {
      this.simulator.addEvent(attackId, {
        type: 'success',
        severity: 'high',
        message: `Target ${config.target.ip} ARP cache likely poisoned`,
      });
    }

    // Add small delay for realism
    await delay(50);
  }

  private createARPPacket(
    senderIP: string,
    senderMAC: string,
    targetIP: string,
    targetMAC: string,
    spoofedIP: string,
    spoofedMAC: string,
    opcode: 'request' | 'reply'
  ): Omit<AttackPacket, 'id' | 'timestamp'> {
    return {
      direction: 'outbound',
      protocol: 'ARP',
      sourceIP: spoofedIP,
      sourceMAC: spoofedMAC,
      destIP: targetIP,
      destMAC: targetMAC,
      size: 42, // Ethernet (14) + ARP (28)
      flags: [opcode === 'request' ? 'ARP-REQUEST' : 'ARP-REPLY'],
      payload: this.formatARPPayload(opcode, spoofedMAC, spoofedIP, targetMAC, targetIP),
      isSpoofed: true,
      isMalicious: true,
    };
  }

  private formatARPPayload(
    opcode: 'request' | 'reply',
    senderMAC: string,
    senderIP: string,
    targetMAC: string,
    targetIP: string
  ): string {
    return [
      `Hardware Type: Ethernet (1)`,
      `Protocol Type: IPv4 (0x0800)`,
      `Hardware Size: 6`,
      `Protocol Size: 4`,
      `Opcode: ${opcode === 'request' ? 'Request (1)' : 'Reply (2)'}`,
      `Sender MAC: ${senderMAC}`,
      `Sender IP: ${senderIP}`,
      `Target MAC: ${targetMAC}`,
      `Target IP: ${targetIP}`,
    ].join('\n');
  }

  private updatePoisonedHost(state: ARPSpoofingState, ip: string, mac: string): void {
    const existing = state.poisonedHosts.get(ip);
    
    if (existing) {
      existing.lastPoisonPacket = Date.now();
      existing.isActive = true;
    } else {
      state.poisonedHosts.set(ip, {
        ip,
        mac,
        originalGatewayMAC: state.config.gateway.mac,
        poisonedAt: Date.now(),
        lastPoisonPacket: Date.now(),
        isActive: true,
      });
    }
  }

  async stop(attackId: string): Promise<void> {
    const state = this.attacks.get(attackId);
    if (!state) return;

    // Clear interval
    if (state.intervalId) {
      clearInterval(state.intervalId);
    }

    state.status = 'completed';

    // Send corrective ARP packets to restore original mappings
    if (this.simulator) {
      this.simulator.addEvent(attackId, {
        type: 'info',
        severity: 'low',
        message: 'Sending corrective ARP packets to restore network...',
      });

      // Send correct ARP replies
      const correctiveArp = this.createARPPacket(
        state.config.gateway.ip,
        state.config.gateway.mac,
        state.config.target.ip,
        state.config.target.mac || 'FF:FF:FF:FF:FF:FF',
        state.config.gateway.ip,
        state.config.gateway.mac,
        'reply'
      );

      this.simulator.addPacket(attackId, correctiveArp);
    }

    // Mark all poisoned hosts as inactive
    for (const host of state.poisonedHosts.values()) {
      host.isActive = false;
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
      poisonedHosts: Array.from(state.poisonedHosts.values()),
    };
  }

  getPoisonedHosts(attackId: string): PoisonedHost[] {
    const state = this.attacks.get(attackId);
    return state ? Array.from(state.poisonedHosts.values()) : [];
  }
}

// ============================================================================
// Educational Content
// ============================================================================

export const ARPSpoofingEducation = {
  overview: `
    ARP Spoofing (also known as ARP Cache Poisoning) is a technique where an attacker 
    sends falsified ARP messages over a local network. This results in linking the 
    attacker's MAC address with the IP address of a legitimate computer or server.
  `,
  
  howItWorks: [
    '1. Attacker identifies target machines on the network (victim and gateway)',
    '2. Attacker sends forged ARP replies to the victim, claiming to be the gateway',
    '3. Attacker sends forged ARP replies to the gateway, claiming to be the victim',
    '4. Both devices update their ARP cache with the attacker\'s MAC address',
    '5. Traffic between victim and gateway now flows through the attacker',
    '6. Attacker can intercept, modify, or drop packets',
  ],
  
  impact: [
    'Man-in-the-Middle attacks - intercept sensitive data',
    'Session hijacking - take over authenticated sessions',
    'Denial of Service - drop packets to disrupt communication',
    'Data modification - alter packets in transit',
    'Credential theft - capture usernames and passwords',
  ],
  
  prevention: [
    'Use static ARP entries for critical systems',
    'Enable Dynamic ARP Inspection (DAI) on switches',
    'Use encrypted protocols (HTTPS, SSH, VPN)',
    'Implement 802.1X port-based authentication',
    'Use ARP spoofing detection tools (arpwatch, XArp)',
    'Enable DHCP snooping',
    'Segment network with VLANs',
  ],
  
  detection: [
    'Monitor ARP traffic for anomalies',
    'Check for duplicate IP addresses with different MACs',
    'Use IDS/IPS with ARP spoofing signatures',
    'Regularly verify ARP cache entries',
    'Monitor for excessive ARP traffic',
  ],
  
  tools: ['arpspoof', 'ettercap', 'bettercap', 'Cain & Abel'],
  
  mitreAttackId: 'T1557.002',
};
