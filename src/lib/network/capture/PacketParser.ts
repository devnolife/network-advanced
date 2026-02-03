// PacketParser - Utility to convert protocol objects to CapturedPacketDetail
// Parses various network protocol types for display in the packet capture UI

import { v4 as uuidv4 } from 'uuid';
import type {
    IPv4Address,
    MACAddress,
    IPPacket,
    TCPSegment,
    UDPDatagram,
    ICMPPacket,
    ARPPacket,
    ESPPacket,
    AHPacket,
} from '../core/types';
import type {
    CapturedPacketDetail,
    CaptureProtocol,
    ProtocolLayer,
    ProtocolField,
} from '@/store/packetCaptureStore';

// IP protocol numbers
const IP_PROTOCOLS: Record<number, CaptureProtocol> = {
    1: 'icmp',
    6: 'tcp',
    17: 'udp',
    50: 'esp',
    51: 'ah',
};

// Well-known ports for protocol identification
const WELL_KNOWN_PORTS: Record<number, CaptureProtocol> = {
    20: 'tcp',   // FTP data
    21: 'tcp',   // FTP control
    22: 'ssh',
    23: 'telnet',
    25: 'tcp',   // SMTP
    53: 'dns',
    67: 'dhcp',  // DHCP server
    68: 'dhcp',  // DHCP client
    80: 'http',
    443: 'https',
    500: 'isakmp',
};

// EtherType values
const ETHER_TYPES: Record<number, string> = {
    0x0800: 'IPv4',
    0x0806: 'ARP',
    0x86DD: 'IPv6',
    0x8100: 'VLAN',
};

/**
 * Packet counter for unique numbering
 */
let packetCounter = 0;
let captureStartTime: number | null = null;
let lastPacketTime: number = 0;

/**
 * Reset packet counter and timing
 */
export function resetPacketCounter(): void {
    packetCounter = 0;
    captureStartTime = null;
    lastPacketTime = 0;
}

/**
 * Convert IPv4Address to string
 */
function ipToString(ip: IPv4Address): string {
    if (typeof ip.toString === 'function') {
        return ip.toString();
    }
    return ip.octets.join('.');
}

/**
 * Convert MACAddress to string
 */
function macToString(mac: MACAddress): string {
    if (typeof mac.toString === 'function') {
        return mac.toString();
    }
    return mac.bytes.map(b => b.toString(16).padStart(2, '0')).join(':').toUpperCase();
}

/**
 * Simple ethernet info for display purposes
 */
interface SimpleEthernet {
    sourceMAC: string;
    destinationMAC: string;
    etherType: number;
}

/**
 * Determine the highest-level protocol from packet contents
 */
function determineProtocol(options: {
    ethernet?: SimpleEthernet;
    arp?: ARPPacket;
    ip?: IPPacket;
    tcp?: TCPSegment;
    udp?: UDPDatagram;
    icmp?: ICMPPacket;
    esp?: ESPPacket;
    ah?: AHPacket;
}): CaptureProtocol {
    const { arp, ip, tcp, udp, icmp, esp, ah } = options;

    // Check for IPSec first
    if (esp) return 'esp';
    if (ah) return 'ah';

    // Check transport layer
    if (tcp) {
        // Check for application-layer protocols by port
        const srcPort = tcp.sourcePort;
        const dstPort = tcp.destinationPort;
        
        if (srcPort === 22 || dstPort === 22) return 'ssh';
        if (srcPort === 23 || dstPort === 23) return 'telnet';
        if (srcPort === 80 || dstPort === 80) return 'http';
        if (srcPort === 443 || dstPort === 443) return 'https';
        
        return 'tcp';
    }

    if (udp) {
        const srcPort = udp.sourcePort;
        const dstPort = udp.destinationPort;
        
        if (srcPort === 53 || dstPort === 53) return 'dns';
        if (srcPort === 67 || dstPort === 67 || srcPort === 68 || dstPort === 68) return 'dhcp';
        if (srcPort === 500 || dstPort === 500) return 'isakmp';
        
        return 'udp';
    }

    if (icmp) return 'icmp';
    if (arp) return 'arp';
    if (ip) return 'ipv4';

    return 'ethernet';
}

/**
 * Generate info string based on protocol type
 */
