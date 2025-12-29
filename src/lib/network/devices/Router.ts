// Virtual Router Implementation

import { BaseDevice } from './Device';
import { Packet, IPv4AddressUtil, MACAddressUtil, PacketFactory } from '../core/Packet';
import type {
    CommandResult,
    RouteEntry,
    ACL,
    ACLRule,
    IPSecConfig,
    IPSecSA,
    IKEConfig,
    NATRule,
    NATTranslation,
    IPv4Address,
    IPPacket,
    TCPSegment,
    UDPDatagram,
} from '../core/types';

interface IPSecTunnel {
    id: string;
    peerAddress: string;
    localNetwork: { address: string; mask: string };
    remoteNetwork: { address: string; mask: string };
    status: 'down' | 'negotiating' | 'up';
    ikePhase1Complete: boolean;
    ikePhase2Complete: boolean;
    sa?: IPSecSA;
    packetsEncrypted: number;
    packetsDecrypted: number;
    bytesEncrypted: number;
    bytesDecrypted: number;
    createdAt: number;
    lastActivity: number;
}

interface CryptoMap {
    name: string;
    sequence: number;
    peer: string;
    transformSet: string;
    aclName: string;
}

interface TransformSet {
    name: string;
    encapsulation: 'esp' | 'ah';
    encryption: string;
    hash: string;
    mode: 'tunnel' | 'transport';
}

export class VirtualRouter extends BaseDevice {
    private routingTable: RouteEntry[];
    private staticRoutes: RouteEntry[];
    private accessLists: Map<string, ACL>;
    private ipsecTunnels: Map<string, IPSecTunnel>;
    private ikePolicy: Map<number, IKEConfig>;
    private isakmpKeys: Map<string, string>;
    private cryptoMaps: Map<string, CryptoMap[]>;
    private transformSets: Map<string, TransformSet>;
    private natRules: NATRule[];
    private natTranslations: Map<string, NATTranslation>;
    private interfaceAcls: Map<string, { in?: string; out?: string }>;
    private interfaceCryptoMap: Map<string, string>;

    constructor(name: string, hostname: string, position?: { x: number; y: number }) {
        super('router', name, hostname, position);
        this.routingTable = [];
        this.staticRoutes = [];
        this.accessLists = new Map();
        this.ipsecTunnels = new Map();
        this.ikePolicy = new Map();
        this.isakmpKeys = new Map();
        this.cryptoMaps = new Map();
        this.transformSets = new Map();
        this.natRules = [];
        this.natTranslations = new Map();
        this.interfaceAcls = new Map();
        this.interfaceCryptoMap = new Map();

        // Initialize default interfaces
        this.addInterface('GigabitEthernet0/0');
        this.addInterface('GigabitEthernet0/1');
        this.addInterface('GigabitEthernet0/2');
    }

    initialize(): void {
        super.initialize();
        this.rebuildRoutingTable();
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

        // Decrement TTL
        ipPacket.ttl--;
        if (ipPacket.ttl <= 0) {
            packet.drop('TTL expired');
            return;
        }

        // Check inbound ACL
        const inAcl = this.interfaceAcls.get(inInterface)?.in;
        if (inAcl && !this.evaluateAcl(inAcl, ipPacket, 'in')) {
            packet.drop('Denied by ACL');
            return;
        }

        // Check if packet needs IPSec decryption
        if (ipPacket.protocol === 50 || ipPacket.protocol === 51) {
            this.decryptPacket(packet);
        }

        // Check for NAT translation
        this.applyNat(packet, 'inside-to-outside');

        // Route the packet
        this.routePacket(packet);
    }

