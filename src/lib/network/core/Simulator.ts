// Main Network Simulator Class

import { v4 as uuidv4 } from 'uuid';
import { EventQueue, EventFactory } from './EventQueue';
import { Packet, IPv4AddressUtil, MACAddressUtil } from './Packet';
import type {
    SimulationState,
    SimulationStatistics,
    SimulationEvent,
    DeviceState,
    Link,
    DeviceType,
    NetworkInterface,
    RouteEntry,
    IPv4Address,
} from './types';

// Base Device Interface
export interface NetworkDevice {
    id: string;
    type: DeviceType;
    name: string;
    hostname: string;
    status: 'online' | 'offline' | 'booting';
    position: { x: number; y: number };
    interfaces: Map<string, NetworkInterface>;

    // Core methods
    initialize(): void;
    shutdown(): void;
    executeCommand(command: string): { success: boolean; output: string; error?: string };
    processPacket(packet: Packet, inInterface: string): void;
    getConfig(): Record<string, unknown>;
    setConfig(config: Record<string, unknown>): void;
}

// Simulation Configuration
export interface SimulatorConfig {
    maxSimulationTime: number; // ms
    packetQueueSize: number;
    tickInterval: number; // ms
    defaultLatency: number; // ms
    defaultBandwidth: number; // Mbps
    defaultPacketLoss: number; // percentage
}

const DEFAULT_CONFIG: SimulatorConfig = {
    maxSimulationTime: 3600000, // 1 hour
    packetQueueSize: 10000,
    tickInterval: 10, // 10ms ticks
    defaultLatency: 1,
    defaultBandwidth: 1000,
    defaultPacketLoss: 0,
};

export class NetworkSimulator {
    private id: string;
    private name: string;
    private config: SimulatorConfig;
    private status: 'running' | 'paused' | 'stopped';
    private startTime: number;
    private currentTime: number;
    private devices: Map<string, NetworkDevice>;
    private links: Map<string, Link>;
    private eventQueue: EventQueue;
    private packetQueue: Packet[];
    private capturedPackets: Packet[];
    private statistics: SimulationStatistics;
    private eventListeners: Map<string, ((event: SimulationEvent) => void)[]>;
    private tickTimer: NodeJS.Timeout | null;

    constructor(name: string = 'Network Simulation', config: Partial<SimulatorConfig> = {}) {
        this.id = uuidv4();
        this.name = name;
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.status = 'stopped';
        this.startTime = 0;
        this.currentTime = 0;
        this.devices = new Map();
        this.links = new Map();
        this.eventQueue = new EventQueue(this.config.packetQueueSize);
        this.packetQueue = [];
        this.capturedPackets = [];
        this.statistics = this.initializeStatistics();
        this.eventListeners = new Map();
        this.tickTimer = null;
    }

    private initializeStatistics(): SimulationStatistics {
        return {
            packetsTransmitted: 0,
            packetsReceived: 0,
            packetsDropped: 0,
            bytesTransmitted: 0,
            bytesReceived: 0,
            vpnTunnelsActive: 0,
            firewallRulesEvaluated: 0,
            idsAlertsGenerated: 0,
        };
    }

    // ==================== Simulation Control ====================

    start(): void {
        if (this.status === 'running') return;

        this.status = 'running';
        this.startTime = Date.now();
        this.currentTime = 0;

        // Initialize all devices
        this.devices.forEach(device => {
            if (device.status === 'offline') {
                device.status = 'booting';
                setTimeout(() => {
                    device.initialize();
                    device.status = 'online';
                }, 500);
            }
        });

        // Start simulation loop
        this.tickTimer = setInterval(() => {
            this.tick();
        }, this.config.tickInterval);

        this.emit('simulation-started', { timestamp: this.startTime });
    }

    pause(): void {
        if (this.status !== 'running') return;

        this.status = 'paused';

        if (this.tickTimer) {
            clearInterval(this.tickTimer);
            this.tickTimer = null;
        }

        this.emit('simulation-paused', { timestamp: Date.now() });
    }

