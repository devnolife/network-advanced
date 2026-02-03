/**
 * Firewall/ACL Types
 * 
 * Type definitions for the Firewall and Access Control List engine.
 * Network Security Virtual Lab - Educational Platform
 */

// ============================================================================
// ACL Types
// ============================================================================

export type ACLAction = 'permit' | 'deny';
export type ACLProtocol = 'ip' | 'tcp' | 'udp' | 'icmp' | 'any';
export type ACLDirection = 'in' | 'out';
export type ACLType = 'standard' | 'extended' | 'named';

export interface ACLPortRange {
  start: number;
  end: number;
}

export type ACLPort = number | ACLPortRange | 'any';

export interface ACLSource {
  ip: string;           // IP address or 'any'
  wildcard?: string;    // Wildcard mask (e.g., '0.0.0.255')
  port?: ACLPort;       // For extended ACL
}

export interface ACLDestination {
  ip: string;
  wildcard?: string;
  port?: ACLPort;
}

export interface ACLRule {
  id: string;
  sequence: number;     // Rule order (lower = evaluated first)
  name?: string;        // For named ACL
  action: ACLAction;
  protocol: ACLProtocol;
  source: ACLSource;
  destination: ACLDestination;
  
  // Extended ACL options
  established?: boolean;  // Match established connections
  log?: boolean;          // Log matches
  
  // Time-based ACL
  timeRange?: {
    name: string;
    startTime: string;    // HH:MM format
    endTime: string;
    days?: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[];
  };
  
  // Metadata
  description?: string;
  hitCount: number;
  lastHit?: number;       // Timestamp
  enabled: boolean;
  createdAt: number;
}

export interface ACL {
  id: string;
  name: string;
  type: ACLType;
  rules: ACLRule[];
  description?: string;
  appliedTo?: {
    interface: string;
    direction: ACLDirection;
  }[];
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// Firewall Types
// ============================================================================

export type FirewallMode = 'stateless' | 'stateful';
export type FirewallAction = 'allow' | 'deny' | 'drop' | 'reject' | 'log';

export interface SecurityZone {
  id: string;
  name: string;
  description?: string;
  trustLevel: number;     // 0-100, higher = more trusted
  interfaces: string[];
  defaultAction: FirewallAction;
}

export interface ZonePair {
  id: string;
  name: string;
  sourceZone: string;
  destZone: string;
  policy: string;         // Policy ID
  enabled: boolean;
}

export interface FirewallPolicy {
  id: string;
  name: string;
  description?: string;
  rules: FirewallRule[];
  defaultAction: FirewallAction;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface FirewallRule {
  id: string;
  sequence: number;
  name?: string;
  action: FirewallAction;
  
  // Match criteria
  sourceZone?: string;
  destZone?: string;
  protocol: ACLProtocol | 'all';
  source: ACLSource;
  destination: ACLDestination;
  
  // Application layer (NGFW)
  application?: string[];   // e.g., ['http', 'https', 'ssh']
  urlCategory?: string[];   // e.g., ['social-media', 'streaming']
  
  // Deep Packet Inspection
  contentMatch?: {
    pattern: string;
    type: 'string' | 'regex' | 'hex';
  };
  
  // Stateful options
  trackState?: boolean;
  established?: boolean;
  related?: boolean;
  
  // Logging and alerts
  log?: boolean;
  logLevel?: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  alert?: boolean;
  
  // Scheduling
  schedule?: {
    startTime: string;
    endTime: string;
    days: string[];
  };
  
  // Metadata
  description?: string;
  hitCount: number;
  bytesMatched: number;
  lastHit?: number;
  enabled: boolean;
  createdAt: number;
}

// ============================================================================
// Connection Tracking (Stateful)
// ============================================================================

export type ConnectionState = 
  | 'new'
  | 'established'
  | 'related'
  | 'invalid'
  | 'time_wait'
  | 'close_wait'
  | 'closed';

export interface ConnectionEntry {
  id: string;
  protocol: ACLProtocol;
  sourceIP: string;
  sourcePort: number;
  destIP: string;
  destPort: number;
  state: ConnectionState;
  
  // TCP specific
  tcpState?: 'syn_sent' | 'syn_recv' | 'established' | 'fin_wait' | 'time_wait' | 'close';
  
  // Timing
  createdAt: number;
  lastSeen: number;
  timeout: number;        // ms until expiration
  
