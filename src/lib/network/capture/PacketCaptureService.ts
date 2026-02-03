// PacketCaptureService - Real-time packet capture bridge between simulator and UI
// Handles packet interception, transformation, and event emission

import { v4 as uuidv4 } from 'uuid';
import type { Packet } from '../core/Packet';
import type { 
    EthernetFrame, 
    IPPacket, 
    TCPSegment, 
    UDPDatagram, 
    ICMPPacket, 
    ARPPacket, 
    ESPPacket, 
    AHPacket 
} from '../core/types';
import { parsePacket, resetPacketCounter } from './PacketParser';
import type { CapturedPacketDetail, CaptureProtocol } from '@/store/packetCaptureStore';

/**
 * Packet event types emitted by the capture service
 */
export type PacketEventType = 
    | 'packet-captured'
    | 'packet-transmitted'
    | 'packet-received'
    | 'packet-dropped'
    | 'capture-started'
    | 'capture-stopped'
    | 'capture-cleared';

/**
 * Packet event payload
 */
export interface PacketEvent {
    type: PacketEventType;
    timestamp: number;
    packet?: CapturedPacketDetail;
    rawPacket?: Packet;
    sourceDevice?: string;
    destinationDevice?: string;
    interfaceName?: string;
    reason?: string;
}

/**
 * Capture filter function type
 */
export type CaptureFilterFn = (packet: CapturedPacketDetail) => boolean;

/**
 * Event listener type
 */
export type PacketEventListener = (event: PacketEvent) => void;

/**
 * Capture statistics
 */
export interface CaptureServiceStats {
    totalPackets: number;
    totalBytes: number;
    packetsPerSecond: number;
    bytesPerSecond: number;
    droppedPackets: number;
    filteredPackets: number;
    captureStartTime: number | null;
    lastPacketTime: number | null;
}

/**
 * PacketCaptureService - Manages real-time packet capture
 */
export class PacketCaptureService {
    private static instance: PacketCaptureService | null = null;
    
    private isCapturing: boolean = false;
    private isPaused: boolean = false;
    private capturedPackets: CapturedPacketDetail[] = [];
    private listeners: Map<PacketEventType, Set<PacketEventListener>> = new Map();
    private filter: CaptureFilterFn | null = null;
    private maxPackets: number = 10000;
    private stats: CaptureServiceStats;
    private packetRateWindow: number[] = [];
    private bytesRateWindow: number[] = [];
    
    private constructor() {
        this.stats = this.initStats();
    }
    
    /**
     * Get singleton instance
     */
    static getInstance(): PacketCaptureService {
        if (!PacketCaptureService.instance) {
            PacketCaptureService.instance = new PacketCaptureService();
        }
        return PacketCaptureService.instance;
    }
    
    /**
     * Initialize statistics
     */
    private initStats(): CaptureServiceStats {
        return {
            totalPackets: 0,
            totalBytes: 0,
            packetsPerSecond: 0,
            bytesPerSecond: 0,
            droppedPackets: 0,
            filteredPackets: 0,
            captureStartTime: null,
            lastPacketTime: null,
        };
    }
    
    /**
     * Start packet capture
     */
    start(): void {
        if (this.isCapturing) return;
        
        this.isCapturing = true;
        this.isPaused = false;
        this.stats.captureStartTime = Date.now();
        resetPacketCounter();
        
        this.emit({
            type: 'capture-started',
            timestamp: Date.now(),
        });
    }
    
    /**
     * Stop packet capture
     */
    stop(): void {
        if (!this.isCapturing) return;
        
        this.isCapturing = false;
        this.isPaused = false;
        
        this.emit({
            type: 'capture-stopped',
            timestamp: Date.now(),
        });
    }
    
    /**
     * Pause packet capture
     */
    pause(): void {
        if (!this.isCapturing || this.isPaused) return;
        this.isPaused = true;
    }
    