    resume(): void {
        if (this.status !== 'paused') return;

        this.status = 'running';

        this.tickTimer = setInterval(() => {
            this.tick();
        }, this.config.tickInterval);

        this.emit('simulation-resumed', { timestamp: Date.now() });
    }

    stop(): void {
        this.status = 'stopped';

        if (this.tickTimer) {
            clearInterval(this.tickTimer);
            this.tickTimer = null;
        }

        // Shutdown all devices
        this.devices.forEach(device => {
            device.shutdown();
            device.status = 'offline';
        });

        this.emit('simulation-stopped', { timestamp: Date.now() });
    }

    reset(): void {
        this.stop();
        this.currentTime = 0;
        this.eventQueue.clear();
        this.packetQueue = [];
        this.capturedPackets = [];
        this.statistics = this.initializeStatistics();

        // Reset device configurations
        this.devices.forEach(device => {
            device.initialize();
        });

        this.emit('simulation-reset', { timestamp: Date.now() });
    }

    private tick(): void {
        if (this.status !== 'running') return;

        this.currentTime += this.config.tickInterval;

        // Check max simulation time
        if (this.currentTime >= this.config.maxSimulationTime) {
            this.stop();
            return;
        }

        // Process events up to current time
        const events = this.eventQueue.getEventsUntil(this.currentTime);
        events.forEach(event => this.processEvent(event));

        // Process packet queue
        this.processPacketQueue();
    }

    private processEvent(event: SimulationEvent): void {
        // Notify listeners
        const listeners = this.eventListeners.get(event.type) || [];
        listeners.forEach(listener => listener(event));

        // Update statistics based on event type
        switch (event.type) {
            case 'packet-transmitted':
                this.statistics.packetsTransmitted++;
                break;
            case 'packet-received':
                this.statistics.packetsReceived++;
                break;
            case 'packet-dropped':
                this.statistics.packetsDropped++;
                break;
            case 'alert-generated':
                this.statistics.idsAlertsGenerated++;
                break;
        }
    }

    private processPacketQueue(): void {
        const packetsToProcess = [...this.packetQueue];
        this.packetQueue = [];

        packetsToProcess.forEach(packet => {
            if (packet.dropped) return;

            const lastHop = packet.hops[packet.hops.length - 1];
            const sourceDevice = this.devices.get(lastHop);

            if (!sourceDevice) {
                packet.drop('Source device not found');
                return;
            }

            // Find the link to forward the packet
            // This is simplified - in reality, we'd use routing tables
        });
    }

    // ==================== Device Management ====================

    addDevice(device: NetworkDevice): void {
        this.devices.set(device.id, device);
        this.emit('device-added', { deviceId: device.id, type: device.type });
    }

    removeDevice(deviceId: string): void {
        const device = this.devices.get(deviceId);
        if (!device) return;

        // Remove associated links
        this.links.forEach((link, linkId) => {
            if (link.sourceDevice === deviceId || link.destinationDevice === deviceId) {
                this.links.delete(linkId);
            }
        });

        // Remove events for this device
        this.eventQueue.removeByDevice(deviceId);

        device.shutdown();
        this.devices.delete(deviceId);

        this.emit('device-removed', { deviceId });
    }

    getDevice(deviceId: string): NetworkDevice | undefined {
        return this.devices.get(deviceId);
    }

    getAllDevices(): NetworkDevice[] {
        return Array.from(this.devices.values());
    }

    // ==================== Link Management ====================

