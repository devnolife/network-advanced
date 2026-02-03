/**
 * IDS Rule Database
 * 
 * Predefined detection rules modeled after real-world IDS signatures.
 * Includes rules for common attacks, reconnaissance, and policy violations.
 * 
 * Network Security Virtual Lab - Educational Platform
 */

import { IDSRule, RuleSet, IDSEducationalContent } from './types';

// ============================================================================
// Helper Function
// ============================================================================

function createRule(
  id: string,
  name: string,
  sid: number,
  overrides: Partial<IDSRule>
): IDSRule {
  return {
    id,
    name,
    enabled: true,
    action: 'alert',
    protocol: 'any',
    sourceAddress: { type: 'any', value: 'any' },
    sourcePort: { type: 'any', value: 'any' },
    direction: 'to',
    destAddress: { type: 'any', value: 'any' },
    destPort: { type: 'any', value: 'any' },
    options: {
      msg: name,
      sid,
      rev: 1,
    },
    category: 'suspicious',
    severity: 'medium',
    detectionMethod: 'signature',
    ...overrides,
  };
}

// ============================================================================
// Port Scan Detection Rules
// ============================================================================

export const PORT_SCAN_RULES: IDSRule[] = [
  createRule('scan-syn-stealth', 'SYN Stealth Scan Detected', 1000001, {
    description: 'Detects TCP SYN scan attempts (half-open scanning)',
    protocol: 'tcp',
    category: 'scan',
    severity: 'medium',
    options: {
      msg: 'SCAN SYN Stealth Scan Detected',
      sid: 1000001,
      flags: 'S',
      flow: { stateless: true },
      threshold: {
        type: 'threshold',
        track: 'by_src',
        count: 20,
        seconds: 10,
      },
      classtype: 'attempted-recon',
      metadata: {
        mitreAttack: { tactic: 'reconnaissance', technique: 'T1046' },
      },
    },
    educational: {
      overview: 'SYN stealth scanning is a technique where the attacker sends SYN packets without completing the TCP handshake.',
      whatItDetects: 'Multiple SYN packets to different ports from the same source without completing connections.',
      whyItMatters: 'Port scanning is often the first step in an attack, used to identify running services and potential vulnerabilities.',
    },
  }),

  createRule('scan-fin', 'FIN Scan Detected', 1000002, {
    description: 'Detects TCP FIN scan attempts',
    protocol: 'tcp',
    category: 'scan',
    severity: 'medium',
    options: {
      msg: 'SCAN FIN Scan Detected',
      sid: 1000002,
      flags: 'F',
      flow: { stateless: true },
      threshold: {
        type: 'threshold',
        track: 'by_src',
        count: 10,
        seconds: 10,
      },
      classtype: 'attempted-recon',
    },
    educational: {
      overview: 'FIN scanning sends packets with only the FIN flag set to probe for open ports.',
      whatItDetects: 'Packets with only FIN flag that may bypass simple packet filters.',
      whyItMatters: 'FIN scans can evade basic firewalls that only look for SYN packets.',
    },
  }),

  createRule('scan-xmas', 'XMAS Scan Detected', 1000003, {
    description: 'Detects TCP XMAS scan (FIN+PSH+URG flags)',
    protocol: 'tcp',
    category: 'scan',
    severity: 'medium',
    options: {
      msg: 'SCAN XMAS Tree Scan Detected',
      sid: 1000003,
      flags: 'FPU',
      threshold: {
        type: 'threshold',
        track: 'by_src',
        count: 5,
        seconds: 10,
      },
      classtype: 'attempted-recon',
    },
    educational: {
      overview: 'XMAS scans send packets with FIN, PSH, and URG flags set (like a Christmas tree with all lights on).',
      whatItDetects: 'Unusual TCP packets with multiple flags that should not appear together.',
      whyItMatters: 'This scan type exploits RFC compliance differences between operating systems.',
    },
  }),

  createRule('scan-null', 'NULL Scan Detected', 1000004, {
    description: 'Detects TCP NULL scan (no flags set)',
    protocol: 'tcp',
    category: 'scan',
    severity: 'medium',
    options: {
      msg: 'SCAN NULL Scan Detected',
      sid: 1000004,
      flags: '0',
      threshold: {
        type: 'threshold',
        track: 'by_src',
        count: 10,
        seconds: 10,
      },
      classtype: 'attempted-recon',
    },
  }),

  createRule('scan-udp', 'UDP Port Scan Detected', 1000005, {
    description: 'Detects UDP port scanning activity',
    protocol: 'udp',
    category: 'scan',
    severity: 'low',
    options: {
      msg: 'SCAN UDP Port Scan Detected',
      sid: 1000005,
      threshold: {
        type: 'threshold',
        track: 'by_src',
        count: 30,
        seconds: 10,
      },
      classtype: 'attempted-recon',
    },
  }),
];

