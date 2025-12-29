// Event Queue for Simulation Events

import { v4 as uuidv4 } from 'uuid';
import type { SimulationEvent } from './types';

interface QueuedEvent {
    event: SimulationEvent;
    priority: number;
}

export class EventQueue {
    private queue: QueuedEvent[];
    private maxSize: number;

    constructor(maxSize: number = 10000) {
        this.queue = [];
        this.maxSize = maxSize;
    }

    /**
     * Add an event to the priority queue
     */
    enqueue(event: SimulationEvent, priority?: number): void {
        if (this.queue.length >= this.maxSize) {
            console.warn('Event queue is full, dropping oldest event');
            this.queue.shift();
        }

        const queuedEvent: QueuedEvent = {
            event,
            priority: priority ?? event.timestamp,
        };

        // Insert in sorted order (by priority/timestamp)
        let inserted = false;
        for (let i = 0; i < this.queue.length; i++) {
            if (queuedEvent.priority < this.queue[i].priority) {
                this.queue.splice(i, 0, queuedEvent);
                inserted = true;
                break;
            }
        }

        if (!inserted) {
            this.queue.push(queuedEvent);
        }
    }

    /**
     * Remove and return the next event
     */
    dequeue(): SimulationEvent | undefined {
        const queuedEvent = this.queue.shift();
        return queuedEvent?.event;
    }

    /**
     * Peek at the next event without removing it
     */
    peek(): SimulationEvent | undefined {
        return this.queue[0]?.event;
    }

    /**
     * Get all events without removing them
     */
    peekAll(): SimulationEvent[] {
        return this.queue.map(qe => qe.event);
    }

    /**
     * Get events up to a certain timestamp
     */
    getEventsUntil(timestamp: number): SimulationEvent[] {
        const events: SimulationEvent[] = [];
        while (this.queue.length > 0 && this.queue[0].priority <= timestamp) {
            const event = this.dequeue();
            if (event) events.push(event);
        }
        return events;
    }

    /**
     * Clear all events
     */
    clear(): void {
        this.queue = [];
    }

    /**
     * Get queue length
     */
    get length(): number {
        return this.queue.length;
    }

    /**
     * Check if queue is empty
     */
    isEmpty(): boolean {
        return this.queue.length === 0;
    }

    /**
     * Remove events by device ID
     */
    removeByDevice(deviceId: string): number {
        const originalLength = this.queue.length;
        this.queue = this.queue.filter(
            qe => qe.event.sourceDevice !== deviceId && qe.event.destinationDevice !== deviceId
        );
        return originalLength - this.queue.length;
    }

    /**
     * Remove events by type
     */
    removeByType(type: SimulationEvent['type']): number {
        const originalLength = this.queue.length;
        this.queue = this.queue.filter(qe => qe.event.type !== type);
        return originalLength - this.queue.length;
    }
}

// Event Factory for creating simulation events
export class EventFactory {
    static createPacketTransmittedEvent(
        sourceDevice: string,
        destinationDevice: string,
        packetId: string
    ): SimulationEvent {
        return {
            id: uuidv4(),
            timestamp: Date.now(),
            type: 'packet-transmitted',
            sourceDevice,
            destinationDevice,
            data: { packetId },
        };
    }

    static createPacketReceivedEvent(
        sourceDevice: string,
        destinationDevice: string,
        packetId: string
    ): SimulationEvent {
        return {
            id: uuidv4(),
            timestamp: Date.now(),
            type: 'packet-received',
            sourceDevice,
            destinationDevice,
            data: { packetId },
        };
    }

    static createPacketDroppedEvent(
        sourceDevice: string,
        packetId: string,
        reason: string
    ): SimulationEvent {
        return {
            id: uuidv4(),
            timestamp: Date.now(),
            type: 'packet-dropped',
            sourceDevice,
            data: { packetId, reason },
        };
    }

    static createInterfaceUpEvent(deviceId: string, interfaceName: string): SimulationEvent {
        return {
            id: uuidv4(),
            timestamp: Date.now(),
            type: 'interface-up',
            sourceDevice: deviceId,
            data: { interfaceName },
        };
    }

    static createInterfaceDownEvent(deviceId: string, interfaceName: string): SimulationEvent {
        return {
            id: uuidv4(),
            timestamp: Date.now(),
            type: 'interface-down',
            sourceDevice: deviceId,
            data: { interfaceName },
        };
    }

    static createTunnelEstablishedEvent(
        sourceDevice: string,
        destinationDevice: string,
        tunnelId: string
    ): SimulationEvent {
        return {
            id: uuidv4(),
            timestamp: Date.now(),
            type: 'tunnel-established',
            sourceDevice,
            destinationDevice,
            data: { tunnelId },
        };
    }

    static createTunnelDownEvent(
        sourceDevice: string,
        destinationDevice: string,
        tunnelId: string,
        reason: string
    ): SimulationEvent {
        return {
            id: uuidv4(),
            timestamp: Date.now(),
            type: 'tunnel-down',
            sourceDevice,
            destinationDevice,
            data: { tunnelId, reason },
        };
    }

    static createAlertGeneratedEvent(
        sourceDevice: string,
        alertId: string,
        severity: string
    ): SimulationEvent {
        return {
            id: uuidv4(),
            timestamp: Date.now(),
            type: 'alert-generated',
            sourceDevice,
            data: { alertId, severity },
        };
    }

    static createConfigChangedEvent(
        deviceId: string,
        configSection: string,
        changes: Record<string, unknown>
    ): SimulationEvent {
        return {
            id: uuidv4(),
            timestamp: Date.now(),
            type: 'config-changed',
            sourceDevice: deviceId,
            data: { configSection, changes },
        };
    }
}
