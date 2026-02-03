// ProtocolDecoders - Deep packet inspection for application layer protocols
// Decodes DNS, HTTP, DHCP and other application protocols

import type { CapturedPacketDetail, ProtocolField } from '@/store/packetCaptureStore';

/**
 * DNS Record Types
 */
export const DNS_RECORD_TYPES: Record<number, string> = {
    1: 'A',
    2: 'NS',
    5: 'CNAME',
    6: 'SOA',
    12: 'PTR',
    15: 'MX',
    16: 'TXT',
    28: 'AAAA',
    33: 'SRV',
    255: 'ANY',
};

/**
 * DNS Response Codes
 */
export const DNS_RCODES: Record<number, string> = {
    0: 'No Error',
    1: 'Format Error',
    2: 'Server Failure',
    3: 'Name Error (NXDOMAIN)',
    4: 'Not Implemented',
    5: 'Refused',
};

/**
 * DHCP Message Types
 */
export const DHCP_MESSAGE_TYPES: Record<number, string> = {
    1: 'DISCOVER',
    2: 'OFFER',
    3: 'REQUEST',
    4: 'DECLINE',
    5: 'ACK',
    6: 'NAK',
    7: 'RELEASE',
    8: 'INFORM',
};

/**
 * DHCP Option Types
 */
export const DHCP_OPTIONS: Record<number, string> = {
    1: 'Subnet Mask',
    3: 'Router',
    6: 'DNS Server',
    12: 'Hostname',
    15: 'Domain Name',
    28: 'Broadcast Address',
    50: 'Requested IP',
    51: 'Lease Time',
    53: 'Message Type',
    54: 'Server Identifier',
    55: 'Parameter Request List',
    58: 'Renewal Time',
    59: 'Rebinding Time',
    61: 'Client Identifier',
    255: 'End',
};

/**
 * HTTP Methods
 */
export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS', 'PATCH', 'CONNECT', 'TRACE'];

/**
 * Common HTTP Status Codes
 */
export const HTTP_STATUS_CODES: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    301: 'Moved Permanently',
    302: 'Found',
    304: 'Not Modified',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
};

/**
 * DNS Question
 */
export interface DNSQuestion {
    name: string;
    type: number;
    typeName: string;
    class: number;
}

/**
 * DNS Answer
 */
export interface DNSAnswer {
    name: string;
    type: number;
    typeName: string;
    class: number;
    ttl: number;
    data: string;
}

/**
 * Decoded DNS message
 */
export interface DecodedDNS {
    transactionId: number;
    isResponse: boolean;
    opcode: number;
    authoritative: boolean;
    truncated: boolean;
    recursionDesired: boolean;
    recursionAvailable: boolean;
    responseCode: number;
    responseCodeName: string;
    questionCount: number;
    answerCount: number;
    authorityCount: number;
    additionalCount: number;
    questions: DNSQuestion[];
    answers: DNSAnswer[];
    summary: string;
}

/**
 * HTTP Header
 */
export interface HTTPHeader {
    name: string;
    value: string;
}

/**
 * Decoded HTTP message
 */
export interface DecodedHTTP {
    isRequest: boolean;
    
    // Request fields
    method?: string;
    uri?: string;
    version?: string;
    
    // Response fields
    statusCode?: number;
    statusText?: string;
    
    headers: HTTPHeader[];
    contentType?: string;
    contentLength?: number;
    host?: string;
    userAgent?: string;
    server?: string;
    
    // Body preview
    bodyPreview?: string;
    bodyLength: number;
    
    summary: string;
}

/**
 * DHCP Option
 */
export interface DHCPOption {
    code: number;
    name: string;
    length: number;
    value: string;
}

/**
 * Decoded DHCP message
 */
export interface DecodedDHCP {
    opcode: number;
    opcodeString: string;
    hardwareType: number;
    hops: number;
    transactionId: number;
    secondsElapsed: number;
    flags: number;
    broadcastFlag: boolean;
    clientIP: string;
    yourIP: string;
    serverIP: string;
    gatewayIP: string;
    clientMAC: string;
    serverHostname: string;
    bootFilename: string;
    messageType?: number;
    messageTypeName?: string;
    options: DHCPOption[];
    summary: string;
}

/**
 * DNS Decoder
 */
