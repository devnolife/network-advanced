// ARP Protocol Implementation
// Implements Address Resolution Protocol for IPv4 to MAC address mapping

import type { IPv4Address, MACAddress, ARPPacket } from '../core/types';

/**
 * ARP Hardware Types
 */
export const ARP_HARDWARE_TYPES = {
    ETHERNET: 1,
    IEEE_802: 6,
} as const;

/**
 * ARP Protocol Types
 */
export const ARP_PROTOCOL_TYPES = {
    IPv4: 0x0800,
    IPv6: 0x86DD,
} as const;

/**
 * ARP Opcodes
 */
export const ARP_OPCODES = {
    REQUEST: 1,
    REPLY: 2,
    RARP_REQUEST: 3,
    RARP_REPLY: 4,
} as const;

/**
 * ARP Entry states
 */
export enum ARPEntryState {
    INCOMPLETE = 'INCOMPLETE',  // Request sent, waiting for reply
    REACHABLE = 'REACHABLE',    // Entry confirmed
    STALE = 'STALE',            // Entry expired but still usable
    DELAY = 'DELAY',            // Waiting before probe
    PROBE = 'PROBE',            // Sending probes
    PERMANENT = 'PERMANENT',    // Static entry
}

/**
 * ARP Table Entry
 */
export interface ARPEntry {
    ipAddress: IPv4Address;
    macAddress: MACAddress;
    state: ARPEntryState;
    interface: string;
    created: number;
    lastUsed: number;
    expires: number;
    retries: number;
}

/**
 * ARP Protocol handler for packet creation and parsing
 */
export class ARPProtocol {
    /**
     * Broadcast MAC address
     */
    static readonly BROADCAST_MAC: MACAddress = {
        bytes: [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF],
        toString: () => 'FF:FF:FF:FF:FF:FF',
    };
    