    private handleArpPacket(packet: Packet, inInterface: string): void {
        // ARP handling logic
        const arp = packet.frame.payload as import('../core/types').ARPPacket;

        if (arp.opcode === 'request') {
            // Check if we have the requested IP
            const intf = this.interfaces.get(inInterface);
            if (intf?.ipAddress) {
                const myIP = new IPv4AddressUtil(intf.ipAddress.octets);
                const targetIP = new IPv4AddressUtil(arp.targetIP.octets);

                if (myIP.equals(targetIP)) {
                    // Send ARP reply
                    const reply = PacketFactory.createARPReply(
                        intf.macAddress,
                        intf.ipAddress,
                        arp.senderMAC,
                        arp.senderIP
                    );
                    // Queue reply for transmission
                }
            }
        } else if (arp.opcode === 'reply') {
            // Update ARP table
            this.updateArpTable(
                new IPv4AddressUtil(arp.senderIP.octets).toString(),
                new MACAddressUtil(arp.senderMAC.bytes).toString(),
                inInterface
            );
        }
    }

    private routePacket(packet: Packet): void {
        const ipPacket = packet.frame.payload as IPPacket;
        const destIP = new IPv4AddressUtil(ipPacket.destinationIP.octets);

        // Find matching route
        const route = this.findRoute(destIP);
        if (!route) {
            packet.drop('No route to host');
            return;
        }

        // Check if destination is directly connected
        const outInterface = this.interfaces.get(route.interface);
        if (!outInterface) {
            packet.drop('Output interface not found');
            return;
        }

        // Check outbound ACL
        const outAcl = this.interfaceAcls.get(route.interface)?.out;
        if (outAcl && !this.evaluateAcl(outAcl, ipPacket, 'out')) {
            packet.drop('Denied by ACL');
            return;
        }

        // Check if packet needs IPSec encryption
        const cryptoMapName = this.interfaceCryptoMap.get(route.interface);
        if (cryptoMapName) {
            this.encryptPacket(packet, cryptoMapName);
        }

        // Forward packet (this would be handled by the simulator)
        packet.addHop(this.id);
    }

    private findRoute(destIP: IPv4AddressUtil): RouteEntry | undefined {
        let bestRoute: RouteEntry | undefined;
        let longestPrefix = -1;

        for (const route of this.routingTable) {
            const network = new IPv4AddressUtil(route.destination.octets);
            const mask = new IPv4AddressUtil(route.mask.octets);

            if (destIP.isInSubnet(network, mask)) {
                // Count prefix length
                const maskNum = mask.toNumber();
                let prefix = 0;
                for (let i = 31; i >= 0; i--) {
                    if (maskNum & (1 << i)) prefix++;
                    else break;
                }

                if (prefix > longestPrefix) {
                    longestPrefix = prefix;
                    bestRoute = route;
                }
            }
        }

        return bestRoute;
    }

    private rebuildRoutingTable(): void {
        this.routingTable = [];

        // Add connected routes
        for (const [intfName, intf] of this.interfaces) {
            if (intf.ipAddress && intf.subnetMask && intf.status === 'up') {
                const network = new IPv4AddressUtil(intf.ipAddress.octets)
                    .applyMask(new IPv4AddressUtil(intf.subnetMask.octets));

                this.routingTable.push({
                    destination: network,
                    mask: new IPv4AddressUtil(intf.subnetMask.octets),
                    interface: intfName,
                    metric: 0,
                    source: 'connected',
                    administrativeDistance: 0,
                    lastUpdate: Date.now(),
                });
            }
        }

        // Add static routes
        this.routingTable.push(...this.staticRoutes);

        // Sort by administrative distance and metric
        this.routingTable.sort((a, b) => {
            if (a.administrativeDistance !== b.administrativeDistance) {
                return a.administrativeDistance - b.administrativeDistance;
            }
            return a.metric - b.metric;
        });
    }

    // ==================== ACL Processing ====================

    private evaluateAcl(aclName: string, packet: IPPacket, direction: 'in' | 'out'): boolean {
        const acl = this.accessLists.get(aclName);
        if (!acl) return true; // No ACL = permit

        for (const rule of acl.rules) {
            if (this.matchAclRule(rule, packet)) {
                rule.matches++;
                return rule.action === 'permit';
            }
        }

        // Implicit deny
        return false;
    }

