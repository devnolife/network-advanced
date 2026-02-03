/**
 * Firewall Engine - Stateful Packet Inspection Firewall
 * 
 * Core firewall engine with stateful inspection, connection tracking,
 * NAT translation, zone-based security, and deep packet inspection.
 * 
 * Network Security Virtual Lab - Educational Platform
 */

import { EventEmitter } from 'events';
import {
  FirewallConfig,
  FirewallMode,
  FirewallAction,
  FirewallPolicy,
  FirewallRule,
  FirewallPacket,
  FirewallEvent,
  FirewallStatistics,
  SecurityZone,
  ZonePair,
  ConnectionEntry,
  ConnectionState,
  NATRule,
  NATType,
  NATTranslation,
  ACLProtocol,
} from './types';
import { ACLEngine, ACLEvaluationResult, getACLEngine } from './ACLEngine';

// ============================================================================
// Types
// ============================================================================

type FirewallEventCallback = (data: unknown) => void;

export interface PacketDecision {
  action: FirewallAction;
  matched: boolean;
  rule?: FirewallRule;
  policy?: FirewallPolicy;
  connection?: ConnectionEntry;
  natTranslation?: NATTranslation;
  reason: string;
  processingTime: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: FirewallConfig = {
  mode: 'stateful',
  defaultAction: 'deny',
  
  // Stateful inspection
  enableStatefulInspection: true,
  connectionTimeout: 3600000,      // 1 hour
  tcpTimeout: 86400000,            // 24 hours
  udpTimeout: 120000,              // 2 minutes
  icmpTimeout: 30000,              // 30 seconds
  
  // Limits
  maxConnections: 100000,
  maxRulesPerPolicy: 500,
  
  // Logging
  logAllowed: false,
  logDenied: true,
  logLevel: 'info',
  
  // NAT
  enableNAT: true,
  natPoolSize: 65535,
  patPortRangeStart: 1024,
  patPortRangeEnd: 65535,
  
  // Advanced
  enableDPI: true,
  enableApplicationControl: true,
  enableURLFiltering: false,
  
  // Anti-spoofing
  enableAntiSpoofing: true,
  bogonBlocking: true,
};

// Bogon IP ranges (private, reserved, not routable)
const BOGON_RANGES = [
  { start: '0.0.0.0', end: '0.255.255.255' },        // "This" network
  { start: '10.0.0.0', end: '10.255.255.255' },      // Private
  { start: '100.64.0.0', end: '100.127.255.255' },   // Carrier-grade NAT
  { start: '127.0.0.0', end: '127.255.255.255' },    // Loopback
  { start: '169.254.0.0', end: '169.254.255.255' },  // Link local
  { start: '172.16.0.0', end: '172.31.255.255' },    // Private
  { start: '192.0.0.0', end: '192.0.0.255' },        // IETF Protocol
  { start: '192.0.2.0', end: '192.0.2.255' },        // TEST-NET-1
  { start: '192.168.0.0', end: '192.168.255.255' },  // Private
  { start: '198.18.0.0', end: '198.19.255.255' },    // Benchmark testing
  { start: '198.51.100.0', end: '198.51.100.255' },  // TEST-NET-2
  { start: '203.0.113.0', end: '203.0.113.255' },    // TEST-NET-3
  { start: '224.0.0.0', end: '239.255.255.255' },    // Multicast
  { start: '240.0.0.0', end: '255.255.255.255' },    // Reserved
];

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(): string {
  return `fw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function ipToNumber(ip: string): number {
  const parts = ip.split('.').map(Number);
  return (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
}

function numberToIp(num: number): string {
  return [
    (num >>> 24) & 255,
    (num >>> 16) & 255,
    (num >>> 8) & 255,
    num & 255,
  ].join('.');
}

function isIPInRange(ip: string, startIP: string, endIP: string): boolean {
  const ipNum = ipToNumber(ip);
  const startNum = ipToNumber(startIP);
  const endNum = ipToNumber(endIP);
  return ipNum >= startNum && ipNum <= endNum;
}

function isBogonIP(ip: string): boolean {
  for (const range of BOGON_RANGES) {
    if (isIPInRange(ip, range.start, range.end)) {
      return true;
    }
  }
  return false;
}

function getConnectionKey(
  protocol: ACLProtocol,
  srcIP: string,
  srcPort: number | undefined,
  dstIP: string,
  dstPort: number | undefined
): string {
  return `${protocol}:${srcIP}:${srcPort || 0}:${dstIP}:${dstPort || 0}`;
}

function getReverseConnectionKey(
  protocol: ACLProtocol,
  srcIP: string,
  srcPort: number | undefined,
  dstIP: string,
  dstPort: number | undefined
): string {
  return `${protocol}:${dstIP}:${dstPort || 0}:${srcIP}:${srcPort || 0}`;
}

// ============================================================================
// Firewall Engine Class
// ============================================================================

export class FirewallEngine {
  private config: FirewallConfig;
  private emitter: EventEmitter;
  
  // Security components
  private zones: Map<string, SecurityZone>;
  private zonePairs: Map<string, ZonePair>;
  private policies: Map<string, FirewallPolicy>;
  
  // Connection tracking
  private connections: Map<string, ConnectionEntry>;
  
  // NAT
  private natRules: Map<string, NATRule>;
  private natTranslations: Map<string, NATTranslation>;
  private patPortPool: Set<number>;
  private nextPatPort: number;
  
  // Statistics
  private statistics: FirewallStatistics;
  private events: FirewallEvent[];
  private maxEvents: number;
  
  // ACL Engine integration
  private aclEngine: ACLEngine;
  
  private isRunning: boolean;
  private cleanupInterval: ReturnType<typeof setInterval> | null;

  constructor(config: Partial<FirewallConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.emitter = new EventEmitter();
    
    this.zones = new Map();
    this.zonePairs = new Map();
    this.policies = new Map();
    this.connections = new Map();
    this.natRules = new Map();
    this.natTranslations = new Map();
    this.patPortPool = new Set();
    this.nextPatPort = this.config.patPortRangeStart;
    
    this.events = [];
    this.maxEvents = 10000;
    
    this.aclEngine = getACLEngine();
    
    this.isRunning = false;
    this.cleanupInterval = null;
    
    this.statistics = this.initializeStatistics();
    
    // Setup default zones
    this.setupDefaultZones();
  }

  // ============================================================================
  // Lifecycle Methods
  // ============================================================================

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.statistics.startTime = Date.now();
    this.aclEngine.start();
    
    // Start connection cleanup interval
    this.startConnectionCleanup();
    
    this.emit('engine:start', { config: this.config });
  }

  stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    this.emit('engine:stop', { statistics: this.statistics });
  }

  destroy(): void {
    this.stop();
    this.zones.clear();
    this.zonePairs.clear();
    this.policies.clear();
    this.connections.clear();
    this.natRules.clear();
    this.natTranslations.clear();
    this.events = [];
    this.emitter.removeAllListeners();
  }

  private startConnectionCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredConnections();
      this.cleanupExpiredNATTranslations();
    }, 10000); // Every 10 seconds
  }

  private cleanupExpiredConnections(): void {
    const now = Date.now();
    
    for (const [key, conn] of this.connections) {
      const timeout = this.getConnectionTimeout(conn.protocol);
      
      if (now - conn.lastSeen > timeout) {
        this.connections.delete(key);
        this.emit('connection:expired', conn);
      }
    }
  }

  private cleanupExpiredNATTranslations(): void {
    const now = Date.now();
    
    for (const [key, trans] of this.natTranslations) {
      if (trans.state === 'expired' || now - trans.lastUsed > trans.timeout) {
        // Return PAT port to pool
        if (this.patPortPool.has(trans.insideGlobalPort)) {
          this.patPortPool.delete(trans.insideGlobalPort);
        }
        this.natTranslations.delete(key);
        this.emit('nat:expired', trans);
      }
    }
  }

  private getConnectionTimeout(protocol: ACLProtocol): number {
    switch (protocol) {
      case 'tcp': return this.config.tcpTimeout;
      case 'udp': return this.config.udpTimeout;
      case 'icmp': return this.config.icmpTimeout;
      default: return this.config.connectionTimeout;
    }
  }

  private initializeStatistics(): FirewallStatistics {
    return {
      packetsProcessed: 0,
      packetsAllowed: 0,
      packetsDenied: 0,
      packetsDropped: 0,
      bytesProcessed: 0,
      connectionsActive: 0,
      connectionsTotal: 0,
      natTranslationsActive: 0,
      natTranslationsTotal: 0,
      rulesMatched: 0,
      defaultActionHits: 0,
      topBlockedSources: [],
      topBlockedPorts: [],
      startTime: Date.now(),
      lastUpdated: Date.now(),
    };
  }

  private setupDefaultZones(): void {
    // Create default security zones
    this.createZone({
      name: 'inside',
      description: 'Internal trusted network',
      trustLevel: 100,
      interfaces: ['GigabitEthernet0/0'],
      defaultAction: 'allow',
    });

    this.createZone({
      name: 'outside',
      description: 'External untrusted network (Internet)',
      trustLevel: 0,
      interfaces: ['GigabitEthernet0/1'],
      defaultAction: 'deny',
    });

    this.createZone({
      name: 'dmz',
      description: 'Demilitarized zone for public servers',
      trustLevel: 50,
      interfaces: ['GigabitEthernet0/2'],
      defaultAction: 'deny',
    });
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  setConfig(config: Partial<FirewallConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): FirewallConfig {
    return { ...this.config };
  }

  setMode(mode: FirewallMode): void {
    this.config.mode = mode;
  }

  // ============================================================================
  // Zone Management
  // ============================================================================

  createZone(params: Omit<SecurityZone, 'id'>): SecurityZone {
    const zone: SecurityZone = {
      id: generateId(),
      ...params,
    };

    this.zones.set(zone.id, zone);
    this.emit('zone:created', zone);
    
    return zone;
  }

  getZone(id: string): SecurityZone | undefined {
    return this.zones.get(id);
  }

  getZoneByName(name: string): SecurityZone | undefined {
    for (const zone of this.zones.values()) {
      if (zone.name === name) return zone;
    }
    return undefined;
  }

  getAllZones(): SecurityZone[] {
    return Array.from(this.zones.values());
  }

  updateZone(id: string, updates: Partial<Omit<SecurityZone, 'id'>>): SecurityZone | undefined {
    const zone = this.zones.get(id);
    if (!zone) return undefined;

    Object.assign(zone, updates);
    this.emit('zone:updated', zone);
    
    return zone;
  }

  deleteZone(id: string): boolean {
    const zone = this.zones.get(id);
    if (!zone) return false;

    this.zones.delete(id);
    this.emit('zone:deleted', zone);
    
    return true;
  }

  // ============================================================================
  // Zone Pair Management
  // ============================================================================

  createZonePair(params: Omit<ZonePair, 'id'>): ZonePair {
    const zonePair: ZonePair = {
      id: generateId(),
      ...params,
    };

    this.zonePairs.set(zonePair.id, zonePair);
    this.emit('zonepair:created', zonePair);
    
    return zonePair;
  }

  getZonePair(sourceZone: string, destZone: string): ZonePair | undefined {
    for (const zp of this.zonePairs.values()) {
      if (zp.sourceZone === sourceZone && zp.destZone === destZone) {
        return zp;
      }
    }
    return undefined;
  }

  getAllZonePairs(): ZonePair[] {
    return Array.from(this.zonePairs.values());
  }

  // ============================================================================
  // Policy Management
  // ============================================================================

  createPolicy(params: {
    name: string;
    description?: string;
    defaultAction?: FirewallAction;
  }): FirewallPolicy {
    const policy: FirewallPolicy = {
      id: generateId(),
      name: params.name,
      description: params.description,
      rules: [],
      defaultAction: params.defaultAction || 'deny',
      enabled: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.policies.set(policy.id, policy);
    this.emit('policy:created', policy);
    
    return policy;
  }

  getPolicy(id: string): FirewallPolicy | undefined {
    return this.policies.get(id);
  }

  getPolicyByName(name: string): FirewallPolicy | undefined {
    for (const policy of this.policies.values()) {
      if (policy.name === name) return policy;
    }
    return undefined;
  }

  getAllPolicies(): FirewallPolicy[] {
    return Array.from(this.policies.values());
  }

  updatePolicy(id: string, updates: Partial<Omit<FirewallPolicy, 'id' | 'createdAt'>>): FirewallPolicy | undefined {
    const policy = this.policies.get(id);
    if (!policy) return undefined;

    Object.assign(policy, updates, { updatedAt: Date.now() });
    this.emit('policy:updated', policy);
    
    return policy;
  }

  deletePolicy(id: string): boolean {
    const policy = this.policies.get(id);
    if (!policy) return false;

    this.policies.delete(id);
    this.emit('policy:deleted', policy);
    
    return true;
  }

  // ============================================================================
  // Firewall Rule Management
  // ============================================================================

  addRuleToPolicy(policyId: string, params: Omit<FirewallRule, 'id' | 'hitCount' | 'bytesMatched' | 'createdAt'>): FirewallRule | undefined {
    const policy = this.policies.get(policyId);
    if (!policy) return undefined;

    if (policy.rules.length >= this.config.maxRulesPerPolicy) {
      throw new Error(`Maximum rules per policy (${this.config.maxRulesPerPolicy}) reached`);
    }

    const rule: FirewallRule = {
      id: generateId(),
      ...params,
      hitCount: 0,
      bytesMatched: 0,
      createdAt: Date.now(),
    };

    policy.rules.push(rule);
    policy.rules.sort((a, b) => a.sequence - b.sequence);
    policy.updatedAt = Date.now();

    this.emit('rule:added', { policyId, rule });
    
    return rule;
  }

  // ============================================================================
  // NAT Rule Management
  // ============================================================================

  createNATRule(params: Omit<NATRule, 'id' | 'hitCount' | 'createdAt'>): NATRule {
    const rule: NATRule = {
      id: generateId(),
      ...params,
      hitCount: 0,
      createdAt: Date.now(),
    };

    this.natRules.set(rule.id, rule);
    this.emit('nat:rule:created', rule);
    
    return rule;
  }

  getNATRule(id: string): NATRule | undefined {
    return this.natRules.get(id);
  }

  getAllNATRules(): NATRule[] {
    return Array.from(this.natRules.values());
  }

  deleteNATRule(id: string): boolean {
    const rule = this.natRules.get(id);
    if (!rule) return false;

    this.natRules.delete(id);
    this.emit('nat:rule:deleted', rule);
    
    return true;
  }

  // ============================================================================
  // Packet Processing
  // ============================================================================

  /**
   * Process a packet through the firewall
   */
  processPacket(packet: FirewallPacket): PacketDecision {
    const startTime = performance.now();
    
    this.statistics.packetsProcessed++;
    this.statistics.bytesProcessed += packet.payloadSize;
    
    let decision: PacketDecision;

    // Step 1: Anti-spoofing check
    if (this.config.enableAntiSpoofing) {
      const spoofCheck = this.checkAntiSpoofing(packet);
      if (spoofCheck) {
        decision = spoofCheck;
        decision.processingTime = performance.now() - startTime;
        this.recordEvent('packet_dropped', packet, decision);
        return decision;
      }
    }

    // Step 2: Bogon filtering
    if (this.config.bogonBlocking) {
      const bogonCheck = this.checkBogonFiltering(packet);
      if (bogonCheck) {
        decision = bogonCheck;
        decision.processingTime = performance.now() - startTime;
        this.recordEvent('packet_dropped', packet, decision);
        return decision;
      }
    }

    // Step 3: Check existing connection (stateful)
    if (this.config.mode === 'stateful' && this.config.enableStatefulInspection) {
      const connDecision = this.checkConnectionState(packet);
      if (connDecision) {
        decision = connDecision;
        decision.processingTime = performance.now() - startTime;
        this.updateStatistics(decision);
        return decision;
      }
    }

    // Step 4: NAT pre-routing (destination NAT)
    if (this.config.enableNAT) {
      this.applyDestinationNAT(packet);
    }

    // Step 5: Zone-based policy evaluation
    decision = this.evaluateZonePolicy(packet);

    // Step 6: ACL evaluation if no zone policy matched
    if (!decision.matched) {
      const aclResult = this.aclEngine.evaluatePacket(packet);
      decision = {
        action: aclResult.action === 'permit' ? 'allow' : 'deny',
        matched: aclResult.matched,
        rule: aclResult.rule as unknown as FirewallRule,
        reason: aclResult.reason,
        processingTime: 0,
      };
    }

    // Step 7: Apply default action if nothing matched
    if (!decision.matched) {
      decision = {
        action: this.config.defaultAction,
        matched: false,
        reason: `Default action: ${this.config.defaultAction}`,
        processingTime: 0,
      };
      this.statistics.defaultActionHits++;
    }

    // Step 8: Create connection entry if allowed (stateful)
    if (decision.action === 'allow' && this.config.mode === 'stateful') {
      const connection = this.createConnection(packet);
      decision.connection = connection;
    }

    // Step 9: NAT post-routing (source NAT)
    if (this.config.enableNAT && decision.action === 'allow') {
      const natTrans = this.applySourceNAT(packet);
      if (natTrans) {
        decision.natTranslation = natTrans;
      }
    }

    decision.processingTime = performance.now() - startTime;
    
    // Update statistics
    this.updateStatistics(decision);
    
    // Record event
    const eventType = decision.action === 'allow' ? 'packet_allowed' : 
                      decision.action === 'drop' ? 'packet_dropped' : 'packet_denied';
    this.recordEvent(eventType, packet, decision);

    return decision;
  }

  private checkAntiSpoofing(packet: FirewallPacket): PacketDecision | null {
    const sourceZone = this.getZoneForInterface(packet.interface);
    if (!sourceZone) return null;

    // Check if source IP is appropriate for the source zone
    // For 'outside' zone, source should not be internal IPs
    if (sourceZone.name === 'outside') {
      const internalRanges = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'];
      
      for (const range of internalRanges) {
        const [network, prefix] = range.split('/');
        const mask = ~((1 << (32 - parseInt(prefix))) - 1);
        const networkNum = ipToNumber(network);
        const srcNum = ipToNumber(packet.sourceIP);
        
        if ((srcNum & mask) === (networkNum & mask)) {
          return {
            action: 'drop',
            matched: true,
            reason: `Anti-spoofing: Internal IP ${packet.sourceIP} from outside zone`,
            processingTime: 0,
          };
        }
      }
    }

    return null;
  }

  private checkBogonFiltering(packet: FirewallPacket): PacketDecision | null {
    const sourceZone = this.getZoneForInterface(packet.interface);
    
    // Only filter bogons from outside zone
    if (sourceZone?.name === 'outside' && isBogonIP(packet.sourceIP)) {
      return {
        action: 'drop',
        matched: true,
        reason: `Bogon filtering: Blocked source IP ${packet.sourceIP}`,
        processingTime: 0,
      };
    }

    return null;
  }

  private checkConnectionState(packet: FirewallPacket): PacketDecision | null {
    // Check for existing connection
    const connKey = getConnectionKey(
      packet.protocol,
      packet.sourceIP,
      packet.sourcePort,
      packet.destIP,
      packet.destPort
    );
    
    const reverseKey = getReverseConnectionKey(
      packet.protocol,
      packet.sourceIP,
      packet.sourcePort,
      packet.destIP,
      packet.destPort
    );

    // Check outbound connection
    let connection = this.connections.get(connKey);
    
    // Check inbound (return traffic)
    if (!connection) {
      connection = this.connections.get(reverseKey);
    }

    if (connection) {
      // Update connection statistics
      connection.lastSeen = Date.now();
      connection.packetsIn++;
      connection.bytesIn += packet.payloadSize;
      
      // Update TCP state if applicable
      if (packet.protocol === 'tcp' && packet.tcpFlags) {
        this.updateTCPState(connection, packet.tcpFlags);
      }

      return {
        action: 'allow',
        matched: true,
        connection,
        reason: `Stateful: Existing connection ${connection.state}`,
        processingTime: 0,
      };
    }

    return null;
  }

  private updateTCPState(connection: ConnectionEntry, flags: string[]): void {
    const hasFlag = (flag: string) => flags.includes(flag);

    switch (connection.tcpState) {
      case 'syn_sent':
        if (hasFlag('SYN') && hasFlag('ACK')) {
          connection.tcpState = 'syn_recv';
        }
        break;
      case 'syn_recv':
        if (hasFlag('ACK')) {
          connection.tcpState = 'established';
          connection.state = 'established';
        }
        break;
      case 'established':
        if (hasFlag('FIN')) {
          connection.tcpState = 'fin_wait';
          connection.state = 'close_wait';
        }
        if (hasFlag('RST')) {
          connection.tcpState = 'close';
          connection.state = 'closed';
        }
        break;
      case 'fin_wait':
        if (hasFlag('FIN') && hasFlag('ACK')) {
          connection.tcpState = 'time_wait';
          connection.state = 'time_wait';
        }
        break;
    }
  }

  private evaluateZonePolicy(packet: FirewallPacket): PacketDecision {
    const sourceZone = this.getZoneForInterface(packet.interface);
    const destZone = this.getZoneForIP(packet.destIP);

    if (!sourceZone || !destZone) {
      return {
        action: 'deny',
        matched: false,
        reason: 'Unknown zone',
        processingTime: 0,
      };
    }

    // Find zone pair
    const zonePair = this.getZonePair(sourceZone.name, destZone.name);
    
    if (!zonePair || !zonePair.enabled) {
      // Default zone policy based on trust levels
      if (sourceZone.trustLevel >= destZone.trustLevel) {
        // Higher trust to lower trust - typically allowed
        return {
          action: 'allow',
          matched: true,
          reason: `Zone policy: ${sourceZone.name} (${sourceZone.trustLevel}) -> ${destZone.name} (${destZone.trustLevel})`,
          processingTime: 0,
        };
      } else {
        // Lower trust to higher trust - denied by default
        return {
          action: 'deny',
          matched: true,
          reason: `Zone policy: ${sourceZone.name} (${sourceZone.trustLevel}) -> ${destZone.name} (${destZone.trustLevel}) denied`,
          processingTime: 0,
        };
      }
    }

    // Evaluate zone pair policy
    const policy = this.policies.get(zonePair.policy);
    if (policy && policy.enabled) {
      return this.evaluatePolicy(packet, policy);
    }

    return {
      action: 'deny',
      matched: false,
      reason: 'No matching zone policy',
      processingTime: 0,
    };
  }

  private evaluatePolicy(packet: FirewallPacket, policy: FirewallPolicy): PacketDecision {
    for (const rule of policy.rules) {
      if (!rule.enabled) continue;

      if (this.ruleMatchesPacket(rule, packet)) {
        rule.hitCount++;
        rule.bytesMatched += packet.payloadSize;
        rule.lastHit = Date.now();
        this.statistics.rulesMatched++;

        return {
          action: rule.action,
          matched: true,
          rule,
          policy,
          reason: `Rule ${rule.sequence}: ${rule.name || rule.action}`,
          processingTime: 0,
        };
      }
    }

    return {
      action: policy.defaultAction,
      matched: false,
      policy,
      reason: `Policy default: ${policy.defaultAction}`,
      processingTime: 0,
    };
  }

  private ruleMatchesPacket(rule: FirewallRule, packet: FirewallPacket): boolean {
    // Protocol check
    if (rule.protocol !== 'all' && rule.protocol !== packet.protocol) {
      return false;
    }

    // Source IP check
    if (rule.source.ip !== 'any') {
      if (!this.ipMatches(packet.sourceIP, rule.source.ip, rule.source.wildcard)) {
        return false;
      }
    }

    // Destination IP check
    if (rule.destination.ip !== 'any') {
      if (!this.ipMatches(packet.destIP, rule.destination.ip, rule.destination.wildcard)) {
        return false;
      }
    }

    // Port checks
    if (rule.source.port && packet.sourcePort) {
      if (!this.portMatches(packet.sourcePort, rule.source.port)) {
        return false;
      }
    }

    if (rule.destination.port && packet.destPort) {
      if (!this.portMatches(packet.destPort, rule.destination.port)) {
        return false;
      }
    }

    // Application layer check (NGFW)
    if (rule.application && rule.application.length > 0) {
      const detectedApp = this.detectApplication(packet);
      if (!detectedApp || !rule.application.includes(detectedApp)) {
        return false;
      }
    }

    // Deep packet inspection
    if (this.config.enableDPI && rule.contentMatch) {
      if (!this.contentMatches(packet.payload, rule.contentMatch)) {
        return false;
      }
    }

    return true;
  }

  private ipMatches(packetIP: string, ruleIP: string, wildcard?: string): boolean {
    if (ruleIP === 'any') return true;
    
    const packetNum = ipToNumber(packetIP);
    const ruleNum = ipToNumber(ruleIP);
    
    if (!wildcard || wildcard === '0.0.0.0') {
      return packetNum === ruleNum;
    }
    
    const wildcardNum = ipToNumber(wildcard);
    return ((packetNum ^ ruleNum) & ~wildcardNum) === 0;
  }

  private portMatches(packetPort: number, rulePort: number | { start: number; end: number } | 'any'): boolean {
    if (rulePort === 'any') return true;
    
    if (typeof rulePort === 'number') {
      return packetPort === rulePort;
    }
    
    return packetPort >= rulePort.start && packetPort <= rulePort.end;
  }

  private detectApplication(packet: FirewallPacket): string | null {
    // Simple application detection based on port
    const portAppMap: Record<number, string> = {
      80: 'http',
      443: 'https',
      22: 'ssh',
      23: 'telnet',
      21: 'ftp',
      25: 'smtp',
      53: 'dns',
      110: 'pop3',
      143: 'imap',
      3306: 'mysql',
      5432: 'postgresql',
      6379: 'redis',
      3389: 'rdp',
    };

    if (packet.destPort) {
      return portAppMap[packet.destPort] || null;
    }

    return null;
  }

  private contentMatches(payload: string | undefined, contentMatch: FirewallRule['contentMatch']): boolean {
    if (!payload || !contentMatch) return false;

    switch (contentMatch.type) {
      case 'string':
        return payload.includes(contentMatch.pattern);
      case 'regex':
        try {
          return new RegExp(contentMatch.pattern).test(payload);
        } catch {
          return false;
        }
      case 'hex':
        // Convert hex pattern to string and match
        const hexPattern = contentMatch.pattern.replace(/\\x([0-9A-Fa-f]{2})/g, 
          (_, hex) => String.fromCharCode(parseInt(hex, 16)));
        return payload.includes(hexPattern);
      default:
        return false;
    }
  }

  private getZoneForInterface(interfaceName: string): SecurityZone | undefined {
    for (const zone of this.zones.values()) {
      if (zone.interfaces.includes(interfaceName)) {
        return zone;
      }
    }
    return undefined;
  }

  private getZoneForIP(ip: string): SecurityZone | undefined {
    // Simple zone detection based on IP range
    // In production, this would be more sophisticated
    if (ip.startsWith('10.') || ip.startsWith('192.168.')) {
      return this.getZoneByName('inside');
    }
    if (ip.startsWith('172.16.')) {
      return this.getZoneByName('dmz');
    }
    return this.getZoneByName('outside');
  }

  // ============================================================================
  // Connection Management
  // ============================================================================

  private createConnection(packet: FirewallPacket): ConnectionEntry {
    const connection: ConnectionEntry = {
      id: generateId(),
      protocol: packet.protocol,
      sourceIP: packet.sourceIP,
      sourcePort: packet.sourcePort || 0,
      destIP: packet.destIP,
      destPort: packet.destPort || 0,
      state: 'new',
      tcpState: packet.protocol === 'tcp' ? 'syn_sent' : undefined,
      createdAt: Date.now(),
      lastSeen: Date.now(),
      timeout: this.getConnectionTimeout(packet.protocol),
      packetsIn: 1,
      packetsOut: 0,
      bytesIn: packet.payloadSize,
      bytesOut: 0,
    };

    const connKey = getConnectionKey(
      packet.protocol,
      packet.sourceIP,
      packet.sourcePort,
      packet.destIP,
      packet.destPort
    );

    if (this.connections.size >= this.config.maxConnections) {
      // Remove oldest connection
      const oldest = this.findOldestConnection();
      if (oldest) {
        this.connections.delete(oldest);
      }
    }

    this.connections.set(connKey, connection);
    this.statistics.connectionsActive = this.connections.size;
    this.statistics.connectionsTotal++;

    this.emit('connection:new', connection);
    
    return connection;
  }

  private findOldestConnection(): string | undefined {
    let oldestKey: string | undefined;
    let oldestTime = Date.now();

    for (const [key, conn] of this.connections) {
      if (conn.lastSeen < oldestTime) {
        oldestTime = conn.lastSeen;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  getActiveConnections(): ConnectionEntry[] {
    return Array.from(this.connections.values());
  }

  getConnectionCount(): number {
    return this.connections.size;
  }

  // ============================================================================
  // NAT Processing
  // ============================================================================

  private applyDestinationNAT(packet: FirewallPacket): void {
    for (const rule of this.natRules.values()) {
      if (!rule.enabled || rule.type !== 'destination') continue;

      if (rule.outsideGlobal === packet.destIP) {
        // Apply DNAT
        packet.destIP = rule.outsideLocal || packet.destIP;
        rule.hitCount++;
        
        this.emit('nat:dnat', { original: packet.destIP, translated: rule.outsideLocal });
      }
    }
  }

  private applySourceNAT(packet: FirewallPacket): NATTranslation | null {
    for (const rule of this.natRules.values()) {
      if (!rule.enabled) continue;
      if (rule.type === 'destination') continue;

      // Check if packet matches NAT rule
      if (!this.packetMatchesNATRule(packet, rule)) continue;

      let translation: NATTranslation;

      switch (rule.type) {
        case 'static':
          translation = this.createStaticNATTranslation(packet, rule);
          break;
        case 'dynamic':
          translation = this.createDynamicNATTranslation(packet, rule);
          break;
        case 'pat':
          translation = this.createPATTranslation(packet, rule);
          break;
        default:
          continue;
      }

      if (translation) {
        this.natTranslations.set(translation.id, translation);
        this.statistics.natTranslationsActive = this.natTranslations.size;
        this.statistics.natTranslationsTotal++;
        rule.hitCount++;
        
        this.emit('nat:created', translation);
        return translation;
      }
    }

    return null;
  }

  private packetMatchesNATRule(packet: FirewallPacket, rule: NATRule): boolean {
    // Check if source IP matches inside local
    if (rule.insideLocal !== 'any') {
      if (!packet.sourceIP.startsWith(rule.insideLocal.replace(/\.\d+$/, ''))) {
        return false;
      }
    }

    // Check interface
    if (rule.insideInterface && packet.interface !== rule.insideInterface) {
      return false;
    }

    return true;
  }

  private createStaticNATTranslation(packet: FirewallPacket, rule: NATRule): NATTranslation {
    return {
      id: generateId(),
      ruleId: rule.id,
      protocol: packet.protocol,
      insideLocal: packet.sourceIP,
      insideLocalPort: packet.sourcePort || 0,
      insideGlobal: rule.insideGlobal || packet.sourceIP,
      insideGlobalPort: packet.sourcePort || 0,
      outsideLocal: packet.destIP,
      outsideLocalPort: packet.destPort || 0,
      outsideGlobal: packet.destIP,
      outsideGlobalPort: packet.destPort || 0,
      state: 'active',
      createdAt: Date.now(),
      lastUsed: Date.now(),
      timeout: this.config.tcpTimeout,
    };
  }

  private createDynamicNATTranslation(packet: FirewallPacket, rule: NATRule): NATTranslation {
    // Get IP from pool
    let translatedIP = rule.pool?.startIP || packet.sourceIP;
    
    if (rule.pool) {
      // Simple round-robin from pool (in production, would track used IPs)
      const startNum = ipToNumber(rule.pool.startIP);
      const endNum = ipToNumber(rule.pool.endIP);
      const offset = this.natTranslations.size % (endNum - startNum + 1);
      translatedIP = numberToIp(startNum + offset);
    }

    return {
      id: generateId(),
      ruleId: rule.id,
      protocol: packet.protocol,
      insideLocal: packet.sourceIP,
      insideLocalPort: packet.sourcePort || 0,
      insideGlobal: translatedIP,
      insideGlobalPort: packet.sourcePort || 0,
      outsideLocal: packet.destIP,
      outsideLocalPort: packet.destPort || 0,
      outsideGlobal: packet.destIP,
      outsideGlobalPort: packet.destPort || 0,
      state: 'active',
      createdAt: Date.now(),
      lastUsed: Date.now(),
      timeout: this.config.tcpTimeout,
    };
  }

  private createPATTranslation(packet: FirewallPacket, rule: NATRule): NATTranslation {
    // Allocate port from PAT pool
    const translatedPort = this.allocatePATPort();
    
    return {
      id: generateId(),
      ruleId: rule.id,
      protocol: packet.protocol,
      insideLocal: packet.sourceIP,
      insideLocalPort: packet.sourcePort || 0,
      insideGlobal: rule.insideGlobal || packet.sourceIP,
      insideGlobalPort: translatedPort,
      outsideLocal: packet.destIP,
      outsideLocalPort: packet.destPort || 0,
      outsideGlobal: packet.destIP,
      outsideGlobalPort: packet.destPort || 0,
      state: 'active',
      createdAt: Date.now(),
      lastUsed: Date.now(),
      timeout: this.config.tcpTimeout,
    };
  }

  private allocatePATPort(): number {
    // Find next available port
    while (this.patPortPool.has(this.nextPatPort)) {
      this.nextPatPort++;
      if (this.nextPatPort > this.config.patPortRangeEnd) {
        this.nextPatPort = this.config.patPortRangeStart;
      }
    }

    const port = this.nextPatPort;
    this.patPortPool.add(port);
    this.nextPatPort++;

    return port;
  }

  getNATTranslations(): NATTranslation[] {
    return Array.from(this.natTranslations.values());
  }

  // ============================================================================
  // Statistics & Events
  // ============================================================================

  private updateStatistics(decision: PacketDecision): void {
    switch (decision.action) {
      case 'allow':
        this.statistics.packetsAllowed++;
        break;
      case 'deny':
      case 'reject':
        this.statistics.packetsDenied++;
        break;
      case 'drop':
        this.statistics.packetsDropped++;
        break;
    }

    this.statistics.lastUpdated = Date.now();
  }

  private recordEvent(type: FirewallEvent['type'], packet: FirewallPacket, decision: PacketDecision): void {
    const event: FirewallEvent = {
      id: generateId(),
      timestamp: Date.now(),
      type,
      ruleId: decision.rule?.id,
      policyId: decision.policy?.id,
      sourceIP: packet.sourceIP,
      sourcePort: packet.sourcePort,
      destIP: packet.destIP,
      destPort: packet.destPort,
      protocol: packet.protocol,
      action: decision.action,
      message: decision.reason,
      packetSize: packet.payloadSize,
      connectionId: decision.connection?.id,
      natTranslationId: decision.natTranslation?.id,
    };

    this.events.push(event);
    
    // Limit events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Update top blocked sources
    if (decision.action === 'deny' || decision.action === 'drop') {
      this.updateTopBlockedSources(packet.sourceIP);
      if (packet.destPort) {
        this.updateTopBlockedPorts(packet.destPort);
      }
    }

    this.emit('event', event);
  }

  private updateTopBlockedSources(ip: string): void {
    const existing = this.statistics.topBlockedSources.find(s => s.ip === ip);
    if (existing) {
      existing.count++;
    } else {
      this.statistics.topBlockedSources.push({ ip, count: 1 });
    }
    
    this.statistics.topBlockedSources.sort((a, b) => b.count - a.count);
    this.statistics.topBlockedSources = this.statistics.topBlockedSources.slice(0, 10);
  }

  private updateTopBlockedPorts(port: number): void {
    const existing = this.statistics.topBlockedPorts.find(p => p.port === port);
    if (existing) {
      existing.count++;
    } else {
      this.statistics.topBlockedPorts.push({ port, count: 1 });
    }
    
    this.statistics.topBlockedPorts.sort((a, b) => b.count - a.count);
    this.statistics.topBlockedPorts = this.statistics.topBlockedPorts.slice(0, 10);
  }

  getStatistics(): FirewallStatistics {
    return { ...this.statistics };
  }

  getEvents(limit: number = 100): FirewallEvent[] {
    return this.events.slice(-limit);
  }

  resetStatistics(): void {
    this.statistics = this.initializeStatistics();
    this.events = [];
    
    // Reset rule hit counts
    for (const policy of this.policies.values()) {
      for (const rule of policy.rules) {
        rule.hitCount = 0;
        rule.bytesMatched = 0;
        rule.lastHit = undefined;
      }
    }
    
    // Reset NAT rule hit counts
    for (const rule of this.natRules.values()) {
      rule.hitCount = 0;
    }
  }

  // ============================================================================
  // Event Handling
  // ============================================================================

  on(event: string, callback: FirewallEventCallback): void {
    this.emitter.on(event, callback);
  }

  off(event: string, callback: FirewallEventCallback): void {
    this.emitter.off(event, callback);
  }

  private emit(event: string, data: unknown): void {
    this.emitter.emit(event, data);
  }

  // ============================================================================
  // Educational Templates
  // ============================================================================

  static readonly POLICY_TEMPLATES = {
    /**
     * Basic DMZ policy - allow web traffic only
     */
    dmzWebServer: () => ({
      name: 'DMZ_WEB_SERVER',
      description: 'Allow web traffic to DMZ servers',
      rules: [
        {
          name: 'Allow HTTP',
          sequence: 10,
          action: 'allow' as FirewallAction,
          protocol: 'tcp' as ACLProtocol | 'all',
          source: { ip: 'any' },
          destination: { ip: 'any', port: 80 },
          log: true,
        },
        {
          name: 'Allow HTTPS',
          sequence: 20,
          action: 'allow' as FirewallAction,
          protocol: 'tcp' as ACLProtocol | 'all',
          source: { ip: 'any' },
          destination: { ip: 'any', port: 443 },
          log: true,
        },
      ],
    }),

    /**
     * Outbound internet access policy
     */
    outboundInternet: () => ({
      name: 'OUTBOUND_INTERNET',
      description: 'Allow internal hosts to access internet',
      rules: [
        {
          name: 'Allow DNS',
          sequence: 10,
          action: 'allow' as FirewallAction,
          protocol: 'udp' as ACLProtocol | 'all',
          source: { ip: 'any' },
          destination: { ip: 'any', port: 53 },
        },
        {
          name: 'Allow HTTP',
          sequence: 20,
          action: 'allow' as FirewallAction,
          protocol: 'tcp' as ACLProtocol | 'all',
          source: { ip: 'any' },
          destination: { ip: 'any', port: 80 },
        },
        {
          name: 'Allow HTTPS',
          sequence: 30,
          action: 'allow' as FirewallAction,
          protocol: 'tcp' as ACLProtocol | 'all',
          source: { ip: 'any' },
          destination: { ip: 'any', port: 443 },
        },
      ],
    }),
  };
}

// ============================================================================
// Singleton Instance
// ============================================================================

let firewallEngineInstance: FirewallEngine | null = null;

export function getFirewallEngine(): FirewallEngine {
  if (!firewallEngineInstance) {
    firewallEngineInstance = new FirewallEngine();
  }
  return firewallEngineInstance;
}

export function resetFirewallEngine(): void {
  if (firewallEngineInstance) {
    firewallEngineInstance.destroy();
    firewallEngineInstance = null;
  }
}
