/**
 * Network Attacks Module
 * 
 * Central export point for all attack simulation functionality.
 * For educational purposes only - Network Security Virtual Lab.
 */

// ============================================================================
// Imports (needed for helper functions and templates)
// ============================================================================

import {
  AttackTemplate,
  ARPSpoofingConfig,
  DNSPoisoningConfig,
  PortScanConfig,
  SYNFloodConfig,
  MITMConfig,
} from './types';

import { AttackSimulator } from './AttackSimulator';
import { ARPSpoofingHandler, ARPSpoofingEducation } from './ARPSpoofingHandler';
import { DNSPoisoningHandler, DNSPoisoningEducation } from './DNSPoisoningHandler';
import { PortScanHandler, PortScanEducation } from './PortScanHandler';
import { SYNFloodHandler, SYNFloodEducation } from './SYNFloodHandler';
import { MITMHandler, MITMEducation } from './MITMHandler';

// ============================================================================
// Re-exports
// ============================================================================

// Core types
export * from './types';

// Attack Simulator
export {
  AttackSimulator,
  getAttackSimulator,
  resetAttackSimulator,
  generateId,
  generateMAC,
  generateIP,
  delay,
  type AttackHandler,
} from './AttackSimulator';

// Attack Handlers
export { ARPSpoofingHandler, ARPSpoofingEducation } from './ARPSpoofingHandler';
export { DNSPoisoningHandler, DNSPoisoningEducation } from './DNSPoisoningHandler';
export { PortScanHandler, PortScanEducation } from './PortScanHandler';
export { SYNFloodHandler, SYNFloodEducation } from './SYNFloodHandler';
export { MITMHandler, MITMEducation } from './MITMHandler';

// ============================================================================
// Attack Templates (Predefined Scenarios)
// ============================================================================

