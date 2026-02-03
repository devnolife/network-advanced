// IPSec Protocol Implementation
// Implements IKE (Internet Key Exchange), ESP (Encapsulating Security Payload), and AH (Authentication Header)

import type { 
    IPv4Address, 
    IPPacket, 
    ESPPacket, 
    AHPacket, 
    IPSecConfig, 
    IPSecSA, 
    IKEConfig 
} from '../core/types';
import { IPv4Protocol, IP_PROTOCOLS } from './IP';

/**
 * IKE Exchange Types
 */
export const IKE_EXCHANGE_TYPES = {
    // IKEv1
    IDENTITY_PROTECTION: 2,      // Main mode
    AGGRESSIVE: 4,               // Aggressive mode
    INFORMATIONAL: 5,
    QUICK_MODE: 32,
    
    // IKEv2
    IKE_SA_INIT: 34,
    IKE_AUTH: 35,
    CREATE_CHILD_SA: 36,
    INFORMATIONAL_V2: 37,
} as const;

/**
 * IKE Payload Types
 */
export const IKE_PAYLOAD_TYPES = {
    NONE: 0,
    SA: 1,                       // Security Association
    P: 2,                        // Proposal
    T: 3,                        // Transform
    KE: 4,                       // Key Exchange
    ID: 5,                       // Identification
    CERT: 6,                     // Certificate
    CR: 7,                       // Certificate Request
    HASH: 8,                     // Hash
    SIG: 9,                      // Signature
    NONCE: 10,                   // Nonce
    N: 11,                       // Notify
    D: 12,                       // Delete
    VID: 13,                     // Vendor ID
    
    // IKEv2 specific
    SK: 46,                      // Encrypted and Authenticated
    TSI: 44,                     // Traffic Selector - Initiator
    TSR: 45,                     // Traffic Selector - Responder
    AUTH: 39,                    // Authentication
} as const;

/**
 * ESP/AH Protocol Numbers
 */
export const IPSEC_PROTOCOLS = {
    ESP: 50,
    AH: 51,
} as const;

/**
 * Encryption Algorithm IDs
 */
export const ENCRYPTION_ALGORITHMS = {
    DES_CBC: 2,
    '3DES_CBC': 3,
    AES_CBC_128: 12,
    AES_CBC_256: 14,
    AES_GCM_128: 18,
    AES_GCM_256: 20,
} as const;

/**
 * Authentication/Hash Algorithm IDs
 */
export const AUTH_ALGORITHMS = {
    HMAC_MD5_96: 1,
    HMAC_SHA1_96: 2,
    HMAC_SHA256_128: 12,
    HMAC_SHA384_192: 13,
    HMAC_SHA512_256: 14,
} as const;

/**
 * Diffie-Hellman Group IDs
 */
export const DH_GROUPS = {
    MODP_768: 1,
    MODP_1024: 2,
    MODP_1536: 5,
    MODP_2048: 14,
    MODP_3072: 15,
    MODP_4096: 16,
    ECP_256: 19,
    ECP_384: 20,
} as const;

/**
 * IKE Phase states
 */
export enum IKEPhase {
    IDLE = 'IDLE',
    // Phase 1 (IKE SA)
    PHASE1_INITIATED = 'PHASE1_INITIATED',
    PHASE1_RESPONDING = 'PHASE1_RESPONDING',
    PHASE1_COMPLETE = 'PHASE1_COMPLETE',
    // Phase 2 (IPSec SA / Quick Mode)
    PHASE2_INITIATED = 'PHASE2_INITIATED',
    PHASE2_RESPONDING = 'PHASE2_RESPONDING',
    PHASE2_COMPLETE = 'PHASE2_COMPLETE',
    // Established
    ESTABLISHED = 'ESTABLISHED',
    // Error/Closed
    FAILED = 'FAILED',
    CLOSED = 'CLOSED',
}

/**
 * IKE Message Header
 */
export interface IKEHeader {
    initiatorSPI: Uint8Array;    // 8 bytes
    responderSPI: Uint8Array;    // 8 bytes
    nextPayload: number;
    version: number;              // Major.Minor
    exchangeType: number;
    flags: {
        initiator: boolean;
        version: boolean;
        response: boolean;
    };
    messageId: number;
    length: number;
}

