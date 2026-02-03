// Packet Capture Store - Wireshark-like packet analysis state management

import { create } from 'zustand';
import type { 
    IPv4Address, 
    IPPacket, 
    TCPSegment, 
    UDPDatagram, 
    ICMPPacket, 
    ARPPacket,
    ESPPacket,
    AHPacket 
} from '@/lib/network/protocols';

/**
 * Protocol types for captured packets
 */
export type CaptureProtocol = 
    | 'ethernet' 
    | 'arp' 
    | 'ipv4' 
    | 'icmp' 
    | 'tcp' 
    | 'udp' 
    | 'dns' 
    | 'http' 
    | 'https'
    | 'ssh'
    | 'telnet'
    | 'dhcp'
    | 'esp'
    | 'ah'
    | 'isakmp'
    | 'unknown';

/**
 * Protocol layer information for packet detail view
 */
export interface ProtocolLayer {
    name: string;
    protocol: CaptureProtocol;
    expanded: boolean;
    fields: ProtocolField[];
    rawOffset: number;
    rawLength: number;
}

export interface ProtocolField {
    name: string;
    value: string;
    description?: string;
    offset?: number;
    length?: number;
    children?: ProtocolField[];
}

/**
 * Captured packet with full protocol details
 */
export interface CapturedPacketDetail {
    id: string;
    number: number;                    // Packet number in capture
    timestamp: number;                 // Capture timestamp (ms)
    relativeTime: number;              // Time since capture start (ms)
    deltaTime: number;                 // Time since previous packet (ms)
    
    // Summary info (for list view)
    sourceAddress: string;             // IP or MAC depending on protocol
    destinationAddress: string;
    protocol: CaptureProtocol;
    length: number;                    // Total packet length
    info: string;                      // Summary info string
    
    // Device info
    sourceDevice?: string;
    destinationDevice?: string;
    capturedOn?: string;               // Interface/device where captured
    direction: 'in' | 'out' | 'unknown';
    
    // Protocol layers (for detail view)
    layers: ProtocolLayer[];
    
    // Raw data (for hex view)
    rawData: Uint8Array;
    
    // Status
    isMarked: boolean;
    comment?: string;
    
    // Original packet objects (for protocol-specific handling)
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
}

/**
 * Capture filter expression
 */
export interface CaptureFilter {
    id: string;
    name: string;
    expression: string;
    description?: string;
    isActive: boolean;
}

/**
 * Display filter (applied after capture)
 */
export interface DisplayFilter {
    protocol?: CaptureProtocol[];
    sourceAddress?: string;
    destinationAddress?: string;
    port?: number;
    searchText?: string;
    minLength?: number;
    maxLength?: number;
    marked?: boolean;
    hasComment?: boolean;
}

/**
 * Capture statistics
 */
export interface CaptureStatistics {
    totalPackets: number;
    totalBytes: number;
    startTime: number | null;
    endTime: number | null;
    duration: number;
    packetsPerSecond: number;
    bytesPerSecond: number;
    protocolCounts: Record<CaptureProtocol, number>;
    topTalkers: { address: string; packets: number; bytes: number }[];
}

/**
 * Capture session
 */
export interface CaptureSession {
    id: string;
    name: string;
    startTime: number;
    endTime?: number;
    interfaceName?: string;
    filter?: CaptureFilter;
    packetCount: number;
}

/**
 * Column configuration for packet list
 */
export interface PacketListColumn {
    id: string;
    name: string;
    width: number;
    visible: boolean;
    sortable: boolean;
}

/**
 * Packet Capture Store State
 */
interface PacketCaptureState {
    // Capture control
    isCapturing: boolean;
    isPaused: boolean;
    currentSession: CaptureSession | null;
    
    // Packets
    packets: CapturedPacketDetail[];
    filteredPackets: CapturedPacketDetail[];
    selectedPacketId: string | null;
    markedPacketIds: Set<string>;
    
    // Filters
    captureFilter: CaptureFilter | null;
    displayFilter: DisplayFilter;
    savedFilters: CaptureFilter[];
    
