/**
 * Attack Simulation Types
 * 
 * Comprehensive type definitions for network attack simulations
 * Used for educational purposes in the Network Security Virtual Lab
 */

// ============================================================================
// Core Attack Types
// ============================================================================

export type AttackCategory = 
  | 'reconnaissance'    // Information gathering (port scan, network discovery)
  | 'spoofing'          // Identity/address spoofing (ARP, DNS, IP)
  | 'denial-of-service' // DoS/DDoS attacks (SYN flood, UDP flood)
  | 'man-in-the-middle' // MITM attacks
  | 'injection'         // Packet injection attacks
  | 'exploitation';     // Vulnerability exploitation

export type AttackType =
  | 'arp-spoofing'
  | 'dns-poisoning'
  | 'port-scan'
  | 'syn-flood'
  | 'udp-flood'
  | 'icmp-flood'
  | 'mitm'
  | 'dhcp-starvation'
  | 'mac-flooding'
  | 'vlan-hopping'
  | 'smurf-attack'
  | 'ping-of-death';

export type AttackStatus = 
  | 'idle'
  | 'preparing'
  | 'running'
  | 'paused'
  | 'completed'
  | 'detected'
  | 'blocked';

export type AttackSeverity = 'low' | 'medium' | 'high' | 'critical';

// ============================================================================
// Attack Configuration
// ============================================================================

export interface AttackTarget {
  ip: string;
  mac?: string;
  hostname?: string;
  port?: number;
  ports?: number[];
}

export interface AttackSource {
  ip: string;
  mac: string;
  hostname?: string;
  spoofedIp?: string;
  spoofedMac?: string;
}

export interface BaseAttackConfig {
  id: string;
  type: AttackType;
  category: AttackCategory;
  name: string;
  description: string;
  source: AttackSource;
  target: AttackTarget;
  duration?: number; // milliseconds, undefined = until stopped
  intensity: 'low' | 'medium' | 'high';
  stealthy?: boolean; // Try to avoid detection
}

// ============================================================================
// Specific Attack Configurations
// ============================================================================

export interface ARPSpoofingConfig extends BaseAttackConfig {
  type: 'arp-spoofing';
  category: 'spoofing';
  mode: 'one-way' | 'two-way'; // One-way or bidirectional
  gateway: {
    ip: string;
    mac: string;
  };
  arpInterval: number; // ms between ARP replies
  gratuitousArp: boolean; // Send gratuitous ARP packets
}

export interface DNSPoisoningConfig extends BaseAttackConfig {
  type: 'dns-poisoning';
  category: 'spoofing';
  targetDomains: string[]; // Domains to poison
  spoofedRecords: {
    domain: string;
    type: 'A' | 'AAAA' | 'CNAME' | 'MX';
    value: string;
    ttl: number;
  }[];
  cachePoison: boolean; // Attempt to poison DNS cache
  transactionIdGuessing: boolean; // Try to guess TXID
}

export interface PortScanConfig extends BaseAttackConfig {
  type: 'port-scan';
  category: 'reconnaissance';
  scanType: 'tcp-connect' | 'syn' | 'fin' | 'xmas' | 'null' | 'udp' | 'ack';
  portRange: {
    start: number;
    end: number;
  };
  commonPortsOnly?: boolean;
  timing: 'paranoid' | 'sneaky' | 'polite' | 'normal' | 'aggressive' | 'insane';
  serviceDetection: boolean;
  osDetection: boolean;
}

export interface SYNFloodConfig extends BaseAttackConfig {
  type: 'syn-flood';
  category: 'denial-of-service';
  packetsPerSecond: number;
  randomSourceIP: boolean;
  randomSourcePort: boolean;
  targetPorts: number[];
  tcpFlags: {
    syn: boolean;
    ack: boolean;
    fin: boolean;
    rst: boolean;
    psh: boolean;
    urg: boolean;
  };
}

export interface UDPFloodConfig extends BaseAttackConfig {
  type: 'udp-flood';
  category: 'denial-of-service';
  packetsPerSecond: number;
  packetSize: number;
  randomSourceIP: boolean;
  targetPorts: number[];
  amplification?: {
    enabled: boolean;
    protocol: 'dns' | 'ntp' | 'memcached' | 'ssdp';
  };
}