// ============================================================================
// ARP Attack Detection Rules
// ============================================================================

export const ARP_ATTACK_RULES: IDSRule[] = [
  createRule('arp-spoof-reply', 'ARP Spoofing - Unsolicited Reply', 1001001, {
    description: 'Detects unsolicited ARP reply packets that may indicate ARP spoofing',
    protocol: 'arp',
    category: 'reconnaissance',
    severity: 'high',
    options: {
      msg: 'ARP Spoofing Detected - Unsolicited Reply',
      sid: 1001001,
      content: [{ pattern: 'reply', nocase: true }],
      metadata: {
        mitreAttack: { tactic: 'credential-access', technique: 'T1557', subtechnique: '002' },
        cve: [],
        references: ['https://attack.mitre.org/techniques/T1557/002/'],
      },
      classtype: 'attempted-recon',
    },
    educational: {
      overview: 'ARP spoofing involves sending fake ARP messages to link the attacker\'s MAC with a legitimate IP.',
      whatItDetects: 'ARP reply packets that were not requested by any host on the network.',
      whyItMatters: 'ARP spoofing enables man-in-the-middle attacks and traffic interception.',
    },
  }),

  createRule('arp-flood', 'ARP Flood Attack', 1001002, {
    description: 'Detects excessive ARP traffic that may indicate flooding',
    protocol: 'arp',
    category: 'dos',
    severity: 'high',
    options: {
      msg: 'ARP Flood Attack Detected',
      sid: 1001002,
      threshold: {
        type: 'threshold',
        track: 'by_src',
        count: 100,
        seconds: 5,
      },
      classtype: 'attempted-dos',
    },
  }),

  createRule('arp-gratuitous-flood', 'Gratuitous ARP Flood', 1001003, {
    description: 'Detects flood of gratuitous ARP packets',
    protocol: 'arp',
    category: 'reconnaissance',
    severity: 'high',
    options: {
      msg: 'Gratuitous ARP Flood Detected',
      sid: 1001003,
      content: [{ pattern: 'gratuitous', nocase: true }],
      threshold: {
        type: 'threshold',
        track: 'by_src',
        count: 10,
        seconds: 5,
      },
    },
  }),
];

// ============================================================================
// DNS Attack Detection Rules
// ============================================================================