/**
 * IKE Session
 */
export interface IKESession {
    id: string;
    localAddress: IPv4Address;
    remoteAddress: IPv4Address;
    initiatorSPI: Uint8Array;
    responderSPI: Uint8Array;
    phase: IKEPhase;
    config: IKEConfig;
    
    // Keys derived during exchange
    skeyid?: Uint8Array;         // SKEYID (base key material)
    skeyid_d?: Uint8Array;       // SKEYID_d (for IPSec SA key derivation)
    skeyid_a?: Uint8Array;       // SKEYID_a (for IKE authentication)
    skeyid_e?: Uint8Array;       // SKEYID_e (for IKE encryption)
    
    // Nonces
    initiatorNonce?: Uint8Array;
    responderNonce?: Uint8Array;
    
    // DH values
    dhPrivateKey?: Uint8Array;
    dhPublicKey?: Uint8Array;
    dhSharedSecret?: Uint8Array;
    
    // Timestamps
    created: number;
    lastActivity: number;
    expires: number;
    
    // Associated IPSec SAs
    childSAs: string[];          // SA IDs
}

/**
 * IPSec Security Association Database (SAD)
 */
export interface SADEntry extends IPSecSA {
    id: string;
    direction: 'inbound' | 'outbound';
    sourceAddress: IPv4Address;
    destinationAddress: IPv4Address;
    sourceSelector?: { address: IPv4Address; mask: IPv4Address };
    destinationSelector?: { address: IPv4Address; mask: IPv4Address };
    ikeSessionId?: string;
    antiReplayWindow?: Uint8Array;
    created: number;
    expires: number;
}

/**
 * Security Policy Database (SPD) Entry
 */
export interface SPDEntry {
    id: string;
    priority: number;
    sourceSelector: { address: IPv4Address; mask: IPv4Address; port?: number };
    destinationSelector: { address: IPv4Address; mask: IPv4Address; port?: number };
    protocol?: number;
    action: 'protect' | 'bypass' | 'discard';
    ipsecConfig?: IPSecConfig;
}

/**
 * ESP Protocol handler
 */
export class ESPProtocol {
    /**
     * Create ESP packet (tunnel mode)
     */
    static createPacket(
        spi: number,
        sequenceNumber: number,
        payload: Uint8Array,
        sa: SADEntry
    ): ESPPacket {
        // Generate IV (random for CBC modes)
        const ivSize = this.getIVSize(sa);
        const iv = this.generateIV(ivSize);
        
        // Pad payload to block size
        const blockSize = this.getBlockSize(sa);
        const paddedPayload = this.padPayload(payload, blockSize);
        
        // Encrypt payload (simplified - real impl would use crypto library)
        const encryptedPayload = this.encryptPayload(paddedPayload, sa, iv);
        
        // Calculate padding info
        const padLength = paddedPayload.length - payload.length;
        
        const packet: ESPPacket = {
            spi,
            sequenceNumber,
            iv,
            encryptedPayload,
            padLength,
            nextHeader: IP_PROTOCOLS.TCP, // Assuming TCP, should be actual inner protocol
            authData: undefined, // Will be calculated
        };
        
        // Calculate authentication data (ICV)
        if (sa.authKey) {
            packet.authData = this.calculateICV(packet, sa);
        }
        
        return packet;
    }

    /**
     * Parse and decrypt ESP packet
     */
    static parsePacket(
        packet: ESPPacket,
        sa: SADEntry
    ): { payload: Uint8Array; nextHeader: number } | null {
        // Verify authentication
        if (sa.authKey && packet.authData) {
            const calculatedICV = this.calculateICV(packet, sa);
            if (!this.compareArrays(calculatedICV, packet.authData)) {
                return null; // Authentication failed
            }
        }
        
        // Decrypt payload
        const decrypted = this.decryptPayload(packet.encryptedPayload, sa, packet.iv);
        
        // Remove padding
        const payloadLength = decrypted.length - packet.padLength;
        const payload = decrypted.slice(0, payloadLength);
        
        return {
            payload,
            nextHeader: packet.nextHeader,
        };
    }

