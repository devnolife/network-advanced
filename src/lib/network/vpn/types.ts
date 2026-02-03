/**
 * VPN/IPSec Types
 * 
 * Type definitions for VPN and IPSec simulation.
 * Includes IKE (Internet Key Exchange) and IPSec (ESP/AH) protocols.
 * 
 * Network Security Virtual Lab - Educational Platform
 */

// ============================================================================
// IKE (Internet Key Exchange) Types
// ============================================================================

export type IKEVersion = 'ikev1' | 'ikev2';
export type IKEMode = 'main' | 'aggressive';
export type IKEPhase = 'phase1' | 'phase2';

export type IKEState = 
  | 'idle'
  | 'initiating'
  | 'responding'
  | 'sa_init_sent'
  | 'sa_init_received'
  | 'auth_sent'
  | 'auth_received'
  | 'established'
  | 'rekeying'
  | 'deleting'
  | 'failed';

// Encryption algorithms
export type IKEEncryption = 
  | 'aes-128-cbc'
  | 'aes-192-cbc'
  | 'aes-256-cbc'
  | 'aes-128-gcm'
  | 'aes-256-gcm'
  | '3des-cbc'
  | 'des-cbc';

// Hash/PRF algorithms
export type IKEHash = 
  | 'sha1'
  | 'sha256'
  | 'sha384'
  | 'sha512'
  | 'md5';

// DH Groups
export type IKEDHGroup = 
  | 'group1'   // 768-bit MODP
  | 'group2'   // 1024-bit MODP
  | 'group5'   // 1536-bit MODP
  | 'group14'  // 2048-bit MODP
  | 'group15'  // 3072-bit MODP
  | 'group16'  // 4096-bit MODP
  | 'group19'  // 256-bit ECP
  | 'group20'  // 384-bit ECP
  | 'group21'; // 521-bit ECP

// Authentication methods
export type IKEAuthMethod = 
  | 'psk'           // Pre-shared Key
  | 'rsa-sig'       // RSA Digital Signature
  | 'ecdsa-256'     // ECDSA with P-256
  | 'ecdsa-384'     // ECDSA with P-384
  | 'eap';          // EAP Authentication

export interface IKEProposal {
  id: string;
  name: string;
  encryption: IKEEncryption;
  hash: IKEHash;
  dhGroup: IKEDHGroup;
  authMethod: IKEAuthMethod;
  lifetime: number;  // seconds
}

export interface IKESA {
  id: string;
  version: IKEVersion;
  initiatorSPI: string;
  responderSPI: string;
  localIP: string;
  remoteIP: string;
  state: IKEState;
  
  // Negotiated parameters
  proposal?: IKEProposal;
  
  // Keys (simulated - in reality these would be derived)
  skD?: string;   // SK_d - key derivation key
  skAi?: string;  // SK_ai - authentication key initiator
  skAr?: string;  // SK_ar - authentication key responder
  skEi?: string;  // SK_ei - encryption key initiator
  skEr?: string;  // SK_er - encryption key responder
  skPi?: string;  // SK_pi - PRF key initiator
  skPr?: string;  // SK_pr - PRF key responder
  
  // Timing
  createdAt: number;
  expiresAt: number;
  lastActivity: number;
  
  // Child SAs
  childSAs: string[];  // IPSec SA IDs
  
  // Statistics
  packetsIn: number;
  packetsOut: number;
  bytesIn: number;
  bytesOut: number;
}

// IKE Messages
export type IKEv2MessageType =
  | 'IKE_SA_INIT'
  | 'IKE_AUTH'
  | 'CREATE_CHILD_SA'
  | 'INFORMATIONAL';

export interface IKEMessage {
  id: string;
  timestamp: number;
  version: IKEVersion;
  messageType: IKEv2MessageType;
  initiatorSPI: string;
  responderSPI: string;
  isRequest: boolean;
  messageId: number;
  
  // Payloads (simplified)
  payloads: IKEPayload[];
  