export const DNS_ATTACK_RULES: IDSRule[] = [
  createRule('dns-zone-transfer', 'DNS Zone Transfer Attempt', 1002001, {
    description: 'Detects DNS zone transfer (AXFR) attempts',
    protocol: 'dns',
    destPort: { type: 'single', value: 53 },
    category: 'reconnaissance',
    severity: 'high',
    options: {
      msg: 'DNS Zone Transfer Attempt (AXFR)',
      sid: 1002001,
      content: [{ pattern: 'AXFR', nocase: true }],
      metadata: {
        mitreAttack: { tactic: 'reconnaissance', technique: 'T1590' },
      },
      classtype: 'attempted-recon',
    },
    educational: {
      overview: 'DNS zone transfers can expose all DNS records for a domain.',
      whatItDetects: 'AXFR queries that attempt to retrieve complete DNS zone data.',
      whyItMatters: 'Successful zone transfers reveal network infrastructure.',
    },
  }),

  createRule('dns-tunneling', 'DNS Tunneling Suspected', 1002002, {
    description: 'Detects unusually long DNS queries that may indicate tunneling',
    protocol: 'dns',
    destPort: { type: 'single', value: 53 },
    category: 'exfiltration',
    severity: 'medium',
    options: {
      msg: 'DNS Tunneling Suspected - Long Query',
      sid: 1002002,
      dsize: '>100',
      metadata: {
        mitreAttack: { tactic: 'command-and-control', technique: 'T1071', subtechnique: '004' },
      },
      classtype: 'policy-violation',
    },
    educational: {
      overview: 'DNS tunneling encodes data in DNS queries to bypass firewalls.',
      whatItDetects: 'Abnormally long DNS queries that may contain encoded data.',
      whyItMatters: 'DNS tunneling can exfiltrate data or provide covert C2 channels.',
    },
  }),

  createRule('dns-poisoning', 'DNS Cache Poisoning Attempt', 1002003, {
    description: 'Detects potential DNS cache poisoning attempts',
    protocol: 'dns',
    sourcePort: { type: 'single', value: 53 },
    category: 'spoofing',
    severity: 'critical',
    options: {
      msg: 'DNS Cache Poisoning Attempt',
      sid: 1002003,
      content: [{ pattern: 'response', nocase: true }],
      threshold: {
        type: 'threshold',
        track: 'by_src',
        count: 10,
        seconds: 1,
      },
      metadata: {
        mitreAttack: { tactic: 'credential-access', technique: 'T1557', subtechnique: '004' },
      },
      classtype: 'bad-unknown',
    },
  }),

  createRule('dns-amplification', 'DNS Amplification Attack', 1002004, {
    description: 'Detects DNS amplification attack patterns',
    protocol: 'udp',
    sourcePort: { type: 'single', value: 53 },
    category: 'ddos',
    severity: 'critical',
    options: {
      msg: 'DNS Amplification Attack Detected',
      sid: 1002004,
      dsize: '>512',
      threshold: {
        type: 'threshold',
        track: 'by_dst',
        count: 50,
        seconds: 10,
      },
      classtype: 'attempted-dos',
    },
  }),
];

// ============================================================================
// DoS/DDoS Detection Rules
// ============================================================================

export const DOS_ATTACK_RULES: IDSRule[] = [
  createRule('dos-syn-flood', 'SYN Flood Attack', 1003001, {
    description: 'Detects TCP SYN flood denial of service attack',
    protocol: 'tcp',
    category: 'dos',
    severity: 'critical',
    options: {
      msg: 'DOS SYN Flood Attack Detected',
      sid: 1003001,
      flags: 'S',
      threshold: {
        type: 'threshold',
        track: 'by_dst',
        count: 500,
        seconds: 5,
      },
      metadata: {
        mitreAttack: { tactic: 'impact', technique: 'T1498', subtechnique: '001' },
      },
      classtype: 'attempted-dos',
    },
    educational: {
      overview: 'SYN floods overwhelm servers by exhausting connection state tables.',
      whatItDetects: 'High volume of SYN packets to a single destination.',
      whyItMatters: 'SYN floods can render services unavailable to legitimate users.',
    },
  }),

  createRule('dos-icmp-flood', 'ICMP Flood Attack', 1003002, {
    description: 'Detects ICMP flood denial of service attack',
    protocol: 'icmp',
    category: 'dos',
    severity: 'high',
    options: {
      msg: 'DOS ICMP Flood Attack Detected',
      sid: 1003002,
      threshold: {
        type: 'threshold',
        track: 'by_dst',
        count: 200,
        seconds: 5,
      },
      classtype: 'attempted-dos',
    },
  }),

  createRule('dos-udp-flood', 'UDP Flood Attack', 1003003, {
    description: 'Detects UDP flood denial of service attack',
    protocol: 'udp',
    category: 'dos',
    severity: 'high',
    options: {
      msg: 'DOS UDP Flood Attack Detected',
      sid: 1003003,
      threshold: {
        type: 'threshold',
        track: 'by_dst',
        count: 500,
        seconds: 5,
      },
      classtype: 'attempted-dos',
    },
  }),

  createRule('dos-slowloris', 'Slowloris Attack', 1003004, {
    description: 'Detects Slowloris slow HTTP DoS attack',
    protocol: 'tcp',
    destPort: { type: 'list', value: [80, 443, 8080] },
    category: 'dos',
    severity: 'high',
    options: {
      msg: 'DOS Slowloris Attack Suspected',
      sid: 1003004,
      flow: { toServer: true, established: true },
      content: [{ pattern: 'X-a:', nocase: true }],
      classtype: 'attempted-dos',
    },
  }),
];

