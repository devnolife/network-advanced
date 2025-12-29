// Network Simulation Core Types

export type DeviceType = 'router' | 'switch' | 'firewall' | 'pc' | 'ids' | 'server';
export type InterfaceStatus = 'up' | 'down' | 'admin-down';
export type ProtocolType = 'tcp' | 'udp' | 'icmp' | 'arp' | 'esp' | 'ah' | 'ike';
export type FirewallAction = 'allow' | 'deny' | 'drop' | 'reject';

// IP Address Types
export interface IPv4Address {
  octets: [number, number, number, number];
  toString(): string;
  toNumber(): number;
}

export interface MACAddress {
  bytes: [number, number, number, number, number, number];
  toString(): string;
}

// Network Interface
export interface NetworkInterface {
  id: string;
  name: string;
  macAddress: MACAddress;
  ipAddress?: IPv4Address;
  subnetMask?: IPv4Address;
  status: InterfaceStatus;
  speed: number; // Mbps
  mtu: number;
  connectedTo?: string; // Device ID
  connectedInterface?: string; // Interface name
}

// Packet Structures
export interface EthernetFrame {
  destinationMAC: MACAddress;
  sourceMAC: MACAddress;
  etherType: number;
  payload: IPPacket | ARPPacket;
  fcs?: number; // Frame Check Sequence
}

export interface IPPacket {
  version: 4;
  ihl: number;
  dscp: number;
  ecn: number;
  totalLength: number;
  identification: number;
  flags: {
    reserved: boolean;
    dontFragment: boolean;
    moreFragments: boolean;
  };
  fragmentOffset: number;
  ttl: number;
  protocol: number; // 1=ICMP, 6=TCP, 17=UDP, 50=ESP, 51=AH
  headerChecksum: number;
  sourceIP: IPv4Address;
  destinationIP: IPv4Address;
  options?: Uint8Array;
  payload: TCPSegment | UDPDatagram | ICMPPacket | ESPPacket | AHPacket;
}

export interface ARPPacket {
  hardwareType: number;
  protocolType: number;
  hardwareSize: number;
  protocolSize: number;
  opcode: 'request' | 'reply';
  senderMAC: MACAddress;
  senderIP: IPv4Address;
  targetMAC: MACAddress;
  targetIP: IPv4Address;
}

export interface TCPSegment {
  sourcePort: number;
  destinationPort: number;
  sequenceNumber: number;
  acknowledgmentNumber: number;
  dataOffset: number;
  flags: {
    urg: boolean;
    ack: boolean;
    psh: boolean;
    rst: boolean;
    syn: boolean;
    fin: boolean;
  };
  window: number;
  checksum: number;
  urgentPointer: number;
  options?: Uint8Array;
  data?: Uint8Array;
}

export interface UDPDatagram {
  sourcePort: number;
  destinationPort: number;
  length: number;
  checksum: number;
  data?: Uint8Array;
}

export interface ICMPPacket {
  type: number;
  code: number;
  checksum: number;
  data?: Uint8Array;
}

// IPSec Types
export interface ESPPacket {
  spi: number;
  sequenceNumber: number;
  iv?: Uint8Array;
  encryptedPayload: Uint8Array;
  padding?: Uint8Array;
  padLength: number;
  nextHeader: number;
  authData?: Uint8Array;
}

export interface AHPacket {
  nextHeader: number;
  payloadLength: number;
  reserved: number;
  spi: number;
  sequenceNumber: number;
  icv: Uint8Array;
  payload: IPPacket;
}

export interface IKEConfig {
  version: 1 | 2;
  encryptionAlgorithm: 'aes' | 'des' | '3des';
  hashAlgorithm: 'sha1' | 'sha256' | 'sha384' | 'sha512' | 'md5';
  dhGroup: number;
  lifetime: number;
  authMethod: 'pre-shared-key' | 'rsa' | 'ecdsa';
}

export interface IPSecConfig {
  ikePolicy: IKEConfig;
  preSharedKey?: string;
  peerAddress: IPv4Address;
  localNetwork: { address: IPv4Address; mask: IPv4Address };
  remoteNetwork: { address: IPv4Address; mask: IPv4Address };
  transformSet: {
    encapsulation: 'esp' | 'ah' | 'esp-ah';
    encryptionAlgorithm?: 'aes-128' | 'aes-256' | 'des' | '3des';
    hashAlgorithm: 'sha1' | 'sha256' | 'sha384' | 'sha512' | 'md5';
    mode: 'tunnel' | 'transport';
  };
  perfectForwardSecrecy: boolean;
  lifetime: number;
}

export interface IPSecSA {
  spi: number;
  protocol: 'esp' | 'ah';
  encryptionKey?: Uint8Array;
  authKey?: Uint8Array;
  iv?: Uint8Array;
  sequenceNumber: number;
  lifetime: number;
  bytesTransmitted: number;
  packetsTransmitted: number;
}

// Routing Types
export interface RouteEntry {
  destination: IPv4Address;
  mask: IPv4Address;
  nextHop?: IPv4Address;
  interface: string;
  metric: number;
  source: 'connected' | 'static' | 'ospf' | 'bgp' | 'rip';
  administrativeDistance: number;
  lastUpdate: number;
}

// ACL Types
export interface ACLRule {
  id: number;
  action: 'permit' | 'deny';
  protocol: 'ip' | 'tcp' | 'udp' | 'icmp' | number;
  sourceAddress?: IPv4Address;
  sourceMask?: IPv4Address;
  sourcePort?: { operator: 'eq' | 'lt' | 'gt' | 'range'; values: number[] };
  destinationAddress?: IPv4Address;
  destinationMask?: IPv4Address;
  destinationPort?: { operator: 'eq' | 'lt' | 'gt' | 'range'; values: number[] };
  established?: boolean;
  log?: boolean;
  matches: number;
}

