'use client';

// PacketDetail - Protocol layers tree view (like Wireshark middle pane)
// Shows expandable protocol hierarchy with field details

import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronRight, 
    ChevronDown, 
    Network, 
    Layers,
    Radio,
    Shield,
    Lock,
    Globe,
    Server,
    Cpu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
    usePacketCaptureStore,
    type CapturedPacketDetail,
    type ProtocolLayer,
    type ProtocolField,
    type CaptureProtocol
} from '@/store/packetCaptureStore';

// Protocol icons
const PROTOCOL_ICONS: Record<CaptureProtocol, React.ElementType> = {
    ethernet: Layers,
    arp: Radio,
    ipv4: Network,
    icmp: Radio,
    tcp: Server,
    udp: Server,
    dns: Globe,
    http: Globe,
    https: Lock,
    ssh: Lock,
    telnet: Cpu,
    dhcp: Network,
    esp: Shield,
    ah: Shield,
    isakmp: Lock,
    unknown: Layers,
};

// Protocol display names
const PROTOCOL_NAMES: Record<CaptureProtocol, string> = {
    ethernet: 'Ethernet II',
    arp: 'Address Resolution Protocol',
    ipv4: 'Internet Protocol Version 4',
    icmp: 'Internet Control Message Protocol',
    tcp: 'Transmission Control Protocol',
    udp: 'User Datagram Protocol',
    dns: 'Domain Name System',
    http: 'Hypertext Transfer Protocol',
    https: 'Hypertext Transfer Protocol Secure',
    ssh: 'Secure Shell Protocol',
    telnet: 'Telnet Protocol',
    dhcp: 'Dynamic Host Configuration Protocol',
    esp: 'Encapsulating Security Payload',
    ah: 'Authentication Header',
    isakmp: 'Internet Security Association',
    unknown: 'Unknown Protocol',
};

interface FieldRowProps {
    field: ProtocolField;
    depth: number;
    onFieldHover?: (offset?: number, length?: number) => void;
}

