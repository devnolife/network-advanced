// StreamTracker - TCP stream tracking and reassembly
// Tracks TCP connections and reassembles TCP conversations

import type { CapturedPacketDetail } from '@/store/packetCaptureStore';

/**
 * TCP stream identifier (4-tuple)
 */
export interface StreamKey {
    srcIP: string;
    srcPort: number;
    dstIP: string;
    dstPort: number;
}

/**
 * TCP stream direction
 */
export type StreamDirection = 'client-to-server' | 'server-to-client';

/**
 * TCP stream segment info
 */
export interface StreamSegment {
    packetId: string;
    packetNumber: number;
    timestamp: number;
    direction: StreamDirection;
    sequenceNumber: number;
    acknowledgmentNumber: number;
    flags: {
        syn: boolean;
        ack: boolean;
        fin: boolean;
        rst: boolean;
        psh: boolean;
        urg: boolean;
    };
    dataLength: number;
    data?: Uint8Array;
}

/**
 * TCP stream state
 */
export type StreamState = 
    | 'syn-sent'
    | 'syn-received'
    | 'established'
    | 'fin-wait-1'
    | 'fin-wait-2'
    | 'close-wait'
    | 'closing'
    | 'last-ack'
    | 'time-wait'
    | 'closed'
    | 'reset';

/**
 * TCP stream statistics
 */
export interface StreamStatistics {
    totalPackets: number;
    clientPackets: number;
    serverPackets: number;
    totalBytes: number;
    clientBytes: number;
    serverBytes: number;
    startTime: number;
    endTime: number;
    duration: number;
    retransmissions: number;
    outOfOrder: number;
    duplicateAcks: number;
}

/**
 * TCP stream information
 */
export interface TCPStream {
    id: string;
    index: number;
    key: StreamKey;
    reverseKey: StreamKey;
    state: StreamState;
    segments: StreamSegment[];
    statistics: StreamStatistics;
    
    // Initial sequence numbers
    clientISN: number;
    serverISN: number;
    
    // Current sequence numbers
    clientSeq: number;
    serverSeq: number;
    
    // Reassembled data
    clientData: Uint8Array;
    serverData: Uint8Array;
}

/**
 * Stream filter options
 */
export interface StreamFilterOptions {
    state?: StreamState[];
    minPackets?: number;
    minBytes?: number;
    srcIP?: string;
    dstIP?: string;
    port?: number;
}

/**
 * Stream reassembly options
 */
export interface ReassemblyOptions {
    maxStreams?: number;
    maxSegmentsPerStream?: number;
    maxDataPerStream?: number;
    trackData?: boolean;
}

const DEFAULT_OPTIONS: Required<ReassemblyOptions> = {
    maxStreams: 1000,
    maxSegmentsPerStream: 10000,
    maxDataPerStream: 1024 * 1024 * 10, // 10MB
    trackData: true,
};

/**
 * Create stream key from packet
 */
function createStreamKey(packet: CapturedPacketDetail): StreamKey | null {
    if (!packet.tcp || !packet.ip) return null;
    
    return {
        srcIP: packet.ip.sourceIP.toString(),
        srcPort: packet.tcp.sourcePort,
        dstIP: packet.ip.destinationIP.toString(),
        dstPort: packet.tcp.destinationPort,
    };
}

/**
 * Get canonical stream key (always client -> server)
 */
function canonicalizeKey(key: StreamKey): { key: StreamKey; reversed: boolean } {
    // Client is typically the higher port or the initiator
    // For simplicity, we use lexicographic ordering
    const forwardStr = `${key.srcIP}:${key.srcPort}-${key.dstIP}:${key.dstPort}`;
    const reverseStr = `${key.dstIP}:${key.dstPort}-${key.srcIP}:${key.srcPort}`;
    
    if (forwardStr <= reverseStr) {
        return { key, reversed: false };
    }
    
    return {
        key: {
            srcIP: key.dstIP,
            srcPort: key.dstPort,
            dstIP: key.srcIP,
            dstPort: key.srcPort,
        },
        reversed: true,
    };
}

/**
 * Stream key to string
 */
function keyToString(key: StreamKey): string {
    return `${key.srcIP}:${key.srcPort}->${key.dstIP}:${key.dstPort}`;
}

/**
 * StreamTracker - tracks and reassembles TCP streams
 */
export class StreamTracker {
    private streams: Map<string, TCPStream> = new Map();
    private streamIndex: number = 0;
    private options: Required<ReassemblyOptions>;
    
