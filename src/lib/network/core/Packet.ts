// Packet Structure and Utilities

import { v4 as uuidv4 } from 'uuid';
import type {
    IPv4Address,
    MACAddress,
    EthernetFrame,
    IPPacket,
    TCPSegment,
    UDPDatagram,
    ICMPPacket,
    ARPPacket,
    ESPPacket,
    AHPacket,
    ProtocolType,
} from './types';

// Packet class for simulation
export class Packet {
    id: string;
    timestamp: number;
    frame: EthernetFrame;
    hops: string[];
    dropped: boolean;
    dropReason?: string;

    constructor(frame: EthernetFrame) {
        this.id = uuidv4();
        this.timestamp = Date.now();
        this.frame = frame;
        this.hops = [];
        this.dropped = false;
    }

    addHop(deviceId: string): void {
        this.hops.push(deviceId);
    }

    drop(reason: string): void {
        this.dropped = true;
        this.dropReason = reason;
    }

    getProtocolType(): ProtocolType {
        const frame = this.frame;

        // Check if it's an ARP packet
        if ('opcode' in frame.payload) {
            return 'arp';
        }

        const ipPacket = frame.payload as IPPacket;
        switch (ipPacket.protocol) {
            case 1: return 'icmp';
            case 6: return 'tcp';
            case 17: return 'udp';
            case 50: return 'esp';
            case 51: return 'ah';
            default: return 'tcp';
        }
    }

    getSize(): number {
        const ipPayload = this.frame.payload as IPPacket;
        return 14 + (ipPayload?.totalLength || 0); // Ethernet header + IP packet
    }

    clone(): Packet {
        const clonedFrame = JSON.parse(JSON.stringify(this.frame));
        const clonedPacket = new Packet(clonedFrame);
        clonedPacket.hops = [...this.hops];
        return clonedPacket;
    }
}

// IPv4 Address Utilities
export class IPv4AddressUtil implements IPv4Address {
    octets: [number, number, number, number];

    constructor(address: string | [number, number, number, number]) {
        if (typeof address === 'string') {
            const parts = address.split('.').map(Number);
            if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
                throw new Error(`Invalid IPv4 address: ${address}`);
            }
            this.octets = parts as [number, number, number, number];
        } else {
            this.octets = address;
        }
    }

    toString(): string {
        return this.octets.join('.');
    }

    toNumber(): number {
        return (
            (this.octets[0] << 24) |
            (this.octets[1] << 16) |
            (this.octets[2] << 8) |
            this.octets[3]
        ) >>> 0;
    }

    static fromNumber(num: number): IPv4AddressUtil {
        return new IPv4AddressUtil([
            (num >>> 24) & 0xff,
            (num >>> 16) & 0xff,
            (num >>> 8) & 0xff,
            num & 0xff,
        ]);
    }

    applyMask(mask: IPv4AddressUtil): IPv4AddressUtil {
        const masked = this.toNumber() & mask.toNumber();
        return IPv4AddressUtil.fromNumber(masked);
    }

    isInSubnet(network: IPv4AddressUtil, mask: IPv4AddressUtil): boolean {
        return this.applyMask(mask).toNumber() === network.applyMask(mask).toNumber();
    }

    equals(other: IPv4Address): boolean {
        return this.toNumber() === other.toNumber();
    }

    static isValidAddress(address: string): boolean {
        const parts = address.split('.');
        if (parts.length !== 4) return false;
        return parts.every(part => {
            const num = parseInt(part, 10);
            return !isNaN(num) && num >= 0 && num <= 255 && part === num.toString();
        });
    }

    static calculateBroadcast(network: IPv4AddressUtil, mask: IPv4AddressUtil): IPv4AddressUtil {
        const invertedMask = ~mask.toNumber() >>> 0;
        const broadcast = network.toNumber() | invertedMask;
        return IPv4AddressUtil.fromNumber(broadcast);
    }

    static getNetworkClass(address: IPv4AddressUtil): 'A' | 'B' | 'C' | 'D' | 'E' {
        const firstOctet = address.octets[0];
        if (firstOctet < 128) return 'A';
        if (firstOctet < 192) return 'B';
        if (firstOctet < 224) return 'C';
        if (firstOctet < 240) return 'D';
        return 'E';
    }
}

