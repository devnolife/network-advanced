// Base Device Class

import { v4 as uuidv4 } from 'uuid';
import { MACAddressUtil, IPv4AddressUtil } from '../core/Packet';
import type { NetworkDevice } from '../core/Simulator';
import type {
    DeviceType,
    NetworkInterface,
    CommandResult,
    CLIContext,
} from '../core/types';
import { Packet } from '../core/Packet';

export abstract class BaseDevice implements NetworkDevice {
    id: string;
    type: DeviceType;
    name: string;
    hostname: string;
    status: 'online' | 'offline' | 'booting';
    position: { x: number; y: number };
    interfaces: Map<string, NetworkInterface>;
    protected cliContext: CLIContext;
    protected commandHistory: string[];
    protected config: Record<string, unknown>;
    protected arpTable: Map<string, { mac: string; interface: string; age: number }>;

    constructor(
        type: DeviceType,
        name: string,
        hostname: string,
        position: { x: number; y: number } = { x: 0, y: 0 }
    ) {
        this.id = uuidv4();
        this.type = type;
        this.name = name;
        this.hostname = hostname;
        this.status = 'offline';
        this.position = position;
        this.interfaces = new Map();
        this.cliContext = { mode: 'user' };
        this.commandHistory = [];
        this.config = {};
        this.arpTable = new Map();
    }

    // ==================== Lifecycle Methods ====================

    initialize(): void {
        this.status = 'online';
        this.cliContext = { mode: 'user' };
    }

    shutdown(): void {
        this.status = 'offline';
        this.cliContext = { mode: 'user' };
    }

    // ==================== Interface Management ====================

    addInterface(name: string, macAddress?: string): NetworkInterface {
        const mac = macAddress
            ? new MACAddressUtil(macAddress)
            : MACAddressUtil.generateRandom();

        const intf: NetworkInterface = {
            id: uuidv4(),
            name,
            macAddress: mac,
            status: 'admin-down',
            speed: 1000,
            mtu: 1500,
        };

        this.interfaces.set(name, intf);
        return intf;
    }

    configureInterface(
        name: string,
        ipAddress: string,
        subnetMask: string
    ): boolean {
        const intf = this.interfaces.get(name);
        if (!intf) return false;

        try {
            intf.ipAddress = new IPv4AddressUtil(ipAddress);
            intf.subnetMask = new IPv4AddressUtil(subnetMask);
            return true;
        } catch {
            return false;
        }
    }

    setInterfaceStatus(name: string, status: 'up' | 'down' | 'admin-down'): boolean {
        const intf = this.interfaces.get(name);
        if (!intf) return false;

        intf.status = status;
        return true;
    }

    getInterfaceByIP(ipAddress: string): NetworkInterface | undefined {
        const targetIP = new IPv4AddressUtil(ipAddress);
        for (const [, intf] of this.interfaces) {
            if (intf.ipAddress && new IPv4AddressUtil(intf.ipAddress.octets).equals(targetIP)) {
                return intf;
            }
        }
        return undefined;
    }

    // ==================== ARP Operations ====================

    updateArpTable(ipAddress: string, macAddress: string, interfaceName: string): void {
        this.arpTable.set(ipAddress, {
            mac: macAddress,
            interface: interfaceName,
            age: 0,
        });
    }

    getArpEntry(ipAddress: string): { mac: string; interface: string } | undefined {
        return this.arpTable.get(ipAddress);
    }

    clearArpTable(): void {
        this.arpTable.clear();
    }

    // ==================== Command Processing ====================

    executeCommand(command: string): CommandResult {
        this.commandHistory.push(command);
        const trimmedCmd = command.trim().toLowerCase();

        if (!trimmedCmd) {
            return { success: true, output: '' };
        }

        // Common commands available to all devices
        const result = this.processCommonCommand(trimmedCmd);
        if (result) return result;

        // Device-specific commands
        return this.processDeviceCommand(command);
    }