// ============================================================================
// Web Attack Detection Rules
// ============================================================================

export const WEB_ATTACK_RULES: IDSRule[] = [
  createRule('web-sql-injection', 'SQL Injection Attempt', 1004001, {
    description: 'Detects SQL injection attempts in HTTP traffic',
    protocol: 'http',
    destPort: { type: 'list', value: [80, 443, 8080] },
    category: 'web-attack',
    severity: 'critical',
    options: {
      msg: 'WEB-ATTACK SQL Injection Attempt',
      sid: 1004001,
      flow: { toServer: true, established: true },
      pcre: [
        { pattern: '(?:\'|"|;|--|\\#|/\\*|\\*/|union|select|insert|update|delete|drop|exec|execute|xp_)', modifiers: 'i' },
      ],
      metadata: {
        mitreAttack: { tactic: 'initial-access', technique: 'T1190' },
        cve: [],
      },
      classtype: 'web-application-attack',
    },
    educational: {
      overview: 'SQL injection attacks manipulate database queries through user input.',
      whatItDetects: 'Common SQL keywords and syntax patterns in HTTP requests.',
      whyItMatters: 'SQL injection can lead to data theft, modification, or deletion.',
    },
  }),

  createRule('web-xss', 'Cross-Site Scripting (XSS) Attempt', 1004002, {
    description: 'Detects XSS attack attempts in HTTP traffic',
    protocol: 'http',
    destPort: { type: 'list', value: [80, 443, 8080] },
    category: 'web-attack',
    severity: 'high',
    options: {
      msg: 'WEB-ATTACK XSS Attempt',
      sid: 1004002,
      flow: { toServer: true, established: true },
      pcre: [
        { pattern: '<script[^>]*>|javascript:|on\\w+\\s*=|<img[^>]+onerror', modifiers: 'i' },
      ],
      metadata: {
        mitreAttack: { tactic: 'initial-access', technique: 'T1189' },
      },
      classtype: 'web-application-attack',
    },
    educational: {
      overview: 'XSS attacks inject malicious scripts into web pages viewed by others.',
      whatItDetects: 'Script tags, event handlers, and JavaScript URLs in input.',
      whyItMatters: 'XSS can steal cookies, hijack sessions, and deface websites.',
    },
  }),

  createRule('web-path-traversal', 'Path Traversal Attempt', 1004003, {
    description: 'Detects directory traversal attempts',
    protocol: 'http',
    destPort: { type: 'list', value: [80, 443, 8080] },
    category: 'web-attack',
    severity: 'high',
    options: {
      msg: 'WEB-ATTACK Path Traversal Attempt',
      sid: 1004003,
      flow: { toServer: true, established: true },
      content: [{ pattern: '../', nocase: false }],
      classtype: 'web-application-attack',
    },
  }),

  createRule('web-command-injection', 'Command Injection Attempt', 1004004, {
    description: 'Detects OS command injection attempts',
    protocol: 'http',
    destPort: { type: 'list', value: [80, 443, 8080] },
    category: 'web-attack',
    severity: 'critical',
    options: {
      msg: 'WEB-ATTACK Command Injection Attempt',
      sid: 1004004,
      flow: { toServer: true, established: true },
      pcre: [
        { pattern: '(?:;|\\||`|\\$\\(|&&)\\s*(?:cat|ls|whoami|id|uname|pwd|wget|curl|nc|bash|sh|cmd)', modifiers: 'i' },
      ],
      metadata: {
        mitreAttack: { tactic: 'execution', technique: 'T1059' },
      },
      classtype: 'web-application-attack',
    },
  }),
];

