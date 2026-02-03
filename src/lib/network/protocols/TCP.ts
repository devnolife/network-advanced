// TCP Protocol Implementation
// Implements TCP three-way handshake, connection states, and flow control

import type { IPv4Address, TCPSegment } from '../core/types';
import { IPv4Protocol, IP_PROTOCOLS } from './IP';

/**
 * TCP Connection States (RFC 793)
 */
export enum TCPState {
    CLOSED = 'CLOSED',
    LISTEN = 'LISTEN',
    SYN_SENT = 'SYN_SENT',
    SYN_RECEIVED = 'SYN_RECEIVED',
    ESTABLISHED = 'ESTABLISHED',
    FIN_WAIT_1 = 'FIN_WAIT_1',
    FIN_WAIT_2 = 'FIN_WAIT_2',
    CLOSE_WAIT = 'CLOSE_WAIT',
    CLOSING = 'CLOSING',
    LAST_ACK = 'LAST_ACK',
    TIME_WAIT = 'TIME_WAIT',
}

/**
 * TCP Flags
 */
export const TCP_FLAGS = {
    FIN: 0x01,
    SYN: 0x02,
    RST: 0x04,
    PSH: 0x08,
    ACK: 0x10,
    URG: 0x20,
} as const;

/**
 * Well-known TCP ports
 */
export const TCP_PORTS = {
    FTP_DATA: 20,
    FTP_CONTROL: 21,
    SSH: 22,
    TELNET: 23,
    SMTP: 25,
    DNS: 53,
    HTTP: 80,
    POP3: 110,
    IMAP: 143,
    HTTPS: 443,
    SMTPS: 465,
    IMAPS: 993,
    POP3S: 995,
} as const;

/**
 * TCP Connection tracking
 */
export interface TCPConnection {
    id: string;
    localIP: IPv4Address;
    localPort: number;
    remoteIP: IPv4Address;
    remotePort: number;
    state: TCPState;
    
    // Sequence numbers
    sendSequenceNumber: number;      // SND.NXT - Next sequence number to send
    sendUnacknowledged: number;      // SND.UNA - Oldest unacknowledged sequence
    sendWindow: number;              // SND.WND - Send window size
    initialSendSequence: number;     // ISS - Initial send sequence
    
    // Receive sequence space
    receiveNextExpected: number;     // RCV.NXT - Next sequence number expected
    receiveWindow: number;           // RCV.WND - Receive window size
    initialReceiveSequence: number;  // IRS - Initial receive sequence
    
    // Timers
    retransmissionTimeout: number;   // RTO in ms
    lastActivity: number;            // Timestamp of last activity
    timeWaitTimer?: number;          // TIME_WAIT timer
    
    // Congestion control
    congestionWindow: number;        // cwnd
    slowStartThreshold: number;      // ssthresh
    
    // Statistics
    bytesSent: number;
    bytesReceived: number;
    segmentsSent: number;
    segmentsReceived: number;
    retransmissions: number;
}

/**
 * TCP Protocol handler for segment creation and connection management
 */
export class TCPProtocol {
    private static sequenceCounter = Math.floor(Math.random() * 0xFFFFFFFF);
    
    /**
     * Create a TCP segment
     */
    static createSegment(
        sourcePort: number,
        destinationPort: number,
        options: {
            sequenceNumber?: number;
            acknowledgmentNumber?: number;
            flags?: {
                urg?: boolean;
                ack?: boolean;
                psh?: boolean;
                rst?: boolean;
                syn?: boolean;
                fin?: boolean;
            };
            window?: number;
            urgentPointer?: number;
            data?: Uint8Array;
            mss?: number;           // Maximum Segment Size option
            windowScale?: number;   // Window Scale option
            sackPermitted?: boolean;
        }
    ): TCPSegment {
        const flags = options.flags ?? {};
        const tcpOptions = this.buildOptions({
            mss: options.mss,
            windowScale: options.windowScale,
            sackPermitted: options.sackPermitted,
        });
        
        // Data offset = header length in 32-bit words (minimum 5, max 15)
        const dataOffset = Math.ceil((20 + (tcpOptions?.length ?? 0)) / 4);
        
        const segment: TCPSegment = {
            sourcePort,
            destinationPort,
            sequenceNumber: options.sequenceNumber ?? this.generateISN(),
            acknowledgmentNumber: options.acknowledgmentNumber ?? 0,
            dataOffset,
            flags: {
                urg: flags.urg ?? false,
                ack: flags.ack ?? false,
                psh: flags.psh ?? false,
                rst: flags.rst ?? false,
                syn: flags.syn ?? false,
                fin: flags.fin ?? false,
            },
            window: options.window ?? 65535,
            checksum: 0, // Will be calculated
            urgentPointer: options.urgentPointer ?? 0,
            options: tcpOptions,
            data: options.data,
        };
        
        return segment;
    }