export const ATTACK_TEMPLATES: AttackTemplate[] = [
  {
    id: 'arp-spoof-basic',
    name: 'Basic ARP Spoofing',
    description: 'Intercept traffic between a target and the gateway using ARP cache poisoning.',
    category: 'spoofing',
    attackType: 'arp-spoofing',
    difficulty: 'beginner',
    educationalContent: {
      overview: 'ARP Spoofing allows an attacker to associate their MAC address with a target IP.',
      howItWorks: [
        'Send forged ARP replies to target',
        'Target updates ARP cache with attacker MAC',
        'Traffic meant for gateway flows through attacker',
      ],
      impact: ['Man-in-the-Middle attacks', 'Session hijacking', 'Data theft'],
      prevention: ['Dynamic ARP Inspection', 'Static ARP entries', 'VPNs'],
      detection: ['ARP monitoring tools', 'IDS/IPS', 'Duplicate IP detection'],
    },
    defaultConfig: {
      type: 'arp-spoofing',
      category: 'spoofing',
      name: 'ARP Spoofing Attack',
      description: 'Basic ARP cache poisoning',
      intensity: 'medium',
      mode: 'two-way',
      arpInterval: 1000,
      gratuitousArp: true,
    } as Partial<ARPSpoofingConfig>,
    requiredKnowledge: ['ARP protocol', 'MAC addresses', 'Network layers'],
    relatedAttacks: ['mitm', 'dns-poisoning'],
    cvssScore: 7.5,
    mitreAttackId: 'T1557.002',
  },
  {
    id: 'dns-poison-basic',
    name: 'DNS Cache Poisoning',
    description: 'Redirect users to malicious sites by poisoning DNS cache.',
    category: 'spoofing',
    attackType: 'dns-poisoning',
    difficulty: 'intermediate',
    educationalContent: {
      overview: 'DNS Poisoning corrupts DNS resolver cache to redirect traffic.',
      howItWorks: [
        'Send forged DNS responses',
        'Beat legitimate server response',
        'Victim caches malicious IP mapping',
      ],
      impact: ['Phishing', 'Malware distribution', 'Credential theft'],
      prevention: ['DNSSEC', 'DoH/DoT', 'Response validation'],
      detection: ['DNS monitoring', 'Response verification', 'Cache inspection'],
    },
    defaultConfig: {
      type: 'dns-poisoning',
      category: 'spoofing',
      name: 'DNS Poisoning Attack',
      description: 'DNS cache poisoning',
      intensity: 'medium',
      cachePoison: true,
      transactionIdGuessing: false,
    } as Partial<DNSPoisoningConfig>,
    requiredKnowledge: ['DNS protocol', 'Caching', 'UDP'],
    relatedAttacks: ['mitm', 'arp-spoofing'],
    cvssScore: 8.0,
    mitreAttackId: 'T1557.004',
  },
  {
    id: 'port-scan-stealth',
    name: 'Stealth Port Scan',
    description: 'Discover open ports using SYN stealth scanning technique.',
    category: 'reconnaissance',
    attackType: 'port-scan',
    difficulty: 'beginner',
    educationalContent: {
      overview: 'Port scanning identifies open services on target systems.',
      howItWorks: [
        'Send SYN packets to target ports',
        'Analyze responses (SYN/ACK vs RST)',
        'Never complete handshake (stealth)',
      ],
      impact: ['Service discovery', 'Attack surface mapping', 'Vulnerability identification'],
      prevention: ['Firewall rules', 'Port knocking', 'Rate limiting'],
      detection: ['IDS signatures', 'Connection monitoring', 'Log analysis'],
    },
    defaultConfig: {
      type: 'port-scan',
      category: 'reconnaissance',
      name: 'Stealth Port Scan',
      description: 'SYN stealth scan',
      intensity: 'low',
      scanType: 'syn',
      portRange: { start: 1, end: 1024 },
      timing: 'normal',
      serviceDetection: true,
      osDetection: false,
    } as Partial<PortScanConfig>,
    requiredKnowledge: ['TCP handshake', 'Port numbers', 'Common services'],
    relatedAttacks: ['syn-flood'],
    cvssScore: 3.0,
    mitreAttackId: 'T1046',
  },
  {
    id: 'syn-flood-dos',
    name: 'SYN Flood DoS',
    description: 'Denial of Service attack using TCP SYN flood.',
    category: 'denial-of-service',
    attackType: 'syn-flood',
    difficulty: 'intermediate',
    educationalContent: {
      overview: 'SYN Flood exhausts server resources with half-open connections.',
      howItWorks: [
        'Send high volume of SYN packets',
        'Server allocates resources for each',
        'Connection table fills up',
        'Legitimate connections blocked',
      ],
      impact: ['Service unavailability', 'Resource exhaustion', 'Business disruption'],
      prevention: ['SYN cookies', 'Rate limiting', 'DDoS protection'],
      detection: ['Traffic analysis', 'Connection monitoring', 'Anomaly detection'],
    },
    defaultConfig: {
      type: 'syn-flood',
      category: 'denial-of-service',
      name: 'SYN Flood Attack',
      description: 'TCP SYN flood DoS',
      intensity: 'high',
      packetsPerSecond: 1000,
      randomSourceIP: true,
      randomSourcePort: true,
      targetPorts: [80, 443],
      tcpFlags: { syn: true, ack: false, fin: false, rst: false, psh: false, urg: false },
    } as Partial<SYNFloodConfig>,
    requiredKnowledge: ['TCP handshake', 'DoS concepts', 'Network resources'],
    relatedAttacks: ['udp-flood', 'icmp-flood'],
    cvssScore: 7.5,
    mitreAttackId: 'T1498.001',
  },
  {
    id: 'mitm-full',
    name: 'Full MITM Attack',
    description: 'Complete Man-in-the-Middle attack with traffic interception.',
    category: 'man-in-the-middle',
    attackType: 'mitm',
    difficulty: 'advanced',
    educationalContent: {
      overview: 'MITM allows complete interception and modification of traffic.',
      howItWorks: [
        'Position attacker between target and network',
        'Intercept all traffic',
        'Optionally strip SSL encryption',
        'Capture credentials and data',
      ],
      impact: ['Data theft', 'Credential capture', 'Session hijacking', 'Data modification'],
      prevention: ['HTTPS everywhere', 'HSTS', 'VPN', 'Certificate pinning'],
      detection: ['Certificate validation', 'ARP monitoring', 'Traffic analysis'],
    },
    defaultConfig: {
      type: 'mitm',
      category: 'man-in-the-middle',
      name: 'MITM Attack',
      description: 'Full man-in-the-middle attack',
      intensity: 'high',
      technique: 'arp-spoofing',
      interceptProtocols: ['http', 'dns', 'ftp'],
      sslStripping: true,
      packetModification: false,
      credentialCapture: true,
    } as Partial<MITMConfig>,
    requiredKnowledge: ['ARP', 'SSL/TLS', 'HTTP', 'Network protocols'],
    relatedAttacks: ['arp-spoofing', 'dns-poisoning'],
    cvssScore: 9.0,
    mitreAttackId: 'T1557',
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Initialize all attack handlers with the simulator
 */
export function initializeAttackHandlers(simulator: AttackSimulator): void {
  simulator.registerHandler(new ARPSpoofingHandler());
  simulator.registerHandler(new DNSPoisoningHandler());
  simulator.registerHandler(new PortScanHandler());
  simulator.registerHandler(new SYNFloodHandler());
  simulator.registerHandler(new MITMHandler());
}

/**
 * Get attack template by ID
 */
export function getAttackTemplate(templateId: string): AttackTemplate | undefined {
  return ATTACK_TEMPLATES.find(t => t.id === templateId);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): AttackTemplate[] {
  return ATTACK_TEMPLATES.filter(t => t.category === category);
}

/**
 * Get templates by difficulty
 */
export function getTemplatesByDifficulty(difficulty: AttackTemplate['difficulty']): AttackTemplate[] {
  return ATTACK_TEMPLATES.filter(t => t.difficulty === difficulty);
}

/**
 * Get educational content for an attack type
 */
export function getEducationalContent(attackType: string): typeof ARPSpoofingEducation | null {
  const educationMap: Record<string, typeof ARPSpoofingEducation> = {
    'arp-spoofing': ARPSpoofingEducation,
    'dns-poisoning': DNSPoisoningEducation,
    'port-scan': PortScanEducation,
    'syn-flood': SYNFloodEducation,
    'mitm': MITMEducation,
  };
  return educationMap[attackType] || null;
}
