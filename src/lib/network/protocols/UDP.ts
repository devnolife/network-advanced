// UDP Protocol Implementation
// Implements connectionless datagram transport

import type { IPv4Address, UDPDatagram } from '../core/types';
import { IPv4Protocol, IP_PROTOCOLS } from './IP';

/**
 * Well-known UDP ports
 */
export const UDP_PORTS = {
    DNS: 53,
    DHCP_SERVER: 67,
    DHCP_CLIENT: 68,
    TFTP: 69,
    NTP: 123,
    SNMP: 161,
    SNMP_TRAP: 162,
    SYSLOG: 514,
    RIP: 520,
    ISAKMP: 500,
    NAT_T: 4500,
} as const;

/**
 * UDP Protocol handler for datagram creation and checksum calculation
 */
export class UDPProtocol {
    /**
     * Maximum UDP payload size (65535 - 8 byte header)
     */
    static readonly MAX_PAYLOAD_SIZE = 65527;
    
    /**
     * UDP header size
     */
    static readonly HEADER_SIZE = 8;
    
    /**
     * Create a UDP datagram
     */
    static createDatagram(
        sourcePort: number,
        destinationPort: number,
        data?: Uint8Array
    ): UDPDatagram {
        const dataLength = data?.length ?? 0;
        const totalLength = this.HEADER_SIZE + dataLength;
        
        if (dataLength > this.MAX_PAYLOAD_SIZE) {
            throw new Error(`UDP payload exceeds maximum size: ${dataLength} > ${this.MAX_PAYLOAD_SIZE}`);
        }
        
        return {
            sourcePort,
            destinationPort,
            length: totalLength,
            checksum: 0, // Will be calculated
            data,
        };
    }

    /**
     * Create a DNS query datagram
     */
    static createDNSQuery(
        sourcePort: number,
        queryData: Uint8Array
    ): UDPDatagram {
        return this.createDatagram(sourcePort, UDP_PORTS.DNS, queryData);
    }

    /**
     * Create a DHCP discover datagram
     */
    static createDHCPDiscover(data: Uint8Array): UDPDatagram {
        return this.createDatagram(UDP_PORTS.DHCP_CLIENT, UDP_PORTS.DHCP_SERVER, data);
    }

    /**
     * Create a SNMP datagram
     */
    static createSNMP(
        sourcePort: number,
        data: Uint8Array
    ): UDPDatagram {
        return this.createDatagram(sourcePort, UDP_PORTS.SNMP, data);
    }

    /**
     * Create an ISAKMP datagram (IKE)
     */
    static createISAKMP(
        sourcePort: number,
        data: Uint8Array
    ): UDPDatagram {
        return this.createDatagram(sourcePort, UDP_PORTS.ISAKMP, data);
    }

    /**
     * Calculate UDP checksum using pseudo-header
     */
    static calculateChecksum(
        datagram: UDPDatagram,
        sourceIP: IPv4Address,
        destinationIP: IPv4Address
    ): number {
        // Create pseudo-header
        const pseudoHeader = IPv4Protocol.createPseudoHeader(
            sourceIP,
            destinationIP,
            IP_PROTOCOLS.UDP,
            datagram.length
        );
        
        // Total buffer size (add padding byte if odd length)
        const dataLength = datagram.data?.length ?? 0;
        const totalLength = 12 + this.HEADER_SIZE + dataLength;
        const paddedLength = totalLength + (totalLength % 2);
        
        const checksumBuffer = new Uint8Array(paddedLength);
        
        // Copy pseudo-header
        checksumBuffer.set(pseudoHeader, 0);
        
        // Build UDP header
        let offset = 12;
        
        // Source Port
        checksumBuffer[offset++] = (datagram.sourcePort >> 8) & 0xFF;
        checksumBuffer[offset++] = datagram.sourcePort & 0xFF;
        
        // Destination Port
        checksumBuffer[offset++] = (datagram.destinationPort >> 8) & 0xFF;
        checksumBuffer[offset++] = datagram.destinationPort & 0xFF;
        
        // Length
        checksumBuffer[offset++] = (datagram.length >> 8) & 0xFF;
        checksumBuffer[offset++] = datagram.length & 0xFF;
        
        // Checksum (0 for calculation)
        checksumBuffer[offset++] = 0;
        checksumBuffer[offset++] = 0;
        
        // Data
        if (datagram.data) {
            checksumBuffer.set(datagram.data, offset);
        }
        
        // Calculate checksum
        let sum = 0;
        for (let i = 0; i < checksumBuffer.length; i += 2) {
            sum += (checksumBuffer[i] << 8) | checksumBuffer[i + 1];
        }
        
        // Add carry bits
        while (sum > 0xFFFF) {
            sum = (sum & 0xFFFF) + (sum >> 16);
        }
        
        // One's complement (0xFFFF means checksum disabled)
        const checksum = (~sum) & 0xFFFF;
        return checksum === 0 ? 0xFFFF : checksum;
    }

    /**
     * Verify UDP checksum
     */
    static verifyChecksum(
        datagram: UDPDatagram,
        sourceIP: IPv4Address,
        destinationIP: IPv4Address
    ): boolean {
        // Checksum of 0 means no checksum
        if (datagram.checksum === 0) {
            return true;
        }
        
        const calculated = this.calculateChecksum(datagram, sourceIP, destinationIP);
        return datagram.checksum === calculated || calculated === 0xFFFF;
    }

    /**
     * Check if port is in valid range
     */
    static isValidPort(port: number): boolean {
        return port >= 0 && port <= 65535;
    }