    /**
     * Create a SYN segment (connection initiation)
     */
    static createSYN(
        sourcePort: number,
        destinationPort: number,
        options?: {
            mss?: number;
            windowScale?: number;
            sackPermitted?: boolean;
        }
    ): TCPSegment {
        return this.createSegment(sourcePort, destinationPort, {
            flags: { syn: true },
            window: 65535,
            mss: options?.mss ?? 1460,
            windowScale: options?.windowScale ?? 7,
            sackPermitted: options?.sackPermitted ?? true,
        });
    }

    /**
     * Create a SYN-ACK segment (connection acknowledgment)
     */
    static createSYNACK(
        sourcePort: number,
        destinationPort: number,
        ackNumber: number,
        options?: {
            mss?: number;
            windowScale?: number;
            sackPermitted?: boolean;
        }
    ): TCPSegment {
        return this.createSegment(sourcePort, destinationPort, {
            acknowledgmentNumber: ackNumber,
            flags: { syn: true, ack: true },
            window: 65535,
            mss: options?.mss ?? 1460,
            windowScale: options?.windowScale ?? 7,
            sackPermitted: options?.sackPermitted ?? true,
        });
    }

    /**
     * Create an ACK segment
     */
    static createACK(
        sourcePort: number,
        destinationPort: number,
        seqNumber: number,
        ackNumber: number,
        window?: number
    ): TCPSegment {
        return this.createSegment(sourcePort, destinationPort, {
            sequenceNumber: seqNumber,
            acknowledgmentNumber: ackNumber,
            flags: { ack: true },
            window: window ?? 65535,
        });
    }

    /**
     * Create a FIN segment (connection termination)
     */
    static createFIN(
        sourcePort: number,
        destinationPort: number,
        seqNumber: number,
        ackNumber: number
    ): TCPSegment {
        return this.createSegment(sourcePort, destinationPort, {
            sequenceNumber: seqNumber,
            acknowledgmentNumber: ackNumber,
            flags: { fin: true, ack: true },
        });
    }

    /**
     * Create a RST segment (connection reset)
     */
    static createRST(
        sourcePort: number,
        destinationPort: number,
        seqNumber: number
    ): TCPSegment {
        return this.createSegment(sourcePort, destinationPort, {
            sequenceNumber: seqNumber,
            flags: { rst: true },
            window: 0,
        });
    }

    /**
     * Create a data segment
     */
    static createDataSegment(
        sourcePort: number,
        destinationPort: number,
        seqNumber: number,
        ackNumber: number,
        data: Uint8Array,
        push: boolean = false
    ): TCPSegment {
        return this.createSegment(sourcePort, destinationPort, {
            sequenceNumber: seqNumber,
            acknowledgmentNumber: ackNumber,
            flags: { ack: true, psh: push },
            data,
        });
    }

    /**
     * Generate Initial Sequence Number (ISN)
     * Uses a clock-based approach for security
     */
    static generateISN(): number {
        // Simple ISN generation based on timestamp + counter
        const now = Date.now();
        this.sequenceCounter = (this.sequenceCounter + (now % 1000) + 1) >>> 0;
        return (this.sequenceCounter ^ (now >>> 0)) >>> 0;
    }