// ============================================================================
// Brute Force Detection Rules
// ============================================================================

export const BRUTE_FORCE_RULES: IDSRule[] = [
  createRule('bf-ssh', 'SSH Brute Force Attempt', 1005001, {
    description: 'Detects SSH brute force login attempts',
    protocol: 'tcp',
    destPort: { type: 'single', value: 22 },
    category: 'brute-force',
    severity: 'high',
    options: {
      msg: 'BRUTEFORCE SSH Login Attempt',
      sid: 1005001,
      flow: { toServer: true, established: true },
      threshold: {
        type: 'threshold',
        track: 'by_src',
        count: 5,
        seconds: 60,
      },
      metadata: {
        mitreAttack: { tactic: 'credential-access', technique: 'T1110' },
      },
      classtype: 'attempted-admin',
    },
    educational: {
      overview: 'SSH brute force attacks try many passwords to gain unauthorized access.',
      whatItDetects: 'Multiple failed SSH connection attempts from the same source.',
      whyItMatters: 'Successful brute force grants attackers shell access to systems.',
    },
  }),

  createRule('bf-ftp', 'FTP Brute Force Attempt', 1005002, {
    description: 'Detects FTP brute force login attempts',
    protocol: 'tcp',
    destPort: { type: 'single', value: 21 },
    category: 'brute-force',
    severity: 'medium',
    options: {
      msg: 'BRUTEFORCE FTP Login Attempt',
      sid: 1005002,
      flow: { toServer: true, established: true },
      threshold: {
        type: 'threshold',
        track: 'by_src',
        count: 5,
        seconds: 60,
      },
      classtype: 'attempted-admin',
    },
  }),

  createRule('bf-rdp', 'RDP Brute Force Attempt', 1005003, {
    description: 'Detects RDP brute force login attempts',
    protocol: 'tcp',
    destPort: { type: 'single', value: 3389 },
    category: 'brute-force',
    severity: 'high',
    options: {
      msg: 'BRUTEFORCE RDP Login Attempt',
      sid: 1005003,
      flow: { toServer: true, established: true },
      threshold: {
        type: 'threshold',
        track: 'by_src',
        count: 5,
        seconds: 60,
      },
      metadata: {
        mitreAttack: { tactic: 'credential-access', technique: 'T1110' },
      },
      classtype: 'attempted-admin',
    },
  }),

  createRule('bf-http-login', 'HTTP Login Brute Force', 1005004, {
    description: 'Detects HTTP form login brute force attempts',
    protocol: 'http',
    destPort: { type: 'list', value: [80, 443, 8080] },
    category: 'brute-force',
    severity: 'medium',
    options: {
      msg: 'BRUTEFORCE HTTP Login Attempt',
      sid: 1005004,
      flow: { toServer: true, established: true },
      httpMethod: 'POST',
      pcre: [{ pattern: '(?:login|signin|auth|password)', modifiers: 'i' }],
      threshold: {
        type: 'threshold',
        track: 'by_src',
        count: 10,
        seconds: 60,
      },
      classtype: 'attempted-admin',
    },
  }),
];

// ============================================================================
// Malware Detection Rules
// ============================================================================