function generateInfoString(options: {
    protocol: CaptureProtocol;
    ip?: IPPacket;
    tcp?: TCPSegment;
    udp?: UDPDatagram;
    icmp?: ICMPPacket;
    arp?: ARPPacket;
    esp?: ESPPacket;
    ah?: AHPacket;
}): string {
    const { protocol, ip, tcp, udp, icmp, arp, esp, ah } = options;

    switch (protocol) {
        case 'tcp': {
            if (!tcp) return 'TCP';
            const flags: string[] = [];
            if (tcp.flags.syn) flags.push('SYN');
            if (tcp.flags.ack) flags.push('ACK');
            if (tcp.flags.fin) flags.push('FIN');
            if (tcp.flags.rst) flags.push('RST');
            if (tcp.flags.psh) flags.push('PSH');
            const flagStr = flags.join(', ') || 'None';
            const dataLen = tcp.data?.length ?? 0;
            return `${tcp.sourcePort} → ${tcp.destinationPort} [${flagStr}] Seq=${tcp.sequenceNumber} Ack=${tcp.acknowledgmentNumber} Win=${tcp.window} Len=${dataLen}`;
        }

        case 'udp': {
            if (!udp) return 'UDP';
            const dataLen = udp.data?.length ?? 0;
            return `${udp.sourcePort} → ${udp.destinationPort} Len=${dataLen}`;
        }

        case 'icmp': {
            if (!icmp) return 'ICMP';
            const typeName = getICMPTypeName(icmp.type);
            if (icmp.type === 8) return `Echo (ping) request`;
            if (icmp.type === 0) return `Echo (ping) reply`;
            if (icmp.type === 3) return `Destination unreachable (Code: ${icmp.code})`;
            if (icmp.type === 11) return `Time-to-live exceeded`;
            return `${typeName} (type=${icmp.type}, code=${icmp.code})`;
        }

        case 'arp': {
            if (!arp) return 'ARP';
            if (arp.opcode === 'request') {
                return `Who has ${ipToString(arp.targetIP)}? Tell ${ipToString(arp.senderIP)}`;
            } else {
                return `${ipToString(arp.senderIP)} is at ${macToString(arp.senderMAC)}`;
            }
        }

        case 'esp': {
            if (!esp) return 'ESP';
            return `SPI: 0x${esp.spi.toString(16).padStart(8, '0')}, Seq: ${esp.sequenceNumber}`;
        }

        case 'ah': {
            if (!ah) return 'AH';
            return `SPI: 0x${ah.spi.toString(16).padStart(8, '0')}, Seq: ${ah.sequenceNumber}`;
        }

        case 'dns':
            return udp ? `Standard query ${udp.sourcePort} → ${udp.destinationPort}` : 'DNS';

        case 'dhcp':
            return udp ? `DHCP ${udp.sourcePort} → ${udp.destinationPort}` : 'DHCP';

        case 'http':
            return tcp ? `HTTP ${tcp.sourcePort} → ${tcp.destinationPort}` : 'HTTP';

        case 'https':
            return tcp ? `HTTPS ${tcp.sourcePort} → ${tcp.destinationPort}` : 'HTTPS';

        case 'ssh':
            return tcp ? `SSH ${tcp.sourcePort} → ${tcp.destinationPort}` : 'SSH';

        case 'telnet':
            return tcp ? `Telnet ${tcp.sourcePort} → ${tcp.destinationPort}` : 'Telnet';

        case 'isakmp':
            return `ISAKMP ${udp?.sourcePort ?? ''} → ${udp?.destinationPort ?? ''}`;

        default:
            return protocol.toUpperCase();
    }
}

/**
 * Get ICMP type name
 */
function getICMPTypeName(type: number): string {
    switch (type) {
        case 0: return 'Echo Reply';
        case 3: return 'Destination Unreachable';
        case 4: return 'Source Quench';
        case 5: return 'Redirect';
        case 8: return 'Echo Request';
        case 11: return 'Time Exceeded';
        case 12: return 'Parameter Problem';
        case 13: return 'Timestamp Request';
        case 14: return 'Timestamp Reply';
        default: return 'Unknown';
    }
}

/**
 * Generate protocol layers for detail view
 */