    /**
     * Resume packet capture
     */
    resume(): void {
        if (!this.isCapturing || !this.isPaused) return;
        this.isPaused = false;
    }
    
    /**
     * Clear captured packets
     */
    clear(): void {
        this.capturedPackets = [];
        this.stats = this.initStats();
        resetPacketCounter();
        
        this.emit({
            type: 'capture-cleared',
            timestamp: Date.now(),
        });
    }
    
    /**
     * Set capture filter
     */
    setFilter(filter: CaptureFilterFn | null): void {
        this.filter = filter;
    }
    
    /**
     * Set maximum packets to retain
     */
    setMaxPackets(max: number): void {
        this.maxPackets = max;
        this.trimPackets();
    }
    
    /**
     * Capture a raw Packet from the simulator
     */
    capturePacket(
        packet: Packet, 
        direction: 'in' | 'out' | 'unknown' = 'unknown',
        sourceDevice?: string,
        destinationDevice?: string,
        interfaceName?: string
    ): CapturedPacketDetail | null {
        if (!this.isCapturing || this.isPaused) return null;
        
        // Transform simulator Packet to CapturedPacketDetail
        const capturedPacket = this.transformPacket(packet, direction, sourceDevice, destinationDevice, interfaceName);
        
        // Apply filter
        if (this.filter && !this.filter(capturedPacket)) {
            this.stats.filteredPackets++;
            return null;
        }
        
        // Add to capture buffer
        this.capturedPackets.push(capturedPacket);
        this.trimPackets();
        
        // Update statistics
        this.updateStats(capturedPacket);
        
        // Emit event
        this.emit({
            type: 'packet-captured',
            timestamp: Date.now(),
            packet: capturedPacket,
            rawPacket: packet,
            sourceDevice,
            destinationDevice,
            interfaceName,
        });
        
        return capturedPacket;
    }
    
    /**
     * Capture a packet from protocol objects directly
     */
    captureFromProtocol(options: {
        ethernet?: { sourceMAC: string; destinationMAC: string; etherType: number };
        ip?: IPPacket;
        tcp?: TCPSegment;
        udp?: UDPDatagram;
        icmp?: ICMPPacket;
        arp?: ARPPacket;
        esp?: ESPPacket;
        ah?: AHPacket;
        direction?: 'in' | 'out' | 'unknown';
        sourceDevice?: string;
        destinationDevice?: string;
        capturedOn?: string;
    }): CapturedPacketDetail | null {
        if (!this.isCapturing || this.isPaused) return null;
        
        const capturedPacket = parsePacket({
            ...options,
            timestamp: Date.now(),
        });
        
        // Apply filter
        if (this.filter && !this.filter(capturedPacket)) {
            this.stats.filteredPackets++;
            return null;
        }
        
        // Add to capture buffer
        this.capturedPackets.push(capturedPacket);
        this.trimPackets();
        
        // Update statistics
        this.updateStats(capturedPacket);
        
        // Emit event
        this.emit({
            type: 'packet-captured',
            timestamp: Date.now(),
            packet: capturedPacket,
            sourceDevice: options.sourceDevice,
            destinationDevice: options.destinationDevice,
        });
        
        return capturedPacket;
    }
    
    /**
     * Record a dropped packet
     */
    recordDropped(
        packet: Packet | CapturedPacketDetail,
        reason: string,
        sourceDevice?: string
    ): void {
        this.stats.droppedPackets++;
        
        this.emit({
            type: 'packet-dropped',
            timestamp: Date.now(),
            packet: 'id' in packet && 'layers' in packet ? packet as CapturedPacketDetail : undefined,
            rawPacket: 'frame' in packet ? packet as Packet : undefined,
            sourceDevice,
            reason,
        });
    }
    