    /**
     * Build TCP options
     */
    private static buildOptions(options: {
        mss?: number;
        windowScale?: number;
        sackPermitted?: boolean;
    }): Uint8Array | undefined {
        const optionBytes: number[] = [];
        
        // MSS Option (Kind=2, Length=4)
        if (options.mss !== undefined) {
            optionBytes.push(2, 4, (options.mss >> 8) & 0xFF, options.mss & 0xFF);
        }
        
        // Window Scale Option (Kind=3, Length=3)
        if (options.windowScale !== undefined) {
            optionBytes.push(3, 3, options.windowScale);
        }
        
        // SACK Permitted Option (Kind=4, Length=2)
        if (options.sackPermitted) {
            optionBytes.push(4, 2);
        }
        
        if (optionBytes.length === 0) {
            return undefined;
        }
        
        // Pad to 4-byte boundary with NOP (Kind=1) and End (Kind=0)
        while (optionBytes.length % 4 !== 0) {
            if (optionBytes.length % 4 === 3) {
                optionBytes.push(0); // End of options
            } else {
                optionBytes.push(1); // NOP
            }
        }
        
        return new Uint8Array(optionBytes);
    }

    /**
     * Calculate TCP checksum using pseudo-header
     */
    static calculateChecksum(
        segment: TCPSegment,
        sourceIP: IPv4Address,
        destinationIP: IPv4Address
    ): number {
        // Calculate segment length
        const headerLength = segment.dataOffset * 4;
        const dataLength = segment.data?.length ?? 0;
        const segmentLength = headerLength + dataLength;
        
        // Create pseudo-header
        const pseudoHeader = IPv4Protocol.createPseudoHeader(
            sourceIP,
            destinationIP,
            IP_PROTOCOLS.TCP,
            segmentLength
        );
        
        // Build checksum buffer
        const checksumBuffer = new Uint8Array(12 + segmentLength + (segmentLength % 2));
        
        // Copy pseudo-header
        checksumBuffer.set(pseudoHeader, 0);
        
        // Build TCP header
        let offset = 12;
        
        // Source Port
        checksumBuffer[offset++] = (segment.sourcePort >> 8) & 0xFF;
        checksumBuffer[offset++] = segment.sourcePort & 0xFF;
        
        // Destination Port
        checksumBuffer[offset++] = (segment.destinationPort >> 8) & 0xFF;
        checksumBuffer[offset++] = segment.destinationPort & 0xFF;
        
        // Sequence Number
        checksumBuffer[offset++] = (segment.sequenceNumber >> 24) & 0xFF;
        checksumBuffer[offset++] = (segment.sequenceNumber >> 16) & 0xFF;
        checksumBuffer[offset++] = (segment.sequenceNumber >> 8) & 0xFF;
        checksumBuffer[offset++] = segment.sequenceNumber & 0xFF;
        
        // Acknowledgment Number
        checksumBuffer[offset++] = (segment.acknowledgmentNumber >> 24) & 0xFF;
        checksumBuffer[offset++] = (segment.acknowledgmentNumber >> 16) & 0xFF;
        checksumBuffer[offset++] = (segment.acknowledgmentNumber >> 8) & 0xFF;
        checksumBuffer[offset++] = segment.acknowledgmentNumber & 0xFF;
        
        // Data Offset and Flags
        const flags = (segment.flags.urg ? TCP_FLAGS.URG : 0) |
                     (segment.flags.ack ? TCP_FLAGS.ACK : 0) |
                     (segment.flags.psh ? TCP_FLAGS.PSH : 0) |
                     (segment.flags.rst ? TCP_FLAGS.RST : 0) |
                     (segment.flags.syn ? TCP_FLAGS.SYN : 0) |
                     (segment.flags.fin ? TCP_FLAGS.FIN : 0);
        
        checksumBuffer[offset++] = (segment.dataOffset << 4);
        checksumBuffer[offset++] = flags;
        
        // Window
        checksumBuffer[offset++] = (segment.window >> 8) & 0xFF;
        checksumBuffer[offset++] = segment.window & 0xFF;
        
        // Checksum (0 for calculation)
        checksumBuffer[offset++] = 0;
        checksumBuffer[offset++] = 0;
        
        // Urgent Pointer
        checksumBuffer[offset++] = (segment.urgentPointer >> 8) & 0xFF;
        checksumBuffer[offset++] = segment.urgentPointer & 0xFF;
        
        // Options
        if (segment.options) {
            checksumBuffer.set(segment.options, offset);
            offset += segment.options.length;
        }
        
        // Data
        if (segment.data) {
            checksumBuffer.set(segment.data, offset);
        }
        
        // Calculate checksum
        let sum = 0;
        for (let i = 0; i < checksumBuffer.length; i += 2) {
            sum += (checksumBuffer[i] << 8) | checksumBuffer[i + 1];
        }
        
        // Add carry bits
        while (sum > 0xFFFF) {
            sum = (sum & 0xFFFF) + (sum >> 16);
        }
        
        // One's complement
        return (~sum) & 0xFFFF;
    }