const FieldRow = React.memo(({ field, depth, onFieldHover }: FieldRowProps) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const hasChildren = field.children && field.children.length > 0;
    
    const handleMouseEnter = useCallback(() => {
        if (field.offset !== undefined && field.length !== undefined) {
            onFieldHover?.(field.offset, field.length);
        }
    }, [field.offset, field.length, onFieldHover]);
    
    const handleMouseLeave = useCallback(() => {
        onFieldHover?.(undefined, undefined);
    }, [onFieldHover]);

    return (
        <>
            <div
                className={cn(
                    'flex items-center py-0.5 px-2 hover:bg-zinc-700/50 cursor-default',
                    'border-l-2 border-transparent hover:border-cyan-500/50'
                )}
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {/* Expand/collapse button */}
                {hasChildren ? (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-0.5 hover:bg-zinc-600/50 rounded mr-1"
                    >
                        {isExpanded 
                            ? <ChevronDown className="w-3 h-3 text-zinc-400" />
                            : <ChevronRight className="w-3 h-3 text-zinc-400" />
                        }
                    </button>
                ) : (
                    <span className="w-4 mr-1" />
                )}
                
                {/* Field name */}
                <span className="text-zinc-400 text-xs">
                    {field.name}:
                </span>
                
                {/* Field value */}
                <span className="text-zinc-200 text-xs ml-2 font-mono">
                    {field.value}
                </span>
                
                {/* Description */}
                {field.description && (
                    <span className="text-zinc-500 text-xs ml-2 italic">
                        ({field.description})
                    </span>
                )}
            </div>
            
            {/* Children */}
            <AnimatePresence>
                {isExpanded && hasChildren && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                    >
                        {field.children!.map((child, index) => (
                            <FieldRow
                                key={`${child.name}-${index}`}
                                field={child}
                                depth={depth + 1}
                                onFieldHover={onFieldHover}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
});

FieldRow.displayName = 'FieldRow';

interface LayerSectionProps {
    layer: ProtocolLayer;
    isExpanded: boolean;
    onToggle: () => void;
    onFieldHover?: (offset?: number, length?: number) => void;
}

const LayerSection = React.memo(({ 
    layer, 
    isExpanded, 
    onToggle,
    onFieldHover 
}: LayerSectionProps) => {
    const Icon = PROTOCOL_ICONS[layer.protocol] || Layers;
    const displayName = PROTOCOL_NAMES[layer.protocol] || layer.name;

    return (
        <div className="border-b border-zinc-800 last:border-b-0">
            {/* Layer header */}
            <button
                onClick={onToggle}
                className={cn(
                    'w-full flex items-center gap-2 px-3 py-2',
                    'hover:bg-zinc-800/50 transition-colors',
                    isExpanded && 'bg-zinc-800/30'
                )}
            >
                {isExpanded 
                    ? <ChevronDown className="w-4 h-4 text-zinc-400" />
                    : <ChevronRight className="w-4 h-4 text-zinc-400" />
                }
                <Icon className="w-4 h-4 text-cyan-500" />
                <span className="text-sm text-zinc-200 font-medium">
                    {displayName}
                </span>
                <span className="text-xs text-zinc-500 ml-auto">
                    {layer.rawLength} bytes
                </span>
            </button>
            
            {/* Layer fields */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-zinc-900/50"
                    >
                        {layer.fields.map((field, index) => (
                            <FieldRow
                                key={`${field.name}-${index}`}
                                field={field}
                                depth={0}
                                onFieldHover={onFieldHover}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});

LayerSection.displayName = 'LayerSection';

interface PacketDetailProps {
    packet?: CapturedPacketDetail | null;
    className?: string;
    onFieldHover?: (offset?: number, length?: number) => void;
}

export function PacketDetail({ 
    packet: propPacket, 
    className,
    onFieldHover 
}: PacketDetailProps) {
    const { expandedLayers, toggleLayerExpanded } = usePacketCaptureStore();
    const storePacket = usePacketCaptureStore((state) => state.getSelectedPacket());
    
    // Use prop packet or store packet
    const packet = propPacket ?? storePacket;
    
    if (!packet) {
        return (
            <div className={cn(
                'flex flex-col items-center justify-center h-full',
                'text-zinc-500 text-sm',
                className
            )}>
                <Layers className="w-8 h-8 mb-2 opacity-50" />
                <p>Select a packet to view details</p>
            </div>
        );
    }
    
    // Generate layers if not present
    const layers = packet.layers.length > 0 
        ? packet.layers 
        : generateProtocolLayers(packet);

    return (
        <div className={cn('flex flex-col h-full overflow-hidden', className)}>
            {/* Header */}
            <div className="bg-zinc-900 border-b border-zinc-700 px-3 py-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-200">
                        Packet #{packet.number}
                    </span>
                    <span className="text-xs text-zinc-500">
                        {packet.length} bytes
                    </span>
                </div>
                <div className="text-xs text-zinc-400 mt-1 truncate">
                    {packet.sourceAddress} → {packet.destinationAddress}
                </div>
            </div>
            
            {/* Protocol layers */}
            <div className="flex-1 overflow-auto bg-zinc-900/30">
                {layers.map((layer, index) => {
                    const layerKey = `${packet.id}-${layer.protocol}-${index}`;
                    const isExpanded = expandedLayers.has(layerKey);
                    
                    return (
                        <LayerSection
                            key={layerKey}
                            layer={layer}
                            isExpanded={isExpanded}
                            onToggle={() => toggleLayerExpanded(layerKey)}
                            onFieldHover={onFieldHover}
                        />
                    );
                })}
            </div>
            
            {/* Info bar */}
            {packet.comment && (
                <div className="bg-zinc-800 border-t border-zinc-700 px-3 py-2">
                    <div className="text-xs text-zinc-400">
                        <span className="text-cyan-500">Comment:</span> {packet.comment}
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Generate protocol layers from packet data
 */
function generateProtocolLayers(packet: CapturedPacketDetail): ProtocolLayer[] {
    const layers: ProtocolLayer[] = [];
    let offset = 0;
    
    // Ethernet layer (if available)
    if (packet.ethernet) {
        layers.push({
            name: 'Ethernet II',
            protocol: 'ethernet',
            expanded: false,
            rawOffset: offset,
            rawLength: 14,
            fields: [
                { name: 'Destination', value: packet.ethernet.destinationMAC, offset: 0, length: 6 },
                { name: 'Source', value: packet.ethernet.sourceMAC, offset: 6, length: 6 },
                { 
                    name: 'Type', 
                    value: `0x${packet.ethernet.etherType.toString(16).padStart(4, '0')}`,
                    description: getEtherTypeName(packet.ethernet.etherType),
                    offset: 12, 
                    length: 2 
                },
            ],
        });
        offset += 14;
    }
    
    // ARP layer
    if (packet.arp) {
        layers.push({
            name: 'Address Resolution Protocol',
            protocol: 'arp',
            expanded: false,
            rawOffset: offset,
            rawLength: 28,
            fields: [
                { name: 'Hardware type', value: packet.arp.hardwareType.toString(), description: 'Ethernet (1)' },
                { name: 'Protocol type', value: `0x${packet.arp.protocolType.toString(16).padStart(4, '0')}`, description: 'IPv4' },
                { name: 'Hardware size', value: packet.arp.hardwareSize.toString() },
                { name: 'Protocol size', value: packet.arp.protocolSize.toString() },
                { name: 'Opcode', value: packet.arp.opcode, description: packet.arp.opcode === 'request' ? 'Request (1)' : 'Reply (2)' },
                { name: 'Sender MAC address', value: packet.arp.senderMAC.toString() },
                { name: 'Sender IP address', value: packet.arp.senderIP.toString() },
                { name: 'Target MAC address', value: packet.arp.targetMAC.toString() },
                { name: 'Target IP address', value: packet.arp.targetIP.toString() },
            ],
        });
        offset += 28;
    }
    
    // IP layer
    if (packet.ip) {
        const ip = packet.ip;
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
                        { name: 'Don\'t Fragment', value: ip.flags.dontFragment ? 'Set' : 'Not set' },
                        { name: 'More Fragments', value: ip.flags.moreFragments ? 'Set' : 'Not set' }
                    ]
                },
                { name: 'Fragment Offset', value: ip.fragmentOffset.toString() },
                { name: 'Time to Live', value: ip.ttl.toString() },
                { name: 'Protocol', value: ip.protocol.toString(), description: getProtocolName(ip.protocol) },
                { name: 'Header Checksum', value: `0x${ip.headerChecksum.toString(16).padStart(4, '0')}` },
                { name: 'Source Address', value: ip.sourceIP.toString() },
                { name: 'Destination Address', value: ip.destinationIP.toString() },
            ],
        });
        offset += headerLength;
    }
    
    // ICMP layer
    if (packet.icmp) {
        const icmp = packet.icmp;
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
    if (packet.tcp) {
        const tcp = packet.tcp;
        const headerLength = tcp.dataOffset * 4;
        
        const flags: string[] = [];
        if (tcp.flags.syn) flags.push('SYN');
        if (tcp.flags.ack) flags.push('ACK');
        if (tcp.flags.fin) flags.push('FIN');
        if (tcp.flags.rst) flags.push('RST');
        if (tcp.flags.psh) flags.push('PSH');
        if (tcp.flags.urg) flags.push('URG');
        
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
                    value: `0x${flagsToHex(tcp.flags)} (${flags.join(', ') || 'None'})`,
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
    if (packet.udp) {
        const udp = packet.udp;
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
    if (packet.esp) {
        const esp = packet.esp;
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
                { name: 'Next Header', value: esp.nextHeader.toString(), description: getProtocolName(esp.nextHeader) },
            ],
        });
    }
    
    // AH layer
    if (packet.ah) {
        const ah = packet.ah;
        layers.push({
            name: 'Authentication Header',
            protocol: 'ah',
            expanded: false,
            rawOffset: offset,
            rawLength: 12 + ah.icv.length,
            fields: [
                { name: 'Next Header', value: ah.nextHeader.toString(), description: getProtocolName(ah.nextHeader) },
                { name: 'Payload Length', value: ah.payloadLength.toString() },
                { name: 'SPI', value: `0x${ah.spi.toString(16).padStart(8, '0')}` },
                { name: 'Sequence Number', value: ah.sequenceNumber.toString() },
                { name: 'ICV', value: `${ah.icv.length} bytes` },
            ],
        });
    }
    
    return layers;
}

// Helper functions
function getEtherTypeName(etherType: number): string {
    switch (etherType) {
        case 0x0800: return 'IPv4';
        case 0x0806: return 'ARP';
        case 0x86DD: return 'IPv6';
        case 0x8100: return 'VLAN';
        default: return 'Unknown';
    }
}

function getProtocolName(protocol: number): string {
    switch (protocol) {
        case 1: return 'ICMP';
        case 6: return 'TCP';
        case 17: return 'UDP';
        case 50: return 'ESP';
        case 51: return 'AH';
        default: return 'Unknown';
    }
}

function getICMPTypeName(type: number): string {
    switch (type) {
        case 0: return 'Echo Reply';
        case 3: return 'Destination Unreachable';
        case 5: return 'Redirect';
        case 8: return 'Echo Request';
        case 11: return 'Time Exceeded';
        default: return 'Unknown';
    }
}

function flagsToHex(flags: { urg: boolean; ack: boolean; psh: boolean; rst: boolean; syn: boolean; fin: boolean }): string {
    let value = 0;
    if (flags.urg) value |= 0x20;
    if (flags.ack) value |= 0x10;
    if (flags.psh) value |= 0x08;
    if (flags.rst) value |= 0x04;
    if (flags.syn) value |= 0x02;
    if (flags.fin) value |= 0x01;
    return value.toString(16).padStart(2, '0');
}

export default PacketDetail;