    protected processCommonCommand(command: string): CommandResult | null {
        const parts = command.split(/\s+/);
        const baseCmd = parts[0];

        // Mode transitions
        if (baseCmd === 'enable') {
            if (this.cliContext.mode === 'user') {
                this.cliContext.mode = 'privileged';
                return { success: true, output: '', promptChange: `${this.hostname}#` };
            }
            return { success: false, output: '', error: 'Already in privileged mode' };
        }

        if (baseCmd === 'disable') {
            if (this.cliContext.mode === 'privileged') {
                this.cliContext.mode = 'user';
                return { success: true, output: '', promptChange: `${this.hostname}>` };
            }
            return { success: true, output: '' };
        }

        if (baseCmd === 'exit') {
            return this.handleExitCommand();
        }

        if (baseCmd === 'end') {
            this.cliContext = { mode: 'privileged' };
            return { success: true, output: '', promptChange: `${this.hostname}#` };
        }

        if (command === 'configure terminal' || command === 'conf t') {
            if (this.cliContext.mode === 'privileged') {
                this.cliContext.mode = 'config';
                return { success: true, output: 'Enter configuration commands, one per line.  End with CNTL/Z.', promptChange: `${this.hostname}(config)#` };
            }
            return { success: false, output: '', error: 'Not in privileged mode' };
        }

        // Show commands
        if (baseCmd === 'show') {
            return this.handleShowCommand(parts.slice(1));
        }

        // Help command
        if (baseCmd === '?' || baseCmd === 'help') {
            return this.handleHelpCommand();
        }

        return null;
    }

    protected handleExitCommand(): CommandResult {
        switch (this.cliContext.mode) {
            case 'config-if':
                this.cliContext.mode = 'config';
                this.cliContext.currentInterface = undefined;
                return { success: true, output: '', promptChange: `${this.hostname}(config)#` };
            case 'config-line':
            case 'config-router':
            case 'config-acl':
            case 'config-crypto':
            case 'config-isakmp':
                this.cliContext.mode = 'config';
                return { success: true, output: '', promptChange: `${this.hostname}(config)#` };
            case 'config':
                this.cliContext.mode = 'privileged';
                return { success: true, output: '', promptChange: `${this.hostname}#` };
            case 'privileged':
                this.cliContext.mode = 'user';
                return { success: true, output: '', promptChange: `${this.hostname}>` };
            default:
                return { success: true, output: '' };
        }
    }

    protected handleShowCommand(args: string[]): CommandResult {
        const subCommand = args.join(' ');

        if (subCommand === 'version' || subCommand === 'ver') {
            return {
                success: true,
                output: this.getVersionInfo(),
            };
        }

        if (subCommand === 'ip interface brief' || subCommand === 'ip int brief') {
            return {
                success: true,
                output: this.getInterfaceBrief(),
            };
        }

        if (subCommand === 'ip arp' || subCommand === 'arp') {
            return {
                success: true,
                output: this.getArpTableOutput(),
            };
        }

        if (subCommand === 'running-config' || subCommand === 'run') {
            return {
                success: true,
                output: this.getRunningConfig(),
            };
        }

        if (subCommand === 'history') {
            return {
                success: true,
                output: this.commandHistory.map((cmd, i) => `  ${i + 1}  ${cmd}`).join('\n'),
            };
        }

        return { success: false, output: '', error: `Unknown show command: ${subCommand}` };
    }

    protected handleHelpCommand(): CommandResult {
        const helpText = this.getContextHelp();
        return { success: true, output: helpText };
    }

    protected getContextHelp(): string {
        const commonCommands = `
Exec commands:
  enable        Turn on privileged commands
  disable       Turn off privileged mode command
  exit          Exit from the EXEC
  help          Description of the interactive help system
  show          Show running system information
`;

        switch (this.cliContext.mode) {
            case 'user':
                return commonCommands;
            case 'privileged':
                return commonCommands + `
  configure terminal    Enter configuration mode
  clear                 Reset functions
  ping                  Send echo messages
  traceroute            Trace route to destination
  reload                Halt and perform a cold restart
`;
            case 'config':
                return `
Configuration commands:
  interface     Select an interface to configure
  hostname      Set system's network name
  ip            Global IP configuration subcommands
  crypto        Encryption module configuration
  access-list   Add an access list entry
  exit          Exit from configure mode
  end           Exit from configure mode to privileged mode
`;
            default:
                return 'Type ? for a list of available commands';
        }
    }