    /**
     * Verify TCP checksum
     */
    static verifyChecksum(
        segment: TCPSegment,
        sourceIP: IPv4Address,
        destinationIP: IPv4Address
    ): boolean {
        const calculated = this.calculateChecksum(segment, sourceIP, destinationIP);
        return segment.checksum === calculated || calculated === 0;
    }

    /**
     * Parse TCP flags to array of names
     */
    static parseFlags(segment: TCPSegment): string[] {
        const flags: string[] = [];
        if (segment.flags.syn) flags.push('SYN');
        if (segment.flags.ack) flags.push('ACK');
        if (segment.flags.fin) flags.push('FIN');
        if (segment.flags.rst) flags.push('RST');
        if (segment.flags.psh) flags.push('PSH');
        if (segment.flags.urg) flags.push('URG');
        return flags;
    }

    /**
     * Format segment for display
     */
    static formatSegment(segment: TCPSegment): string {
        const flags = this.parseFlags(segment).join(',') || 'none';
        const dataLen = segment.data?.length ?? 0;
        
        return `TCP ${segment.sourcePort} -> ${segment.destinationPort} ` +
               `[${flags}] Seq=${segment.sequenceNumber} Ack=${segment.acknowledgmentNumber} ` +
               `Win=${segment.window} Len=${dataLen}`;
    }

    /**
     * Check if port is in valid range
     */
    static isValidPort(port: number): boolean {
        return port >= 0 && port <= 65535;
    }

    /**
     * Check if port is privileged (requires root)
     */
    static isPrivilegedPort(port: number): boolean {
        return port > 0 && port < 1024;
    }

    /**
     * Get well-known service name for port
     */
    static getServiceName(port: number): string | undefined {
        const services: Record<number, string> = {
            20: 'FTP-DATA',
            21: 'FTP',
            22: 'SSH',
            23: 'TELNET',
            25: 'SMTP',
            53: 'DNS',
            80: 'HTTP',
            110: 'POP3',
            143: 'IMAP',
            443: 'HTTPS',
            465: 'SMTPS',
            993: 'IMAPS',
            995: 'POP3S',
        };
        return services[port];
    }
}

/**
 * TCP Connection Manager - handles connection state machine
 */
export class TCPConnectionManager {
    private connections: Map<string, TCPConnection> = new Map();
    private listeners: Map<number, (conn: TCPConnection) => void> = new Map();
    
    // Configuration
    private readonly defaultMSS = 1460;
    private readonly defaultWindow = 65535;
    private readonly initialRTO = 3000; // 3 seconds
    private readonly maxRTO = 60000; // 60 seconds
    private readonly timeWaitDuration = 120000; // 2 minutes (2MSL)
    
    /**
     * Generate connection ID from 4-tuple
     */
    private getConnectionId(
        localIP: IPv4Address,
        localPort: number,
        remoteIP: IPv4Address,
        remotePort: number
    ): string {
        return `${localIP.toString()}:${localPort}-${remoteIP.toString()}:${remotePort}`;
    }