    private matchAclRule(rule: ACLRule, packet: IPPacket): boolean {
        // Check source address
        if (rule.sourceAddress && rule.sourceMask) {
            const srcIP = new IPv4AddressUtil(packet.sourceIP.octets);
            const ruleNet = new IPv4AddressUtil(rule.sourceAddress.octets);
            const ruleMask = new IPv4AddressUtil(rule.sourceMask.octets);

            if (!srcIP.isInSubnet(ruleNet, ruleMask)) {
                return false;
            }
        }

        // Check destination address
        if (rule.destinationAddress && rule.destinationMask) {
            const dstIP = new IPv4AddressUtil(packet.destinationIP.octets);
            const ruleNet = new IPv4AddressUtil(rule.destinationAddress.octets);
            const ruleMask = new IPv4AddressUtil(rule.destinationMask.octets);

            if (!dstIP.isInSubnet(ruleNet, ruleMask)) {
                return false;
            }
        }

        // Check protocol
        if (rule.protocol !== 'ip' && typeof rule.protocol === 'number') {
            if (packet.protocol !== rule.protocol) {
                return false;
            }
        }

        // Check ports for TCP/UDP
        if (packet.protocol === 6 || packet.protocol === 17) {
            const transport = packet.payload as TCPSegment | UDPDatagram;

            if (rule.sourcePort) {
                if (!this.matchPort(transport.sourcePort, rule.sourcePort)) {
                    return false;
                }
            }

            if (rule.destinationPort) {
                if (!this.matchPort(transport.destinationPort, rule.destinationPort)) {
                    return false;
                }
            }
        }

        return true;
    }

    private matchPort(port: number, rule: { operator: string; values: number[] }): boolean {
        switch (rule.operator) {
            case 'eq':
                return port === rule.values[0];
            case 'lt':
                return port < rule.values[0];
            case 'gt':
                return port > rule.values[0];
            case 'range':
                return port >= rule.values[0] && port <= rule.values[1];
            default:
                return false;
        }
    }

    // ==================== IPSec Operations ====================

    private encryptPacket(packet: Packet, cryptoMapName: string): void {
        const cryptoMaps = this.cryptoMaps.get(cryptoMapName);
        if (!cryptoMaps?.length) return;

        const ipPacket = packet.frame.payload as IPPacket;

        // Find matching crypto map entry
        for (const cryptoMap of cryptoMaps) {
            const acl = this.accessLists.get(cryptoMap.aclName);
            if (!acl) continue;

            // Check if packet matches crypto ACL
            if (this.evaluateAcl(cryptoMap.aclName, ipPacket, 'out')) {
                const tunnel = Array.from(this.ipsecTunnels.values()).find(
                    t => t.peerAddress === cryptoMap.peer && t.status === 'up'
                );

                if (tunnel && tunnel.sa) {
                    // Simulate encryption
                    tunnel.packetsEncrypted++;
                    tunnel.bytesEncrypted += packet.getSize();
                    tunnel.lastActivity = Date.now();

                    // In a real implementation, we would encrypt the packet here
                    // For simulation, we just mark it as encrypted
                    (packet as unknown as { encrypted: boolean }).encrypted = true;
                }
                break;
            }
        }
    }

    private decryptPacket(packet: Packet): void {
        const ipPacket = packet.frame.payload as IPPacket;
        const srcIP = new IPv4AddressUtil(ipPacket.sourceIP.octets).toString();

        // Find matching tunnel
        const tunnel = Array.from(this.ipsecTunnels.values()).find(
            t => t.peerAddress === srcIP && t.status === 'up'
        );

        if (tunnel && tunnel.sa) {
            tunnel.packetsDecrypted++;
            tunnel.bytesDecrypted += packet.getSize();
            tunnel.lastActivity = Date.now();

            // Simulate decryption
            (packet as unknown as { encrypted: boolean }).encrypted = false;
        }
    }

    // ==================== NAT Operations ====================