    /**
     * Transform simulator Packet to CapturedPacketDetail
     */
    private transformPacket(
        packet: Packet,
        direction: 'in' | 'out' | 'unknown',
        sourceDevice?: string,
        destinationDevice?: string,
        capturedOn?: string
    ): CapturedPacketDetail {
        const frame = packet.frame;
        const isARP = 'opcode' in frame.payload;
        
        // Extract protocol-specific data
        let ethernet: { sourceMAC: string; destinationMAC: string; etherType: number } | undefined;
        let ip: IPPacket | undefined;
        let tcp: TCPSegment | undefined;
        let udp: UDPDatagram | undefined;
        let icmp: ICMPPacket | undefined;
        let arp: ARPPacket | undefined;
        let esp: ESPPacket | undefined;
        let ah: AHPacket | undefined;
        
        // Ethernet layer
        ethernet = {
            sourceMAC: frame.sourceMAC.toString(),
            destinationMAC: frame.destinationMAC.toString(),
            etherType: frame.etherType,
        };
        
        if (isARP) {
            arp = frame.payload as ARPPacket;
        } else {
            ip = frame.payload as IPPacket;
            
            // Extract transport layer
            switch (ip.protocol) {
                case 1: // ICMP
                    icmp = ip.payload as ICMPPacket;
                    break;
                case 6: // TCP
                    tcp = ip.payload as TCPSegment;
                    break;
                case 17: // UDP
                    udp = ip.payload as UDPDatagram;
                    break;
                case 50: // ESP
                    esp = ip.payload as ESPPacket;
                    break;
                case 51: // AH
                    ah = ip.payload as AHPacket;
                    break;
            }
        }
        
        return parsePacket({
            ethernet,
            ip,
            tcp,
            udp,
            icmp,
            arp,
            esp,
            ah,
            timestamp: packet.timestamp,
            direction,
            sourceDevice,
            destinationDevice,
            capturedOn,
        });
    }
    
    /**
     * Update statistics
     */
    private updateStats(packet: CapturedPacketDetail): void {
        const now = Date.now();
        
        this.stats.totalPackets++;
        this.stats.totalBytes += packet.length;
        this.stats.lastPacketTime = now;
        
        // Update rate calculation (1-second window)
        this.packetRateWindow.push(now);
        this.bytesRateWindow.push(packet.length);
        
        // Remove entries older than 1 second
        const oneSecondAgo = now - 1000;
        while (this.packetRateWindow.length > 0 && this.packetRateWindow[0] < oneSecondAgo) {
            this.packetRateWindow.shift();
            this.bytesRateWindow.shift();
        }
        
        // Calculate rates
        this.stats.packetsPerSecond = this.packetRateWindow.length;
        this.stats.bytesPerSecond = this.bytesRateWindow.reduce((a, b) => a + b, 0);
    }
    
    /**
     * Trim packets to max limit
     */
    private trimPackets(): void {
        if (this.capturedPackets.length > this.maxPackets) {
            this.capturedPackets = this.capturedPackets.slice(-this.maxPackets);
        }
    }
    