    /**
     * Zero MAC address (used in ARP requests)
     */
    static readonly ZERO_MAC: MACAddress = {
        bytes: [0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
        toString: () => '00:00:00:00:00:00',
    };

    /**
     * Create an ARP request packet
     */
    static createRequest(
        senderMAC: MACAddress,
        senderIP: IPv4Address,
        targetIP: IPv4Address
    ): ARPPacket {
        return {
            hardwareType: ARP_HARDWARE_TYPES.ETHERNET,
            protocolType: ARP_PROTOCOL_TYPES.IPv4,
            hardwareSize: 6, // MAC address length
            protocolSize: 4, // IPv4 address length
            opcode: 'request',
            senderMAC,
            senderIP,
            targetMAC: this.ZERO_MAC, // Unknown
            targetIP,
        };
    }

    /**
     * Create an ARP reply packet
     */
    static createReply(
        senderMAC: MACAddress,
        senderIP: IPv4Address,
        targetMAC: MACAddress,
        targetIP: IPv4Address
    ): ARPPacket {
        return {
            hardwareType: ARP_HARDWARE_TYPES.ETHERNET,
            protocolType: ARP_PROTOCOL_TYPES.IPv4,
            hardwareSize: 6,
            protocolSize: 4,
            opcode: 'reply',
            senderMAC,
            senderIP,
            targetMAC,
            targetIP,
        };
    }

    /**
     * Create a Gratuitous ARP (announce IP)
     */
    static createGratuitousARP(
        mac: MACAddress,
        ip: IPv4Address
    ): ARPPacket {
        return {
            hardwareType: ARP_HARDWARE_TYPES.ETHERNET,
            protocolType: ARP_PROTOCOL_TYPES.IPv4,
            hardwareSize: 6,
            protocolSize: 4,
            opcode: 'request',
            senderMAC: mac,
            senderIP: ip,
            targetMAC: this.ZERO_MAC,
            targetIP: ip, // Same as sender IP
        };
    }

    /**
     * Create an ARP probe (for duplicate address detection)
     */
    static createProbe(
        senderMAC: MACAddress,
        targetIP: IPv4Address
    ): ARPPacket {
        // ARP probe has sender IP as 0.0.0.0
        const zeroIP: IPv4Address = {
            octets: [0, 0, 0, 0],
            toString: () => '0.0.0.0',
            toNumber: () => 0,
        };
        
        return {
            hardwareType: ARP_HARDWARE_TYPES.ETHERNET,
            protocolType: ARP_PROTOCOL_TYPES.IPv4,
            hardwareSize: 6,
            protocolSize: 4,
            opcode: 'request',
            senderMAC,
            senderIP: zeroIP,
            targetMAC: this.ZERO_MAC,
            targetIP,
        };
    }

    /**
     * Create ARP reply from request
     */
    static createReplyFromRequest(
        request: ARPPacket,
        replyMAC: MACAddress
    ): ARPPacket {
        return this.createReply(
            replyMAC,
            request.targetIP,
            request.senderMAC,
            request.senderIP
        );
    }

    /**
     * Check if packet is an ARP request
     */
    static isRequest(packet: ARPPacket): boolean {
        return packet.opcode === 'request';
    }

    /**
     * Check if packet is an ARP reply
     */
    static isReply(packet: ARPPacket): boolean {
        return packet.opcode === 'reply';
    }

    /**
     * Check if packet is a Gratuitous ARP
     */
    static isGratuitous(packet: ARPPacket): boolean {
        return packet.senderIP.toString() === packet.targetIP.toString();
    }

    /**
     * Check if packet is an ARP probe
     */
    static isProbe(packet: ARPPacket): boolean {
        return packet.senderIP.octets.every(o => o === 0);
    }

    /**
     * Validate ARP packet
     */
    static validate(packet: ARPPacket): { valid: boolean; error?: string } {
        if (packet.hardwareType !== ARP_HARDWARE_TYPES.ETHERNET) {
            return { valid: false, error: 'Unsupported hardware type' };
        }
        
        if (packet.protocolType !== ARP_PROTOCOL_TYPES.IPv4) {
            return { valid: false, error: 'Unsupported protocol type' };
        }
        
        if (packet.hardwareSize !== 6) {
            return { valid: false, error: 'Invalid hardware size' };
        }
        
        if (packet.protocolSize !== 4) {
            return { valid: false, error: 'Invalid protocol size' };
        }
        
        if (packet.opcode !== 'request' && packet.opcode !== 'reply') {
            return { valid: false, error: 'Invalid opcode' };
        }
        
        return { valid: true };
    }

    /**
     * Format packet for display
     */
    static formatPacket(packet: ARPPacket): string {
        const opStr = packet.opcode === 'request' ? 'who-has' : 'reply';
        const senderIP = packet.senderIP.toString();
        const senderMAC = packet.senderMAC.toString();
        const targetIP = packet.targetIP.toString();
        const targetMAC = packet.targetMAC.toString();
        
        if (packet.opcode === 'request') {
            return `ARP ${opStr} ${targetIP} tell ${senderIP} (${senderMAC})`;
        } else {
            return `ARP ${opStr} ${senderIP} is-at ${senderMAC} to ${targetIP} (${targetMAC})`;
        }
    }
}

/**
 * MAC Address utilities
 */
export class MACAddressHelper {
    /**
     * Parse MAC address string to MACAddress
     * Supports formats: XX:XX:XX:XX:XX:XX, XX-XX-XX-XX-XX-XX, XXXX.XXXX.XXXX
     */
    static parse(address: string): MACAddress {
        let normalized = address.toUpperCase();
        
        // Handle different formats
        if (normalized.includes('.')) {
            // Cisco format: XXXX.XXXX.XXXX
            normalized = normalized.replace(/\./g, '');
        } else {
            // Standard formats
            normalized = normalized.replace(/[:-]/g, '');
        }
        
        if (normalized.length !== 12 || !/^[0-9A-F]+$/.test(normalized)) {
            throw new Error(`Invalid MAC address: ${address}`);
        }
        
        const bytes: [number, number, number, number, number, number] = [
            parseInt(normalized.substring(0, 2), 16),
            parseInt(normalized.substring(2, 4), 16),
            parseInt(normalized.substring(4, 6), 16),
            parseInt(normalized.substring(6, 8), 16),
            parseInt(normalized.substring(8, 10), 16),
            parseInt(normalized.substring(10, 12), 16),
        ];
        
        return {
            bytes,
            toString: () => bytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(':'),
        };
    }

