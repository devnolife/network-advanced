// usePacketCapture - Hook for integrating packet capture with the simulator

import { useCallback, useEffect, useRef } from 'react';
import { usePacketCaptureStore } from '@/store/packetCaptureStore';
import { parsePacket, resetPacketCounter, generateSamplePackets } from '@/lib/network/capture';
import type { ParsePacketOptions } from '@/lib/network/capture';
import type { NetworkSimulator } from '@/lib/network/core/Simulator';
import type { SimulationEvent } from '@/lib/network/core/types';

interface UsePacketCaptureOptions {
    simulator?: NetworkSimulator | null;
    autoStart?: boolean;
    maxPackets?: number;
}

interface UsePacketCaptureReturn {
    startCapture: () => void;
    stopCapture: () => void;
    pauseCapture: () => void;
    resumeCapture: () => void;
    clearCapture: () => void;
    addPacket: (options: ParsePacketOptions) => void;
    loadSamplePackets: (count?: number) => void;
    isCapturing: boolean;
    isPaused: boolean;
    packetCount: number;
}

/**
 * Hook for managing packet capture state and simulator integration
 */
export function usePacketCapture(options: UsePacketCaptureOptions = {}): UsePacketCaptureReturn {
    const { simulator, autoStart = false, maxPackets = 10000 } = options;
    
    const {
        isCapturing,
        isPaused,
        startCapture: storeStartCapture,
        stopCapture: storeStopCapture,
        pauseCapture: storePauseCapture,
        resumeCapture: storeResumeCapture,
        clearCapture: storeClearCapture,
        addPacket: storeAddPacket,
        addPackets,
        packets,
    } = usePacketCaptureStore();
    
    // Track if we've attached listeners
    const listenersAttached = useRef(false);
    
    /**
     * Handle packet event from simulator
     */
    const handlePacketEvent = useCallback((event: SimulationEvent) => {
        if (!isCapturing || isPaused) return;
        
        // Extract packet data from event
        const data = event.data as Record<string, unknown> | undefined;
        if (!data) return;
        
        // Create packet options from event data
        const packetOptions: ParsePacketOptions = {
            timestamp: event.timestamp,
            sourceDevice: event.sourceDevice,
            destinationDevice: event.destinationDevice,
            // Additional packet data would come from the event
        };
        
        // Parse and add the packet
        const capturedPacket = parsePacket(packetOptions);
        storeAddPacket(capturedPacket);
    }, [isCapturing, isPaused, storeAddPacket]);
    
    /**
     * Attach simulator event listeners
     */
    useEffect(() => {
        if (!simulator || listenersAttached.current) return;
        
        simulator.on('packet-transmitted', handlePacketEvent);
        simulator.on('packet-received', handlePacketEvent);
        listenersAttached.current = true;
        
        return () => {
            simulator.off('packet-transmitted', handlePacketEvent);
            simulator.off('packet-received', handlePacketEvent);
            listenersAttached.current = false;
        };
    }, [simulator, handlePacketEvent]);
    
    /**
     * Auto-start capture if requested
     */
    useEffect(() => {
        if (autoStart && !isCapturing) {
            storeStartCapture();
        }
    }, [autoStart, isCapturing, storeStartCapture]);
    
    /**
     * Start packet capture
     */
    const startCapture = useCallback(() => {
        resetPacketCounter();
        storeStartCapture();
    }, [storeStartCapture]);
    
    /**
     * Stop packet capture
     */
    const stopCapture = useCallback(() => {
        storeStopCapture();
    }, [storeStopCapture]);
    
    /**
     * Pause packet capture
     */
    const pauseCapture = useCallback(() => {
        storePauseCapture();
    }, [storePauseCapture]);
    
    /**
     * Resume packet capture
     */
    const resumeCapture = useCallback(() => {
        storeResumeCapture();
    }, [storeResumeCapture]);
    
    /**
     * Clear captured packets
     */
    const clearCapture = useCallback(() => {
        resetPacketCounter();
        storeClearCapture();
    }, [storeClearCapture]);
    
    /**
     * Manually add a packet
     */
    const addPacket = useCallback((packetOptions: ParsePacketOptions) => {
        const capturedPacket = parsePacket(packetOptions);
        storeAddPacket(capturedPacket);
    }, [storeAddPacket]);
    
    /**
     * Load sample packets for testing/demo
     */
    const loadSamplePackets = useCallback((count: number = 10) => {
        resetPacketCounter();
        storeClearCapture();
        const samplePackets = generateSamplePackets(count);
        addPackets(samplePackets);
    }, [storeClearCapture, addPackets]);
    
    return {
        startCapture,
        stopCapture,
        pauseCapture,
        resumeCapture,
        clearCapture,
        addPacket,
        loadSamplePackets,
        isCapturing,
        isPaused,
        packetCount: packets.length,
    };
}

export default usePacketCapture;