    // ==================== Output Formatters ====================

    protected getVersionInfo(): string {
        return `
${this.type.toUpperCase()} Software
  Name: ${this.name}
  Hostname: ${this.hostname}
  Type: ${this.type}
  Status: ${this.status}
  Interfaces: ${this.interfaces.size}

Network Security Virtual Lab Simulator
Version 1.0.0
`;
    }

    protected getInterfaceBrief(): string {
        const lines: string[] = [];
        lines.push('Interface                  IP-Address      OK? Method Status                Protocol');

        for (const [name, intf] of this.interfaces) {
            const ip = intf.ipAddress ? new IPv4AddressUtil(intf.ipAddress.octets).toString() : 'unassigned';
            const ok = intf.ipAddress ? 'YES' : 'NO';
            const method = intf.ipAddress ? 'manual' : 'unset';
            const status = intf.status === 'up' ? 'up' : 'down';
            const protocol = intf.status === 'up' && intf.connectedTo ? 'up' : 'down';

            lines.push(
                `${name.padEnd(26)} ${ip.padEnd(15)} ${ok.padEnd(3)} ${method.padEnd(6)} ${status.padEnd(21)} ${protocol}`
            );
        }

        return lines.join('\n');
    }

    protected getArpTableOutput(): string {
        if (this.arpTable.size === 0) {
            return 'No ARP entries found.';
        }

        const lines: string[] = [];
        lines.push('Protocol  Address          Age (min)   Hardware Addr   Type   Interface');

        for (const [ip, entry] of this.arpTable) {
            lines.push(
                `Internet  ${ip.padEnd(16)} ${String(entry.age).padEnd(11)} ${entry.mac.padEnd(15)} ARPA   ${entry.interface}`
            );
        }

        return lines.join('\n');
    }

    protected getRunningConfig(): string {
        const lines: string[] = [];
        lines.push('Building configuration...');
        lines.push('');
        lines.push('Current configuration:');
        lines.push('!');
        lines.push(`hostname ${this.hostname}`);
        lines.push('!');

        // Interfaces
        for (const [name, intf] of this.interfaces) {
            lines.push(`interface ${name}`);
            if (intf.ipAddress && intf.subnetMask) {
                lines.push(` ip address ${new IPv4AddressUtil(intf.ipAddress.octets).toString()} ${new IPv4AddressUtil(intf.subnetMask.octets).toString()}`);
            }
            if (intf.status === 'admin-down') {
                lines.push(' shutdown');
            }
            lines.push('!');
        }

        lines.push('end');
        return lines.join('\n');
    }

    // ==================== Abstract Methods ====================

    abstract processPacket(packet: Packet, inInterface: string): void;
    abstract processDeviceCommand(command: string): CommandResult;

    // ==================== Configuration ====================

    getConfig(): Record<string, unknown> {
        return {
            ...this.config,
            hostname: this.hostname,
            interfaces: Object.fromEntries(this.interfaces),
        };
    }

    setConfig(config: Record<string, unknown>): void {
        this.config = { ...this.config, ...config };
        if (config.hostname && typeof config.hostname === 'string') {
            this.hostname = config.hostname;
        }
    }

    // ==================== Utilities ====================

    getCurrentPrompt(): string {
        switch (this.cliContext.mode) {
            case 'user':
                return `${this.hostname}>`;
            case 'privileged':
                return `${this.hostname}#`;
            case 'config':
                return `${this.hostname}(config)#`;
            case 'config-if':
                return `${this.hostname}(config-if)#`;
            case 'config-line':
                return `${this.hostname}(config-line)#`;
            case 'config-router':
                return `${this.hostname}(config-router)#`;
            case 'config-acl':
                return `${this.hostname}(config-acl)#`;
            case 'config-crypto':
                return `${this.hostname}(config-crypto-map)#`;
            case 'config-isakmp':
                return `${this.hostname}(config-isakmp)#`;
            default:
                return `${this.hostname}>`;
        }
    }
}
