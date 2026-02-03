/**
 * IDS Engine - Intrusion Detection System
 * 
 * Core detection engine that analyzes network traffic and generates alerts
 * based on signatures, anomalies, and heuristic rules.
 * 
 * Network Security Virtual Lab - Educational Platform
 */

import { EventEmitter } from 'events';
import {
  IDSConfig,
  IDSRule,
  IDSAlert,
  IDSStatistics,
  AlertSeverity,
  AlertStatus,
  RuleCategory,
  DetectionMethod,
  IDSEventType,
  AlertPacketInfo,
  NetworkBaseline,
  AnomalyConfig,
  ThresholdOptions,
} from './types';
import { AttackPacket } from '../attacks/types';

// ============================================================================
// Types
// ============================================================================

type IDSEventCallback = (data: unknown) => void;

interface PacketContext {
  packet: AttackPacket;
  sessionId?: string;
  streamData?: string;
  previousPackets?: AttackPacket[];
}

interface RuleMatchResult {
  matched: boolean;
  rule: IDSRule;
  matchDetails?: {
    contentMatches?: string[];
    flagsMatch?: boolean;
    flowMatch?: boolean;
  };
}

interface ThresholdState {
  ruleId: string;
  trackKey: string;
  count: number;
  windowStart: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: IDSConfig = {
  mode: 'ids',
  enabled: true,
  maxPacketSize: 65535,
  streamReassembly: true,
  maxStreams: 10000,
  streamTimeout: 30000,
  enableSignatureDetection: true,
  enableAnomalyDetection: true,
  enableHeuristicDetection: true,
  alertThreshold: 'low',
  maxAlertsPerSecond: 100,
  deduplicationWindow: 60,
  defaultAction: 'alert',
  blockDuration: 300000, // 5 minutes
  autoBlockThreshold: 10,
  logLevel: 'info',
  logPackets: true,
  logPayloads: false,
  enabledRuleSets: ['default'],
  excludedIPs: [],
  excludedPorts: [],
  excludedProtocols: [],
};

const DEFAULT_ANOMALY_CONFIG: AnomalyConfig = {
  enabled: true,
  baselineWindow: 3600, // 1 hour
  packetRateThreshold: 10000,
  byteRateThreshold: 100000000, // 100 MB/s
  connectionRateThreshold: 1000,
  detectProtocolAnomalies: true,
  detectPortAnomalies: true,
  detectPayloadAnomalies: true,
  sensitivity: 0.7,
};

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(): string {
  return `ids-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function severityToNumber(severity: AlertSeverity): number {
  const map: Record<AlertSeverity, number> = {
    critical: 5,
    high: 4,
    medium: 3,
    low: 2,
    info: 1,
  };
  return map[severity] || 0;
}

function matchContent(payload: string, patterns: string[], nocase: boolean = false): boolean {
  for (const pattern of patterns) {
    const searchPattern = nocase ? pattern.toLowerCase() : pattern;
    const searchPayload = nocase ? payload.toLowerCase() : payload;
    if (!searchPayload.includes(searchPattern)) {
      return false;
    }
  }
  return true;
}

function matchPCRE(payload: string, pattern: string, modifiers: string = ''): boolean {
  try {
    const flags = modifiers.includes('i') ? 'gi' : 'g';
    const regex = new RegExp(pattern, flags);
    return regex.test(payload);
  } catch {
    return false;
  }
}

function matchTCPFlags(packetFlags: string[] | string = [], ruleFlags: string): boolean {
  // Rule flags format: S (SYN), A (ACK), F (FIN), R (RST), P (PSH), U (URG)
  // + means must be set, * means any of these, ! means not set
  const flagMap: Record<string, string> = {
    S: 'SYN', A: 'ACK', F: 'FIN', R: 'RST', P: 'PSH', U: 'URG',
  };
  
  // Convert to string for easier matching
  const flagsStr = Array.isArray(packetFlags) ? packetFlags.join(',') : packetFlags;
  
  for (const char of ruleFlags) {
    if (char === '+' || char === '*' || char === '!') continue;
    const fullFlag = flagMap[char];
    if (fullFlag && !flagsStr.includes(fullFlag)) {
      return false;
    }
  }
  return true;
}

// ============================================================================
// IDS Engine Class
// ============================================================================

export class IDSEngine {
  private config: IDSConfig;
  private anomalyConfig: AnomalyConfig;
  private emitter: EventEmitter;
  private rules: Map<string, IDSRule>;
  private alerts: Map<string, IDSAlert>;
  private statistics: IDSStatistics;
  private baseline: NetworkBaseline | null;
  private thresholdStates: Map<string, ThresholdState>;
  private recentAlerts: Map<string, number>; // For deduplication
  private alertsThisSecond: number;
  private lastAlertReset: number;
  private isRunning: boolean;
  
  // Stream tracking for stateful detection
  private streams: Map<string, {
    packets: AttackPacket[];
    established: boolean;
    lastActivity: number;
  }>;

  constructor(config: Partial<IDSConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.anomalyConfig = DEFAULT_ANOMALY_CONFIG;
    this.emitter = new EventEmitter();
    this.rules = new Map();
    this.alerts = new Map();
    this.thresholdStates = new Map();
    this.recentAlerts = new Map();
    this.streams = new Map();
    this.baseline = null;
    this.alertsThisSecond = 0;
    this.lastAlertReset = Date.now();
    this.isRunning = false;
    
    this.statistics = this.initializeStatistics();
  }

  // ============================================================================
  // Lifecycle Methods
  // ============================================================================

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.statistics.startTime = Date.now();
    this.emit('engine:start', { config: this.config });
    
    // Start stream cleanup interval
    this.startStreamCleanup();
  }

  stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    this.emit('engine:stop', { statistics: this.statistics });
  }

  destroy(): void {
    this.stop();
    this.rules.clear();
    this.alerts.clear();
    this.streams.clear();
    this.thresholdStates.clear();
    this.emitter.removeAllListeners();
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  setConfig(config: Partial<IDSConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): IDSConfig {
    return { ...this.config };
  }

  setAnomalyConfig(config: Partial<AnomalyConfig>): void {
    this.anomalyConfig = { ...this.anomalyConfig, ...config };
  }

  setMode(mode: IDSConfig['mode']): void {
    this.config.mode = mode;
  }

  // ============================================================================
  // Rule Management
  // ============================================================================

  loadRule(rule: IDSRule): void {
    this.rules.set(rule.id, rule);
    this.emit('rule:loaded', { rule });
  }

  loadRules(rules: IDSRule[]): void {
    rules.forEach(rule => this.loadRule(rule));
    this.statistics.rulesLoaded = this.rules.size;
  }

  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
    this.statistics.rulesLoaded = this.rules.size;
  }

  enableRule(ruleId: string): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = true;
      this.emit('rule:updated', { rule });
    }
  }

  disableRule(ruleId: string): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = false;
      this.emit('rule:updated', { rule });
    }
  }

  getRule(ruleId: string): IDSRule | undefined {
    return this.rules.get(ruleId);
  }

  getRules(): IDSRule[] {
    return Array.from(this.rules.values());
  }

  getRulesByCategory(category: RuleCategory): IDSRule[] {
    return this.getRules().filter(r => r.category === category);
  }

  // ============================================================================
  // Packet Analysis
  // ============================================================================

  /**
   * Main entry point for packet analysis
   */
  analyzePacket(packet: AttackPacket): IDSAlert[] {
    if (!this.isRunning || !this.config.enabled) {
      return [];
    }

    const startTime = performance.now();
    const generatedAlerts: IDSAlert[] = [];

    try {
      // Update statistics
      this.statistics.packetsAnalyzed++;
      this.statistics.bytesAnalyzed += packet.size;

      // Check exclusions
      if (this.isExcluded(packet)) {
        return [];
      }

      // Update stream tracking
      const streamId = this.getStreamId(packet);
      this.updateStream(streamId, packet);

      // Create packet context
      const context: PacketContext = {
        packet,
        sessionId: streamId,
        streamData: this.getStreamData(streamId),
        previousPackets: this.streams.get(streamId)?.packets.slice(-10),
      };

      // Run signature-based detection
      if (this.config.enableSignatureDetection) {
        const signatureAlerts = this.runSignatureDetection(context);
        generatedAlerts.push(...signatureAlerts);
      }

      // Run anomaly-based detection
      if (this.config.enableAnomalyDetection && this.anomalyConfig.enabled) {
        const anomalyAlerts = this.runAnomalyDetection(context);
        generatedAlerts.push(...anomalyAlerts);
      }

      // Run heuristic detection
      if (this.config.enableHeuristicDetection) {
        const heuristicAlerts = this.runHeuristicDetection(context);
        generatedAlerts.push(...heuristicAlerts);
      }

      // Update latency statistics
      const latency = performance.now() - startTime;
      this.updateLatencyStats(latency);

      // Store and emit alerts
      generatedAlerts.forEach(alert => {
        this.alerts.set(alert.id, alert);
        this.emit('alert:new', alert);
        this.statistics.alertsGenerated++;
        this.statistics.alertsBySeverity[alert.severity]++;
      });

    } catch (error) {
      this.statistics.errors++;
      this.statistics.lastError = error instanceof Error ? error.message : 'Unknown error';
      this.emit('engine:error', { error });
    }

    return generatedAlerts;
  }

  /**
   * Batch analyze multiple packets
   */
  analyzePackets(packets: AttackPacket[]): IDSAlert[] {
    const allAlerts: IDSAlert[] = [];
    for (const packet of packets) {
      const alerts = this.analyzePacket(packet);
      allAlerts.push(...alerts);
    }
    return allAlerts;
  }

  // ============================================================================
  // Signature-Based Detection
  // ============================================================================

  private runSignatureDetection(context: PacketContext): IDSAlert[] {
    const alerts: IDSAlert[] = [];
    const { packet } = context;

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;
      if (!this.matchesSeverityThreshold(rule.severity)) continue;

      const matchResult = this.matchRule(rule, context);
      
      if (matchResult.matched) {
        // Check threshold
        if (rule.options.threshold && !this.checkThreshold(rule, packet)) {
          continue;
        }

        // Check deduplication
        const dedupKey = `${rule.id}-${packet.sourceIP}-${packet.destIP}`;
        if (this.isDuplicate(dedupKey)) {
          continue;
        }

        // Rate limiting
        if (!this.checkAlertRateLimit()) {
          continue;
        }

        // Generate alert
        const alert = this.createAlert(rule, context, 'signature');
        alerts.push(alert);

        // Track for deduplication
        this.recentAlerts.set(dedupKey, Date.now());

        // Update rule stats
        if (rule.performance) {
          rule.performance.hitCount = (rule.performance.hitCount || 0) + 1;
        }
        this.statistics.rulesMatched++;
        
        this.emit('rule:triggered', { rule, packet });
      }
    }

    return alerts;
  }

  private matchRule(rule: IDSRule, context: PacketContext): RuleMatchResult {
    const { packet } = context;
    const result: RuleMatchResult = { matched: false, rule, matchDetails: {} };

    // Check protocol
    if (rule.protocol !== 'any' && rule.protocol !== packet.protocol.toLowerCase()) {
      return result;
    }

    // Check source address
    if (!this.matchAddress(rule.sourceAddress, packet.sourceIP)) {
      return result;
    }

    // Check destination address
    if (!this.matchAddress(rule.destAddress, packet.destIP)) {
      return result;
    }

    // Check ports (if applicable)
    if (packet.sourcePort !== undefined && !this.matchPort(rule.sourcePort, packet.sourcePort)) {
      return result;
    }
    if (packet.destPort !== undefined && !this.matchPort(rule.destPort, packet.destPort)) {
      return result;
    }

    // Check flow options
    if (rule.options.flow && !this.matchFlow(rule.options.flow, context)) {
      return result;
    }

    // Check TCP flags
    if (rule.options.flags && packet.flags) {
      if (!matchTCPFlags(packet.flags, rule.options.flags)) {
        return result;
      }
      result.matchDetails!.flagsMatch = true;
    }

    // Check content
    if (rule.options.content && rule.options.content.length > 0) {
      const payload = packet.payload || '';
      const patterns = rule.options.content.map(c => c.pattern);
      const nocase = rule.options.content.some(c => c.nocase);
      
      if (!matchContent(payload, patterns, nocase)) {
        return result;
      }
      result.matchDetails!.contentMatches = patterns;
    }

    // Check PCRE
    if (rule.options.pcre && rule.options.pcre.length > 0) {
      const payload = packet.payload || '';
      for (const pcre of rule.options.pcre) {
        if (!matchPCRE(payload, pcre.pattern, pcre.modifiers)) {
          return result;
        }
      }
    }

    // Check packet size
    if (rule.options.dsize) {
      const sizeMatch = this.matchSize(packet.size, rule.options.dsize);
      if (!sizeMatch) {
        return result;
      }
    }

    // All checks passed
    result.matched = true;
    return result;
  }

  private matchAddress(ruleAddr: IDSRule['sourceAddress'], packetIP: string): boolean {
    if (ruleAddr.type === 'any') return !ruleAddr.negated;
    
    let matched = false;
    
    switch (ruleAddr.type) {
      case 'single':
        matched = packetIP === ruleAddr.value;
        break;
      case 'cidr':
        matched = this.matchCIDR(packetIP, ruleAddr.value);
        break;
      case 'range':
        matched = this.matchIPRange(packetIP, ruleAddr.value);
        break;
      case 'list':
        matched = ruleAddr.value.split(',').includes(packetIP);
        break;
    }
    
    return ruleAddr.negated ? !matched : matched;
  }

  private matchPort(rulePort: IDSRule['sourcePort'], packetPort: number): boolean {
    if (rulePort.type === 'any') return !rulePort.negated;
    
    let matched = false;
    
    switch (rulePort.type) {
      case 'single':
        matched = packetPort === Number(rulePort.value);
        break;
      case 'range':
        const [min, max] = String(rulePort.value).split(':').map(Number);
        matched = packetPort >= min && packetPort <= max;
        break;
      case 'list':
        const ports = Array.isArray(rulePort.value) ? rulePort.value : [Number(rulePort.value)];
        matched = ports.includes(packetPort);
        break;
    }
    
    return rulePort.negated ? !matched : matched;
  }

  private matchFlow(flow: NonNullable<IDSRule['options']['flow']>, context: PacketContext): boolean {
    const stream = context.sessionId ? this.streams.get(context.sessionId) : null;
    
    if (flow.established && (!stream || !stream.established)) {
      return false;
    }
    
    // Additional flow checks can be implemented here
    return true;
  }

  private matchCIDR(ip: string, cidr: string): boolean {
    const [network, bits] = cidr.split('/');
    const mask = ~(2 ** (32 - Number(bits)) - 1);
    
    const ipNum = this.ipToNumber(ip);
    const networkNum = this.ipToNumber(network);
    
    return (ipNum & mask) === (networkNum & mask);
  }

  private matchIPRange(ip: string, range: string): boolean {
    const [start, end] = range.split('-');
    const ipNum = this.ipToNumber(ip);
    return ipNum >= this.ipToNumber(start) && ipNum <= this.ipToNumber(end);
  }

  private ipToNumber(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + Number(octet), 0);
  }

  private matchSize(size: number, condition: string): boolean {
    // Format: <100, >50, =64, 100<>200 (range)
    if (condition.includes('<>')) {
      const [min, max] = condition.split('<>').map(Number);
      return size > min && size < max;
    } else if (condition.startsWith('<')) {
      return size < Number(condition.slice(1));
    } else if (condition.startsWith('>')) {
      return size > Number(condition.slice(1));
    } else if (condition.startsWith('=')) {
      return size === Number(condition.slice(1));
    }
    return size === Number(condition);
  }

  // ============================================================================
  // Anomaly-Based Detection
  // ============================================================================

  private runAnomalyDetection(context: PacketContext): IDSAlert[] {
    const alerts: IDSAlert[] = [];
    const { packet } = context;

    // Skip if no baseline
    if (!this.baseline) {
      return alerts;
    }

    // Check protocol anomaly
    if (this.anomalyConfig.detectProtocolAnomalies) {
      const protocolAlert = this.detectProtocolAnomaly(packet);
      if (protocolAlert) alerts.push(protocolAlert);
    }

    // Check port anomaly
    if (this.anomalyConfig.detectPortAnomalies && packet.destPort) {
      const portAlert = this.detectPortAnomaly(packet);
      if (portAlert) alerts.push(portAlert);
    }

    // Check payload anomaly
    if (this.anomalyConfig.detectPayloadAnomalies && packet.payload) {
      const payloadAlert = this.detectPayloadAnomaly(packet);
      if (payloadAlert) alerts.push(payloadAlert);
    }

    return alerts;
  }

  private detectProtocolAnomaly(packet: AttackPacket): IDSAlert | null {
    if (!this.baseline) return null;
    
    const protocol = packet.protocol.toLowerCase();
    const expectedDist = this.baseline.protocolDistribution[protocol] || 0;
    
    // If protocol is very rare in baseline, flag it
    if (expectedDist < 0.01) {
      return this.createAnomalyAlert(
        packet,
        'Unusual Protocol Detected',
        `Protocol ${protocol} is not commonly seen in network baseline`,
        'low'
      );
    }
    
    return null;
  }

  private detectPortAnomaly(packet: AttackPacket): IDSAlert | null {
    if (!this.baseline || !packet.destPort) return null;
    
    const port = packet.destPort;
    const isCommon = this.baseline.commonPorts.includes(port);
    
    // High ports that aren't commonly used
    if (!isCommon && port > 1024) {
      // Check if this could be suspicious
      const suspiciousPorts = [4444, 5555, 6666, 31337, 12345, 54321];
      if (suspiciousPorts.includes(port)) {
        return this.createAnomalyAlert(
          packet,
          'Suspicious Port Activity',
          `Connection to known suspicious port ${port}`,
          'medium'
        );
      }
    }
    
    return null;
  }

  private detectPayloadAnomaly(packet: AttackPacket): IDSAlert | null {
    if (!packet.payload) return null;
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      { pattern: /\x00{10,}/, desc: 'NOP sled detected' },
      { pattern: /\x90{10,}/, desc: 'x86 NOP sled detected' },
      { pattern: /(?:sh|bash|cmd|powershell).*(?:-c|-e|\/c)/, desc: 'Shell command injection' },
      { pattern: /(?:SELECT|INSERT|UPDATE|DELETE).*(?:FROM|INTO|WHERE)/i, desc: 'SQL injection attempt' },
      { pattern: /<script[^>]*>.*<\/script>/i, desc: 'XSS attempt' },
    ];
    
    for (const { pattern, desc } of suspiciousPatterns) {
      if (pattern.test(packet.payload)) {
        return this.createAnomalyAlert(
          packet,
          'Suspicious Payload',
          desc,
          'high'
        );
      }
    }
    
    return null;
  }

  private createAnomalyAlert(
    packet: AttackPacket,
    title: string,
    description: string,
    severity: AlertSeverity
  ): IDSAlert {
    return {
      id: generateId(),
      timestamp: Date.now(),
      ruleId: 'anomaly-detection',
      ruleName: title,
      ruleSID: 0,
      severity,
      category: 'suspicious',
      message: title,
      description,
      sourceIP: packet.sourceIP,
      sourcePort: packet.sourcePort,
      destIP: packet.destIP,
      destPort: packet.destPort,
      protocol: packet.protocol,
      status: 'new',
      packet: this.capturePacketInfo(packet),
    };
  }

  // ============================================================================
  // Heuristic Detection
  // ============================================================================

  private runHeuristicDetection(context: PacketContext): IDSAlert[] {
    const alerts: IDSAlert[] = [];
    const { packet, previousPackets } = context;

    // Detect port scan behavior
    if (previousPackets && previousPackets.length >= 5) {
      const portScanAlert = this.detectPortScan(packet, previousPackets);
      if (portScanAlert) alerts.push(portScanAlert);
    }

    // Detect ARP anomalies
    if (packet.protocol.toLowerCase() === 'arp') {
      const arpAlert = this.detectARPAnomaly(packet);
      if (arpAlert) alerts.push(arpAlert);
    }

    // Detect DNS anomalies
    if (packet.protocol.toLowerCase() === 'dns' || packet.destPort === 53) {
      const dnsAlert = this.detectDNSAnomaly(packet);
      if (dnsAlert) alerts.push(dnsAlert);
    }

    return alerts;
  }

  private detectPortScan(packet: AttackPacket, previousPackets: AttackPacket[]): IDSAlert | null {
    // Count unique destination ports from same source
    const recentPackets = previousPackets.filter(
      p => p.sourceIP === packet.sourceIP && Date.now() - p.timestamp < 5000
    );
    
    const uniquePorts = new Set(recentPackets.map(p => p.destPort).filter(Boolean));
    
    if (uniquePorts.size >= 5) {
      return {
        id: generateId(),
        timestamp: Date.now(),
        ruleId: 'heuristic-portscan',
        ruleName: 'Port Scan Detected',
        ruleSID: 1000001,
        severity: 'medium',
        category: 'scan',
        message: `Possible port scan from ${packet.sourceIP}`,
        description: `${uniquePorts.size} different ports probed in 5 seconds`,
        sourceIP: packet.sourceIP,
        destIP: packet.destIP,
        protocol: packet.protocol,
        status: 'new',
        packet: this.capturePacketInfo(packet),
      };
    }
    
    return null;
  }

  private detectARPAnomaly(packet: AttackPacket): IDSAlert | null {
    // ARP spoofing detection heuristics
    if (packet.payload?.includes('reply') && packet.isMalicious) {
      return {
        id: generateId(),
        timestamp: Date.now(),
        ruleId: 'heuristic-arp-spoof',
        ruleName: 'ARP Spoofing Detected',
        ruleSID: 1000002,
        severity: 'high',
        category: 'reconnaissance',
        message: `Possible ARP spoofing from ${packet.sourceIP}`,
        description: 'Unsolicited ARP reply detected',
        sourceIP: packet.sourceIP,
        destIP: packet.destIP,
        protocol: 'ARP',
        status: 'new',
        packet: this.capturePacketInfo(packet),
        mitreAttack: {
          tactic: 'credential-access',
          technique: 'T1557.002',
        },
      };
    }
    
    return null;
  }

  private detectDNSAnomaly(packet: AttackPacket): IDSAlert | null {
    // DNS tunneling / exfiltration detection
    if (packet.payload) {
      // Check for unusually long DNS queries (potential tunneling)
      const queryMatch = packet.payload.match(/query:\s*([^\s]+)/i);
      if (queryMatch && queryMatch[1].length > 50) {
        return {
          id: generateId(),
          timestamp: Date.now(),
          ruleId: 'heuristic-dns-tunnel',
          ruleName: 'DNS Tunneling Suspected',
          ruleSID: 1000003,
          severity: 'medium',
          category: 'exfiltration',
          message: 'Unusually long DNS query detected',
          description: 'Query length suggests possible DNS tunneling',
          sourceIP: packet.sourceIP,
          destIP: packet.destIP,
          destPort: 53,
          protocol: 'DNS',
          status: 'new',
          packet: this.capturePacketInfo(packet),
        };
      }
    }
    
    return null;
  }

  // ============================================================================
  // Threshold and Rate Limiting
  // ============================================================================

  private checkThreshold(rule: IDSRule, packet: AttackPacket): boolean {
    const threshold = rule.options.threshold;
    if (!threshold) return true;

    const trackKey = this.getThresholdKey(threshold, rule.id, packet);
    const now = Date.now();
    
    let state = this.thresholdStates.get(trackKey);
    
    if (!state || now - state.windowStart > threshold.seconds * 1000) {
      // Reset window
      state = {
        ruleId: rule.id,
        trackKey,
        count: 1,
        windowStart: now,
      };
      this.thresholdStates.set(trackKey, state);
      
      return threshold.type === 'threshold' ? false : true;
    }
    
    state.count++;
    
    switch (threshold.type) {
      case 'limit':
        return state.count <= threshold.count;
      case 'threshold':
        return state.count >= threshold.count;
      case 'both':
        return state.count >= threshold.count && state.count <= threshold.count * 2;
      default:
        return true;
    }
  }

  private getThresholdKey(threshold: ThresholdOptions, ruleId: string, packet: AttackPacket): string {
    switch (threshold.track) {
      case 'by_src':
        return `${ruleId}-src-${packet.sourceIP}`;
      case 'by_dst':
        return `${ruleId}-dst-${packet.destIP}`;
      case 'by_both':
        return `${ruleId}-${packet.sourceIP}-${packet.destIP}`;
      case 'by_rule':
      default:
        return ruleId;
    }
  }

  private checkAlertRateLimit(): boolean {
    const now = Date.now();
    
    // Reset counter every second
    if (now - this.lastAlertReset >= 1000) {
      this.alertsThisSecond = 0;
      this.lastAlertReset = now;
    }
    
    if (this.alertsThisSecond >= this.config.maxAlertsPerSecond) {
      return false;
    }
    
    this.alertsThisSecond++;
    return true;
  }

  private isDuplicate(dedupKey: string): boolean {
    const lastSeen = this.recentAlerts.get(dedupKey);
    if (!lastSeen) return false;
    
    return Date.now() - lastSeen < this.config.deduplicationWindow * 1000;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private isExcluded(packet: AttackPacket): boolean {
    // Check excluded IPs
    if (this.config.excludedIPs.includes(packet.sourceIP) ||
        this.config.excludedIPs.includes(packet.destIP)) {
      return true;
    }
    
    // Check excluded ports
    if (packet.sourcePort && this.config.excludedPorts.includes(packet.sourcePort)) {
      return true;
    }
    if (packet.destPort && this.config.excludedPorts.includes(packet.destPort)) {
      return true;
    }
    
    // Check excluded protocols
    if (this.config.excludedProtocols.includes(packet.protocol.toLowerCase())) {
      return true;
    }
    
    return false;
  }

  private matchesSeverityThreshold(severity: AlertSeverity): boolean {
    const thresholdNum = severityToNumber(this.config.alertThreshold);
    const alertNum = severityToNumber(severity);
    return alertNum >= thresholdNum;
  }

  private getStreamId(packet: AttackPacket): string {
    const src = `${packet.sourceIP}:${packet.sourcePort || 0}`;
    const dst = `${packet.destIP}:${packet.destPort || 0}`;
    // Sort to ensure consistent ID regardless of direction
    return [src, dst].sort().join('-');
  }

  private updateStream(streamId: string, packet: AttackPacket): void {
    if (!this.config.streamReassembly) return;
    
    let stream = this.streams.get(streamId);
    
    if (!stream) {
      stream = {
        packets: [],
        established: false,
        lastActivity: Date.now(),
      };
      this.streams.set(streamId, stream);
    }
    
    stream.packets.push(packet);
    stream.lastActivity = Date.now();
    
    // Limit stored packets
    if (stream.packets.length > 100) {
      stream.packets = stream.packets.slice(-50);
    }
    
    // Check for established connection (simplified)
    if (packet.flags?.includes('ACK') && stream.packets.length >= 3) {
      stream.established = true;
    }
  }

  private getStreamData(streamId: string): string {
    const stream = this.streams.get(streamId);
    if (!stream) return '';
    
    return stream.packets
      .map(p => p.payload || '')
      .filter(Boolean)
      .join('');
  }

  private startStreamCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [id, stream] of this.streams) {
        if (now - stream.lastActivity > this.config.streamTimeout) {
          this.streams.delete(id);
        }
      }
      
      // Also clean up old dedup entries
      for (const [key, timestamp] of this.recentAlerts) {
        if (now - timestamp > this.config.deduplicationWindow * 1000) {
          this.recentAlerts.delete(key);
        }
      }
    }, 10000);
  }

  private createAlert(
    rule: IDSRule,
    context: PacketContext,
    method: DetectionMethod
  ): IDSAlert {
    const { packet } = context;
    
    return {
      id: generateId(),
      timestamp: Date.now(),
      ruleId: rule.id,
      ruleName: rule.name,
      ruleSID: rule.options.sid,
      severity: rule.severity,
      category: rule.category,
      message: rule.options.msg,
      description: rule.description,
      sourceIP: packet.sourceIP,
      sourcePort: packet.sourcePort,
      destIP: packet.destIP,
      destPort: packet.destPort,
      protocol: packet.protocol,
      status: 'new',
      packet: this.capturePacketInfo(packet),
      sessionId: context.sessionId,
      confidence: rule.performance?.falsePositiveRate 
        ? 1 - rule.performance.falsePositiveRate 
        : undefined,
      mitreAttack: rule.options.metadata?.mitreAttack?.tactic && rule.options.metadata?.mitreAttack?.technique 
        ? {
            tactic: rule.options.metadata.mitreAttack.tactic,
            technique: rule.options.metadata.mitreAttack.technique,
            subtechnique: rule.options.metadata.mitreAttack.subtechnique,
          }
        : undefined,
    };
  }

  private capturePacketInfo(packet: AttackPacket): AlertPacketInfo {
    return {
      timestamp: packet.timestamp,
      protocol: packet.protocol,
      sourceIP: packet.sourceIP,
      sourcePort: packet.sourcePort,
      destIP: packet.destIP,
      destPort: packet.destPort,
      sourceMAC: packet.sourceMAC,
      destMAC: packet.destMAC,
      length: packet.size,
      flags: Array.isArray(packet.flags) ? packet.flags.join(',') : packet.flags,
      payload: this.config.logPayloads ? packet.payload : undefined,
    };
  }

  private initializeStatistics(): IDSStatistics {
    return {
      startTime: 0,
      uptime: 0,
      packetsAnalyzed: 0,
      packetsDropped: 0,
      bytesAnalyzed: 0,
      avgLatency: 0,
      maxLatency: 0,
      packetsPerSecond: 0,
      alertsGenerated: 0,
      alertsBySeverity: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0,
      },
      alertsByCategory: {},
      packetsBlocked: 0,
      connectionsReset: 0,
      ipsActions: 0,
      rulesLoaded: 0,
      rulesMatched: 0,
      topTriggeredRules: [],
      errors: 0,
    };
  }

  private updateLatencyStats(latency: number): void {
    const stats = this.statistics;
    const count = stats.packetsAnalyzed;
    
    // Running average
    stats.avgLatency = (stats.avgLatency * (count - 1) + latency) / count;
    stats.maxLatency = Math.max(stats.maxLatency, latency);
    
    // Update uptime and PPS
    stats.uptime = Date.now() - stats.startTime;
    if (stats.uptime > 0) {
      stats.packetsPerSecond = (stats.packetsAnalyzed / stats.uptime) * 1000;
    }
  }

  // ============================================================================
  // Alert Management
  // ============================================================================

  getAlert(alertId: string): IDSAlert | undefined {
    return this.alerts.get(alertId);
  }

  getAlerts(): IDSAlert[] {
    return Array.from(this.alerts.values());
  }

  getAlertsBySeverity(severity: AlertSeverity): IDSAlert[] {
    return this.getAlerts().filter(a => a.severity === severity);
  }

  getAlertsByCategory(category: RuleCategory): IDSAlert[] {
    return this.getAlerts().filter(a => a.category === category);
  }

  acknowledgeAlert(alertId: string, user?: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.status = 'acknowledged';
      alert.acknowledgedBy = user;
      alert.acknowledgedAt = Date.now();
      this.emit('alert:acknowledged', alert);
    }
  }

  resolveAlert(alertId: string, user?: string, notes?: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.status = 'resolved';
      alert.resolvedBy = user;
      alert.resolvedAt = Date.now();
      if (notes) {
        alert.notes = [...(alert.notes || []), notes];
      }
      this.emit('alert:resolved', alert);
    }
  }

  markFalsePositive(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.status = 'false_positive';
      alert.isFalsePositive = true;
      this.emit('alert:updated', alert);
    }
  }

  clearAlerts(): void {
    this.alerts.clear();
  }

  // ============================================================================
  // Baseline Management
  // ============================================================================

  setBaseline(baseline: NetworkBaseline): void {
    this.baseline = baseline;
  }

  getBaseline(): NetworkBaseline | null {
    return this.baseline;
  }

  // ============================================================================
  // Statistics
  // ============================================================================

  getStatistics(): IDSStatistics {
    return { ...this.statistics };
  }

  resetStatistics(): void {
    this.statistics = this.initializeStatistics();
    this.statistics.startTime = Date.now();
    this.statistics.rulesLoaded = this.rules.size;
  }

  // ============================================================================
  // Event System
  // ============================================================================

  on(event: IDSEventType, callback: IDSEventCallback): void {
    this.emitter.on(event, callback);
  }

  off(event: IDSEventType, callback: IDSEventCallback): void {
    this.emitter.off(event, callback);
  }

  private emit(event: IDSEventType, data: unknown): void {
    this.emitter.emit(event, data);
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let idsEngineInstance: IDSEngine | null = null;

export function getIDSEngine(): IDSEngine {
  if (!idsEngineInstance) {
    idsEngineInstance = new IDSEngine();
  }
  return idsEngineInstance;
}

export function resetIDSEngine(): void {
  if (idsEngineInstance) {
    idsEngineInstance.destroy();
    idsEngineInstance = null;
  }
}