// MAC Address Utilities
export class MACAddressUtil implements MACAddress {
    bytes: [number, number, number, number, number, number];

    constructor(address: string | [number, number, number, number, number, number]) {
        if (typeof address === 'string') {
            const parts = address.split(':').map(p => parseInt(p, 16));
            if (parts.length !== 6 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
                throw new Error(`Invalid MAC address: ${address}`);
            }
            this.bytes = parts as [number, number, number, number, number, number];
        } else {
            this.bytes = address;
        }
    }

    toString(): string {
        return this.bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(':');
    }

    equals(other: MACAddress): boolean {
        return this.bytes.every((b, i) => b === other.bytes[i]);
    }

    isBroadcast(): boolean {
        return this.bytes.every(b => b === 255);
    }

    isMulticast(): boolean {
        return (this.bytes[0] & 0x01) === 1;
    }

    static generateRandom(oui?: [number, number, number]): MACAddressUtil {
        const bytes: [number, number, number, number, number, number] = [
            oui?.[0] ?? Math.floor(Math.random() * 256),
            oui?.[1] ?? Math.floor(Math.random() * 256),
            oui?.[2] ?? Math.floor(Math.random() * 256),
            Math.floor(Math.random() * 256),
            Math.floor(Math.random() * 256),
            Math.floor(Math.random() * 256),
        ];
        // Clear multicast bit and set locally administered bit
        bytes[0] = (bytes[0] & 0xfe) | 0x02;
        return new MACAddressUtil(bytes);
    }

    static readonly BROADCAST = new MACAddressUtil([255, 255, 255, 255, 255, 255]);
}

// Packet Factory for creating common packet types
export class PacketFactory {
    static createICMPEchoRequest(
        srcMAC: MACAddress,
        dstMAC: MACAddress,
        srcIP: IPv4Address,
        dstIP: IPv4Address,
        identifier: number = Math.floor(Math.random() * 65536),
        sequence: number = 1
    ): Packet {
        const icmpPacket: ICMPPacket = {
            type: 8, // Echo Request
            code: 0,
            checksum: 0,
            data: new Uint8Array([
                (identifier >> 8) & 0xff,
                identifier & 0xff,
                (sequence >> 8) & 0xff,
                sequence & 0xff,
                ...Array(56).fill(0), // Padding data
            ]),
        };

        const ipPacket: IPPacket = {
            version: 4,
            ihl: 5,
            dscp: 0,
            ecn: 0,
            totalLength: 84,
            identification: Math.floor(Math.random() * 65536),
            flags: { reserved: false, dontFragment: true, moreFragments: false },
            fragmentOffset: 0,
            ttl: 64,
            protocol: 1, // ICMP
            headerChecksum: 0,
            sourceIP: srcIP,
            destinationIP: dstIP,
            payload: icmpPacket,
        };

        const frame: EthernetFrame = {
            destinationMAC: dstMAC,
            sourceMAC: srcMAC,
            etherType: 0x0800, // IPv4
            payload: ipPacket,
        };

        return new Packet(frame);
    }

    static createICMPEchoReply(request: Packet): Packet {
        const reply = request.clone();
        const frame = reply.frame;

        // Swap MAC addresses
        const tempMAC = frame.sourceMAC;
        frame.sourceMAC = frame.destinationMAC;
        frame.destinationMAC = tempMAC;

        const ipPacket = frame.payload as IPPacket;

        // Swap IP addresses
        const tempIP = ipPacket.sourceIP;
        ipPacket.sourceIP = ipPacket.destinationIP;
        ipPacket.destinationIP = tempIP;

        // Change ICMP type to Echo Reply
        const icmpPacket = ipPacket.payload as ICMPPacket;
        icmpPacket.type = 0;

        reply.id = uuidv4();
        return reply;
    }

