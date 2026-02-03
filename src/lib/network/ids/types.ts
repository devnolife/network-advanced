/**
 * IDS/IPS Types and Interfaces
 * 
 * Comprehensive type definitions for Intrusion Detection and Prevention Systems.
 * Modeled after real-world IDS/IPS systems like Snort, Suricata, and Zeek.
 * 
 * Network Security Virtual Lab - Educational Platform
 */

// ============================================================================
// Core Enums
// ============================================================================

/** Detection engine mode */
export type IDSMode = 'ids' | 'ips' | 'hybrid';

/** Rule action types */
export type RuleAction = 'alert' | 'log' | 'pass' | 'drop' | 'reject' | 'sdrop';

/** Alert severity levels */
export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/** Protocol types for rules */
export type RuleProtocol = 'tcp' | 'udp' | 'icmp' | 'ip' | 'arp' | 'dns' | 'http' | 'any';

/** Rule direction */
export type RuleDirection = 'to' | 'both';

/** Alert status */
export type AlertStatus = 'new' | 'acknowledged' | 'investigating' | 'resolved' | 'false_positive';

/** Rule category */
export type RuleCategory = 
  | 'malware'
  | 'exploit'
  | 'scan'
  | 'dos'
  | 'ddos'
  | 'web-attack'
  | 'brute-force'
  | 'policy-violation'
  | 'reconnaissance'
  | 'lateral-movement'
  | 'exfiltration'
  | 'command-control'
  | 'suspicious'
  | 'spoofing'
  | 'man-in-the-middle'
  | 'info';

/** Detection method */
export type DetectionMethod = 
  | 'signature'
  | 'anomaly'
  | 'heuristic'
  | 'behavioral'
  | 'statistical'
  | 'ml-based';

// ============================================================================
// Rule Definition Types
// ============================================================================

/** IP address specification for rules */
export interface RuleAddress {
  type: 'any' | 'single' | 'range' | 'cidr' | 'list' | 'variable';
  value: string;
  negated?: boolean;
}

/** Port specification for rules */
export interface RulePort {
  type: 'any' | 'single' | 'range' | 'list';
  value: string | number | number[];
  negated?: boolean;
}

/** Content match options */
export interface ContentMatch {
  pattern: string;
  nocase?: boolean;
  offset?: number;
  depth?: number;
  distance?: number;
  within?: number;
  rawbytes?: boolean;
  fast_pattern?: boolean;
}

/** PCRE (Perl Compatible Regular Expression) match */
export interface PCREMatch {
  pattern: string;
  modifiers?: string; // i, s, m, etc.
}

/** Byte test condition */
export interface ByteTest {
  bytes: number;
  operator: '<' | '>' | '=' | '!=' | '<=' | '>=' | '&' | '^';
  value: number;
  offset: number;
  relative?: boolean;
  endian?: 'big' | 'little';
}

/** Flow options for stateful detection */
export interface FlowOptions {
  established?: boolean;
  toServer?: boolean;
  toClient?: boolean;
  fromServer?: boolean;
  fromClient?: boolean;
  stateless?: boolean;
  noStream?: boolean;
  onlyStream?: boolean;
}

/** Threshold/rate limiting options */
export interface ThresholdOptions {
  type: 'limit' | 'threshold' | 'both';
  track: 'by_src' | 'by_dst' | 'by_rule' | 'by_both';
  count: number;
  seconds: number;
}

/** Rule metadata */
export interface RuleMetadata {
  author?: string;
  created?: string;
  updated?: string;
  cve?: string[];
  references?: string[];
  tags?: string[];
  mitreAttack?: {
    tactic?: string;
    technique?: string;
    subtechnique?: string;
  };
  affected?: string[];
  confidence?: number;
  impact?: string;
}

/** Rule options - detection logic */
export interface RuleOptions {
  // Message
  msg: string;
  
  // Content matching
  content?: ContentMatch[];
  pcre?: PCREMatch[];
  byteTest?: ByteTest[];
  
  // Flow control
  flow?: FlowOptions;
  
  // Flags and protocol specifics
  flags?: string; // TCP flags: S, A, F, R, P, U
  dsize?: string; // Payload size condition
  ttl?: string;   // TTL condition
  tos?: string;   // Type of service
  id?: number;    // IP ID field
  seq?: number;   // TCP sequence number
  ack?: number;   // TCP ack number
  window?: number; // TCP window size
  
  // HTTP specific
  httpMethod?: string;
  httpUri?: string;
  httpHeader?: string;
  httpCookie?: string;
  httpClientBody?: string;
  httpStatCode?: number;
  httpStatMsg?: string;
  
  // DNS specific
  dnsQuery?: string;
  
  // Thresholding
  threshold?: ThresholdOptions;
  
  // Classification and priority
  classtype?: string;
  priority?: number;
  
  // Metadata
  metadata?: RuleMetadata;
  
