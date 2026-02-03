'use client';

// StreamPanel - TCP Stream following and analysis panel
// Shows TCP stream details, reassembled data, and conversation view

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    ArrowRight, 
    ArrowLeft, 
    Copy, 
    FileDown,
    ChevronDown,
    ChevronRight,
    Activity,
    Clock,
    Layers,
    MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
    StreamTracker, 
    getStreamTracker,
    type TCPStream,
    type StreamSegment 
} from '@/lib/network/capture';
import type { CapturedPacketDetail } from '@/store/packetCaptureStore';

interface StreamPanelProps {
    packet?: CapturedPacketDetail;
    packets: CapturedPacketDetail[];
    onClose: () => void;
    onSelectPacket?: (packetId: string) => void;
    className?: string;
}

export function StreamPanel({ packet, packets, onClose, onSelectPacket, className }: StreamPanelProps) {
    const [viewMode, setViewMode] = useState<'conversation' | 'client' | 'server' | 'hex'>('conversation');
    const [showStats, setShowStats] = useState(true);
    
    // Get stream tracker and find stream for current packet
    const streamTracker = useMemo(() => {
        const tracker = getStreamTracker();
        // Process all packets to build streams
        packets.forEach(p => tracker.processPacket(p));
        return tracker;
    }, [packets]);
    
    const stream = useMemo(() => {
        if (!packet) return null;
        return streamTracker.getStreamForPacket(packet);
    }, [packet, streamTracker]);
    
    // Get conversation view data
    const conversationData = useMemo(() => {
        if (!stream) return [];
        
        return stream.segments
            .filter(s => s.dataLength > 0 || s.flags.syn || s.flags.fin || s.flags.rst)
            .map(segment => {
                const decoder = new TextDecoder('utf-8', { fatal: false });
                let displayData = '';
                
                if (segment.data && segment.data.length > 0) {
                    displayData = decoder.decode(segment.data);
                    // Truncate long data
                    if (displayData.length > 500) {
                        displayData = displayData.slice(0, 500) + '...';
                    }
                } else {
                    // Show flag information
                    const flags: string[] = [];
                    if (segment.flags.syn) flags.push('SYN');
                    if (segment.flags.ack) flags.push('ACK');
                    if (segment.flags.fin) flags.push('FIN');
                    if (segment.flags.rst) flags.push('RST');
                    if (segment.flags.psh) flags.push('PSH');
                    displayData = `[${flags.join(', ')}]`;
                }
                
                return {
                    ...segment,
                    displayData,
                };
            });
    }, [stream]);
    
    // Get raw stream data
    const clientData = useMemo(() => {
        if (!stream) return '';
        const decoder = new TextDecoder('utf-8', { fatal: false });
        return decoder.decode(stream.clientData);
    }, [stream]);
    
    const serverData = useMemo(() => {
        if (!stream) return '';
        const decoder = new TextDecoder('utf-8', { fatal: false });
        return decoder.decode(stream.serverData);
    }, [stream]);
    
    // Copy to clipboard
    const handleCopy = useCallback((text: string) => {
        navigator.clipboard.writeText(text);
    }, []);
    
    // Export stream
    const handleExport = useCallback(() => {
        if (!stream) return;
        
        const tracker = getStreamTracker();
        const data = tracker.getStreamDataAsText(stream);
        const blob = new Blob([data], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stream-${stream.index}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }, [stream]);
    
    if (!stream) {
        return (
            <div className={cn('bg-zinc-900 border border-zinc-700 rounded-lg', className)}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
                    <h3 className="text-sm font-medium text-zinc-200">TCP Stream</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-zinc-800 rounded"
                    >
                        <X className="w-4 h-4 text-zinc-500" />
                    </button>
                </div>
                <div className="p-8 text-center text-zinc-500">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Select a TCP packet to follow the stream</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className={cn('bg-zinc-900 border border-zinc-700 rounded-lg flex flex-col', className)}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-medium text-zinc-200">
                        TCP Stream #{stream.index}
                    </h3>
                    <span className="text-xs text-zinc-500">
                        {stream.key.srcIP}:{stream.key.srcPort} 
                        <ArrowRight className="w-3 h-3 inline mx-1" />
                        {stream.key.dstIP}:{stream.key.dstPort}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExport}
                        className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400"
                        title="Export stream"
                    >
                        <FileDown className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
            
            {/* View mode tabs */}
            <div className="flex items-center gap-1 px-4 py-2 border-b border-zinc-800">
                {[
                    { id: 'conversation', label: 'Conversation' },
                    { id: 'client', label: 'Client Data' },
                    { id: 'server', label: 'Server Data' },
                    { id: 'hex', label: 'Hex' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setViewMode(tab.id as typeof viewMode)}
                        className={cn(
                            'px-3 py-1.5 text-xs rounded-lg transition-colors',
                            viewMode === tab.id
                                ? 'bg-cyan-900/50 text-cyan-300'
                                : 'hover:bg-zinc-800 text-zinc-400'
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
                
                <div className="ml-auto">
                    <button
                        onClick={() => setShowStats(!showStats)}
                        className={cn(
                            'flex items-center gap-1 px-2 py-1 text-xs rounded',
                            'hover:bg-zinc-800 text-zinc-400'
                        )}
                    >
                        <Activity className="w-3 h-3" />
                        Stats
                        {showStats ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </button>
                </div>
            </div>
            
            {/* Statistics panel */}
            <AnimatePresence>
                {showStats && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-b border-zinc-800 overflow-hidden"
                    >
                        <div className="px-4 py-3 bg-zinc-800/30">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                <div>
                                    <div className="text-zinc-500 mb-1">State</div>
                                    <div className={cn(
                                        'font-medium',
                                        stream.state === 'established' && 'text-emerald-400',
                                        stream.state === 'closed' && 'text-zinc-400',
                                        stream.state === 'reset' && 'text-red-400',
                                        !['established', 'closed', 'reset'].includes(stream.state) && 'text-amber-400'
                                    )}>
                                        {stream.state.toUpperCase()}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-zinc-500 mb-1">Packets</div>
                                    <div className="text-zinc-200">
                                        {stream.statistics.totalPackets}
                                        <span className="text-zinc-500 ml-1">
                                            ({stream.statistics.clientPackets} / {stream.statistics.serverPackets})
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-zinc-500 mb-1">Bytes</div>
                                    <div className="text-zinc-200">
                                        {formatBytes(stream.statistics.totalBytes)}
                                        <span className="text-zinc-500 ml-1">
                                            ({formatBytes(stream.statistics.clientBytes)} / {formatBytes(stream.statistics.serverBytes)})
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-zinc-500 mb-1">Duration</div>
                                    <div className="text-zinc-200">
                                        {formatDuration(stream.statistics.duration)}
                                    </div>
                                </div>
                            </div>
                            {(stream.statistics.retransmissions > 0 || stream.statistics.outOfOrder > 0) && (
                                <div className="mt-2 pt-2 border-t border-zinc-700/50 flex gap-4 text-xs">
                                    {stream.statistics.retransmissions > 0 && (
                                        <span className="text-amber-400">
                                            {stream.statistics.retransmissions} retransmissions
                                        </span>
                                    )}
                                    {stream.statistics.outOfOrder > 0 && (
                                        <span className="text-amber-400">
                                            {stream.statistics.outOfOrder} out-of-order
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Content area */}
            <div className="flex-1 overflow-auto min-h-0">
                {viewMode === 'conversation' && (
                    <div className="p-2 space-y-1">
                        {conversationData.map((segment, index) => (
                            <div
                                key={`${segment.packetNumber}-${index}`}
                                className={cn(
                                    'flex gap-2 text-xs',
                                    segment.direction === 'client-to-server' ? 'justify-start' : 'justify-end'
                                )}
                            >
                                <div
                                    onClick={() => onSelectPacket?.(segment.packetId)}
                                    className={cn(
                                        'max-w-[80%] rounded-lg p-2 cursor-pointer',
                                        'hover:ring-1 hover:ring-cyan-500/50 transition-all',
                                        segment.direction === 'client-to-server'
                                            ? 'bg-blue-900/30 text-blue-200'
                                            : 'bg-emerald-900/30 text-emerald-200'
                                    )}
                                >
                                    <div className="flex items-center gap-2 mb-1 text-[10px] opacity-70">
                                        {segment.direction === 'client-to-server' ? (
                                            <ArrowRight className="w-3 h-3" />
                                        ) : (
                                            <ArrowLeft className="w-3 h-3" />
                                        )}
                                        <span>#{segment.packetNumber}</span>
                                        <span>Seq: {segment.sequenceNumber}</span>
                                        {segment.dataLength > 0 && (
                                            <span>{segment.dataLength} bytes</span>
                                        )}
                                    </div>
                                    <pre className="font-mono whitespace-pre-wrap break-all">
                                        {segment.displayData}
                                    </pre>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {viewMode === 'client' && (
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-zinc-500">
                                Client to Server ({formatBytes(stream.clientData.length)})
                            </span>
                            <button
                                onClick={() => handleCopy(clientData)}
                                className="p-1 hover:bg-zinc-800 rounded text-zinc-400"
                                title="Copy"
                            >
                                <Copy className="w-3 h-3" />
                            </button>
                        </div>
                        <pre className="text-xs font-mono text-blue-200 bg-zinc-800/50 p-3 rounded-lg overflow-auto whitespace-pre-wrap break-all">
                            {clientData || '(no data)'}
                        </pre>
                    </div>
                )}
                
                {viewMode === 'server' && (
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-zinc-500">
                                Server to Client ({formatBytes(stream.serverData.length)})
                            </span>
                            <button
                                onClick={() => handleCopy(serverData)}
                                className="p-1 hover:bg-zinc-800 rounded text-zinc-400"
                                title="Copy"
                            >
                                <Copy className="w-3 h-3" />
                            </button>
                        </div>
                        <pre className="text-xs font-mono text-emerald-200 bg-zinc-800/50 p-3 rounded-lg overflow-auto whitespace-pre-wrap break-all">
                            {serverData || '(no data)'}
                        </pre>
                    </div>
                )}
                
                {viewMode === 'hex' && (
                    <div className="p-4 space-y-4">
                        <div>
                            <div className="text-xs text-zinc-500 mb-2">Client Data (Hex)</div>
                            <pre className="text-xs font-mono text-blue-200 bg-zinc-800/50 p-3 rounded-lg overflow-auto">
                                {formatHex(stream.clientData) || '(no data)'}
                            </pre>
                        </div>
                        <div>
                            <div className="text-xs text-zinc-500 mb-2">Server Data (Hex)</div>
                            <pre className="text-xs font-mono text-emerald-200 bg-zinc-800/50 p-3 rounded-lg overflow-auto">
                                {formatHex(stream.serverData) || '(no data)'}
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper functions
function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

function formatHex(data: Uint8Array): string {
    if (data.length === 0) return '';
    
    const lines: string[] = [];
    const bytesPerLine = 16;
    
    for (let i = 0; i < data.length; i += bytesPerLine) {
        const offset = i.toString(16).padStart(8, '0');
        const bytes = Array.from(data.slice(i, i + bytesPerLine));
        
        const hex = bytes.map(b => b.toString(16).padStart(2, '0')).join(' ');
        const ascii = bytes.map(b => (b >= 32 && b < 127) ? String.fromCharCode(b) : '.').join('');
        
        const padding = '   '.repeat(bytesPerLine - bytes.length);
        lines.push(`${offset}  ${hex}${padding}  ${ascii}`);
    }
    
    return lines.join('\n');
}

export default StreamPanel;