    /**
     * Encapsulate IP packet in tunnel mode
     */
    static encapsulateTunnel(
        innerPacket: IPPacket,
        outerSourceIP: IPv4Address,
        outerDestIP: IPv4Address,
        sa: SADEntry
    ): IPPacket {
        // Serialize inner packet
        const innerPayload = this.serializeIPPacket(innerPacket);
        
        // Create ESP packet
        const espPacket = this.createPacket(
            sa.spi,
            sa.sequenceNumber++,
            innerPayload,
            sa
        );
        
        // Create outer IP packet
        return IPv4Protocol.createPacket(
            outerSourceIP,
            outerDestIP,
            IPSEC_PROTOCOLS.ESP,
            espPacket,
            { dontFragment: true }
        );
    }

    /**
     * Decapsulate IP packet from tunnel mode
     */
    static decapsulateTunnel(
        packet: IPPacket,
        sa: SADEntry
    ): IPPacket | null {
        if (packet.protocol !== IPSEC_PROTOCOLS.ESP) {
            return null;
        }
        
        const espPacket = packet.payload as ESPPacket;
        const result = this.parsePacket(espPacket, sa);
        
        if (!result) {
            return null;
        }
        
        // Parse inner IP packet from decrypted payload
        return this.parseIPPacket(result.payload);
    }

    // Helper methods

    private static getIVSize(sa: SADEntry): number {
        // IV size depends on encryption algorithm
        return 16; // AES block size
    }

    private static getBlockSize(sa: SADEntry): number {
        return 16; // AES block size
    }

    private static generateIV(size: number): Uint8Array {
        const iv = new Uint8Array(size);
        for (let i = 0; i < size; i++) {
            iv[i] = Math.floor(Math.random() * 256);
        }
        return iv;
    }

    private static padPayload(payload: Uint8Array, blockSize: number): Uint8Array {
        // PKCS7-like padding (ESP uses specific padding scheme)
        const paddingNeeded = blockSize - ((payload.length + 2) % blockSize);
        const padded = new Uint8Array(payload.length + paddingNeeded);
        padded.set(payload);
        
        // Fill padding bytes (1, 2, 3, ...)
        for (let i = 0; i < paddingNeeded; i++) {
            padded[payload.length + i] = i + 1;
        }
        
        return padded;
    }

    private static encryptPayload(payload: Uint8Array, sa: SADEntry, iv?: Uint8Array): Uint8Array {
        // Simplified - in real implementation, use crypto library
        // This is a placeholder that XORs with key for demo purposes
        const encrypted = new Uint8Array(payload.length);
        const key = sa.encryptionKey ?? new Uint8Array(16);
        
        for (let i = 0; i < payload.length; i++) {
            encrypted[i] = payload[i] ^ key[i % key.length];
            if (iv) {
                encrypted[i] ^= iv[i % iv.length];
            }
        }
        
        return encrypted;
    }

    private static decryptPayload(encrypted: Uint8Array, sa: SADEntry, iv?: Uint8Array): Uint8Array {
        // Same as encrypt for XOR demo
        return this.encryptPayload(encrypted, sa, iv);
    }

    private static calculateICV(packet: ESPPacket, sa: SADEntry): Uint8Array {
        // Simplified HMAC calculation
        // Real implementation would use proper HMAC-SHA256 etc.
        const icvSize = 12; // 96-bit truncated HMAC
        const icv = new Uint8Array(icvSize);
        
        const authKey = sa.authKey ?? new Uint8Array(32);
        
        // Simple hash placeholder
        let hash = 0;
        hash = (hash * 31 + packet.spi) >>> 0;
        hash = (hash * 31 + packet.sequenceNumber) >>> 0;
        
        for (let i = 0; i < packet.encryptedPayload.length; i++) {
            hash = (hash * 31 + packet.encryptedPayload[i]) >>> 0;
        }
        
        for (let i = 0; i < icvSize; i++) {
            icv[i] = ((hash >>> (i * 2)) ^ authKey[i % authKey.length]) & 0xFF;
        }
        
        return icv;
    }