    private applyNat(packet: Packet, direction: 'inside-to-outside' | 'outside-to-inside'): void {
        // NAT implementation would go here
        // For now, this is a placeholder
    }

    // ==================== CLI Command Processing ====================

    processDeviceCommand(command: string): CommandResult {
        const parts = command.trim().split(/\s+/);
        const baseCmd = parts[0].toLowerCase();

        // Config mode commands
        if (this.cliContext.mode === 'config') {
            return this.processConfigCommand(command);
        }

        if (this.cliContext.mode === 'config-if') {
            return this.processInterfaceCommand(command);
        }

        if (this.cliContext.mode === 'config-isakmp') {
            return this.processIsakmpCommand(command);
        }

        if (this.cliContext.mode === 'config-crypto') {
            return this.processCryptoMapCommand(command);
        }

        // Privileged mode commands
        if (baseCmd === 'ping') {
            return this.handlePingCommand(parts.slice(1));
        }

        if (baseCmd === 'show') {
            return this.handleRouterShowCommand(parts.slice(1));
        }

        if (command.startsWith('ip route')) {
            return this.handleStaticRouteCommand(parts.slice(2));
        }

        return { success: false, output: '', error: `Unknown command: ${command}` };
    }

    private processConfigCommand(command: string): CommandResult {
        const parts = command.trim().split(/\s+/);
        const baseCmd = parts[0].toLowerCase();

        if (baseCmd === 'interface' || baseCmd === 'int') {
            const intfName = parts.slice(1).join(' ');
            if (this.interfaces.has(intfName)) {
                this.cliContext.mode = 'config-if';
                this.cliContext.currentInterface = intfName;
                return { success: true, output: '', promptChange: `${this.hostname}(config-if)#` };
            }

            // Try to create the interface
            this.addInterface(intfName);
            this.cliContext.mode = 'config-if';
            this.cliContext.currentInterface = intfName;
            return { success: true, output: '', promptChange: `${this.hostname}(config-if)#` };
        }

        if (baseCmd === 'hostname') {
            const newHostname = parts[1];
            if (newHostname) {
                this.hostname = newHostname;
                return { success: true, output: '', promptChange: `${newHostname}(config)#` };
            }
            return { success: false, output: '', error: 'Hostname required' };
        }

        if (command.startsWith('ip route')) {
            return this.handleStaticRouteCommand(parts.slice(2));
        }

        if (command.startsWith('access-list')) {
            return this.handleAccessListCommand(parts.slice(1));
        }

        if (command.startsWith('crypto isakmp policy')) {
            const policyNum = parseInt(parts[3]);
            if (isNaN(policyNum)) {
                return { success: false, output: '', error: 'Invalid policy number' };
            }
            this.cliContext.mode = 'config-isakmp';
            return { success: true, output: '', promptChange: `${this.hostname}(config-isakmp)#` };
        }

        if (command.startsWith('crypto isakmp key')) {
            const key = parts[3];
            const address = parts[5];
            if (key && address) {
                this.isakmpKeys.set(address, key);
                return { success: true, output: '' };
            }
            return { success: false, output: '', error: 'Invalid ISAKMP key command' };
        }

        if (command.startsWith('crypto ipsec transform-set')) {
            const setName = parts[3];
            // Parse transform set parameters
            const ts: TransformSet = {
                name: setName,
                encapsulation: 'esp',
                encryption: 'aes-256',
                hash: 'sha256',
                mode: 'tunnel',
            };
            this.transformSets.set(setName, ts);
            return { success: true, output: '' };
        }

        if (command.startsWith('crypto map')) {
            const mapName = parts[2];
            const sequence = parseInt(parts[3]);
            if (!mapName || isNaN(sequence)) {
                return { success: false, output: '', error: 'Invalid crypto map command' };
            }
            this.cliContext.mode = 'config-crypto';
            this.cliContext.currentCryptoMap = mapName;

            const maps = this.cryptoMaps.get(mapName) || [];
            maps.push({
                name: mapName,
                sequence,
                peer: '',
                transformSet: '',
                aclName: '',
            });
            this.cryptoMaps.set(mapName, maps);

            return { success: true, output: '', promptChange: `${this.hostname}(config-crypto-map)#` };
        }

        return { success: false, output: '', error: `Unknown config command: ${command}` };
    }