  // Statistics
  packetsIn: number;
  packetsOut: number;
  bytesIn: number;
  bytesOut: number;
}

// ============================================================================
// NAT Types
// ============================================================================

export type NATType = 'static' | 'dynamic' | 'pat' | 'destination';

export interface NATRule {
  id: string;
  type: NATType;
  name?: string;
  
  // Inside (original)
  insideLocal: string;      // Original source IP
  insideGlobal?: string;    // Translated source IP (for static)
  
  // Outside (destination)
  outsideLocal?: string;    // Original destination IP
  outsideGlobal?: string;   // Translated destination IP
  
  // For PAT
  portRange?: {
    start: number;
    end: number;
  };
  
  // For dynamic NAT
  pool?: {
    name: string;
    startIP: string;
    endIP: string;
    netmask: string;
  };
  
  // Access list for matching
  aclId?: string;
  
  // Interfaces
  insideInterface?: string;
  outsideInterface?: string;
  
  // Options
  overload?: boolean;       // PAT overload
  extendable?: boolean;
  
  enabled: boolean;
  description?: string;
  hitCount: number;
  createdAt: number;
}

export interface NATTranslation {
  id: string;
  ruleId: string;
  protocol: ACLProtocol;
  
  insideLocal: string;
  insideLocalPort: number;
  insideGlobal: string;
  insideGlobalPort: number;
  
  outsideLocal: string;
  outsideLocalPort: number;
  outsideGlobal: string;
  outsideGlobalPort: number;
  
  state: 'active' | 'expired';
  createdAt: number;
  lastUsed: number;
  timeout: number;
}

// ============================================================================
// Firewall Statistics
// ============================================================================

export interface FirewallStatistics {
  packetsProcessed: number;
  packetsAllowed: number;
  packetsDenied: number;
  packetsDropped: number;
  bytesProcessed: number;
  
  connectionsActive: number;
  connectionsTotal: number;
  
  natTranslationsActive: number;
  natTranslationsTotal: number;
  
  rulesMatched: number;
  defaultActionHits: number;
  
  topBlockedSources: { ip: string; count: number }[];
  topBlockedPorts: { port: number; count: number }[];
  
  startTime: number;
  lastUpdated: number;
}

// ============================================================================
// Firewall Configuration
// ============================================================================

export interface FirewallConfig {
  mode: FirewallMode;
  defaultAction: FirewallAction;
  
  // Stateful inspection
  enableStatefulInspection: boolean;
  connectionTimeout: number;        // Default connection timeout (ms)
  tcpTimeout: number;
  udpTimeout: number;
  icmpTimeout: number;
  
  // Limits
  maxConnections: number;
  maxRulesPerPolicy: number;
  
  // Logging
  logAllowed: boolean;
  logDenied: boolean;
  logLevel: 'debug' | 'info' | 'warning' | 'error';
  
  // NAT
  enableNAT: boolean;
  natPoolSize: number;
  patPortRangeStart: number;
  patPortRangeEnd: number;
  
  // Advanced
  enableDPI: boolean;               // Deep Packet Inspection
  enableApplicationControl: boolean;
  enableURLFiltering: boolean;
  
  // Anti-spoofing
  enableAntiSpoofing: boolean;
  bogonBlocking: boolean;           // Block bogon IPs
}

// ============================================================================
// Events
// ============================================================================

export interface FirewallEvent {
  id: string;
  timestamp: number;
  type: 'packet_allowed' | 'packet_denied' | 'packet_dropped' | 
        'connection_new' | 'connection_closed' | 'connection_timeout' |
        'nat_created' | 'nat_expired' | 'rule_matched' | 'policy_violation';
  
  ruleId?: string;
  policyId?: string;
  
  sourceIP: string;
  sourcePort?: number;
  destIP: string;
  destPort?: number;
  protocol: string;
  
  action: FirewallAction;
  message: string;
  
  packetSize?: number;
  connectionId?: string;
  natTranslationId?: string;
}

// ============================================================================
// Packet for Firewall Processing
// ============================================================================

export interface FirewallPacket {
  id: string;
  timestamp: number;
  
  // Layer 2
  sourceMAC: string;
  destMAC: string;
  
  // Layer 3
  sourceIP: string;
  destIP: string;
  protocol: ACLProtocol;
  ttl: number;
  
  // Layer 4
  sourcePort?: number;
  destPort?: number;
  tcpFlags?: string[];
  
  // Payload
  payload?: string;
  payloadSize: number;
  
  // Metadata
  interface: string;
  direction: ACLDirection;
  zone?: string;
}
