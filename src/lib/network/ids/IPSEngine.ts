/**
 * IPS Engine - Intrusion Prevention System
 * 
 * Prevention engine that can block, drop, or reject malicious traffic
 * based on IDS alerts and configurable policies.
 * 
 * Network Security Virtual Lab - Educational Platform
 */

import { EventEmitter } from 'events';
import {
  IDSConfig,
  IDSAlert,
  IPSAction,
  BlocklistEntry,
  RuleAction,
  AlertSeverity,
  IDSEventType,
} from './types';
import { IDSEngine } from './IDSEngine';
import { AttackPacket } from '../attacks/types';

// ============================================================================
// Types
// ============================================================================

type IPSEventCallback = (data: unknown) => void;

/** IPS-specific configuration */
export interface IPSConfig {
  enabled: boolean;
  mode: 'passive' | 'active' | 'learning';
  
  // Auto-blocking thresholds
  autoBlockEnabled: boolean;
  autoBlockThreshold: number; // alerts before auto-block
  autoBlockDuration: number; // milliseconds
  
  // Severity-based actions
  criticalAction: RuleAction;
  highAction: RuleAction;
  mediumAction: RuleAction;
  lowAction: RuleAction;
  
  // Blocklist settings
  maxBlocklistSize: number;
  blocklistCleanupInterval: number; // milliseconds
  
  // Rate limiting
  rateLimitEnabled: boolean;
  maxPacketsPerSecond: number;
  rateLimitWindow: number; // milliseconds
  
  // Whitelisting
  whitelistedIPs: string[];
  whitelistedPorts: number[];
  
  // Logging
  logBlockedPackets: boolean;
  logActions: boolean;
}

interface RateLimitState {
  ip: string;
  count: number;
  windowStart: number;
  blocked: boolean;
}