    addLink(
        sourceDevice: string,
        sourceInterface: string,
        destinationDevice: string,
        destinationInterface: string,
        options: Partial<Pick<Link, 'bandwidth' | 'latency' | 'packetLoss'>> = {}
    ): Link {
        const linkId = uuidv4();
        const link: Link = {
            id: linkId,
            sourceDevice,
            sourceInterface,
            destinationDevice,
            destinationInterface,
            status: 'up',
            bandwidth: options.bandwidth ?? this.config.defaultBandwidth,
            latency: options.latency ?? this.config.defaultLatency,
            packetLoss: options.packetLoss ?? this.config.defaultPacketLoss,
        };

        this.links.set(linkId, link);

        // Update device interfaces
        const srcDevice = this.devices.get(sourceDevice);
        const dstDevice = this.devices.get(destinationDevice);

        if (srcDevice) {
            const srcInt = srcDevice.interfaces.get(sourceInterface);
            if (srcInt) {
                srcInt.connectedTo = destinationDevice;
                srcInt.connectedInterface = destinationInterface;
                srcInt.status = 'up';
            }
        }

        if (dstDevice) {
            const dstInt = dstDevice.interfaces.get(destinationInterface);
            if (dstInt) {
                dstInt.connectedTo = sourceDevice;
                dstInt.connectedInterface = sourceInterface;
                dstInt.status = 'up';
            }
        }

        this.emit('link-added', { linkId, sourceDevice, destinationDevice });
        return link;
    }

    removeLink(linkId: string): void {
        const link = this.links.get(linkId);
        if (!link) return;

        // Update device interfaces
        const srcDevice = this.devices.get(link.sourceDevice);
        const dstDevice = this.devices.get(link.destinationDevice);

        if (srcDevice) {
            const srcInt = srcDevice.interfaces.get(link.sourceInterface);
            if (srcInt) {
                srcInt.connectedTo = undefined;
                srcInt.connectedInterface = undefined;
                srcInt.status = 'down';
            }
        }

        if (dstDevice) {
            const dstInt = dstDevice.interfaces.get(link.destinationInterface);
            if (dstInt) {
                dstInt.connectedTo = undefined;
                dstInt.connectedInterface = undefined;
                dstInt.status = 'down';
            }
        }

        this.links.delete(linkId);
        this.emit('link-removed', { linkId });
    }

    setLinkStatus(linkId: string, status: 'up' | 'down'): void {
        const link = this.links.get(linkId);
        if (!link) return;

        link.status = status;

        const event = status === 'up'
            ? EventFactory.createInterfaceUpEvent(link.sourceDevice, link.sourceInterface)
            : EventFactory.createInterfaceDownEvent(link.sourceDevice, link.sourceInterface);

        this.eventQueue.enqueue(event);
    }

    // ==================== Packet Operations ====================

    sendPacket(packet: Packet, fromDevice: string): void {
        packet.addHop(fromDevice);
        this.packetQueue.push(packet);
        this.capturedPackets.push(packet);

        this.statistics.bytesTransmitted += packet.getSize();

        const event = EventFactory.createPacketTransmittedEvent(
            fromDevice,
            '', // Will be determined during forwarding
            packet.id
        );
        this.eventQueue.enqueue(event);
    }

    forwardPacket(packet: Packet, fromDevice: string, toDevice: string, via: string): void {
        const link = Array.from(this.links.values()).find(
            l =>
                (l.sourceDevice === fromDevice && l.destinationDevice === toDevice) ||
                (l.sourceDevice === toDevice && l.destinationDevice === fromDevice)
        );

        if (!link || link.status === 'down') {
            packet.drop('No route to destination');
            this.statistics.packetsDropped++;
            return;
        }

        // Simulate packet loss
        if (Math.random() * 100 < link.packetLoss) {
            packet.drop('Packet loss on link');
            this.statistics.packetsDropped++;
            return;
        }

        // Add latency delay
        setTimeout(() => {
            packet.addHop(toDevice);
            const destDevice = this.devices.get(toDevice);
            if (destDevice) {
                destDevice.processPacket(packet, via);
                this.statistics.bytesReceived += packet.getSize();

                const event = EventFactory.createPacketReceivedEvent(fromDevice, toDevice, packet.id);
                this.eventQueue.enqueue(event);
            }
        }, link.latency);
    }