  // For visualization
  direction: 'sent' | 'received';
  sourceIP: string;
  destIP: string;
}

export type IKEPayloadType =
  | 'SA'          // Security Association
  | 'KE'          // Key Exchange
  | 'IDi'         // Identification - Initiator
  | 'IDr'         // Identification - Responder
  | 'CERT'        // Certificate
  | 'CERTREQ'     // Certificate Request
  | 'AUTH'        // Authentication
  | 'NONCE'       // Nonce
  | 'N'           // Notify
  | 'D'           // Delete
  | 'V'           // Vendor ID
  | 'TSi'         // Traffic Selector - Initiator
  | 'TSr'         // Traffic Selector - Responder
  | 'SK'          // Encrypted and Authenticated
  | 'CP';         // Configuration

export interface IKEPayload {
  type: IKEPayloadType;
  data: Record<string, unknown>;
  description?: string;
}

// ============================================================================
// IPSec Types
// ============================================================================

export type IPSecProtocol = 'esp' | 'ah';
export type IPSecMode = 'tunnel' | 'transport';

export type IPSecState =
  | 'idle'
  | 'negotiating'
  | 'established'
  | 'rekeying'
  | 'expired'
  | 'deleted';

// ESP Encryption
export type ESPEncryption =
  | 'aes-128-cbc'
  | 'aes-192-cbc'
  | 'aes-256-cbc'
  | 'aes-128-gcm'
  | 'aes-256-gcm'
  | '3des-cbc'
  | 'null';  // For debugging/testing

// ESP/AH Authentication
export type IPSecAuth =
  | 'hmac-sha1-96'
  | 'hmac-sha256-128'
  | 'hmac-sha384-192'
  | 'hmac-sha512-256'
  | 'hmac-md5-96'
  | 'aes-xcbc-mac-96'
  | 'aes-gmac';  // For GCM mode

export interface IPSecProposal {
  id: string;
  name: string;
  protocol: IPSecProtocol;
  mode: IPSecMode;
  encryption?: ESPEncryption;  // Not used for AH
  authentication: IPSecAuth;
  lifetime: number;            // seconds
  lifetimeBytes?: number;      // bytes
  pfs?: IKEDHGroup;           // Perfect Forward Secrecy
}

export interface IPSecSA {
  id: string;
  ikeSAId: string;             // Parent IKE SA
  spi: string;                 // Security Parameter Index
  protocol: IPSecProtocol;
  mode: IPSecMode;
  direction: 'inbound' | 'outbound';
  state: IPSecState;
  
  // Endpoints
  localIP: string;
  remoteIP: string;
  
  // Tunnel mode endpoints (if tunnel mode)
  tunnelLocalIP?: string;
  tunnelRemoteIP?: string;
  
  // Traffic selectors
  trafficSelector: {
    localNetwork: string;      // CIDR
    remoteNetwork: string;     // CIDR
    protocol?: number;         // 0 = any
    localPort?: number;        // 0 = any
    remotePort?: number;       // 0 = any
  };
  
  // Negotiated parameters
  proposal?: IPSecProposal;
  
  // Keys (simulated)
  encryptionKey?: string;
  authenticationKey?: string;
  
  // Sequence numbers
  sequenceNumber: number;
  replayWindow: number[];      // Anti-replay window
  
  // Timing
  createdAt: number;
  expiresAt: number;
  lastUsed: number;
  
  // Statistics
  packetsEncrypted: number;
  packetsDecrypted: number;
  bytesEncrypted: number;
  bytesDecrypted: number;
  replayDropped: number;
  authFailed: number;
}

// ============================================================================
// VPN Tunnel Types
// ============================================================================

export type VPNType = 'site-to-site' | 'remote-access' | 'hub-spoke';
export type VPNStatus = 'down' | 'connecting' | 'established' | 'error';

export interface VPNTunnel {
  id: string;
  name: string;
  type: VPNType;
  status: VPNStatus;
  