    private processInterfaceCommand(command: string): CommandResult {
        const parts = command.trim().split(/\s+/);
        const intf = this.interfaces.get(this.cliContext.currentInterface!);

        if (!intf) {
            return { success: false, output: '', error: 'Interface not found' };
        }

        if (command.startsWith('ip address')) {
            const ip = parts[2];
            const mask = parts[3];
            if (ip && mask) {
                try {
                    intf.ipAddress = new IPv4AddressUtil(ip);
                    intf.subnetMask = new IPv4AddressUtil(mask);
                    this.rebuildRoutingTable();
                    return { success: true, output: '' };
                } catch {
                    return { success: false, output: '', error: 'Invalid IP address or mask' };
                }
            }
            return { success: false, output: '', error: 'IP address and mask required' };
        }

        if (command === 'no shutdown') {
            intf.status = 'up';
            this.rebuildRoutingTable();
            return { success: true, output: `%LINK-3-UPDOWN: Interface ${intf.name}, changed state to up` };
        }

        if (command === 'shutdown') {
            intf.status = 'admin-down';
            this.rebuildRoutingTable();
            return { success: true, output: `%LINK-5-CHANGED: Interface ${intf.name}, changed state to administratively down` };
        }

        if (command.startsWith('crypto map')) {
            const mapName = parts[2];
            this.interfaceCryptoMap.set(intf.name, mapName);
            return { success: true, output: '' };
        }

        if (command.startsWith('ip access-group')) {
            const aclName = parts[2];
            const direction = parts[3] as 'in' | 'out';

            const acls = this.interfaceAcls.get(intf.name) || {};
            acls[direction] = aclName;
            this.interfaceAcls.set(intf.name, acls);

            return { success: true, output: '' };
        }

        return { success: false, output: '', error: `Unknown interface command: ${command}` };
    }

    private processIsakmpCommand(command: string): CommandResult {
        const parts = command.trim().split(/\s+/);

        if (parts[0] === 'encryption') {
            return { success: true, output: '' };
        }

        if (parts[0] === 'hash') {
            return { success: true, output: '' };
        }

        if (parts[0] === 'group') {
            return { success: true, output: '' };
        }

        if (parts[0] === 'lifetime') {
            return { success: true, output: '' };
        }

        if (parts[0] === 'authentication') {
            return { success: true, output: '' };
        }

        return this.handleExitCommand();
    }

    private processCryptoMapCommand(command: string): CommandResult {
        const parts = command.trim().split(/\s+/);
        const mapName = this.cliContext.currentCryptoMap;

        if (!mapName) {
            return { success: false, output: '', error: 'No crypto map selected' };
        }

        const maps = this.cryptoMaps.get(mapName);
        if (!maps?.length) {
            return { success: false, output: '', error: 'Crypto map not found' };
        }

        const currentMap = maps[maps.length - 1];

        if (command.startsWith('set peer')) {
            currentMap.peer = parts[2];
            return { success: true, output: '' };
        }

        if (command.startsWith('set transform-set')) {
            currentMap.transformSet = parts[2];
            return { success: true, output: '' };
        }

        if (command.startsWith('match address')) {
            currentMap.aclName = parts[2];
            return { success: true, output: '' };
        }

        return this.handleExitCommand();
    }

