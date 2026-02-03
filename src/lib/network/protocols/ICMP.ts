// ICMP Protocol Implementation
// Implements Echo Request/Reply (ping), Destination Unreachable, Time Exceeded, etc.

import type { IPv4Address, ICMPPacket, IPPacket } from '../core/types';

/**
 * ICMP Message Types
 */
export const ICMP_TYPES = {
    ECHO_REPLY: 0,
    DESTINATION_UNREACHABLE: 3,
    SOURCE_QUENCH: 4,
    REDIRECT: 5,
    ECHO_REQUEST: 8,
    ROUTER_ADVERTISEMENT: 9,
    ROUTER_SOLICITATION: 10,
    TIME_EXCEEDED: 11,
    PARAMETER_PROBLEM: 12,
    TIMESTAMP_REQUEST: 13,
    TIMESTAMP_REPLY: 14,
    INFO_REQUEST: 15,
    INFO_REPLY: 16,
    ADDRESS_MASK_REQUEST: 17,
    ADDRESS_MASK_REPLY: 18,
} as const;

/**
 * ICMP Destination Unreachable Codes
 */
export const ICMP_DEST_UNREACHABLE_CODES = {
    NET_UNREACHABLE: 0,
    HOST_UNREACHABLE: 1,
    PROTOCOL_UNREACHABLE: 2,
    PORT_UNREACHABLE: 3,
    FRAGMENTATION_NEEDED: 4,
    SOURCE_ROUTE_FAILED: 5,
    DEST_NETWORK_UNKNOWN: 6,
    DEST_HOST_UNKNOWN: 7,
    SOURCE_HOST_ISOLATED: 8,
    DEST_NETWORK_PROHIBITED: 9,
    DEST_HOST_PROHIBITED: 10,
    NETWORK_TOS_UNREACHABLE: 11,
    HOST_TOS_UNREACHABLE: 12,
    COMM_PROHIBITED: 13,
    HOST_PRECEDENCE_VIOLATION: 14,
    PRECEDENCE_CUTOFF: 15,
} as const;

/**
 * ICMP Time Exceeded Codes
 */
export const ICMP_TIME_EXCEEDED_CODES = {
    TTL_EXCEEDED: 0,
    FRAGMENT_REASSEMBLY_EXCEEDED: 1,
} as const;

/**
 * ICMP Redirect Codes
 */
export const ICMP_REDIRECT_CODES = {
    NETWORK: 0,
    HOST: 1,
    TOS_NETWORK: 2,
    TOS_HOST: 3,
} as const;

/**
 * ICMP Echo data for ping tracking
 */
export interface ICMPEchoData {
    identifier: number;
    sequenceNumber: number;
    timestamp?: number;
    payload?: Uint8Array;
}

/**
 * ICMP Protocol handler for message creation and parsing
 */
export class ICMPProtocol {
    private static identifierCounter = Math.floor(Math.random() * 65536);
    
    /**
     * Create an ICMP packet
     */
    static createPacket(
        type: number,
        code: number,
        data?: Uint8Array
    ): ICMPPacket {
        return {
            type,
            code,
            checksum: 0, // Will be calculated
            data,
        };
    }

    /**
     * Create an Echo Request (ping)
     */
    static createEchoRequest(
        identifier?: number,
        sequenceNumber?: number,
        payloadSize: number = 32
    ): { packet: ICMPPacket; echoData: ICMPEchoData } {
        const id = identifier ?? this.generateIdentifier();
        const seq = sequenceNumber ?? 0;
        const timestamp = Date.now();
        
        // Build data: identifier (2) + sequence (2) + timestamp (8) + payload
        const dataSize = 4 + 8 + payloadSize;
        const data = new Uint8Array(dataSize);
        
        // Identifier (2 bytes)
        data[0] = (id >> 8) & 0xFF;
        data[1] = id & 0xFF;
        
        // Sequence Number (2 bytes)
        data[2] = (seq >> 8) & 0xFF;
        data[3] = seq & 0xFF;
        
        // Timestamp (8 bytes)
        const timestampBigInt = BigInt(timestamp);
        for (let i = 0; i < 8; i++) {
            data[4 + i] = Number((timestampBigInt >> BigInt(56 - i * 8)) & BigInt(0xFF));
        }
        
        // Payload (pattern)
        for (let i = 0; i < payloadSize; i++) {
            data[12 + i] = i % 256;
        }
        
        const packet = this.createPacket(ICMP_TYPES.ECHO_REQUEST, 0, data);
        
        return {
            packet,
            echoData: {
                identifier: id,
                sequenceNumber: seq,
                timestamp,
                payload: data.slice(12),
            },
        };
    }

