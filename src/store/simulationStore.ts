// Simulation State Store using Zustand

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    SimulationState,
    SimulationStatistics,
    DeviceState,
    Link,
    SimulationEvent,
} from '@/lib/network/core/types';
import { Packet } from '@/lib/network/core/Packet';

interface Device {
    id: string;
    type: 'router' | 'switch' | 'firewall' | 'pc' | 'ids' | 'server';
    name: string;
    hostname: string;
    x: number;
    y: number;
    status: 'online' | 'offline' | 'booting';
    interfaces: {
        name: string;
        ip?: string;
        mask?: string;
        status: 'up' | 'down' | 'admin-down';
    }[];
}

interface Connection {
    id: string;
    sourceDevice: string;
    sourceInterface: string;
    targetDevice: string;
    targetInterface: string;
    status: 'up' | 'down';
}

interface CapturedPacket {
    id: string;
    timestamp: number;
    sourceIP: string;
    destinationIP: string;
    protocol: string;
    info: string;
    size: number;
    raw?: Packet;
}

interface LabProgress {
    labId: string;
    completedTasks: string[];
    score: number;
    hintsUsed: string[];
    startedAt: number;
    lastUpdated: number;
}

interface SimulationStore {
    // Simulation Status
    status: 'stopped' | 'running' | 'paused';
    currentTime: number;

    // Devices & Topology
    devices: Device[];
    connections: Connection[];
    selectedDeviceId: string | null;

    // Packet Capture
    capturedPackets: CapturedPacket[];
    isCapturing: boolean;
    captureFilter: string;

    // Statistics
    statistics: SimulationStatistics;

    // Lab Progress
    currentLabId: string | null;
    labProgress: Record<string, LabProgress>;

    // Events
    events: SimulationEvent[];

    // Simulation Actions
    start: () => void;
    pause: () => void;
    stop: () => void;
    reset: () => void;

    // Device Actions
    addDevice: (device: Device) => void;
    removeDevice: (deviceId: string) => void;
    updateDevice: (deviceId: string, updates: Partial<Device>) => void;
    selectDevice: (deviceId: string | null) => void;
    moveDevice: (deviceId: string, x: number, y: number) => void;

    // Connection Actions
    addConnection: (connection: Omit<Connection, 'id'>) => void;
    removeConnection: (connectionId: string) => void;
    updateConnectionStatus: (connectionId: string, status: 'up' | 'down') => void;

    // Packet Capture Actions
    startCapture: () => void;
    stopCapture: () => void;
    clearCapture: () => void;
    addPacket: (packet: CapturedPacket) => void;
    setCaptureFilter: (filter: string) => void;

    // Lab Actions
    setCurrentLab: (labId: string) => void;
    completeTask: (labId: string, taskId: string, points: number) => void;
    useHint: (labId: string, hintId: string, cost: number) => void;
    getLabProgress: (labId: string) => LabProgress | undefined;

    // Utility Actions
    loadTopology: (devices: Device[], connections: Connection[]) => void;
    saveState: () => SimulationState;
    loadState: (state: SimulationState) => void;
}