function generateProtocolLayers(options: {
    ethernet?: { sourceMAC: string; destinationMAC: string; etherType: number };
    ip?: IPPacket;
    tcp?: TCPSegment;
    udp?: UDPDatagram;
    icmp?: ICMPPacket;
    arp?: ARPPacket;
    esp?: ESPPacket;
    ah?: AHPacket;
}): ProtocolLayer[] {
    const layers: ProtocolLayer[] = [];
    let offset = 0;

    // Ethernet layer
    if (options.ethernet) {
        const eth = options.ethernet;
        layers.push({
            name: 'Ethernet II',
            protocol: 'ethernet',
            expanded: false,
            rawOffset: offset,
            rawLength: 14,
            fields: [
                { name: 'Destination', value: eth.destinationMAC, offset: 0, length: 6 },
                { name: 'Source', value: eth.sourceMAC, offset: 6, length: 6 },
                { 
                    name: 'Type', 
                    value: `0x${eth.etherType.toString(16).padStart(4, '0')}`,
                    description: ETHER_TYPES[eth.etherType] || 'Unknown',
                    offset: 12, 
                    length: 2 
                },
            ],
        });
        offset += 14;
    }

    // ARP layer
    if (options.arp) {
        const arp = options.arp;
        layers.push({
            name: 'Address Resolution Protocol',
            protocol: 'arp',
            expanded: false,
            rawOffset: offset,
            rawLength: 28,
            fields: [
                { name: 'Hardware type', value: arp.hardwareType.toString(), description: 'Ethernet (1)' },
                { name: 'Protocol type', value: `0x${arp.protocolType.toString(16).padStart(4, '0')}`, description: 'IPv4' },
                { name: 'Hardware size', value: arp.hardwareSize.toString() },
                { name: 'Protocol size', value: arp.protocolSize.toString() },
                { name: 'Opcode', value: arp.opcode, description: arp.opcode === 'request' ? 'Request (1)' : 'Reply (2)' },
                { name: 'Sender MAC address', value: macToString(arp.senderMAC) },
                { name: 'Sender IP address', value: ipToString(arp.senderIP) },
                { name: 'Target MAC address', value: macToString(arp.targetMAC) },
                { name: 'Target IP address', value: ipToString(arp.targetIP) },
            ],
        });
        offset += 28;
    }

    // IP layer
    if (options.ip) {
        const ip = options.ip;
        const headerLength = ip.ihl * 4;
        
        layers.push({
            name: 'Internet Protocol Version 4',
            protocol: 'ipv4',
            expanded: false,
            rawOffset: offset,
            rawLength: headerLength,
            fields: [
                { 
                    name: 'Version', 
                    value: ip.version.toString(),
                    offset: offset,
                    length: 1,
                    children: [
                        { name: 'Header Length', value: `${ip.ihl} (${headerLength} bytes)` }
                    ]
                },
                { 
                    name: 'Differentiated Services', 
                    value: `0x${((ip.dscp << 2) | ip.ecn).toString(16).padStart(2, '0')}`,
                    children: [
                        { name: 'DSCP', value: ip.dscp.toString() },
                        { name: 'ECN', value: ip.ecn.toString() }
                    ]
                },
                { name: 'Total Length', value: ip.totalLength.toString() },
                { name: 'Identification', value: `0x${ip.identification.toString(16).padStart(4, '0')} (${ip.identification})` },
                { 
                    name: 'Flags', 
                    value: `0x${(ip.flags.dontFragment ? 2 : 0).toString(16)}`,
                    children: [
                        { name: "Don't Fragment", value: ip.flags.dontFragment ? 'Set' : 'Not set' },
                        { name: 'More Fragments', value: ip.flags.moreFragments ? 'Set' : 'Not set' }
                    ]
                },
                { name: 'Fragment Offset', value: ip.fragmentOffset.toString() },
                { name: 'Time to Live', value: ip.ttl.toString() },
                { name: 'Protocol', value: ip.protocol.toString(), description: IP_PROTOCOLS[ip.protocol]?.toUpperCase() || 'Unknown' },
                { name: 'Header Checksum', value: `0x${ip.headerChecksum.toString(16).padStart(4, '0')}` },
                { name: 'Source Address', value: ipToString(ip.sourceIP) },
                { name: 'Destination Address', value: ipToString(ip.destinationIP) },
            ],
        });
        offset += headerLength;
    }

    // ICMP layer
    if (options.icmp) {
        const icmp = options.icmp;
        layers.push({
            name: 'Internet Control Message Protocol',
            protocol: 'icmp',
            expanded: false,
            rawOffset: offset,
            rawLength: 8 + (icmp.data?.length ?? 0),
            fields: [
                { name: 'Type', value: icmp.type.toString(), description: getICMPTypeName(icmp.type) },
                { name: 'Code', value: icmp.code.toString() },
                { name: 'Checksum', value: `0x${icmp.checksum.toString(16).padStart(4, '0')}` },
                ...(icmp.data ? [{ name: 'Data', value: `${icmp.data.length} bytes` }] : []),
            ],
        });
    }

    // TCP layer
    if (options.tcp) {
        const tcp = options.tcp;
        const headerLength = tcp.dataOffset * 4;
        
        const flags: string[] = [];
        if (tcp.flags.syn) flags.push('SYN');
        if (tcp.flags.ack) flags.push('ACK');
        if (tcp.flags.fin) flags.push('FIN');
        if (tcp.flags.rst) flags.push('RST');
        if (tcp.flags.psh) flags.push('PSH');
        if (tcp.flags.urg) flags.push('URG');
        
        const flagValue = 
            (tcp.flags.urg ? 0x20 : 0) |
            (tcp.flags.ack ? 0x10 : 0) |
            (tcp.flags.psh ? 0x08 : 0) |
            (tcp.flags.rst ? 0x04 : 0) |
            (tcp.flags.syn ? 0x02 : 0) |
            (tcp.flags.fin ? 0x01 : 0);
        
        layers.push({
            name: 'Transmission Control Protocol',
            protocol: 'tcp',
            expanded: false,
            rawOffset: offset,
            rawLength: headerLength + (tcp.data?.length ?? 0),
            fields: [
                { name: 'Source Port', value: tcp.sourcePort.toString() },
                { name: 'Destination Port', value: tcp.destinationPort.toString() },
                { name: 'Sequence Number', value: tcp.sequenceNumber.toString() },
                { name: 'Acknowledgment Number', value: tcp.acknowledgmentNumber.toString() },
                { name: 'Header Length', value: `${tcp.dataOffset} (${headerLength} bytes)` },
                { 
                    name: 'Flags', 
                    value: `0x${flagValue.toString(16).padStart(2, '0')} (${flags.join(', ') || 'None'})`,
                    children: [
                        { name: 'URG', value: tcp.flags.urg ? '1' : '0' },
                        { name: 'ACK', value: tcp.flags.ack ? '1' : '0' },
                        { name: 'PSH', value: tcp.flags.psh ? '1' : '0' },
                        { name: 'RST', value: tcp.flags.rst ? '1' : '0' },
                        { name: 'SYN', value: tcp.flags.syn ? '1' : '0' },
                        { name: 'FIN', value: tcp.flags.fin ? '1' : '0' },
                    ]
                },
                { name: 'Window', value: tcp.window.toString() },
                { name: 'Checksum', value: `0x${tcp.checksum.toString(16).padStart(4, '0')}` },
                { name: 'Urgent Pointer', value: tcp.urgentPointer.toString() },
                ...(tcp.data ? [{ name: 'Payload', value: `${tcp.data.length} bytes` }] : []),
            ],
        });
    }

    // UDP layer
    if (options.udp) {
        const udp = options.udp;
        layers.push({
            name: 'User Datagram Protocol',
            protocol: 'udp',
            expanded: false,
            rawOffset: offset,
            rawLength: udp.length,
            fields: [
                { name: 'Source Port', value: udp.sourcePort.toString() },
                { name: 'Destination Port', value: udp.destinationPort.toString() },
                { name: 'Length', value: udp.length.toString() },
                { name: 'Checksum', value: `0x${udp.checksum.toString(16).padStart(4, '0')}` },
                ...(udp.data ? [{ name: 'Payload', value: `${udp.data.length} bytes` }] : []),
            ],
        });
    }

    // ESP layer
    if (options.esp) {
        const esp = options.esp;
        layers.push({
            name: 'Encapsulating Security Payload',
            protocol: 'esp',
            expanded: false,
            rawOffset: offset,
            rawLength: 8 + (esp.iv?.length ?? 0) + esp.encryptedPayload.length,
            fields: [
                { name: 'SPI', value: `0x${esp.spi.toString(16).padStart(8, '0')}` },
                { name: 'Sequence Number', value: esp.sequenceNumber.toString() },
                ...(esp.iv ? [{ name: 'IV', value: `${esp.iv.length} bytes` }] : []),
                { name: 'Encrypted Payload', value: `${esp.encryptedPayload.length} bytes` },
                { name: 'Pad Length', value: esp.padLength.toString() },
                { name: 'Next Header', value: esp.nextHeader.toString(), description: IP_PROTOCOLS[esp.nextHeader]?.toUpperCase() || 'Unknown' },
            ],
        });
    }

    // AH layer
    if (options.ah) {
        const ah = options.ah;
        layers.push({
            name: 'Authentication Header',
            protocol: 'ah',
            expanded: false,
            rawOffset: offset,
            rawLength: 12 + ah.icv.length,
            fields: [
                { name: 'Next Header', value: ah.nextHeader.toString(), description: IP_PROTOCOLS[ah.nextHeader]?.toUpperCase() || 'Unknown' },
                { name: 'Payload Length', value: ah.payloadLength.toString() },
                { name: 'Reserved', value: ah.reserved.toString() },
                { name: 'SPI', value: `0x${ah.spi.toString(16).padStart(8, '0')}` },
                { name: 'Sequence Number', value: ah.sequenceNumber.toString() },
                { name: 'ICV', value: `${ah.icv.length} bytes` },
            ],
        });
    }

    return layers;
}