    /**
     * Create an Echo Reply (pong)
     */
    static createEchoReply(request: ICMPPacket): ICMPPacket {
        // Copy the data from the request (identifier, sequence, timestamp, payload)
        return this.createPacket(ICMP_TYPES.ECHO_REPLY, 0, request.data);
    }

    /**
     * Create a Destination Unreachable message
     */
    static createDestinationUnreachable(
        code: number,
        originalPacket: IPPacket,
        mtu?: number
    ): ICMPPacket {
        // Data: unused (4 bytes) + original IP header + first 8 bytes of payload
        const headerSize = originalPacket.ihl * 4;
        const dataSize = 4 + headerSize + 8;
        const data = new Uint8Array(dataSize);
        
        // For Fragmentation Needed (code 4), put MTU in bytes 2-3
        if (code === ICMP_DEST_UNREACHABLE_CODES.FRAGMENTATION_NEEDED && mtu) {
            data[2] = (mtu >> 8) & 0xFF;
            data[3] = mtu & 0xFF;
        }
        
        // Copy original IP header and first 8 bytes of payload
        // (In a real implementation, we'd serialize the original packet here)
        this.serializeIPHeader(originalPacket, data, 4);
        
        return this.createPacket(ICMP_TYPES.DESTINATION_UNREACHABLE, code, data);
    }

    /**
     * Create a Time Exceeded message (for traceroute)
     */
    static createTimeExceeded(
        code: number,
        originalPacket: IPPacket
    ): ICMPPacket {
        // Data: unused (4 bytes) + original IP header + first 8 bytes of payload
        const headerSize = originalPacket.ihl * 4;
        const dataSize = 4 + headerSize + 8;
        const data = new Uint8Array(dataSize);
        
        // Copy original IP header
        this.serializeIPHeader(originalPacket, data, 4);
        
        return this.createPacket(ICMP_TYPES.TIME_EXCEEDED, code, data);
    }

    /**
     * Create a Redirect message
     */
    static createRedirect(
        code: number,
        gatewayAddress: IPv4Address,
        originalPacket: IPPacket
    ): ICMPPacket {
        // Data: gateway IP (4) + original IP header + first 8 bytes of payload
        const headerSize = originalPacket.ihl * 4;
        const dataSize = 4 + headerSize + 8;
        const data = new Uint8Array(dataSize);
        
        // Gateway Address (4 bytes)
        data[0] = gatewayAddress.octets[0];
        data[1] = gatewayAddress.octets[1];
        data[2] = gatewayAddress.octets[2];
        data[3] = gatewayAddress.octets[3];
        
        // Copy original IP header
        this.serializeIPHeader(originalPacket, data, 4);
        
        return this.createPacket(ICMP_TYPES.REDIRECT, code, data);
    }