    private handleStaticRouteCommand(args: string[]): CommandResult {
        if (args.length < 3) {
            return { success: false, output: '', error: 'ip route <network> <mask> <next-hop|interface>' };
        }

        try {
            const network = new IPv4AddressUtil(args[0]);
            const mask = new IPv4AddressUtil(args[1]);
            const nextHopOrIntf = args[2];
            const metric = args[3] ? parseInt(args[3]) : 1;

            const route: RouteEntry = {
                destination: network,
                mask,
                interface: '',
                metric,
                source: 'static',
                administrativeDistance: 1,
                lastUpdate: Date.now(),
            };

            // Check if next hop is an IP or interface name
            if (IPv4AddressUtil.isValidAddress(nextHopOrIntf)) {
                route.nextHop = new IPv4AddressUtil(nextHopOrIntf);
                // Find outgoing interface for next hop
                for (const [intfName, intf] of this.interfaces) {
                    if (intf.ipAddress && intf.subnetMask) {
                        const intfNetwork = new IPv4AddressUtil(intf.ipAddress.octets)
                            .applyMask(new IPv4AddressUtil(intf.subnetMask.octets));
                        const nhIP = new IPv4AddressUtil(nextHopOrIntf);
                        if (nhIP.isInSubnet(intfNetwork, new IPv4AddressUtil(intf.subnetMask.octets))) {
                            route.interface = intfName;
                            break;
                        }
                    }
                }
            } else {
                route.interface = nextHopOrIntf;
            }

            this.staticRoutes.push(route);
            this.rebuildRoutingTable();

            return { success: true, output: '' };
        } catch (e) {
            return { success: false, output: '', error: `Invalid route: ${e}` };
        }
    }

    private handleAccessListCommand(args: string[]): CommandResult {
        // Simplified ACL parsing
        const aclId = args[0];
        const action = args[1] as 'permit' | 'deny';
        const protocol = args[2];

        // Create or get ACL
        let acl = this.accessLists.get(aclId);
        if (!acl) {
            acl = {
                id: aclId,
                name: aclId,
                type: isNaN(parseInt(aclId)) || parseInt(aclId) > 99 ? 'extended' : 'standard',
                rules: [],
            };
            this.accessLists.set(aclId, acl);
        }

        const rule: ACLRule = {
            id: acl.rules.length + 1,
            action,
            protocol: protocol as ACLRule['protocol'],
            matches: 0,
        };

        acl.rules.push(rule);
        return { success: true, output: '' };
    }

    private handlePingCommand(args: string[]): CommandResult {
        const destination = args[0];
        if (!destination) {
            return { success: false, output: '', error: 'Usage: ping <destination>' };
        }

        // Simulate ping
        const lines: string[] = [];
        lines.push(`Type escape sequence to abort.`);
        lines.push(`Sending 5, 100-byte ICMP Echos to ${destination}, timeout is 2 seconds:`);

        // Simulate responses
        const route = IPv4AddressUtil.isValidAddress(destination)
            ? this.findRoute(new IPv4AddressUtil(destination))
            : null;

        if (route) {
            lines.push('!!!!!');
            lines.push(`Success rate is 100 percent (5/5), round-trip min/avg/max = 1/2/4 ms`);
        } else {
            lines.push('.....');
            lines.push(`Success rate is 0 percent (0/5)`);
        }

        return { success: true, output: lines.join('\n') };
    }

    private handleRouterShowCommand(args: string[]): CommandResult {
        const subCommand = args.join(' ');

        if (subCommand === 'ip route' || subCommand === 'ip route summary') {
            return { success: true, output: this.getRoutingTableOutput() };
        }

        if (subCommand === 'crypto ipsec sa') {
            return { success: true, output: this.getIPSecSAOutput() };
        }

        if (subCommand === 'crypto isakmp sa') {
            return { success: true, output: this.getIKESAOutput() };
        }

        if (subCommand.startsWith('access-list')) {
            return { success: true, output: this.getAccessListOutput() };
        }

        if (subCommand === 'ip nat translations') {
            return { success: true, output: this.getNatTranslationOutput() };
        }

        // Call parent show handler
        return this.handleShowCommand(args);
    }