  // Endpoints
  localEndpoint: {
    id: string;
    name: string;
    publicIP: string;
    privateNetwork: string;   // CIDR
  };
  remoteEndpoint: {
    id: string;
    name: string;
    publicIP: string;
    privateNetwork: string;   // CIDR
  };
  
  // Security Associations
  ikeSA?: IKESA;
  ipsecSAs: IPSecSA[];
  
  // Configuration
  ikeProposal: IKEProposal;
  ipsecProposal: IPSecProposal;
  psk?: string;               // Pre-shared key (masked)
  
  // Options
  dpdEnabled: boolean;        // Dead Peer Detection
  dpdInterval: number;        // seconds
  natTraversal: boolean;      // NAT-T
  
  // Timing
  createdAt: number;
  establishedAt?: number;
  lastActivity: number;
  
  // Statistics
  uptime: number;
  packetsIn: number;
  packetsOut: number;
  bytesIn: number;
  bytesOut: number;
  rekeyCount: number;
}

// ============================================================================
// ESP Packet Structure (for visualization)
// ============================================================================

export interface ESPPacket {
  id: string;
  timestamp: number;
  
  // Outer IP Header (tunnel mode)
  outerHeader?: {
    sourceIP: string;
    destIP: string;
    protocol: number;  // 50 for ESP
    ttl: number;
  };
  
  // ESP Header
  espHeader: {
    spi: string;
    sequenceNumber: number;
  };
  
  // ESP Payload (encrypted)
  payload: {
    iv?: string;              // Initialization Vector
    encryptedData: string;    // Encrypted inner packet
    padding: number;          // Padding length
    nextHeader: number;       // Inner protocol
  };
  
  // ESP Authentication
  authentication?: {
    icv: string;              // Integrity Check Value
  };
  
  // Original packet (before encryption, for simulation)
  originalPacket?: {
    sourceIP: string;
    destIP: string;
    protocol: string;
    sourcePort?: number;
    destPort?: number;
    payload?: string;
  };
}

// ============================================================================
// AH Packet Structure (for visualization)
// ============================================================================

export interface AHPacket {
  id: string;
  timestamp: number;
  
  // IP Header (modified for AH)
  ipHeader: {
    sourceIP: string;
    destIP: string;
    protocol: number;  // 51 for AH
    ttl: number;
  };
  
  // AH Header
  ahHeader: {
    nextHeader: number;
    payloadLength: number;
    reserved: number;
    spi: string;
    sequenceNumber: number;
    icv: string;              // Integrity Check Value
  };
  
  // Original payload (authenticated but not encrypted)
  payload: string;
}

// ============================================================================
// VPN Events
// ============================================================================

export type VPNEventType =
  | 'tunnel_initiating'
  | 'ike_sa_init_sent'
  | 'ike_sa_init_received'
  | 'ike_auth_sent'
  | 'ike_auth_received'
  | 'ike_sa_established'
  | 'ipsec_sa_created'
  | 'tunnel_established'
  | 'tunnel_down'
  | 'rekey_initiated'
  | 'rekey_completed'
  | 'dpd_sent'
  | 'dpd_received'
  | 'packet_encrypted'
  | 'packet_decrypted'
  | 'auth_failed'
  | 'replay_detected'
  | 'error';

export interface VPNEvent {
  id: string;
  timestamp: number;
  type: VPNEventType;
  tunnelId: string;
  message: string;
  details?: Record<string, unknown>;
  severity: 'info' | 'warning' | 'error';
}

// ============================================================================
// VPN Configuration
// ============================================================================

export interface VPNConfig {
  // IKE Settings
  ikeVersion: IKEVersion;
  ikeMode: IKEMode;
  ikeLifetime: number;        // seconds
  
  // IPSec Settings
  ipsecProtocol: IPSecProtocol;
  ipsecMode: IPSecMode;
  ipsecLifetime: number;      // seconds
  
