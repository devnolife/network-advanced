'use client';

// PacketHexView - Hex dump view of packet data (like Wireshark bottom pane)
// Shows hex and ASCII representation of raw packet bytes

import React, { useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { 
    usePacketCaptureStore,
    type CapturedPacketDetail 
} from '@/store/packetCaptureStore';

interface HighlightRange {
    offset: number;
    length: number;
}

interface HexViewProps {
    packet?: CapturedPacketDetail | null;
    className?: string;
    highlightRange?: HighlightRange;
    bytesPerRow?: number;
    showAscii?: boolean;
    showOffset?: boolean;
}

// Convert byte to printable ASCII or dot
const toPrintableChar = (byte: number): string => {
    if (byte >= 32 && byte <= 126) {
        return String.fromCharCode(byte);
    }
    return '.';
};

// Format offset as hex
const formatOffset = (offset: number, width: number = 8): string => {
    return offset.toString(16).padStart(width, '0').toUpperCase();
};

// Format byte as hex
const formatByte = (byte: number): string => {
    return byte.toString(16).padStart(2, '0').toUpperCase();
};

interface HexRowProps {
    offset: number;
    bytes: Uint8Array;
    bytesPerRow: number;
    showAscii: boolean;
    showOffset: boolean;
    highlightStart?: number;
    highlightEnd?: number;
    onByteHover?: (offset: number | null) => void;
    hoveredByte: number | null;
}

const HexRow = React.memo(({
    offset,
    bytes,
    bytesPerRow,
    showAscii,
    showOffset,
    highlightStart,
    highlightEnd,
    onByteHover,
    hoveredByte,
}: HexRowProps) => {
    const hexCells: React.ReactNode[] = [];
    const asciiCells: React.ReactNode[] = [];
    
    for (let i = 0; i < bytesPerRow; i++) {
        const byteOffset = offset + i;
        const byte = i < bytes.length ? bytes[i] : null;
        
        const isHighlighted = highlightStart !== undefined && 
                             highlightEnd !== undefined &&
                             byteOffset >= highlightStart && 
                             byteOffset < highlightEnd;
        
        const isHovered = hoveredByte === byteOffset;
        
        // Add space after every 8 bytes for readability
        if (i > 0 && i % 8 === 0) {
            hexCells.push(
                <span key={`space-${i}`} className="w-2" />
            );
        }
        
        // Hex cell
        hexCells.push(
            <span
                key={`hex-${i}`}
                className={cn(
                    'w-6 text-center cursor-default transition-colors',
                    byte === null && 'text-zinc-700',
                    byte !== null && 'text-zinc-300',
                    isHighlighted && 'bg-cyan-900/60 text-cyan-200',
                    isHovered && 'bg-amber-900/60 text-amber-200 ring-1 ring-amber-500/50'
                )}
                onMouseEnter={() => byte !== null && onByteHover?.(byteOffset)}
                onMouseLeave={() => onByteHover?.(null)}
            >
                {byte !== null ? formatByte(byte) : '  '}
            </span>
        );
        
        // ASCII cell
        if (showAscii) {
            asciiCells.push(
                <span
                    key={`ascii-${i}`}
                    className={cn(
                        'w-2.5 text-center cursor-default transition-colors',
                        byte === null && 'text-zinc-700',
                        byte !== null && (byte >= 32 && byte <= 126 ? 'text-zinc-300' : 'text-zinc-600'),
                        isHighlighted && 'bg-cyan-900/60 text-cyan-200',
                        isHovered && 'bg-amber-900/60 text-amber-200'
                    )}
                    onMouseEnter={() => byte !== null && onByteHover?.(byteOffset)}
                    onMouseLeave={() => onByteHover?.(null)}
                >
                    {byte !== null ? toPrintableChar(byte) : ' '}
                </span>
            );
        }
    }
    
    return (
        <div className="flex items-center font-mono text-xs leading-5 hover:bg-zinc-800/30">
            {/* Offset column */}
            {showOffset && (
                <span className="w-20 text-zinc-500 select-none pr-4 text-right">
                    {formatOffset(offset)}
                </span>
            )}
            
            {/* Hex column */}
            <div className="flex items-center flex-shrink-0">
                {hexCells}
            </div>
            
            {/* ASCII column */}
            {showAscii && (
                <>
                    <span className="w-4" />
                    <div className="flex items-center border-l border-zinc-700 pl-2">
                        {asciiCells}
                    </div>
                </>
            )}
        </div>
    );
});

HexRow.displayName = 'HexRow';

export function PacketHexView({
    packet: propPacket,
    className,
    highlightRange,
    bytesPerRow = 16,
    showAscii = true,
    showOffset = true,
}: HexViewProps) {
    const storePacket = usePacketCaptureStore((state) => state.getSelectedPacket());
    const hexViewMode = usePacketCaptureStore((state) => state.hexViewMode);
    
    // Use prop packet or store packet
    const packet = propPacket ?? storePacket;
    
    // Hovered byte state
    const [hoveredByte, setHoveredByte] = React.useState<number | null>(null);
    
    // Use store settings
    const displayAscii = showAscii && (hexViewMode === 'ascii' || hexViewMode === 'both');
    
    // Generate rows from raw data
    const rows = useMemo(() => {
        if (!packet?.rawData || packet.rawData.length === 0) {
            return [];
        }
        
        const data = packet.rawData;
        const result: { offset: number; bytes: Uint8Array }[] = [];
        
        for (let i = 0; i < data.length; i += bytesPerRow) {
            result.push({
                offset: i,
                bytes: data.slice(i, Math.min(i + bytesPerRow, data.length)),
            });
        }
        
        return result;
    }, [packet?.rawData, bytesPerRow]);
    
    // Handle byte hover
    const handleByteHover = useCallback((offset: number | null) => {
        setHoveredByte(offset);
    }, []);
    
    if (!packet) {
        return (
            <div className={cn(
                'flex flex-col items-center justify-center h-full',
                'text-zinc-500 text-sm font-mono',
                className
            )}>
                <p>No packet selected</p>
            </div>
        );
    }
    
    if (!packet.rawData || packet.rawData.length === 0) {
        return (
            <div className={cn(
                'flex flex-col items-center justify-center h-full',
                'text-zinc-500 text-sm font-mono',
                className
            )}>
                <p>No raw data available</p>
            </div>
        );
    }
    
    const highlightStart = highlightRange?.offset;
    const highlightEnd = highlightRange 
        ? highlightRange.offset + highlightRange.length 
        : undefined;

    return (
        <div className={cn('flex flex-col h-full overflow-hidden', className)}>
            {/* Header */}
            <div className="bg-zinc-900 border-b border-zinc-700 px-3 py-2 flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">
                    Raw Data ({packet.rawData.length} bytes)
                </span>
                {hoveredByte !== null && (
                    <span className="text-xs text-zinc-500">
                        Offset: <span className="text-zinc-300 font-mono">{formatOffset(hoveredByte)}</span>
                        {' | '}
                        Value: <span className="text-zinc-300 font-mono">
                            0x{formatByte(packet.rawData[hoveredByte])} ({packet.rawData[hoveredByte]})
                        </span>
                    </span>
                )}
            </div>
            
            {/* Column headers */}
            <div className="bg-zinc-800/50 border-b border-zinc-700 px-3 py-1 font-mono text-xs text-zinc-500">
                <div className="flex items-center">
                    {showOffset && (
                        <span className="w-20 text-right pr-4">Offset</span>
                    )}
                    <div className="flex items-center">
                        {Array.from({ length: bytesPerRow }).map((_, i) => (
                            <React.Fragment key={i}>
                                {i > 0 && i % 8 === 0 && <span className="w-2" />}
                                <span className="w-6 text-center">
                                    {formatByte(i)}
                                </span>
                            </React.Fragment>
                        ))}
                    </div>
                    {displayAscii && (
                        <>
                            <span className="w-4" />
                            <span className="border-l border-zinc-700 pl-2">ASCII</span>
                        </>
                    )}
                </div>
            </div>
            
            {/* Hex content */}
            <div className="flex-1 overflow-auto bg-zinc-900/30 px-3 py-1">
                {rows.map((row) => (
                    <HexRow
                        key={row.offset}
                        offset={row.offset}
                        bytes={row.bytes}
                        bytesPerRow={bytesPerRow}
                        showAscii={displayAscii}
                        showOffset={showOffset}
                        highlightStart={highlightStart}
                        highlightEnd={highlightEnd}
                        onByteHover={handleByteHover}
                        hoveredByte={hoveredByte}
                    />
                ))}
            </div>
            
            {/* Status bar */}
            <div className="bg-zinc-900 border-t border-zinc-700 px-3 py-1 text-xs text-zinc-500">
                <span>
                    {rows.length} rows | {bytesPerRow} bytes per row
                </span>
                {highlightRange && (
                    <span className="ml-4 text-cyan-500">
                        Selected: offset {highlightRange.offset}, {highlightRange.length} bytes
                    </span>
                )}
            </div>
        </div>
    );
}

/**
 * Utility function to generate sample raw data for testing
 */
export function generateSampleRawData(length: number = 128): Uint8Array {
    const data = new Uint8Array(length);
    
    // Ethernet header
    data[0] = 0xff; data[1] = 0xff; data[2] = 0xff; data[3] = 0xff; data[4] = 0xff; data[5] = 0xff; // Dest MAC
    data[6] = 0x00; data[7] = 0x11; data[8] = 0x22; data[9] = 0x33; data[10] = 0x44; data[11] = 0x55; // Src MAC
    data[12] = 0x08; data[13] = 0x00; // EtherType: IPv4
    
    // IP header
    data[14] = 0x45; // Version + IHL
    data[15] = 0x00; // DSCP + ECN
    data[16] = 0x00; data[17] = length - 14; // Total length
    data[18] = 0x00; data[19] = 0x01; // ID
    data[20] = 0x40; data[21] = 0x00; // Flags + offset
    data[22] = 0x40; // TTL
    data[23] = 0x01; // Protocol (ICMP)
    data[24] = 0x00; data[25] = 0x00; // Checksum
    data[26] = 0xc0; data[27] = 0xa8; data[28] = 0x01; data[29] = 0x01; // Src IP
    data[30] = 0xc0; data[31] = 0xa8; data[32] = 0x01; data[33] = 0x02; // Dst IP
    
    // ICMP header
    data[34] = 0x08; // Type: Echo Request
    data[35] = 0x00; // Code
    data[36] = 0x00; data[37] = 0x00; // Checksum
    data[38] = 0x00; data[39] = 0x01; // ID
    data[40] = 0x00; data[41] = 0x01; // Sequence
    
    // Payload pattern
    for (let i = 42; i < length; i++) {
        data[i] = (i - 42) % 256;
    }
    
    return data;
}

export default PacketHexView;
