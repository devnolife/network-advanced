'use client';

// PacketTable - Wireshark-like packet list view
// Displays captured packets in a sortable, filterable table

import React, { useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronUp, 
    ChevronDown, 
    Flag, 
    MessageSquare,
    ArrowUp,
    ArrowDown,
    ArrowLeftRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
    usePacketCaptureStore,
    type CapturedPacketDetail,
    type CaptureProtocol 
} from '@/store/packetCaptureStore';

// Protocol colors (darker for dark theme)
const PROTOCOL_COLORS: Record<CaptureProtocol, { bg: string; text: string }> = {
    ethernet: { bg: 'bg-zinc-700/50', text: 'text-zinc-300' },
    arp: { bg: 'bg-amber-900/40', text: 'text-amber-400' },
    ipv4: { bg: 'bg-zinc-700/50', text: 'text-zinc-300' },
    icmp: { bg: 'bg-pink-900/40', text: 'text-pink-400' },
    tcp: { bg: 'bg-emerald-900/40', text: 'text-emerald-400' },
    udp: { bg: 'bg-blue-900/40', text: 'text-blue-400' },
    dns: { bg: 'bg-cyan-900/40', text: 'text-cyan-400' },
    http: { bg: 'bg-green-900/40', text: 'text-green-400' },
    https: { bg: 'bg-green-900/30', text: 'text-green-500' },
    ssh: { bg: 'bg-purple-900/40', text: 'text-purple-400' },
    telnet: { bg: 'bg-orange-900/40', text: 'text-orange-400' },
    dhcp: { bg: 'bg-teal-900/40', text: 'text-teal-400' },
    esp: { bg: 'bg-yellow-900/40', text: 'text-yellow-400' },
    ah: { bg: 'bg-yellow-900/30', text: 'text-yellow-500' },
    isakmp: { bg: 'bg-yellow-900/40', text: 'text-yellow-400' },
    unknown: { bg: 'bg-zinc-800/50', text: 'text-zinc-400' },
};

// Direction icons
const DirectionIcon = ({ direction }: { direction: 'in' | 'out' | 'unknown' }) => {
    switch (direction) {
        case 'in':
            return <ArrowDown className="w-3 h-3 text-green-400" />;
        case 'out':
            return <ArrowUp className="w-3 h-3 text-blue-400" />;
        default:
            return <ArrowLeftRight className="w-3 h-3 text-zinc-500" />;
    }
};

interface PacketRowProps {
    packet: CapturedPacketDetail;
    isSelected: boolean;
    timeFormat: 'absolute' | 'relative' | 'delta';
    onClick: () => void;
    onDoubleClick: () => void;
    onMark: () => void;
}

const PacketRow = React.memo(({ 
    packet, 
    isSelected, 
    timeFormat,
    onClick, 
    onDoubleClick,
    onMark 
}: PacketRowProps) => {
    const colors = PROTOCOL_COLORS[packet.protocol] || PROTOCOL_COLORS.unknown;
    
    const formatTime = useCallback((p: CapturedPacketDetail) => {
        switch (timeFormat) {
            case 'absolute':
                return new Date(p.timestamp).toLocaleTimeString('en-US', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                }) + '.' + String(p.timestamp % 1000).padStart(3, '0');
            case 'relative':
                return (p.relativeTime / 1000).toFixed(6);
            case 'delta':
                return (p.deltaTime / 1000).toFixed(6);
            default:
                return (p.relativeTime / 1000).toFixed(6);
        }
    }, [timeFormat]);

    return (
        <motion.tr
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            className={cn(
                'cursor-pointer border-b border-zinc-800/50 transition-colors',
                isSelected 
                    ? 'bg-cyan-900/40 hover:bg-cyan-900/50' 
                    : `${colors.bg} hover:bg-zinc-700/70`,
                packet.isMarked && 'border-l-2 border-l-amber-500'
            )}
        >
            {/* Number */}
            <td className="px-2 py-1 text-xs text-zinc-400 font-mono tabular-nums">
                {packet.number}
            </td>
            
            {/* Time */}
            <td className="px-2 py-1 text-xs text-zinc-300 font-mono tabular-nums">
                {formatTime(packet)}
            </td>
            
            {/* Source */}
            <td className="px-2 py-1 text-xs text-zinc-200 font-mono truncate max-w-[150px]">
                <div className="flex items-center gap-1">
                    <DirectionIcon direction={packet.direction} />
                    <span title={packet.sourceAddress}>{packet.sourceAddress}</span>
                </div>
            </td>
            
            {/* Destination */}
            <td className="px-2 py-1 text-xs text-zinc-200 font-mono truncate max-w-[150px]">
                <span title={packet.destinationAddress}>{packet.destinationAddress}</span>
            </td>
            
            {/* Protocol */}
            <td className="px-2 py-1">
                <span className={cn(
                    'px-1.5 py-0.5 rounded text-xs font-medium uppercase',
                    colors.text,
                    'bg-zinc-800/50'
                )}>
                    {packet.protocol}
                </span>
            </td>
            
            {/* Length */}
            <td className="px-2 py-1 text-xs text-zinc-400 font-mono tabular-nums text-right">
                {packet.length}
            </td>
            
            {/* Info */}
            <td className="px-2 py-1 text-xs text-zinc-300 truncate max-w-[400px]">
                <div className="flex items-center gap-2">
                    {packet.isMarked && (
                        <Flag className="w-3 h-3 text-amber-500 flex-shrink-0" />
                    )}
                    {packet.comment && (
                        <MessageSquare className="w-3 h-3 text-cyan-500 flex-shrink-0" />
                    )}
                    <span title={packet.info}>{packet.info}</span>
                </div>
            </td>
        </motion.tr>
    );
});

