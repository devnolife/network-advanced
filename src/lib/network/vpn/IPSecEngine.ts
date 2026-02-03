/**
 * IPSec Engine - IP Security Protocol Simulation
 * 
 * Simulates ESP (Encapsulating Security Payload) and AH (Authentication Header)
 * packet processing for educational purposes.
 * 
 * Network Security Virtual Lab - Educational Platform
 */

import { EventEmitter } from 'events';
import {
  IPSecProtocol,
  IPSecMode,
  IPSecState,
  IPSecProposal,
  IPSecSA,
  ESPPacket,
  AHPacket,
  VPNEvent,
  VPNEventType,
  IPSEC_PROPOSALS,
  IKEDHGroup,
} from './types';

// ============================================================================
// Types
// ============================================================================

type IPSecEventCallback = (data: unknown) => void;

interface PlainPacket {
  id?: string;
  sourceIP: string;
  destIP: string;
  protocol: string;
  sourcePort?: number;
  destPort?: number;
  payload?: string;
  size?: number;
}

interface EncapsulationResult {
  success: boolean;
  packet?: ESPPacket | AHPacket;
  error?: string;
}

interface DecapsulationResult {
  success: boolean;
  packet?: PlainPacket;
  error?: string;
}

// ============================================================================
// Constants
// ============================================================================

const PROTOCOL_NUMBERS: Record<string, number> = {
  'icmp': 1,
  'tcp': 6,
  'udp': 17,
  'esp': 50,
  'ah': 51,
};

const ENCRYPTION_KEY_SIZES: Record<string, number> = {
  'aes-128-cbc': 128,
  'aes-192-cbc': 192,
  'aes-256-cbc': 256,
  'aes-128-gcm': 128,
  'aes-256-gcm': 256,
  '3des-cbc': 192,
  'null': 0,
};

const ENCRYPTION_BLOCK_SIZES: Record<string, number> = {
  'aes-128-cbc': 16,
  'aes-192-cbc': 16,
  'aes-256-cbc': 16,
  'aes-128-gcm': 16,
  'aes-256-gcm': 16,
  '3des-cbc': 8,
  'null': 1,
};