    /**
     * Check if port is privileged (requires root)
     */
    static isPrivilegedPort(port: number): boolean {
        return port > 0 && port < 1024;
    }

    /**
     * Get well-known service name for port
     */
    static getServiceName(port: number): string | undefined {
        const services: Record<number, string> = {
            53: 'DNS',
            67: 'DHCP-Server',
            68: 'DHCP-Client',
            69: 'TFTP',
            123: 'NTP',
            161: 'SNMP',
            162: 'SNMP-Trap',
            500: 'ISAKMP',
            514: 'Syslog',
            520: 'RIP',
            4500: 'NAT-T',
        };
        return services[port];
    }

    /**
     * Format datagram for display
     */
    static formatDatagram(datagram: UDPDatagram): string {
        const dataLen = datagram.data?.length ?? 0;
        const srcService = this.getServiceName(datagram.sourcePort);
        const dstService = this.getServiceName(datagram.destinationPort);
        
        const srcStr = srcService 
            ? `${datagram.sourcePort} (${srcService})` 
            : `${datagram.sourcePort}`;
        const dstStr = dstService 
            ? `${datagram.destinationPort} (${dstService})` 
            : `${datagram.destinationPort}`;
        
        return `UDP ${srcStr} -> ${dstStr} Len=${dataLen}`;
    }
}

/**
 * UDP Socket simulation for binding and receiving datagrams
 */
export interface UDPSocketOptions {
    reuseAddr?: boolean;
    broadcast?: boolean;
    receiveBufferSize?: number;
    sendBufferSize?: number;
}

export interface UDPSocketBinding {
    port: number;
    address?: IPv4Address;
    callback: (datagram: UDPDatagram, sourceIP: IPv4Address) => void;
}

/**
 * UDP Socket Manager - simulates UDP socket operations
 */
export class UDPSocketManager {
    private bindings: Map<number, UDPSocketBinding[]> = new Map();
    private ephemeralPortCounter = 49152; // Start of ephemeral port range
    private readonly ephemeralPortMax = 65535;
    
    /**
     * Bind a callback to a port
     */
    bind(
        port: number,
        callback: (datagram: UDPDatagram, sourceIP: IPv4Address) => void,
        address?: IPv4Address,
        options?: UDPSocketOptions
    ): boolean {
        if (!UDPProtocol.isValidPort(port)) {
            throw new Error(`Invalid port: ${port}`);
        }
        
        const existing = this.bindings.get(port) ?? [];
        
        // Check if port is already bound (unless reuseAddr)
        if (!options?.reuseAddr && existing.length > 0) {
            // Check for conflicting bindings
            const conflict = existing.some(b => 
                !b.address || !address || 
                b.address.toString() === address.toString()
            );
            
            if (conflict) {
                return false;
            }
        }
        
        existing.push({ port, address, callback });
        this.bindings.set(port, existing);
        
        return true;
    }

    /**
     * Unbind from a port
     */
    unbind(
        port: number,
        callback: (datagram: UDPDatagram, sourceIP: IPv4Address) => void
    ): boolean {
        const bindings = this.bindings.get(port);
        if (!bindings) {
            return false;
        }
        
        const index = bindings.findIndex(b => b.callback === callback);
        if (index === -1) {
            return false;
        }
        
        bindings.splice(index, 1);
        
        if (bindings.length === 0) {
            this.bindings.delete(port);
        }
        
        return true;
    }

    /**
     * Allocate an ephemeral port
     */
    allocateEphemeralPort(): number {
        const startPort = this.ephemeralPortCounter;
        
        do {
            if (!this.bindings.has(this.ephemeralPortCounter)) {
                const port = this.ephemeralPortCounter;
                this.ephemeralPortCounter++;
                if (this.ephemeralPortCounter > this.ephemeralPortMax) {
                    this.ephemeralPortCounter = 49152;
                }
                return port;
            }
            
            this.ephemeralPortCounter++;
            if (this.ephemeralPortCounter > this.ephemeralPortMax) {
                this.ephemeralPortCounter = 49152;
            }
        } while (this.ephemeralPortCounter !== startPort);
        
        throw new Error('No ephemeral ports available');
    }

    /**
     * Deliver a received datagram to bound callbacks
     */
    deliver(
        datagram: UDPDatagram,
        sourceIP: IPv4Address,
        destinationIP: IPv4Address
    ): boolean {
        const bindings = this.bindings.get(datagram.destinationPort);
        if (!bindings || bindings.length === 0) {
            return false;
        }
        
        let delivered = false;
        
        for (const binding of bindings) {
            // Check if address matches (or binding accepts any)
            if (!binding.address || 
                binding.address.toString() === destinationIP.toString() ||
                destinationIP.octets.every(o => o === 255)) { // Broadcast
                
                binding.callback(datagram, sourceIP);
                delivered = true;
            }
        }
        
        return delivered;
    }

    /**
     * Check if a port is bound
     */
    isBound(port: number): boolean {
        return this.bindings.has(port);
    }

    /**
     * Get all bound ports
     */
    getBoundPorts(): number[] {
        return Array.from(this.bindings.keys());
    }

    /**
     * Get statistics
     */
    getStatistics(): {
        boundPorts: number;
        totalBindings: number;
    } {
        let totalBindings = 0;
        for (const bindings of this.bindings.values()) {
            totalBindings += bindings.length;
        }
        
        return {
            boundPorts: this.bindings.size,
            totalBindings,
        };
    }
}

export default UDPProtocol;
