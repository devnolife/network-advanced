/**
 * ACL Engine - Access Control List Engine
 * 
 * Core engine for managing and evaluating Access Control Lists.
 * Supports standard, extended, and named ACLs.
 * 
 * Network Security Virtual Lab - Educational Platform
 */

import { EventEmitter } from 'events';
import {
  ACL,
  ACLRule,
  ACLAction,
  ACLProtocol,
  ACLDirection,
  ACLType,
  ACLSource,
  ACLDestination,
  ACLPort,
  FirewallPacket,
} from './types';

// ============================================================================
// Types
// ============================================================================

type ACLEventCallback = (data: unknown) => void;

export interface ACLEvaluationResult {
  matched: boolean;
  action: ACLAction;
  rule?: ACLRule;
  acl?: ACL;
  reason: string;
  processingTime: number;
}

export interface ACLStatistics {
  totalEvaluations: number;
  totalPermits: number;
  totalDenies: number;
  implicitDenies: number;
  rulesEvaluated: number;
  averageProcessingTime: number;
  startTime: number;
  lastUpdated: number;
}

export interface ACLConfig {
  implicitDeny: boolean;           // Default: true (implicit deny at end of ACL)
  logImplicitDeny: boolean;        // Log when implicit deny is hit
  enableTimeBasedACL: boolean;     // Enable time-based ACL rules
  cacheResults: boolean;           // Cache evaluation results for performance
  cacheTimeout: number;            // Cache timeout in ms
  maxRulesPerACL: number;          // Maximum rules per ACL
  maxACLs: number;                 // Maximum number of ACLs
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: ACLConfig = {
  implicitDeny: true,
  logImplicitDeny: true,
  enableTimeBasedACL: true,
  cacheResults: true,
  cacheTimeout: 5000,
  maxRulesPerACL: 1000,
  maxACLs: 100,
};

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(): string {
  return `acl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateRuleId(): string {
  return `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Parse IP address to number for comparison
 */
function ipToNumber(ip: string): number {
  if (ip === 'any') return 0;
  const parts = ip.split('.').map(Number);
  return (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
}

/**
 * Parse wildcard mask to number
 */
function wildcardToNumber(wildcard: string): number {
  const parts = wildcard.split('.').map(Number);
  return (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
}

/**
 * Check if IP matches with wildcard mask
 * Wildcard: 0 means must match, 1 means don't care
 */
function ipMatchesWithWildcard(packetIP: string, ruleIP: string, wildcard?: string): boolean {
  if (ruleIP === 'any') return true;
  
  const packetNum = ipToNumber(packetIP);
  const ruleNum = ipToNumber(ruleIP);
  
  if (!wildcard || wildcard === '0.0.0.0') {
    // Exact match required
    return packetNum === ruleNum;
  }
  
  const wildcardNum = wildcardToNumber(wildcard);
  // XOR and mask: if result is 0, they match
  return ((packetNum ^ ruleNum) & ~wildcardNum) === 0;
}

/**
 * Check if port matches ACL port specification
 */
function portMatches(packetPort: number | undefined, aclPort: ACLPort | undefined): boolean {
  if (aclPort === undefined || aclPort === 'any') return true;
  if (packetPort === undefined) return false;
  
  if (typeof aclPort === 'number') {
    return packetPort === aclPort;
  }
  
  // Port range
  return packetPort >= aclPort.start && packetPort <= aclPort.end;
}

/**
 * Check if protocol matches
 */
function protocolMatches(packetProtocol: ACLProtocol, ruleProtocol: ACLProtocol): boolean {
  if (ruleProtocol === 'any' || ruleProtocol === 'ip') return true;
  return packetProtocol === ruleProtocol;
}

/**
 * Check if current time is within time range
 */
function isWithinTimeRange(timeRange: ACLRule['timeRange']): boolean {
  if (!timeRange) return true;
  
  const now = new Date();
  const currentDay = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()];
  
  // Check day
  if (timeRange.days && !timeRange.days.includes(currentDay as 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')) {
    return false;
  }
  
  // Check time
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [startHour, startMin] = timeRange.startTime.split(':').map(Number);
  const [endHour, endMin] = timeRange.endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return currentTime >= startMinutes && currentTime <= endMinutes;
}

// ============================================================================
// ACL Engine Class
// ============================================================================

export class ACLEngine {
  private config: ACLConfig;
  private emitter: EventEmitter;
  private acls: Map<string, ACL>;
  private statistics: ACLStatistics;
  private evaluationCache: Map<string, { result: ACLEvaluationResult; timestamp: number }>;
  private isRunning: boolean;

  constructor(config: Partial<ACLConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.emitter = new EventEmitter();
    this.acls = new Map();
    this.evaluationCache = new Map();
    this.isRunning = false;
    
    this.statistics = this.initializeStatistics();
  }

  // ============================================================================
  // Lifecycle Methods
  // ============================================================================

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.statistics.startTime = Date.now();
    this.emit('engine:start', { config: this.config });
    
    // Start cache cleanup interval
    this.startCacheCleanup();
  }

  stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    this.emit('engine:stop', { statistics: this.statistics });
  }

  destroy(): void {
    this.stop();
    this.acls.clear();
    this.evaluationCache.clear();
    this.emitter.removeAllListeners();
  }

  private startCacheCleanup(): void {
    const cleanup = () => {
      if (!this.isRunning) return;
      
      const now = Date.now();
      for (const [key, entry] of this.evaluationCache) {
        if (now - entry.timestamp > this.config.cacheTimeout) {
          this.evaluationCache.delete(key);
        }
      }
      
      setTimeout(cleanup, this.config.cacheTimeout);
    };
    
    setTimeout(cleanup, this.config.cacheTimeout);
  }

  private initializeStatistics(): ACLStatistics {
    return {
      totalEvaluations: 0,
      totalPermits: 0,
      totalDenies: 0,
      implicitDenies: 0,
      rulesEvaluated: 0,
      averageProcessingTime: 0,
      startTime: Date.now(),
      lastUpdated: Date.now(),
    };
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  setConfig(config: Partial<ACLConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): ACLConfig {
    return { ...this.config };
  }

  // ============================================================================
  // ACL Management
  // ============================================================================

  createACL(params: {
    name: string;
    type: ACLType;
    description?: string;
  }): ACL {
    if (this.acls.size >= this.config.maxACLs) {
      throw new Error(`Maximum ACL limit (${this.config.maxACLs}) reached`);
    }

    const acl: ACL = {
      id: generateId(),
      name: params.name,
      type: params.type,
      rules: [],
      description: params.description,
      appliedTo: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.acls.set(acl.id, acl);
    this.emit('acl:created', acl);
    this.clearCache();
    
    return acl;
  }

  getACL(id: string): ACL | undefined {
    return this.acls.get(id);
  }

  getACLByName(name: string): ACL | undefined {
    for (const acl of this.acls.values()) {
      if (acl.name === name) return acl;
    }
    return undefined;
  }

  getAllACLs(): ACL[] {
    return Array.from(this.acls.values());
  }

  updateACL(id: string, updates: Partial<Omit<ACL, 'id' | 'createdAt'>>): ACL | undefined {
    const acl = this.acls.get(id);
    if (!acl) return undefined;

    Object.assign(acl, updates, { updatedAt: Date.now() });
    this.emit('acl:updated', acl);
    this.clearCache();
    
    return acl;
  }

  deleteACL(id: string): boolean {
    const acl = this.acls.get(id);
    if (!acl) return false;

    this.acls.delete(id);
    this.emit('acl:deleted', acl);
    this.clearCache();
    
    return true;
  }

  // ============================================================================
  // Rule Management
  // ============================================================================

  addRule(aclId: string, params: {
    action: ACLAction;
    protocol: ACLProtocol;
    source: ACLSource;
    destination: ACLDestination;
    sequence?: number;
    name?: string;
    description?: string;
    established?: boolean;
    log?: boolean;
    timeRange?: ACLRule['timeRange'];
  }): ACLRule | undefined {
    const acl = this.acls.get(aclId);
    if (!acl) return undefined;

    if (acl.rules.length >= this.config.maxRulesPerACL) {
      throw new Error(`Maximum rules per ACL (${this.config.maxRulesPerACL}) reached`);
    }

    // Calculate sequence if not provided
    const sequence = params.sequence ?? (acl.rules.length > 0 
      ? Math.max(...acl.rules.map(r => r.sequence)) + 10 
      : 10);

    const rule: ACLRule = {
      id: generateRuleId(),
      sequence,
      name: params.name,
      action: params.action,
      protocol: params.protocol,
      source: params.source,
      destination: params.destination,
      established: params.established,
      log: params.log,
      timeRange: params.timeRange,
      description: params.description,
      hitCount: 0,
      lastHit: undefined,
      enabled: true,
      createdAt: Date.now(),
    };

    // Insert in sequence order
    acl.rules.push(rule);
    acl.rules.sort((a, b) => a.sequence - b.sequence);
    acl.updatedAt = Date.now();

    this.emit('rule:added', { aclId, rule });
    this.clearCache();
    
    return rule;
  }

  updateRule(aclId: string, ruleId: string, updates: Partial<Omit<ACLRule, 'id' | 'createdAt'>>): ACLRule | undefined {
    const acl = this.acls.get(aclId);
    if (!acl) return undefined;

    const rule = acl.rules.find(r => r.id === ruleId);
    if (!rule) return undefined;

    Object.assign(rule, updates);
    
    // Re-sort if sequence changed
    if (updates.sequence !== undefined) {
      acl.rules.sort((a, b) => a.sequence - b.sequence);
    }
    
    acl.updatedAt = Date.now();
    this.emit('rule:updated', { aclId, rule });
    this.clearCache();
    
    return rule;
  }

  deleteRule(aclId: string, ruleId: string): boolean {
    const acl = this.acls.get(aclId);
    if (!acl) return false;

    const index = acl.rules.findIndex(r => r.id === ruleId);
    if (index === -1) return false;

    const rule = acl.rules.splice(index, 1)[0];
    acl.updatedAt = Date.now();
    
    this.emit('rule:deleted', { aclId, rule });
    this.clearCache();
    
    return true;
  }

  enableRule(aclId: string, ruleId: string): boolean {
    const rule = this.updateRule(aclId, ruleId, { enabled: true });
    return rule !== undefined;
  }

  disableRule(aclId: string, ruleId: string): boolean {
    const rule = this.updateRule(aclId, ruleId, { enabled: false });
    return rule !== undefined;
  }

  // ============================================================================
  // ACL Application to Interfaces
  // ============================================================================

  applyToInterface(aclId: string, interfaceName: string, direction: ACLDirection): boolean {
    const acl = this.acls.get(aclId);
    if (!acl) return false;

    // Remove any existing application to this interface/direction
    if (!acl.appliedTo) acl.appliedTo = [];
    acl.appliedTo = acl.appliedTo.filter(
      a => !(a.interface === interfaceName && a.direction === direction)
    );

    acl.appliedTo.push({ interface: interfaceName, direction });
    acl.updatedAt = Date.now();
    
    this.emit('acl:applied', { aclId, interface: interfaceName, direction });
    this.clearCache();
    
    return true;
  }

  removeFromInterface(aclId: string, interfaceName: string, direction: ACLDirection): boolean {
    const acl = this.acls.get(aclId);
    if (!acl || !acl.appliedTo) return false;

    const before = acl.appliedTo.length;
    acl.appliedTo = acl.appliedTo.filter(
      a => !(a.interface === interfaceName && a.direction === direction)
    );

    if (acl.appliedTo.length < before) {
      acl.updatedAt = Date.now();
      this.emit('acl:removed', { aclId, interface: interfaceName, direction });
      this.clearCache();
      return true;
    }

    return false;
  }

  // ============================================================================
  // Packet Evaluation
  // ============================================================================

  /**
   * Evaluate a packet against all applicable ACLs
   */
  evaluatePacket(packet: FirewallPacket, aclId?: string): ACLEvaluationResult {
    const startTime = performance.now();
    
    // Check cache
    const cacheKey = this.getCacheKey(packet, aclId);
    if (this.config.cacheResults) {
      const cached = this.evaluationCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout) {
        return cached.result;
      }
    }

    let result: ACLEvaluationResult;

    if (aclId) {
      // Evaluate against specific ACL
      result = this.evaluateAgainstACL(packet, aclId);
    } else {
      // Find applicable ACLs for the interface/direction
      result = this.evaluateAgainstAllACLs(packet);
    }

    result.processingTime = performance.now() - startTime;

    // Update statistics
    this.updateStatistics(result);

    // Cache result
    if (this.config.cacheResults) {
      this.evaluationCache.set(cacheKey, { result, timestamp: Date.now() });
    }

    // Emit event
    this.emit('packet:evaluated', { packet, result });

    return result;
  }

  private evaluateAgainstACL(packet: FirewallPacket, aclId: string): ACLEvaluationResult {
    const acl = this.acls.get(aclId);
    
    if (!acl) {
      return {
        matched: false,
        action: 'deny',
        reason: `ACL ${aclId} not found`,
        processingTime: 0,
      };
    }

    // Evaluate rules in sequence order
    for (const rule of acl.rules) {
      if (!rule.enabled) continue;

      // Check time-based rule
      if (this.config.enableTimeBasedACL && rule.timeRange) {
        if (!isWithinTimeRange(rule.timeRange)) continue;
      }

      const ruleMatches = this.ruleMatchesPacket(rule, packet, acl.type);
      this.statistics.rulesEvaluated++;

      if (ruleMatches) {
        // Update rule hit count
        rule.hitCount++;
        rule.lastHit = Date.now();

        // Log if required
        if (rule.log) {
          this.emit('rule:hit', { acl, rule, packet });
        }

        return {
          matched: true,
          action: rule.action,
          rule,
          acl,
          reason: `Matched rule ${rule.sequence}: ${rule.action} ${rule.protocol}`,
          processingTime: 0,
        };
      }
    }

    // Implicit deny at end of ACL
    if (this.config.implicitDeny) {
      this.statistics.implicitDenies++;
      
      if (this.config.logImplicitDeny) {
        this.emit('implicit:deny', { acl, packet });
      }

      return {
        matched: false,
        action: 'deny',
        acl,
        reason: 'Implicit deny at end of ACL',
        processingTime: 0,
      };
    }

    return {
      matched: false,
      action: 'permit',
      acl,
      reason: 'No matching rule (implicit permit)',
      processingTime: 0,
    };
  }

  private evaluateAgainstAllACLs(packet: FirewallPacket): ACLEvaluationResult {
    // Find ACLs applied to this interface/direction
    for (const acl of this.acls.values()) {
      if (!acl.appliedTo) continue;

      const applicable = acl.appliedTo.find(
        a => a.interface === packet.interface && a.direction === packet.direction
      );

      if (applicable) {
        const result = this.evaluateAgainstACL(packet, acl.id);
        if (result.matched || result.action === 'deny') {
          return result;
        }
      }
    }

    // No applicable ACL - permit by default
    return {
      matched: false,
      action: 'permit',
      reason: 'No applicable ACL',
      processingTime: 0,
    };
  }

  /**
   * Check if a rule matches a packet
   */
  private ruleMatchesPacket(rule: ACLRule, packet: FirewallPacket, aclType: ACLType): boolean {
    // Standard ACL: only checks source IP
    if (aclType === 'standard') {
      return ipMatchesWithWildcard(packet.sourceIP, rule.source.ip, rule.source.wildcard);
    }

    // Extended ACL: checks protocol, source, destination, ports
    
    // Protocol check
    if (!protocolMatches(packet.protocol, rule.protocol)) {
      return false;
    }

    // Source IP check
    if (!ipMatchesWithWildcard(packet.sourceIP, rule.source.ip, rule.source.wildcard)) {
      return false;
    }

    // Destination IP check
    if (!ipMatchesWithWildcard(packet.destIP, rule.destination.ip, rule.destination.wildcard)) {
      return false;
    }

    // Source port check (for TCP/UDP)
    if (rule.source.port !== undefined) {
      if (!portMatches(packet.sourcePort, rule.source.port)) {
        return false;
      }
    }

    // Destination port check (for TCP/UDP)
    if (rule.destination.port !== undefined) {
      if (!portMatches(packet.destPort, rule.destination.port)) {
        return false;
      }
    }

    // Established flag check (TCP only)
    if (rule.established && packet.protocol === 'tcp') {
      // Check for ACK or RST flag
      if (!packet.tcpFlags?.includes('ACK') && !packet.tcpFlags?.includes('RST')) {
        return false;
      }
    }

    return true;
  }

  private getCacheKey(packet: FirewallPacket, aclId?: string): string {
    return `${aclId || 'all'}:${packet.interface}:${packet.direction}:${packet.protocol}:${packet.sourceIP}:${packet.sourcePort}:${packet.destIP}:${packet.destPort}`;
  }

  private clearCache(): void {
    this.evaluationCache.clear();
  }

  private updateStatistics(result: ACLEvaluationResult): void {
    this.statistics.totalEvaluations++;
    
    if (result.action === 'permit') {
      this.statistics.totalPermits++;
    } else {
      this.statistics.totalDenies++;
    }

    // Update average processing time
    this.statistics.averageProcessingTime = 
      (this.statistics.averageProcessingTime * (this.statistics.totalEvaluations - 1) + result.processingTime) / 
      this.statistics.totalEvaluations;
    
    this.statistics.lastUpdated = Date.now();
  }

  // ============================================================================
  // CLI Command Generation (Educational)
  // ============================================================================

  /**
   * Generate Cisco IOS-style ACL commands
   */
  generateCiscoCommands(aclId: string): string[] {
    const acl = this.acls.get(aclId);
    if (!acl) return [];

    const commands: string[] = [];
    
    // Helper to format port
    const formatPortCmd = (port: ACLPort | undefined): string => {
      if (!port || port === 'any') return '';
      if (typeof port === 'number') return ` eq ${port}`;
      return ` eq ${port.start}`;
    };

    if (acl.type === 'named') {
      // Named ACL - always extended for this educational demo
      commands.push(`ip access-list extended ${acl.name}`);
      
      for (const rule of acl.rules) {
        let cmd = ` ${rule.sequence} ${rule.action}`;
        cmd += ` ${rule.protocol}`;
        cmd += ` ${rule.source.ip}${rule.source.wildcard ? ' ' + rule.source.wildcard : ''}`;
        cmd += formatPortCmd(rule.source.port);
        cmd += ` ${rule.destination.ip}${rule.destination.wildcard ? ' ' + rule.destination.wildcard : ''}`;
        cmd += formatPortCmd(rule.destination.port);
        
        if (rule.established) cmd += ' established';
        if (rule.log) cmd += ' log';
        
        commands.push(cmd);
      }
    } else if (acl.type === 'standard') {
      // Numbered standard ACL (1-99)
      const aclNumber = '10';
      
      for (const rule of acl.rules) {
        let cmd = `access-list ${aclNumber} ${rule.action}`;
        cmd += ` ${rule.source.ip}${rule.source.wildcard ? ' ' + rule.source.wildcard : ''}`;
        if (rule.log) cmd += ' log';
        commands.push(cmd);
      }
    } else {
      // Numbered extended ACL (100-199)
      const aclNumber = '100';
      
      for (const rule of acl.rules) {
        let cmd = `access-list ${aclNumber} ${rule.action}`;
        cmd += ` ${rule.protocol}`;
        cmd += ` ${rule.source.ip}${rule.source.wildcard ? ' ' + rule.source.wildcard : ''}`;
        cmd += ` ${rule.destination.ip}${rule.destination.wildcard ? ' ' + rule.destination.wildcard : ''}`;
        cmd += formatPortCmd(rule.destination.port);
        if (rule.log) cmd += ' log';
        commands.push(cmd);
      }
    }

    // Add interface application commands
    if (acl.appliedTo) {
      for (const app of acl.appliedTo) {
        commands.push(`interface ${app.interface}`);
        commands.push(` ip access-group ${acl.name} ${app.direction}`);
      }
    }

    return commands;
  }

  // ============================================================================
  // Statistics & Reports
  // ============================================================================

  getStatistics(): ACLStatistics {
    return { ...this.statistics };
  }

  resetStatistics(): void {
    this.statistics = this.initializeStatistics();
    
    // Reset hit counts on all rules
    for (const acl of this.acls.values()) {
      for (const rule of acl.rules) {
        rule.hitCount = 0;
        rule.lastHit = undefined;
      }
    }
  }

  getTopHitRules(limit: number = 10): { acl: ACL; rule: ACLRule }[] {
    const allRules: { acl: ACL; rule: ACLRule }[] = [];
    
    for (const acl of this.acls.values()) {
      for (const rule of acl.rules) {
        allRules.push({ acl, rule });
      }
    }

    return allRules
      .sort((a, b) => b.rule.hitCount - a.rule.hitCount)
      .slice(0, limit);
  }

  // ============================================================================
  // Event Handling
  // ============================================================================

  on(event: string, callback: ACLEventCallback): void {
    this.emitter.on(event, callback);
  }

  off(event: string, callback: ACLEventCallback): void {
    this.emitter.off(event, callback);
  }

  private emit(event: string, data: unknown): void {
    this.emitter.emit(event, data);
  }

  // ============================================================================
  // Preset ACL Templates (Educational)
  // ============================================================================

  static readonly ACL_TEMPLATES = {
    /**
     * Block all traffic from a specific network
     */
    blockNetwork: (networkIP: string, wildcard: string) => ({
      name: `BLOCK_${networkIP.replace(/\./g, '_')}`,
      type: 'standard' as ACLType,
      rules: [
        {
          action: 'deny' as ACLAction,
          protocol: 'ip' as ACLProtocol,
          source: { ip: networkIP, wildcard },
          destination: { ip: 'any' },
        },
        {
          action: 'permit' as ACLAction,
          protocol: 'ip' as ACLProtocol,
          source: { ip: 'any' },
          destination: { ip: 'any' },
        },
      ],
    }),

    /**
     * Allow only specific ports (web server)
     */
    webServerOnly: () => ({
      name: 'WEB_SERVER_ACCESS',
      type: 'extended' as ACLType,
      rules: [
        {
          action: 'permit' as ACLAction,
          protocol: 'tcp' as ACLProtocol,
          source: { ip: 'any' },
          destination: { ip: 'any', port: 80 as ACLPort },
        },
        {
          action: 'permit' as ACLAction,
          protocol: 'tcp' as ACLProtocol,
          source: { ip: 'any' },
          destination: { ip: 'any', port: 443 as ACLPort },
        },
        {
          action: 'deny' as ACLAction,
          protocol: 'ip' as ACLProtocol,
          source: { ip: 'any' },
          destination: { ip: 'any' },
          log: true,
        },
      ],
    }),

    /**
     * SSH management access from specific subnet
     */
    sshManagement: (adminSubnet: string, wildcard: string) => ({
      name: 'SSH_MANAGEMENT',
      type: 'extended' as ACLType,
      rules: [
        {
          action: 'permit' as ACLAction,
          protocol: 'tcp' as ACLProtocol,
          source: { ip: adminSubnet, wildcard },
          destination: { ip: 'any', port: 22 as ACLPort },
        },
        {
          action: 'deny' as ACLAction,
          protocol: 'tcp' as ACLProtocol,
          source: { ip: 'any' },
          destination: { ip: 'any', port: 22 as ACLPort },
          log: true,
        },
      ],
    }),

    /**
     * Block known malicious ports
     */
    blockMaliciousPorts: () => ({
      name: 'BLOCK_MALICIOUS',
      type: 'extended' as ACLType,
      rules: [
        // Block Telnet
        { action: 'deny' as ACLAction, protocol: 'tcp' as ACLProtocol, source: { ip: 'any' }, destination: { ip: 'any', port: 23 as ACLPort }, log: true },
        // Block FTP
        { action: 'deny' as ACLAction, protocol: 'tcp' as ACLProtocol, source: { ip: 'any' }, destination: { ip: 'any', port: 21 as ACLPort }, log: true },
        // Block SMB
        { action: 'deny' as ACLAction, protocol: 'tcp' as ACLProtocol, source: { ip: 'any' }, destination: { ip: 'any', port: 445 as ACLPort }, log: true },
        // Block RDP
        { action: 'deny' as ACLAction, protocol: 'tcp' as ACLProtocol, source: { ip: 'any' }, destination: { ip: 'any', port: 3389 as ACLPort }, log: true },
        // Permit everything else
        { action: 'permit' as ACLAction, protocol: 'ip' as ACLProtocol, source: { ip: 'any' }, destination: { ip: 'any' } },
      ],
    }),

    /**
     * Outbound only (allow established connections back in)
     */
    outboundOnly: () => ({
      name: 'OUTBOUND_ONLY',
      type: 'extended' as ACLType,
      rules: [
        // Allow established TCP connections
        {
          action: 'permit' as ACLAction,
          protocol: 'tcp' as ACLProtocol,
          source: { ip: 'any' },
          destination: { ip: 'any' },
          established: true,
        },
        // Allow DNS responses
        {
          action: 'permit' as ACLAction,
          protocol: 'udp' as ACLProtocol,
          source: { ip: 'any', port: 53 as ACLPort },
          destination: { ip: 'any' },
        },
        // Allow ICMP echo replies
        {
          action: 'permit' as ACLAction,
          protocol: 'icmp' as ACLProtocol,
          source: { ip: 'any' },
          destination: { ip: 'any' },
        },
        // Deny everything else inbound
        {
          action: 'deny' as ACLAction,
          protocol: 'ip' as ACLProtocol,
          source: { ip: 'any' },
          destination: { ip: 'any' },
          log: true,
        },
      ],
    }),
  };
}

// ============================================================================
// Singleton Instance
// ============================================================================

let aclEngineInstance: ACLEngine | null = null;

export function getACLEngine(): ACLEngine {
  if (!aclEngineInstance) {
    aclEngineInstance = new ACLEngine();
  }
  return aclEngineInstance;
}

export function resetACLEngine(): void {
  if (aclEngineInstance) {
    aclEngineInstance.destroy();
    aclEngineInstance = null;
  }
}