    /**
     * Serialize IP header to buffer (simplified)
     */
    private static serializeIPHeader(packet: IPPacket, buffer: Uint8Array, offset: number): void {
        // Version + IHL
        buffer[offset] = (packet.version << 4) | packet.ihl;
        
        // DSCP + ECN
        buffer[offset + 1] = (packet.dscp << 2) | packet.ecn;
        
        // Total Length
        buffer[offset + 2] = (packet.totalLength >> 8) & 0xFF;
        buffer[offset + 3] = packet.totalLength & 0xFF;
        
        // Identification
        buffer[offset + 4] = (packet.identification >> 8) & 0xFF;
        buffer[offset + 5] = packet.identification & 0xFF;
        
        // Flags + Fragment Offset
        const flags = (packet.flags.reserved ? 0x8000 : 0) |
                     (packet.flags.dontFragment ? 0x4000 : 0) |
                     (packet.flags.moreFragments ? 0x2000 : 0);
        const flagsOffset = flags | packet.fragmentOffset;
        buffer[offset + 6] = (flagsOffset >> 8) & 0xFF;
        buffer[offset + 7] = flagsOffset & 0xFF;
        
        // TTL
        buffer[offset + 8] = packet.ttl;
        
        // Protocol
        buffer[offset + 9] = packet.protocol;
        
        // Header Checksum
        buffer[offset + 10] = (packet.headerChecksum >> 8) & 0xFF;
        buffer[offset + 11] = packet.headerChecksum & 0xFF;
        
        // Source IP
        buffer[offset + 12] = packet.sourceIP.octets[0];
        buffer[offset + 13] = packet.sourceIP.octets[1];
        buffer[offset + 14] = packet.sourceIP.octets[2];
        buffer[offset + 15] = packet.sourceIP.octets[3];
        
        // Destination IP
        buffer[offset + 16] = packet.destinationIP.octets[0];
        buffer[offset + 17] = packet.destinationIP.octets[1];
        buffer[offset + 18] = packet.destinationIP.octets[2];
        buffer[offset + 19] = packet.destinationIP.octets[3];
    }

    /**
     * Generate unique identifier
     */
    private static generateIdentifier(): number {
        this.identifierCounter = (this.identifierCounter + 1) % 65536;
        return this.identifierCounter;
    }

    /**
     * Calculate ICMP checksum
     */
    static calculateChecksum(packet: ICMPPacket): number {
        // ICMP checksum covers type, code, checksum (as 0), and data
        const dataLength = packet.data?.length ?? 0;
        const totalLength = 4 + dataLength;
        const paddedLength = totalLength + (totalLength % 2);
        
        const buffer = new Uint8Array(paddedLength);
        
        buffer[0] = packet.type;
        buffer[1] = packet.code;
        buffer[2] = 0; // Checksum (0 for calculation)
        buffer[3] = 0;
        
        if (packet.data) {
            buffer.set(packet.data, 4);
        }
        
        // Calculate checksum
        let sum = 0;
        for (let i = 0; i < buffer.length; i += 2) {
            sum += (buffer[i] << 8) | buffer[i + 1];
        }
        
        // Add carry bits
        while (sum > 0xFFFF) {
            sum = (sum & 0xFFFF) + (sum >> 16);
        }
        
        // One's complement
        return (~sum) & 0xFFFF;
    }

    /**
     * Verify ICMP checksum
     */
    static verifyChecksum(packet: ICMPPacket): boolean {
        const calculated = this.calculateChecksum(packet);
        return packet.checksum === calculated || calculated === 0;
    }

    /**
     * Parse Echo data from packet
     */
    static parseEchoData(packet: ICMPPacket): ICMPEchoData | null {
        if (packet.type !== ICMP_TYPES.ECHO_REQUEST && 
            packet.type !== ICMP_TYPES.ECHO_REPLY) {
            return null;
        }
        
        if (!packet.data || packet.data.length < 4) {
            return null;
        }
        
        const identifier = (packet.data[0] << 8) | packet.data[1];
        const sequenceNumber = (packet.data[2] << 8) | packet.data[3];
        
        let timestamp: number | undefined;
        if (packet.data.length >= 12) {
            let ts = BigInt(0);
            for (let i = 0; i < 8; i++) {
                ts = (ts << BigInt(8)) | BigInt(packet.data[4 + i]);
            }
            timestamp = Number(ts);
        }
        
        return {
            identifier,
            sequenceNumber,
            timestamp,
            payload: packet.data.length > 12 ? packet.data.slice(12) : undefined,
        };
    }

    /**
     * Calculate round-trip time from echo reply
     */
    static calculateRTT(echoData: ICMPEchoData): number | null {
        if (!echoData.timestamp) {
            return null;
        }
        return Date.now() - echoData.timestamp;
    }