const ICV_SIZES: Record<string, number> = {
  'hmac-sha1-96': 12,
  'hmac-sha256-128': 16,
  'hmac-sha384-192': 24,
  'hmac-sha512-256': 32,
  'hmac-md5-96': 12,
  'aes-xcbc-mac-96': 12,
  'aes-gmac': 16,
};

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(): string {
  return `ipsec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateSPI(): string {
  // Generate 4-byte SPI as hex string (for IPSec)
  const bytes = new Array(4);
  for (let i = 0; i < 4; i++) {
    bytes[i] = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  }
  return bytes.join('');
}

function generateKey(bits: number): string {
  const bytes = Math.ceil(bits / 8);
  const key = new Array(bytes);
  for (let i = 0; i < bytes; i++) {
    key[i] = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  }
  return key.join('');
}

function generateIV(blockSize: number): string {
  const iv = new Array(blockSize);
  for (let i = 0; i < blockSize; i++) {
    iv[i] = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  }
  return iv.join('');
}

function calculatePadding(dataLength: number, blockSize: number): number {
  const remainder = dataLength % blockSize;
  if (remainder === 0) return blockSize; // Always add at least some padding
  return blockSize - remainder;
}

function ipToInt(ip: string): number {
  const parts = ip.split('.').map(Number);
  return (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

function cidrToRange(cidr: string): { start: number; end: number } {
  const [ip, prefix] = cidr.split('/');
  const prefixNum = parseInt(prefix, 10);
  const ipNum = ipToInt(ip);
  const mask = prefixNum === 0 ? 0 : (~0 << (32 - prefixNum)) >>> 0;
  const start = ipNum & mask;
  const end = start | (~mask >>> 0);
  return { start, end };
}

function ipInCIDR(ip: string, cidr: string): boolean {
  const ipNum = ipToInt(ip);
  const range = cidrToRange(cidr);
  return ipNum >= range.start && ipNum <= range.end;
}

// ============================================================================
// IPSec Engine Class
// ============================================================================

export class IPSecEngine extends EventEmitter {
  private ipsecSAs: Map<string, IPSecSA> = new Map();
  private espPackets: ESPPacket[] = [];
  private ahPackets: AHPacket[] = [];
  private events: VPNEvent[] = [];
  private isRunning: boolean = false;
  
  // Anti-replay window
  private replayWindows: Map<string, Set<number>> = new Map();
  private replayWindowSize: number = 64;
  
  // Statistics
  private stats = {
    packetsEncrypted: 0,
    packetsDecrypted: 0,
    bytesEncrypted: 0,
    bytesDecrypted: 0,
    authFailed: 0,
    replayBlocked: 0,
    sasCreated: 0,
    sasExpired: 0,
  };

  constructor(replayWindowSize: number = 64) {
    super();
    this.replayWindowSize = replayWindowSize;
  }

  // ==========================================================================
  // SA Management
  // ==========================================================================

  createSA(
    ikeSAId: string,
    proposal: IPSecProposal,
    localIP: string,
    remoteIP: string,
    trafficSelector: IPSecSA['trafficSelector'],
    tunnelEndpoints?: { localIP: string; remoteIP: string }
  ): { inbound: IPSecSA; outbound: IPSecSA } {
    const now = Date.now();
    const keySize = proposal.encryption 
      ? ENCRYPTION_KEY_SIZES[proposal.encryption] 
      : 0;
    
    // Create inbound SA
    const inboundSA: IPSecSA = {
      id: generateId(),
      ikeSAId,
      spi: generateSPI(),
      protocol: proposal.protocol,
      mode: proposal.mode,
      direction: 'inbound',
      state: 'established',
      localIP,
      remoteIP,
      tunnelLocalIP: tunnelEndpoints?.localIP,
      tunnelRemoteIP: tunnelEndpoints?.remoteIP,
      trafficSelector,
      proposal,
      encryptionKey: keySize > 0 ? generateKey(keySize) : undefined,
      authenticationKey: generateKey(160), // SHA-1 key
      sequenceNumber: 0,
      replayWindow: [],
      createdAt: now,
      expiresAt: now + (proposal.lifetime * 1000),
      lastUsed: now,
      packetsEncrypted: 0,
      packetsDecrypted: 0,
      bytesEncrypted: 0,
      bytesDecrypted: 0,
      replayDropped: 0,
      authFailed: 0,
    };
    
    // Create outbound SA (with different SPI)
    const outboundSA: IPSecSA = {
      ...inboundSA,
      id: generateId(),
      spi: generateSPI(),
      direction: 'outbound',
      encryptionKey: keySize > 0 ? generateKey(keySize) : undefined,
      authenticationKey: generateKey(160),
    };
    
    // Store SAs
    this.ipsecSAs.set(inboundSA.id, inboundSA);
    this.ipsecSAs.set(outboundSA.id, outboundSA);
    
    // Initialize replay windows
    this.replayWindows.set(inboundSA.id, new Set());
    this.replayWindows.set(outboundSA.id, new Set());
    
    this.stats.sasCreated += 2;
    
    this.emit('saCreated', { inbound: inboundSA, outbound: outboundSA });
    
    return { inbound: inboundSA, outbound: outboundSA };
  }

  getSA(saId: string): IPSecSA | undefined {
    return this.ipsecSAs.get(saId);
  }

  getAllSAs(): IPSecSA[] {
    return Array.from(this.ipsecSAs.values());
  }

  getActiveSAs(): IPSecSA[] {
    return Array.from(this.ipsecSAs.values()).filter(
      sa => sa.state === 'established'
    );
  }

  getSABySPI(spi: string): IPSecSA | undefined {
    for (const sa of this.ipsecSAs.values()) {
      if (sa.spi === spi) {
        return sa;
      }
    }
    return undefined;
  }

  getSAsForIKE(ikeSAId: string): IPSecSA[] {
    return Array.from(this.ipsecSAs.values()).filter(
      sa => sa.ikeSAId === ikeSAId
    );
  }

  findMatchingSA(
    sourceIP: string,
    destIP: string,
    protocol?: string,
    sourcePort?: number,
    destPort?: number,
    direction: 'inbound' | 'outbound' = 'outbound'
  ): IPSecSA | undefined {
    for (const sa of this.ipsecSAs.values()) {
      if (sa.direction !== direction || sa.state !== 'established') continue;
      
      const ts = sa.trafficSelector;
      
      // Check if IPs match traffic selector
      const localMatch = ipInCIDR(sourceIP, ts.localNetwork);
      const remoteMatch = ipInCIDR(destIP, ts.remoteNetwork);
      
      if (!localMatch || !remoteMatch) continue;
      
      // Check protocol
      if (ts.protocol && protocol) {
        const protoNum = PROTOCOL_NUMBERS[protocol.toLowerCase()] || 0;
        if (ts.protocol !== 0 && ts.protocol !== protoNum) continue;
      }
      
      // Check ports (if specified)
      if (ts.localPort && sourcePort && ts.localPort !== 0 && ts.localPort !== sourcePort) continue;
      if (ts.remotePort && destPort && ts.remotePort !== 0 && ts.remotePort !== destPort) continue;
      
      return sa;
    }
    
    return undefined;
  }

  deleteSA(saId: string): void {
    const sa = this.ipsecSAs.get(saId);
    if (!sa) return;
    
    sa.state = 'deleted';
    this.ipsecSAs.delete(saId);
    this.replayWindows.delete(saId);
    
    this.emit('saDeleted', { saId, sa });
  }

  deleteSAsForIKE(ikeSAId: string): void {
    const sas = this.getSAsForIKE(ikeSAId);
    for (const sa of sas) {
      this.deleteSA(sa.id);
    }
  }

  // ==========================================================================
  // ESP Encapsulation
  // ==========================================================================

  encapsulateESP(packet: PlainPacket, sa: IPSecSA): EncapsulationResult {
    if (sa.protocol !== 'esp') {
      return { success: false, error: 'SA is not for ESP protocol' };
    }
    
    if (sa.direction !== 'outbound') {
      return { success: false, error: 'SA is not outbound' };
    }
    
    if (sa.state !== 'established') {
      return { success: false, error: 'SA is not established' };
    }
    
    // Increment sequence number
    sa.sequenceNumber++;
    
    const proposal = sa.proposal!;
    const encryption = proposal.encryption || 'null';
    const blockSize = ENCRYPTION_BLOCK_SIZES[encryption];
    const icvSize = ICV_SIZES[proposal.authentication];
    
    // Calculate payload size and padding
    const payloadSize = packet.size || (packet.payload?.length || 0);
    const paddingLength = calculatePadding(payloadSize + 2, blockSize); // +2 for pad length and next header
    
    // Generate IV for encryption
    const iv = encryption !== 'null' ? generateIV(blockSize) : undefined;
    
    // Simulate encrypted data
    const encryptedData = generateKey((payloadSize + paddingLength) * 8);
    
    // Calculate ICV
    const icv = generateKey(icvSize * 8);
    
    const espPacket: ESPPacket = {
      id: generateId(),
      timestamp: Date.now(),
      espHeader: {
        spi: sa.spi,
        sequenceNumber: sa.sequenceNumber,
      },
      payload: {
        iv,
        encryptedData,
        padding: paddingLength,
        nextHeader: PROTOCOL_NUMBERS[packet.protocol.toLowerCase()] || 0,
      },
      authentication: {
        icv,
      },
      originalPacket: {
        sourceIP: packet.sourceIP,
        destIP: packet.destIP,
        protocol: packet.protocol,
        sourcePort: packet.sourcePort,
        destPort: packet.destPort,
        payload: packet.payload,
      },
    };
    
    // Add outer IP header for tunnel mode
    if (sa.mode === 'tunnel') {
      espPacket.outerHeader = {
        sourceIP: sa.tunnelLocalIP || sa.localIP,
        destIP: sa.tunnelRemoteIP || sa.remoteIP,
        protocol: 50, // ESP
        ttl: 64,
      };
    }
    
    // Update statistics
    sa.packetsEncrypted++;
    sa.bytesEncrypted += payloadSize;
    sa.lastUsed = Date.now();
    this.stats.packetsEncrypted++;
    this.stats.bytesEncrypted += payloadSize;
    
    // Store packet for visualization
    this.espPackets.push(espPacket);
    if (this.espPackets.length > 500) {
      this.espPackets = this.espPackets.slice(-500);
    }
    
    this.emitVPNEvent('packet_encrypted', sa.ikeSAId,
      `ESP packet encrypted: ${packet.sourceIP}:${packet.sourcePort || '*'} -> ${packet.destIP}:${packet.destPort || '*'}`,
      {
        saId: sa.id,
        spi: sa.spi,
        sequenceNumber: sa.sequenceNumber,
        encryption: proposal.encryption,
        packetId: espPacket.id,
      }
    );
    
    this.emit('packetEncrypted', { sa, packet: espPacket });
    
    return { success: true, packet: espPacket };
  }

  decapsulateESP(espPacket: ESPPacket, sa: IPSecSA): DecapsulationResult {
    if (sa.protocol !== 'esp') {
      return { success: false, error: 'SA is not for ESP protocol' };
    }
    
    if (sa.direction !== 'inbound') {
      return { success: false, error: 'SA is not inbound' };
    }
    
    if (sa.state !== 'established') {
      return { success: false, error: 'SA is not established' };
    }
    
    // Check SPI
    if (espPacket.espHeader.spi !== sa.spi) {
      return { success: false, error: 'SPI mismatch' };
    }
    
    // Anti-replay check
    const seqNum = espPacket.espHeader.sequenceNumber;
    if (!this.checkAntiReplay(sa.id, seqNum)) {
      sa.replayDropped++;
      this.stats.replayBlocked++;
      
      this.emitVPNEvent('replay_detected', sa.ikeSAId,
        `Replay attack detected - sequence number ${seqNum} already seen`,
        { saId: sa.id, sequenceNumber: seqNum }
      );
      
      return { success: false, error: 'Replay detected' };
    }
    
    // Simulate authentication verification
    const authSuccess = Math.random() > 0.001; // 99.9% success rate for simulation
    if (!authSuccess) {
      sa.authFailed++;
      this.stats.authFailed++;
      
      this.emitVPNEvent('auth_failed', sa.ikeSAId,
        'ESP authentication failed - ICV mismatch',
        { saId: sa.id, spi: sa.spi }
      );
      
      return { success: false, error: 'Authentication failed' };
    }
    
    // Update anti-replay window
    this.updateAntiReplay(sa.id, seqNum);
    
    // Simulate decryption - return original packet
    const originalPacket: PlainPacket = espPacket.originalPacket ? {
      sourceIP: espPacket.originalPacket.sourceIP,
      destIP: espPacket.originalPacket.destIP,
      protocol: espPacket.originalPacket.protocol,
      sourcePort: espPacket.originalPacket.sourcePort,
      destPort: espPacket.originalPacket.destPort,
      payload: espPacket.originalPacket.payload,
    } : {
      sourceIP: '0.0.0.0',
      destIP: '0.0.0.0',
      protocol: 'unknown',
    };
    
    // Update statistics
    sa.packetsDecrypted++;
    sa.bytesDecrypted += originalPacket.payload?.length || 0;
    sa.lastUsed = Date.now();
    this.stats.packetsDecrypted++;
    this.stats.bytesDecrypted += originalPacket.payload?.length || 0;
    
    this.emitVPNEvent('packet_decrypted', sa.ikeSAId,
      `ESP packet decrypted: ${originalPacket.sourceIP} -> ${originalPacket.destIP}`,
      {
        saId: sa.id,
        spi: sa.spi,
        sequenceNumber: seqNum,
      }
    );
    
    this.emit('packetDecrypted', { sa, packet: originalPacket });
    
    return { success: true, packet: originalPacket };
  }

  // ==========================================================================
  // AH Processing
  // ==========================================================================

  encapsulateAH(packet: PlainPacket, sa: IPSecSA): EncapsulationResult {
    if (sa.protocol !== 'ah') {
      return { success: false, error: 'SA is not for AH protocol' };
    }
    
    if (sa.direction !== 'outbound') {
      return { success: false, error: 'SA is not outbound' };
    }
    
    // Increment sequence number
    sa.sequenceNumber++;
    
    const proposal = sa.proposal!;
    const icvSize = ICV_SIZES[proposal.authentication];
    const ahLength = Math.ceil((12 + icvSize) / 4) - 2; // In 32-bit words minus 2
    
    // Calculate ICV over packet
    const icv = generateKey(icvSize * 8);
    
    const ahPacket: AHPacket = {
      id: generateId(),
      timestamp: Date.now(),
      ipHeader: {
        sourceIP: sa.mode === 'tunnel' ? (sa.tunnelLocalIP || sa.localIP) : packet.sourceIP,
        destIP: sa.mode === 'tunnel' ? (sa.tunnelRemoteIP || sa.remoteIP) : packet.destIP,
        protocol: 51, // AH
        ttl: 64,
      },
      ahHeader: {
        nextHeader: PROTOCOL_NUMBERS[packet.protocol.toLowerCase()] || 0,
        payloadLength: ahLength,
        reserved: 0,
        spi: sa.spi,
        sequenceNumber: sa.sequenceNumber,
        icv,
      },
      payload: packet.payload || '',
    };
    
    // Update statistics
    sa.packetsEncrypted++; // AH doesn't encrypt but we count it
    sa.bytesEncrypted += packet.size || (packet.payload?.length || 0);
    sa.lastUsed = Date.now();
    this.stats.packetsEncrypted++;
    
    // Store packet
    this.ahPackets.push(ahPacket);
    if (this.ahPackets.length > 500) {
      this.ahPackets = this.ahPackets.slice(-500);
    }
    
    this.emitVPNEvent('packet_encrypted', sa.ikeSAId,
      `AH packet authenticated: ${packet.sourceIP} -> ${packet.destIP}`,
      {
        saId: sa.id,
        spi: sa.spi,
        sequenceNumber: sa.sequenceNumber,
        authentication: proposal.authentication,
        packetId: ahPacket.id,
      }
    );
    
    this.emit('packetEncrypted', { sa, packet: ahPacket });
    
    return { success: true, packet: ahPacket };
  }

  decapsulateAH(ahPacket: AHPacket, sa: IPSecSA): DecapsulationResult {
    if (sa.protocol !== 'ah') {
      return { success: false, error: 'SA is not for AH protocol' };
    }
    
    if (sa.direction !== 'inbound') {
      return { success: false, error: 'SA is not inbound' };
    }
    
    // Check SPI
    if (ahPacket.ahHeader.spi !== sa.spi) {
      return { success: false, error: 'SPI mismatch' };
    }
    
    // Anti-replay check
    const seqNum = ahPacket.ahHeader.sequenceNumber;
    if (!this.checkAntiReplay(sa.id, seqNum)) {
      sa.replayDropped++;
      this.stats.replayBlocked++;
      
      this.emitVPNEvent('replay_detected', sa.ikeSAId,
        `Replay attack detected on AH packet - sequence number ${seqNum}`,
        { saId: sa.id, sequenceNumber: seqNum }
      );
      
      return { success: false, error: 'Replay detected' };
    }
    
    // Simulate authentication verification
    const authSuccess = Math.random() > 0.001;
    if (!authSuccess) {
      sa.authFailed++;
      this.stats.authFailed++;
      
      this.emitVPNEvent('auth_failed', sa.ikeSAId,
        'AH authentication failed - ICV mismatch',
        { saId: sa.id, spi: sa.spi }
      );
      
      return { success: false, error: 'Authentication failed' };
    }
    
    // Update anti-replay window
    this.updateAntiReplay(sa.id, seqNum);
    
    // Reconstruct original packet
    const originalPacket: PlainPacket = {
      sourceIP: ahPacket.ipHeader.sourceIP,
      destIP: ahPacket.ipHeader.destIP,
      protocol: Object.keys(PROTOCOL_NUMBERS).find(
        k => PROTOCOL_NUMBERS[k] === ahPacket.ahHeader.nextHeader
      ) || 'unknown',
      payload: ahPacket.payload,
    };
    
    // Update statistics
    sa.packetsDecrypted++;
    sa.bytesDecrypted += ahPacket.payload.length;
    sa.lastUsed = Date.now();
    this.stats.packetsDecrypted++;
    
    this.emitVPNEvent('packet_decrypted', sa.ikeSAId,
      `AH packet verified: ${originalPacket.sourceIP} -> ${originalPacket.destIP}`,
      { saId: sa.id, spi: sa.spi }
    );
    
    this.emit('packetDecrypted', { sa, packet: originalPacket });
    
    return { success: true, packet: originalPacket };
  }

  // ==========================================================================
  // Anti-Replay
  // ==========================================================================

  private checkAntiReplay(saId: string, sequenceNumber: number): boolean {
    const window = this.replayWindows.get(saId);
    if (!window) return true;
    
    return !window.has(sequenceNumber);
  }

  private updateAntiReplay(saId: string, sequenceNumber: number): void {
    let window = this.replayWindows.get(saId);
    if (!window) {
      window = new Set();
      this.replayWindows.set(saId, window);
    }
    
    window.add(sequenceNumber);
    
    // Trim window if too large
    if (window.size > this.replayWindowSize) {
      const sortedSeqs = Array.from(window).sort((a, b) => a - b);
      const toRemove = sortedSeqs.slice(0, sortedSeqs.length - this.replayWindowSize);
      for (const seq of toRemove) {
        window.delete(seq);
      }
    }
  }

  // ==========================================================================
  // Packet History
  // ==========================================================================

  getESPPackets(saId?: string): ESPPacket[] {
    if (!saId) return [...this.espPackets];
    
    const sa = this.ipsecSAs.get(saId);
    if (!sa) return [];
    
    return this.espPackets.filter(p => p.espHeader.spi === sa.spi);
  }

  getAHPackets(saId?: string): AHPacket[] {
    if (!saId) return [...this.ahPackets];
    
    const sa = this.ipsecSAs.get(saId);
    if (!sa) return [];
    
    return this.ahPackets.filter(p => p.ahHeader.spi === sa.spi);
  }

  getRecentPackets(count: number = 50): (ESPPacket | AHPacket)[] {
    const allPackets = [...this.espPackets, ...this.ahPackets]
      .sort((a, b) => b.timestamp - a.timestamp);
    
    return allPackets.slice(0, count);
  }

  // ==========================================================================
  // Events
  // ==========================================================================

  private emitVPNEvent(
    type: VPNEventType,
    tunnelId: string,
    message: string,
    details?: Record<string, unknown>
  ): void {
    const event: VPNEvent = {
      id: generateId(),
      timestamp: Date.now(),
      type,
      tunnelId,
      message,
      details,
      severity: this.getSeverityForEvent(type),
    };
    
    this.events.push(event);
    
    if (this.events.length > 500) {
      this.events = this.events.slice(-500);
    }
    
    this.emit('event', event);
  }

  private getSeverityForEvent(type: VPNEventType): 'info' | 'warning' | 'error' {
    switch (type) {
      case 'auth_failed':
      case 'replay_detected':
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  }

  getEvents(saId?: string): VPNEvent[] {
    if (!saId) return [...this.events];
    
    return this.events.filter(e => {
      const sa = this.ipsecSAs.get(saId);
      return sa && e.tunnelId === sa.ikeSAId;
    });
  }

  // ==========================================================================
  // SA Expiration Check
  // ==========================================================================

  checkExpiredSAs(): IPSecSA[] {
    const now = Date.now();
    const expired: IPSecSA[] = [];
    
    for (const sa of this.ipsecSAs.values()) {
      if (sa.state === 'established' && now >= sa.expiresAt) {
        sa.state = 'expired';
        expired.push(sa);
        this.stats.sasExpired++;
        
        this.emit('saExpired', { sa });
      }
    }
    
    return expired;
  }

  // ==========================================================================
  // Statistics
  // ==========================================================================

  getStatistics() {
    const activeSAs = this.getActiveSAs();
    
    return {
      ...this.stats,
      activeSAs: activeSAs.length,
      totalSAs: this.ipsecSAs.size,
      espPacketsTotal: this.espPackets.length,
      ahPacketsTotal: this.ahPackets.length,
    };
  }

  getSAStatistics(saId: string) {
    const sa = this.ipsecSAs.get(saId);
    if (!sa) return null;
    
    return {
      packetsEncrypted: sa.packetsEncrypted,
      packetsDecrypted: sa.packetsDecrypted,
      bytesEncrypted: sa.bytesEncrypted,
      bytesDecrypted: sa.bytesDecrypted,
      replayDropped: sa.replayDropped,
      authFailed: sa.authFailed,
      uptime: Date.now() - sa.createdAt,
      expiresIn: sa.expiresAt - Date.now(),
    };
  }

  resetStatistics(): void {
    this.stats = {
      packetsEncrypted: 0,
      packetsDecrypted: 0,
      bytesEncrypted: 0,
      bytesDecrypted: 0,
      authFailed: 0,
      replayBlocked: 0,
      sasCreated: 0,
      sasExpired: 0,
    };
  }

  // ==========================================================================
  // Lifecycle
  // ==========================================================================

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.emit('started');
  }

  stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    this.emit('stopped');
  }

  destroy(): void {
    this.stop();
    this.removeAllListeners();
    this.ipsecSAs.clear();
    this.espPackets = [];
    this.ahPackets = [];
    this.events = [];
    this.replayWindows.clear();
  }

  isActive(): boolean {
    return this.isRunning;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let ipsecEngineInstance: IPSecEngine | null = null;

export function getIPSecEngine(): IPSecEngine {
  if (!ipsecEngineInstance) {
    ipsecEngineInstance = new IPSecEngine();
  }
  return ipsecEngineInstance;
}

export function resetIPSecEngine(): void {
  if (ipsecEngineInstance) {
    ipsecEngineInstance.destroy();
    ipsecEngineInstance = null;
  }
}
