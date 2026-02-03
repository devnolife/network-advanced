/**
 * Attack Simulation Zustand Store
 * 
 * State management for attack simulations in the Network Security Virtual Lab.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  AttackConfig,
  AttackType,
  AttackStatus,
  AttackResult,
  AttackEvent,
  AttackPacket,
  AttackStatistics,
  DetectionAlert,
  DefenseAction,
  NetworkTopology,
  NetworkNode,
  AttackTemplate,
} from '@/lib/network/attacks/types';
import {
  getAttackSimulator,
  initializeAttackHandlers,
  ATTACK_TEMPLATES,
} from '@/lib/network/attacks';

// ============================================================================
// Store Types
// ============================================================================

interface ActiveAttack {
  id: string;
  config: AttackConfig;
  status: AttackStatus;
  startTime: number;
  events: AttackEvent[];
  packets: AttackPacket[];
  statistics: AttackStatistics | null;
}

interface AttackSimulationState {
  // State
  isInitialized: boolean;
  topology: NetworkTopology | null;
  activeAttacks: Map<string, ActiveAttack>;
  completedAttacks: AttackResult[];
  alerts: DetectionAlert[];
  defenseActions: DefenseAction[];
  selectedAttackId: string | null;
  selectedTemplate: AttackTemplate | null;
  
  // UI State
  isConfigPanelOpen: boolean;
  isEventLogExpanded: boolean;
  showPacketDetails: boolean;
  packetFilter: string;
  eventFilter: 'all' | 'info' | 'success' | 'detection' | 'failure';
  
  // Real-time stats
  totalPacketsSent: number;
  totalBytesTransferred: number;
  currentPacketRate: number;
  
  // Actions
  initialize: () => void;
  destroy: () => void;
  
  // Topology
  setTopology: (topology: NetworkTopology) => void;
  updateNode: (nodeId: string, updates: Partial<NetworkNode>) => void;
  
  // Attack Management
  startAttack: (config: AttackConfig) => Promise<string>;
  stopAttack: (attackId: string) => Promise<void>;
  pauseAttack: (attackId: string) => Promise<void>;
  resumeAttack: (attackId: string) => Promise<void>;
  stopAllAttacks: () => void;
  
  // Template
  selectTemplate: (template: AttackTemplate | null) => void;
  startFromTemplate: (templateId: string, overrides?: Partial<AttackConfig>) => Promise<string>;
  
  // Selection
  selectAttack: (attackId: string | null) => void;
  
  // UI Actions
  toggleConfigPanel: () => void;
  toggleEventLog: () => void;
  togglePacketDetails: () => void;
  setPacketFilter: (filter: string) => void;
  setEventFilter: (filter: AttackSimulationState['eventFilter']) => void;
  
  // Alerts
  acknowledgeAlert: (alertId: string) => void;
  clearAlerts: () => void;
  
  // History
  clearHistory: () => void;
  
  // Getters
  getActiveAttack: (attackId: string) => ActiveAttack | undefined;
  getAttackEvents: (attackId: string) => AttackEvent[];
  getAttackPackets: (attackId: string) => AttackPacket[];
  getFilteredEvents: (attackId: string) => AttackEvent[];
  getFilteredPackets: (attackId: string) => AttackPacket[];
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useAttackSimulationStore = create<AttackSimulationState>()(
  subscribeWithSelector((set, get) => {
    // Initialize simulator reference
    let simulator = getAttackSimulator();
    let isListenersSetup = false;

    const setupListeners = () => {
      if (isListenersSetup) return;
      
      // Attack events
      simulator.on('attack:start', (config) => {
        set((state) => {
          const newAttacks = new Map(state.activeAttacks);
          newAttacks.set(config.id, {
            id: config.id,
            config,
            status: 'running',
            startTime: Date.now(),
            events: [],
            packets: [],
            statistics: null,
          });
          return { activeAttacks: newAttacks };
        });
      });

      simulator.on('attack:event', (event) => {
        set((state) => {
          const attack = state.activeAttacks.get(event.attackId);
          if (!attack) return state;

          const newAttacks = new Map(state.activeAttacks);
          newAttacks.set(event.attackId, {
            ...attack,
            events: [...attack.events, event].slice(-500), // Keep last 500 events
          });
          return { activeAttacks: newAttacks };
        });
      });

      simulator.on('attack:packet', (packet) => {
        set((state) => {
          // Find which attack this packet belongs to
          for (const [attackId, attack] of state.activeAttacks) {
            const newAttacks = new Map(state.activeAttacks);
            newAttacks.set(attackId, {
              ...attack,
              packets: [...attack.packets, packet].slice(-1000), // Keep last 1000 packets
            });
            return {
              activeAttacks: newAttacks,
              totalPacketsSent: state.totalPacketsSent + 1,
              totalBytesTransferred: state.totalBytesTransferred + packet.size,
            };
          }
          return state;
        });
      });

      simulator.on('attack:stop', ({ attackId }) => {
        const state = get();
        const attack = state.activeAttacks.get(attackId);
        if (attack) {
          const result = simulator.getAttackResult(attackId);
          if (result) {
            set((state) => ({
              completedAttacks: [...state.completedAttacks, result],
            }));
          }
        }
      });

      simulator.on('attack:detected', (alert) => {
        set((state) => ({
          alerts: [...state.alerts, alert],
        }));
      });

      simulator.on('attack:blocked', (action) => {
        set((state) => ({
          defenseActions: [...state.defenseActions, action],
        }));
      });

      isListenersSetup = true;
    };

    return {
      // Initial State
      isInitialized: false,
      topology: null,
      activeAttacks: new Map(),
      completedAttacks: [],
      alerts: [],
      defenseActions: [],
      selectedAttackId: null,
      selectedTemplate: null,
      isConfigPanelOpen: false,
      isEventLogExpanded: true,
      showPacketDetails: false,
      packetFilter: '',
      eventFilter: 'all',
      totalPacketsSent: 0,
      totalBytesTransferred: 0,
      currentPacketRate: 0,

      // Initialization
      initialize: () => {
        simulator = getAttackSimulator();
        initializeAttackHandlers(simulator);
        setupListeners();
        set({ isInitialized: true });
      },

      destroy: () => {
        simulator.destroy();
        isListenersSetup = false;
        set({
          isInitialized: false,
          activeAttacks: new Map(),
          completedAttacks: [],
          alerts: [],
          defenseActions: [],
        });
      },

      // Topology
      setTopology: (topology) => {
        simulator.setTopology(topology);
        set({ topology });
      },

      updateNode: (nodeId, updates) => {
        simulator.updateNode(nodeId, updates);
        const topology = simulator.getTopology();
        if (topology) {
          set({ topology: { ...topology } });
        }
      },

      // Attack Management
      startAttack: async (config) => {
        if (!get().isInitialized) {
          get().initialize();
        }
        const attackId = await simulator.startAttack(config);
        set({ selectedAttackId: attackId });
        return attackId;
      },

      stopAttack: async (attackId) => {
        await simulator.stopAttack(attackId);
        set((state) => {
          const newAttacks = new Map(state.activeAttacks);
          const attack = newAttacks.get(attackId);
          if (attack) {
            attack.status = 'completed';
          }
          return { activeAttacks: newAttacks };
        });
      },

      pauseAttack: async (attackId) => {
        await simulator.pauseAttack(attackId);
        set((state) => {
          const newAttacks = new Map(state.activeAttacks);
          const attack = newAttacks.get(attackId);
          if (attack) {
            attack.status = 'paused';
          }
          return { activeAttacks: newAttacks };
        });
      },

      resumeAttack: async (attackId) => {
        await simulator.resumeAttack(attackId);
        set((state) => {
          const newAttacks = new Map(state.activeAttacks);
          const attack = newAttacks.get(attackId);
          if (attack) {
            attack.status = 'running';
          }
          return { activeAttacks: newAttacks };
        });
      },

      stopAllAttacks: () => {
        simulator.stopAllAttacks();
      },

      // Templates
      selectTemplate: (template) => {
        set({ selectedTemplate: template, isConfigPanelOpen: !!template });
      },

      startFromTemplate: async (templateId, overrides = {}) => {
        const template = ATTACK_TEMPLATES.find(t => t.id === templateId);
        if (!template) {
          throw new Error(`Template not found: ${templateId}`);
        }

        // Merge template defaults with overrides
        const config = {
          id: `${templateId}-${Date.now()}`,
          ...template.defaultConfig,
          ...overrides,
        } as AttackConfig;

        return get().startAttack(config);
      },

      // Selection
      selectAttack: (attackId) => {
        set({ selectedAttackId: attackId });
      },

      // UI Actions
      toggleConfigPanel: () => {
        set((state) => ({ isConfigPanelOpen: !state.isConfigPanelOpen }));
      },

      toggleEventLog: () => {
        set((state) => ({ isEventLogExpanded: !state.isEventLogExpanded }));
      },

      togglePacketDetails: () => {
        set((state) => ({ showPacketDetails: !state.showPacketDetails }));
      },

      setPacketFilter: (filter) => {
        set({ packetFilter: filter });
      },

      setEventFilter: (filter) => {
        set({ eventFilter: filter });
      },

      // Alerts
      acknowledgeAlert: (alertId) => {
        simulator.acknowledgeAlert(alertId);
        set((state) => ({
          alerts: state.alerts.map(a => 
            a.id === alertId ? { ...a, acknowledged: true } : a
          ),
        }));
      },

      clearAlerts: () => {
        set({ alerts: [] });
      },

      // History
      clearHistory: () => {
        set({
          completedAttacks: [],
          totalPacketsSent: 0,
          totalBytesTransferred: 0,
        });
      },

      // Getters
      getActiveAttack: (attackId) => {
        return get().activeAttacks.get(attackId);
      },

      getAttackEvents: (attackId) => {
        return get().activeAttacks.get(attackId)?.events || [];
      },

      getAttackPackets: (attackId) => {
        return get().activeAttacks.get(attackId)?.packets || [];
      },

      getFilteredEvents: (attackId) => {
        const { eventFilter } = get();
        const events = get().getAttackEvents(attackId);
        
        if (eventFilter === 'all') return events;
        return events.filter(e => e.type === eventFilter);
      },

      getFilteredPackets: (attackId) => {
        const { packetFilter } = get();
        const packets = get().getAttackPackets(attackId);
        
        if (!packetFilter) return packets;
        
        const filter = packetFilter.toLowerCase();
        return packets.filter(p => 
          p.protocol.toLowerCase().includes(filter) ||
          p.sourceIP.includes(filter) ||
          p.destIP.includes(filter) ||
          (p.payload && p.payload.toLowerCase().includes(filter))
        );
      },
    };
  })
);

// ============================================================================
// Selectors
// ============================================================================

export const selectActiveAttackIds = (state: AttackSimulationState) => 
  Array.from(state.activeAttacks.keys());

export const selectRunningAttacks = (state: AttackSimulationState) =>
  Array.from(state.activeAttacks.values()).filter(a => a.status === 'running');

export const selectUnacknowledgedAlerts = (state: AttackSimulationState) =>
  state.alerts.filter(a => !a.acknowledged);

export const selectSelectedAttack = (state: AttackSimulationState) =>
  state.selectedAttackId ? state.activeAttacks.get(state.selectedAttackId) : null;

export const selectAttackTemplates = () => ATTACK_TEMPLATES;

export const selectTemplatesByCategory = (category: string) =>
  ATTACK_TEMPLATES.filter(t => t.category === category);