export interface ACL {
  id: number | string;
  name: string;
  type: 'standard' | 'extended';
  rules: ACLRule[];
}

// Firewall Types
export interface FirewallRule {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  sourceZone: string;
  destinationZone: string;
  sourceAddress?: IPv4Address | 'any';
  destinationAddress?: IPv4Address | 'any';
  protocol?: 'tcp' | 'udp' | 'icmp' | 'any';
  destinationPort?: number;
  action: FirewallAction;
  log: boolean;
  matches: number;
}

export interface FirewallZone {
  name: string;
  interfaces: string[];
  policy: 'zone-based' | 'interface-based';
}

export interface FirewallSession {
  id: string;
  sourceIP: IPv4Address;
  sourcePort: number;
  destinationIP: IPv4Address;
  destinationPort: number;
  protocol: 'tcp' | 'udp';
  state: 'new' | 'established' | 'related' | 'invalid';
  packets: number;
  bytes: number;
  created: number;
  lastActivity: number;
  timeout: number;
}

// NAT Types
export interface NATRule {
  id: string;
  type: 'static' | 'dynamic' | 'pat';
  insideLocal: IPv4Address;
  insideGlobal: IPv4Address;
  outsideLocal?: IPv4Address;
  outsideGlobal?: IPv4Address;
  pool?: string;
  overload?: boolean;
  translations: number;
}

export interface NATTranslation {
  insideLocal: { ip: IPv4Address; port?: number };
  insideGlobal: { ip: IPv4Address; port?: number };
  outsideLocal?: { ip: IPv4Address; port?: number };
  outsideGlobal?: { ip: IPv4Address; port?: number };
  protocol: 'tcp' | 'udp' | 'icmp';
  timeout: number;
  created: number;
}

// IDS Types
export interface IDSSignature {
  id: number;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  protocol?: ProtocolType;
  sourcePort?: number;
  destinationPort?: number;
  content?: string;
  contentOffset?: number;
  pcre?: string;
  flags?: string;
  enabled: boolean;
  matches: number;
}

export interface IDSAlert {
  id: string;
  timestamp: number;
  signatureId: number;
  signatureName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  sourceIP: IPv4Address;
  sourcePort?: number;
  destinationIP: IPv4Address;
  destinationPort?: number;
  protocol: ProtocolType;
  payload?: Uint8Array;
  action: 'alert' | 'block';
}

// Simulation Event Types
export interface SimulationEvent {
  id: string;
  timestamp: number;
  type: 'packet-transmitted' | 'packet-received' | 'packet-dropped' | 
        'interface-up' | 'interface-down' | 'tunnel-established' | 
        'tunnel-down' | 'alert-generated' | 'config-changed';
  sourceDevice: string;
  destinationDevice?: string;
  data?: unknown;
}

// Simulation State
export interface SimulationState {
  id: string;
  name: string;
  status: 'running' | 'paused' | 'stopped';
  startTime: number;
  currentTime: number;
  devices: Map<string, DeviceState>;
  links: Link[];
  events: SimulationEvent[];
  statistics: SimulationStatistics;
}

export interface DeviceState {
  id: string;
  type: DeviceType;
  name: string;
  hostname: string;
  position: { x: number; y: number };
  interfaces: Map<string, NetworkInterface>;
  config: Record<string, unknown>;
  status: 'online' | 'offline' | 'booting';
}

export interface Link {
  id: string;
  sourceDevice: string;
  sourceInterface: string;
  destinationDevice: string;
  destinationInterface: string;
  status: 'up' | 'down';
  bandwidth: number; // Mbps
  latency: number; // ms
  packetLoss: number; // percentage
}

export interface SimulationStatistics {
  packetsTransmitted: number;
  packetsReceived: number;
  packetsDropped: number;
  bytesTransmitted: number;
  bytesReceived: number;
  vpnTunnelsActive: number;
  firewallRulesEvaluated: number;
  idsAlertsGenerated: number;
}

// Command Types
export interface CommandResult {
  success: boolean;
  output: string;
  error?: string;
  promptChange?: string;
}

export interface CLIContext {
  mode: 'user' | 'privileged' | 'config' | 'config-if' | 'config-line' | 
        'config-router' | 'config-acl' | 'config-crypto' | 'config-isakmp';
  currentInterface?: string;
  currentACL?: string;
  currentCryptoMap?: string;
}

// Lab Types
export interface LabDefinition {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  topology: TopologyDefinition;
  tasks: LabTask[];
  hints: LabHint[];
  timeLimit?: number;
  maxScore: number;
}

export interface TopologyDefinition {
  devices: {
    id: string;
    type: DeviceType;
    name: string;
    position: { x: number; y: number };
    initialConfig?: Record<string, unknown>;
  }[];
  links: {
    source: { device: string; interface: string };
    destination: { device: string; interface: string };
    bandwidth?: number;
    latency?: number;
  }[];
}

export interface LabTask {
  id: string;
  title: string;
  description: string;
  points: number;
  order: number;
  validation: TaskValidation;
  dependencies: string[];
}

export interface TaskValidation {
  type: 'config-check' | 'connectivity-test' | 'packet-capture' | 'manual';
  criteria: Record<string, unknown>;
}

export interface LabHint {
  id: string;
  taskId: string;
  order: number;
  content: string;
  pointCost: number;
}

export interface LabProgress {
  labId: string;
  userId: string;
  startedAt: number;
  completedTasks: string[];
  currentScore: number;
  hintsUsed: string[];
  savedState?: SimulationState;
}
