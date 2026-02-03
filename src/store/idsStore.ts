/**
 * IDS/IPS Zustand Store
 * 
 * State management for the Intrusion Detection and Prevention System.
 * Network Security Virtual Lab - Educational Platform
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useShallow } from 'zustand/shallow';
import {
  IDSConfig,
  IDSRule,
  IDSAlert,
  IDSStatistics,
  RuleSet,
  AlertSeverity,
  AlertStatus,
  RuleCategory,
  BlocklistEntry,
  DetectionProfile,
} from '@/lib/network/ids/types';
import { IPSConfig } from '@/lib/network/ids/IPSEngine';
import {
  getIDSEngine,
  getIPSEngine,
  resetIDSEngine,
  resetIPSEngine,
  DEFAULT_RULE_SET,
  ALL_RULE_SETS,
} from '@/lib/network/ids';

// ============================================================================
// Store Types
// ============================================================================

interface IDSStoreState {
  // Initialization
  isInitialized: boolean;
  isRunning: boolean;
  mode: 'ids' | 'ips' | 'hybrid';
  
  // Configuration
  idsConfig: IDSConfig | null;
  ipsConfig: IPSConfig | null;
  
  // Rules
  ruleSets: RuleSet[];
  enabledRuleSets: string[];
  customRules: IDSRule[];
  ruleSearchQuery: string;
  selectedRuleId: string | null;
  
  // Alerts
  alerts: IDSAlert[];
  selectedAlertId: string | null;
  alertFilters: {
    severity: AlertSeverity | 'all';
    category: RuleCategory | 'all';
    status: AlertStatus | 'all';
    timeRange: 'all' | '1h' | '24h' | '7d' | '30d';
    searchQuery: string;
  };
  
  // Blocklist (IPS)
  blocklist: BlocklistEntry[];
  
  // Statistics
  statistics: IDSStatistics | null;
  historicalStats: {
    hourly: Array<{ hour: number; alerts: number; blocked: number }>;
    daily: Array<{ date: string; alerts: number; blocked: number }>;
  };
  
  // UI State
  activeTab: 'dashboard' | 'alerts' | 'rules' | 'blocklist' | 'settings';
  isAlertPanelExpanded: boolean;
  isStatsPanelExpanded: boolean;
  showRuleEditor: boolean;
  selectedProfile: DetectionProfile | null;
  
  // Actions
  initialize: () => void;
  destroy: () => void;
  start: () => void;
  stop: () => void;
  
  // Mode
  setMode: (mode: 'ids' | 'ips' | 'hybrid') => void;
  
  // Configuration
  updateIDSConfig: (config: Partial<IDSConfig>) => void;
  updateIPSConfig: (config: Partial<IPSConfig>) => void;
  applyProfile: (profile: DetectionProfile) => void;
  
  // Rules
  loadRuleSet: (ruleSetId: string) => void;
  unloadRuleSet: (ruleSetId: string) => void;
  enableRule: (ruleId: string) => void;
  disableRule: (ruleId: string) => void;
  addCustomRule: (rule: IDSRule) => void;
  removeCustomRule: (ruleId: string) => void;
  setRuleSearchQuery: (query: string) => void;
  selectRule: (ruleId: string | null) => void;
  
  // Alerts
  selectAlert: (alertId: string | null) => void;
  acknowledgeAlert: (alertId: string) => void;
  resolveAlert: (alertId: string, notes?: string) => void;
  markFalsePositive: (alertId: string) => void;
  clearAlerts: () => void;
  setAlertFilters: (filters: Partial<IDSStoreState['alertFilters']>) => void;
  
  // Blocklist
  blockIP: (ip: string, reason: string, duration?: number) => void;
  unblockIP: (ip: string) => void;
  clearBlocklist: () => void;
  
  // UI
  setActiveTab: (tab: IDSStoreState['activeTab']) => void;
  toggleAlertPanel: () => void;
  toggleStatsPanel: () => void;
  setShowRuleEditor: (show: boolean) => void;
  
  // Getters
  getFilteredAlerts: () => IDSAlert[];
  getFilteredRules: () => IDSRule[];
  getAlertsByRule: (ruleId: string) => IDSAlert[];
  getStatsByCategory: () => Record<string, number>;
}

// ============================================================================
// Default Profiles
// ============================================================================

const DETECTION_PROFILES: DetectionProfile[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Low sensitivity, only critical threats',
    mode: 'ids',
    alertThreshold: 'critical',
    sensitivity: 'low',
    enabledCategories: ['malware', 'exploit', 'dos'],
    maxAlertsPerSecond: 10,
    autoBlock: false,
    blockDuration: 0,
  },
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Recommended for most environments',
    mode: 'hybrid',
    alertThreshold: 'medium',
    sensitivity: 'medium',
    enabledCategories: ['malware', 'exploit', 'dos', 'scan', 'brute-force', 'web-attack'],
    maxAlertsPerSecond: 50,
    autoBlock: true,
    blockDuration: 300000,
  },
  {
    id: 'aggressive',
    name: 'Aggressive',
    description: 'High sensitivity, maximum protection',
    mode: 'ips',
    alertThreshold: 'low',
    sensitivity: 'high',
    enabledCategories: ['malware', 'exploit', 'dos', 'ddos', 'scan', 'brute-force', 'web-attack', 'reconnaissance', 'policy-violation'],
    maxAlertsPerSecond: 100,
    autoBlock: true,
    blockDuration: 600000,
  },
  {
    id: 'paranoid',
    name: 'Paranoid',
    description: 'Maximum detection, may have false positives',
    mode: 'ips',
    alertThreshold: 'info',
    sensitivity: 'paranoid',
    enabledCategories: ['malware', 'exploit', 'dos', 'ddos', 'scan', 'brute-force', 'web-attack', 'reconnaissance', 'lateral-movement', 'exfiltration', 'command-control', 'policy-violation', 'suspicious', 'info'],
    maxAlertsPerSecond: 200,
    autoBlock: true,
    blockDuration: 3600000,
  },
];

// ============================================================================
// Store Implementation
// ============================================================================

export const useIDSStore = create<IDSStoreState>()(
  subscribeWithSelector((set, get) => {
    let idsEngine = getIDSEngine();
    let ipsEngine: ReturnType<typeof getIPSEngine> | null = null;
    let isListenersSetup = false;

    const setupListeners = () => {
      if (isListenersSetup) return;

      // IDS Alert listener
      idsEngine.on('alert:new', (data: unknown) => {
        const alert = data as IDSAlert;
        set((state) => ({
          alerts: [alert, ...state.alerts].slice(0, 1000), // Keep last 1000 alerts
        }));
      });

      // IDS Statistics update
      idsEngine.on('stats:updated', () => {
        set({ statistics: idsEngine.getStatistics() });
      });

      // Rule triggered
      idsEngine.on('rule:triggered', (data: unknown) => {
        const { rule } = data as { rule: IDSRule };
        // Update historical stats
        const now = new Date();
        const hour = now.getHours();
        
        set((state) => {
          const hourly = [...state.historicalStats.hourly];
          const hourIndex = hourly.findIndex(h => h.hour === hour);
          
          if (hourIndex >= 0) {
            hourly[hourIndex] = {
              ...hourly[hourIndex],
              alerts: hourly[hourIndex].alerts + 1,
            };
          } else {
            hourly.push({ hour, alerts: 1, blocked: 0 });
          }
          
          return {
            historicalStats: {
              ...state.historicalStats,
              hourly: hourly.slice(-24),
            },
          };
        });
      });

      // IPS Block listener
      if (ipsEngine) {
        ipsEngine.on('action:block', (data: unknown) => {
          const { entry } = data as { entry: BlocklistEntry };
          set((state) => ({
            blocklist: [...state.blocklist, entry],
          }));
        });

        ipsEngine.on('action:unblock', (data: unknown) => {
          const { ip } = data as { ip: string };
          set((state) => ({
            blocklist: state.blocklist.filter(b => b.ip !== ip),
          }));
        });
      }

      isListenersSetup = true;
    };

    return {
      // Initial State
      isInitialized: false,
      isRunning: false,
      mode: 'ids',
      idsConfig: null,
      ipsConfig: null,
      ruleSets: ALL_RULE_SETS,
      enabledRuleSets: ['default'],
      customRules: [],
      ruleSearchQuery: '',
      selectedRuleId: null,
      alerts: [],
      selectedAlertId: null,
      alertFilters: {
        severity: 'all',
        category: 'all',
        status: 'all',
        timeRange: 'all',
        searchQuery: '',
      },
      blocklist: [],
      statistics: null,
      historicalStats: {
        hourly: [],
        daily: [],
      },
      activeTab: 'dashboard',
      isAlertPanelExpanded: true,
      isStatsPanelExpanded: true,
      showRuleEditor: false,
      selectedProfile: null,

      // Initialization
      initialize: () => {
        idsEngine = getIDSEngine();
        ipsEngine = getIPSEngine(idsEngine);
        
        // Load default rule set
        idsEngine.loadRules(DEFAULT_RULE_SET.rules);
        
        setupListeners();
        
        set({
          isInitialized: true,
          idsConfig: idsEngine.getConfig(),
          ipsConfig: ipsEngine.getConfig(),
          statistics: idsEngine.getStatistics(),
        });
      },

      destroy: () => {
        idsEngine.stop();
        ipsEngine?.stop();
        resetIDSEngine();
        resetIPSEngine();
        isListenersSetup = false;
        
        set({
          isInitialized: false,
          isRunning: false,
          alerts: [],
          blocklist: [],
          statistics: null,
        });
      },

      start: () => {
        if (!get().isInitialized) {
          get().initialize();
        }
        
        idsEngine.start();
        ipsEngine?.start();
        
        set({
          isRunning: true,
          statistics: idsEngine.getStatistics(),
        });
      },

      stop: () => {
        idsEngine.stop();
        ipsEngine?.stop();
        
        set({
          isRunning: false,
          statistics: idsEngine.getStatistics(),
        });
      },

      // Mode
      setMode: (mode) => {
        idsEngine.setMode(mode);
        if (ipsEngine) {
          ipsEngine.setMode(mode === 'ids' ? 'passive' : 'active');
        }
        set({ mode });
      },

      // Configuration
      updateIDSConfig: (config) => {
        idsEngine.setConfig(config);
        set({ idsConfig: idsEngine.getConfig() });
      },

      updateIPSConfig: (config) => {
        if (ipsEngine) {
          ipsEngine.setConfig(config);
          set({ ipsConfig: ipsEngine.getConfig() });
        }
      },

      applyProfile: (profile) => {
        get().setMode(profile.mode);
        get().updateIDSConfig({
          alertThreshold: profile.alertThreshold,
          maxAlertsPerSecond: profile.maxAlertsPerSecond,
        });
        
        if (ipsEngine) {
          get().updateIPSConfig({
            autoBlockEnabled: profile.autoBlock,
            autoBlockDuration: profile.blockDuration,
          });
        }
        
        set({ selectedProfile: profile });
      },

      // Rules
      loadRuleSet: (ruleSetId) => {
        const ruleSet = ALL_RULE_SETS.find(rs => rs.id === ruleSetId);
        if (ruleSet) {
          idsEngine.loadRules(ruleSet.rules);
          set((state) => ({
            enabledRuleSets: [...new Set([...state.enabledRuleSets, ruleSetId])],
          }));
        }
      },

      unloadRuleSet: (ruleSetId) => {
        const ruleSet = ALL_RULE_SETS.find(rs => rs.id === ruleSetId);
        if (ruleSet) {
          ruleSet.rules.forEach(rule => idsEngine.removeRule(rule.id));
          set((state) => ({
            enabledRuleSets: state.enabledRuleSets.filter(id => id !== ruleSetId),
          }));
        }
      },

      enableRule: (ruleId) => {
        idsEngine.enableRule(ruleId);
      },

      disableRule: (ruleId) => {
        idsEngine.disableRule(ruleId);
      },

      addCustomRule: (rule) => {
        idsEngine.loadRule(rule);
        set((state) => ({
          customRules: [...state.customRules, rule],
        }));
      },

      removeCustomRule: (ruleId) => {
        idsEngine.removeRule(ruleId);
        set((state) => ({
          customRules: state.customRules.filter(r => r.id !== ruleId),
        }));
      },

      setRuleSearchQuery: (query) => {
        set({ ruleSearchQuery: query });
      },

      selectRule: (ruleId) => {
        set({ selectedRuleId: ruleId });
      },

      // Alerts
      selectAlert: (alertId) => {
        set({ selectedAlertId: alertId });
      },

      acknowledgeAlert: (alertId) => {
        idsEngine.acknowledgeAlert(alertId);
        set((state) => ({
          alerts: state.alerts.map(a =>
            a.id === alertId
              ? { ...a, status: 'acknowledged' as AlertStatus, acknowledgedAt: Date.now() }
              : a
          ),
        }));
      },

      resolveAlert: (alertId, notes) => {
        idsEngine.resolveAlert(alertId, undefined, notes);
        set((state) => ({
          alerts: state.alerts.map(a =>
            a.id === alertId
              ? { 
                  ...a, 
                  status: 'resolved' as AlertStatus, 
                  resolvedAt: Date.now(),
                  notes: notes ? [...(a.notes || []), notes] : a.notes,
                }
              : a
          ),
        }));
      },

      markFalsePositive: (alertId) => {
        idsEngine.markFalsePositive(alertId);
        set((state) => ({
          alerts: state.alerts.map(a =>
            a.id === alertId
              ? { ...a, status: 'false_positive' as AlertStatus, isFalsePositive: true }
              : a
          ),
        }));
      },

      clearAlerts: () => {
        idsEngine.clearAlerts();
        set({ alerts: [] });
      },

      setAlertFilters: (filters) => {
        set((state) => ({
          alertFilters: { ...state.alertFilters, ...filters },
        }));
      },

      // Blocklist
      blockIP: (ip, reason, duration) => {
        if (ipsEngine) {
          ipsEngine.blockIP(ip, reason, duration);
        }
      },

      unblockIP: (ip) => {
        if (ipsEngine) {
          ipsEngine.unblockIP(ip);
        }
      },

      clearBlocklist: () => {
        if (ipsEngine) {
          ipsEngine.clearBlocklist();
        }
        set({ blocklist: [] });
      },

      // UI
      setActiveTab: (tab) => {
        set({ activeTab: tab });
      },

      toggleAlertPanel: () => {
        set((state) => ({ isAlertPanelExpanded: !state.isAlertPanelExpanded }));
      },

      toggleStatsPanel: () => {
        set((state) => ({ isStatsPanelExpanded: !state.isStatsPanelExpanded }));
      },

      setShowRuleEditor: (show) => {
        set({ showRuleEditor: show });
      },

      // Getters
      getFilteredAlerts: () => {
        const { alerts, alertFilters } = get();
        let filtered = alerts;

        if (alertFilters.severity !== 'all') {
          filtered = filtered.filter(a => a.severity === alertFilters.severity);
        }

        if (alertFilters.category !== 'all') {
          filtered = filtered.filter(a => a.category === alertFilters.category);
        }

        if (alertFilters.status !== 'all') {
          filtered = filtered.filter(a => a.status === alertFilters.status);
        }

        if (alertFilters.timeRange !== 'all') {
          const now = Date.now();
          const ranges: Record<string, number> = {
            '1h': 3600000,
            '24h': 86400000,
            '7d': 604800000,
            '30d': 2592000000,
          };
          const cutoff = now - (ranges[alertFilters.timeRange] || 0);
          filtered = filtered.filter(a => a.timestamp >= cutoff);
        }

        if (alertFilters.searchQuery) {
          const query = alertFilters.searchQuery.toLowerCase();
          filtered = filtered.filter(a =>
            a.message.toLowerCase().includes(query) ||
            a.sourceIP.includes(query) ||
            a.destIP.includes(query) ||
            a.ruleName.toLowerCase().includes(query)
          );
        }

        return filtered;
      },

      getFilteredRules: () => {
        const { ruleSearchQuery, enabledRuleSets, customRules, ruleSets } = get();
        
        let allRules: IDSRule[] = [...customRules];
        
        for (const ruleSetId of enabledRuleSets) {
          const ruleSet = ruleSets.find(rs => rs.id === ruleSetId);
          if (ruleSet) {
            allRules = [...allRules, ...ruleSet.rules];
          }
        }

        if (!ruleSearchQuery) return allRules;

        const query = ruleSearchQuery.toLowerCase();
        return allRules.filter(r =>
          r.name.toLowerCase().includes(query) ||
          r.options.msg.toLowerCase().includes(query) ||
          r.category.toLowerCase().includes(query) ||
          String(r.options.sid).includes(query)
        );
      },

      getAlertsByRule: (ruleId) => {
        return get().alerts.filter(a => a.ruleId === ruleId);
      },

      getStatsByCategory: () => {
        const { alerts } = get();
        const stats: Record<string, number> = {};
        
        for (const alert of alerts) {
          stats[alert.category] = (stats[alert.category] || 0) + 1;
        }
        
        return stats;
      },
    };
  })
);

// ============================================================================
// Selectors (use with useShallow for array returns)
// ============================================================================

// Simple count selectors (no array filtering needed at selector level)
export const selectNewAlertsCount = (state: IDSStoreState) =>
  state.alerts.filter(a => a.status === 'new').length;

export const selectCriticalAlertsCount = (state: IDSStoreState) =>
  state.alerts.filter(a => a.severity === 'critical' && a.status === 'new').length;

export const selectActiveBlocksCount = (state: IDSStoreState) =>
  state.blocklist.filter(b => !b.expiresAt || b.expiresAt > Date.now()).length;

export const selectDetectionProfiles = () => DETECTION_PROFILES;

export const selectRuleSetById = (ruleSetId: string) => (state: IDSStoreState) =>
  state.ruleSets.find(rs => rs.id === ruleSetId);

// Export useShallow for consumers that need filtered arrays
export { useShallow };