export class DNSDecoder {
    /**
     * Check if packet contains DNS data
     */
    static isDNS(packet: CapturedPacketDetail): boolean {
        if (packet.protocol === 'dns') return true;
        if (packet.udp) {
            return packet.udp.sourcePort === 53 || packet.udp.destinationPort === 53;
        }
        if (packet.tcp) {
            return packet.tcp.sourcePort === 53 || packet.tcp.destinationPort === 53;
        }
        return false;
    }
    
    /**
     * Decode DNS packet
     */
    static decode(data: Uint8Array): DecodedDNS | null {
        if (data.length < 12) return null;
        
        try {
            const view = new DataView(data.buffer, data.byteOffset, data.length);
            
            const transactionId = view.getUint16(0);
            const flags = view.getUint16(2);
            
            const isResponse = (flags & 0x8000) !== 0;
            const opcode = (flags >> 11) & 0x0F;
            const authoritative = (flags & 0x0400) !== 0;
            const truncated = (flags & 0x0200) !== 0;
            const recursionDesired = (flags & 0x0100) !== 0;
            const recursionAvailable = (flags & 0x0080) !== 0;
            const responseCode = flags & 0x000F;
            
            const questionCount = view.getUint16(4);
            const answerCount = view.getUint16(6);
            const authorityCount = view.getUint16(8);
            const additionalCount = view.getUint16(10);
            
            let offset = 12;
            const questions: DNSQuestion[] = [];
            const answers: DNSAnswer[] = [];
            
            // Parse questions
            for (let i = 0; i < questionCount && offset < data.length; i++) {
                const { name, newOffset } = this.readDomainName(data, offset);
                offset = newOffset;
                
                if (offset + 4 > data.length) break;
                
                const type = view.getUint16(offset);
                const qclass = view.getUint16(offset + 2);
                offset += 4;
                
                questions.push({
                    name,
                    type,
                    typeName: DNS_RECORD_TYPES[type] || `TYPE${type}`,
                    class: qclass,
                });
            }
            
            // Parse answers
            for (let i = 0; i < answerCount && offset < data.length; i++) {
                const { name, newOffset } = this.readDomainName(data, offset);
                offset = newOffset;
                
                if (offset + 10 > data.length) break;
                
                const type = view.getUint16(offset);
                const rclass = view.getUint16(offset + 2);
                const ttl = view.getUint32(offset + 4);
                const rdlength = view.getUint16(offset + 8);
                offset += 10;
                
                if (offset + rdlength > data.length) break;
                
                let rdata = '';
                if (type === 1 && rdlength === 4) {
                    // A record - IPv4
                    rdata = `${data[offset]}.${data[offset+1]}.${data[offset+2]}.${data[offset+3]}`;
                } else if (type === 28 && rdlength === 16) {
                    // AAAA record - IPv6
                    const parts: string[] = [];
                    for (let j = 0; j < 16; j += 2) {
                        parts.push(view.getUint16(offset + j).toString(16));
                    }
                    rdata = parts.join(':');
                } else if (type === 5 || type === 2 || type === 12) {
                    // CNAME, NS, PTR - domain name
                    const { name: dname } = this.readDomainName(data, offset);
                    rdata = dname;
                } else if (type === 15) {
                    // MX - preference + domain
                    const preference = view.getUint16(offset);
                    const { name: mx } = this.readDomainName(data, offset + 2);
                    rdata = `${preference} ${mx}`;
                } else if (type === 16) {
                    // TXT
                    rdata = new TextDecoder().decode(data.slice(offset + 1, offset + rdlength));
                } else {
                    // Hex dump for unknown types
                    rdata = Array.from(data.slice(offset, offset + rdlength))
                        .map(b => b.toString(16).padStart(2, '0'))
                        .join(' ');
                }
                
                offset += rdlength;
                
                answers.push({
                    name,
                    type,
                    typeName: DNS_RECORD_TYPES[type] || `TYPE${type}`,
                    class: rclass,
                    ttl,
                    data: rdata,
                });
            }
            
            // Build summary
            let summary = '';
            if (isResponse) {
                if (answers.length > 0) {
                    summary = `Response: ${questions[0]?.name || 'unknown'} -> ${answers[0].data}`;
                } else {
                    summary = `Response: ${questions[0]?.name || 'unknown'} (${DNS_RCODES[responseCode] || 'error'})`;
                }
            } else {
                summary = `Query: ${questions.map(q => `${q.typeName} ${q.name}`).join(', ')}`;
            }
            
            return {
                transactionId,
                isResponse,
                opcode,
                authoritative,
                truncated,
                recursionDesired,
                recursionAvailable,
                responseCode,
                responseCodeName: DNS_RCODES[responseCode] || 'Unknown',
                questionCount,
                answerCount,
                authorityCount,
                additionalCount,
                questions,
                answers,
                summary,
            };
        } catch (e) {
            console.error('DNS decode error:', e);
            return null;
        }
    }
    