    private static compareArrays(a: Uint8Array, b: Uint8Array): boolean {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    private static serializeIPPacket(packet: IPPacket): Uint8Array {
        // Simplified serialization
        const size = packet.totalLength;
        return new Uint8Array(size);
    }

    private static parseIPPacket(data: Uint8Array): IPPacket | null {
        // Simplified parsing
        if (data.length < 20) return null;
        // Would parse actual IP packet here
        return null;
    }

    /**
     * Format ESP packet for display
     */
    static formatPacket(packet: ESPPacket): string {
        const ivStr = packet.iv ? `IV=${packet.iv.length}b` : 'no-IV';
        const authStr = packet.authData ? `Auth=${packet.authData.length}b` : 'no-auth';
        
        return `ESP SPI=0x${packet.spi.toString(16).padStart(8, '0')} ` +
               `Seq=${packet.sequenceNumber} ${ivStr} ` +
               `PayloadLen=${packet.encryptedPayload.length} ${authStr}`;
    }
}

/**
 * AH Protocol handler
 */
export class AHProtocol {
    /**
     * Create AH packet
     */
    static createPacket(
        nextHeader: number,
        spi: number,
        sequenceNumber: number,
        payload: IPPacket,
        sa: SADEntry
    ): AHPacket {
        // Calculate ICV size based on algorithm (12 bytes for SHA1/MD5)
        const icvSize = this.getICVSize(sa);
        const icv = new Uint8Array(icvSize);
        
        const packet: AHPacket = {
            nextHeader,
            payloadLength: Math.ceil((12 + icvSize) / 4) - 2, // In 32-bit words minus 2
            reserved: 0,
            spi,
            sequenceNumber,
            icv,
            payload,
        };
        
        // Calculate ICV (over entire packet with mutable fields zeroed)
        packet.icv = this.calculateICV(packet, sa);
        
        return packet;
    }

    /**
     * Verify AH packet
     */
    static verifyPacket(packet: AHPacket, sa: SADEntry): boolean {
        const calculatedICV = this.calculateICV(packet, sa);
        return this.compareArrays(calculatedICV, packet.icv);
    }

    /**
     * Encapsulate in tunnel mode
     */
    static encapsulateTunnel(
        innerPacket: IPPacket,
        outerSourceIP: IPv4Address,
        outerDestIP: IPv4Address,
        sa: SADEntry
    ): IPPacket {
        // Create AH packet with inner packet as payload
        const ahPacket = this.createPacket(
            4, // IPv4 as next header (inner packet)
            sa.spi,
            sa.sequenceNumber++,
            innerPacket,
            sa
        );
        
        // Create outer IP packet
        return IPv4Protocol.createPacket(
            outerSourceIP,
            outerDestIP,
            IPSEC_PROTOCOLS.AH,
            ahPacket,
            { dontFragment: true }
        );
    }

    // Helper methods

    private static getICVSize(sa: SADEntry): number {
        // Standard truncated ICV size
        return 12; // 96 bits
    }

    private static calculateICV(packet: AHPacket, sa: SADEntry): Uint8Array {
        // Simplified ICV calculation
        const icvSize = packet.icv.length;
        const icv = new Uint8Array(icvSize);
        
        const authKey = sa.authKey ?? new Uint8Array(32);
        
        // Simple hash placeholder
        let hash = 0;
        hash = (hash * 31 + packet.nextHeader) >>> 0;
        hash = (hash * 31 + packet.spi) >>> 0;
        hash = (hash * 31 + packet.sequenceNumber) >>> 0;
        
        for (let i = 0; i < icvSize; i++) {
            icv[i] = ((hash >>> (i * 2)) ^ authKey[i % authKey.length]) & 0xFF;
        }
        
        return icv;
    }

    private static compareArrays(a: Uint8Array, b: Uint8Array): boolean {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    /**
     * Format AH packet for display
     */
    static formatPacket(packet: AHPacket): string {
        return `AH SPI=0x${packet.spi.toString(16).padStart(8, '0')} ` +
               `Seq=${packet.sequenceNumber} NextHdr=${packet.nextHeader} ` +
               `ICVLen=${packet.icv.length}`;
    }
}

/**
 * IKE Protocol handler
 */
export class IKEProtocol {
    private static spiCounter = Math.floor(Math.random() * 0xFFFFFFFF);
    