    /**
     * Generate random MAC address
     */
    static generateRandom(oui?: [number, number, number]): MACAddress {
        const bytes: [number, number, number, number, number, number] = [
            oui?.[0] ?? (Math.random() * 256) | 0,
            oui?.[1] ?? (Math.random() * 256) | 0,
            oui?.[2] ?? (Math.random() * 256) | 0,
            (Math.random() * 256) | 0,
            (Math.random() * 256) | 0,
            (Math.random() * 256) | 0,
        ];
        
        // Clear multicast bit, set locally administered bit
        bytes[0] = (bytes[0] & 0xFE) | 0x02;
        
        return {
            bytes,
            toString: () => bytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(':'),
        };
    }

    /**
     * Check if MAC is broadcast
     */
    static isBroadcast(mac: MACAddress): boolean {
        return mac.bytes.every(b => b === 0xFF);
    }

    /**
     * Check if MAC is multicast
     */
    static isMulticast(mac: MACAddress): boolean {
        return (mac.bytes[0] & 0x01) === 0x01;
    }

    /**
     * Check if MAC is unicast
     */
    static isUnicast(mac: MACAddress): boolean {
        return (mac.bytes[0] & 0x01) === 0x00;
    }

    /**
     * Check if MAC is locally administered
     */
    static isLocallyAdministered(mac: MACAddress): boolean {
        return (mac.bytes[0] & 0x02) === 0x02;
    }

    /**
     * Compare two MAC addresses
     */
    static equals(mac1: MACAddress, mac2: MACAddress): boolean {
        return mac1.bytes.every((b, i) => b === mac2.bytes[i]);
    }

    /**
     * Format MAC in different styles
     */
    static format(mac: MACAddress, style: 'colon' | 'hyphen' | 'cisco' = 'colon'): string {
        const hex = mac.bytes.map(b => b.toString(16).toUpperCase().padStart(2, '0'));
        
        switch (style) {
            case 'hyphen':
                return hex.join('-');
            case 'cisco':
                return `${hex[0]}${hex[1]}.${hex[2]}${hex[3]}.${hex[4]}${hex[5]}`;
            default:
                return hex.join(':');
        }
    }
}

/**
 * ARP Table Manager - handles ARP cache operations
 */
export class ARPTable {
    private entries: Map<string, ARPEntry> = new Map();
    
    // Configuration
    private readonly defaultTimeout = 300000; // 5 minutes (in ms)
    private readonly incompleteTimeout = 3000; // 3 seconds
    private readonly maxRetries = 3;
    
    /**
     * Add or update an entry
     */
    add(
        ipAddress: IPv4Address,
        macAddress: MACAddress,
        interfaceName: string,
        permanent: boolean = false
    ): void {
        const key = ipAddress.toString();
        const now = Date.now();
        
        const entry: ARPEntry = {
            ipAddress,
            macAddress,
            state: permanent ? ARPEntryState.PERMANENT : ARPEntryState.REACHABLE,
            interface: interfaceName,
            created: now,
            lastUsed: now,
            expires: permanent ? Infinity : now + this.defaultTimeout,
            retries: 0,
        };
        
        this.entries.set(key, entry);
    }

    /**
     * Add incomplete entry (waiting for reply)
     */
    addIncomplete(
        ipAddress: IPv4Address,
        interfaceName: string
    ): ARPEntry {
        const key = ipAddress.toString();
        const now = Date.now();
        
        const entry: ARPEntry = {
            ipAddress,
            macAddress: ARPProtocol.ZERO_MAC,
            state: ARPEntryState.INCOMPLETE,
            interface: interfaceName,
            created: now,
            lastUsed: now,
            expires: now + this.incompleteTimeout,
            retries: 0,
        };
        
        this.entries.set(key, entry);
        return entry;
    }

    /**
     * Lookup MAC address for IP
     */
    lookup(ipAddress: IPv4Address): ARPEntry | null {
        const key = ipAddress.toString();
        const entry = this.entries.get(key);
        
        if (!entry) {
            return null;
        }
        
        // Check if expired
        if (entry.state !== ARPEntryState.PERMANENT && 
            entry.expires < Date.now()) {
            
            if (entry.state === ARPEntryState.REACHABLE) {
                // Move to STALE state
                entry.state = ARPEntryState.STALE;
            } else {
                // Remove expired entry
                this.entries.delete(key);
                return null;
            }
        }
        
        // Update last used
        entry.lastUsed = Date.now();
        
        return entry;
    }