    private getRoutingTableOutput(): string {
        const lines: string[] = [];
        lines.push('Codes: C - connected, S - static, R - RIP, O - OSPF, B - BGP');
        lines.push('');

        for (const route of this.routingTable) {
            const dest = new IPv4AddressUtil(route.destination.octets).toString();
            const mask = new IPv4AddressUtil(route.mask.octets).toString();
            const code = route.source === 'connected' ? 'C' : route.source === 'static' ? 'S' : '?';

            let line = `${code}    ${dest}/${this.getMaskPrefix(mask)}`;

            if (route.nextHop) {
                line += ` via ${new IPv4AddressUtil(route.nextHop.octets).toString()}`;
            }
            line += ` is directly connected, ${route.interface}`;

            lines.push(line);
        }

        return lines.join('\n');
    }

    private getMaskPrefix(mask: string): number {
        const maskNum = new IPv4AddressUtil(mask).toNumber();
        let prefix = 0;
        for (let i = 31; i >= 0; i--) {
            if (maskNum & (1 << i)) prefix++;
            else break;
        }
        return prefix;
    }

    private getIPSecSAOutput(): string {
        if (this.ipsecTunnels.size === 0) {
            return 'No IPSec security associations found.';
        }

        const lines: string[] = [];
        lines.push('interface: outside');
        lines.push('    Crypto map tag: MYMAP, local addr: (configured address)');
        lines.push('');

        for (const [, tunnel] of this.ipsecTunnels) {
            lines.push(`   protected vrf: (none)`);
            lines.push(`   local  ident (addr/mask/prot/port): (${tunnel.localNetwork.address}/${tunnel.localNetwork.mask}/0/0)`);
            lines.push(`   remote ident (addr/mask/prot/port): (${tunnel.remoteNetwork.address}/${tunnel.remoteNetwork.mask}/0/0)`);
            lines.push(`   current_peer ${tunnel.peerAddress}`);
            lines.push(`   #pkts encaps: ${tunnel.packetsEncrypted}, #pkts encrypt: ${tunnel.packetsEncrypted}`);
            lines.push(`   #pkts decaps: ${tunnel.packetsDecrypted}, #pkts decrypt: ${tunnel.packetsDecrypted}`);
            lines.push('');
        }

        return lines.join('\n');
    }

    private getIKESAOutput(): string {
        const lines: string[] = [];
        lines.push('IPv4 Crypto ISAKMP SA');
        lines.push('dst             src             state          conn-id status');

        for (const [, tunnel] of this.ipsecTunnels) {
            lines.push(`${tunnel.peerAddress}    (local)         ${tunnel.status.toUpperCase().padEnd(14)} 1       ACTIVE`);
        }

        return lines.join('\n');
    }

    private getAccessListOutput(): string {
        const lines: string[] = [];

        for (const [name, acl] of this.accessLists) {
            lines.push(`${acl.type === 'extended' ? 'Extended' : 'Standard'} IP access list ${name}`);
            for (const rule of acl.rules) {
                lines.push(`    ${rule.id * 10} ${rule.action} ${rule.protocol} (${rule.matches} matches)`);
            }
            lines.push('');
        }

        return lines.join('\n') || 'No access lists configured.';
    }

    private getNatTranslationOutput(): string {
        if (this.natTranslations.size === 0) {
            return 'No NAT translations found.';
        }

        const lines: string[] = [];
        lines.push('Pro Inside global      Inside local       Outside local      Outside global');

        for (const [, trans] of this.natTranslations) {
            lines.push(`${trans.protocol} ${trans.insideGlobal.ip}:${trans.insideGlobal.port || '-'}    ${trans.insideLocal.ip}:${trans.insideLocal.port || '-'}    ---                ---`);
        }

        return lines.join('\n');
    }

    // ==================== Configuration ====================

    getConfig(): Record<string, unknown> {
        return {
            ...super.getConfig(),
            routes: this.routingTable,
            staticRoutes: this.staticRoutes,
            accessLists: Object.fromEntries(this.accessLists),
            ipsecTunnels: Object.fromEntries(this.ipsecTunnels),
            cryptoMaps: Object.fromEntries(this.cryptoMaps),
            transformSets: Object.fromEntries(this.transformSets),
            natRules: this.natRules,
        };
    }
}