    // View state
    autoScroll: boolean;
    showHexView: boolean;
    hexViewMode: 'hex' | 'ascii' | 'both';
    columns: PacketListColumn[];
    expandedLayers: Set<string>;
    
    // Statistics
    statistics: CaptureStatistics;
    
    // Settings
    maxPackets: number;
    timeFormat: 'absolute' | 'relative' | 'delta';
    colorRules: { protocol: CaptureProtocol; color: string }[];
}

/**
 * Packet Capture Store Actions
 */
interface PacketCaptureActions {
    // Capture control
    startCapture: (interfaceName?: string, filter?: CaptureFilter) => void;
    stopCapture: () => void;
    pauseCapture: () => void;
    resumeCapture: () => void;
    clearCapture: () => void;
    
    // Packet management
    addPacket: (packet: CapturedPacketDetail) => void;
    addPackets: (packets: CapturedPacketDetail[]) => void;
    selectPacket: (packetId: string | null) => void;
    markPacket: (packetId: string) => void;
    unmarkPacket: (packetId: string) => void;
    togglePacketMark: (packetId: string) => void;
    addComment: (packetId: string, comment: string) => void;
    
    // Filtering
    setCaptureFilter: (filter: CaptureFilter | null) => void;
    setDisplayFilter: (filter: DisplayFilter) => void;
    applyDisplayFilter: () => void;
    saveFilter: (filter: CaptureFilter) => void;
    deleteFilter: (filterId: string) => void;
    
    // View controls
    setAutoScroll: (enabled: boolean) => void;
    toggleHexView: () => void;
    setHexViewMode: (mode: 'hex' | 'ascii' | 'both') => void;
    setColumnVisibility: (columnId: string, visible: boolean) => void;
    setColumnWidth: (columnId: string, width: number) => void;
    toggleLayerExpanded: (layerKey: string) => void;
    setTimeFormat: (format: 'absolute' | 'relative' | 'delta') => void;
    
    // Statistics
    updateStatistics: () => void;
    getTopTalkers: (limit: number) => { address: string; packets: number; bytes: number }[];
    
    // Utility
    getSelectedPacket: () => CapturedPacketDetail | null;
    exportPackets: (format: 'json' | 'csv' | 'pcap') => string;
    importPackets: (data: string, format: 'json') => void;
}

// Default columns
const DEFAULT_COLUMNS: PacketListColumn[] = [
    { id: 'number', name: 'No.', width: 60, visible: true, sortable: true },
    { id: 'time', name: 'Time', width: 100, visible: true, sortable: true },
    { id: 'source', name: 'Source', width: 150, visible: true, sortable: true },
    { id: 'destination', name: 'Destination', width: 150, visible: true, sortable: true },
    { id: 'protocol', name: 'Protocol', width: 80, visible: true, sortable: true },
    { id: 'length', name: 'Length', width: 70, visible: true, sortable: true },
    { id: 'info', name: 'Info', width: 400, visible: true, sortable: false },
];

// Protocol colors (Wireshark-like)
const DEFAULT_COLOR_RULES: { protocol: CaptureProtocol; color: string }[] = [
    { protocol: 'tcp', color: '#e6ffe6' },      // Light green
    { protocol: 'udp', color: '#d9e6ff' },      // Light blue
    { protocol: 'icmp', color: '#ffe6ff' },     // Light pink
    { protocol: 'arp', color: '#fff0d9' },      // Light orange
    { protocol: 'dns', color: '#d9f2ff' },      // Light cyan
    { protocol: 'http', color: '#e6ffe6' },     // Light green
    { protocol: 'https', color: '#e6f0e6' },    // Lighter green
    { protocol: 'ssh', color: '#f0e6ff' },      // Light purple
    { protocol: 'esp', color: '#ffffcc' },      // Light yellow
    { protocol: 'ah', color: '#ffffcc' },       // Light yellow
    { protocol: 'isakmp', color: '#ffffcc' },   // Light yellow
];

