// Virtual PC (End Device) Implementation

import { BaseDevice } from './Device';
import { Packet, IPv4AddressUtil, PacketFactory } from '../core/Packet';
import type { CommandResult, IPPacket, ICMPPacket } from '../core/types';

interface PingResult {
    destination: string;
    sent: number;
    received: number;
    lost: number;
    minTime: number;
    maxTime: number;
    avgTime: number;
    times: number[];
}

export class VirtualPC extends BaseDevice {
    private defaultGateway?: string;
    private dnsServers: string[];
    private pendingPings: Map<number, { timestamp: number; destination: string }>;
    private pingResults: Map<string, PingResult>;

    constructor(name: string, hostname: string, position?: { x: number; y: number }) {
        super('pc', name, hostname, position);
        this.dnsServers = ['8.8.8.8', '8.8.4.4'];
        this.pendingPings = new Map();
        this.pingResults = new Map();

        // Initialize single network interface
        this.addInterface('Ethernet0');
    }

    initialize(): void {
        super.initialize();
    }

    // ==================== Packet Processing ====================

    processPacket(packet: Packet, inInterface: string): void {
        if (packet.dropped) return;

        const frame = packet.frame;

        // Check if this is an ARP packet
        if ('opcode' in frame.payload) {
            this.handleArpPacket(packet, inInterface);
            return;
        }

        const ipPacket = frame.payload as IPPacket;
        const myInterface = this.interfaces.get(inInterface);

        if (!myInterface?.ipAddress) return;

        const myIP = new IPv4AddressUtil(myInterface.ipAddress.octets);
        const destIP = new IPv4AddressUtil(ipPacket.destinationIP.octets);

        // Check if packet is for us
        if (!myIP.equals(destIP)) {
            packet.drop('Not addressed to this host');
            return;
        }

        // Process based on protocol
        switch (ipPacket.protocol) {
            case 1: // ICMP
                this.handleIcmpPacket(packet, inInterface);
                break;
            case 6: // TCP
                this.handleTcpPacket(packet, inInterface);
                break;
            case 17: // UDP
                this.handleUdpPacket(packet, inInterface);
                break;
        }
    }

    private handleArpPacket(packet: Packet, inInterface: string): void {
        const arp = packet.frame.payload as import('../core/types').ARPPacket;
        const myInterface = this.interfaces.get(inInterface);

        if (!myInterface?.ipAddress) return;

        const myIP = new IPv4AddressUtil(myInterface.ipAddress.octets);
        const targetIP = new IPv4AddressUtil(arp.targetIP.octets);

        if (arp.opcode === 'request' && myIP.equals(targetIP)) {
            // We should respond to this ARP request
            // The simulator would handle sending the reply
        } else if (arp.opcode === 'reply') {
            // Update ARP table
            this.updateArpTable(
                new IPv4AddressUtil(arp.senderIP.octets).toString(),
                arp.senderMAC.toString(),
                inInterface
            );
        }
    }

    private handleIcmpPacket(packet: Packet, inInterface: string): void {
        const ipPacket = packet.frame.payload as IPPacket;
        const icmp = ipPacket.payload as ICMPPacket;

        if (icmp.type === 0) {
            // Echo Reply - this is a response to our ping
            const identifier = (icmp.data![0] << 8) | icmp.data![1];
            const pending = this.pendingPings.get(identifier);

            if (pending) {
                const rtt = Date.now() - pending.timestamp;
                const result = this.pingResults.get(pending.destination);

                if (result) {
                    result.received++;
                    result.times.push(rtt);
                    result.minTime = Math.min(result.minTime, rtt);
                    result.maxTime = Math.max(result.maxTime, rtt);
                    result.avgTime = result.times.reduce((a, b) => a + b, 0) / result.times.length;
                }

                this.pendingPings.delete(identifier);
            }
        } else if (icmp.type === 8) {
            // Echo Request - we should respond
            // The simulator would handle creating and sending the reply
        }
    }

    private handleTcpPacket(packet: Packet, inInterface: string): void {
        // TCP handling would go here
        // For simulation purposes, we just acknowledge receipt
    }

    private handleUdpPacket(packet: Packet, inInterface: string): void {
        // UDP handling would go here
    }

    // ==================== CLI Commands ====================

    processDeviceCommand(command: string): CommandResult {
        const parts = command.trim().split(/\s+/);
        const baseCmd = parts[0].toLowerCase();

        if (baseCmd === 'ping') {
            return this.handlePingCommand(parts.slice(1));
        }

        if (baseCmd === 'traceroute' || baseCmd === 'tracert') {
            return this.handleTracerouteCommand(parts.slice(1));
        }

        if (baseCmd === 'ipconfig' || baseCmd === 'ifconfig') {
            return this.handleIpConfigCommand(parts.slice(1));
        }

        if (baseCmd === 'set') {
            return this.handleSetCommand(parts.slice(1));
        }

        if (baseCmd === 'clear') {
            return this.handleClearCommand(parts.slice(1));
        }

        if (baseCmd === 'arp') {
            return this.handleArpCommand(parts.slice(1));
        }

        if (baseCmd === 'netstat') {
            return this.handleNetstatCommand(parts.slice(1));
        }

        return { success: false, output: '', error: `Unknown command: ${command}` };
    }