    /**
     * Create a new connection (active open)
     */
    createConnection(
        localIP: IPv4Address,
        localPort: number,
        remoteIP: IPv4Address,
        remotePort: number
    ): TCPConnection {
        const id = this.getConnectionId(localIP, localPort, remoteIP, remotePort);
        
        const isn = TCPProtocol.generateISN();
        
        const connection: TCPConnection = {
            id,
            localIP,
            localPort,
            remoteIP,
            remotePort,
            state: TCPState.CLOSED,
            
            sendSequenceNumber: isn,
            sendUnacknowledged: isn,
            sendWindow: this.defaultWindow,
            initialSendSequence: isn,
            
            receiveNextExpected: 0,
            receiveWindow: this.defaultWindow,
            initialReceiveSequence: 0,
            
            retransmissionTimeout: this.initialRTO,
            lastActivity: Date.now(),
            
            congestionWindow: this.defaultMSS,
            slowStartThreshold: this.defaultWindow,
            
            bytesSent: 0,
            bytesReceived: 0,
            segmentsSent: 0,
            segmentsReceived: 0,
            retransmissions: 0,
        };
        
        this.connections.set(id, connection);
        return connection;
    }

    /**
     * Listen on a port (passive open)
     */
    listen(port: number, onConnection: (conn: TCPConnection) => void): void {
        this.listeners.set(port, onConnection);
    }

    /**
     * Stop listening on a port
     */
    stopListening(port: number): void {
        this.listeners.delete(port);
    }

    /**
     * Get connection by ID
     */
    getConnection(id: string): TCPConnection | undefined {
        return this.connections.get(id);
    }

    /**
     * Get connection by 4-tuple
     */
    findConnection(
        localIP: IPv4Address,
        localPort: number,
        remoteIP: IPv4Address,
        remotePort: number
    ): TCPConnection | undefined {
        const id = this.getConnectionId(localIP, localPort, remoteIP, remotePort);
        return this.connections.get(id);
    }

    /**
     * Process incoming segment and return response segment(s)
     */
    processSegment(
        segment: TCPSegment,
        sourceIP: IPv4Address,
        destinationIP: IPv4Address
    ): { connection: TCPConnection; responses: TCPSegment[] } | null {
        // Find or create connection
        let connection = this.findConnection(
            destinationIP, segment.destinationPort,
            sourceIP, segment.sourcePort
        );
        
        // Check if this is a new connection attempt
        if (!connection && segment.flags.syn && !segment.flags.ack) {
            const listener = this.listeners.get(segment.destinationPort);
            if (listener) {
                connection = this.createConnection(
                    destinationIP, segment.destinationPort,
                    sourceIP, segment.sourcePort
                );
                connection.state = TCPState.LISTEN;
                listener(connection);
            }
        }
        
        if (!connection) {
            // No connection found and no listener, send RST
            return null;
        }
        
        // Update statistics
        connection.segmentsReceived++;
        connection.bytesReceived += segment.data?.length ?? 0;
        connection.lastActivity = Date.now();
        
        // Process based on current state
        const responses = this.handleState(connection, segment);
        
        return { connection, responses };
    }

