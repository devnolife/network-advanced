// IPv4 Protocol Implementation

import type { IPv4Address, IPPacket, TCPSegment, UDPDatagram, ICMPPacket, ESPPacket, AHPacket } from '../core/types';

/**
 * Protocol numbers as defined in IANA
 */
export const IP_PROTOCOLS = {
    ICMP: 1,
    TCP: 6,
    UDP: 17,
    ESP: 50,
    AH: 51,
} as const;

/**
 * EtherType values
 */
export const ETHER_TYPES = {
    IPv4: 0x0800,
    ARP: 0x0806,
    IPv6: 0x86DD,
} as const;

/**
 * IPv4 Protocol class for packet creation, parsing, and validation
 */
export class IPv4Protocol {
    private static idCounter = 0;

    /**
     * Create a new IP packet
     */
    static createPacket(
        sourceIP: IPv4Address,
        destinationIP: IPv4Address,
        protocol: number,
        payload: TCPSegment | UDPDatagram | ICMPPacket | ESPPacket | AHPacket,
        options?: {
            ttl?: number;
            dscp?: number;
            dontFragment?: boolean;
            identification?: number;
        }
    ): IPPacket {
        const payloadSize = this.calculatePayloadSize(payload, protocol);
        const headerLength = 5; // 5 * 4 = 20 bytes (no options)
        
        return {
            version: 4,
            ihl: headerLength,
            dscp: options?.dscp ?? 0,
            ecn: 0,
            totalLength: headerLength * 4 + payloadSize,
            identification: options?.identification ?? this.generateId(),
            flags: {
                reserved: false,
                dontFragment: options?.dontFragment ?? false,
                moreFragments: false,
            },
            fragmentOffset: 0,
            ttl: options?.ttl ?? 64,
            protocol,
            headerChecksum: 0, // Will be calculated
            sourceIP,
            destinationIP,
            payload,
        };
    }

    /**
     * Calculate payload size based on protocol
     */
    private static calculatePayloadSize(
        payload: TCPSegment | UDPDatagram | ICMPPacket | ESPPacket | AHPacket,
        protocol: number
    ): number {
        switch (protocol) {
            case IP_PROTOCOLS.TCP: {
                const tcp = payload as TCPSegment;
                const headerSize = tcp.dataOffset * 4;
                const dataSize = tcp.data?.length ?? 0;
                return headerSize + dataSize;
            }
            case IP_PROTOCOLS.UDP: {
                const udp = payload as UDPDatagram;
                return udp.length;
            }
            case IP_PROTOCOLS.ICMP: {
                const icmp = payload as ICMPPacket;
                return 8 + (icmp.data?.length ?? 0); // 8 bytes header + data
            }
            case IP_PROTOCOLS.ESP: {
                const esp = payload as ESPPacket;
                return 8 + (esp.iv?.length ?? 0) + esp.encryptedPayload.length + 
                       (esp.padding?.length ?? 0) + 2 + (esp.authData?.length ?? 0);
            }
            case IP_PROTOCOLS.AH: {
                const ah = payload as AHPacket;
                return 12 + ah.icv.length + this.calculateIPPacketSize(ah.payload);
            }
            default:
                return 0;
        }
    }

    /**
     * Calculate total IP packet size
     */
    static calculateIPPacketSize(packet: IPPacket): number {
        return packet.totalLength;
    }

    /**
     * Generate unique packet ID
     */
    private static generateId(): number {
        this.idCounter = (this.idCounter + 1) % 65536;
        return this.idCounter;
    }

    /**
     * Calculate IP header checksum
     */
    static calculateChecksum(packet: IPPacket): number {
        // Convert header to 16-bit words
        const words: number[] = [];
        
        // Word 0: Version, IHL, DSCP, ECN
        words.push(((packet.version << 12) | (packet.ihl << 8) | (packet.dscp << 2) | packet.ecn));
        
        // Word 1: Total Length
        words.push(packet.totalLength);
        
        // Word 2: Identification
        words.push(packet.identification);
        
        // Word 3: Flags, Fragment Offset
        const flags = (packet.flags.reserved ? 0x8000 : 0) |
                      (packet.flags.dontFragment ? 0x4000 : 0) |
                      (packet.flags.moreFragments ? 0x2000 : 0);
        words.push(flags | packet.fragmentOffset);
        
        // Word 4: TTL, Protocol
        words.push((packet.ttl << 8) | packet.protocol);
        
        // Word 5: Header Checksum (0 for calculation)
        words.push(0);
        
        // Words 6-7: Source IP
        words.push((packet.sourceIP.octets[0] << 8) | packet.sourceIP.octets[1]);
        words.push((packet.sourceIP.octets[2] << 8) | packet.sourceIP.octets[3]);
        
        // Words 8-9: Destination IP
        words.push((packet.destinationIP.octets[0] << 8) | packet.destinationIP.octets[1]);
        words.push((packet.destinationIP.octets[2] << 8) | packet.destinationIP.octets[3]);
        
        // Calculate checksum
        let sum = words.reduce((acc, word) => acc + word, 0);
        
        // Add carry bits
        while (sum > 0xFFFF) {
            sum = (sum & 0xFFFF) + (sum >> 16);
        }
        
        // One's complement
        return (~sum) & 0xFFFF;
    }