    /**
     * Get type name
     */
    static getTypeName(type: number): string {
        switch (type) {
            case ICMP_TYPES.ECHO_REPLY: return 'Echo Reply';
            case ICMP_TYPES.DESTINATION_UNREACHABLE: return 'Destination Unreachable';
            case ICMP_TYPES.SOURCE_QUENCH: return 'Source Quench';
            case ICMP_TYPES.REDIRECT: return 'Redirect';
            case ICMP_TYPES.ECHO_REQUEST: return 'Echo Request';
            case ICMP_TYPES.ROUTER_ADVERTISEMENT: return 'Router Advertisement';
            case ICMP_TYPES.ROUTER_SOLICITATION: return 'Router Solicitation';
            case ICMP_TYPES.TIME_EXCEEDED: return 'Time Exceeded';
            case ICMP_TYPES.PARAMETER_PROBLEM: return 'Parameter Problem';
            case ICMP_TYPES.TIMESTAMP_REQUEST: return 'Timestamp Request';
            case ICMP_TYPES.TIMESTAMP_REPLY: return 'Timestamp Reply';
            default: return `Unknown(${type})`;
        }
    }

    /**
     * Get destination unreachable code name
     */
    static getDestUnreachableCodeName(code: number): string {
        switch (code) {
            case ICMP_DEST_UNREACHABLE_CODES.NET_UNREACHABLE: return 'Network Unreachable';
            case ICMP_DEST_UNREACHABLE_CODES.HOST_UNREACHABLE: return 'Host Unreachable';
            case ICMP_DEST_UNREACHABLE_CODES.PROTOCOL_UNREACHABLE: return 'Protocol Unreachable';
            case ICMP_DEST_UNREACHABLE_CODES.PORT_UNREACHABLE: return 'Port Unreachable';
            case ICMP_DEST_UNREACHABLE_CODES.FRAGMENTATION_NEEDED: return 'Fragmentation Needed';
            case ICMP_DEST_UNREACHABLE_CODES.SOURCE_ROUTE_FAILED: return 'Source Route Failed';
            case ICMP_DEST_UNREACHABLE_CODES.DEST_NETWORK_UNKNOWN: return 'Destination Network Unknown';
            case ICMP_DEST_UNREACHABLE_CODES.DEST_HOST_UNKNOWN: return 'Destination Host Unknown';
            case ICMP_DEST_UNREACHABLE_CODES.COMM_PROHIBITED: return 'Communication Prohibited';
            default: return `Unknown(${code})`;
        }
    }

    /**
     * Format packet for display
     */
    static formatPacket(packet: ICMPPacket): string {
        const typeName = this.getTypeName(packet.type);
        
        if (packet.type === ICMP_TYPES.ECHO_REQUEST || 
            packet.type === ICMP_TYPES.ECHO_REPLY) {
            const echoData = this.parseEchoData(packet);
            if (echoData) {
                return `ICMP ${typeName} id=${echoData.identifier} seq=${echoData.sequenceNumber}`;
            }
        }
        
        if (packet.type === ICMP_TYPES.DESTINATION_UNREACHABLE) {
            const codeName = this.getDestUnreachableCodeName(packet.code);
            return `ICMP ${typeName} (${codeName})`;
        }
        
        if (packet.type === ICMP_TYPES.TIME_EXCEEDED) {
            const codeName = packet.code === 0 ? 'TTL exceeded' : 'Fragment reassembly exceeded';
            return `ICMP ${typeName} (${codeName})`;
        }
        
        return `ICMP ${typeName} code=${packet.code}`;
    }

    /**
     * Check if packet is an error message
     */
    static isErrorMessage(packet: ICMPPacket): boolean {
        return packet.type === ICMP_TYPES.DESTINATION_UNREACHABLE ||
               packet.type === ICMP_TYPES.SOURCE_QUENCH ||
               packet.type === ICMP_TYPES.TIME_EXCEEDED ||
               packet.type === ICMP_TYPES.PARAMETER_PROBLEM;
    }
}

/**
 * Ping session for tracking echo requests/replies
 */
export interface PingSession {
    id: string;
    targetIP: IPv4Address;
    identifier: number;
    sequenceNumber: number;
    sentAt: number;
    replies: PingReply[];
    statistics: PingStatistics;
}