/**
 * Generate raw data (Uint8Array) from packet components
 */
function generateRawData(options: {
    ethernet?: { sourceMAC: string; destinationMAC: string; etherType: number };
    ip?: IPPacket;
    tcp?: TCPSegment;
    udp?: UDPDatagram;
    icmp?: ICMPPacket;
    arp?: ARPPacket;
    esp?: ESPPacket;
    ah?: AHPacket;
}): Uint8Array {
    const parts: Uint8Array[] = [];

    // Ethernet header (14 bytes)
    if (options.ethernet) {
        const eth = new Uint8Array(14);
        const dstMac = parseMACString(options.ethernet.destinationMAC);
        const srcMac = parseMACString(options.ethernet.sourceMAC);
        
        eth.set(dstMac, 0);
        eth.set(srcMac, 6);
        eth[12] = (options.ethernet.etherType >> 8) & 0xff;
        eth[13] = options.ethernet.etherType & 0xff;
        
        parts.push(eth);
    }

    // IP header (20+ bytes)
    if (options.ip) {
        const ip = options.ip;
        const headerLen = ip.ihl * 4;
        const ipHeader = new Uint8Array(headerLen);
        
        ipHeader[0] = (ip.version << 4) | ip.ihl;
        ipHeader[1] = (ip.dscp << 2) | ip.ecn;
        ipHeader[2] = (ip.totalLength >> 8) & 0xff;
        ipHeader[3] = ip.totalLength & 0xff;
        ipHeader[4] = (ip.identification >> 8) & 0xff;
        ipHeader[5] = ip.identification & 0xff;
        
        let flagsOffset = 0;
        if (ip.flags.dontFragment) flagsOffset |= 0x40;
        if (ip.flags.moreFragments) flagsOffset |= 0x20;
        ipHeader[6] = flagsOffset | ((ip.fragmentOffset >> 8) & 0x1f);
        ipHeader[7] = ip.fragmentOffset & 0xff;
        
        ipHeader[8] = ip.ttl;
        ipHeader[9] = ip.protocol;
        ipHeader[10] = (ip.headerChecksum >> 8) & 0xff;
        ipHeader[11] = ip.headerChecksum & 0xff;
        
        ipHeader.set(ip.sourceIP.octets, 12);
        ipHeader.set(ip.destinationIP.octets, 16);
        
        parts.push(ipHeader);
    }

    // ARP packet (28 bytes)
    if (options.arp) {
        const arp = options.arp;
        const arpData = new Uint8Array(28);
        
        arpData[0] = (arp.hardwareType >> 8) & 0xff;
        arpData[1] = arp.hardwareType & 0xff;
        arpData[2] = (arp.protocolType >> 8) & 0xff;
        arpData[3] = arp.protocolType & 0xff;
        arpData[4] = arp.hardwareSize;
        arpData[5] = arp.protocolSize;
        arpData[6] = 0;
        arpData[7] = arp.opcode === 'request' ? 1 : 2;
        arpData.set(arp.senderMAC.bytes, 8);
        arpData.set(arp.senderIP.octets, 14);
        arpData.set(arp.targetMAC.bytes, 18);
        arpData.set(arp.targetIP.octets, 24);
        
        parts.push(arpData);
    }

    // ICMP header (8+ bytes)
    if (options.icmp) {
        const icmp = options.icmp;
        const icmpHeader = new Uint8Array(8 + (icmp.data?.length ?? 0));
        
        icmpHeader[0] = icmp.type;
        icmpHeader[1] = icmp.code;
        icmpHeader[2] = (icmp.checksum >> 8) & 0xff;
        icmpHeader[3] = icmp.checksum & 0xff;
        
        if (icmp.data) {
            icmpHeader.set(icmp.data, 8);
        }
        
        parts.push(icmpHeader);
    }

    // TCP header (20+ bytes)
    if (options.tcp) {
        const tcp = options.tcp;
        const headerLen = tcp.dataOffset * 4;
        const tcpHeader = new Uint8Array(headerLen + (tcp.data?.length ?? 0));
        
        tcpHeader[0] = (tcp.sourcePort >> 8) & 0xff;
        tcpHeader[1] = tcp.sourcePort & 0xff;
        tcpHeader[2] = (tcp.destinationPort >> 8) & 0xff;
        tcpHeader[3] = tcp.destinationPort & 0xff;
        
        tcpHeader[4] = (tcp.sequenceNumber >> 24) & 0xff;
        tcpHeader[5] = (tcp.sequenceNumber >> 16) & 0xff;
        tcpHeader[6] = (tcp.sequenceNumber >> 8) & 0xff;
        tcpHeader[7] = tcp.sequenceNumber & 0xff;
        
        tcpHeader[8] = (tcp.acknowledgmentNumber >> 24) & 0xff;
        tcpHeader[9] = (tcp.acknowledgmentNumber >> 16) & 0xff;
        tcpHeader[10] = (tcp.acknowledgmentNumber >> 8) & 0xff;
        tcpHeader[11] = tcp.acknowledgmentNumber & 0xff;
        
        let flags = 0;
        if (tcp.flags.urg) flags |= 0x20;
        if (tcp.flags.ack) flags |= 0x10;
        if (tcp.flags.psh) flags |= 0x08;
        if (tcp.flags.rst) flags |= 0x04;
        if (tcp.flags.syn) flags |= 0x02;
        if (tcp.flags.fin) flags |= 0x01;
        
        tcpHeader[12] = (tcp.dataOffset << 4);
        tcpHeader[13] = flags;
        tcpHeader[14] = (tcp.window >> 8) & 0xff;
        tcpHeader[15] = tcp.window & 0xff;
        tcpHeader[16] = (tcp.checksum >> 8) & 0xff;
        tcpHeader[17] = tcp.checksum & 0xff;
        tcpHeader[18] = (tcp.urgentPointer >> 8) & 0xff;
        tcpHeader[19] = tcp.urgentPointer & 0xff;
        
        if (tcp.data) {
            tcpHeader.set(tcp.data, headerLen);
        }
        
        parts.push(tcpHeader);
    }

    // UDP header (8 bytes)
    if (options.udp) {
        const udp = options.udp;
        const udpData = new Uint8Array(8 + (udp.data?.length ?? 0));
        
        udpData[0] = (udp.sourcePort >> 8) & 0xff;
        udpData[1] = udp.sourcePort & 0xff;
        udpData[2] = (udp.destinationPort >> 8) & 0xff;
        udpData[3] = udp.destinationPort & 0xff;
        udpData[4] = (udp.length >> 8) & 0xff;
        udpData[5] = udp.length & 0xff;
        udpData[6] = (udp.checksum >> 8) & 0xff;
        udpData[7] = udp.checksum & 0xff;
        
        if (udp.data) {
            udpData.set(udp.data, 8);
        }
        
        parts.push(udpData);
    }

    // ESP header
    if (options.esp) {
        const esp = options.esp;
        const espLen = 8 + (esp.iv?.length ?? 0) + esp.encryptedPayload.length;
        const espData = new Uint8Array(espLen);
        
        espData[0] = (esp.spi >> 24) & 0xff;
        espData[1] = (esp.spi >> 16) & 0xff;
        espData[2] = (esp.spi >> 8) & 0xff;
        espData[3] = esp.spi & 0xff;
        espData[4] = (esp.sequenceNumber >> 24) & 0xff;
        espData[5] = (esp.sequenceNumber >> 16) & 0xff;
        espData[6] = (esp.sequenceNumber >> 8) & 0xff;
        espData[7] = esp.sequenceNumber & 0xff;
        
        let offset = 8;
        if (esp.iv) {
            espData.set(esp.iv, offset);
            offset += esp.iv.length;
        }
        espData.set(esp.encryptedPayload, offset);
        
        parts.push(espData);
    }

    // AH header
    if (options.ah) {
        const ah = options.ah;
        const ahData = new Uint8Array(12 + ah.icv.length);
        
        ahData[0] = ah.nextHeader;
        ahData[1] = ah.payloadLength;
        ahData[2] = (ah.reserved >> 8) & 0xff;
        ahData[3] = ah.reserved & 0xff;
        ahData[4] = (ah.spi >> 24) & 0xff;
        ahData[5] = (ah.spi >> 16) & 0xff;
        ahData[6] = (ah.spi >> 8) & 0xff;
        ahData[7] = ah.spi & 0xff;
        ahData[8] = (ah.sequenceNumber >> 24) & 0xff;
        ahData[9] = (ah.sequenceNumber >> 16) & 0xff;
        ahData[10] = (ah.sequenceNumber >> 8) & 0xff;
        ahData[11] = ah.sequenceNumber & 0xff;
        ahData.set(ah.icv, 12);
        
        parts.push(ahData);
    }

    // Combine all parts
    const totalLen = parts.reduce((sum, p) => sum + p.length, 0);
    const result = new Uint8Array(totalLen);
    let offset = 0;
    
    for (const part of parts) {
        result.set(part, offset);
        offset += part.length;
    }

    return result;
}