    getCapturedPackets(filter?: {
        protocol?: string;
        sourceIP?: string;
        destinationIP?: string;
        sourcePort?: number;
        destinationPort?: number;
    }): Packet[] {
        if (!filter) return this.capturedPackets;

        return this.capturedPackets.filter(packet => {
            if (filter.protocol && packet.getProtocolType() !== filter.protocol) return false;
            // Add more filtering logic as needed
            return true;
        });
    }

    clearCapturedPackets(): void {
        this.capturedPackets = [];
    }

    // ==================== State Management ====================

    getState(): SimulationState {
        const deviceStates = new Map<string, DeviceState>();

        this.devices.forEach((device, id) => {
            deviceStates.set(id, {
                id: device.id,
                type: device.type,
                name: device.name,
                hostname: device.hostname,
                position: device.position,
                interfaces: device.interfaces,
                config: device.getConfig(),
                status: device.status,
            });
        });

        return {
            id: this.id,
            name: this.name,
            status: this.status,
            startTime: this.startTime,
            currentTime: this.currentTime,
            devices: deviceStates,
            links: Array.from(this.links.values()),
            events: this.eventQueue.peekAll(),
            statistics: { ...this.statistics },
        };
    }

    loadState(state: SimulationState): void {
        this.id = state.id;
        this.name = state.name;
        this.status = state.status;
        this.startTime = state.startTime;
        this.currentTime = state.currentTime;
        // Additional state loading logic...
    }

    getStatistics(): SimulationStatistics {
        return { ...this.statistics };
    }

    // ==================== Event System ====================

    on(eventType: string, listener: (event: SimulationEvent) => void): void {
        const listeners = this.eventListeners.get(eventType) || [];
        listeners.push(listener);
        this.eventListeners.set(eventType, listeners);
    }

    off(eventType: string, listener: (event: SimulationEvent) => void): void {
        const listeners = this.eventListeners.get(eventType) || [];
        const index = listeners.indexOf(listener);
        if (index !== -1) {
            listeners.splice(index, 1);
        }
    }

    private emit(eventType: string, data: Record<string, unknown>): void {
        const event: SimulationEvent = {
            id: uuidv4(),
            timestamp: this.currentTime,
            type: eventType as SimulationEvent['type'],
            sourceDevice: '',
            data,
        };

        const listeners = this.eventListeners.get(eventType) || [];
        listeners.forEach(listener => listener(event));
    }

    // ==================== Utilities ====================

    findRouteTo(sourceDevice: string, destinationIP: IPv4Address): {
        nextHop: string;
        interface: string;
    } | null {
        const device = this.devices.get(sourceDevice);
        if (!device) return null;

        // This is a simplified implementation
        // In a real router, this would check the routing table
        const config = device.getConfig();
        const routes = (config.routes as RouteEntry[]) || [];

        const destAddr = new IPv4AddressUtil(destinationIP.octets);

        for (const route of routes) {
            const network = new IPv4AddressUtil(route.destination.octets);
            const mask = new IPv4AddressUtil(route.mask.octets);

            if (destAddr.isInSubnet(network, mask)) {
                const nextHopIP = route.nextHop
                    ? new IPv4AddressUtil(route.nextHop.octets).toString()
                    : 'directly connected';

                // Find device by next hop IP
                for (const [deviceId, dev] of this.devices) {
                    for (const [, intf] of dev.interfaces) {
                        if (intf.ipAddress && new IPv4AddressUtil(intf.ipAddress.octets).toString() === nextHopIP) {
                            return { nextHop: deviceId, interface: route.interface };
                        }
                    }
                }
            }
        }

        return null;
    }

    executeCommand(deviceId: string, command: string): { success: boolean; output: string; error?: string } {
        const device = this.devices.get(deviceId);
        if (!device) {
            return { success: false, output: '', error: 'Device not found' };
        }

        if (device.status !== 'online') {
            return { success: false, output: '', error: 'Device is not online' };
        }

        return device.executeCommand(command);
    }
}

// Export singleton instance for global access
export const createSimulator = (name?: string, config?: Partial<SimulatorConfig>): NetworkSimulator => {
    return new NetworkSimulator(name, config);
};