    /**
     * Handle segment based on connection state
     */
    private handleState(connection: TCPConnection, segment: TCPSegment): TCPSegment[] {
        const responses: TCPSegment[] = [];
        
        switch (connection.state) {
            case TCPState.CLOSED:
                // Connection closed, send RST
                if (!segment.flags.rst) {
                    responses.push(TCPProtocol.createRST(
                        connection.localPort,
                        connection.remotePort,
                        segment.flags.ack ? segment.acknowledgmentNumber : 0
                    ));
                }
                break;
                
            case TCPState.LISTEN:
                if (segment.flags.syn) {
                    // Received SYN, send SYN-ACK
                    connection.initialReceiveSequence = segment.sequenceNumber;
                    connection.receiveNextExpected = segment.sequenceNumber + 1;
                    
                    responses.push(TCPProtocol.createSYNACK(
                        connection.localPort,
                        connection.remotePort,
                        connection.receiveNextExpected
                    ));
                    
                    connection.state = TCPState.SYN_RECEIVED;
                }
                break;
                
            case TCPState.SYN_SENT:
                if (segment.flags.syn && segment.flags.ack) {
                    // Received SYN-ACK
                    if (segment.acknowledgmentNumber === connection.sendSequenceNumber + 1) {
                        connection.sendUnacknowledged = segment.acknowledgmentNumber;
                        connection.sendSequenceNumber = segment.acknowledgmentNumber;
                        connection.initialReceiveSequence = segment.sequenceNumber;
                        connection.receiveNextExpected = segment.sequenceNumber + 1;
                        
                        responses.push(TCPProtocol.createACK(
                            connection.localPort,
                            connection.remotePort,
                            connection.sendSequenceNumber,
                            connection.receiveNextExpected
                        ));
                        
                        connection.state = TCPState.ESTABLISHED;
                    }
                } else if (segment.flags.syn) {
                    // Simultaneous open
                    connection.initialReceiveSequence = segment.sequenceNumber;
                    connection.receiveNextExpected = segment.sequenceNumber + 1;
                    
                    responses.push(TCPProtocol.createSYNACK(
                        connection.localPort,
                        connection.remotePort,
                        connection.receiveNextExpected
                    ));
                    
                    connection.state = TCPState.SYN_RECEIVED;
                }
                break;
                
            case TCPState.SYN_RECEIVED:
                if (segment.flags.ack) {
                    if (segment.acknowledgmentNumber === connection.sendSequenceNumber + 1) {
                        connection.sendUnacknowledged = segment.acknowledgmentNumber;
                        connection.sendSequenceNumber = segment.acknowledgmentNumber;
                        connection.state = TCPState.ESTABLISHED;
                    }
                }
                break;
                
            case TCPState.ESTABLISHED:
                if (segment.flags.fin) {
                    // Received FIN, start passive close
                    connection.receiveNextExpected = segment.sequenceNumber + 1;
                    
                    responses.push(TCPProtocol.createACK(
                        connection.localPort,
                        connection.remotePort,
                        connection.sendSequenceNumber,
                        connection.receiveNextExpected
                    ));
                    
                    connection.state = TCPState.CLOSE_WAIT;
                } else if (segment.flags.rst) {
                    // Connection reset
                    connection.state = TCPState.CLOSED;
                } else if (segment.data && segment.data.length > 0) {
                    // Data received, send ACK
                    connection.receiveNextExpected = segment.sequenceNumber + segment.data.length;
                    
                    responses.push(TCPProtocol.createACK(
                        connection.localPort,
                        connection.remotePort,
                        connection.sendSequenceNumber,
                        connection.receiveNextExpected
                    ));
                }
                break;
                
            case TCPState.FIN_WAIT_1:
                if (segment.flags.fin && segment.flags.ack) {
                    // Received FIN+ACK (simultaneous close)
                    connection.receiveNextExpected = segment.sequenceNumber + 1;
                    
                    responses.push(TCPProtocol.createACK(
                        connection.localPort,
                        connection.remotePort,
                        connection.sendSequenceNumber,
                        connection.receiveNextExpected
                    ));
                    
                    connection.state = TCPState.TIME_WAIT;
                    this.startTimeWaitTimer(connection);
                } else if (segment.flags.fin) {
                    // Received FIN
                    connection.receiveNextExpected = segment.sequenceNumber + 1;
                    
                    responses.push(TCPProtocol.createACK(
                        connection.localPort,
                        connection.remotePort,
                        connection.sendSequenceNumber,
                        connection.receiveNextExpected
                    ));
                    
                    connection.state = TCPState.CLOSING;
                } else if (segment.flags.ack) {
                    // Received ACK for our FIN
                    connection.state = TCPState.FIN_WAIT_2;
                }
                break;
                
            case TCPState.FIN_WAIT_2:
                if (segment.flags.fin) {
                    // Received FIN
                    connection.receiveNextExpected = segment.sequenceNumber + 1;
                    
                    responses.push(TCPProtocol.createACK(
                        connection.localPort,
                        connection.remotePort,
                        connection.sendSequenceNumber,
                        connection.receiveNextExpected
                    ));
                    
                    connection.state = TCPState.TIME_WAIT;
                    this.startTimeWaitTimer(connection);
                }
                break;
                
            case TCPState.CLOSE_WAIT:
                // Application should send FIN to move to LAST_ACK
                break;
                
            case TCPState.CLOSING:
                if (segment.flags.ack) {
                    connection.state = TCPState.TIME_WAIT;
                    this.startTimeWaitTimer(connection);
                }
                break;
                
            case TCPState.LAST_ACK:
                if (segment.flags.ack) {
                    connection.state = TCPState.CLOSED;
                    this.connections.delete(connection.id);
                }
                break;
                
            case TCPState.TIME_WAIT:
                // Retransmit ACK if FIN received
                if (segment.flags.fin) {
                    responses.push(TCPProtocol.createACK(
                        connection.localPort,
                        connection.remotePort,
                        connection.sendSequenceNumber,
                        connection.receiveNextExpected
                    ));
                }
                break;
        }
        
        return responses;
    }