  // Revision
  sid: number;  // Signature ID
  rev?: number; // Revision number
  gid?: number; // Generator ID
}

/** Complete IDS/IPS Rule definition */
export interface IDSRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  
  // Rule header
  action: RuleAction;
  protocol: RuleProtocol;
  sourceAddress: RuleAddress;
  sourcePort: RulePort;
  direction: RuleDirection;
  destAddress: RuleAddress;
  destPort: RulePort;
  
  // Rule options
  options: RuleOptions;
  
  // Categorization
  category: RuleCategory;
  severity: AlertSeverity;
  
  // Detection method
  detectionMethod: DetectionMethod;
  
  // Performance
  performance?: {
    avgMatchTime?: number;
    falsePositiveRate?: number;
    hitCount?: number;
  };
  
  // Educational content
  educational?: {
    overview: string;
    whatItDetects: string;
    whyItMatters: string;
    example?: string;
    relatedRules?: string[];
  };
}

// ============================================================================
// Alert Types
// ============================================================================

/** Packet information captured with alert */
export interface AlertPacketInfo {
  timestamp: number;
  protocol: string;
  sourceIP: string;
  sourcePort?: number;
  destIP: string;
  destPort?: number;
  sourceMAC?: string;
  destMAC?: string;
  length: number;
  ttl?: number;
  flags?: string;
  payload?: string;
  rawHex?: string;
}

/** IDS/IPS Alert */
export interface IDSAlert {
  id: string;
  timestamp: number;
  
  // Rule that triggered
  ruleId: string;
  ruleName: string;
  ruleSID: number;
  
  // Classification
  severity: AlertSeverity;
  category: RuleCategory;
  
  // Alert details
  message: string;
  description?: string;
  
  // Network details
  sourceIP: string;
  sourcePort?: number;
  destIP: string;
  destPort?: number;
  protocol: string;
  
  // Status
  status: AlertStatus;
  acknowledgedBy?: string;
  acknowledgedAt?: number;
  resolvedBy?: string;
  resolvedAt?: number;
  notes?: string[];
  
  // Related data
  packet?: AlertPacketInfo;
  relatedAlerts?: string[];
  sessionId?: string;
  
  // Action taken (for IPS)
  actionTaken?: RuleAction;
  blocked?: boolean;
  
  // Analysis
  confidence?: number;
  isFalsePositive?: boolean;
  threatScore?: number;
  
  // MITRE ATT&CK mapping
  mitreAttack?: {
    tactic: string;
    technique: string;
    subtechnique?: string;
  };
}

// ============================================================================
// IPS Action Types
// ============================================================================

/** IPS blocking action */
export interface IPSAction {
  id: string;
  timestamp: number;
  
  // What triggered it
  alertId: string;
  ruleId: string;
  
  // Action details
  action: 'drop' | 'reject' | 'reset' | 'redirect' | 'quarantine';
  target: {
    ip?: string;
    port?: number;
    mac?: string;
    connection?: string;
  };
  
  // Duration
  duration?: number; // milliseconds, undefined = permanent
  expiresAt?: number;
  
  // Status
  active: boolean;
  reason: string;
  
  // Counters
  packetsBlocked: number;
  bytesBlocked: number;
}

/** IP blocklist entry */
export interface BlocklistEntry {
  id: string;
  ip: string;
  addedAt: number;
  expiresAt?: number;
  reason: string;
  ruleId?: string;
  alertId?: string;
  manual: boolean;
  hitCount: number;
  lastHit?: number;
}

// ============================================================================
// Engine Configuration
// ============================================================================

/** IDS/IPS Engine configuration */
export interface IDSConfig {
  // Mode
  mode: IDSMode;
  enabled: boolean;
  
  // Performance
  maxPacketSize: number;
  streamReassembly: boolean;
  maxStreams: number;
  streamTimeout: number;
  
  // Detection
  enableSignatureDetection: boolean;
  enableAnomalyDetection: boolean;
  enableHeuristicDetection: boolean;
  
  // Alerting
  alertThreshold: AlertSeverity;
  maxAlertsPerSecond: number;
  deduplicationWindow: number; // seconds
  
  // IPS specific
  defaultAction: RuleAction;
  blockDuration: number; // milliseconds
  autoBlockThreshold: number; // alerts before auto-block
  
  // Logging
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  logPackets: boolean;
  logPayloads: boolean;
  
  // Rule sets
  enabledRuleSets: string[];
  
  // Exclusions
  excludedIPs: string[];
  excludedPorts: number[];
  excludedProtocols: string[];
}

/** Anomaly detection configuration */
export interface AnomalyConfig {
  enabled: boolean;
  
  // Baseline thresholds
  baselineWindow: number; // seconds to build baseline
  
  // Traffic anomalies
  packetRateThreshold: number;
  byteRateThreshold: number;
  connectionRateThreshold: number;
  
  // Protocol anomalies
  detectProtocolAnomalies: boolean;
  detectPortAnomalies: boolean;
  detectPayloadAnomalies: boolean;
  