    /**
     * Generate SPI (Security Parameter Index)
     */
    static generateSPI(): Uint8Array {
        const spi = new Uint8Array(8);
        const value = ++this.spiCounter;
        const time = Date.now();
        
        // Mix counter and time for uniqueness
        spi[0] = (value >> 24) & 0xFF;
        spi[1] = (value >> 16) & 0xFF;
        spi[2] = (value >> 8) & 0xFF;
        spi[3] = value & 0xFF;
        spi[4] = (time >> 24) & 0xFF;
        spi[5] = (time >> 16) & 0xFF;
        spi[6] = (time >> 8) & 0xFF;
        spi[7] = time & 0xFF;
        
        return spi;
    }

    /**
     * Generate nonce
     */
    static generateNonce(size: number = 32): Uint8Array {
        const nonce = new Uint8Array(size);
        for (let i = 0; i < size; i++) {
            nonce[i] = Math.floor(Math.random() * 256);
        }
        return nonce;
    }

    /**
     * Create IKE header
     */
    static createHeader(
        initiatorSPI: Uint8Array,
        responderSPI: Uint8Array,
        exchangeType: number,
        isInitiator: boolean,
        isResponse: boolean,
        messageId: number,
        payloadLength: number
    ): IKEHeader {
        return {
            initiatorSPI,
            responderSPI,
            nextPayload: IKE_PAYLOAD_TYPES.SA,
            version: 0x20, // IKEv2
            exchangeType,
            flags: {
                initiator: isInitiator,
                version: false,
                response: isResponse,
            },
            messageId,
            length: 28 + payloadLength, // Header (28) + payload
        };
    }

    /**
     * Create IKE_SA_INIT request (IKEv2 Phase 1 initiation)
     */
    static createSAInitRequest(config: IKEConfig): {
        header: IKEHeader;
        initiatorSPI: Uint8Array;
        nonce: Uint8Array;
    } {
        const initiatorSPI = this.generateSPI();
        const nonce = this.generateNonce();
        
        const header = this.createHeader(
            initiatorSPI,
            new Uint8Array(8), // Responder SPI is 0 initially
            IKE_EXCHANGE_TYPES.IKE_SA_INIT,
            true,
            false,
            0,
            100 // Placeholder payload length
        );
        
        return { header, initiatorSPI, nonce };
    }

    /**
     * Create IKE_SA_INIT response
     */
    static createSAInitResponse(
        initiatorSPI: Uint8Array,
        config: IKEConfig
    ): {
        header: IKEHeader;
        responderSPI: Uint8Array;
        nonce: Uint8Array;
    } {
        const responderSPI = this.generateSPI();
        const nonce = this.generateNonce();
        
        const header = this.createHeader(
            initiatorSPI,
            responderSPI,
            IKE_EXCHANGE_TYPES.IKE_SA_INIT,
            false,
            true,
            0,
            100
        );
        
        return { header, responderSPI, nonce };
    }

    /**
     * Derive keys from shared secret (simplified)
     */
    static deriveKeys(
        sharedSecret: Uint8Array,
        initiatorNonce: Uint8Array,
        responderNonce: Uint8Array,
        initiatorSPI: Uint8Array,
        responderSPI: Uint8Array
    ): {
        skeyid: Uint8Array;
        skeyid_d: Uint8Array;
        skeyid_a: Uint8Array;
        skeyid_e: Uint8Array;
    } {
        // Simplified key derivation (real impl uses PRF functions)
        const keyMaterial = new Uint8Array(
            sharedSecret.length + initiatorNonce.length + responderNonce.length
        );
        
        keyMaterial.set(sharedSecret, 0);
        keyMaterial.set(initiatorNonce, sharedSecret.length);
        keyMaterial.set(responderNonce, sharedSecret.length + initiatorNonce.length);
        
        // Derive keys by hashing sections (simplified)
        const skeyid = this.simpleHash(keyMaterial, 32);
        const skeyid_d = this.simpleHash(new Uint8Array([...skeyid, 0x01]), 32);
        const skeyid_a = this.simpleHash(new Uint8Array([...skeyid, 0x02]), 32);
        const skeyid_e = this.simpleHash(new Uint8Array([...skeyid, 0x03]), 32);
        
        return { skeyid, skeyid_d, skeyid_a, skeyid_e };
    }