    private handlePingCommand(args: string[]): CommandResult {
        const destination = args[0];
        const count = args.includes('-c') ? parseInt(args[args.indexOf('-c') + 1]) : 4;

        if (!destination) {
            return { success: false, output: '', error: 'Usage: ping <destination> [-c count]' };
        }

        // Check if we have an IP configured
        const intf = Array.from(this.interfaces.values())[0];
        if (!intf?.ipAddress) {
            return { success: false, output: '', error: 'No IP address configured' };
        }

        // Check if we have a route to destination
        if (!this.defaultGateway && !this.isLocalNetwork(destination)) {
            return { success: false, output: 'Destination host unreachable', error: 'No route to host' };
        }

        // Simulate ping
        const lines: string[] = [];
        lines.push(`Pinging ${destination} with 32 bytes of data:`);
        lines.push('');

        // Simulate responses
        let received = 0;
        const times: number[] = [];

        for (let i = 0; i < count; i++) {
            const success = Math.random() > 0.1; // 90% success rate
            const time = Math.floor(Math.random() * 10) + 1;

            if (success) {
                received++;
                times.push(time);
                lines.push(`Reply from ${destination}: bytes=32 time=${time}ms TTL=64`);
            } else {
                lines.push('Request timed out.');
            }
        }

        lines.push('');
        lines.push(`Ping statistics for ${destination}:`);
        lines.push(`    Packets: Sent = ${count}, Received = ${received}, Lost = ${count - received} (${Math.round((count - received) / count * 100)}% loss),`);

        if (times.length > 0) {
            const minTime = Math.min(...times);
            const maxTime = Math.max(...times);
            const avgTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
            lines.push('Approximate round trip times in milli-seconds:');
            lines.push(`    Minimum = ${minTime}ms, Maximum = ${maxTime}ms, Average = ${avgTime}ms`);
        }

        return { success: true, output: lines.join('\n') };
    }

    private handleTracerouteCommand(args: string[]): CommandResult {
        const destination = args[0];

        if (!destination) {
            return { success: false, output: '', error: 'Usage: traceroute <destination>' };
        }

        const lines: string[] = [];
        lines.push(`Tracing route to ${destination} over a maximum of 30 hops:`);
        lines.push('');

        // Simulate traceroute
        const hops = Math.floor(Math.random() * 5) + 3;

        for (let i = 1; i <= hops; i++) {
            const hopIP = `10.${i}.${Math.floor(Math.random() * 255)}.1`;
            const time1 = Math.floor(Math.random() * 10) + 1;
            const time2 = Math.floor(Math.random() * 10) + 1;
            const time3 = Math.floor(Math.random() * 10) + 1;

            if (i === hops) {
                lines.push(`  ${i}    ${time1} ms    ${time2} ms    ${time3} ms  ${destination}`);
            } else {
                lines.push(`  ${i}    ${time1} ms    ${time2} ms    ${time3} ms  ${hopIP}`);
            }
        }

        lines.push('');
        lines.push('Trace complete.');

        return { success: true, output: lines.join('\n') };
    }

    private handleIpConfigCommand(args: string[]): CommandResult {
        const showAll = args.includes('/all') || args.includes('-a');
        const lines: string[] = [];

        lines.push('');
        lines.push(`${this.hostname} Configuration`);
        lines.push('');

        for (const [name, intf] of this.interfaces) {
            lines.push(`Ethernet adapter ${name}:`);
            lines.push('');

            if (intf.status === 'admin-down') {
                lines.push('   Media State . . . . . . . . . . . : Media disconnected');
            } else {
                lines.push(`   Connection-specific DNS Suffix  . : local`);

                if (showAll) {
                    lines.push(`   Description . . . . . . . . . . . : Virtual Network Adapter`);
                    lines.push(`   Physical Address. . . . . . . . . : ${intf.macAddress.toString()}`);
                    lines.push(`   DHCP Enabled. . . . . . . . . . . : No`);
                }

                if (intf.ipAddress) {
                    lines.push(`   IPv4 Address. . . . . . . . . . . : ${new IPv4AddressUtil(intf.ipAddress.octets).toString()}`);
                    if (intf.subnetMask) {
                        lines.push(`   Subnet Mask . . . . . . . . . . . : ${new IPv4AddressUtil(intf.subnetMask.octets).toString()}`);
                    }
                    if (this.defaultGateway) {
                        lines.push(`   Default Gateway . . . . . . . . . : ${this.defaultGateway}`);
                    }
                } else {
                    lines.push('   Autoconfiguration IPv4 Address. . : Not configured');
                }

                if (showAll && this.dnsServers.length > 0) {
                    lines.push(`   DNS Servers . . . . . . . . . . . : ${this.dnsServers.join(', ')}`);
                }
            }
            lines.push('');
        }

        return { success: true, output: lines.join('\n') };
    }