// Initial statistics
const INITIAL_STATISTICS: CaptureStatistics = {
    totalPackets: 0,
    totalBytes: 0,
    startTime: null,
    endTime: null,
    duration: 0,
    packetsPerSecond: 0,
    bytesPerSecond: 0,
    protocolCounts: {} as Record<CaptureProtocol, number>,
    topTalkers: [],
};

/**
 * Create the packet capture store
 */
export const usePacketCaptureStore = create<PacketCaptureState & PacketCaptureActions>((set, get) => ({
    // Initial state
    isCapturing: false,
    isPaused: false,
    currentSession: null,
    packets: [],
    filteredPackets: [],
    selectedPacketId: null,
    markedPacketIds: new Set(),
    captureFilter: null,
    displayFilter: {},
    savedFilters: [],
    autoScroll: true,
    showHexView: true,
    hexViewMode: 'both',
    columns: DEFAULT_COLUMNS,
    expandedLayers: new Set(),
    statistics: INITIAL_STATISTICS,
    maxPackets: 10000,
    timeFormat: 'relative',
    colorRules: DEFAULT_COLOR_RULES,

    // Capture control
    startCapture: (interfaceName, filter) => {
        const session: CaptureSession = {
            id: `capture-${Date.now()}`,
            name: interfaceName ? `Capture on ${interfaceName}` : 'New Capture',
            startTime: Date.now(),
            interfaceName,
            filter,
            packetCount: 0,
        };
        
        set({
            isCapturing: true,
            isPaused: false,
            currentSession: session,
            packets: [],
            filteredPackets: [],
            captureFilter: filter ?? null,
            statistics: {
                ...INITIAL_STATISTICS,
                startTime: Date.now(),
            },
        });
    },

    stopCapture: () => {
        set((state) => ({
            isCapturing: false,
            isPaused: false,
            currentSession: state.currentSession
                ? { ...state.currentSession, endTime: Date.now() }
                : null,
            statistics: {
                ...state.statistics,
                endTime: Date.now(),
            },
        }));
        get().updateStatistics();
    },

    pauseCapture: () => {
        set({ isPaused: true });
    },

    resumeCapture: () => {
        set({ isPaused: false });
    },

    clearCapture: () => {
        set({
            packets: [],
            filteredPackets: [],
            selectedPacketId: null,
            markedPacketIds: new Set(),
            statistics: INITIAL_STATISTICS,
            currentSession: null,
        });
    },

    // Packet management
    addPacket: (packet) => {
        set((state) => {
            const maxPackets = state.maxPackets;
            let newPackets = [...state.packets, packet];
            
            // Trim if exceeding max
            if (newPackets.length > maxPackets) {
                newPackets = newPackets.slice(-maxPackets);
            }
            
            // Apply display filter
            const matchesFilter = filterPacket(packet, state.displayFilter);
            const newFiltered = matchesFilter
                ? [...state.filteredPackets, packet].slice(-maxPackets)
                : state.filteredPackets;
            
            // Update session
            const newSession = state.currentSession
                ? { ...state.currentSession, packetCount: newPackets.length }
                : null;
            
            return {
                packets: newPackets,
                filteredPackets: newFiltered,
                currentSession: newSession,
            };
        });
    },

    addPackets: (packets) => {
        set((state) => {
            const maxPackets = state.maxPackets;
            let newPackets = [...state.packets, ...packets];
            
            if (newPackets.length > maxPackets) {
                newPackets = newPackets.slice(-maxPackets);
            }
            
            const newFiltered = newPackets.filter((p) =>
                filterPacket(p, state.displayFilter)
            );
            
            return {
                packets: newPackets,
                filteredPackets: newFiltered,
            };
        });
        get().updateStatistics();
    },

    selectPacket: (packetId) => {
        set({ selectedPacketId: packetId });
    },

    markPacket: (packetId) => {
        set((state) => {
            const newMarked = new Set(state.markedPacketIds);
            newMarked.add(packetId);
            
            // Update packet
            const newPackets = state.packets.map((p) =>
                p.id === packetId ? { ...p, isMarked: true } : p
            );
            
            return { markedPacketIds: newMarked, packets: newPackets };
        });
    },

    unmarkPacket: (packetId) => {
        set((state) => {
            const newMarked = new Set(state.markedPacketIds);
            newMarked.delete(packetId);
            
            const newPackets = state.packets.map((p) =>
                p.id === packetId ? { ...p, isMarked: false } : p
            );
            
            return { markedPacketIds: newMarked, packets: newPackets };
        });
    },

    togglePacketMark: (packetId) => {
        const state = get();
        if (state.markedPacketIds.has(packetId)) {
            get().unmarkPacket(packetId);
        } else {
            get().markPacket(packetId);
        }
    },

    addComment: (packetId, comment) => {
        set((state) => ({
            packets: state.packets.map((p) =>
                p.id === packetId ? { ...p, comment } : p
            ),
        }));
    },

    // Filtering
    setCaptureFilter: (filter) => {
        set({ captureFilter: filter });
    },

    setDisplayFilter: (filter) => {
        set({ displayFilter: filter });
        get().applyDisplayFilter();
    },

    applyDisplayFilter: () => {
        set((state) => ({
            filteredPackets: state.packets.filter((p) =>
                filterPacket(p, state.displayFilter)
            ),
        }));
    },

    saveFilter: (filter) => {
        set((state) => ({
            savedFilters: [...state.savedFilters, filter],
        }));
    },

    deleteFilter: (filterId) => {
        set((state) => ({
            savedFilters: state.savedFilters.filter((f) => f.id !== filterId),
        }));
    },

    // View controls
    setAutoScroll: (enabled) => {
        set({ autoScroll: enabled });
    },

    toggleHexView: () => {
        set((state) => ({ showHexView: !state.showHexView }));
    },

    setHexViewMode: (mode) => {
        set({ hexViewMode: mode });
    },

    setColumnVisibility: (columnId, visible) => {
        set((state) => ({
            columns: state.columns.map((c) =>
                c.id === columnId ? { ...c, visible } : c
            ),
        }));
    },

    setColumnWidth: (columnId, width) => {
        set((state) => ({
            columns: state.columns.map((c) =>
                c.id === columnId ? { ...c, width } : c
            ),
        }));
    },

    toggleLayerExpanded: (layerKey) => {
        set((state) => {
            const newExpanded = new Set(state.expandedLayers);
            if (newExpanded.has(layerKey)) {
                newExpanded.delete(layerKey);
            } else {
                newExpanded.add(layerKey);
            }
            return { expandedLayers: newExpanded };
        });
    },

    setTimeFormat: (format) => {
        set({ timeFormat: format });
    },

    // Statistics
    updateStatistics: () => {
        set((state) => {
            const packets = state.packets;
            if (packets.length === 0) {
                return { statistics: INITIAL_STATISTICS };
            }
            
            const totalBytes = packets.reduce((sum, p) => sum + p.length, 0);
            const startTime = state.statistics.startTime ?? packets[0].timestamp;
            const endTime = packets[packets.length - 1].timestamp;
            const duration = (endTime - startTime) / 1000;
            
            // Count protocols
            const protocolCounts: Record<string, number> = {};
            const addressStats: Record<string, { packets: number; bytes: number }> = {};
            
            for (const packet of packets) {
                // Protocol counts
                protocolCounts[packet.protocol] = (protocolCounts[packet.protocol] || 0) + 1;
                
                // Address stats
                if (!addressStats[packet.sourceAddress]) {
                    addressStats[packet.sourceAddress] = { packets: 0, bytes: 0 };
                }
                addressStats[packet.sourceAddress].packets++;
                addressStats[packet.sourceAddress].bytes += packet.length;
            }
            
            // Top talkers
            const topTalkers = Object.entries(addressStats)
                .map(([address, stats]) => ({ address, ...stats }))
                .sort((a, b) => b.packets - a.packets)
                .slice(0, 10);
            
            return {
                statistics: {
                    totalPackets: packets.length,
                    totalBytes,
                    startTime,
                    endTime,
                    duration,
                    packetsPerSecond: duration > 0 ? packets.length / duration : 0,
                    bytesPerSecond: duration > 0 ? totalBytes / duration : 0,
                    protocolCounts: protocolCounts as Record<CaptureProtocol, number>,
                    topTalkers,
                },
            };
        });
    },

    getTopTalkers: (limit) => {
        return get().statistics.topTalkers.slice(0, limit);
    },

    // Utility
    getSelectedPacket: () => {
        const state = get();
        if (!state.selectedPacketId) return null;
        return state.packets.find((p) => p.id === state.selectedPacketId) ?? null;
    },

    exportPackets: (format) => {
        const packets = get().packets;
        
        switch (format) {
            case 'json':
                return JSON.stringify(packets, null, 2);
            
            case 'csv': {
                const headers = 'Number,Time,Source,Destination,Protocol,Length,Info\n';
                const rows = packets.map((p) =>
                    `${p.number},${p.timestamp},${p.sourceAddress},${p.destinationAddress},${p.protocol},${p.length},"${p.info}"`
                ).join('\n');
                return headers + rows;
            }
            
            case 'pcap':
                // PCAP format would require binary handling
                // For now, return JSON as fallback
                return JSON.stringify(packets, null, 2);
            
            default:
                return JSON.stringify(packets, null, 2);
        }
    },

    importPackets: (data, format) => {
        if (format === 'json') {
            try {
                const packets = JSON.parse(data) as CapturedPacketDetail[];
                set({ packets, filteredPackets: packets });
                get().updateStatistics();
            } catch (e) {
                console.error('Failed to import packets:', e);
            }
        }
    },
}));