  // Sensitivity (0-1)
  sensitivity: number;
}

// ============================================================================
// Statistics and Metrics
// ============================================================================

/** Real-time IDS statistics */
export interface IDSStatistics {
  // Timing
  startTime: number;
  uptime: number;
  
  // Packet processing
  packetsAnalyzed: number;
  packetsDropped: number;
  bytesAnalyzed: number;
  
  // Performance
  avgLatency: number; // ms per packet
  maxLatency: number;
  packetsPerSecond: number;
  
  // Detection
  alertsGenerated: number;
  alertsBySeverity: Record<AlertSeverity, number>;
  alertsByCategory: Record<string, number>;
  
  // IPS actions
  packetsBlocked: number;
  connectionsReset: number;
  ipsActions: number;
  
  // Rules
  rulesLoaded: number;
  rulesMatched: number;
  topTriggeredRules: Array<{
    ruleId: string;
    count: number;
  }>;
  
  // Errors
  errors: number;
  lastError?: string;
}

/** Hourly statistics for trending */
export interface HourlyStats {
  hour: number; // 0-23
  alerts: number;
  blocked: number;
  packetsAnalyzed: number;
}

/** Daily statistics */
export interface DailyStats {
  date: string; // YYYY-MM-DD
  totalAlerts: number;
  alertsBySeverity: Record<AlertSeverity, number>;
  topAttackTypes: Array<{ category: string; count: number }>;
  topSourceIPs: Array<{ ip: string; count: number }>;
  topTargetIPs: Array<{ ip: string; count: number }>;
}

// ============================================================================
// Rule Sets and Profiles
// ============================================================================

/** Rule set (collection of related rules) */
export interface RuleSet {
  id: string;
  name: string;
  description: string;
  version: string;
  author?: string;
  
  // Rules
  rules: IDSRule[];
  ruleCount: number;
  
  // Categorization
  category: string;
  tags: string[];
  
  // Status
  enabled: boolean;
  isBuiltIn: boolean;
  lastUpdated?: number;
}

/** Detection profile (preset configurations) */
export interface DetectionProfile {
  id: string;
  name: string;
  description: string;
  
  // Configuration overrides
  mode: IDSMode;
  alertThreshold: AlertSeverity;
  sensitivity: 'low' | 'medium' | 'high' | 'paranoid';
  
  // Enabled rule categories
  enabledCategories: RuleCategory[];
  
  // Performance tuning
  maxAlertsPerSecond: number;
  
  // IPS behavior
  autoBlock: boolean;
  blockDuration: number;
}

// ============================================================================
// Event Types
// ============================================================================

/** IDS Engine events */
export type IDSEventType = 
  | 'engine:start'
  | 'engine:stop'
  | 'engine:error'
  | 'alert:new'
  | 'alert:updated'
  | 'alert:acknowledged'
  | 'alert:resolved'
  | 'action:block'
  | 'action:unblock'
  | 'rule:loaded'
  | 'rule:updated'
  | 'rule:triggered'
  | 'stats:updated'
  | 'anomaly:detected';

/** Generic IDS event */
export interface IDSEvent {
  type: IDSEventType;
  timestamp: number;
  data: unknown;
}

// ============================================================================
// Educational Content
// ============================================================================

/** Educational info about IDS/IPS concepts */
export interface IDSEducationalContent {
  concept: string;
  title: string;
  overview: string;
  details: string[];
  examples?: string[];
  bestPractices?: string[];
  commonMistakes?: string[];
  relatedConcepts?: string[];
  references?: string[];
}

// ============================================================================
// Analysis Types
// ============================================================================

/** Threat analysis result */
export interface ThreatAnalysis {
  alertId: string;
  timestamp: number;
  
  // Risk assessment
  riskScore: number; // 0-100
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'minimal';
  
  // Context
  attackStage?: 'reconnaissance' | 'weaponization' | 'delivery' | 'exploitation' | 'installation' | 'command-control' | 'actions';
  isPartOfCampaign?: boolean;
  relatedAlerts?: string[];
  
  // Recommendations
  recommendations: string[];
  immediateActions?: string[];
  
  // False positive likelihood
  falsePositiveLikelihood: number; // 0-1
  falsePositiveReasons?: string[];
}

/** Network baseline for anomaly detection */
export interface NetworkBaseline {
  id: string;
  createdAt: number;
  updatedAt: number;
  samplingPeriod: number; // seconds
  
  // Traffic patterns
  avgPacketsPerSecond: number;
  avgBytesPerSecond: number;
  avgConnectionsPerSecond: number;
  
  // Protocol distribution
  protocolDistribution: Record<string, number>;
  
  // Port usage
  commonPorts: number[];
  portDistribution: Record<number, number>;
  
  // IP patterns
  internalIPs: string[];
  commonExternalIPs: string[];
  
  // Time patterns
  hourlyPatterns: HourlyStats[];
}