    /**
     * Simple hash placeholder
     */
    private static simpleHash(data: Uint8Array, outputSize: number): Uint8Array {
        const result = new Uint8Array(outputSize);
        let hash = 0;
        
        for (let i = 0; i < data.length; i++) {
            hash = ((hash << 5) - hash + data[i]) >>> 0;
        }
        
        for (let i = 0; i < outputSize; i++) {
            result[i] = (hash >>> ((i * 7) % 32)) & 0xFF;
        }
        
        return result;
    }

    /**
     * Format IKE header for display
     */
    static formatHeader(header: IKEHeader): string {
        const iSPI = Array.from(header.initiatorSPI).map(b => b.toString(16).padStart(2, '0')).join('');
        const rSPI = Array.from(header.responderSPI).map(b => b.toString(16).padStart(2, '0')).join('');
        const exchangeName = this.getExchangeTypeName(header.exchangeType);
        const flags: string[] = [];
        
        if (header.flags.initiator) flags.push('I');
        if (header.flags.response) flags.push('R');
        
        return `IKE ${exchangeName} I-SPI=${iSPI.substring(0, 8)}... ` +
               `R-SPI=${rSPI.substring(0, 8)}... MsgID=${header.messageId} [${flags.join(',')}]`;
    }

    /**
     * Get exchange type name
     */
    static getExchangeTypeName(type: number): string {
        switch (type) {
            case IKE_EXCHANGE_TYPES.IKE_SA_INIT: return 'IKE_SA_INIT';
            case IKE_EXCHANGE_TYPES.IKE_AUTH: return 'IKE_AUTH';
            case IKE_EXCHANGE_TYPES.CREATE_CHILD_SA: return 'CREATE_CHILD_SA';
            case IKE_EXCHANGE_TYPES.INFORMATIONAL_V2: return 'INFORMATIONAL';
            case IKE_EXCHANGE_TYPES.IDENTITY_PROTECTION: return 'Main Mode';
            case IKE_EXCHANGE_TYPES.AGGRESSIVE: return 'Aggressive Mode';
            case IKE_EXCHANGE_TYPES.QUICK_MODE: return 'Quick Mode';
            default: return `Unknown(${type})`;
        }
    }
}

/**
 * IPSec Manager - manages SAs, SPD, and tunnel operations
 */
export class IPSecManager {
    private sad: Map<string, SADEntry> = new Map();      // Security Association Database
    private spd: Map<string, SPDEntry> = new Map();      // Security Policy Database
    private ikeSessions: Map<string, IKESession> = new Map();
    
    private spiCounter = Math.floor(Math.random() * 0xFFFFFFFF);

    /**
     * Generate unique SPI
     */
    generateSPI(): number {
        return ++this.spiCounter >>> 0;
    }

    /**
     * Add SPD entry (security policy)
     */
    addPolicy(entry: SPDEntry): void {
        this.spd.set(entry.id, entry);
    }

    /**
     * Remove SPD entry
     */
    removePolicy(id: string): boolean {
        return this.spd.delete(id);
    }

    /**
     * Lookup policy for traffic
     */
    lookupPolicy(
        sourceIP: IPv4Address,
        destinationIP: IPv4Address,
        protocol?: number,
        sourcePort?: number,
        destinationPort?: number
    ): SPDEntry | null {
        // Sort by priority and find matching policy
        const policies = Array.from(this.spd.values())
            .sort((a, b) => a.priority - b.priority);
        
        for (const policy of policies) {
            if (this.matchesSelector(sourceIP, policy.sourceSelector) &&
                this.matchesSelector(destinationIP, policy.destinationSelector)) {
                
                if (policy.protocol && protocol && policy.protocol !== protocol) {
                    continue;
                }
                
                return policy;
            }
        }
        
        return null;
    }