export const MALWARE_RULES: IDSRule[] = [
  createRule('malware-c2-beacon', 'C2 Beacon Activity', 1006001, {
    description: 'Detects potential command and control beacon activity',
    protocol: 'tcp',
    category: 'command-control',
    severity: 'critical',
    options: {
      msg: 'MALWARE Potential C2 Beacon Activity',
      sid: 1006001,
      flow: { toServer: true, established: true },
      threshold: {
        type: 'threshold',
        track: 'by_src',
        count: 10,
        seconds: 300,
      },
      metadata: {
        mitreAttack: { tactic: 'command-and-control', technique: 'T1071' },
      },
      classtype: 'trojan-activity',
    },
    educational: {
      overview: 'C2 beacons are periodic communications between malware and attacker servers.',
      whatItDetects: 'Regular, periodic outbound connections that may indicate beaconing.',
      whyItMatters: 'C2 channels allow attackers to control compromised systems remotely.',
    },
  }),

  createRule('malware-download', 'Malware Download Attempt', 1006002, {
    description: 'Detects potential malware download via suspicious file extensions',
    protocol: 'http',
    destPort: { type: 'list', value: [80, 443, 8080] },
    category: 'malware',
    severity: 'high',
    options: {
      msg: 'MALWARE Suspicious File Download',
      sid: 1006002,
      flow: { fromServer: true, established: true },
      pcre: [{ pattern: '\\.(?:exe|dll|scr|bat|ps1|vbs|hta|jar)(?:\\?|$)', modifiers: 'i' }],
      classtype: 'trojan-activity',
    },
  }),

  createRule('malware-powershell', 'Suspicious PowerShell Activity', 1006003, {
    description: 'Detects suspicious PowerShell commands in network traffic',
    protocol: 'tcp',
    category: 'malware',
    severity: 'high',
    options: {
      msg: 'MALWARE Suspicious PowerShell Command',
      sid: 1006003,
      pcre: [
        { pattern: 'powershell.*(?:-enc|-encodedcommand|-e\\s|downloadstring|invoke-expression|iex|bypass)', modifiers: 'i' },
      ],
      metadata: {
        mitreAttack: { tactic: 'execution', technique: 'T1059', subtechnique: '001' },
      },
      classtype: 'trojan-activity',
    },
  }),
];

// ============================================================================
// Policy Violation Rules
// ============================================================================

export const POLICY_RULES: IDSRule[] = [
  createRule('policy-torrent', 'BitTorrent Traffic Detected', 1007001, {
    description: 'Detects BitTorrent peer-to-peer traffic',
    protocol: 'tcp',
    category: 'policy-violation',
    severity: 'low',
    options: {
      msg: 'POLICY BitTorrent Traffic Detected',
      sid: 1007001,
      content: [{ pattern: 'BitTorrent protocol', nocase: false }],
      classtype: 'policy-violation',
    },
  }),

  createRule('policy-tor', 'TOR Network Traffic', 1007002, {
    description: 'Detects traffic to/from TOR network',
    protocol: 'tcp',
    destPort: { type: 'list', value: [9001, 9030, 9050, 9051, 9150] },
    category: 'policy-violation',
    severity: 'medium',
    options: {
      msg: 'POLICY TOR Network Traffic Detected',
      sid: 1007002,
      classtype: 'policy-violation',
    },
  }),

  createRule('policy-cleartext-password', 'Cleartext Password Detected', 1007003, {
    description: 'Detects cleartext passwords in network traffic',
    protocol: 'tcp',
    category: 'policy-violation',
    severity: 'high',
    options: {
      msg: 'POLICY Cleartext Password in Traffic',
      sid: 1007003,
      pcre: [{ pattern: '(?:password|passwd|pwd)\\s*[=:]\\s*[^&\\s]+', modifiers: 'i' }],
      classtype: 'policy-violation',
    },
    educational: {
      overview: 'Cleartext credentials transmitted over the network can be easily captured.',
      whatItDetects: 'Password parameters being sent without encryption.',
      whyItMatters: 'Unencrypted credentials can be stolen via network sniffing.',
    },
  }),
];