    private handleSetCommand(args: string[]): CommandResult {
        const subCmd = args[0]?.toLowerCase();

        if (subCmd === 'ip') {
            const ip = args[1];
            const mask = args[2] || '255.255.255.0';
            const gateway = args[3];

            if (!ip) {
                return { success: false, output: '', error: 'Usage: set ip <address> [mask] [gateway]' };
            }

            try {
                const intf = Array.from(this.interfaces.values())[0];
                if (intf) {
                    intf.ipAddress = new IPv4AddressUtil(ip);
                    intf.subnetMask = new IPv4AddressUtil(mask);
                    intf.status = 'up';

                    if (gateway) {
                        this.defaultGateway = gateway;
                    }
                }
                return { success: true, output: `IP address set to ${ip}/${mask}${gateway ? `, gateway ${gateway}` : ''}` };
            } catch (e) {
                return { success: false, output: '', error: `Invalid IP configuration: ${e}` };
            }
        }

        if (subCmd === 'gateway') {
            const gateway = args[1];
            if (!gateway) {
                return { success: false, output: '', error: 'Usage: set gateway <address>' };
            }
            this.defaultGateway = gateway;
            return { success: true, output: `Default gateway set to ${gateway}` };
        }

        if (subCmd === 'dns') {
            const dns = args.slice(1);
            if (dns.length === 0) {
                return { success: false, output: '', error: 'Usage: set dns <server1> [server2...]' };
            }
            this.dnsServers = dns;
            return { success: true, output: `DNS servers set to ${dns.join(', ')}` };
        }

        return { success: false, output: '', error: `Unknown set command: ${subCmd}` };
    }

    private handleClearCommand(args: string[]): CommandResult {
        const subCmd = args[0]?.toLowerCase();

        if (subCmd === 'arp') {
            this.clearArpTable();
            return { success: true, output: 'ARP cache cleared.' };
        }

        if (subCmd === 'ip') {
            const intf = Array.from(this.interfaces.values())[0];
            if (intf) {
                intf.ipAddress = undefined;
                intf.subnetMask = undefined;
            }
            this.defaultGateway = undefined;
            return { success: true, output: 'IP configuration cleared.' };
        }

        return { success: false, output: '', error: `Unknown clear command: ${subCmd}` };
    }

    private handleArpCommand(args: string[]): CommandResult {
        const subCmd = args[0];

        if (subCmd === '-a' || subCmd === '-all' || !subCmd) {
            return { success: true, output: this.getArpTableOutput() };
        }

        if (subCmd === '-d') {
            const ip = args[1];
            if (ip) {
                this.arpTable.delete(ip);
                return { success: true, output: `Deleted ARP entry for ${ip}` };
            }
            this.clearArpTable();
            return { success: true, output: 'ARP cache cleared.' };
        }

        return { success: false, output: '', error: 'Usage: arp [-a|-d [ip]]' };
    }

    private handleNetstatCommand(args: string[]): CommandResult {
        const lines: string[] = [];
        lines.push('');
        lines.push('Active Connections');
        lines.push('');
        lines.push('  Proto  Local Address          Foreign Address        State');
        lines.push('  TCP    127.0.0.1:135          0.0.0.0:0              LISTENING');
        lines.push('  TCP    127.0.0.1:445          0.0.0.0:0              LISTENING');
        lines.push('');
        return { success: true, output: lines.join('\n') };
    }

    // ==================== Utilities ====================

    private isLocalNetwork(destination: string): boolean {
        try {
            const destIP = new IPv4AddressUtil(destination);
            const intf = Array.from(this.interfaces.values())[0];

            if (!intf?.ipAddress || !intf?.subnetMask) return false;

            const myNetwork = new IPv4AddressUtil(intf.ipAddress.octets)
                .applyMask(new IPv4AddressUtil(intf.subnetMask.octets));
            const mask = new IPv4AddressUtil(intf.subnetMask.octets);

            return destIP.isInSubnet(myNetwork, mask);
        } catch {
            return false;
        }
    }

    getConfig(): Record<string, unknown> {
        return {
            ...super.getConfig(),
            defaultGateway: this.defaultGateway,
            dnsServers: this.dnsServers,
        };
    }

    setConfig(config: Record<string, unknown>): void {
        super.setConfig(config);
        if (config.defaultGateway && typeof config.defaultGateway === 'string') {
            this.defaultGateway = config.defaultGateway;
        }
        if (Array.isArray(config.dnsServers)) {
            this.dnsServers = config.dnsServers as string[];
        }
    }
}