PacketRow.displayName = 'PacketRow';

interface PacketTableProps {
    className?: string;
    onPacketSelect?: (packet: CapturedPacketDetail) => void;
    onPacketDoubleClick?: (packet: CapturedPacketDetail) => void;
}

export function PacketTable({ 
    className,
    onPacketSelect,
    onPacketDoubleClick 
}: PacketTableProps) {
    const tableRef = useRef<HTMLDivElement>(null);
    const { 
        filteredPackets,
        selectedPacketId,
        selectPacket,
        togglePacketMark,
        autoScroll,
        timeFormat,
        columns,
    } = usePacketCaptureStore();
    
    // Sort state
    const [sortColumn, setSortColumn] = React.useState<string>('number');
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
    
    // Sorted packets
    const sortedPackets = useMemo(() => {
        const sorted = [...filteredPackets];
        
        sorted.sort((a, b) => {
            let comparison = 0;
            
            switch (sortColumn) {
                case 'number':
                    comparison = a.number - b.number;
                    break;
                case 'time':
                    comparison = a.timestamp - b.timestamp;
                    break;
                case 'source':
                    comparison = a.sourceAddress.localeCompare(b.sourceAddress);
                    break;
                case 'destination':
                    comparison = a.destinationAddress.localeCompare(b.destinationAddress);
                    break;
                case 'protocol':
                    comparison = a.protocol.localeCompare(b.protocol);
                    break;
                case 'length':
                    comparison = a.length - b.length;
                    break;
                default:
                    comparison = a.number - b.number;
            }
            
            return sortDirection === 'asc' ? comparison : -comparison;
        });
        
        return sorted;
    }, [filteredPackets, sortColumn, sortDirection]);
    
    // Auto scroll to bottom
    useEffect(() => {
        if (autoScroll && tableRef.current) {
            tableRef.current.scrollTop = tableRef.current.scrollHeight;
        }
    }, [filteredPackets.length, autoScroll]);
    
    // Handle column sort
    const handleSort = useCallback((columnId: string) => {
        if (sortColumn === columnId) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortColumn(columnId);
            setSortDirection('asc');
        }
    }, [sortColumn]);
    
    // Handle row click
    const handleRowClick = useCallback((packet: CapturedPacketDetail) => {
        selectPacket(packet.id);
        onPacketSelect?.(packet);
    }, [selectPacket, onPacketSelect]);
    
    // Handle row double click
    const handleRowDoubleClick = useCallback((packet: CapturedPacketDetail) => {
        onPacketDoubleClick?.(packet);
    }, [onPacketDoubleClick]);
    
    // Visible columns
    const visibleColumns = columns.filter((c) => c.visible);

    return (
        <div className={cn('flex flex-col h-full', className)}>
            {/* Table header */}
            <div className="bg-zinc-900 border-b border-zinc-700 sticky top-0 z-10">
                <table className="w-full table-fixed">
                    <thead>
                        <tr>
                            {visibleColumns.map((column) => (
                                <th
                                    key={column.id}
                                    style={{ width: column.width }}
                                    onClick={() => column.sortable && handleSort(column.id)}
                                    className={cn(
                                        'px-2 py-2 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider',
                                        column.sortable && 'cursor-pointer hover:text-zinc-200 select-none'
                                    )}
                                >
                                    <div className="flex items-center gap-1">
                                        {column.name}
                                        {column.sortable && sortColumn === column.id && (
                                            sortDirection === 'asc' 
                                                ? <ChevronUp className="w-3 h-3" />
                                                : <ChevronDown className="w-3 h-3" />
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                </table>
            </div>
            
            {/* Table body (scrollable) */}
            <div 
                ref={tableRef}
                className="flex-1 overflow-auto bg-zinc-900/50"
            >
                <table className="w-full table-fixed">
                    <tbody>
                        <AnimatePresence mode="popLayout">
                            {sortedPackets.map((packet) => (
                                <PacketRow
                                    key={packet.id}
                                    packet={packet}
                                    isSelected={packet.id === selectedPacketId}
                                    timeFormat={timeFormat}
                                    onClick={() => handleRowClick(packet)}
                                    onDoubleClick={() => handleRowDoubleClick(packet)}
                                    onMark={() => togglePacketMark(packet.id)}
                                />
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>
                
                {/* Empty state */}
                {sortedPackets.length === 0 && (
                    <div className="flex items-center justify-center h-32 text-zinc-500">
                        No packets captured
                    </div>
                )}
            </div>
            
            {/* Status bar */}
            <div className="bg-zinc-900 border-t border-zinc-700 px-3 py-1.5 flex items-center justify-between text-xs text-zinc-400">
                <div>
                    Packets: <span className="text-zinc-200">{filteredPackets.length}</span>
                    {filteredPackets.length !== sortedPackets.length && (
                        <span className="ml-2">
                            (Displayed: <span className="text-zinc-200">{sortedPackets.length}</span>)
                        </span>
                    )}
                </div>
                <div>
                    {selectedPacketId && (
                        <span>
                            Selected: <span className="text-cyan-400">
                                #{filteredPackets.find((p) => p.id === selectedPacketId)?.number}
                            </span>
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PacketTable;