interface AlertTracker {
  ip: string;
  alertCount: number;
  lastAlert: number;
  severityCounts: Record<AlertSeverity, number>;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_IPS_CONFIG: IPSConfig = {
  enabled: true,
  mode: 'active',
  autoBlockEnabled: true,
  autoBlockThreshold: 5,
  autoBlockDuration: 300000, // 5 minutes
  criticalAction: 'drop',
  highAction: 'drop',
  mediumAction: 'alert',
  lowAction: 'alert',
  maxBlocklistSize: 10000,
  blocklistCleanupInterval: 60000, // 1 minute
  rateLimitEnabled: true,
  maxPacketsPerSecond: 1000,
  rateLimitWindow: 1000,
  whitelistedIPs: ['127.0.0.1', '::1'],
  whitelistedPorts: [],
  logBlockedPackets: true,
  logActions: true,
};

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(): string {
  return `ips-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// IPS Engine Class
// ============================================================================

export class IPSEngine {
  private config: IPSConfig;
  private idsEngine: IDSEngine;
  private emitter: EventEmitter;
  
  // State
  private blocklist: Map<string, BlocklistEntry>;
  private actions: Map<string, IPSAction>;
  private rateLimitStates: Map<string, RateLimitState>;
  private alertTrackers: Map<string, AlertTracker>;
  private isRunning: boolean;
  
  // Statistics
  private stats: {
    packetsInspected: number;
    packetsBlocked: number;
    packetsDropped: number;
    packetsRejected: number;
    connectionsReset: number;
    activeBlocks: number;
    totalActions: number;
  };
  
  // Cleanup interval
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(idsEngine: IDSEngine, config: Partial<IPSConfig> = {}) {
    this.config = { ...DEFAULT_IPS_CONFIG, ...config };
    this.idsEngine = idsEngine;
    this.emitter = new EventEmitter();
    
    this.blocklist = new Map();
    this.actions = new Map();
    this.rateLimitStates = new Map();
    this.alertTrackers = new Map();
    this.isRunning = false;
    
    this.stats = {
      packetsInspected: 0,
      packetsBlocked: 0,
      packetsDropped: 0,
      packetsRejected: 0,
      connectionsReset: 0,
      activeBlocks: 0,
      totalActions: 0,
    };
    
    // Subscribe to IDS alerts
    this.setupIDSIntegration();
  }

  // ============================================================================
  // Lifecycle Methods
  // ============================================================================

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.startCleanupInterval();
    this.emit('engine:start', { config: this.config });
  }

  stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    this.stopCleanupInterval();
    this.emit('engine:stop', { statistics: this.stats });
  }

  destroy(): void {
    this.stop();
    this.blocklist.clear();
    this.actions.clear();
    this.rateLimitStates.clear();
    this.alertTrackers.clear();
    this.emitter.removeAllListeners();
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  setConfig(config: Partial<IPSConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): IPSConfig {
    return { ...this.config };
  }

  setMode(mode: IPSConfig['mode']): void {
    this.config.mode = mode;
  }

  // ============================================================================
  // IDS Integration
  // ============================================================================

  private setupIDSIntegration(): void {
    // Subscribe to new alerts from IDS
    this.idsEngine.on('alert:new', (data: unknown) => {
      this.handleAlert(data as IDSAlert);
    });
  }

  private handleAlert(alert: IDSAlert): void {
    if (!this.config.enabled || this.config.mode === 'passive') {
      return;
    }

    // Track alerts per source IP
    this.trackAlert(alert);

    // Determine action based on severity
    const action = this.getActionForSeverity(alert.severity);
    
    // Execute action if in active mode
    if (this.config.mode === 'active' && action !== 'alert' && action !== 'pass') {
      this.executeAction(action, alert);
    }

    // Check for auto-blocking threshold
    if (this.config.autoBlockEnabled) {
      this.checkAutoBlock(alert.sourceIP);
    }
  }

  private trackAlert(alert: IDSAlert): void {
    const ip = alert.sourceIP;
    let tracker = this.alertTrackers.get(ip);
    
    if (!tracker) {
      tracker = {
        ip,
        alertCount: 0,
        lastAlert: Date.now(),
        severityCounts: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          info: 0,
        },
      };
      this.alertTrackers.set(ip, tracker);
    }
    
    tracker.alertCount++;
    tracker.lastAlert = Date.now();
    tracker.severityCounts[alert.severity]++;
  }

  private getActionForSeverity(severity: AlertSeverity): RuleAction {
    switch (severity) {
      case 'critical':
        return this.config.criticalAction;
      case 'high':
        return this.config.highAction;
      case 'medium':
        return this.config.mediumAction;
      case 'low':
      case 'info':
        return this.config.lowAction;
      default:
        return 'alert';
    }
  }

  private checkAutoBlock(ip: string): void {
    const tracker = this.alertTrackers.get(ip);
    if (!tracker) return;
    
    // Check if threshold exceeded
    if (tracker.alertCount >= this.config.autoBlockThreshold) {
      // Check if not already blocked
      if (!this.blocklist.has(ip)) {
        this.blockIP(ip, 'Auto-blocked: Alert threshold exceeded', this.config.autoBlockDuration);
      }
    }
  }

  // ============================================================================
  // Packet Processing
  // ============================================================================

  /**
   * Process a packet and determine if it should be allowed or blocked
   * Returns true if packet should be allowed, false if blocked
   */
  processPacket(packet: AttackPacket): { allowed: boolean; action?: RuleAction; reason?: string } {
    if (!this.config.enabled) {
      return { allowed: true };
    }

    this.stats.packetsInspected++;

    // Check whitelist first
    if (this.isWhitelisted(packet)) {
      return { allowed: true };
    }

    // Check blocklist
    const blockEntry = this.blocklist.get(packet.sourceIP);
    if (blockEntry && this.isBlockActive(blockEntry)) {
      this.stats.packetsBlocked++;
      blockEntry.hitCount++;
      blockEntry.lastHit = Date.now();
      
      if (this.config.logBlockedPackets) {
        this.emit('action:block', {
          packet,
          reason: blockEntry.reason,
          blockEntry,
        });
      }
      
      return {
        allowed: false,
        action: 'drop',
        reason: `Blocked: ${blockEntry.reason}`,
      };
    }

    // Check rate limiting
    if (this.config.rateLimitEnabled) {
      const rateLimitResult = this.checkRateLimit(packet.sourceIP);
      if (!rateLimitResult.allowed) {
        this.stats.packetsDropped++;
        return {
          allowed: false,
          action: 'drop',
          reason: 'Rate limit exceeded',
        };
      }
    }

    // Run through IDS for analysis
    const alerts = this.idsEngine.analyzePacket(packet);
    
    // If in active mode and alerts generated, check for blocking action
    if (this.config.mode === 'active' && alerts.length > 0) {
      // Get the highest severity alert
      const highestSeverity = alerts.reduce((max, alert) => {
        const severityOrder: AlertSeverity[] = ['info', 'low', 'medium', 'high', 'critical'];
        return severityOrder.indexOf(alert.severity) > severityOrder.indexOf(max) 
          ? alert.severity 
          : max;
      }, 'info' as AlertSeverity);
      
      const action = this.getActionForSeverity(highestSeverity);
      
      if (action === 'drop' || action === 'reject' || action === 'sdrop') {
        this.stats.packetsDropped++;
        return {
          allowed: false,
          action,
          reason: `Alert: ${alerts[0].message}`,
        };
      }
    }

    return { allowed: true };
  }

  private isWhitelisted(packet: AttackPacket): boolean {
    // Check IP whitelist
    if (this.config.whitelistedIPs.includes(packet.sourceIP) ||
        this.config.whitelistedIPs.includes(packet.destIP)) {
      return true;
    }
    
    // Check port whitelist
    if (packet.destPort && this.config.whitelistedPorts.includes(packet.destPort)) {
      return true;
    }
    
    return false;
  }

  private isBlockActive(entry: BlocklistEntry): boolean {
    if (!entry.expiresAt) return true; // Permanent block
    return Date.now() < entry.expiresAt;
  }

  // ============================================================================
  // Rate Limiting
  // ============================================================================

  private checkRateLimit(ip: string): { allowed: boolean; currentRate: number } {
    const now = Date.now();
    let state = this.rateLimitStates.get(ip);
    
    if (!state || now - state.windowStart > this.config.rateLimitWindow) {
      // New window
      state = {
        ip,
        count: 1,
        windowStart: now,
        blocked: false,
      };
      this.rateLimitStates.set(ip, state);
      return { allowed: true, currentRate: 1 };
    }
    
    state.count++;
    
    // Calculate packets per second
    const windowSeconds = this.config.rateLimitWindow / 1000;
    const currentRate = state.count / windowSeconds;
    
    if (currentRate > this.config.maxPacketsPerSecond) {
      state.blocked = true;
      return { allowed: false, currentRate };
    }
    
    return { allowed: true, currentRate };
  }

  // ============================================================================
  // Blocking Actions
  // ============================================================================

  /**
   * Block an IP address
   */
  blockIP(
    ip: string, 
    reason: string, 
    duration?: number,
    options?: { ruleId?: string; alertId?: string }
  ): BlocklistEntry {
    const entry: BlocklistEntry = {
      id: generateId(),
      ip,
      addedAt: Date.now(),
      expiresAt: duration ? Date.now() + duration : undefined,
      reason,
      ruleId: options?.ruleId,
      alertId: options?.alertId,
      manual: !options?.alertId,
      hitCount: 0,
    };
    
    this.blocklist.set(ip, entry);
    this.stats.activeBlocks = this.blocklist.size;
    
    this.emit('action:block', { entry });
    
    if (this.config.logActions) {
      console.log(`[IPS] Blocked IP: ${ip} - Reason: ${reason}`);
    }
    
    return entry;
  }

  /**
   * Unblock an IP address
   */
  unblockIP(ip: string): boolean {
    const entry = this.blocklist.get(ip);
    if (!entry) return false;
    
    this.blocklist.delete(ip);
    this.stats.activeBlocks = this.blocklist.size;
    
    this.emit('action:unblock', { ip, entry });
    
    if (this.config.logActions) {
      console.log(`[IPS] Unblocked IP: ${ip}`);
    }
    
    return true;
  }

  /**
   * Check if an IP is blocked
   */
  isBlocked(ip: string): boolean {
    const entry = this.blocklist.get(ip);
    if (!entry) return false;
    return this.isBlockActive(entry);
  }

  /**
   * Get all blocked IPs
   */
  getBlocklist(): BlocklistEntry[] {
    return Array.from(this.blocklist.values()).filter(e => this.isBlockActive(e));
  }

  /**
   * Clear all blocks
   */
  clearBlocklist(): void {
    this.blocklist.clear();
    this.stats.activeBlocks = 0;
  }

  // ============================================================================
  // Action Execution
  // ============================================================================

  private executeAction(action: RuleAction, alert: IDSAlert): IPSAction | null {
    if (action === 'alert' || action === 'log' || action === 'pass') {
      return null;
    }

    const ipsAction: IPSAction = {
      id: generateId(),
      timestamp: Date.now(),
      alertId: alert.id,
      ruleId: alert.ruleId,
      action: this.mapRuleActionToIPSAction(action),
      target: {
        ip: alert.sourceIP,
        port: alert.sourcePort,
        connection: `${alert.sourceIP}:${alert.sourcePort || '*'} -> ${alert.destIP}:${alert.destPort || '*'}`,
      },
      duration: this.config.autoBlockDuration,
      expiresAt: Date.now() + this.config.autoBlockDuration,
      active: true,
      reason: alert.message,
      packetsBlocked: 0,
      bytesBlocked: 0,
    };

    this.actions.set(ipsAction.id, ipsAction);
    this.stats.totalActions++;

    // Execute the specific action
    switch (action) {
      case 'drop':
      case 'sdrop':
        this.stats.packetsDropped++;
        // Block the source IP
        this.blockIP(alert.sourceIP, alert.message, this.config.autoBlockDuration, {
          ruleId: alert.ruleId,
          alertId: alert.id,
        });
        break;
        
      case 'reject':
        this.stats.packetsRejected++;
        // In real IPS, would send RST/ICMP unreachable
        this.blockIP(alert.sourceIP, alert.message, this.config.autoBlockDuration, {
          ruleId: alert.ruleId,
          alertId: alert.id,
        });
        this.stats.connectionsReset++;
        break;
    }

    this.emit('action:executed', ipsAction);
    return ipsAction;
  }

  private mapRuleActionToIPSAction(action: RuleAction): IPSAction['action'] {
    switch (action) {
      case 'drop':
      case 'sdrop':
        return 'drop';
      case 'reject':
        return 'reject';
      default:
        return 'drop';
    }
  }

  // ============================================================================
  // Whitelist Management
  // ============================================================================

  addToWhitelist(ip: string): void {
    if (!this.config.whitelistedIPs.includes(ip)) {
      this.config.whitelistedIPs.push(ip);
      // Remove from blocklist if present
      this.blocklist.delete(ip);
    }
  }

  removeFromWhitelist(ip: string): void {
    const index = this.config.whitelistedIPs.indexOf(ip);
    if (index !== -1) {
      this.config.whitelistedIPs.splice(index, 1);
    }
  }

  getWhitelist(): string[] {
    return [...this.config.whitelistedIPs];
  }

  // ============================================================================
  // Statistics
  // ============================================================================

  getStatistics() {
    return {
      ...this.stats,
      blocklistSize: this.blocklist.size,
      rateLimitedIPs: Array.from(this.rateLimitStates.values()).filter(s => s.blocked).length,
      trackedIPs: this.alertTrackers.size,
    };
  }

  resetStatistics(): void {
    this.stats = {
      packetsInspected: 0,
      packetsBlocked: 0,
      packetsDropped: 0,
      packetsRejected: 0,
      connectionsReset: 0,
      activeBlocks: this.blocklist.size,
      totalActions: 0,
    };
  }

  // ============================================================================
  // Action History
  // ============================================================================

  getAction(actionId: string): IPSAction | undefined {
    return this.actions.get(actionId);
  }

  getActions(): IPSAction[] {
    return Array.from(this.actions.values());
  }

  getActiveActions(): IPSAction[] {
    return this.getActions().filter(a => a.active);
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredBlocks();
      this.cleanupRateLimitStates();
      this.cleanupAlertTrackers();
    }, this.config.blocklistCleanupInterval);
  }

  private stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  private cleanupExpiredBlocks(): void {
    const now = Date.now();
    
    for (const [ip, entry] of this.blocklist) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.blocklist.delete(ip);
        this.emit('action:unblock', { ip, entry, reason: 'expired' });
      }
    }
    
    this.stats.activeBlocks = this.blocklist.size;
  }

  private cleanupRateLimitStates(): void {
    const now = Date.now();
    const maxAge = this.config.rateLimitWindow * 10; // Keep for 10 windows
    
    for (const [ip, state] of this.rateLimitStates) {
      if (now - state.windowStart > maxAge) {
        this.rateLimitStates.delete(ip);
      }
    }
  }

  private cleanupAlertTrackers(): void {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour
    
    for (const [ip, tracker] of this.alertTrackers) {
      if (now - tracker.lastAlert > maxAge) {
        this.alertTrackers.delete(ip);
      }
    }
  }

  // ============================================================================
  // Event System
  // ============================================================================

  on(event: string, callback: IPSEventCallback): void {
    this.emitter.on(event, callback);
  }

  off(event: string, callback: IPSEventCallback): void {
    this.emitter.off(event, callback);
  }

  private emit(event: string, data: unknown): void {
    this.emitter.emit(event, data);
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let ipsEngineInstance: IPSEngine | null = null;

export function getIPSEngine(idsEngine?: IDSEngine): IPSEngine {
  if (!ipsEngineInstance) {
    if (!idsEngine) {
      throw new Error('IDSEngine must be provided when creating IPSEngine for the first time');
    }
    ipsEngineInstance = new IPSEngine(idsEngine);
  }
  return ipsEngineInstance;
}

export function resetIPSEngine(): void {
  if (ipsEngineInstance) {
    ipsEngineInstance.destroy();
    ipsEngineInstance = null;
  }
}