    /**
     * Verify IP header checksum
     */
    static verifyChecksum(packet: IPPacket): boolean {
        const calculated = this.calculateChecksum(packet);
        return calculated === 0 || packet.headerChecksum === calculated;
    }

    /**
     * Decrement TTL and return new packet
     */
    static decrementTTL(packet: IPPacket): IPPacket {
        const newPacket = { ...packet, ttl: packet.ttl - 1 };
        newPacket.headerChecksum = this.calculateChecksum(newPacket);
        return newPacket;
    }

    /**
     * Check if TTL is expired
     */
    static isTTLExpired(packet: IPPacket): boolean {
        return packet.ttl <= 0;
    }

    /**
     * Fragment a packet if necessary
     */
    static fragment(packet: IPPacket, mtu: number): IPPacket[] {
        const headerSize = packet.ihl * 4;
        const maxPayloadSize = mtu - headerSize;
        
        // Can't fragment if DF flag is set
        if (packet.flags.dontFragment) {
            return [packet];
        }
        
        // No fragmentation needed
        if (packet.totalLength <= mtu) {
            return [packet];
        }
        
        // Fragment the packet
        const fragments: IPPacket[] = [];
        const payloadData = this.serializePayload(packet.payload, packet.protocol);
        
        // Align to 8-byte boundary
        const fragmentPayloadSize = Math.floor(maxPayloadSize / 8) * 8;
        
        let offset = 0;
        while (offset < payloadData.length) {
            const isLast = offset + fragmentPayloadSize >= payloadData.length;
            const fragmentData = payloadData.slice(offset, offset + fragmentPayloadSize);
            
            const fragment: IPPacket = {
                ...packet,
                totalLength: headerSize + fragmentData.length,
                flags: {
                    ...packet.flags,
                    moreFragments: !isLast,
                },
                fragmentOffset: offset / 8,
                payload: { fragmentData } as unknown as IPPacket['payload'],
            };
            
            fragment.headerChecksum = this.calculateChecksum(fragment);
            fragments.push(fragment);
            
            offset += fragmentPayloadSize;
        }
        
        return fragments;
    }

    /**
     * Serialize payload to bytes (simplified)
     */
    private static serializePayload(
        payload: TCPSegment | UDPDatagram | ICMPPacket | ESPPacket | AHPacket,
        protocol: number
    ): Uint8Array {
        // Simplified serialization
        const size = this.calculatePayloadSize(payload, protocol);
        return new Uint8Array(size);
    }

    /**
     * Check if packet is a fragment
     */
    static isFragment(packet: IPPacket): boolean {
        return packet.flags.moreFragments || packet.fragmentOffset > 0;
    }

    /**
     * Get protocol name from number
     */
    static getProtocolName(protocol: number): string {
        switch (protocol) {
            case IP_PROTOCOLS.ICMP: return 'ICMP';
            case IP_PROTOCOLS.TCP: return 'TCP';
            case IP_PROTOCOLS.UDP: return 'UDP';
            case IP_PROTOCOLS.ESP: return 'ESP';
            case IP_PROTOCOLS.AH: return 'AH';
            default: return `Unknown(${protocol})`;
        }
    }

    /**
     * Format packet for display
     */
    static formatPacket(packet: IPPacket): string {
        const src = packet.sourceIP.octets.join('.');
        const dst = packet.destinationIP.octets.join('.');
        const proto = this.getProtocolName(packet.protocol);
        
        return `IPv4 ${src} -> ${dst} (${proto}, TTL=${packet.ttl}, Len=${packet.totalLength})`;
    }

