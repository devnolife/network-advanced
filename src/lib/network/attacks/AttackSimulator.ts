/**
 * Attack Simulator Core Engine
 * 
 * Central orchestrator for all network attack simulations
 * Manages attack lifecycle, events, and coordination between attack modules
 */

import { EventEmitter } from 'events';
import {
  AttackConfig,
  AttackType,
  AttackStatus,
  AttackResult,
  AttackEvent,
  AttackPacket,
  AttackStatistics,
  AttackEventMap,
  AttackEventHandler,
  NetworkTopology,
  NetworkNode,
  DetectionRule,
  DetectionAlert,
  DefenseAction,
  AttackSession,
  AttackSeverity,
} from './types';

// ============================================================================
// Utility Functions
// ============================================================================

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export function generateMAC(): string {
  const hexDigits = '0123456789ABCDEF';
  let mac = '';
  for (let i = 0; i < 6; i++) {
    if (i > 0) mac += ':';
    mac += hexDigits[Math.floor(Math.random() * 16)];
    mac += hexDigits[Math.floor(Math.random() * 16)];
  }
  return mac;
}

export function generateIP(subnet: string = '192.168.1'): string {
  return `${subnet}.${Math.floor(Math.random() * 254) + 1}`;
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// Base Attack Handler Interface
// ============================================================================

export interface AttackHandler {
  type: AttackType;
  start(config: AttackConfig, simulator: AttackSimulator): Promise<void>;
  stop(attackId: string): Promise<void>;
  pause(attackId: string): Promise<void>;
  resume(attackId: string): Promise<void>;
  getStatus(attackId: string): AttackStatus;
  getResult(attackId: string): Partial<AttackResult> | null;
}

// ============================================================================
// Attack Simulator Class
// ============================================================================

export class AttackSimulator {
  private emitter: EventEmitter;
  private handlers: Map<AttackType, AttackHandler> = new Map();
  private activeAttacks: Map<string, {
    config: AttackConfig;
    status: AttackStatus;
    startTime: number;
    events: AttackEvent[];
    packets: AttackPacket[];
    statistics: AttackStatistics;
    intervalId?: ReturnType<typeof setInterval>;
  }> = new Map();
  
  private topology: NetworkTopology | null = null;
  private detectionRules: DetectionRule[] = [];
  private alerts: DetectionAlert[] = [];
  private defenseActions: DefenseAction[] = [];
  private session: AttackSession | null = null;
  
  // Rate limiting for packet generation
  private packetRateLimit: number = 1000; // packets per second max
  private currentPacketRate: number = 0;
  private rateResetInterval?: ReturnType<typeof setInterval>;

  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(50);
    this.startRateMonitor();
  }

  // ============================================================================
  // Event Management
  // ============================================================================

  on<K extends keyof AttackEventMap>(event: K, handler: AttackEventHandler<K>): void {
    this.emitter.on(event, handler);
  }

  off<K extends keyof AttackEventMap>(event: K, handler: AttackEventHandler<K>): void {
    this.emitter.off(event, handler);
  }

  emit<K extends keyof AttackEventMap>(event: K, data: AttackEventMap[K]): void {
    this.emitter.emit(event, data);
  }

  // ============================================================================
  // Handler Registration
  // ============================================================================

  registerHandler(handler: AttackHandler): void {
    this.handlers.set(handler.type, handler);
  }

  unregisterHandler(type: AttackType): void {
    this.handlers.delete(type);
  }

  getHandler(type: AttackType): AttackHandler | undefined {
    return this.handlers.get(type);
  }

  // ============================================================================
  // Topology Management
  // ============================================================================

  setTopology(topology: NetworkTopology): void {
    this.topology = topology;
  }

  getTopology(): NetworkTopology | null {
    return this.topology;
  }

  getNode(nodeId: string): NetworkNode | undefined {
    return this.topology?.nodes.find(n => n.id === nodeId);
  }

  getNodeByIP(ip: string): NetworkNode | undefined {
    return this.topology?.nodes.find(n => n.ip === ip);
  }

  getNodeByMAC(mac: string): NetworkNode | undefined {
    return this.topology?.nodes.find(n => n.mac.toLowerCase() === mac.toLowerCase());
  }

  updateNode(nodeId: string, updates: Partial<NetworkNode>): void {
    if (!this.topology) return;
    const index = this.topology.nodes.findIndex(n => n.id === nodeId);
    if (index !== -1) {
      this.topology.nodes[index] = { ...this.topology.nodes[index], ...updates };
    }
  }

  // ============================================================================
  // Attack Lifecycle
  // ============================================================================

  async startAttack(config: AttackConfig): Promise<string> {
    const handler = this.handlers.get(config.type);
    if (!handler) {
      throw new Error(`No handler registered for attack type: ${config.type}`);
    }

    const attackId = config.id || generateId();
    const attackConfig = { ...config, id: attackId };

    // Initialize attack state
    this.activeAttacks.set(attackId, {
      config: attackConfig,
      status: 'preparing',
      startTime: Date.now(),
      events: [],
      packets: [],
      statistics: {
        packetsSent: 0,
        packetsReceived: 0,
        bytesTransferred: 0,
        successRate: 0,
        detectionEvents: 0,
        startTime: Date.now(),
        duration: 0,
        peakPacketsPerSecond: 0,
        averageLatency: 0,
      },
    });

    // Emit start event
    this.emit('attack:start', attackConfig);
    this.addEvent(attackId, {
      type: 'info',
      severity: 'medium',
      message: `Attack "${config.name}" started`,
    });

    // Update status to running
    this.updateAttackStatus(attackId, 'running');

    // Start the attack handler
    try {
      await handler.start(attackConfig, this);
    } catch (error) {
      this.addEvent(attackId, {
        type: 'failure',
        severity: 'high',
        message: `Attack failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      this.updateAttackStatus(attackId, 'completed');
    }

    return attackId;
  }

  async stopAttack(attackId: string, reason: string = 'User requested stop'): Promise<void> {
    const attack = this.activeAttacks.get(attackId);
    if (!attack) return;

    const handler = this.handlers.get(attack.config.type);
    if (handler) {
      await handler.stop(attackId);
    }

    this.updateAttackStatus(attackId, 'completed');
    this.emit('attack:stop', { attackId, reason });
    this.addEvent(attackId, {
      type: 'info',
      severity: 'low',
      message: `Attack stopped: ${reason}`,
    });
  }

  async pauseAttack(attackId: string): Promise<void> {
    const attack = this.activeAttacks.get(attackId);
    if (!attack || attack.status !== 'running') return;

    const handler = this.handlers.get(attack.config.type);
    if (handler) {
      await handler.pause(attackId);
    }

    this.updateAttackStatus(attackId, 'paused');
    this.emit('attack:pause', { attackId });
  }

  async resumeAttack(attackId: string): Promise<void> {
    const attack = this.activeAttacks.get(attackId);
    if (!attack || attack.status !== 'paused') return;

    const handler = this.handlers.get(attack.config.type);
    if (handler) {
      await handler.resume(attackId);
    }

    this.updateAttackStatus(attackId, 'running');
    this.emit('attack:resume', { attackId });
  }

  stopAllAttacks(): void {
    for (const attackId of this.activeAttacks.keys()) {
      this.stopAttack(attackId, 'Stopping all attacks');
    }
  }

  // ============================================================================
  // Attack State Management
  // ============================================================================

  updateAttackStatus(attackId: string, status: AttackStatus): void {
    const attack = this.activeAttacks.get(attackId);
    if (attack) {
      attack.status = status;
      if (status === 'completed') {
        attack.statistics.endTime = Date.now();
        attack.statistics.duration = attack.statistics.endTime - attack.statistics.startTime;
      }
    }
  }

  getAttackStatus(attackId: string): AttackStatus | null {
    return this.activeAttacks.get(attackId)?.status || null;
  }

  getActiveAttacks(): string[] {
    return Array.from(this.activeAttacks.entries())
      .filter(([, attack]) => attack.status === 'running' || attack.status === 'paused')
      .map(([id]) => id);
  }

  getAttackConfig(attackId: string): AttackConfig | null {
    return this.activeAttacks.get(attackId)?.config || null;
  }

  // ============================================================================
  // Event and Packet Management
  // ============================================================================

  addEvent(attackId: string, event: Omit<AttackEvent, 'id' | 'attackId' | 'timestamp'>): void {
    const attack = this.activeAttacks.get(attackId);
    if (!attack) return;

    const fullEvent: AttackEvent = {
      id: generateId(),
      attackId,
      timestamp: Date.now(),
      ...event,
    };

    attack.events.push(fullEvent);
    this.emit('attack:event', fullEvent);

    // Check for detection
    if (event.type === 'detection') {
      attack.statistics.detectionEvents++;
    }
  }

  addPacket(attackId: string, packet: Omit<AttackPacket, 'id' | 'timestamp'>): void {
    const attack = this.activeAttacks.get(attackId);
    if (!attack) return;

    // Rate limiting check
    if (this.currentPacketRate >= this.packetRateLimit) {
      return; // Skip packet if rate limit exceeded
    }

    const fullPacket: AttackPacket = {
      id: generateId(),
      timestamp: Date.now(),
      ...packet,
    };

    attack.packets.push(fullPacket);
    this.currentPacketRate++;

    // Update statistics
    attack.statistics.packetsSent++;
    attack.statistics.bytesTransferred += packet.size;
    
    // Track peak rate
    if (this.currentPacketRate > attack.statistics.peakPacketsPerSecond) {
      attack.statistics.peakPacketsPerSecond = this.currentPacketRate;
    }

    this.emit('attack:packet', fullPacket);

    // Run detection checks
    this.checkDetection(fullPacket, attack.config);
  }

  getAttackEvents(attackId: string): AttackEvent[] {
    return this.activeAttacks.get(attackId)?.events || [];
  }

  getAttackPackets(attackId: string): AttackPacket[] {
    return this.activeAttacks.get(attackId)?.packets || [];
  }

  getAttackStatistics(attackId: string): AttackStatistics | null {
    const attack = this.activeAttacks.get(attackId);
    if (!attack) return null;

    // Update duration for running attacks
    if (attack.status === 'running') {
      attack.statistics.duration = Date.now() - attack.statistics.startTime;
    }

    return { ...attack.statistics };
  }

  // ============================================================================
  // Attack Results
  // ============================================================================

  getAttackResult(attackId: string): AttackResult | null {
    const attack = this.activeAttacks.get(attackId);
    if (!attack) return null;

    const handler = this.handlers.get(attack.config.type);
    const handlerResult = handler?.getResult(attackId);

    return {
      attackId,
      attackType: attack.config.type,
      status: attack.status,
      startTime: attack.statistics.startTime,
      endTime: attack.statistics.endTime,
      statistics: this.getAttackStatistics(attackId)!,
      events: attack.events,
      detected: handlerResult?.detected ?? attack.statistics.detectionEvents > 0,
      blocked: handlerResult?.blocked ?? attack.status === 'blocked',
      ...handlerResult,
    };
  }

  getAllResults(): AttackResult[] {
    return Array.from(this.activeAttacks.keys())
      .map(id => this.getAttackResult(id))
      .filter((r): r is AttackResult => r !== null);
  }

  // ============================================================================
  // Detection System
  // ============================================================================

  addDetectionRule(rule: DetectionRule): void {
    this.detectionRules.push(rule);
  }

  removeDetectionRule(ruleId: string): void {
    this.detectionRules = this.detectionRules.filter(r => r.id !== ruleId);
  }

  getDetectionRules(): DetectionRule[] {
    return [...this.detectionRules];
  }

  private checkDetection(packet: AttackPacket, config: AttackConfig): void {
    for (const rule of this.detectionRules) {
      if (!rule.enabled) continue;
      if (!rule.attackTypes.includes(config.type)) continue;

      let detected = false;
      let description = '';

      switch (rule.method) {
        case 'arp-inspection':
          if (packet.protocol === 'ARP' && packet.isSpoofed) {
            detected = true;
            description = `ARP spoofing detected: ${packet.sourceIP} claiming MAC ${packet.sourceMAC}`;
          }
          break;

        case 'rate-limiting':
          const attack = this.activeAttacks.get(config.id);
          if (attack && this.currentPacketRate > (rule.threshold || 100)) {
            detected = true;
            description = `Rate limit exceeded: ${this.currentPacketRate} packets/sec`;
          }
          break;

        case 'anomaly-detection':
          if (packet.isMalicious) {
            detected = true;
            description = `Anomalous packet detected from ${packet.sourceIP}`;
          }
          break;

        case 'signature-based':
          // Check for known attack signatures
          if (this.matchesSignature(packet, config.type)) {
            detected = true;
            description = `Attack signature matched: ${config.type}`;
          }
          break;

        case 'port-security':
          // Check for MAC flooding or unauthorized MACs
          if (config.type === 'mac-flooding') {
            detected = true;
            description = `Port security violation: multiple MACs from same port`;
          }
          break;

        case 'dhcp-snooping':
          if (config.type === 'dhcp-starvation') {
            detected = true;
            description = `DHCP snooping alert: suspicious DHCP traffic`;
          }
          break;
      }

      if (detected) {
        this.triggerAlert(rule, config, packet, description);
      }
    }
  }

  private matchesSignature(packet: AttackPacket, attackType: AttackType): boolean {
    // Simplified signature matching
    const signatures: Record<AttackType, (p: AttackPacket) => boolean> = {
      'arp-spoofing': (p) => p.protocol === 'ARP' && p.isSpoofed === true,
      'dns-poisoning': (p) => p.protocol === 'DNS' && p.isSpoofed === true,
      'syn-flood': (p) => p.protocol === 'TCP' && (p.flags?.includes('SYN') ?? false) && !(p.flags?.includes('ACK') ?? true),
      'port-scan': (p) => (p.flags?.includes('SYN') ?? false) || (p.flags?.includes('FIN') ?? false),
      'udp-flood': (p) => p.protocol === 'UDP' && p.size > 0,
      'icmp-flood': (p) => p.protocol === 'ICMP',
      'mitm': (p) => p.isSpoofed === true,
      'dhcp-starvation': (p) => p.protocol === 'DHCP',
      'mac-flooding': (_p) => true,
      'vlan-hopping': (_p) => true,
      'smurf-attack': (p) => p.protocol === 'ICMP' && p.destIP.endsWith('.255'),
      'ping-of-death': (p) => p.protocol === 'ICMP' && p.size > 65535,
    };

    return signatures[attackType]?.(packet) || false;
  }

  private triggerAlert(
    rule: DetectionRule,
    config: AttackConfig,
    packet: AttackPacket,
    description: string
  ): void {
    const alert: DetectionAlert = {
      id: generateId(),
      timestamp: Date.now(),
      rule,
      attackType: config.type,
      severity: this.calculateSeverity(config.type),
      sourceIP: packet.sourceIP,
      sourceMAC: packet.sourceMAC,
      targetIP: packet.destIP,
      description,
      evidence: {
        packets: [packet],
        anomalies: [description],
      },
      blocked: rule.action === 'block' || rule.action === 'alert-and-block',
      acknowledged: false,
    };

    this.alerts.push(alert);
    this.emit('attack:detected', alert);

    // Add event to attack
    this.addEvent(config.id, {
      type: 'detection',
      severity: alert.severity,
      message: `Detection alert: ${description}`,
      data: { ruleId: rule.id, alertId: alert.id },
    });

    // Execute defense action if blocking
    if (alert.blocked) {
      this.executeDefenseAction(config.id, alert);
    }
  }

  private calculateSeverity(attackType: AttackType): AttackSeverity {
    const severityMap: Record<AttackType, AttackSeverity> = {
      'arp-spoofing': 'high',
      'dns-poisoning': 'high',
      'mitm': 'critical',
      'syn-flood': 'high',
      'udp-flood': 'high',
      'icmp-flood': 'medium',
      'port-scan': 'low',
      'dhcp-starvation': 'high',
      'mac-flooding': 'medium',
      'vlan-hopping': 'high',
      'smurf-attack': 'high',
      'ping-of-death': 'medium',
    };
    return severityMap[attackType] || 'medium';
  }

  private executeDefenseAction(attackId: string, alert: DetectionAlert): void {
    const action: DefenseAction = {
      id: generateId(),
      timestamp: Date.now(),
      type: 'block-ip',
      target: alert.sourceIP,
      reason: alert.description,
      automatic: true,
      duration: 300000, // 5 minutes
      effectiveUntil: Date.now() + 300000,
    };

    this.defenseActions.push(action);
    this.emit('attack:blocked', action);

    // Update attack status
    this.updateAttackStatus(attackId, 'blocked');
    this.addEvent(attackId, {
      type: 'failure',
      severity: 'high',
      message: `Attack blocked by defense system`,
      data: { actionId: action.id },
    });
  }

  getAlerts(): DetectionAlert[] {
    return [...this.alerts];
  }

  getDefenseActions(): DefenseAction[] {
    return [...this.defenseActions];
  }

  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  // ============================================================================
  // Session Management
  // ============================================================================

  startSession(labId?: string, userId?: string): string {
    const sessionId = generateId();
    this.session = {
      id: sessionId,
      labId,
      userId,
      startTime: Date.now(),
      topology: this.topology || { nodes: [], links: [] },
      attacks: [],
      detectionAlerts: [],
      defenseActions: [],
    };
    return sessionId;
  }

  endSession(): AttackSession | null {
    if (!this.session) return null;

    this.stopAllAttacks();

    this.session.endTime = Date.now();
    this.session.attacks = this.getAllResults();
    this.session.detectionAlerts = this.alerts;
    this.session.defenseActions = this.defenseActions;

    const completedSession = { ...this.session };
    
    // Reset state
    this.session = null;
    this.activeAttacks.clear();
    this.alerts = [];
    this.defenseActions = [];

    return completedSession;
  }

  getSession(): AttackSession | null {
    return this.session;
  }

  // ============================================================================
  // Rate Monitoring
  // ============================================================================

  private startRateMonitor(): void {
    this.rateResetInterval = setInterval(() => {
      this.currentPacketRate = 0;
    }, 1000);
  }

  setPacketRateLimit(limit: number): void {
    this.packetRateLimit = limit;
  }

  getCurrentPacketRate(): number {
    return this.currentPacketRate;
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  destroy(): void {
    this.stopAllAttacks();
    if (this.rateResetInterval) {
      clearInterval(this.rateResetInterval);
    }
    this.emitter.removeAllListeners();
    this.handlers.clear();
    this.activeAttacks.clear();
    this.detectionRules = [];
    this.alerts = [];
    this.defenseActions = [];
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let simulatorInstance: AttackSimulator | null = null;

export function getAttackSimulator(): AttackSimulator {
  if (!simulatorInstance) {
    simulatorInstance = new AttackSimulator();
  }
  return simulatorInstance;
}

export function resetAttackSimulator(): void {
  if (simulatorInstance) {
    simulatorInstance.destroy();
    simulatorInstance = null;
  }
}