export interface PingReply {
    sequenceNumber: number;
    rtt: number;
    ttl: number;
    receivedAt: number;
}

export interface PingStatistics {
    sent: number;
    received: number;
    lost: number;
    minRtt: number;
    maxRtt: number;
    avgRtt: number;
}

/**
 * Ping Manager - handles ping sessions
 */
export class PingManager {
    private sessions: Map<string, PingSession> = new Map();
    
    /**
     * Create a new ping session
     */
    createSession(targetIP: IPv4Address): PingSession {
        const id = `ping-${targetIP.toString()}-${Date.now()}`;
        
        const session: PingSession = {
            id,
            targetIP,
            identifier: Math.floor(Math.random() * 65536),
            sequenceNumber: 0,
            sentAt: Date.now(),
            replies: [],
            statistics: {
                sent: 0,
                received: 0,
                lost: 0,
                minRtt: Infinity,
                maxRtt: 0,
                avgRtt: 0,
            },
        };
        
        this.sessions.set(id, session);
        return session;
    }

    /**
     * Send a ping (create echo request)
     */
    sendPing(session: PingSession, payloadSize: number = 32): ICMPPacket {
        const { packet } = ICMPProtocol.createEchoRequest(
            session.identifier,
            session.sequenceNumber,
            payloadSize
        );
        
        session.sequenceNumber++;
        session.statistics.sent++;
        
        return packet;
    }

    /**
     * Process a ping reply
     */
    processReply(
        session: PingSession,
        packet: ICMPPacket,
        ttl: number
    ): PingReply | null {
        if (packet.type !== ICMP_TYPES.ECHO_REPLY) {
            return null;
        }
        
        const echoData = ICMPProtocol.parseEchoData(packet);
        if (!echoData || echoData.identifier !== session.identifier) {
            return null;
        }
        
        const rtt = echoData.timestamp ? Date.now() - echoData.timestamp : 0;
        
        const reply: PingReply = {
            sequenceNumber: echoData.sequenceNumber,
            rtt,
            ttl,
            receivedAt: Date.now(),
        };
        
        session.replies.push(reply);
        this.updateStatistics(session, rtt);
        
        return reply;
    }

    /**
     * Update session statistics
     */
    private updateStatistics(session: PingSession, rtt: number): void {
        const stats = session.statistics;
        
        stats.received++;
        stats.lost = stats.sent - stats.received;
        
        if (rtt < stats.minRtt) stats.minRtt = rtt;
        if (rtt > stats.maxRtt) stats.maxRtt = rtt;
        
        // Running average
        stats.avgRtt = ((stats.avgRtt * (stats.received - 1)) + rtt) / stats.received;
    }

    /**
     * Get session by ID
     */
    getSession(id: string): PingSession | undefined {
        return this.sessions.get(id);
    }

    /**
     * Close a session
     */
    closeSession(id: string): PingStatistics | null {
        const session = this.sessions.get(id);
        if (!session) {
            return null;
        }
        
        this.sessions.delete(id);
        return session.statistics;
    }

    /**
     * Format statistics for display
     */
    static formatStatistics(stats: PingStatistics): string {
        const lossPercent = stats.sent > 0 
            ? ((stats.lost / stats.sent) * 100).toFixed(1) 
            : '0.0';
        
        return [
            `--- ping statistics ---`,
            `${stats.sent} packets transmitted, ${stats.received} received, ${lossPercent}% packet loss`,
            stats.received > 0 
                ? `rtt min/avg/max = ${stats.minRtt.toFixed(1)}/${stats.avgRtt.toFixed(1)}/${stats.maxRtt.toFixed(1)} ms`
                : '',
        ].filter(Boolean).join('\n');
    }
}

/**
 * Traceroute hop result
 */
export interface TracerouteHop {
    hopNumber: number;
    address?: IPv4Address;
    rtt: number[];
    status: 'replied' | 'timeout' | 'unreachable';
}

/**
 * Traceroute session
 */