// ============================================================================
// MITM Attack Detection Rules
// ============================================================================

export const MITM_RULES: IDSRule[] = [
  createRule('mitm-ssl-strip', 'SSL Stripping Attack', 1008001, {
    description: 'Detects potential SSL stripping attack',
    protocol: 'http',
    destPort: { type: 'single', value: 80 },
    category: 'man-in-the-middle',
    severity: 'critical',
    options: {
      msg: 'MITM SSL Stripping Attack Suspected',
      sid: 1008001,
      flow: { toServer: true, established: true },
      content: [{ pattern: 'https://', nocase: true }],
      httpUri: '/login',
      metadata: {
        mitreAttack: { tactic: 'credential-access', technique: 'T1557' },
      },
      classtype: 'attempted-recon',
    },
    educational: {
      overview: 'SSL stripping downgrades HTTPS connections to HTTP to intercept data.',
      whatItDetects: 'HTTPS URLs being requested over unencrypted HTTP connections.',
      whyItMatters: 'SSL stripping allows attackers to capture credentials and sensitive data.',
    },
  }),

  createRule('mitm-rogue-dhcp', 'Rogue DHCP Server', 1008002, {
    description: 'Detects potential rogue DHCP server activity',
    protocol: 'udp',
    sourcePort: { type: 'single', value: 67 },
    category: 'man-in-the-middle',
    severity: 'high',
    options: {
      msg: 'MITM Rogue DHCP Server Detected',
      sid: 1008002,
      content: [{ pattern: 'DHCP', nocase: true }],
      classtype: 'bad-unknown',
    },
  }),
];

// ============================================================================
// Rule Sets
// ============================================================================

export const DEFAULT_RULE_SET: RuleSet = {
  id: 'default',
  name: 'Default Rule Set',
  description: 'Comprehensive rule set covering common attack patterns',
  version: '1.0.0',
  author: 'Network Security Lab',
  rules: [
    ...PORT_SCAN_RULES,
    ...ARP_ATTACK_RULES,
    ...DNS_ATTACK_RULES,
    ...DOS_ATTACK_RULES,
    ...WEB_ATTACK_RULES,
    ...BRUTE_FORCE_RULES,
    ...MALWARE_RULES,
    ...POLICY_RULES,
    ...MITM_RULES,
  ],
  ruleCount: 0, // Will be set below
  category: 'comprehensive',
  tags: ['default', 'recommended', 'all-categories'],
  enabled: true,
  isBuiltIn: true,
};

DEFAULT_RULE_SET.ruleCount = DEFAULT_RULE_SET.rules.length;

export const SCAN_DETECTION_RULE_SET: RuleSet = {
  id: 'scan-detection',
  name: 'Scan Detection',
  description: 'Rules focused on detecting reconnaissance and port scanning',
  version: '1.0.0',
  rules: PORT_SCAN_RULES,
  ruleCount: PORT_SCAN_RULES.length,
  category: 'reconnaissance',
  tags: ['scanning', 'recon', 'nmap'],
  enabled: true,
  isBuiltIn: true,
};

export const DOS_PROTECTION_RULE_SET: RuleSet = {
  id: 'dos-protection',
  name: 'DoS Protection',
  description: 'Rules for detecting denial of service attacks',
  version: '1.0.0',
  rules: DOS_ATTACK_RULES,
  ruleCount: DOS_ATTACK_RULES.length,
  category: 'dos',
  tags: ['dos', 'ddos', 'flood'],
  enabled: true,
  isBuiltIn: true,
};

export const WEB_SECURITY_RULE_SET: RuleSet = {
  id: 'web-security',
  name: 'Web Security',
  description: 'Rules for detecting web application attacks',
  version: '1.0.0',
  rules: WEB_ATTACK_RULES,
  ruleCount: WEB_ATTACK_RULES.length,
  category: 'web-attack',
  tags: ['web', 'owasp', 'injection', 'xss'],
  enabled: true,
  isBuiltIn: true,
};