    /**
     * Add event listener
     */
    on(type: PacketEventType, listener: PacketEventListener): void {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, new Set());
        }
        this.listeners.get(type)!.add(listener);
    }
    
    /**
     * Remove event listener
     */
    off(type: PacketEventType, listener: PacketEventListener): void {
        this.listeners.get(type)?.delete(listener);
    }
    
    /**
     * Emit event to listeners
     */
    private emit(event: PacketEvent): void {
        const listeners = this.listeners.get(event.type);
        if (listeners) {
            listeners.forEach(listener => {
                try {
                    listener(event);
                } catch (e) {
                    console.error('Error in packet event listener:', e);
                }
            });
        }
        
        // Also emit to 'packet-captured' for all packet-related events
        if (event.type !== 'packet-captured' && event.packet) {
            const captureListeners = this.listeners.get('packet-captured');
            if (captureListeners) {
                captureListeners.forEach(listener => {
                    try {
                        listener(event);
                    } catch (e) {
                        console.error('Error in packet event listener:', e);
                    }
                });
            }
        }
    }
    
    /**
     * Get all captured packets
     */
    getPackets(): CapturedPacketDetail[] {
        return [...this.capturedPackets];
    }
    
    /**
     * Get capture statistics
     */
    getStats(): CaptureServiceStats {
        return { ...this.stats };
    }
    
    /**
     * Get capture status
     */
    getStatus(): { isCapturing: boolean; isPaused: boolean } {
        return {
            isCapturing: this.isCapturing,
            isPaused: this.isPaused,
        };
    }
    
    /**
     * Export packets in various formats
     */
    exportPackets(format: 'json' | 'csv' | 'pcap'): string | Uint8Array {
        switch (format) {
            case 'json':
                return JSON.stringify(this.capturedPackets, null, 2);
            
            case 'csv': {
                const headers = 'No,Time,Source,Destination,Protocol,Length,Info\n';
                const rows = this.capturedPackets.map(p =>
                    `${p.number},${p.timestamp},"${p.sourceAddress}","${p.destinationAddress}",${p.protocol},${p.length},"${p.info.replace(/"/g, '""')}"`
                ).join('\n');
                return headers + rows;
            }
            
            case 'pcap':
                // Return PCAP binary format
                return this.generatePcapData();
            
            default:
                return JSON.stringify(this.capturedPackets, null, 2);
        }
    }
    
    /**
     * Generate PCAP binary data
     */
    private generatePcapData(): Uint8Array {
        // PCAP Global Header
        const globalHeader = new Uint8Array(24);
        const view = new DataView(globalHeader.buffer);
        
        view.setUint32(0, 0xa1b2c3d4, true);  // Magic number
        view.setUint16(4, 2, true);            // Major version
        view.setUint16(6, 4, true);            // Minor version
        view.setInt32(8, 0, true);             // Timezone offset
        view.setUint32(12, 0, true);           // Timestamp accuracy
        view.setUint32(16, 65535, true);       // Snapshot length
        view.setUint32(20, 1, true);           // Link-layer type (Ethernet)
        
        // Calculate total size
        let totalSize = 24;
        for (const packet of this.capturedPackets) {
            totalSize += 16 + packet.rawData.length; // Packet header + data
        }
        
        // Create output buffer
        const output = new Uint8Array(totalSize);
        output.set(globalHeader, 0);
        
        let offset = 24;
        for (const packet of this.capturedPackets) {
            const packetHeader = new Uint8Array(16);
            const headerView = new DataView(packetHeader.buffer);
            
            const timestamp = Math.floor(packet.timestamp / 1000);
            const microseconds = (packet.timestamp % 1000) * 1000;
            
            headerView.setUint32(0, timestamp, true);           // Timestamp seconds
            headerView.setUint32(4, microseconds, true);        // Timestamp microseconds
            headerView.setUint32(8, packet.rawData.length, true); // Captured length
            headerView.setUint32(12, packet.rawData.length, true); // Original length
            
            output.set(packetHeader, offset);
            offset += 16;
            output.set(packet.rawData, offset);
            offset += packet.rawData.length;
        }
        
        return output;
    }
}

/**
 * Hook into simulator for real-time capture
 * Call this when simulator sends/receives packets
 */
export function captureSimulatorPacket(
    packet: Packet,
    direction: 'in' | 'out' | 'unknown',
    sourceDevice?: string,
    destinationDevice?: string,
    interfaceName?: string
): CapturedPacketDetail | null {
    return PacketCaptureService.getInstance().capturePacket(
        packet,
        direction,
        sourceDevice,
        destinationDevice,
        interfaceName
    );
}

/**
 * Export singleton getter
 */
export function getPacketCaptureService(): PacketCaptureService {
    return PacketCaptureService.getInstance();
}

export default PacketCaptureService;