    /**
     * Resolve IP address (returns MAC if known, null if needs ARP)
     */
    resolve(ipAddress: IPv4Address): MACAddress | null {
        const entry = this.lookup(ipAddress);
        
        if (!entry || entry.state === ARPEntryState.INCOMPLETE) {
            return null;
        }
        
        return entry.macAddress;
    }

    /**
     * Update entry from ARP reply
     */
    updateFromReply(
        ipAddress: IPv4Address,
        macAddress: MACAddress,
        interfaceName: string
    ): void {
        const key = ipAddress.toString();
        const existing = this.entries.get(key);
        const now = Date.now();
        
        if (existing) {
            // Don't update permanent entries
            if (existing.state === ARPEntryState.PERMANENT) {
                return;
            }
            
            existing.macAddress = macAddress;
            existing.state = ARPEntryState.REACHABLE;
            existing.lastUsed = now;
            existing.expires = now + this.defaultTimeout;
            existing.retries = 0;
        } else {
            // Create new entry
            this.add(ipAddress, macAddress, interfaceName);
        }
    }

    /**
     * Remove an entry
     */
    remove(ipAddress: IPv4Address): boolean {
        return this.entries.delete(ipAddress.toString());
    }

    /**
     * Clear all non-permanent entries
     */
    clearDynamic(): void {
        for (const [key, entry] of this.entries) {
            if (entry.state !== ARPEntryState.PERMANENT) {
                this.entries.delete(key);
            }
        }
    }

    /**
     * Clear all entries
     */
    clear(): void {
        this.entries.clear();
    }

    /**
     * Get all entries
     */
    getAllEntries(): ARPEntry[] {
        return Array.from(this.entries.values());
    }

    /**
     * Get entries for interface
     */
    getEntriesForInterface(interfaceName: string): ARPEntry[] {
        return this.getAllEntries().filter(e => e.interface === interfaceName);
    }

    /**
     * Check for duplicate IP (returns conflicting entry if found)
     */
    checkDuplicate(ipAddress: IPv4Address, myMAC: MACAddress): ARPEntry | null {
        const entry = this.lookup(ipAddress);
        
        if (entry && !MACAddressHelper.equals(entry.macAddress, myMAC)) {
            return entry;
        }
        
        return null;
    }

    /**
     * Increment retry count for incomplete entry
     */
    incrementRetry(ipAddress: IPv4Address): boolean {
        const entry = this.lookup(ipAddress);
        
        if (!entry || entry.state !== ARPEntryState.INCOMPLETE) {
            return false;
        }
        
        entry.retries++;
        
        if (entry.retries >= this.maxRetries) {
            // Remove failed entry
            this.entries.delete(ipAddress.toString());
            return false;
        }
        
        // Extend timeout
        entry.expires = Date.now() + this.incompleteTimeout;
        return true;
    }

    /**
     * Expire old entries
     */
    expireOldEntries(): number {
        const now = Date.now();
        let expired = 0;
        
        for (const [key, entry] of this.entries) {
            if (entry.state === ARPEntryState.PERMANENT) {
                continue;
            }
            
            if (entry.expires < now) {
                if (entry.state === ARPEntryState.REACHABLE) {
                    entry.state = ARPEntryState.STALE;
                } else {
                    this.entries.delete(key);
                    expired++;
                }
            }
        }
        
        return expired;
    }

    /**
     * Get table size
     */
    size(): number {
        return this.entries.size;
    }

    /**
     * Format table for display (like "show arp")
     */
    formatTable(): string {
        const lines = ['Protocol  Address          Age (min)  Hardware Addr      Type   Interface'];
        
        for (const entry of this.entries.values()) {
            const age = entry.state === ARPEntryState.PERMANENT 
                ? '-' 
                : Math.floor((Date.now() - entry.created) / 60000).toString();
            
            const type = entry.state === ARPEntryState.PERMANENT ? 'STATIC' : 'ARPA';
            
            lines.push(
                `Internet  ${entry.ipAddress.toString().padEnd(15)}  ${age.padStart(5)}  ` +
                `${entry.macAddress.toString()}  ${type.padEnd(6)} ${entry.interface}`
            );
        }
        
        return lines.join('\n');
    }