/**
 * Filter packet based on display filter
 */
function filterPacket(packet: CapturedPacketDetail, filter: DisplayFilter): boolean {
    if (!filter || Object.keys(filter).length === 0) {
        return true;
    }
    
    // Protocol filter
    if (filter.protocol && filter.protocol.length > 0) {
        if (!filter.protocol.includes(packet.protocol)) {
            return false;
        }
    }
    
    // Source address filter
    if (filter.sourceAddress) {
        if (!packet.sourceAddress.toLowerCase().includes(filter.sourceAddress.toLowerCase())) {
            return false;
        }
    }
    
    // Destination address filter
    if (filter.destinationAddress) {
        if (!packet.destinationAddress.toLowerCase().includes(filter.destinationAddress.toLowerCase())) {
            return false;
        }
    }
    
    // Port filter (check TCP/UDP ports)
    if (filter.port !== undefined) {
        const hasPort = 
            (packet.tcp && (packet.tcp.sourcePort === filter.port || packet.tcp.destinationPort === filter.port)) ||
            (packet.udp && (packet.udp.sourcePort === filter.port || packet.udp.destinationPort === filter.port));
        
        if (!hasPort) {
            return false;
        }
    }
    
    // Search text (in info field)
    if (filter.searchText) {
        const searchLower = filter.searchText.toLowerCase();
        if (!packet.info.toLowerCase().includes(searchLower)) {
            return false;
        }
    }
    
    // Length filters
    if (filter.minLength !== undefined && packet.length < filter.minLength) {
        return false;
    }
    if (filter.maxLength !== undefined && packet.length > filter.maxLength) {
        return false;
    }
    
    // Marked filter
    if (filter.marked !== undefined && packet.isMarked !== filter.marked) {
        return false;
    }
    
    // Has comment filter
    if (filter.hasComment !== undefined) {
        const hasComment = !!packet.comment && packet.comment.length > 0;
        if (hasComment !== filter.hasComment) {
            return false;
        }
    }
    
    return true;
}

// Selector hooks
export const useIsCapturing = () => usePacketCaptureStore((state) => state.isCapturing);
export const useCapturedPackets = () => usePacketCaptureStore((state) => state.filteredPackets);
export const useSelectedPacket = () => usePacketCaptureStore((state) => state.getSelectedPacket());
export const useCaptureStatistics = () => usePacketCaptureStore((state) => state.statistics);
export const usePacketColumns = () => usePacketCaptureStore((state) => state.columns);
export const useColorRules = () => usePacketCaptureStore((state) => state.colorRules);
