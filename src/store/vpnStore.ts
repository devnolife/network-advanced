/**
 * VPN/IPSec Zustand Store
 * 
 * State management for the VPN, IKE, and IPSec engines.
 * Network Security Virtual Lab - Educational Platform
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useShallow } from 'zustand/shallow';
import {
  IKEVersion,
  IKEState,
  IKEProposal,
  IKESA,
  IKEMessage,
  IPSecProtocol,
  IPSecMode,
  IPSecState,
  IPSecProposal,
  IPSecSA,
  ESPPacket,
  AHPacket,
  VPNType,
  VPNStatus,
  VPNTunnel,
  VPNEvent,
  VPNConfig,
  VPNStatistics,
  IKE_PROPOSALS,
  IPSEC_PROPOSALS,
} from '@/lib/network/vpn/types';
import {
  IKEEngine,
  getIKEEngine,
  resetIKEEngine,
  IPSecEngine,
  getIPSecEngine,
  resetIPSecEngine,
} from '@/lib/network/vpn';

// ============================================================================
// Store Types
// ============================================================================

interface VPNStoreState {
  // Initialization
  isInitialized: boolean;
  isRunning: boolean;
  
  // Configuration
  config: VPNConfig | null;
  
  // Tunnels
  tunnels: VPNTunnel[];
  selectedTunnelId: string | null;
  
  // IKE SAs
  ikeSAs: IKESA[];
  selectedIKESAId: string | null;
  ikeMessages: IKEMessage[];
  
  // IPSec SAs
  ipsecSAs: IPSecSA[];
  selectedIPSecSAId: string | null;
  
  // Packets (for visualization)
  espPackets: ESPPacket[];
  ahPackets: AHPacket[];
  
  // Events
  events: VPNEvent[];
  
  // Statistics
  statistics: VPNStatistics | null;
  
  // UI State
  activeTab: 'dashboard' | 'tunnels' | 'ike' | 'ipsec' | 'packets' | 'logs' | 'learn';
  showTunnelCreator: boolean;
  showPacketSimulator: boolean;
  negotiationSteps: NegotiationStep[];
  
  // Simulation
  simulationActive: boolean;
  simulationPacket: {
    sourceIP: string;
    destIP: string;
    protocol: string;
    sourcePort?: number;
    destPort?: number;
    payload?: string;
  } | null;
  
  // Actions
  initialize: () => void;
  destroy: () => void;
  start: () => void;
  stop: () => void;
  
  // Configuration
  updateConfig: (config: Partial<VPNConfig>) => void;
  
  // Tunnel Management
  createTunnel: (tunnel: CreateTunnelParams) => Promise<VPNTunnel>;
  deleteTunnel: (tunnelId: string) => void;
  selectTunnel: (id: string | null) => void;
  
  // IKE Operations
  initiateIKE: (tunnelId: string) => Promise<void>;
  rekeyIKE: (saId: string) => Promise<void>;
  deleteIKESA: (saId: string) => void;
  selectIKESA: (id: string | null) => void;
  
  // IPSec Operations
  createIPSecSA: (ikeSAId: string, proposal: IPSecProposal) => void;
  deleteIPSecSA: (saId: string) => void;
  selectIPSecSA: (id: string | null) => void;
  
  // Packet Simulation
  encryptPacket: (packet: SimulationPacket) => ESPPacket | null;
  decryptPacket: (packetId: string) => void;
  setSimulationPacket: (packet: SimulationPacket | null) => void;
  clearPackets: () => void;
  
  // UI
  setActiveTab: (tab: VPNStoreState['activeTab']) => void;
  setShowTunnelCreator: (show: boolean) => void;
  setShowPacketSimulator: (show: boolean) => void;
  
  // Statistics
  refreshStatistics: () => void;
  resetStatistics: () => void;
  
  // Getters
  getTunnelById: (id: string) => VPNTunnel | undefined;
  getIKESAById: (id: string) => IKESA | undefined;
  getIPSecSAById: (id: string) => IPSecSA | undefined;
  getActiveTunnels: () => VPNTunnel[];
  getRecentEvents: (count?: number) => VPNEvent[];
}

// ============================================================================
// Additional Types
// ============================================================================

interface CreateTunnelParams {
  name: string;
  type: VPNType;
  localEndpoint: {
    id: string;
    name: string;
    publicIP: string;
    privateNetwork: string;
  };
  remoteEndpoint: {
    id: string;
    name: string;
    publicIP: string;
    privateNetwork: string;
  };
  ikeProposal: IKEProposal;
  ipsecProposal: IPSecProposal;
  psk: string;
  dpdEnabled?: boolean;
  natTraversal?: boolean;
}

interface SimulationPacket {
  sourceIP: string;
  destIP: string;
  protocol: string;
  sourcePort?: number;
  destPort?: number;
  payload?: string;
}

interface NegotiationStep {
  id: string;
  phase: 'ike_sa_init' | 'ike_auth' | 'child_sa';
  direction: 'sent' | 'received';
  message: string;
  timestamp: number;
  details?: Record<string, unknown>;
  completed: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(): string {
  return `vpn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useVPNStore = create<VPNStoreState>()(
  subscribeWithSelector((set, get) => {
    let ikeEngine = getIKEEngine();
    let ipsecEngine = getIPSecEngine();
    let isListenersSetup = false;

    const setupListeners = () => {
      if (isListenersSetup) return;

      // IKE Events
      ikeEngine.on('event', (data: unknown) => {
        const event = data as VPNEvent;
        set((state) => ({
          events: [event, ...state.events].slice(0, 500),
        }));
        
        // Update negotiation steps for visualization
        if (event.type.startsWith('ike_')) {
          const step: NegotiationStep = {
            id: event.id,
            phase: event.type.includes('sa_init') ? 'ike_sa_init' : 
                   event.type.includes('auth') ? 'ike_auth' : 'child_sa',
            direction: event.type.includes('sent') ? 'sent' : 'received',
            message: event.message,
            timestamp: event.timestamp,
            details: event.details,
            completed: event.type.includes('established'),
          };
          
          set((state) => ({
            negotiationSteps: [...state.negotiationSteps, step].slice(-20),
          }));
        }
      });

      ikeEngine.on('message', (data: unknown) => {
        const message = data as IKEMessage;
        set((state) => ({
          ikeMessages: [...state.ikeMessages, message].slice(-100),
        }));
      });

      ikeEngine.on('stateChange', () => {
        set({ ikeSAs: ikeEngine.getAllSAs() });
      });

      ikeEngine.on('negotiationComplete', (data: { saId: string; tunnelId: string; sa: IKESA }) => {
        // Update tunnel status
        set((state) => {
          const tunnels = state.tunnels.map(t => {
            if (t.id === data.tunnelId) {
              return {
                ...t,
                status: 'established' as VPNStatus,
                ikeSA: data.sa,
                establishedAt: Date.now(),
              };
            }
            return t;
          });
          return { tunnels, ikeSAs: ikeEngine.getAllSAs() };
        });
      });

      ikeEngine.on('saDeleted', (data: { saId: string; tunnelId: string }) => {
        set((state) => {
          const tunnels = state.tunnels.map(t => {
            if (t.id === data.tunnelId) {
              return {
                ...t,
                status: 'down' as VPNStatus,
                ikeSA: undefined,
              };
            }
            return t;
          });
          return { tunnels, ikeSAs: ikeEngine.getAllSAs() };
        });
      });

      // IPSec Events
      ipsecEngine.on('event', (data: unknown) => {
        const event = data as VPNEvent;
        set((state) => ({
          events: [event, ...state.events].slice(0, 500),
        }));
      });

      ipsecEngine.on('saCreated', () => {
        set({ ipsecSAs: ipsecEngine.getAllSAs() });
      });

      ipsecEngine.on('saDeleted', () => {
        set({ ipsecSAs: ipsecEngine.getAllSAs() });
      });

      ipsecEngine.on('packetEncrypted', (data: { sa: IPSecSA; packet: ESPPacket | AHPacket }) => {
        if ('espHeader' in data.packet) {
          set((state) => ({
            espPackets: [...state.espPackets, data.packet as ESPPacket].slice(-100),
          }));
        } else {
          set((state) => ({
            ahPackets: [...state.ahPackets, data.packet as AHPacket].slice(-100),
          }));
        }
      });

      isListenersSetup = true;
    };

    return {
      // Initial state
      isInitialized: false,
      isRunning: false,
      config: null,
      tunnels: [],
      selectedTunnelId: null,
      ikeSAs: [],
      selectedIKESAId: null,
      ikeMessages: [],
      ipsecSAs: [],
      selectedIPSecSAId: null,
      espPackets: [],
      ahPackets: [],
      events: [],
      statistics: null,
      activeTab: 'dashboard',
      showTunnelCreator: false,
      showPacketSimulator: false,
      negotiationSteps: [],
      simulationActive: false,
      simulationPacket: null,

      // Initialization
      initialize: () => {
        if (get().isInitialized) return;

        ikeEngine = getIKEEngine();
        ipsecEngine = getIPSecEngine();
        setupListeners();

        set({
          isInitialized: true,
          config: ikeEngine.getConfig(),
          ikeSAs: ikeEngine.getAllSAs(),
          ipsecSAs: ipsecEngine.getAllSAs(),
          statistics: {
            activeTunnels: 0,
            totalTunnels: 0,
            activeIKESAs: 0,
            activeIPSecSAs: 0,
            packetsEncrypted: 0,
            packetsDecrypted: 0,
            bytesEncrypted: 0,
            bytesDecrypted: 0,
            ikeNegotiationsStarted: 0,
            ikeNegotiationsCompleted: 0,
            ikeNegotiationsFailed: 0,
            rekeyOperations: 0,
            authFailures: 0,
            replayAttacksBlocked: 0,
            startTime: Date.now(),
            lastUpdated: Date.now(),
          },
        });
      },

      destroy: () => {
        if (!get().isInitialized) return;

        resetIKEEngine();
        resetIPSecEngine();
        isListenersSetup = false;

        set({
          isInitialized: false,
          isRunning: false,
          tunnels: [],
          ikeSAs: [],
          ipsecSAs: [],
          events: [],
          ikeMessages: [],
          espPackets: [],
          ahPackets: [],
          negotiationSteps: [],
          statistics: null,
        });
      },

      start: () => {
        if (!get().isInitialized) get().initialize();
        
        ikeEngine.start();
        ipsecEngine.start();
        
        set({ isRunning: true });
      },

      stop: () => {
        ikeEngine.stop();
        ipsecEngine.stop();
        
        set({ isRunning: false });
      },

      // Configuration
      updateConfig: (config) => {
        ikeEngine.updateConfig(config);
        set({ config: ikeEngine.getConfig() });
      },

      // Tunnel Management
      createTunnel: async (params) => {
        const tunnel: VPNTunnel = {
          id: generateId(),
          name: params.name,
          type: params.type,
          status: 'down',
          localEndpoint: params.localEndpoint,
          remoteEndpoint: params.remoteEndpoint,
          ikeProposal: params.ikeProposal,
          ipsecProposal: params.ipsecProposal,
          psk: params.psk.substring(0, 3) + '***', // Mask PSK
          ipsecSAs: [],
          dpdEnabled: params.dpdEnabled ?? true,
          dpdInterval: 30,
          natTraversal: params.natTraversal ?? true,
          createdAt: Date.now(),
          lastActivity: Date.now(),
          uptime: 0,
          packetsIn: 0,
          packetsOut: 0,
          bytesIn: 0,
          bytesOut: 0,
          rekeyCount: 0,
        };

        set((state) => ({
          tunnels: [...state.tunnels, tunnel],
        }));

        // Auto-initiate IKE negotiation
        try {
          tunnel.status = 'connecting';
          set((state) => ({
            tunnels: state.tunnels.map(t => t.id === tunnel.id ? tunnel : t),
          }));

          const ikeSA = await ikeEngine.initiateNegotiation(
            tunnel.id,
            params.localEndpoint.publicIP,
            params.remoteEndpoint.publicIP,
            params.ikeProposal,
            params.psk
          );

          // Create IPSec SAs
          const { inbound, outbound } = ipsecEngine.createSA(
            ikeSA.id,
            params.ipsecProposal,
            params.localEndpoint.publicIP,
            params.remoteEndpoint.publicIP,
            {
              localNetwork: params.localEndpoint.privateNetwork,
              remoteNetwork: params.remoteEndpoint.privateNetwork,
            },
            {
              localIP: params.localEndpoint.publicIP,
              remoteIP: params.remoteEndpoint.publicIP,
            }
          );

          tunnel.ikeSA = ikeSA;
          tunnel.ipsecSAs = [inbound, outbound];
          tunnel.status = 'established';
          tunnel.establishedAt = Date.now();

          set((state) => ({
            tunnels: state.tunnels.map(t => t.id === tunnel.id ? tunnel : t),
            ipsecSAs: ipsecEngine.getAllSAs(),
          }));

          get().refreshStatistics();

        } catch (error) {
          tunnel.status = 'error';
          set((state) => ({
            tunnels: state.tunnels.map(t => t.id === tunnel.id ? tunnel : t),
          }));
        }

        return tunnel;
      },

      deleteTunnel: (tunnelId) => {
        const tunnel = get().tunnels.find(t => t.id === tunnelId);
        if (!tunnel) return;

        // Delete IKE SA if exists
        if (tunnel.ikeSA) {
          ikeEngine.deleteSA(tunnel.ikeSA.id, tunnelId);
          ipsecEngine.deleteSAsForIKE(tunnel.ikeSA.id);
        }

        set((state) => ({
          tunnels: state.tunnels.filter(t => t.id !== tunnelId),
          selectedTunnelId: state.selectedTunnelId === tunnelId ? null : state.selectedTunnelId,
          ipsecSAs: ipsecEngine.getAllSAs(),
        }));

        get().refreshStatistics();
      },

      selectTunnel: (id) => {
        set({ selectedTunnelId: id });
      },

      // IKE Operations
      initiateIKE: async (tunnelId) => {
        const tunnel = get().tunnels.find(t => t.id === tunnelId);
        if (!tunnel) return;

        // Clear old negotiation steps
        set({ negotiationSteps: [] });

        try {
          await ikeEngine.initiateNegotiation(
            tunnelId,
            tunnel.localEndpoint.publicIP,
            tunnel.remoteEndpoint.publicIP,
            tunnel.ikeProposal,
            'preshared-key' // Would get from tunnel config
          );
        } catch (error) {
          console.error('IKE negotiation failed:', error);
        }
      },

      rekeyIKE: async (saId) => {
        const sa = ikeEngine.getSA(saId);
        if (!sa) return;

        // Find tunnel for this SA
        const tunnel = get().tunnels.find(t => t.ikeSA?.id === saId);
        if (!tunnel) return;

        await ikeEngine.initiateRekey(sa, tunnel.id);
        
        set((state) => ({
          tunnels: state.tunnels.map(t => {
            if (t.id === tunnel.id) {
              return { ...t, rekeyCount: t.rekeyCount + 1 };
            }
            return t;
          }),
        }));
      },

      deleteIKESA: (saId) => {
        const sa = ikeEngine.getSA(saId);
        if (!sa) return;

        const tunnel = get().tunnels.find(t => t.ikeSA?.id === saId);
        ikeEngine.deleteSA(saId, tunnel?.id || '');
        ipsecEngine.deleteSAsForIKE(saId);

        set({
          ikeSAs: ikeEngine.getAllSAs(),
          ipsecSAs: ipsecEngine.getAllSAs(),
        });
      },

      selectIKESA: (id) => {
        set({ selectedIKESAId: id });
      },

      // IPSec Operations
      createIPSecSA: (ikeSAId, proposal) => {
        const ikeSA = ikeEngine.getSA(ikeSAId);
        if (!ikeSA) return;

        ipsecEngine.createSA(
          ikeSAId,
          proposal,
          ikeSA.localIP,
          ikeSA.remoteIP,
          {
            localNetwork: '0.0.0.0/0',
            remoteNetwork: '0.0.0.0/0',
          }
        );

        set({ ipsecSAs: ipsecEngine.getAllSAs() });
      },

      deleteIPSecSA: (saId) => {
        ipsecEngine.deleteSA(saId);
        set({ ipsecSAs: ipsecEngine.getAllSAs() });
      },

      selectIPSecSA: (id) => {
        set({ selectedIPSecSAId: id });
      },

      // Packet Simulation
      encryptPacket: (packet) => {
        const activeSAs = ipsecEngine.getActiveSAs()
          .filter(sa => sa.direction === 'outbound');
        
        if (activeSAs.length === 0) {
          console.warn('No active outbound SA available');
          return null;
        }

        // Find matching SA
        const sa = ipsecEngine.findMatchingSA(
          packet.sourceIP,
          packet.destIP,
          packet.protocol,
          packet.sourcePort,
          packet.destPort,
          'outbound'
        ) || activeSAs[0];

        if (sa.protocol === 'esp') {
          const result = ipsecEngine.encapsulateESP(
            {
              sourceIP: packet.sourceIP,
              destIP: packet.destIP,
              protocol: packet.protocol,
              sourcePort: packet.sourcePort,
              destPort: packet.destPort,
              payload: packet.payload,
              size: packet.payload?.length || 64,
            },
            sa
          );

          if (result.success && result.packet) {
            get().refreshStatistics();
            return result.packet as ESPPacket;
          }
        }

        return null;
      },

      decryptPacket: (packetId) => {
        const espPacket = get().espPackets.find(p => p.id === packetId);
        if (!espPacket) return;

        const sa = ipsecEngine.getSABySPI(espPacket.espHeader.spi);
        if (!sa || sa.direction !== 'inbound') return;

        ipsecEngine.decapsulateESP(espPacket, sa);
        get().refreshStatistics();
      },

      setSimulationPacket: (packet) => {
        set({
          simulationPacket: packet,
          simulationActive: !!packet,
        });
      },

      clearPackets: () => {
        set({
          espPackets: [],
          ahPackets: [],
        });
      },

      // UI
      setActiveTab: (tab) => {
        set({ activeTab: tab });
      },

      setShowTunnelCreator: (show) => {
        set({ showTunnelCreator: show });
      },

      setShowPacketSimulator: (show) => {
        set({ showPacketSimulator: show });
      },

      // Statistics
      refreshStatistics: () => {
        const ikeStats = ikeEngine.getStatistics();
        const ipsecStats = ipsecEngine.getStatistics();
        const tunnels = get().tunnels;

        const statistics: VPNStatistics = {
          activeTunnels: tunnels.filter(t => t.status === 'established').length,
          totalTunnels: tunnels.length,
          activeIKESAs: ikeStats.activeSAs,
          activeIPSecSAs: ipsecStats.activeSAs,
          packetsEncrypted: ipsecStats.packetsEncrypted,
          packetsDecrypted: ipsecStats.packetsDecrypted,
          bytesEncrypted: ipsecStats.bytesEncrypted,
          bytesDecrypted: ipsecStats.bytesDecrypted,
          ikeNegotiationsStarted: ikeStats.negotiationsStarted,
          ikeNegotiationsCompleted: ikeStats.negotiationsCompleted,
          ikeNegotiationsFailed: ikeStats.negotiationsFailed,
          rekeyOperations: ikeStats.rekeyOperations,
          authFailures: ipsecStats.authFailed,
          replayAttacksBlocked: ipsecStats.replayBlocked,
          startTime: get().statistics?.startTime || Date.now(),
          lastUpdated: Date.now(),
        };

        set({ statistics });
      },

      resetStatistics: () => {
        ikeEngine.resetStatistics();
        ipsecEngine.resetStatistics();
        
        set({
          events: [],
          ikeMessages: [],
          espPackets: [],
          ahPackets: [],
          negotiationSteps: [],
          statistics: {
            activeTunnels: 0,
            totalTunnels: get().tunnels.length,
            activeIKESAs: 0,
            activeIPSecSAs: 0,
            packetsEncrypted: 0,
            packetsDecrypted: 0,
            bytesEncrypted: 0,
            bytesDecrypted: 0,
            ikeNegotiationsStarted: 0,
            ikeNegotiationsCompleted: 0,
            ikeNegotiationsFailed: 0,
            rekeyOperations: 0,
            authFailures: 0,
            replayAttacksBlocked: 0,
            startTime: Date.now(),
            lastUpdated: Date.now(),
          },
        });
      },

      // Getters
      getTunnelById: (id) => {
        return get().tunnels.find(t => t.id === id);
      },

      getIKESAById: (id) => {
        return get().ikeSAs.find(sa => sa.id === id);
      },

      getIPSecSAById: (id) => {
        return get().ipsecSAs.find(sa => sa.id === id);
      },

      getActiveTunnels: () => {
        return get().tunnels.filter(t => t.status === 'established');
      },

      getRecentEvents: (count = 50) => {
        return get().events.slice(0, count);
      },
    };
  })
);

// ============================================================================
// Selectors (use count selectors for React 19 compatibility)
// ============================================================================

// Count selectors (safe for React 19)
export const selectTunnelCount = (state: VPNStoreState) => state.tunnels.length;

export const selectActiveTunnelCount = (state: VPNStoreState) =>
  state.tunnels.filter(t => t.status === 'established').length;

export const selectIKESACount = (state: VPNStoreState) => state.ikeSAs.length;

export const selectActiveIKESACount = (state: VPNStoreState) =>
  state.ikeSAs.filter(sa => sa.state === 'established').length;

export const selectIPSecSACount = (state: VPNStoreState) => state.ipsecSAs.length;

export const selectActiveIPSecSACount = (state: VPNStoreState) =>
  state.ipsecSAs.filter(sa => sa.state === 'established').length;

export const selectEventsCount = (state: VPNStoreState) => state.events.length;

export const selectMessagesCount = (state: VPNStoreState) => state.ikeMessages.length;

export const selectESPPacketsCount = (state: VPNStoreState) => state.espPackets.length;

export const selectAHPacketsCount = (state: VPNStoreState) => state.ahPackets.length;

export const selectPacketsEncrypted = (state: VPNStoreState) =>
  state.statistics?.packetsEncrypted ?? 0;

export const selectPacketsDecrypted = (state: VPNStoreState) =>
  state.statistics?.packetsDecrypted ?? 0;

export const selectBytesEncrypted = (state: VPNStoreState) =>
  state.statistics?.bytesEncrypted ?? 0;

export const selectBytesDecrypted = (state: VPNStoreState) =>
  state.statistics?.bytesDecrypted ?? 0;

export const selectNegotiationsCompleted = (state: VPNStoreState) =>
  state.statistics?.ikeNegotiationsCompleted ?? 0;

export const selectNegotiationsFailed = (state: VPNStoreState) =>
  state.statistics?.ikeNegotiationsFailed ?? 0;

export const selectReplayAttacksBlocked = (state: VPNStoreState) =>
  state.statistics?.replayAttacksBlocked ?? 0;

// Boolean selectors
export const selectIsRunning = (state: VPNStoreState) => state.isRunning;
export const selectIsInitialized = (state: VPNStoreState) => state.isInitialized;
export const selectSimulationActive = (state: VPNStoreState) => state.simulationActive;

// ID selectors
export const selectSelectedTunnelId = (state: VPNStoreState) => state.selectedTunnelId;
export const selectSelectedIKESAId = (state: VPNStoreState) => state.selectedIKESAId;
export const selectSelectedIPSecSAId = (state: VPNStoreState) => state.selectedIPSecSAId;
export const selectActiveTab = (state: VPNStoreState) => state.activeTab;

// Export useShallow for consumers that need filtered arrays
export { useShallow };

// ============================================================================
// Preset Templates for Educational Use
// ============================================================================

export const TUNNEL_TEMPLATES = {
  siteToSite: {
    name: 'Site-to-Site VPN',
    type: 'site-to-site' as VPNType,
    description: 'Standard site-to-site IPSec tunnel',
    ikeProposal: IKE_PROPOSALS.balanced,
    ipsecProposal: IPSEC_PROPOSALS.balanced,
  },
  strongSecurity: {
    name: 'High Security VPN',
    type: 'site-to-site' as VPNType,
    description: 'Maximum security with AES-256-GCM',
    ikeProposal: IKE_PROPOSALS.strong,
    ipsecProposal: IPSEC_PROPOSALS.strong,
  },
  compatible: {
    name: 'Legacy Compatible VPN',
    type: 'site-to-site' as VPNType,
    description: 'Compatible with older devices',
    ikeProposal: IKE_PROPOSALS.compatible,
    ipsecProposal: IPSEC_PROPOSALS.compatible,
  },
};

export const EXAMPLE_NETWORKS = {
  headquarter: {
    id: 'hq',
    name: 'Headquarters',
    publicIP: '203.0.113.1',
    privateNetwork: '192.168.1.0/24',
  },
  branch1: {
    id: 'branch1',
    name: 'Branch Office 1',
    publicIP: '198.51.100.1',
    privateNetwork: '192.168.10.0/24',
  },
  branch2: {
    id: 'branch2',
    name: 'Branch Office 2',
    publicIP: '198.51.100.2',
    privateNetwork: '192.168.20.0/24',
  },
  datacenter: {
    id: 'dc',
    name: 'Data Center',
    publicIP: '192.0.2.1',
    privateNetwork: '10.0.0.0/16',
  },
};