    /**
     * Read domain name with compression support
     */
    private static readDomainName(data: Uint8Array, offset: number): { name: string; newOffset: number } {
        const parts: string[] = [];
        let jumped = false;
        let newOffset = offset;
        let currentOffset = offset;
        let maxJumps = 100; // Prevent infinite loops
        
        while (maxJumps-- > 0) {
            if (currentOffset >= data.length) break;
            
            const length = data[currentOffset];
            
            if (length === 0) {
                if (!jumped) newOffset = currentOffset + 1;
                break;
            }
            
            // Check for compression pointer
            if ((length & 0xC0) === 0xC0) {
                if (currentOffset + 1 >= data.length) break;
                const pointer = ((length & 0x3F) << 8) | data[currentOffset + 1];
                if (!jumped) newOffset = currentOffset + 2;
                currentOffset = pointer;
                jumped = true;
                continue;
            }
            
            currentOffset++;
            if (currentOffset + length > data.length) break;
            
            parts.push(new TextDecoder().decode(data.slice(currentOffset, currentOffset + length)));
            currentOffset += length;
            
            if (!jumped) newOffset = currentOffset;
        }
        
        return { name: parts.join('.'), newOffset };
    }
    
    /**
     * Get protocol fields for detail view
     */
    static getProtocolFields(decoded: DecodedDNS): ProtocolField[] {
        const fields: ProtocolField[] = [
            { name: 'Transaction ID', value: `0x${decoded.transactionId.toString(16).padStart(4, '0')}` },
            { name: 'Flags', value: decoded.isResponse ? 'Response' : 'Query' },
            { name: 'Response Code', value: decoded.responseCodeName },
        ];
        
        if (decoded.questions.length > 0) {
            fields.push({
                name: 'Questions',
                value: `${decoded.questionCount}`,
                children: decoded.questions.map((q, i) => ({
                    name: `Question ${i + 1}`,
                    value: q.name,
                    children: [
                        { name: 'Type', value: q.typeName },
                        { name: 'Class', value: q.class.toString() },
                    ],
                })),
            });
        }
        
        if (decoded.answers.length > 0) {
            fields.push({
                name: 'Answers',
                value: `${decoded.answerCount}`,
                children: decoded.answers.map((a, i) => ({
                    name: `Answer ${i + 1}`,
                    value: a.data,
                    children: [
                        { name: 'Name', value: a.name },
                        { name: 'Type', value: a.typeName },
                        { name: 'TTL', value: `${a.ttl}s` },
                    ],
                })),
            });
        }
        
        return fields;
    }
}

/**
 * HTTP Decoder
 */