/**
 * Parse MAC address string to byte array
 */
function parseMACString(mac: string): Uint8Array {
    const bytes = mac.split(/[:-]/).map(b => parseInt(b, 16));
    return new Uint8Array(bytes);
}

/**
 * Calculate total packet length
 */
function calculatePacketLength(options: {
    ethernet?: { sourceMAC: string; destinationMAC: string; etherType: number };
    ip?: IPPacket;
    tcp?: TCPSegment;
    udp?: UDPDatagram;
    icmp?: ICMPPacket;
    arp?: ARPPacket;
    esp?: ESPPacket;
    ah?: AHPacket;
}): number {
    let length = 0;

    if (options.ethernet) length += 14;
    if (options.arp) length += 28;
    if (options.ip) {
        length += options.ip.ihl * 4;
    }
    if (options.icmp) {
        length += 8 + (options.icmp.data?.length ?? 0);
    }
    if (options.tcp) {
        length += options.tcp.dataOffset * 4 + (options.tcp.data?.length ?? 0);
    }
    if (options.udp) {
        length += 8 + (options.udp.data?.length ?? 0);
    }
    if (options.esp) {
        length += 8 + (options.esp.iv?.length ?? 0) + options.esp.encryptedPayload.length;
    }
    if (options.ah) {
        length += 12 + options.ah.icv.length;
    }

    return length;
}