    static createTCPPacket(
        srcMAC: MACAddress,
        dstMAC: MACAddress,
        srcIP: IPv4Address,
        dstIP: IPv4Address,
        srcPort: number,
        dstPort: number,
        flags: TCPSegment['flags'],
        sequenceNumber: number = Math.floor(Math.random() * 4294967296),
        acknowledgmentNumber: number = 0,
        data?: Uint8Array
    ): Packet {
        const tcpSegment: TCPSegment = {
            sourcePort: srcPort,
            destinationPort: dstPort,
            sequenceNumber,
            acknowledgmentNumber,
            dataOffset: 5,
            flags,
            window: 65535,
            checksum: 0,
            urgentPointer: 0,
            data,
        };

        const dataLength = data?.length || 0;
        const totalLength = 20 + 20 + dataLength; // IP header + TCP header + data

        const ipPacket: IPPacket = {
            version: 4,
            ihl: 5,
            dscp: 0,
            ecn: 0,
            totalLength,
            identification: Math.floor(Math.random() * 65536),
            flags: { reserved: false, dontFragment: true, moreFragments: false },
            fragmentOffset: 0,
            ttl: 64,
            protocol: 6, // TCP
            headerChecksum: 0,
            sourceIP: srcIP,
            destinationIP: dstIP,
            payload: tcpSegment,
        };

        const frame: EthernetFrame = {
            destinationMAC: dstMAC,
            sourceMAC: srcMAC,
            etherType: 0x0800,
            payload: ipPacket,
        };

        return new Packet(frame);
    }

    static createARPRequest(
        srcMAC: MACAddress,
        srcIP: IPv4Address,
        targetIP: IPv4Address
    ): Packet {
        const arpPacket: ARPPacket = {
            hardwareType: 1, // Ethernet
            protocolType: 0x0800, // IPv4
            hardwareSize: 6,
            protocolSize: 4,
            opcode: 'request',
            senderMAC: srcMAC,
            senderIP: srcIP,
            targetMAC: new MACAddressUtil([0, 0, 0, 0, 0, 0]),
            targetIP: targetIP,
        };

        const frame: EthernetFrame = {
            destinationMAC: MACAddressUtil.BROADCAST,
            sourceMAC: srcMAC,
            etherType: 0x0806, // ARP
            payload: arpPacket,
        };

        return new Packet(frame);
    }

    static createARPReply(
        srcMAC: MACAddress,
        srcIP: IPv4Address,
        dstMAC: MACAddress,
        dstIP: IPv4Address
    ): Packet {
        const arpPacket: ARPPacket = {
            hardwareType: 1,
            protocolType: 0x0800,
            hardwareSize: 6,
            protocolSize: 4,
            opcode: 'reply',
            senderMAC: srcMAC,
            senderIP: srcIP,
            targetMAC: dstMAC,
            targetIP: dstIP,
        };

        const frame: EthernetFrame = {
            destinationMAC: dstMAC,
            sourceMAC: srcMAC,
            etherType: 0x0806,
            payload: arpPacket,
        };

        return new Packet(frame);
    }

    static createESPPacket(
        srcMAC: MACAddress,
        dstMAC: MACAddress,
        srcIP: IPv4Address,
        dstIP: IPv4Address,
        spi: number,
        sequenceNumber: number,
        encryptedPayload: Uint8Array
    ): Packet {
        const espPacket: ESPPacket = {
            spi,
            sequenceNumber,
            encryptedPayload,
            padLength: 0,
            nextHeader: 0, // Will be set during encryption
        };

        const ipPacket: IPPacket = {
            version: 4,
            ihl: 5,
            dscp: 0,
            ecn: 0,
            totalLength: 20 + 8 + encryptedPayload.length, // IP + ESP header + payload
            identification: Math.floor(Math.random() * 65536),
            flags: { reserved: false, dontFragment: true, moreFragments: false },
            fragmentOffset: 0,
            ttl: 64,
            protocol: 50, // ESP
            headerChecksum: 0,
            sourceIP: srcIP,
            destinationIP: dstIP,
            payload: espPacket,
        };

        const frame: EthernetFrame = {
            destinationMAC: dstMAC,
            sourceMAC: srcMAC,
            etherType: 0x0800,
            payload: ipPacket,
        };

        return new Packet(frame);
    }
}