export class HTTPDecoder {
    /**
     * Check if packet contains HTTP data
     */
    static isHTTP(packet: CapturedPacketDetail): boolean {
        if (packet.protocol === 'http') return true;
        if (packet.tcp) {
            if (packet.tcp.sourcePort === 80 || packet.tcp.destinationPort === 80 ||
                packet.tcp.sourcePort === 8080 || packet.tcp.destinationPort === 8080) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Decode HTTP packet
     */
    static decode(data: Uint8Array): DecodedHTTP | null {
        if (data.length < 10) return null;
        
        try {
            const text = new TextDecoder('utf-8', { fatal: false }).decode(data);
            const lines = text.split('\r\n');
            
            if (lines.length === 0) return null;
            
            const firstLine = lines[0];
            const headers: HTTPHeader[] = [];
            let bodyStart = -1;
            
            // Check if request or response
            const isRequest = HTTP_METHODS.some(m => firstLine.startsWith(m + ' '));
            const isResponse = firstLine.startsWith('HTTP/');
            
            if (!isRequest && !isResponse) return null;
            
            // Parse headers
            for (let i = 1; i < lines.length; i++) {
                if (lines[i] === '') {
                    bodyStart = i + 1;
                    break;
                }
                
                const colonIndex = lines[i].indexOf(':');
                if (colonIndex > 0) {
                    headers.push({
                        name: lines[i].slice(0, colonIndex).trim(),
                        value: lines[i].slice(colonIndex + 1).trim(),
                    });
                }
            }
            
            // Extract common headers
            const contentType = headers.find(h => h.name.toLowerCase() === 'content-type')?.value;
            const contentLengthStr = headers.find(h => h.name.toLowerCase() === 'content-length')?.value;
            const contentLength = contentLengthStr ? parseInt(contentLengthStr) : undefined;
            const host = headers.find(h => h.name.toLowerCase() === 'host')?.value;
            const userAgent = headers.find(h => h.name.toLowerCase() === 'user-agent')?.value;
            const server = headers.find(h => h.name.toLowerCase() === 'server')?.value;
            
            // Get body preview
            let bodyPreview: string | undefined;
            let bodyLength = 0;
            if (bodyStart > 0 && bodyStart < lines.length) {
                const body = lines.slice(bodyStart).join('\r\n');
                bodyLength = body.length;
                bodyPreview = body.slice(0, 500);
                if (bodyLength > 500) bodyPreview += '...';
            }
            
            if (isRequest) {
                const parts = firstLine.split(' ');
                const method = parts[0];
                const uri = parts[1];
                const version = parts[2];
                
                return {
                    isRequest: true,
                    method,
                    uri,
                    version,
                    headers,
                    contentType,
                    contentLength,
                    host,
                    userAgent,
                    bodyPreview,
                    bodyLength,
                    summary: `${method} ${uri} ${host ? `(${host})` : ''}`,
                };
            } else {
                const parts = firstLine.split(' ');
                const version = parts[0];
                const statusCode = parseInt(parts[1]);
                const statusText = parts.slice(2).join(' ');
                
                return {
                    isRequest: false,
                    version,
                    statusCode,
                    statusText,
                    headers,
                    contentType,
                    contentLength,
                    server,
                    bodyPreview,
                    bodyLength,
                    summary: `${statusCode} ${statusText || HTTP_STATUS_CODES[statusCode] || ''} (${contentType || 'unknown'})`,
                };
            }
        } catch (e) {
            console.error('HTTP decode error:', e);
            return null;
        }
    }
    
    /**
     * Get protocol fields for detail view
     */
    static getProtocolFields(decoded: DecodedHTTP): ProtocolField[] {
        const fields: ProtocolField[] = [];
        
        if (decoded.isRequest) {
            fields.push(
                { name: 'Request Method', value: decoded.method || '' },
                { name: 'Request URI', value: decoded.uri || '' },
                { name: 'HTTP Version', value: decoded.version || '' },
            );
        } else {
            fields.push(
                { name: 'HTTP Version', value: decoded.version || '' },
                { name: 'Status Code', value: decoded.statusCode?.toString() || '' },
                { name: 'Status Text', value: decoded.statusText || '' },
            );
        }
        
        if (decoded.headers.length > 0) {
            fields.push({
                name: 'Headers',
                value: `${decoded.headers.length} headers`,
                children: decoded.headers.map(h => ({
                    name: h.name,
                    value: h.value,
                })),
            });
        }
        
        if (decoded.bodyPreview) {
            fields.push({
                name: 'Body',
                value: `${decoded.bodyLength} bytes`,
                description: decoded.bodyPreview,
            });
        }
        
        return fields;
    }
}

/**
 * DHCP Decoder
 */
export class DHCPDecoder {
    /**
     * Check if packet contains DHCP data
     */
    static isDHCP(packet: CapturedPacketDetail): boolean {
        if (packet.protocol === 'dhcp') return true;
        if (packet.udp) {
            return (packet.udp.sourcePort === 67 || packet.udp.destinationPort === 67 ||
                    packet.udp.sourcePort === 68 || packet.udp.destinationPort === 68);
        }
        return false;
    }
    
    /**
     * Decode DHCP packet
     */
    static decode(data: Uint8Array): DecodedDHCP | null {
        // DHCP minimum size: 240 bytes (header) + 4 bytes (magic cookie)
        if (data.length < 244) return null;
        
        try {
            const view = new DataView(data.buffer, data.byteOffset, data.length);
            
            const opcode = data[0];
            const hardwareType = data[1];
            const hardwareLen = data[2];
            const hops = data[3];
            const transactionId = view.getUint32(4);
            const secondsElapsed = view.getUint16(8);
            const flags = view.getUint16(10);
            const broadcastFlag = (flags & 0x8000) !== 0;
            
            const clientIP = `${data[12]}.${data[13]}.${data[14]}.${data[15]}`;
            const yourIP = `${data[16]}.${data[17]}.${data[18]}.${data[19]}`;
            const serverIP = `${data[20]}.${data[21]}.${data[22]}.${data[23]}`;
            const gatewayIP = `${data[24]}.${data[25]}.${data[26]}.${data[27]}`;
            
            // Client hardware address (typically MAC)
            const macBytes = data.slice(28, 28 + Math.min(hardwareLen, 16));
            const clientMAC = Array.from(macBytes.slice(0, 6))
                .map(b => b.toString(16).padStart(2, '0'))
                .join(':');
            
            // Server hostname (64 bytes at offset 44)
            const serverHostname = new TextDecoder().decode(data.slice(44, 108)).replace(/\0/g, '').trim();
            
            // Boot filename (128 bytes at offset 108)
            const bootFilename = new TextDecoder().decode(data.slice(108, 236)).replace(/\0/g, '').trim();
            
            // Check magic cookie (0x63825363)
            const magicCookie = view.getUint32(236);
            if (magicCookie !== 0x63825363) {
                return null;
            }
            
            // Parse options
            const options: DHCPOption[] = [];
            let offset = 240;
            let messageType: number | undefined;
            let messageTypeName: string | undefined;
            
            while (offset < data.length) {
                const optionCode = data[offset];
                
                if (optionCode === 255) { // End
                    break;
                }
                
                if (optionCode === 0) { // Padding
                    offset++;
                    continue;
                }
                
                offset++;
                if (offset >= data.length) break;
                
                const optionLen = data[offset];
                offset++;
                
                if (offset + optionLen > data.length) break;
                
                const optionData = data.slice(offset, offset + optionLen);
                let optionValue = '';
                
                // Parse option value based on type
                switch (optionCode) {
                    case 1:  // Subnet Mask
                    case 3:  // Router
                    case 6:  // DNS
                    case 28: // Broadcast
                    case 50: // Requested IP
                    case 54: // Server Identifier
                        // IP addresses
                        const ips: string[] = [];
                        for (let i = 0; i < optionLen; i += 4) {
                            if (i + 4 <= optionLen) {
                                ips.push(`${optionData[i]}.${optionData[i+1]}.${optionData[i+2]}.${optionData[i+3]}`);
                            }
                        }
                        optionValue = ips.join(', ');
                        break;
                    
                    case 51: // Lease Time
                    case 58: // Renewal Time
                    case 59: // Rebinding Time
                        if (optionLen >= 4) {
                            const seconds = new DataView(optionData.buffer, optionData.byteOffset, 4).getUint32(0);
                            optionValue = `${seconds}s`;
                        }
                        break;
                    
                    case 53: // Message Type
                        if (optionLen >= 1) {
                            messageType = optionData[0];
                            messageTypeName = DHCP_MESSAGE_TYPES[messageType];
                            optionValue = messageTypeName || `Type ${messageType}`;
                        }
                        break;
                    
                    case 12: // Hostname
                    case 15: // Domain Name
                        optionValue = new TextDecoder().decode(optionData);
                        break;
                    
                    case 55: // Parameter Request List
                        optionValue = Array.from(optionData)
                            .map(code => DHCP_OPTIONS[code] || `Option ${code}`)
                            .join(', ');
                        break;
                    
                    case 61: // Client Identifier
                        if (optionLen > 1 && optionData[0] === 1) {
                            // Hardware type 1 = Ethernet
                            optionValue = Array.from(optionData.slice(1))
                                .map(b => b.toString(16).padStart(2, '0'))
                                .join(':');
                        } else {
                            optionValue = Array.from(optionData)
                                .map(b => b.toString(16).padStart(2, '0'))
                                .join(' ');
                        }
                        break;
                    
                    default:
                        // Hex dump
                        optionValue = Array.from(optionData)
                            .map(b => b.toString(16).padStart(2, '0'))
                            .join(' ');
                }
                
                options.push({
                    code: optionCode,
                    name: DHCP_OPTIONS[optionCode] || `Option ${optionCode}`,
                    length: optionLen,
                    value: optionValue,
                });
                
                offset += optionLen;
            }
            
            // Build summary
            const summary = `DHCP ${messageTypeName || (opcode === 1 ? 'Request' : 'Reply')} - ` +
                (yourIP !== '0.0.0.0' ? `IP: ${yourIP}` : `Client: ${clientMAC}`);
            
            return {
                opcode,
                opcodeString: opcode === 1 ? 'Boot Request' : 'Boot Reply',
                hardwareType,
                hops,
                transactionId,
                secondsElapsed,
                flags,
                broadcastFlag,
                clientIP,
                yourIP,
                serverIP,
                gatewayIP,
                clientMAC,
                serverHostname,
                bootFilename,
                messageType,
                messageTypeName,
                options,
                summary,
            };
        } catch (e) {
            console.error('DHCP decode error:', e);
            return null;
        }
    }
    
    /**
     * Get protocol fields for detail view
     */
    static getProtocolFields(decoded: DecodedDHCP): ProtocolField[] {
        const fields: ProtocolField[] = [
            { name: 'Message Type', value: decoded.messageTypeName || decoded.opcodeString },
            { name: 'Transaction ID', value: `0x${decoded.transactionId.toString(16).padStart(8, '0')}` },
            { name: 'Client MAC', value: decoded.clientMAC },
        ];
        
        if (decoded.clientIP !== '0.0.0.0') {
            fields.push({ name: 'Client IP', value: decoded.clientIP });
        }
        if (decoded.yourIP !== '0.0.0.0') {
            fields.push({ name: 'Your IP', value: decoded.yourIP });
        }
        if (decoded.serverIP !== '0.0.0.0') {
            fields.push({ name: 'Server IP', value: decoded.serverIP });
        }
        if (decoded.gatewayIP !== '0.0.0.0') {
            fields.push({ name: 'Gateway IP', value: decoded.gatewayIP });
        }
        
        if (decoded.options.length > 0) {
            fields.push({
                name: 'Options',
                value: `${decoded.options.length} options`,
                children: decoded.options.map(opt => ({
                    name: `${opt.name} (${opt.code})`,
                    value: opt.value,
                })),
            });
        }
        
        return fields;
    }
}

/**
 * Protocol Decoder Manager
 */
export class ProtocolDecoderManager {
    /**
     * Decode application layer protocol from packet
     */
    static decodePacket(packet: CapturedPacketDetail): {
        protocol: string;
        decoded: DecodedDNS | DecodedHTTP | DecodedDHCP | null;
        fields: ProtocolField[];
        summary: string;
    } | null {
        // Get data from TCP or UDP payload
        const data = packet.tcp?.data || packet.udp?.data;
        if (!data || data.length === 0) return null;
        
        // Try DHCP first since it uses specific ports
        if (DHCPDecoder.isDHCP(packet)) {
            // Check DHCP first since it uses port 67/68
            const decoded = DHCPDecoder.decode(data);
            if (decoded) {
                return {
                    protocol: 'DHCP',
                    decoded,
                    fields: DHCPDecoder.getProtocolFields(decoded),
                    summary: decoded.summary,
                };
            }
        }
        
        if (DNSDecoder.isDNS(packet)) {
            const decoded = DNSDecoder.decode(data);
            if (decoded) {
                return {
                    protocol: 'DNS',
                    decoded,
                    fields: DNSDecoder.getProtocolFields(decoded),
                    summary: decoded.summary,
                };
            }
        }
        
        // Try HTTP
        if (HTTPDecoder.isHTTP(packet)) {
            const decoded = HTTPDecoder.decode(data);
            if (decoded) {
                return {
                    protocol: 'HTTP',
                    decoded,
                    fields: HTTPDecoder.getProtocolFields(decoded),
                    summary: decoded.summary,
                };
            }
        }
        
        // Try DHCP
        if (DHCPDecoder.isDHCP(packet)) {
            const decoded = DHCPDecoder.decode(data);
            if (decoded) {
                return {
                    protocol: 'DHCP',
                    decoded,
                    fields: DHCPDecoder.getProtocolFields(decoded),
                    summary: decoded.summary,
                };
            }
        }
        
        return null;
    }
    
    /**
     * Get enhanced packet info with decoded protocol
     */
    static getEnhancedInfo(packet: CapturedPacketDetail): string {
        const decoded = this.decodePacket(packet);
        if (decoded) {
            return decoded.summary;
        }
        return packet.info;
    }
    
    /**
     * Get additional protocol layers for packet detail view
     */
    static getAdditionalLayers(packet: CapturedPacketDetail): { name: string; fields: ProtocolField[] }[] {
        const decoded = this.decodePacket(packet);
        if (decoded) {
            return [{
                name: decoded.protocol,
                fields: decoded.fields,
            }];
        }
        return [];
    }
}

export default ProtocolDecoderManager;
