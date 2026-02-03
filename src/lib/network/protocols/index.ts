// Protocol Layer Exports
// Central export file for all network protocol implementations

// IP Protocol
import { IPv4Protocol, IPv4AddressHelper, IP_PROTOCOLS, ETHER_TYPES } from './IP';
export { IPv4Protocol, IPv4AddressHelper, IP_PROTOCOLS, ETHER_TYPES };

// TCP Protocol
import { TCPProtocol, TCPConnectionManager, TCPState, TCP_FLAGS, TCP_PORTS } from './TCP';
export { TCPProtocol, TCPConnectionManager, TCPState, TCP_FLAGS, TCP_PORTS };
export type { TCPConnection } from './TCP';

// UDP Protocol
import { UDPProtocol, UDPSocketManager, UDP_PORTS } from './UDP';
export { UDPProtocol, UDPSocketManager, UDP_PORTS };
export type { UDPSocketOptions, UDPSocketBinding } from './UDP';

// ICMP Protocol
import { 
    ICMPProtocol, 
    PingManager, 
    TracerouteManager, 
    ICMP_TYPES, 
    ICMP_DEST_UNREACHABLE_CODES, 
    ICMP_TIME_EXCEEDED_CODES, 
    ICMP_REDIRECT_CODES 
} from './ICMP';
export { 
    ICMPProtocol, 
    PingManager, 
    TracerouteManager, 
    ICMP_TYPES, 
    ICMP_DEST_UNREACHABLE_CODES, 
    ICMP_TIME_EXCEEDED_CODES, 
    ICMP_REDIRECT_CODES 
};
export type { 
    ICMPEchoData, 
    PingSession, 
    PingReply, 
    PingStatistics, 
    TracerouteHop, 
    TracerouteSession 
} from './ICMP';

// ARP Protocol
import { 
    ARPProtocol, 
    ARPTable, 
    ARPManager, 
    MACAddressHelper, 
    ARPEntryState, 
    ARP_HARDWARE_TYPES, 
    ARP_PROTOCOL_TYPES, 
    ARP_OPCODES 
} from './ARP';
export { 
    ARPProtocol, 
    ARPTable, 
    ARPManager, 
    MACAddressHelper, 
    ARPEntryState, 
    ARP_HARDWARE_TYPES, 
    ARP_PROTOCOL_TYPES, 
    ARP_OPCODES 
};
export type { ARPEntry } from './ARP';

// IPSec Protocol
import { 
    ESPProtocol, 
    AHProtocol, 
    IKEProtocol, 
    IPSecManager, 
    IKEPhase, 
    IKE_EXCHANGE_TYPES, 
    IKE_PAYLOAD_TYPES, 
    IPSEC_PROTOCOLS, 
    ENCRYPTION_ALGORITHMS, 
    AUTH_ALGORITHMS, 
    DH_GROUPS 
} from './IPSec';
export { 
    ESPProtocol, 
    AHProtocol, 
    IKEProtocol, 
    IPSecManager, 
    IKEPhase, 
    IKE_EXCHANGE_TYPES, 
    IKE_PAYLOAD_TYPES, 
    IPSEC_PROTOCOLS, 
    ENCRYPTION_ALGORITHMS, 
    AUTH_ALGORITHMS, 
    DH_GROUPS 
};
export type { IKEHeader, IKESession, SADEntry, SPDEntry } from './IPSec';

// Re-export types from core
export type {
    IPv4Address,
    MACAddress,
    IPPacket,
    TCPSegment,
    UDPDatagram,
    ICMPPacket,
    ARPPacket,
    ESPPacket,
    AHPacket,
    IPSecSA,
    IPSecConfig,
    IKEConfig,
} from '../core/types';

/**
 * Protocol Stack - Unified interface for all protocol operations
 */
export class ProtocolStack {
    public readonly arp: ARPManager;
    public readonly tcp: TCPConnectionManager;
    public readonly udp: UDPSocketManager;
    public readonly ping: PingManager;
    public readonly traceroute: TracerouteManager;
    public readonly ipsec: IPSecManager;

    constructor() {
        this.arp = new ARPManager();
        this.tcp = new TCPConnectionManager();
        this.udp = new UDPSocketManager();
        this.ping = new PingManager();
        this.traceroute = new TracerouteManager();
        this.ipsec = new IPSecManager();
    }

    /**
     * Get protocol statistics
     */
    getStatistics(): {
        arp: ReturnType<ARPTable['getStatistics']>;
        tcp: ReturnType<TCPConnectionManager['getStatistics']>;
        udp: ReturnType<UDPSocketManager['getStatistics']>;
        ipsec: ReturnType<IPSecManager['getStatistics']>;
    } {
        return {
            arp: this.arp.getTable().getStatistics(),
            tcp: this.tcp.getStatistics(),
            udp: this.udp.getStatistics(),
            ipsec: this.ipsec.getStatistics(),
        };
    }

    /**
     * Clear all protocol state
     */
    reset(): void {
        this.arp.clearCache();
        // TCP and UDP connections will be cleaned up by GC
        // IPSec SAs and policies remain
    }
}

// Default export
export default ProtocolStack;