export interface MITMConfig extends BaseAttackConfig {
  type: 'mitm';
  category: 'man-in-the-middle';
  technique: 'arp-spoofing' | 'dns-spoofing' | 'dhcp-spoofing' | 'icmp-redirect';
  interceptProtocols: ('http' | 'dns' | 'ftp' | 'telnet' | 'smtp')[];
  sslStripping: boolean;
  packetModification: boolean;
  credentialCapture: boolean;
  injectionRules?: {
    protocol: string;
    pattern: string;
    replacement: string;
  }[];
}

export interface DHCPStarvationConfig extends BaseAttackConfig {
  type: 'dhcp-starvation';
  category: 'denial-of-service';
  requestsPerSecond: number;
  randomMAC: boolean;
  exhaustPool: boolean;
  rogueServer?: {
    enabled: boolean;
    offerIP: string;
    gateway: string;
    dns: string;
    lease: number;
  };
}

export interface MACFloodingConfig extends BaseAttackConfig {
  type: 'mac-flooding';
  category: 'denial-of-service';
  packetsPerSecond: number;
  randomMAC: boolean;
  targetSwitch?: string;
}

export type AttackConfig = 
  | ARPSpoofingConfig
  | DNSPoisoningConfig
  | PortScanConfig
  | SYNFloodConfig
  | UDPFloodConfig
  | MITMConfig
  | DHCPStarvationConfig
  | MACFloodingConfig;

// ============================================================================
// Attack Events and Results
// ============================================================================

export interface AttackEvent {
  id: string;
  attackId: string;
  timestamp: number;
  type: 'packet-sent' | 'packet-received' | 'target-response' | 'detection' | 'success' | 'failure' | 'info';
  severity: AttackSeverity;
  message: string;
  data?: Record<string, unknown>;
  packet?: AttackPacket;
}

export interface AttackPacket {
  id: string;
  timestamp: number;
  direction: 'outbound' | 'inbound';
  protocol: string;
  sourceIP: string;
  sourceMAC: string;
  sourcePort?: number;
  destIP: string;
  destMAC: string;
  destPort?: number;
  size: number;
  flags?: string[];
  payload?: string;
  isSpoofed: boolean;
  isMalicious: boolean;
}

export interface PortScanResult {
  port: number;
  protocol: 'tcp' | 'udp';
  state: 'open' | 'closed' | 'filtered' | 'open|filtered';
  service?: string;
  version?: string;
  responseTime?: number;
}

export interface AttackStatistics {
  packetsSent: number;
  packetsReceived: number;
  bytesTransferred: number;
  successRate: number;
  detectionEvents: number;
  startTime: number;
  endTime?: number;
  duration: number;
  peakPacketsPerSecond: number;
  averageLatency: number;
}

export interface AttackResult {
  attackId: string;
  attackType: AttackType;
  status: AttackStatus;
  startTime: number;
  endTime?: number;
  statistics: AttackStatistics;
  events: AttackEvent[];
  portScanResults?: PortScanResult[];
  capturedCredentials?: CapturedCredential[];
  poisonedHosts?: PoisonedHost[];
  interceptedPackets?: AttackPacket[];
  detected: boolean;
  blocked: boolean;
  detectionMethod?: string;
}

// ============================================================================
// MITM Specific Types
// ============================================================================

export interface CapturedCredential {
  id: string;
  timestamp: number;
  protocol: string;
  sourceIP: string;
  destIP: string;
  username?: string;
  password?: string;
  authType: 'basic' | 'digest' | 'ntlm' | 'form' | 'other';
  url?: string;
  rawData?: string;
}

export interface PoisonedHost {
  ip: string;
  mac: string;
  hostname?: string;
  originalGatewayMAC: string;
  poisonedAt: number;
  lastPoisonPacket: number;
  isActive: boolean;
}

export interface InterceptedSession {
  id: string;
  protocol: string;
  sourceIP: string;
  destIP: string;
  startTime: number;
  lastActivity: number;
  packetsIntercepted: number;
  bytesIntercepted: number;
  isSecure: boolean;
  sslStripped: boolean;
}

// ============================================================================
// Detection and Defense
// ============================================================================