/**
 * Main parsing interface - create CapturedPacketDetail from protocol objects
 */
export interface ParsePacketOptions {
    ethernet?: {
        sourceMAC: string;
        destinationMAC: string;
        etherType: number;
    };
    ip?: IPPacket;
    tcp?: TCPSegment;
    udp?: UDPDatagram;
    icmp?: ICMPPacket;
    arp?: ARPPacket;
    esp?: ESPPacket;
    ah?: AHPacket;
    timestamp?: number;
    direction?: 'in' | 'out' | 'unknown';
    sourceDevice?: string;
    destinationDevice?: string;
    capturedOn?: string;
}

/**
 * Parse packet options into a CapturedPacketDetail
 */
export function parsePacket(options: ParsePacketOptions): CapturedPacketDetail {
    const now = options.timestamp ?? Date.now();
    
    // Initialize capture timing
    if (captureStartTime === null) {
        captureStartTime = now;
    }
    
    const relativeTime = now - captureStartTime;
    const deltaTime = lastPacketTime > 0 ? now - lastPacketTime : 0;
    lastPacketTime = now;
    
    packetCounter++;

    // Determine source and destination addresses
    let sourceAddress = '';
    let destinationAddress = '';

    if (options.ip) {
        sourceAddress = ipToString(options.ip.sourceIP);
        destinationAddress = ipToString(options.ip.destinationIP);
    } else if (options.arp) {
        sourceAddress = macToString(options.arp.senderMAC);
        destinationAddress = macToString(options.arp.targetMAC);
    } else if (options.ethernet) {
        sourceAddress = options.ethernet.sourceMAC;
        destinationAddress = options.ethernet.destinationMAC;
    }

    // Determine protocol
    const protocol = determineProtocol(options);

    // Generate info string
    const info = generateInfoString({
        protocol,
        ip: options.ip,
        tcp: options.tcp,
        udp: options.udp,
        icmp: options.icmp,
        arp: options.arp,
        esp: options.esp,
        ah: options.ah,
    });

    // Generate protocol layers
    const layers = generateProtocolLayers({
        ethernet: options.ethernet,
        ip: options.ip,
        tcp: options.tcp,
        udp: options.udp,
        icmp: options.icmp,
        arp: options.arp,
        esp: options.esp,
        ah: options.ah,
    });

    // Generate raw data
    const rawData = generateRawData({
        ethernet: options.ethernet,
        ip: options.ip,
        tcp: options.tcp,
        udp: options.udp,
        icmp: options.icmp,
        arp: options.arp,
        esp: options.esp,
        ah: options.ah,
    });

    // Calculate length
    const length = calculatePacketLength(options);

    return {
        id: uuidv4(),
        number: packetCounter,
        timestamp: now,
        relativeTime,
        deltaTime,
        sourceAddress,
        destinationAddress,
        protocol,
        length,
        info,
        sourceDevice: options.sourceDevice,
        destinationDevice: options.destinationDevice,
        capturedOn: options.capturedOn,
        direction: options.direction ?? 'unknown',
        layers,
        rawData,
        isMarked: false,
        ethernet: options.ethernet,
        ip: options.ip,
        tcp: options.tcp,
        udp: options.udp,
        icmp: options.icmp,
        arp: options.arp,
        esp: options.esp,
        ah: options.ah,
    };
}

