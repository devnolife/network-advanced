/**
 * IDS/IPS Module Index
 * 
 * Central export point for the Intrusion Detection and Prevention System.
 * Network Security Virtual Lab - Educational Platform
 */

// Types
export * from './types';

// Engines
export { IDSEngine, getIDSEngine, resetIDSEngine } from './IDSEngine';
export { IPSEngine, getIPSEngine, resetIPSEngine, type IPSConfig } from './IPSEngine';

// Rule Database
export {
  // Individual rule sets
  PORT_SCAN_RULES,
  ARP_ATTACK_RULES,
  DNS_ATTACK_RULES,
  DOS_ATTACK_RULES,
  WEB_ATTACK_RULES,
  BRUTE_FORCE_RULES,
  MALWARE_RULES,
  POLICY_RULES,
  MITM_RULES,
  
  // Complete rule sets
  DEFAULT_RULE_SET,
  SCAN_DETECTION_RULE_SET,
  DOS_PROTECTION_RULE_SET,
  WEB_SECURITY_RULE_SET,
  ALL_RULE_SETS,
  
  // Educational content
  IDS_EDUCATIONAL_CONTENT,
  
  // Helper functions
  getRuleById,
  getRulesBySeverity,
  getRulesByCategory,
  getEducationalContent,
  getAllRules,
} from './RuleDatabase';