    /**
     * Check if IP matches selector
     */
    private matchesSelector(
        ip: IPv4Address,
        selector: { address: IPv4Address; mask: IPv4Address; port?: number }
    ): boolean {
        const ipNum = ip.toNumber();
        const selectorNum = selector.address.toNumber();
        const maskNum = selector.mask.toNumber();
        
        return (ipNum & maskNum) === (selectorNum & maskNum);
    }

    /**
     * Create SA from configuration
     */
    createSA(
        config: IPSecConfig,
        direction: 'inbound' | 'outbound',
        ikeSessionId?: string
    ): SADEntry {
        const id = `sa-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const spi = this.generateSPI();
        const now = Date.now();
        
        // Generate keys (simplified - real impl derives from IKE)
        const encryptionKey = new Uint8Array(32);
        const authKey = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
            encryptionKey[i] = Math.floor(Math.random() * 256);
            authKey[i] = Math.floor(Math.random() * 256);
        }
        
        const entry: SADEntry = {
            id,
            spi,
            protocol: config.transformSet.encapsulation === 'ah' ? 'ah' : 'esp',
            encryptionKey: config.transformSet.encapsulation !== 'ah' ? encryptionKey : undefined,
            authKey,
            sequenceNumber: 0,
            lifetime: config.lifetime,
            bytesTransmitted: 0,
            packetsTransmitted: 0,
            
            direction,
            sourceAddress: config.localNetwork.address,
            destinationAddress: config.remoteNetwork.address,
            sourceSelector: config.localNetwork,
            destinationSelector: config.remoteNetwork,
            ikeSessionId,
            created: now,
            expires: now + (config.lifetime * 1000),
        };
        
        this.sad.set(id, entry);
        return entry;
    }

    /**
     * Get SA by SPI
     */
    getSABySPI(spi: number, direction: 'inbound' | 'outbound'): SADEntry | null {
        for (const sa of this.sad.values()) {
            if (sa.spi === spi && sa.direction === direction) {
                return sa;
            }
        }
        return null;
    }

    /**
     * Get SA for traffic
     */
    getSAForTraffic(
        sourceIP: IPv4Address,
        destinationIP: IPv4Address,
        direction: 'inbound' | 'outbound'
    ): SADEntry | null {
        for (const sa of this.sad.values()) {
            if (sa.direction !== direction) continue;
            
            if (sa.sourceSelector && sa.destinationSelector) {
                if (this.matchesSelector(sourceIP, sa.sourceSelector) &&
                    this.matchesSelector(destinationIP, sa.destinationSelector)) {
                    return sa;
                }
            }
        }
        return null;
    }

    /**
     * Remove SA
     */
    removeSA(id: string): boolean {
        return this.sad.delete(id);
    }

    /**
     * Create IKE session
     */
    createIKESession(
        localAddress: IPv4Address,
        remoteAddress: IPv4Address,
        config: IKEConfig,
        isInitiator: boolean
    ): IKESession {
        const id = `ike-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const now = Date.now();
        
        const session: IKESession = {
            id,
            localAddress,
            remoteAddress,
            initiatorSPI: isInitiator ? IKEProtocol.generateSPI() : new Uint8Array(8),
            responderSPI: new Uint8Array(8),
            phase: IKEPhase.IDLE,
            config,
            created: now,
            lastActivity: now,
            expires: now + (config.lifetime * 1000),
            childSAs: [],
        };
        
        this.ikeSessions.set(id, session);
        return session;
    }

    /**
     * Get IKE session
     */
    getIKESession(id: string): IKESession | undefined {
        return this.ikeSessions.get(id);
    }