    /**
     * Create pseudo header for TCP/UDP checksum calculation
     */
    static createPseudoHeader(
        sourceIP: IPv4Address,
        destinationIP: IPv4Address,
        protocol: number,
        length: number
    ): Uint8Array {
        const header = new Uint8Array(12);
        
        // Source IP (4 bytes)
        header[0] = sourceIP.octets[0];
        header[1] = sourceIP.octets[1];
        header[2] = sourceIP.octets[2];
        header[3] = sourceIP.octets[3];
        
        // Destination IP (4 bytes)
        header[4] = destinationIP.octets[0];
        header[5] = destinationIP.octets[1];
        header[6] = destinationIP.octets[2];
        header[7] = destinationIP.octets[3];
        
        // Zero (1 byte)
        header[8] = 0;
        
        // Protocol (1 byte)
        header[9] = protocol;
        
        // Length (2 bytes)
        header[10] = (length >> 8) & 0xFF;
        header[11] = length & 0xFF;
        
        return header;
    }
}

/**
 * IP Address utilities
 */
export class IPv4AddressHelper {
    /**
     * Parse IP address string to IPv4Address
     */
    static parse(address: string): IPv4Address {
        const parts = address.split('.');
        if (parts.length !== 4) {
            throw new Error(`Invalid IP address: ${address}`);
        }
        
        const octets = parts.map(p => {
            const num = parseInt(p, 10);
            if (isNaN(num) || num < 0 || num > 255) {
                throw new Error(`Invalid octet in IP address: ${p}`);
            }
            return num;
        }) as [number, number, number, number];
        
        return {
            octets,
            toString: () => octets.join('.'),
            toNumber: () => (octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3],
        };
    }

    /**
     * Create IP address from number
     */
    static fromNumber(num: number): IPv4Address {
        const octets: [number, number, number, number] = [
            (num >> 24) & 0xFF,
            (num >> 16) & 0xFF,
            (num >> 8) & 0xFF,
            num & 0xFF,
        ];
        
        return {
            octets,
            toString: () => octets.join('.'),
            toNumber: () => num,
        };
    }

    /**
     * Check if address is in subnet
     */
    static isInSubnet(address: IPv4Address, network: IPv4Address, mask: IPv4Address): boolean {
        const addrNum = address.toNumber();
        const netNum = network.toNumber();
        const maskNum = mask.toNumber();
        
        return (addrNum & maskNum) === (netNum & maskNum);
    }

    /**
     * Calculate network address
     */
    static getNetworkAddress(address: IPv4Address, mask: IPv4Address): IPv4Address {
        const netNum = address.toNumber() & mask.toNumber();
        return this.fromNumber(netNum);
    }

    /**
     * Calculate broadcast address
     */
    static getBroadcastAddress(address: IPv4Address, mask: IPv4Address): IPv4Address {
        const netNum = address.toNumber();
        const maskNum = mask.toNumber();
        const broadcastNum = netNum | (~maskNum >>> 0);
        return this.fromNumber(broadcastNum >>> 0);
    }

    /**
     * Check if address is private
     */
    static isPrivate(address: IPv4Address): boolean {
        const first = address.octets[0];
        const second = address.octets[1];
        
        // 10.0.0.0/8
        if (first === 10) return true;
        
        // 172.16.0.0/12
        if (first === 172 && second >= 16 && second <= 31) return true;
        
        // 192.168.0.0/16
        if (first === 192 && second === 168) return true;
        
        return false;
    }

    /**
     * Check if address is loopback
     */
    static isLoopback(address: IPv4Address): boolean {
        return address.octets[0] === 127;
    }

    /**
     * Check if address is multicast
     */
    static isMulticast(address: IPv4Address): boolean {
        return address.octets[0] >= 224 && address.octets[0] <= 239;
    }

    /**
     * Check if address is broadcast
     */
    static isBroadcast(address: IPv4Address): boolean {
        return address.octets.every(o => o === 255);
    }

    /**
     * Get CIDR prefix length from mask
     */
    static maskToCIDR(mask: IPv4Address): number {
        const maskNum = mask.toNumber() >>> 0;
        let count = 0;
        let bit = 0x80000000;
        
        while (bit !== 0 && (maskNum & bit) !== 0) {
            count++;
            bit >>>= 1;
        }
        
        return count;
    }

    /**
     * Create mask from CIDR prefix length
     */
    static cidrToMask(cidr: number): IPv4Address {
        if (cidr < 0 || cidr > 32) {
            throw new Error(`Invalid CIDR: ${cidr}`);
        }
        
        const maskNum = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
        return this.fromNumber(maskNum);
    }
}

export default IPv4Protocol;