  // Security
  enablePFS: boolean;
  pfsGroup: IKEDHGroup;
  enableDPD: boolean;
  dpdInterval: number;
  enableNATT: boolean;
  
  // Replay Protection
  enableAntiReplay: boolean;
  replayWindowSize: number;
  
  // Logging
  logLevel: 'debug' | 'info' | 'warning' | 'error';
  logIKEMessages: boolean;
  logESPPackets: boolean;
}

// ============================================================================
// VPN Statistics
// ============================================================================

export interface VPNStatistics {
  activeTunnels: number;
  totalTunnels: number;
  activeIKESAs: number;
  activeIPSecSAs: number;
  
  packetsEncrypted: number;
  packetsDecrypted: number;
  bytesEncrypted: number;
  bytesDecrypted: number;
  
  ikeNegotiationsStarted: number;
  ikeNegotiationsCompleted: number;
  ikeNegotiationsFailed: number;
  
  rekeyOperations: number;
  authFailures: number;
  replayAttacksBlocked: number;
  
  startTime: number;
  lastUpdated: number;
}

// ============================================================================
// Predefined Proposals (Educational)
// ============================================================================

export const IKE_PROPOSALS: Record<string, IKEProposal> = {
  strong: {
    id: 'ike-strong',
    name: 'Strong (AES-256-GCM + SHA-512)',
    encryption: 'aes-256-gcm',
    hash: 'sha512',
    dhGroup: 'group16',
    authMethod: 'psk',
    lifetime: 86400,  // 24 hours
  },
  balanced: {
    id: 'ike-balanced',
    name: 'Balanced (AES-256-CBC + SHA-256)',
    encryption: 'aes-256-cbc',
    hash: 'sha256',
    dhGroup: 'group14',
    authMethod: 'psk',
    lifetime: 28800,  // 8 hours
  },
  compatible: {
    id: 'ike-compatible',
    name: 'Compatible (AES-128-CBC + SHA-1)',
    encryption: 'aes-128-cbc',
    hash: 'sha1',
    dhGroup: 'group5',
    authMethod: 'psk',
    lifetime: 28800,
  },
  legacy: {
    id: 'ike-legacy',
    name: 'Legacy (3DES + MD5)',
    encryption: '3des-cbc',
    hash: 'md5',
    dhGroup: 'group2',
    authMethod: 'psk',
    lifetime: 28800,
  },
};

export const IPSEC_PROPOSALS: Record<string, IPSecProposal> = {
  strong: {
    id: 'ipsec-strong',
    name: 'Strong (AES-256-GCM)',
    protocol: 'esp',
    mode: 'tunnel',
    encryption: 'aes-256-gcm',
    authentication: 'aes-gmac',
    lifetime: 3600,   // 1 hour
    pfs: 'group16',
  },
  balanced: {
    id: 'ipsec-balanced',
    name: 'Balanced (AES-256-CBC + SHA-256)',
    protocol: 'esp',
    mode: 'tunnel',
    encryption: 'aes-256-cbc',
    authentication: 'hmac-sha256-128',
    lifetime: 3600,
    pfs: 'group14',
  },
  compatible: {
    id: 'ipsec-compatible',
    name: 'Compatible (AES-128-CBC + SHA-1)',
    protocol: 'esp',
    mode: 'tunnel',
    encryption: 'aes-128-cbc',
    authentication: 'hmac-sha1-96',
    lifetime: 3600,
    pfs: 'group5',
  },
  transport: {
    id: 'ipsec-transport',
    name: 'Transport Mode (AES-256)',
    protocol: 'esp',
    mode: 'transport',
    encryption: 'aes-256-cbc',
    authentication: 'hmac-sha256-128',
    lifetime: 3600,
  },
  ahOnly: {
    id: 'ipsec-ah',
    name: 'AH Only (Authentication)',
    protocol: 'ah',
    mode: 'tunnel',
    authentication: 'hmac-sha256-128',
    lifetime: 3600,
  },
};