    /**
     * Process outbound packet (apply IPSec if policy requires)
     */
    processOutbound(packet: IPPacket): IPPacket | null {
        const policy = this.lookupPolicy(
            packet.sourceIP,
            packet.destinationIP,
            packet.protocol
        );
        
        if (!policy) {
            return packet; // No policy, pass through
        }
        
        switch (policy.action) {
            case 'bypass':
                return packet;
                
            case 'discard':
                return null;
                
            case 'protect':
                const sa = this.getSAForTraffic(
                    packet.sourceIP,
                    packet.destinationIP,
                    'outbound'
                );
                
                if (!sa) {
                    // Need to establish SA first
                    return null;
                }
                
                // Encapsulate packet
                if (sa.protocol === 'esp') {
                    return ESPProtocol.encapsulateTunnel(
                        packet,
                        sa.sourceAddress,
                        sa.destinationAddress,
                        sa
                    );
                } else {
                    return AHProtocol.encapsulateTunnel(
                        packet,
                        sa.sourceAddress,
                        sa.destinationAddress,
                        sa
                    );
                }
        }
        
        return packet;
    }

    /**
     * Process inbound packet (decrypt/verify if IPSec)
     */
    processInbound(packet: IPPacket): IPPacket | null {
        if (packet.protocol === IPSEC_PROTOCOLS.ESP) {
            const espPacket = packet.payload as ESPPacket;
            const sa = this.getSABySPI(espPacket.spi, 'inbound');
            
            if (!sa) {
                return null; // Unknown SA
            }
            
            return ESPProtocol.decapsulateTunnel(packet, sa);
        }
        
        if (packet.protocol === IPSEC_PROTOCOLS.AH) {
            const ahPacket = packet.payload as AHPacket;
            const sa = this.getSABySPI(ahPacket.spi, 'inbound');
            
            if (!sa) {
                return null;
            }
            
            if (!AHProtocol.verifyPacket(ahPacket, sa)) {
                return null; // Authentication failed
            }
            
            return ahPacket.payload;
        }
        
        return packet;
    }

    /**
     * Get all SAs
     */
    getAllSAs(): SADEntry[] {
        return Array.from(this.sad.values());
    }

    /**
     * Get all policies
     */
    getAllPolicies(): SPDEntry[] {
        return Array.from(this.spd.values());
    }

    /**
     * Get all IKE sessions
     */
    getAllIKESessions(): IKESession[] {
        return Array.from(this.ikeSessions.values());
    }

    /**
     * Expire old SAs
     */
    expireOldSAs(): number {
        const now = Date.now();
        let expired = 0;
        
        for (const [id, sa] of this.sad) {
            if (sa.expires < now) {
                this.sad.delete(id);
                expired++;
            }
        }
        
        return expired;
    }

    /**
     * Format SA for display (like "show crypto ipsec sa")
     */
    formatSA(sa: SADEntry): string {
        return [
            `SA ID: ${sa.id}`,
            `  SPI: 0x${sa.spi.toString(16).padStart(8, '0')}`,
            `  Protocol: ${sa.protocol.toUpperCase()}`,
            `  Direction: ${sa.direction}`,
            `  Source: ${sa.sourceAddress.toString()}`,
            `  Destination: ${sa.destinationAddress.toString()}`,
            `  Packets: ${sa.packetsTransmitted}`,
            `  Bytes: ${sa.bytesTransmitted}`,
            `  Expires: ${new Date(sa.expires).toISOString()}`,
        ].join('\n');
    }

    /**
     * Get statistics
     */
    getStatistics(): {
        totalSAs: number;
        inboundSAs: number;
        outboundSAs: number;
        totalPolicies: number;
        activeSessions: number;
        totalPacketsEncrypted: number;
        totalBytesEncrypted: number;
    } {
        let inboundSAs = 0;
        let outboundSAs = 0;
        let totalPacketsEncrypted = 0;
        let totalBytesEncrypted = 0;
        
        for (const sa of this.sad.values()) {
            if (sa.direction === 'inbound') inboundSAs++;
            else outboundSAs++;
            
            totalPacketsEncrypted += sa.packetsTransmitted;
            totalBytesEncrypted += sa.bytesTransmitted;
        }
        
        return {
            totalSAs: this.sad.size,
            inboundSAs,
            outboundSAs,
            totalPolicies: this.spd.size,
            activeSessions: this.ikeSessions.size,
            totalPacketsEncrypted,
            totalBytesEncrypted,
        };
    }
}

export default IPSecManager;