export const useSimulationStore = create<SimulationStore>()(
    persist(
        (set, get) => ({
            // Initial State
            status: 'stopped',
            currentTime: 0,
            devices: [],
            connections: [],
            selectedDeviceId: null,
            capturedPackets: [],
            isCapturing: false,
            captureFilter: '',
            statistics: {
                packetsTransmitted: 0,
                packetsReceived: 0,
                packetsDropped: 0,
                bytesTransmitted: 0,
                bytesReceived: 0,
                vpnTunnelsActive: 0,
                firewallRulesEvaluated: 0,
                idsAlertsGenerated: 0,
            },
            currentLabId: null,
            labProgress: {},
            events: [],

            // Simulation Actions
            start: () => {
                set({ status: 'running' });
            },

            pause: () => {
                set({ status: 'paused' });
            },

            stop: () => {
                set({ status: 'stopped', currentTime: 0 });
            },

            reset: () => {
                set({
                    status: 'stopped',
                    currentTime: 0,
                    capturedPackets: [],
                    statistics: {
                        packetsTransmitted: 0,
                        packetsReceived: 0,
                        packetsDropped: 0,
                        bytesTransmitted: 0,
                        bytesReceived: 0,
                        vpnTunnelsActive: 0,
                        firewallRulesEvaluated: 0,
                        idsAlertsGenerated: 0,
                    },
                    events: [],
                });
            },

            // Device Actions
            addDevice: (device) => {
                set((state) => ({
                    devices: [...state.devices, device],
                }));
            },

            removeDevice: (deviceId) => {
                set((state) => ({
                    devices: state.devices.filter((d) => d.id !== deviceId),
                    connections: state.connections.filter(
                        (c) => c.sourceDevice !== deviceId && c.targetDevice !== deviceId
                    ),
                    selectedDeviceId: state.selectedDeviceId === deviceId ? null : state.selectedDeviceId,
                }));
            },

            updateDevice: (deviceId, updates) => {
                set((state) => ({
                    devices: state.devices.map((d) =>
                        d.id === deviceId ? { ...d, ...updates } : d
                    ),
                }));
            },

            selectDevice: (deviceId) => {
                set({ selectedDeviceId: deviceId });
            },

            moveDevice: (deviceId, x, y) => {
                set((state) => ({
                    devices: state.devices.map((d) =>
                        d.id === deviceId ? { ...d, x, y } : d
                    ),
                }));
            },

            // Connection Actions
            addConnection: (connection) => {
                const id = `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                set((state) => ({
                    connections: [...state.connections, { ...connection, id }],
                }));
            },

            removeConnection: (connectionId) => {
                set((state) => ({
                    connections: state.connections.filter((c) => c.id !== connectionId),
                }));
            },

            updateConnectionStatus: (connectionId, status) => {
                set((state) => ({
                    connections: state.connections.map((c) =>
                        c.id === connectionId ? { ...c, status } : c
                    ),
                }));
            },

            // Packet Capture Actions
            startCapture: () => {
                set({ isCapturing: true });
            },

            stopCapture: () => {
                set({ isCapturing: false });
            },

            clearCapture: () => {
                set({ capturedPackets: [] });
            },

            addPacket: (packet) => {
                set((state) => {
                    // Keep only last 1000 packets
                    const newPackets = [...state.capturedPackets, packet].slice(-1000);
                    return {
                        capturedPackets: newPackets,
                        statistics: {
                            ...state.statistics,
                            packetsTransmitted: state.statistics.packetsTransmitted + 1,
                            bytesTransmitted: state.statistics.bytesTransmitted + packet.size,
                        },
                    };
                });
            },

            setCaptureFilter: (filter) => {
                set({ captureFilter: filter });
            },

            // Lab Actions
            setCurrentLab: (labId) => {
                const state = get();
                if (!state.labProgress[labId]) {
                    set((state) => ({
                        currentLabId: labId,
                        labProgress: {
                            ...state.labProgress,
                            [labId]: {
                                labId,
                                completedTasks: [],
                                score: 0,
                                hintsUsed: [],
                                startedAt: Date.now(),
                                lastUpdated: Date.now(),
                            },
                        },
                    }));
                } else {
                    set({ currentLabId: labId });
                }
            },

            completeTask: (labId, taskId, points) => {
                set((state) => {
                    const progress = state.labProgress[labId];
                    if (!progress || progress.completedTasks.includes(taskId)) {
                        return state;
                    }
                    return {
                        labProgress: {
                            ...state.labProgress,
                            [labId]: {
                                ...progress,
                                completedTasks: [...progress.completedTasks, taskId],
                                score: progress.score + points,
                                lastUpdated: Date.now(),
                            },
                        },
                    };
                });
            },

            useHint: (labId, hintId, cost) => {
                set((state) => {
                    const progress = state.labProgress[labId];
                    if (!progress || progress.hintsUsed.includes(hintId)) {
                        return state;
                    }
                    return {
                        labProgress: {
                            ...state.labProgress,
                            [labId]: {
                                ...progress,
                                hintsUsed: [...progress.hintsUsed, hintId],
                                score: Math.max(0, progress.score - cost),
                                lastUpdated: Date.now(),
                            },
                        },
                    };
                });
            },

            getLabProgress: (labId) => {
                return get().labProgress[labId];
            },

            // Utility Actions
            loadTopology: (devices, connections) => {
                set({ devices, connections });
            },

            saveState: () => {
                const state = get();
                return {
                    id: `state-${Date.now()}`,
                    name: 'Saved State',
                    status: state.status,
                    startTime: 0,
                    currentTime: state.currentTime,
                    devices: new Map(
                        state.devices.map((d) => [
                            d.id,
                            {
                                id: d.id,
                                type: d.type,
                                name: d.name,
                                hostname: d.hostname,
                                position: { x: d.x, y: d.y },
                                interfaces: new Map(),
                                config: {},
                                status: d.status,
                            },
                        ])
                    ),
                    links: state.connections.map((c) => ({
                        id: c.id,
                        sourceDevice: c.sourceDevice,
                        sourceInterface: c.sourceInterface,
                        destinationDevice: c.targetDevice,
                        destinationInterface: c.targetInterface,
                        status: c.status,
                        bandwidth: 1000,
                        latency: 1,
                        packetLoss: 0,
                    })),
                    events: state.events,
                    statistics: state.statistics,
                };
            },

            loadState: (simulationState) => {
                const devices: Device[] = [];
                simulationState.devices.forEach((deviceState) => {
                    devices.push({
                        id: deviceState.id,
                        type: deviceState.type,
                        name: deviceState.name,
                        hostname: deviceState.hostname,
                        x: deviceState.position.x,
                        y: deviceState.position.y,
                        status: deviceState.status,
                        interfaces: [],
                    });
                });

                const connections: Connection[] = simulationState.links.map((link) => ({
                    id: link.id,
                    sourceDevice: link.sourceDevice,
                    sourceInterface: link.sourceInterface,
                    targetDevice: link.destinationDevice,
                    targetInterface: link.destinationInterface,
                    status: link.status,
                }));

                set({
                    status: simulationState.status,
                    currentTime: simulationState.currentTime,
                    devices,
                    connections,
                    statistics: simulationState.statistics,
                    events: simulationState.events,
                });
            },
        }),
        {
            name: 'netseclab-storage',
            partialize: (state) => ({
                labProgress: state.labProgress,
            }),
        }
    )
);

// Selector hooks for specific state slices
export const useSimulationStatus = () => useSimulationStore((state) => state.status);
export const useDevices = () => useSimulationStore((state) => state.devices);
export const useConnections = () => useSimulationStore((state) => state.connections);
export const useSelectedDevice = () => {
    const devices = useSimulationStore((state) => state.devices);
    const selectedId = useSimulationStore((state) => state.selectedDeviceId);
    return devices.find((d) => d.id === selectedId);
};
export const useCapturedPackets = () => useSimulationStore((state) => state.capturedPackets);
export const useStatistics = () => useSimulationStore((state) => state.statistics);
export const useLabProgress = (labId: string) =>
    useSimulationStore((state) => state.labProgress[labId]);