export type DetectionMethod = 
  | 'arp-inspection'
  | 'rate-limiting'
  | 'anomaly-detection'
  | 'signature-based'
  | 'behavioral-analysis'
  | 'port-security'
  | 'dhcp-snooping'
  | 'ip-source-guard';

export interface DetectionRule {
  id: string;
  name: string;
  method: DetectionMethod;
  enabled: boolean;
  sensitivity: 'low' | 'medium' | 'high';
  attackTypes: AttackType[];
  threshold?: number;
  timeWindow?: number; // ms
  action: 'alert' | 'block' | 'alert-and-block';
}

export interface DetectionAlert {
  id: string;
  timestamp: number;
  rule: DetectionRule;
  attackType: AttackType;
  severity: AttackSeverity;
  sourceIP: string;
  sourceMAC?: string;
  targetIP?: string;
  description: string;
  evidence: {
    packets: AttackPacket[];
    anomalies: string[];
  };
  blocked: boolean;
  acknowledged: boolean;
}

export interface DefenseAction {
  id: string;
  timestamp: number;
  type: 'block-ip' | 'block-mac' | 'rate-limit' | 'quarantine' | 'reset-connection' | 'arp-correction';
  target: string;
  duration?: number;
  reason: string;
  automatic: boolean;
  effectiveUntil?: number;
}

// ============================================================================
// Attack Templates (Predefined Scenarios)
// ============================================================================

export interface AttackTemplate {
  id: string;
  name: string;
  description: string;
  category: AttackCategory;
  attackType: AttackType;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  educationalContent: {
    overview: string;
    howItWorks: string[];
    impact: string[];
    prevention: string[];
    detection: string[];
    realWorldExamples?: string[];
  };
  defaultConfig: Partial<AttackConfig>;
  requiredKnowledge: string[];
  relatedAttacks: AttackType[];
  cvssScore?: number;
  mitreAttackId?: string; // MITRE ATT&CK technique ID
}

// ============================================================================
// Network State for Attacks
// ============================================================================

export interface NetworkNode {
  id: string;
  type: 'pc' | 'router' | 'switch' | 'server' | 'firewall' | 'attacker';
  name: string;
  ip: string;
  mac: string;
  x?: number; // Position for visualization
  y?: number; // Position for visualization
  gateway?: string;
  subnet?: string;
  isCompromised: boolean;
  isTarget: boolean;
  isAttacker: boolean;
  services?: {
    port: number;
    protocol: 'tcp' | 'udp';
    service: string;
    version?: string;
    vulnerable?: boolean;
  }[];
  arpCache?: Map<string, string>; // IP -> MAC
  dnsCache?: Map<string, string>; // Domain -> IP
}

export interface NetworkTopology {
  nodes: NetworkNode[];
  links: {
    source: string;
    target: string;
    type: 'ethernet' | 'wifi' | 'wan';
    bandwidth?: number;
    latency?: number;
  }[];
  vlans?: {
    id: number;
    name: string;
    nodes: string[];
  }[];
}

// ============================================================================
// Attack Simulation Session
// ============================================================================

export interface AttackSession {
  id: string;
  labId?: string;
  userId?: string;
  startTime: number;
  endTime?: number;
  topology: NetworkTopology;
  attacks: AttackResult[];
  detectionAlerts: DetectionAlert[];
  defenseActions: DefenseAction[];
  learningObjectives?: string[];
  score?: number;
  feedback?: string[];
}

// ============================================================================
// Event Emitter Types
// ============================================================================

export interface AttackEventMap {
  'attack:start': AttackConfig;
  'attack:stop': { attackId: string; reason: string };
  'attack:pause': { attackId: string };
  'attack:resume': { attackId: string };
  'attack:complete': AttackResult;
  'attack:event': AttackEvent;
  'attack:packet': AttackPacket;
  'attack:detected': DetectionAlert;
  'attack:blocked': DefenseAction;
  'scan:progress': { attackId: string; progress: number; portsScanned: number; totalPorts: number };
  'scan:result': { attackId: string; result: PortScanResult };
  'mitm:credential': CapturedCredential;
  'mitm:intercept': AttackPacket;
  'poison:success': PoisonedHost;
  'poison:failure': { target: string; reason: string };
}

export type AttackEventHandler<K extends keyof AttackEventMap> = (data: AttackEventMap[K]) => void;