export interface TracerouteSession {
    id: string;
    targetIP: IPv4Address;
    maxHops: number;
    currentHop: number;
    probesPerHop: number;
    hops: TracerouteHop[];
    complete: boolean;
}

/**
 * Traceroute Manager - handles traceroute sessions
 */
export class TracerouteManager {
    private sessions: Map<string, TracerouteSession> = new Map();
    
    /**
     * Create a new traceroute session
     */
    createSession(
        targetIP: IPv4Address,
        maxHops: number = 30,
        probesPerHop: number = 3
    ): TracerouteSession {
        const id = `traceroute-${targetIP.toString()}-${Date.now()}`;
        
        const session: TracerouteSession = {
            id,
            targetIP,
            maxHops,
            currentHop: 1,
            probesPerHop,
            hops: [],
            complete: false,
        };
        
        this.sessions.set(id, session);
        return session;
    }

    /**
     * Create probe packet for current hop
     */
    createProbe(session: TracerouteSession): { packet: ICMPPacket; ttl: number } {
        const { packet } = ICMPProtocol.createEchoRequest(
            Math.floor(Math.random() * 65536),
            session.currentHop,
            32
        );
        
        return {
            packet,
            ttl: session.currentHop,
        };
    }

    /**
     * Process response for traceroute
     */
    processResponse(
        session: TracerouteSession,
        packet: ICMPPacket,
        sourceIP: IPv4Address,
        rtt: number
    ): TracerouteHop | null {
        let hop = session.hops.find(h => h.hopNumber === session.currentHop);
        
        if (!hop) {
            hop = {
                hopNumber: session.currentHop,
                address: undefined,
                rtt: [],
                status: 'timeout',
            };
            session.hops.push(hop);
        }
        
        hop.rtt.push(rtt);
        
        if (packet.type === ICMP_TYPES.TIME_EXCEEDED) {
            hop.address = sourceIP;
            hop.status = 'replied';
        } else if (packet.type === ICMP_TYPES.ECHO_REPLY) {
            hop.address = sourceIP;
            hop.status = 'replied';
            session.complete = true;
        } else if (packet.type === ICMP_TYPES.DESTINATION_UNREACHABLE) {
            hop.address = sourceIP;
            hop.status = 'unreachable';
            session.complete = true;
        }
        
        // Move to next hop if we have enough probes
        if (hop.rtt.length >= session.probesPerHop) {
            session.currentHop++;
            
            if (session.currentHop > session.maxHops) {
                session.complete = true;
            }
        }
        
        return hop;
    }

    /**
     * Record timeout for probe
     */
    recordTimeout(session: TracerouteSession): void {
        let hop = session.hops.find(h => h.hopNumber === session.currentHop);
        
        if (!hop) {
            hop = {
                hopNumber: session.currentHop,
                address: undefined,
                rtt: [],
                status: 'timeout',
            };
            session.hops.push(hop);
        }
        
        hop.rtt.push(-1); // -1 indicates timeout
        
        if (hop.rtt.length >= session.probesPerHop) {
            session.currentHop++;
            
            if (session.currentHop > session.maxHops) {
                session.complete = true;
            }
        }
    }

    /**
     * Get session by ID
     */
    getSession(id: string): TracerouteSession | undefined {
        return this.sessions.get(id);
    }

    /**
     * Close a session
     */
    closeSession(id: string): TracerouteSession | null {
        const session = this.sessions.get(id);
        if (!session) {
            return null;
        }
        
        this.sessions.delete(id);
        return session;
    }

    /**
     * Format traceroute output
     */
    static formatOutput(session: TracerouteSession): string {
        const lines = [`traceroute to ${session.targetIP.toString()}, ${session.maxHops} hops max`];
        
        for (const hop of session.hops) {
            const rttStr = hop.rtt.map(r => r < 0 ? '*' : `${r.toFixed(1)} ms`).join('  ');
            const addr = hop.address?.toString() ?? '*';
            
            lines.push(`${hop.hopNumber.toString().padStart(2)}  ${addr.padEnd(15)}  ${rttStr}`);
        }
        
        return lines.join('\n');
    }
}

export default ICMPProtocol;
