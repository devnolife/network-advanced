/**
 * Firewall/ACL Zustand Store
 * 
 * State management for the Firewall and Access Control List engines.
 * Network Security Virtual Lab - Educational Platform
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useShallow } from 'zustand/shallow';
import {
  ACL,
  ACLRule,
  ACLAction,
  ACLType,
  ACLDirection,
  ACLProtocol,
  ACLSource,
  ACLDestination,
  FirewallConfig,
  FirewallPolicy,
  FirewallRule,
  FirewallAction,
  FirewallEvent,
  FirewallStatistics,
  SecurityZone,
  ZonePair,
  ConnectionEntry,
  NATRule,
  NATTranslation,
  NATType,
  FirewallPacket,
} from '@/lib/network/firewall/types';
import {
  ACLEngine,
  ACLEvaluationResult,
  ACLStatistics,
  getACLEngine,
  resetACLEngine,
  FirewallEngine,
  PacketDecision,
  getFirewallEngine,
  resetFirewallEngine,
} from '@/lib/network/firewall';

// ============================================================================
// Store Types
// ============================================================================

interface FirewallStoreState {
  // Initialization
  isInitialized: boolean;
  isRunning: boolean;
  mode: 'stateless' | 'stateful';
  
  // Configuration
  firewallConfig: FirewallConfig | null;
  
  // ACLs
  acls: ACL[];
  selectedACLId: string | null;
  selectedRuleId: string | null;
  aclSearchQuery: string;
  
  // Zones
  zones: SecurityZone[];
  zonePairs: ZonePair[];
  selectedZoneId: string | null;
  
  // Policies
  policies: FirewallPolicy[];
  selectedPolicyId: string | null;
  
  // Connections (stateful)
  connections: ConnectionEntry[];
  connectionFilters: {
    protocol: ACLProtocol | 'all';
    state: ConnectionEntry['state'] | 'all';
    searchQuery: string;
  };
  
  // NAT
  natRules: NATRule[];
  natTranslations: NATTranslation[];
  selectedNATRuleId: string | null;
  
  // Events & Statistics
  events: FirewallEvent[];
  statistics: FirewallStatistics | null;
  aclStatistics: ACLStatistics | null;
  
  // UI State
  activeTab: 'dashboard' | 'acl' | 'zones' | 'nat' | 'connections' | 'logs' | 'settings';
  showACLEditor: boolean;
  showRuleEditor: boolean;
  showNATEditor: boolean;
  showZoneEditor: boolean;
  
  // Simulation
  simulationPacket: FirewallPacket | null;
  simulationResult: PacketDecision | null;
  
  // Actions
  initialize: () => void;
  destroy: () => void;
  start: () => void;
  stop: () => void;
  
  // Mode & Configuration
  setMode: (mode: 'stateless' | 'stateful') => void;
  updateConfig: (config: Partial<FirewallConfig>) => void;
  
  // ACL Management
  createACL: (name: string, type: ACLType, description?: string) => ACL | undefined;
  updateACL: (id: string, updates: Partial<ACL>) => void;
  deleteACL: (id: string) => void;
  selectACL: (id: string | null) => void;
  setACLSearchQuery: (query: string) => void;
  
  // ACL Rule Management
  addACLRule: (aclId: string, rule: Omit<ACLRule, 'id' | 'hitCount' | 'lastHit' | 'createdAt' | 'enabled'>) => ACLRule | undefined;
  updateACLRule: (aclId: string, ruleId: string, updates: Partial<ACLRule>) => void;
  deleteACLRule: (aclId: string, ruleId: string) => void;
  enableACLRule: (aclId: string, ruleId: string) => void;
  disableACLRule: (aclId: string, ruleId: string) => void;
  selectRule: (id: string | null) => void;
  
  // ACL Application
  applyACLToInterface: (aclId: string, interfaceName: string, direction: ACLDirection) => void;
  removeACLFromInterface: (aclId: string, interfaceName: string, direction: ACLDirection) => void;
  
  // Zone Management
  createZone: (zone: Omit<SecurityZone, 'id'>) => SecurityZone;
  updateZone: (id: string, updates: Partial<SecurityZone>) => void;
  deleteZone: (id: string) => void;
  selectZone: (id: string | null) => void;
  
  // Zone Pair Management
  createZonePair: (zonePair: Omit<ZonePair, 'id'>) => ZonePair;
  deleteZonePair: (id: string) => void;
  
  // Policy Management
  createPolicy: (name: string, description?: string) => FirewallPolicy;
  updatePolicy: (id: string, updates: Partial<FirewallPolicy>) => void;
  deletePolicy: (id: string) => void;
  selectPolicy: (id: string | null) => void;
  addRuleToPolicy: (policyId: string, rule: Omit<FirewallRule, 'id' | 'hitCount' | 'bytesMatched' | 'createdAt'>) => FirewallRule | undefined;
  
  // NAT Management
  createNATRule: (rule: Omit<NATRule, 'id' | 'hitCount' | 'createdAt'>) => NATRule;
  updateNATRule: (id: string, updates: Partial<NATRule>) => void;
  deleteNATRule: (id: string) => void;
  selectNATRule: (id: string | null) => void;
  
  // Connection Management
  setConnectionFilters: (filters: Partial<FirewallStoreState['connectionFilters']>) => void;
  clearConnections: () => void;
  
  // Simulation
  simulatePacket: (packet: FirewallPacket) => PacketDecision;
  setSimulationPacket: (packet: FirewallPacket | null) => void;
  clearSimulation: () => void;
  
  // UI
  setActiveTab: (tab: FirewallStoreState['activeTab']) => void;
  setShowACLEditor: (show: boolean) => void;
  setShowRuleEditor: (show: boolean) => void;
  setShowNATEditor: (show: boolean) => void;
  setShowZoneEditor: (show: boolean) => void;
  
  // Statistics
  resetStatistics: () => void;
  
  // Getters
  getFilteredACLs: () => ACL[];
  getFilteredConnections: () => ConnectionEntry[];
  getACLById: (id: string) => ACL | undefined;
  getPolicyById: (id: string) => FirewallPolicy | undefined;
  getZoneById: (id: string) => SecurityZone | undefined;
  generateCiscoCommands: (aclId: string) => string[];
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useFirewallStore = create<FirewallStoreState>()(
  subscribeWithSelector((set, get) => {
    let firewallEngine = getFirewallEngine();
    let aclEngine = getACLEngine();
    let isListenersSetup = false;

    const setupListeners = () => {
      if (isListenersSetup) return;

      // Firewall events
      firewallEngine.on('event', (data: unknown) => {
        const event = data as FirewallEvent;
        set((state) => ({
          events: [event, ...state.events].slice(0, 1000),
        }));
      });

      // Connection events
      firewallEngine.on('connection:new', () => {
        set({ connections: firewallEngine.getActiveConnections() });
      });

      firewallEngine.on('connection:expired', () => {
        set({ connections: firewallEngine.getActiveConnections() });
      });

      // NAT events
      firewallEngine.on('nat:created', () => {
        set({ natTranslations: firewallEngine.getNATTranslations() });
      });

      firewallEngine.on('nat:expired', () => {
        set({ natTranslations: firewallEngine.getNATTranslations() });
      });

      // Zone events
      firewallEngine.on('zone:created', () => {
        set({ zones: firewallEngine.getAllZones() });
      });

      firewallEngine.on('zone:updated', () => {
        set({ zones: firewallEngine.getAllZones() });
      });

      firewallEngine.on('zone:deleted', () => {
        set({ zones: firewallEngine.getAllZones() });
      });

      // Policy events
      firewallEngine.on('policy:created', () => {
        set({ policies: firewallEngine.getAllPolicies() });
      });

      firewallEngine.on('policy:updated', () => {
        set({ policies: firewallEngine.getAllPolicies() });
      });

      firewallEngine.on('policy:deleted', () => {
        set({ policies: firewallEngine.getAllPolicies() });
      });

      // ACL events
      aclEngine.on('acl:created', () => {
        set({ acls: aclEngine.getAllACLs() });
      });

      aclEngine.on('acl:updated', () => {
        set({ acls: aclEngine.getAllACLs() });
      });

      aclEngine.on('acl:deleted', () => {
        set({ acls: aclEngine.getAllACLs() });
      });

      aclEngine.on('rule:added', () => {
        set({ acls: aclEngine.getAllACLs() });
      });

      aclEngine.on('rule:updated', () => {
        set({ acls: aclEngine.getAllACLs() });
      });

      aclEngine.on('rule:deleted', () => {
        set({ acls: aclEngine.getAllACLs() });
      });

      isListenersSetup = true;
    };

    return {
      // Initial State
      isInitialized: false,
      isRunning: false,
      mode: 'stateful',
      firewallConfig: null,
      
      acls: [],
      selectedACLId: null,
      selectedRuleId: null,
      aclSearchQuery: '',
      
      zones: [],
      zonePairs: [],
      selectedZoneId: null,
      
      policies: [],
      selectedPolicyId: null,
      
      connections: [],
      connectionFilters: {
        protocol: 'all',
        state: 'all',
        searchQuery: '',
      },
      
      natRules: [],
      natTranslations: [],
      selectedNATRuleId: null,
      
      events: [],
      statistics: null,
      aclStatistics: null,
      
      activeTab: 'dashboard',
      showACLEditor: false,
      showRuleEditor: false,
      showNATEditor: false,
      showZoneEditor: false,
      
      simulationPacket: null,
      simulationResult: null,

      // Initialization
      initialize: () => {
        firewallEngine = getFirewallEngine();
        aclEngine = getACLEngine();
        
        setupListeners();
        
        set({
          isInitialized: true,
          firewallConfig: firewallEngine.getConfig(),
          zones: firewallEngine.getAllZones(),
          zonePairs: firewallEngine.getAllZonePairs(),
          policies: firewallEngine.getAllPolicies(),
          natRules: firewallEngine.getAllNATRules(),
          acls: aclEngine.getAllACLs(),
          statistics: firewallEngine.getStatistics(),
          aclStatistics: aclEngine.getStatistics(),
        });
      },

      destroy: () => {
        firewallEngine.stop();
        aclEngine.stop();
        resetFirewallEngine();
        resetACLEngine();
        isListenersSetup = false;
        
        set({
          isInitialized: false,
          isRunning: false,
          acls: [],
          zones: [],
          zonePairs: [],
          policies: [],
          connections: [],
          natRules: [],
          natTranslations: [],
          events: [],
          statistics: null,
          aclStatistics: null,
        });
      },

      start: () => {
        if (!get().isInitialized) {
          get().initialize();
        }
        
        firewallEngine.start();
        aclEngine.start();
        
        set({
          isRunning: true,
          statistics: firewallEngine.getStatistics(),
          aclStatistics: aclEngine.getStatistics(),
        });
      },

      stop: () => {
        firewallEngine.stop();
        aclEngine.stop();
        
        set({
          isRunning: false,
          statistics: firewallEngine.getStatistics(),
          aclStatistics: aclEngine.getStatistics(),
        });
      },

      // Mode & Configuration
      setMode: (mode) => {
        firewallEngine.setMode(mode);
        set({ mode, firewallConfig: firewallEngine.getConfig() });
      },

      updateConfig: (config) => {
        firewallEngine.setConfig(config);
        set({ firewallConfig: firewallEngine.getConfig() });
      },

      // ACL Management
      createACL: (name, type, description) => {
        try {
          const acl = aclEngine.createACL({ name, type, description });
          set({ acls: aclEngine.getAllACLs() });
          return acl;
        } catch (error) {
          console.error('Failed to create ACL:', error);
          return undefined;
        }
      },

      updateACL: (id, updates) => {
        aclEngine.updateACL(id, updates);
        set({ acls: aclEngine.getAllACLs() });
      },

      deleteACL: (id) => {
        aclEngine.deleteACL(id);
        set((state) => ({
          acls: aclEngine.getAllACLs(),
          selectedACLId: state.selectedACLId === id ? null : state.selectedACLId,
        }));
      },

      selectACL: (id) => {
        set({ selectedACLId: id });
      },

      setACLSearchQuery: (query) => {
        set({ aclSearchQuery: query });
      },

      // ACL Rule Management
      addACLRule: (aclId, rule) => {
        try {
          const newRule = aclEngine.addRule(aclId, rule);
          set({ acls: aclEngine.getAllACLs() });
          return newRule;
        } catch (error) {
          console.error('Failed to add ACL rule:', error);
          return undefined;
        }
      },

      updateACLRule: (aclId, ruleId, updates) => {
        aclEngine.updateRule(aclId, ruleId, updates);
        set({ acls: aclEngine.getAllACLs() });
      },

      deleteACLRule: (aclId, ruleId) => {
        aclEngine.deleteRule(aclId, ruleId);
        set((state) => ({
          acls: aclEngine.getAllACLs(),
          selectedRuleId: state.selectedRuleId === ruleId ? null : state.selectedRuleId,
        }));
      },

      enableACLRule: (aclId, ruleId) => {
        aclEngine.enableRule(aclId, ruleId);
        set({ acls: aclEngine.getAllACLs() });
      },

      disableACLRule: (aclId, ruleId) => {
        aclEngine.disableRule(aclId, ruleId);
        set({ acls: aclEngine.getAllACLs() });
      },

      selectRule: (id) => {
        set({ selectedRuleId: id });
      },

      // ACL Application
      applyACLToInterface: (aclId, interfaceName, direction) => {
        aclEngine.applyToInterface(aclId, interfaceName, direction);
        set({ acls: aclEngine.getAllACLs() });
      },

      removeACLFromInterface: (aclId, interfaceName, direction) => {
        aclEngine.removeFromInterface(aclId, interfaceName, direction);
        set({ acls: aclEngine.getAllACLs() });
      },

      // Zone Management
      createZone: (zone) => {
        const newZone = firewallEngine.createZone(zone);
        set({ zones: firewallEngine.getAllZones() });
        return newZone;
      },

      updateZone: (id, updates) => {
        firewallEngine.updateZone(id, updates);
        set({ zones: firewallEngine.getAllZones() });
      },

      deleteZone: (id) => {
        firewallEngine.deleteZone(id);
        set((state) => ({
          zones: firewallEngine.getAllZones(),
          selectedZoneId: state.selectedZoneId === id ? null : state.selectedZoneId,
        }));
      },

      selectZone: (id) => {
        set({ selectedZoneId: id });
      },

      // Zone Pair Management
      createZonePair: (zonePair) => {
        const newZonePair = firewallEngine.createZonePair(zonePair);
        set({ zonePairs: firewallEngine.getAllZonePairs() });
        return newZonePair;
      },

      deleteZonePair: (id) => {
        // Note: FirewallEngine doesn't have deleteZonePair, would need to add
        set({ zonePairs: firewallEngine.getAllZonePairs() });
      },

      // Policy Management
      createPolicy: (name, description) => {
        const policy = firewallEngine.createPolicy({ name, description });
        set({ policies: firewallEngine.getAllPolicies() });
        return policy;
      },

      updatePolicy: (id, updates) => {
        firewallEngine.updatePolicy(id, updates);
        set({ policies: firewallEngine.getAllPolicies() });
      },

      deletePolicy: (id) => {
        firewallEngine.deletePolicy(id);
        set((state) => ({
          policies: firewallEngine.getAllPolicies(),
          selectedPolicyId: state.selectedPolicyId === id ? null : state.selectedPolicyId,
        }));
      },

      selectPolicy: (id) => {
        set({ selectedPolicyId: id });
      },

      addRuleToPolicy: (policyId, rule) => {
        try {
          const newRule = firewallEngine.addRuleToPolicy(policyId, rule);
          set({ policies: firewallEngine.getAllPolicies() });
          return newRule;
        } catch (error) {
          console.error('Failed to add rule to policy:', error);
          return undefined;
        }
      },

      // NAT Management
      createNATRule: (rule) => {
        const natRule = firewallEngine.createNATRule(rule);
        set({ natRules: firewallEngine.getAllNATRules() });
        return natRule;
      },

      updateNATRule: (id, updates) => {
        // Note: FirewallEngine doesn't have updateNATRule, would need to add
        // For now, just refresh state
        set({ natRules: firewallEngine.getAllNATRules() });
      },

      deleteNATRule: (id) => {
        firewallEngine.deleteNATRule(id);
        set((state) => ({
          natRules: firewallEngine.getAllNATRules(),
          selectedNATRuleId: state.selectedNATRuleId === id ? null : state.selectedNATRuleId,
        }));
      },

      selectNATRule: (id) => {
        set({ selectedNATRuleId: id });
      },

      // Connection Management
      setConnectionFilters: (filters) => {
        set((state) => ({
          connectionFilters: { ...state.connectionFilters, ...filters },
        }));
      },

      clearConnections: () => {
        // Would need to add method to FirewallEngine to clear connections
        set({ connections: [] });
      },

      // Simulation
      simulatePacket: (packet) => {
        const result = firewallEngine.processPacket(packet);
        set({
          simulationPacket: packet,
          simulationResult: result,
          statistics: firewallEngine.getStatistics(),
        });
        return result;
      },

      setSimulationPacket: (packet) => {
        set({ simulationPacket: packet, simulationResult: null });
      },

      clearSimulation: () => {
        set({ simulationPacket: null, simulationResult: null });
      },

      // UI
      setActiveTab: (tab) => {
        set({ activeTab: tab });
      },

      setShowACLEditor: (show) => {
        set({ showACLEditor: show });
      },

      setShowRuleEditor: (show) => {
        set({ showRuleEditor: show });
      },

      setShowNATEditor: (show) => {
        set({ showNATEditor: show });
      },

      setShowZoneEditor: (show) => {
        set({ showZoneEditor: show });
      },

      // Statistics
      resetStatistics: () => {
        firewallEngine.resetStatistics();
        aclEngine.resetStatistics();
        set({
          statistics: firewallEngine.getStatistics(),
          aclStatistics: aclEngine.getStatistics(),
          events: [],
        });
      },

      // Getters
      getFilteredACLs: () => {
        const { acls, aclSearchQuery } = get();
        
        if (!aclSearchQuery) return acls;
        
        const query = aclSearchQuery.toLowerCase();
        return acls.filter(acl =>
          acl.name.toLowerCase().includes(query) ||
          acl.description?.toLowerCase().includes(query) ||
          acl.type.toLowerCase().includes(query)
        );
      },

      getFilteredConnections: () => {
        const { connections, connectionFilters } = get();
        let filtered = connections;

        if (connectionFilters.protocol !== 'all') {
          filtered = filtered.filter(c => c.protocol === connectionFilters.protocol);
        }

        if (connectionFilters.state !== 'all') {
          filtered = filtered.filter(c => c.state === connectionFilters.state);
        }

        if (connectionFilters.searchQuery) {
          const query = connectionFilters.searchQuery.toLowerCase();
          filtered = filtered.filter(c =>
            c.sourceIP.includes(query) ||
            c.destIP.includes(query) ||
            String(c.sourcePort).includes(query) ||
            String(c.destPort).includes(query)
          );
        }

        return filtered;
      },

      getACLById: (id) => {
        return get().acls.find(acl => acl.id === id);
      },

      getPolicyById: (id) => {
        return get().policies.find(policy => policy.id === id);
      },

      getZoneById: (id) => {
        return get().zones.find(zone => zone.id === id);
      },

      generateCiscoCommands: (aclId) => {
        return aclEngine.generateCiscoCommands(aclId);
      },
    };
  })
);

// ============================================================================
// Selectors (use count selectors for React 19 compatibility)
// ============================================================================

// Count selectors (safe for React 19)
export const selectACLCount = (state: FirewallStoreState) => state.acls.length;

export const selectActiveConnectionsCount = (state: FirewallStoreState) =>
  state.connections.filter(c => c.state === 'established').length;

export const selectTotalConnectionsCount = (state: FirewallStoreState) =>
  state.connections.length;

export const selectActiveNATTranslationsCount = (state: FirewallStoreState) =>
  state.natTranslations.filter(t => t.state === 'active').length;

export const selectZonesCount = (state: FirewallStoreState) => state.zones.length;

export const selectPoliciesCount = (state: FirewallStoreState) => state.policies.length;

export const selectNATRulesCount = (state: FirewallStoreState) => state.natRules.length;

export const selectDeniedPacketsCount = (state: FirewallStoreState) =>
  state.statistics?.packetsDenied ?? 0;

export const selectAllowedPacketsCount = (state: FirewallStoreState) =>
  state.statistics?.packetsAllowed ?? 0;

export const selectRecentEventsCount = (state: FirewallStoreState) =>
  state.events.length;

// Boolean selectors
export const selectIsRunning = (state: FirewallStoreState) => state.isRunning;
export const selectIsInitialized = (state: FirewallStoreState) => state.isInitialized;
export const selectMode = (state: FirewallStoreState) => state.mode;

// ID selectors
export const selectSelectedACLId = (state: FirewallStoreState) => state.selectedACLId;
export const selectSelectedPolicyId = (state: FirewallStoreState) => state.selectedPolicyId;
export const selectSelectedZoneId = (state: FirewallStoreState) => state.selectedZoneId;

// Export useShallow for consumers that need filtered arrays
export { useShallow };

// ============================================================================
// Preset Templates for Educational Use
// ============================================================================

export const ACL_TEMPLATES = {
  webServerOnly: {
    name: 'WEB_SERVER_ACCESS',
    type: 'extended' as ACLType,
    description: 'Allow only HTTP/HTTPS traffic',
    rules: [
      {
        sequence: 10,
        action: 'permit' as ACLAction,
        protocol: 'tcp' as ACLProtocol,
        source: { ip: 'any' },
        destination: { ip: 'any', port: 80 },
        description: 'Allow HTTP',
      },
      {
        sequence: 20,
        action: 'permit' as ACLAction,
        protocol: 'tcp' as ACLProtocol,
        source: { ip: 'any' },
        destination: { ip: 'any', port: 443 },
        description: 'Allow HTTPS',
      },
      {
        sequence: 1000,
        action: 'deny' as ACLAction,
        protocol: 'ip' as ACLProtocol,
        source: { ip: 'any' },
        destination: { ip: 'any' },
        description: 'Deny all other traffic',
        log: true,
      },
    ],
  },
  
  sshManagement: {
    name: 'SSH_MANAGEMENT',
    type: 'extended' as ACLType,
    description: 'SSH access from admin subnet only',
    rules: [
      {
        sequence: 10,
        action: 'permit' as ACLAction,
        protocol: 'tcp' as ACLProtocol,
        source: { ip: '192.168.1.0', wildcard: '0.0.0.255' },
        destination: { ip: 'any', port: 22 },
        description: 'Allow SSH from admin subnet',
      },
      {
        sequence: 20,
        action: 'deny' as ACLAction,
        protocol: 'tcp' as ACLProtocol,
        source: { ip: 'any' },
        destination: { ip: 'any', port: 22 },
        description: 'Deny SSH from other sources',
        log: true,
      },
    ],
  },
  
  blockMalicious: {
    name: 'BLOCK_MALICIOUS',
    type: 'extended' as ACLType,
    description: 'Block known malicious ports',
    rules: [
      {
        sequence: 10,
        action: 'deny' as ACLAction,
        protocol: 'tcp' as ACLProtocol,
        source: { ip: 'any' },
        destination: { ip: 'any', port: 23 },
        description: 'Block Telnet',
        log: true,
      },
      {
        sequence: 20,
        action: 'deny' as ACLAction,
        protocol: 'tcp' as ACLProtocol,
        source: { ip: 'any' },
        destination: { ip: 'any', port: 445 },
        description: 'Block SMB',
        log: true,
      },
      {
        sequence: 30,
        action: 'deny' as ACLAction,
        protocol: 'tcp' as ACLProtocol,
        source: { ip: 'any' },
        destination: { ip: 'any', port: 3389 },
        description: 'Block RDP',
        log: true,
      },
      {
        sequence: 1000,
        action: 'permit' as ACLAction,
        protocol: 'ip' as ACLProtocol,
        source: { ip: 'any' },
        destination: { ip: 'any' },
        description: 'Permit all other traffic',
      },
    ],
  },
};

export const NAT_TEMPLATES = {
  basicPAT: {
    name: 'BASIC_PAT',
    type: 'pat' as NATType,
    description: 'Basic PAT for internet access',
    insideLocal: '192.168.1.0',
    insideGlobal: '203.0.113.1',
    overload: true,
  },
  
  staticNAT: {
    name: 'WEB_SERVER_NAT',
    type: 'static' as NATType,
    description: 'Static NAT for web server',
    insideLocal: '192.168.1.10',
    insideGlobal: '203.0.113.10',
  },
};