    constructor(options: ReassemblyOptions = {}) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }
    
    /**
     * Process a captured packet
     */
    processPacket(packet: CapturedPacketDetail): TCPStream | null {
        // Only process TCP packets
        if (!packet.tcp || !packet.ip) return null;
        
        const rawKey = createStreamKey(packet);
        if (!rawKey) return null;
        
        const { key: canonicalKey, reversed } = canonicalizeKey(rawKey);
        const keyStr = keyToString(canonicalKey);
        
        let stream = this.streams.get(keyStr);
        
        if (!stream) {
            // Create new stream
            if (this.streams.size >= this.options.maxStreams) {
                // Remove oldest stream
                const oldestKey = this.streams.keys().next().value;
                if (oldestKey) {
                    this.streams.delete(oldestKey);
                }
            }
            
            stream = this.createStream(canonicalKey, packet, reversed);
            this.streams.set(keyStr, stream);
        } else {
            // Update existing stream
            this.updateStream(stream, packet, reversed);
        }
        
        return stream;
    }
    
    /**
     * Create a new TCP stream
     */
    private createStream(key: StreamKey, packet: CapturedPacketDetail, isReversed: boolean): TCPStream {
        const tcp = packet.tcp!;
        const direction: StreamDirection = isReversed ? 'server-to-client' : 'client-to-server';
        const isClient = direction === 'client-to-server';
        
        const segment: StreamSegment = {
            packetId: packet.id,
            packetNumber: packet.number,
            timestamp: packet.timestamp,
            direction,
            sequenceNumber: tcp.sequenceNumber,
            acknowledgmentNumber: tcp.acknowledgmentNumber,
            flags: {
                syn: tcp.flags.syn,
                ack: tcp.flags.ack,
                fin: tcp.flags.fin,
                rst: tcp.flags.rst,
                psh: tcp.flags.psh,
                urg: tcp.flags.urg,
            },
            dataLength: tcp.data?.length ?? 0,
            data: this.options.trackData ? tcp.data : undefined,
        };
        
        const stream: TCPStream = {
            id: `stream-${++this.streamIndex}`,
            index: this.streamIndex,
            key,
            reverseKey: {
                srcIP: key.dstIP,
                srcPort: key.dstPort,
                dstIP: key.srcIP,
                dstPort: key.srcPort,
            },
            state: this.determineInitialState(tcp),
            segments: [segment],
            statistics: {
                totalPackets: 1,
                clientPackets: isClient ? 1 : 0,
                serverPackets: isClient ? 0 : 1,
                totalBytes: segment.dataLength,
                clientBytes: isClient ? segment.dataLength : 0,
                serverBytes: isClient ? 0 : segment.dataLength,
                startTime: packet.timestamp,
                endTime: packet.timestamp,
                duration: 0,
                retransmissions: 0,
                outOfOrder: 0,
                duplicateAcks: 0,
            },
            clientISN: isClient ? tcp.sequenceNumber : 0,
            serverISN: isClient ? 0 : tcp.sequenceNumber,
            clientSeq: isClient ? tcp.sequenceNumber : 0,
            serverSeq: isClient ? 0 : tcp.sequenceNumber,
            clientData: new Uint8Array(0),
            serverData: new Uint8Array(0),
        };
        
        return stream;
    }
    
    /**
     * Update an existing TCP stream
     */
    private updateStream(stream: TCPStream, packet: CapturedPacketDetail, isReversed: boolean): void {
        const tcp = packet.tcp!;
        const direction: StreamDirection = isReversed ? 'server-to-client' : 'client-to-server';
        const isClient = direction === 'client-to-server';
        
        // Check for limits
        if (stream.segments.length >= this.options.maxSegmentsPerStream) {
            // Remove oldest segments
            stream.segments = stream.segments.slice(-Math.floor(this.options.maxSegmentsPerStream / 2));
        }
        
        const segment: StreamSegment = {
            packetId: packet.id,
            packetNumber: packet.number,
            timestamp: packet.timestamp,
            direction,
            sequenceNumber: tcp.sequenceNumber,
            acknowledgmentNumber: tcp.acknowledgmentNumber,
            flags: {
                syn: tcp.flags.syn,
                ack: tcp.flags.ack,
                fin: tcp.flags.fin,
                rst: tcp.flags.rst,
                psh: tcp.flags.psh,
                urg: tcp.flags.urg,
            },
            dataLength: tcp.data?.length ?? 0,
            data: this.options.trackData ? tcp.data : undefined,
        };
        
        // Detect retransmission/out-of-order
        const expectedSeq = isClient ? stream.clientSeq : stream.serverSeq;
        if (segment.dataLength > 0) {
            if (tcp.sequenceNumber < expectedSeq) {
                stream.statistics.retransmissions++;
            } else if (tcp.sequenceNumber > expectedSeq) {
                stream.statistics.outOfOrder++;
            }
        }
        
        // Update sequence numbers
        if (isClient) {
            if (tcp.flags.syn) {
                stream.clientISN = tcp.sequenceNumber;
            }
            const newSeq = tcp.sequenceNumber + segment.dataLength + (tcp.flags.syn || tcp.flags.fin ? 1 : 0);
            if (newSeq > stream.clientSeq) {
                stream.clientSeq = newSeq;
            }
        } else {
            if (tcp.flags.syn) {
                stream.serverISN = tcp.sequenceNumber;
            }
            const newSeq = tcp.sequenceNumber + segment.dataLength + (tcp.flags.syn || tcp.flags.fin ? 1 : 0);
            if (newSeq > stream.serverSeq) {
                stream.serverSeq = newSeq;
            }
        }
        
        // Track data
        if (this.options.trackData && segment.data && segment.data.length > 0) {
            if (isClient) {
                if (stream.clientData.length + segment.data.length <= this.options.maxDataPerStream) {
                    const newData = new Uint8Array(stream.clientData.length + segment.data.length);
                    newData.set(stream.clientData);
                    newData.set(segment.data, stream.clientData.length);
                    stream.clientData = newData;
                }
            } else {
                if (stream.serverData.length + segment.data.length <= this.options.maxDataPerStream) {
                    const newData = new Uint8Array(stream.serverData.length + segment.data.length);
                    newData.set(stream.serverData);
                    newData.set(segment.data, stream.serverData.length);
                    stream.serverData = newData;
                }
            }
        }
        
        // Update state
        stream.state = this.updateState(stream.state, tcp, isClient);
        
        // Add segment
        stream.segments.push(segment);
        
        // Update statistics
        stream.statistics.totalPackets++;
        stream.statistics.totalBytes += segment.dataLength;
        if (isClient) {
            stream.statistics.clientPackets++;
            stream.statistics.clientBytes += segment.dataLength;
        } else {
            stream.statistics.serverPackets++;
            stream.statistics.serverBytes += segment.dataLength;
        }
        stream.statistics.endTime = packet.timestamp;
        stream.statistics.duration = stream.statistics.endTime - stream.statistics.startTime;
    }
    
    /**
     * Determine initial stream state
     */
    private determineInitialState(tcp: { flags: { syn: boolean; ack: boolean; rst: boolean } }): StreamState {
        if (tcp.flags.rst) return 'reset';
        if (tcp.flags.syn && !tcp.flags.ack) return 'syn-sent';
        if (tcp.flags.syn && tcp.flags.ack) return 'syn-received';
        return 'established';
    }
    
    /**
     * Update stream state based on TCP flags
     */
    private updateState(
        currentState: StreamState, 
        tcp: { flags: { syn: boolean; ack: boolean; fin: boolean; rst: boolean } },
        isClient: boolean
    ): StreamState {
        if (tcp.flags.rst) return 'reset';
        
        switch (currentState) {
            case 'syn-sent':
                if (tcp.flags.syn && tcp.flags.ack && !isClient) {
                    return 'syn-received';
                }
                break;
            
            case 'syn-received':
                if (tcp.flags.ack && !tcp.flags.syn && isClient) {
                    return 'established';
                }
                break;
            
            case 'established':
                if (tcp.flags.fin) {
                    return isClient ? 'fin-wait-1' : 'close-wait';
                }
                break;
            
            case 'fin-wait-1':
                if (tcp.flags.fin && !isClient) {
                    return 'closing';
                }
                if (tcp.flags.ack && !tcp.flags.fin && !isClient) {
                    return 'fin-wait-2';
                }
                break;
            
            case 'fin-wait-2':
                if (tcp.flags.fin && !isClient) {
                    return 'time-wait';
                }
                break;
            
            case 'close-wait':
                if (tcp.flags.fin && !isClient) {
                    return 'last-ack';
                }
                break;
            
            case 'closing':
                if (tcp.flags.ack && !tcp.flags.fin) {
                    return 'time-wait';
                }
                break;
            
            case 'last-ack':
                if (tcp.flags.ack && isClient) {
                    return 'closed';
                }
                break;
            
            case 'time-wait':
                // Stays in time-wait
                break;
        }
        
        return currentState;
    }
    
    /**
     * Get stream for a packet
     */
    getStreamForPacket(packet: CapturedPacketDetail): TCPStream | null {
        if (!packet.tcp || !packet.ip) return null;
        
        const rawKey = createStreamKey(packet);
        if (!rawKey) return null;
        
        const { key: canonicalKey } = canonicalizeKey(rawKey);
        const keyStr = keyToString(canonicalKey);
        
        return this.streams.get(keyStr) ?? null;
    }
    
    /**
     * Get all streams
     */
    getAllStreams(): TCPStream[] {
        return Array.from(this.streams.values());
    }
    
    /**
     * Get stream by ID
     */
    getStream(id: string): TCPStream | null {
        for (const stream of this.streams.values()) {
            if (stream.id === id) {
                return stream;
            }
        }
        return null;
    }
    
    /**
     * Get stream by index
     */
    getStreamByIndex(index: number): TCPStream | null {
        for (const stream of this.streams.values()) {
            if (stream.index === index) {
                return stream;
            }
        }
        return null;
    }
    
    /**
     * Filter streams
     */
    filterStreams(options: StreamFilterOptions): TCPStream[] {
        return this.getAllStreams().filter(stream => {
            if (options.state && !options.state.includes(stream.state)) {
                return false;
            }
            if (options.minPackets && stream.statistics.totalPackets < options.minPackets) {
                return false;
            }
            if (options.minBytes && stream.statistics.totalBytes < options.minBytes) {
                return false;
            }
            if (options.srcIP && !stream.key.srcIP.includes(options.srcIP)) {
                return false;
            }
            if (options.dstIP && !stream.key.dstIP.includes(options.dstIP)) {
                return false;
            }
            if (options.port) {
                if (stream.key.srcPort !== options.port && 
                    stream.key.dstPort !== options.port) {
                    return false;
                }
            }
            return true;
        });
    }
    
    /**
     * Get packets in a stream
     */
    getStreamPackets(streamId: string, packets: CapturedPacketDetail[]): CapturedPacketDetail[] {
        const stream = this.getStream(streamId);
        if (!stream) return [];
        
        const packetIds = new Set(stream.segments.map(s => s.packetId));
        return packets.filter(p => packetIds.has(p.id));
    }
    
    /**
     * Get reassembled stream data as text
     */
    getStreamDataAsText(stream: TCPStream, direction?: StreamDirection): string {
        const decoder = new TextDecoder('utf-8', { fatal: false });
        
        if (direction === 'client-to-server') {
            return decoder.decode(stream.clientData);
        }
        if (direction === 'server-to-client') {
            return decoder.decode(stream.serverData);
        }
        
        // Interleave based on timestamp
        const segments = stream.segments
            .filter(s => s.data && s.data.length > 0)
            .sort((a, b) => a.timestamp - b.timestamp);
        
        let result = '';
        for (const segment of segments) {
            if (segment.data) {
                const prefix = segment.direction === 'client-to-server' ? '>>> ' : '<<< ';
                const text = decoder.decode(segment.data);
                result += prefix + text + '\n';
            }
        }
        
        return result;
    }
    
    /**
     * Get stream summary
     */
    getStreamSummary(stream: TCPStream): string {
        const { key, statistics, state } = stream;
        return `${key.srcIP}:${key.srcPort} → ${key.dstIP}:${key.dstPort} | ` +
            `${statistics.totalPackets} packets, ${formatBytes(statistics.totalBytes)} | ` +
            `${formatDuration(statistics.duration)} | ${state}`;
    }
    
    /**
     * Clear all streams
     */
    clear(): void {
        this.streams.clear();
        this.streamIndex = 0;
    }
    
    /**
     * Get stream count
     */
    get count(): number {
        return this.streams.size;
    }
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Format duration to human-readable string
 */
function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
}

/**
 * Singleton instance
 */
let streamTrackerInstance: StreamTracker | null = null;

/**
 * Get stream tracker singleton
 */
export function getStreamTracker(options?: ReassemblyOptions): StreamTracker {
    if (!streamTrackerInstance) {
        streamTrackerInstance = new StreamTracker(options);
    }
    return streamTrackerInstance;
}

/**
 * Reset stream tracker singleton
 */
export function resetStreamTracker(options?: ReassemblyOptions): StreamTracker {
    streamTrackerInstance = new StreamTracker(options);
    return streamTrackerInstance;
}

export default StreamTracker;