export const ALL_RULE_SETS: RuleSet[] = [
  DEFAULT_RULE_SET,
  SCAN_DETECTION_RULE_SET,
  DOS_PROTECTION_RULE_SET,
  WEB_SECURITY_RULE_SET,
];

// ============================================================================
// Educational Content
// ============================================================================

export const IDS_EDUCATIONAL_CONTENT: IDSEducationalContent[] = [
  {
    concept: 'signature-detection',
    title: 'Signature-Based Detection',
    overview: 'Signature-based detection compares network traffic against known attack patterns.',
    details: [
      'Uses predefined patterns (signatures) to identify known attacks',
      'Very effective at detecting known threats with low false positives',
      'Cannot detect zero-day attacks or new variants',
      'Requires regular signature updates to remain effective',
    ],
    examples: [
      'Detecting SQL injection by matching patterns like "UNION SELECT"',
      'Identifying port scans by counting SYN packets',
    ],
    bestPractices: [
      'Keep signatures updated regularly',
      'Tune rules to reduce false positives',
      'Combine with anomaly detection for better coverage',
    ],
  },
  {
    concept: 'anomaly-detection',
    title: 'Anomaly-Based Detection',
    overview: 'Anomaly detection identifies deviations from normal network behavior.',
    details: [
      'Establishes a baseline of normal traffic patterns',
      'Alerts when traffic deviates significantly from the baseline',
      'Can detect unknown attacks (zero-days)',
      'Higher false positive rate than signature detection',
    ],
    examples: [
      'Detecting unusual outbound traffic volume',
      'Identifying connections to rarely-used ports',
    ],
    bestPractices: [
      'Build baselines during normal operation periods',
      'Adjust sensitivity based on environment',
      'Review and tune thresholds regularly',
    ],
  },
  {
    concept: 'ids-vs-ips',
    title: 'IDS vs IPS',
    overview: 'Understanding the difference between detection and prevention systems.',
    details: [
      'IDS (Intrusion Detection System) monitors and alerts on suspicious activity',
      'IPS (Intrusion Prevention System) can also block malicious traffic',
      'IDS is passive - it observes but does not interfere',
      'IPS is active - it can drop or reject packets',
    ],
    examples: [
      'IDS alerts when it sees a port scan',
      'IPS blocks the scanning IP after threshold is reached',
    ],
    commonMistakes: [
      'Running IPS in blocking mode without tuning - causes legitimate traffic drops',
      'Relying solely on IDS without incident response procedures',
    ],
  },
  {
    concept: 'rule-tuning',
    title: 'Rule Tuning',
    overview: 'Optimizing IDS rules to balance detection and false positive rates.',
    details: [
      'False positives waste analyst time and cause alert fatigue',
      'False negatives miss real attacks',
      'Tuning involves adjusting thresholds, exclusions, and rule logic',
      'Environment-specific tuning is essential',
    ],
    bestPractices: [
      'Start with high sensitivity and tune down based on false positives',
      'Document all tuning decisions',
      'Regularly review disabled rules',
      'Test rule changes in monitor mode before enforcing',
    ],
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

export function getRuleById(ruleId: string): IDSRule | undefined {
  return DEFAULT_RULE_SET.rules.find(r => r.id === ruleId);
}

export function getRulesBySeverity(severity: IDSRule['severity']): IDSRule[] {
  return DEFAULT_RULE_SET.rules.filter(r => r.severity === severity);
}

export function getRulesByCategory(category: IDSRule['category']): IDSRule[] {
  return DEFAULT_RULE_SET.rules.filter(r => r.category === category);
}

export function getEducationalContent(concept: string): IDSEducationalContent | undefined {
  return IDS_EDUCATIONAL_CONTENT.find(c => c.concept === concept);
}

export function getAllRules(): IDSRule[] {
  return DEFAULT_RULE_SET.rules;
}