    /**
     * Get statistics
     */
    getStatistics(): {
        total: number;
        reachable: number;
        stale: number;
        incomplete: number;
        permanent: number;
    } {
        let reachable = 0;
        let stale = 0;
        let incomplete = 0;
        let permanent = 0;
        
        for (const entry of this.entries.values()) {
            switch (entry.state) {
                case ARPEntryState.REACHABLE:
                    reachable++;
                    break;
                case ARPEntryState.STALE:
                    stale++;
                    break;
                case ARPEntryState.INCOMPLETE:
                    incomplete++;
                    break;
                case ARPEntryState.PERMANENT:
                    permanent++;
                    break;
            }
        }
        
        return {
            total: this.entries.size,
            reachable,
            stale,
            incomplete,
            permanent,
        };
    }
}

/**
 * ARP Manager - handles ARP operations for a device
 */
export class ARPManager {
    private table: ARPTable;
    private pendingRequests: Map<string, {
        callbacks: Array<(mac: MACAddress | null) => void>;
        timeout: ReturnType<typeof setTimeout>;
    }> = new Map();
    
    constructor() {
        this.table = new ARPTable();
    }

    /**
     * Get the ARP table
     */
    getTable(): ARPTable {
        return this.table;
    }

    /**
     * Process incoming ARP packet
     */
    processPacket(
        packet: ARPPacket,
        receivedInterface: string,
        myIP: IPv4Address,
        myMAC: MACAddress
    ): ARPPacket | null {
        // Always update cache from sender info (ARP snooping)
        if (!ARPProtocol.isProbe(packet)) {
            this.table.updateFromReply(
                packet.senderIP,
                packet.senderMAC,
                receivedInterface
            );
        }
        
        // Handle request
        if (ARPProtocol.isRequest(packet)) {
            // Is this request for our IP?
            if (packet.targetIP.toString() === myIP.toString()) {
                // Send reply
                return ARPProtocol.createReply(
                    myMAC,
                    myIP,
                    packet.senderMAC,
                    packet.senderIP
                );
            }
        }
        
        // Handle reply
        if (ARPProtocol.isReply(packet)) {
            // Update any pending requests
            const key = packet.senderIP.toString();
            const pending = this.pendingRequests.get(key);
            
            if (pending) {
                clearTimeout(pending.timeout);
                
                for (const callback of pending.callbacks) {
                    callback(packet.senderMAC);
                }
                
                this.pendingRequests.delete(key);
            }
        }
        
        return null;
    }

    /**
     * Resolve IP address (async with timeout)
     */
    resolve(
        targetIP: IPv4Address,
        timeout: number = 3000
    ): Promise<MACAddress | null> {
        // Check cache first
        const cached = this.table.resolve(targetIP);
        if (cached) {
            return Promise.resolve(cached);
        }
        
        // Check for pending request
        const key = targetIP.toString();
        const pending = this.pendingRequests.get(key);
        
        return new Promise((resolve) => {
            if (pending) {
                pending.callbacks.push(resolve);
            } else {
                const timeoutId = setTimeout(() => {
                    const p = this.pendingRequests.get(key);
                    if (p) {
                        for (const callback of p.callbacks) {
                            callback(null);
                        }
                        this.pendingRequests.delete(key);
                    }
                }, timeout);
                
                this.pendingRequests.set(key, {
                    callbacks: [resolve],
                    timeout: timeoutId,
                });
            }
        });
    }

    /**
     * Create ARP request for resolution
     */
    createRequest(
        myMAC: MACAddress,
        myIP: IPv4Address,
        targetIP: IPv4Address
    ): ARPPacket {
        // Add incomplete entry
        this.table.addIncomplete(targetIP, 'unknown');
        
        return ARPProtocol.createRequest(myMAC, myIP, targetIP);
    }

    /**
     * Add static entry
     */
    addStatic(
        ipAddress: IPv4Address,
        macAddress: MACAddress,
        interfaceName: string
    ): void {
        this.table.add(ipAddress, macAddress, interfaceName, true);
    }

    /**
     * Clear the ARP cache
     */
    clearCache(): void {
        this.table.clearDynamic();
    }
}

export default ARPProtocol;
