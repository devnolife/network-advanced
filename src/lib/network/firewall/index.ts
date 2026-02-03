/**
 * Firewall/ACL Module Index
 * 
 * Central export point for the Firewall and Access Control List engines.
 * Network Security Virtual Lab - Educational Platform
 */

// Types
export * from './types';

// ACL Engine
export {
  ACLEngine,
  getACLEngine,
  resetACLEngine,
  type ACLEvaluationResult,
  type ACLStatistics,
  type ACLConfig,
} from './ACLEngine';

// Firewall Engine
export {
  FirewallEngine,
  getFirewallEngine,
  resetFirewallEngine,
  type PacketDecision,
} from './FirewallEngine';