    /**
     * Initiate active open (send SYN)
     */
    connect(connection: TCPConnection): TCPSegment {
        const syn = TCPProtocol.createSYN(
            connection.localPort,
            connection.remotePort
        );
        
        // Update connection state
        syn.sequenceNumber = connection.initialSendSequence;
        connection.state = TCPState.SYN_SENT;
        connection.segmentsSent++;
        
        return syn;
    }

    /**
     * Initiate active close (send FIN)
     */
    close(connection: TCPConnection): TCPSegment | null {
        if (connection.state === TCPState.ESTABLISHED) {
            const fin = TCPProtocol.createFIN(
                connection.localPort,
                connection.remotePort,
                connection.sendSequenceNumber,
                connection.receiveNextExpected
            );
            
            connection.state = TCPState.FIN_WAIT_1;
            connection.segmentsSent++;
            
            return fin;
        } else if (connection.state === TCPState.CLOSE_WAIT) {
            const fin = TCPProtocol.createFIN(
                connection.localPort,
                connection.remotePort,
                connection.sendSequenceNumber,
                connection.receiveNextExpected
            );
            
            connection.state = TCPState.LAST_ACK;
            connection.segmentsSent++;
            
            return fin;
        }
        
        return null;
    }

    /**
     * Send data on an established connection
     */
    send(connection: TCPConnection, data: Uint8Array): TCPSegment | null {
        if (connection.state !== TCPState.ESTABLISHED) {
            return null;
        }
        
        const segment = TCPProtocol.createDataSegment(
            connection.localPort,
            connection.remotePort,
            connection.sendSequenceNumber,
            connection.receiveNextExpected,
            data,
            true
        );
        
        connection.sendSequenceNumber += data.length;
        connection.bytesSent += data.length;
        connection.segmentsSent++;
        
        return segment;
    }

    /**
     * Start TIME_WAIT timer
     */
    private startTimeWaitTimer(connection: TCPConnection): void {
        connection.timeWaitTimer = setTimeout(() => {
            if (connection.state === TCPState.TIME_WAIT) {
                connection.state = TCPState.CLOSED;
                this.connections.delete(connection.id);
            }
        }, this.timeWaitDuration) as unknown as number;
    }

    /**
     * Force close a connection (send RST)
     */
    abort(connection: TCPConnection): TCPSegment {
        const rst = TCPProtocol.createRST(
            connection.localPort,
            connection.remotePort,
            connection.sendSequenceNumber
        );
        
        connection.state = TCPState.CLOSED;
        this.connections.delete(connection.id);
        
        return rst;
    }

    /**
     * Get all active connections
     */
    getAllConnections(): TCPConnection[] {
        return Array.from(this.connections.values());
    }

    /**
     * Get connection statistics
     */
    getStatistics(): {
        totalConnections: number;
        connectionsByState: Record<TCPState, number>;
        totalBytesSent: number;
        totalBytesReceived: number;
    } {
        const connectionsByState = Object.values(TCPState).reduce((acc, state) => {
            acc[state] = 0;
            return acc;
        }, {} as Record<TCPState, number>);
        
        let totalBytesSent = 0;
        let totalBytesReceived = 0;
        
        for (const conn of this.connections.values()) {
            connectionsByState[conn.state]++;
            totalBytesSent += conn.bytesSent;
            totalBytesReceived += conn.bytesReceived;
        }
        
        return {
            totalConnections: this.connections.size,
            connectionsByState,
            totalBytesSent,
            totalBytesReceived,
        };
    }
}

export default TCPProtocol;