/**
 * Generate sample packets for testing/demo
 */
export function generateSamplePackets(count: number = 10): CapturedPacketDetail[] {
    resetPacketCounter();
    const packets: CapturedPacketDetail[] = [];

    const sampleMAC1 = '00:11:22:33:44:55';
    const sampleMAC2 = 'AA:BB:CC:DD:EE:FF';

    const createIP = (octets: [number, number, number, number]): IPv4Address => ({
        octets,
        toString: () => octets.join('.'),
        toNumber: () => octets.reduce((acc, val, i) => acc + (val << (24 - i * 8)), 0),
    });

    const createMAC = (bytes: [number, number, number, number, number, number]): MACAddress => ({
        bytes,
        toString: () => bytes.map(b => b.toString(16).padStart(2, '0')).join(':').toUpperCase(),
    });

    for (let i = 0; i < count; i++) {
        const type = i % 5;
        let packet: CapturedPacketDetail;

        switch (type) {
            case 0: // ICMP Echo Request
                packet = parsePacket({
                    ethernet: { sourceMAC: sampleMAC1, destinationMAC: sampleMAC2, etherType: 0x0800 },
                    ip: {
                        version: 4,
                        ihl: 5,
                        dscp: 0,
                        ecn: 0,
                        totalLength: 84,
                        identification: 1000 + i,
                        flags: { reserved: false, dontFragment: true, moreFragments: false },
                        fragmentOffset: 0,
                        ttl: 64,
                        protocol: 1,
                        headerChecksum: 0xabcd,
                        sourceIP: createIP([192, 168, 1, 10]),
                        destinationIP: createIP([192, 168, 1, 1]),
                        payload: {} as ICMPPacket,
                    },
                    icmp: {
                        type: 8,
                        code: 0,
                        checksum: 0x1234,
                        data: new Uint8Array(56),
                    },
                    direction: 'out',
                    timestamp: Date.now() + i * 100,
                });
                break;

            case 1: // TCP SYN
                packet = parsePacket({
                    ethernet: { sourceMAC: sampleMAC1, destinationMAC: sampleMAC2, etherType: 0x0800 },
                    ip: {
                        version: 4,
                        ihl: 5,
                        dscp: 0,
                        ecn: 0,
                        totalLength: 52,
                        identification: 2000 + i,
                        flags: { reserved: false, dontFragment: true, moreFragments: false },
                        fragmentOffset: 0,
                        ttl: 64,
                        protocol: 6,
                        headerChecksum: 0xbcde,
                        sourceIP: createIP([192, 168, 1, 10]),
                        destinationIP: createIP([93, 184, 216, 34]),
                        payload: {} as TCPSegment,
                    },
                    tcp: {
                        sourcePort: 45678,
                        destinationPort: 80,
                        sequenceNumber: 1000000 + i * 100,
                        acknowledgmentNumber: 0,
                        dataOffset: 8,
                        flags: { urg: false, ack: false, psh: false, rst: false, syn: true, fin: false },
                        window: 65535,
                        checksum: 0xcdef,
                        urgentPointer: 0,
                    },
                    direction: 'out',
                    timestamp: Date.now() + i * 100,
                });
                break;

            case 2: // UDP DNS
                packet = parsePacket({
                    ethernet: { sourceMAC: sampleMAC1, destinationMAC: sampleMAC2, etherType: 0x0800 },
                    ip: {
                        version: 4,
                        ihl: 5,
                        dscp: 0,
                        ecn: 0,
                        totalLength: 60,
                        identification: 3000 + i,
                        flags: { reserved: false, dontFragment: true, moreFragments: false },
                        fragmentOffset: 0,
                        ttl: 64,
                        protocol: 17,
                        headerChecksum: 0xdef0,
                        sourceIP: createIP([192, 168, 1, 10]),
                        destinationIP: createIP([8, 8, 8, 8]),
                        payload: {} as UDPDatagram,
                    },
                    udp: {
                        sourcePort: 54321,
                        destinationPort: 53,
                        length: 32,
                        checksum: 0xef01,
                        data: new Uint8Array(24),
                    },
                    direction: 'out',
                    timestamp: Date.now() + i * 100,
                });
                break;

            case 3: // ARP Request
                packet = parsePacket({
                    ethernet: { sourceMAC: sampleMAC1, destinationMAC: 'FF:FF:FF:FF:FF:FF', etherType: 0x0806 },
                    arp: {
                        hardwareType: 1,
                        protocolType: 0x0800,
                        hardwareSize: 6,
                        protocolSize: 4,
                        opcode: 'request',
                        senderMAC: createMAC([0x00, 0x11, 0x22, 0x33, 0x44, 0x55]),
                        senderIP: createIP([192, 168, 1, 10]),
                        targetMAC: createMAC([0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
                        targetIP: createIP([192, 168, 1, 1]),
                    },
                    direction: 'out',
                    timestamp: Date.now() + i * 100,
                });
                break;

            case 4: // ESP Encrypted
                packet = parsePacket({
                    ethernet: { sourceMAC: sampleMAC1, destinationMAC: sampleMAC2, etherType: 0x0800 },
                    ip: {
                        version: 4,
                        ihl: 5,
                        dscp: 0,
                        ecn: 0,
                        totalLength: 100,
                        identification: 5000 + i,
                        flags: { reserved: false, dontFragment: true, moreFragments: false },
                        fragmentOffset: 0,
                        ttl: 64,
                        protocol: 50,
                        headerChecksum: 0x1234,
                        sourceIP: createIP([10, 0, 0, 1]),
                        destinationIP: createIP([10, 0, 0, 2]),
                        payload: {} as ESPPacket,
                    },
                    esp: {
                        spi: 0x12345678,
                        sequenceNumber: i + 1,
                        iv: new Uint8Array(16),
                        encryptedPayload: new Uint8Array(40),
                        padLength: 2,
                        nextHeader: 6,
                    },
                    direction: 'out',
                    timestamp: Date.now() + i * 100,
                });
                break;

            default:
                continue;
        }

        packets.push(packet);
    }

    return packets;
}

// Export default
export default {
    parsePacket,
    generateSamplePackets,
    resetPacketCounter,
};