// Packet Display Utilities
export class PacketDisplay {
    static formatPacketSummary(packet: Packet): string {
        const frame = packet.frame;
        const protocol = packet.getProtocolType();

        if ('opcode' in frame.payload) {
            const arp = frame.payload as ARPPacket;
            return `ARP ${arp.opcode}: ${arp.senderIP.toString()} -> ${arp.targetIP.toString()}`;
        }

        const ip = frame.payload as IPPacket;
        let info = `${ip.sourceIP.toString()} -> ${ip.destinationIP.toString()}`;

        switch (protocol) {
            case 'icmp':
                const icmp = ip.payload as ICMPPacket;
                const icmpType = icmp.type === 8 ? 'Echo Request' : icmp.type === 0 ? 'Echo Reply' : `Type ${icmp.type}`;
                info += ` ICMP ${icmpType}`;
                break;
            case 'tcp':
                const tcp = ip.payload as TCPSegment;
                const flags = Object.entries(tcp.flags)
                    .filter(([_, v]) => v)
                    .map(([k]) => k.toUpperCase())
                    .join('');
                info += ` TCP ${tcp.sourcePort} > ${tcp.destinationPort} [${flags}]`;
                break;
            case 'udp':
                const udp = ip.payload as UDPDatagram;
                info += ` UDP ${udp.sourcePort} > ${udp.destinationPort}`;
                break;
            case 'esp':
                const esp = ip.payload as ESPPacket;
                info += ` ESP SPI=0x${esp.spi.toString(16)} Seq=${esp.sequenceNumber}`;
                break;
            case 'ah':
                const ah = ip.payload as AHPacket;
                info += ` AH SPI=0x${ah.spi.toString(16)}`;
                break;
        }

        return info;
    }

    static formatPacketDetails(packet: Packet): string[] {
        const lines: string[] = [];
        const frame = packet.frame;

        lines.push('== Ethernet Frame ==');
        lines.push(`  Source MAC: ${frame.sourceMAC.toString()}`);
        lines.push(`  Destination MAC: ${frame.destinationMAC.toString()}`);
        lines.push(`  EtherType: 0x${frame.etherType.toString(16).padStart(4, '0')}`);

        if ('opcode' in frame.payload) {
            const arp = frame.payload as ARPPacket;
            lines.push('== ARP ==');
            lines.push(`  Operation: ${arp.opcode}`);
            lines.push(`  Sender MAC: ${arp.senderMAC.toString()}`);
            lines.push(`  Sender IP: ${arp.senderIP.toString()}`);
            lines.push(`  Target MAC: ${arp.targetMAC.toString()}`);
            lines.push(`  Target IP: ${arp.targetIP.toString()}`);
        } else {
            const ip = frame.payload as IPPacket;
            lines.push('== IPv4 ==');
            lines.push(`  Source IP: ${ip.sourceIP.toString()}`);
            lines.push(`  Destination IP: ${ip.destinationIP.toString()}`);
            lines.push(`  TTL: ${ip.ttl}`);
            lines.push(`  Protocol: ${ip.protocol}`);
            lines.push(`  Total Length: ${ip.totalLength}`);

            // Add protocol-specific details
            const protocol = packet.getProtocolType();
            switch (protocol) {
                case 'tcp':
                    const tcp = ip.payload as TCPSegment;
                    lines.push('== TCP ==');
                    lines.push(`  Source Port: ${tcp.sourcePort}`);
                    lines.push(`  Destination Port: ${tcp.destinationPort}`);
                    lines.push(`  Sequence: ${tcp.sequenceNumber}`);
                    lines.push(`  Acknowledgment: ${tcp.acknowledgmentNumber}`);
                    lines.push(`  Flags: ${Object.entries(tcp.flags).filter(([_, v]) => v).map(([k]) => k).join(', ')}`);
                    break;
                case 'icmp':
                    const icmp = ip.payload as ICMPPacket;
                    lines.push('== ICMP ==');
                    lines.push(`  Type: ${icmp.type}`);
                    lines.push(`  Code: ${icmp.code}`);
                    break;
                case 'esp':
                    const esp = ip.payload as ESPPacket;
                    lines.push('== ESP ==');
                    lines.push(`  SPI: 0x${esp.spi.toString(16)}`);
                    lines.push(`  Sequence Number: ${esp.sequenceNumber}`);
                    lines.push(`  Encrypted Payload: ${esp.encryptedPayload.length} bytes`);
                    break;
            }
        }

        return lines;
    }
}
