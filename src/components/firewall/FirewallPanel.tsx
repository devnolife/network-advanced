'use client';

/**
 * Firewall Panel Component
 * 
 * Compact Firewall/ACL panel untuk integrasi ke halaman Lab.
 * Menampilkan:
 * - Status Firewall (aktif/nonaktif)
 * - ACL Rules dan hit counts
 * - Connection tracking (stateful)
 * - NAT translations
 * - Simulasi packet
 * 
 * Network Security Virtual Lab - Educational Platform
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  ShieldAlert,
  Activity,
  Play,
  Pause,
  Settings,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Network,
  Layers,
  Globe,
  Lock,
  Unlock,
  Zap,
  ArrowRight,
  ArrowLeftRight,
  Server,
  Router,
  Link2,
  Clock,
  RefreshCw,
  Filter,
  Info,
  BookOpen,
  Terminal,
  Copy,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useFirewallStore,
  selectACLCount,
  selectActiveConnectionsCount,
  selectActiveNATTranslationsCount,
  selectDeniedPacketsCount,
  selectAllowedPacketsCount,
  ACL_TEMPLATES,
} from '@/store/firewallStore';
import {
  ACL,
  ACLRule,
  ACLAction,
  ACLType,
  ACLProtocol,
  FirewallPacket,
  FirewallStatistics,
  ConnectionEntry,
  NATTranslation,
} from '@/lib/network/firewall/types';
import { PacketDecision } from '@/lib/network/firewall';

// ============================================================================
// Types
// ============================================================================

interface FirewallPanelProps {
  className?: string;
  labId?: string;
  onPacketProcessed?: (packet: FirewallPacket, decision: PacketDecision) => void;
}

type TabType = 'rules' | 'simulate' | 'learn';

// ============================================================================
// Constants
// ============================================================================

const ACTION_COLORS: Record<ACLAction, { bg: string; text: string; icon: React.ReactNode }> = {
  permit: {
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    icon: <CheckCircle className="w-4 h-4" />,
  },
  deny: {
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    icon: <XCircle className="w-4 h-4" />,
  },
};

const PROTOCOL_LABELS: Record<ACLProtocol, string> = {
  ip: 'IP',
  tcp: 'TCP',
  udp: 'UDP',
  icmp: 'ICMP',
  any: 'ANY',
};

const SAMPLE_PACKETS: { name: string; packet: Partial<FirewallPacket> }[] = [
  {
    name: 'HTTP Request',
    packet: {
      protocol: 'tcp',
      sourceIP: '192.168.1.100',
      sourcePort: 54321,
      destIP: '10.0.0.1',
      destPort: 80,
    },
  },
  {
    name: 'SSH Access',
    packet: {
      protocol: 'tcp',
      sourceIP: '192.168.1.50',
      sourcePort: 49152,
      destIP: '10.0.0.1',
      destPort: 22,
    },
  },
  {
    name: 'DNS Query',
    packet: {
      protocol: 'udp',
      sourceIP: '192.168.1.100',
      sourcePort: 53412,
      destIP: '8.8.8.8',
      destPort: 53,
    },
  },
  {
    name: 'Telnet (Blocked)',
    packet: {
      protocol: 'tcp',
      sourceIP: '192.168.1.100',
      sourcePort: 45678,
      destIP: '10.0.0.1',
      destPort: 23,
    },
  },
  {
    name: 'Ping',
    packet: {
      protocol: 'icmp',
      sourceIP: '192.168.1.100',
      destIP: '10.0.0.1',
    },
  },
];

// Educational content
const FIREWALL_CONCEPTS = [
  {
    title: 'Access Control List (ACL)',
    description: 'ACL adalah daftar aturan yang mengontrol lalu lintas jaringan berdasarkan berbagai kriteria seperti IP address, port, dan protokol.',
    details: [
      'Standard ACL: Filter berdasarkan source IP saja',
      'Extended ACL: Filter berdasarkan source/dest IP, port, protokol',
      'Named ACL: ACL dengan nama untuk kemudahan manajemen',
    ],
  },
  {
    title: 'Stateful vs Stateless',
    description: 'Firewall stateless memeriksa setiap paket secara independen, sedangkan stateful melacak koneksi dan dapat membuat keputusan berdasarkan state koneksi.',
    details: [
      'Stateless: Cepat tapi tidak aware dengan koneksi',
      'Stateful: Track TCP handshake dan state',
      'Return traffic otomatis diizinkan pada stateful',
    ],
  },
  {
    title: 'Network Address Translation (NAT)',
    description: 'NAT mengubah alamat IP dalam paket saat melewati firewall. Digunakan untuk menghemat IP publik dan menyembunyikan jaringan internal.',
    details: [
      'Static NAT: 1:1 mapping IP internal ke eksternal',
      'Dynamic NAT: Pool IP untuk translasi',
      'PAT: Banyak IP internal ke 1 IP eksternal (port-based)',
    ],
  },
  {
    title: 'Security Zones',
    description: 'Zona keamanan membagi jaringan berdasarkan tingkat kepercayaan. Traffic antar zona dikontrol oleh kebijakan firewall.',
    details: [
      'Inside: Jaringan internal (trust level tinggi)',
      'Outside: Internet/untrusted (trust level rendah)',
      'DMZ: Zona untuk server publik (trust level menengah)',
    ],
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

function generatePacketId(): string {
  return `pkt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateMAC(): string {
  const hexDigits = '0123456789abcdef';
  let mac = '';
  for (let i = 0; i < 6; i++) {
    mac += hexDigits[Math.floor(Math.random() * 16)];
    mac += hexDigits[Math.floor(Math.random() * 16)];
    if (i < 5) mac += ':';
  }
  return mac;
}

function formatPort(port: number | { start: number; end: number } | 'any' | undefined): string {
  if (port === undefined || port === 'any') return 'any';
  if (typeof port === 'number') return String(port);
  return `${port.start}-${port.end}`;
}

// ============================================================================
// Sub-Components
// ============================================================================

const StatCard: React.FC<{
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'red' | 'amber' | 'purple';
}> = ({ label, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };

  return (
    <div className={cn(
      'rounded-lg p-3 border',
      colorClasses[color]
    )}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <div className="text-lg font-mono font-bold">{value}</div>
    </div>
  );
};

const ACLRuleRow: React.FC<{
  rule: ACLRule;
  onToggle?: () => void;
}> = ({ rule, onToggle }) => {
  const actionStyle = ACTION_COLORS[rule.action];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'p-2 rounded border text-xs',
        actionStyle.bg,
        'border-gray-700'
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 font-mono">{rule.sequence}</span>
          <span className={cn('font-semibold uppercase', actionStyle.text)}>
            {rule.action}
          </span>
          <span className="text-cyan-400 font-mono">
            {PROTOCOL_LABELS[rule.protocol]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">
            hits: <span className="text-white font-mono">{rule.hitCount}</span>
          </span>
          <button
            onClick={onToggle}
            className={cn(
              'p-1 rounded hover:bg-gray-700',
              rule.enabled ? 'text-green-400' : 'text-gray-500'
            )}
          >
            {rule.enabled ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </button>
        </div>
      </div>
      <div className="flex items-center gap-1 text-gray-300 font-mono">
        <span>{rule.source.ip}{rule.source.wildcard ? ` ${rule.source.wildcard}` : ''}</span>
        {rule.source.port && <span>:{formatPort(rule.source.port)}</span>}
        <ArrowRight className="w-3 h-3 text-gray-500" />
        <span>{rule.destination.ip}{rule.destination.wildcard ? ` ${rule.destination.wildcard}` : ''}</span>
        {rule.destination.port && <span>:{formatPort(rule.destination.port)}</span>}
      </div>
      {rule.description && (
        <div className="text-gray-500 mt-1 truncate">{rule.description}</div>
      )}
    </motion.div>
  );
};

const PacketSimulator: React.FC<{
  onSimulate: (packet: FirewallPacket) => void;
  result: PacketDecision | null;
}> = ({ onSimulate, result }) => {
  const [selectedSample, setSelectedSample] = useState<number>(0);
  const [customPacket, setCustomPacket] = useState({
    sourceIP: '192.168.1.100',
    sourcePort: '54321',
    destIP: '10.0.0.1',
    destPort: '80',
    protocol: 'tcp' as ACLProtocol,
  });
  const [useCustom, setUseCustom] = useState(false);

  const handleSimulate = useCallback(() => {
    const base = useCustom ? customPacket : SAMPLE_PACKETS[selectedSample].packet;
    
    const packet: FirewallPacket = {
      id: generatePacketId(),
      timestamp: Date.now(),
      sourceMAC: generateMAC(),
      destMAC: generateMAC(),
      sourceIP: base.sourceIP || '0.0.0.0',
      destIP: base.destIP || '0.0.0.0',
      protocol: base.protocol || 'tcp',
      ttl: 64,
      sourcePort: typeof base.sourcePort === 'number' ? base.sourcePort : parseInt(customPacket.sourcePort) || undefined,
      destPort: typeof base.destPort === 'number' ? base.destPort : parseInt(customPacket.destPort) || undefined,
      payloadSize: Math.floor(Math.random() * 1000) + 100,
      interface: 'GigabitEthernet0/0',
      direction: 'in',
    };

    onSimulate(packet);
  }, [useCustom, customPacket, selectedSample, onSimulate]);

  return (
    <div className="space-y-3">
      {/* Sample packets */}
      <div>
        <label className="block text-xs text-gray-400 mb-2">Pilih Paket Sample</label>
        <div className="grid grid-cols-2 gap-2">
          {SAMPLE_PACKETS.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSelectedSample(idx);
                setUseCustom(false);
              }}
              className={cn(
                'p-2 text-left text-xs rounded border transition-colors',
                !useCustom && selectedSample === idx
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
              )}
            >
              <div className="font-medium">{sample.name}</div>
              <div className="text-gray-500 truncate">
                {sample.packet.protocol?.toUpperCase()} → :{sample.packet.destPort || '-'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom packet toggle */}
      <button
        onClick={() => setUseCustom(!useCustom)}
        className="flex items-center gap-2 text-xs text-gray-400 hover:text-white"
      >
        <Settings className="w-3 h-3" />
        {useCustom ? 'Gunakan Sample' : 'Custom Packet'}
      </button>

      {/* Custom packet form */}
      <AnimatePresence>
        {useCustom && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-2 overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Source IP</label>
                <input
                  type="text"
                  value={customPacket.sourceIP}
                  onChange={(e) => setCustomPacket({ ...customPacket, sourceIP: e.target.value })}
                  className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Source Port</label>
                <input
                  type="text"
                  value={customPacket.sourcePort}
                  onChange={(e) => setCustomPacket({ ...customPacket, sourcePort: e.target.value })}
                  className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Dest IP</label>
                <input
                  type="text"
                  value={customPacket.destIP}
                  onChange={(e) => setCustomPacket({ ...customPacket, destIP: e.target.value })}
                  className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Dest Port</label>
                <input
                  type="text"
                  value={customPacket.destPort}
                  onChange={(e) => setCustomPacket({ ...customPacket, destPort: e.target.value })}
                  className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs font-mono text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Protocol</label>
              <select
                value={customPacket.protocol}
                onChange={(e) => setCustomPacket({ ...customPacket, protocol: e.target.value as ACLProtocol })}
                className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-white"
              >
                <option value="tcp">TCP</option>
                <option value="udp">UDP</option>
                <option value="icmp">ICMP</option>
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Simulate button */}
      <button
        onClick={handleSimulate}
        className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium text-sm flex items-center justify-center gap-2"
      >
        <Zap className="w-4 h-4" />
        Simulasi Packet
      </button>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              'p-3 rounded border',
              result.action === 'allow'
                ? 'bg-green-500/20 border-green-500/50'
                : 'bg-red-500/20 border-red-500/50'
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              {result.action === 'allow' ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
              <span className={cn(
                'font-bold uppercase',
                result.action === 'allow' ? 'text-green-400' : 'text-red-400'
              )}>
                {result.action}
              </span>
            </div>
            <div className="text-xs text-gray-300 space-y-1">
              <div><span className="text-gray-500">Reason:</span> {result.reason}</div>
              <div><span className="text-gray-500">Processing:</span> {result.processingTime.toFixed(3)}ms</div>
              {result.rule && (
                <div><span className="text-gray-500">Rule:</span> #{result.rule.sequence}</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CiscoCommandGenerator: React.FC<{
  commands: string[];
}> = ({ commands }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(commands.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [commands]);

  if (commands.length === 0) return null;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Terminal className="w-3 h-3" />
          Cisco IOS Commands
        </span>
        <button
          onClick={handleCopy}
          className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="bg-gray-900 rounded p-2 font-mono text-xs text-green-400 overflow-x-auto">
        {commands.map((cmd, idx) => (
          <div key={idx} className={cmd.startsWith(' ') ? 'pl-4' : ''}>
            {cmd}
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const FirewallPanel: React.FC<FirewallPanelProps> = ({
  className,
  labId,
  onPacketProcessed,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('rules');
  const [expandedConcept, setExpandedConcept] = useState<number | null>(null);
  const [showCommands, setShowCommands] = useState(false);
  
  // Store
  const {
    isInitialized,
    isRunning,
    mode,
    acls,
    statistics,
    simulationResult,
    initialize,
    start,
    stop,
    createACL,
    addACLRule,
    enableACLRule,
    disableACLRule,
    simulatePacket,
    generateCiscoCommands,
  } = useFirewallStore();

  // Selectors
  const aclCount = useFirewallStore(selectACLCount);
  const activeConnections = useFirewallStore(selectActiveConnectionsCount);
  const natTranslations = useFirewallStore(selectActiveNATTranslationsCount);
  const deniedPackets = useFirewallStore(selectDeniedPacketsCount);
  const allowedPackets = useFirewallStore(selectAllowedPacketsCount);

  // Initialize on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
    return () => {
      // Don't destroy on unmount to keep state
    };
  }, [isInitialized, initialize]);

  // Create sample ACL on first run
  useEffect(() => {
    if (isInitialized && acls.length === 0) {
      // Create a sample ACL for demonstration
      const acl = createACL('DEMO_ACL', 'extended', 'Demo ACL untuk pembelajaran');
      if (acl) {
        // Add sample rules
        addACLRule(acl.id, {
          sequence: 10,
          action: 'permit',
          protocol: 'tcp',
          source: { ip: 'any' },
          destination: { ip: 'any', port: 80 },
          description: 'Allow HTTP',
        });
        addACLRule(acl.id, {
          sequence: 20,
          action: 'permit',
          protocol: 'tcp',
          source: { ip: 'any' },
          destination: { ip: 'any', port: 443 },
          description: 'Allow HTTPS',
        });
        addACLRule(acl.id, {
          sequence: 30,
          action: 'deny',
          protocol: 'tcp',
          source: { ip: 'any' },
          destination: { ip: 'any', port: 23 },
          description: 'Block Telnet',
          log: true,
        });
        addACLRule(acl.id, {
          sequence: 1000,
          action: 'deny',
          protocol: 'ip',
          source: { ip: 'any' },
          destination: { ip: 'any' },
          description: 'Implicit deny',
        });
      }
    }
  }, [isInitialized, acls.length, createACL, addACLRule]);

  const handleToggleEngine = useCallback(() => {
    if (isRunning) {
      stop();
    } else {
      start();
    }
  }, [isRunning, start, stop]);

  const handleSimulate = useCallback((packet: FirewallPacket) => {
    const result = simulatePacket(packet);
    if (onPacketProcessed) {
      onPacketProcessed(packet, result);
    }
  }, [simulatePacket, onPacketProcessed]);

  const selectedACL = acls[0]; // Use first ACL for demo
  const ciscoCommands = useMemo(() => {
    if (!selectedACL) return [];
    return generateCiscoCommands(selectedACL.id);
  }, [selectedACL, generateCiscoCommands]);

  return (
    <div className={cn('bg-gray-900 rounded-lg border border-gray-800 overflow-hidden', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-lg',
              isRunning ? 'bg-green-500/20' : 'bg-gray-700'
            )}>
              {isRunning ? (
                <ShieldCheck className="w-5 h-5 text-green-400" />
              ) : (
                <ShieldOff className="w-5 h-5 text-gray-500" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-white">Firewall / ACL</h3>
              <p className="text-xs text-gray-500">
                Mode: <span className="text-cyan-400 capitalize">{mode}</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleEngine}
            className={cn(
              'px-3 py-1.5 rounded-lg font-medium text-sm flex items-center gap-2',
              isRunning
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
            )}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                Stop
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Start
              </>
            )}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <StatCard
            label="ACLs"
            value={aclCount}
            icon={<Filter className="w-4 h-4" />}
            color="blue"
          />
          <StatCard
            label="Connections"
            value={activeConnections}
            icon={<Link2 className="w-4 h-4" />}
            color="purple"
          />
          <StatCard
            label="Allowed"
            value={allowedPackets}
            icon={<CheckCircle className="w-4 h-4" />}
            color="green"
          />
          <StatCard
            label="Denied"
            value={deniedPackets}
            icon={<XCircle className="w-4 h-4" />}
            color="red"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        {[
          { id: 'rules', label: 'ACL Rules', icon: Filter },
          { id: 'simulate', label: 'Simulasi', icon: Zap },
          { id: 'learn', label: 'Pelajari', icon: BookOpen },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={cn(
              'flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors',
              activeTab === tab.id
                ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/10'
                : 'text-gray-500 hover:text-gray-300'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'rules' && (
            <motion.div
              key="rules"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3"
            >
              {selectedACL ? (
                <>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-white">
                      {selectedACL.name}
                      <span className="text-gray-500 text-xs ml-2">({selectedACL.type})</span>
                    </h4>
                    <button
                      onClick={() => setShowCommands(!showCommands)}
                      className="text-xs text-gray-400 hover:text-cyan-400 flex items-center gap-1"
                    >
                      <Terminal className="w-3 h-3" />
                      {showCommands ? 'Hide' : 'Show'} Commands
                    </button>
                  </div>

                  {showCommands && <CiscoCommandGenerator commands={ciscoCommands} />}

                  <div className="space-y-2">
                    {selectedACL.rules.map((rule) => (
                      <ACLRuleRow
                        key={rule.id}
                        rule={rule}
                        onToggle={() => {
                          if (rule.enabled) {
                            disableACLRule(selectedACL.id, rule.id);
                          } else {
                            enableACLRule(selectedACL.id, rule.id);
                          }
                        }}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Belum ada ACL</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'simulate' && (
            <motion.div
              key="simulate"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <PacketSimulator
                onSimulate={handleSimulate}
                result={simulationResult}
              />
            </motion.div>
          )}

          {activeTab === 'learn' && (
            <motion.div
              key="learn"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3"
            >
              {FIREWALL_CONCEPTS.map((concept, idx) => (
                <div
                  key={idx}
                  className="border border-gray-700 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedConcept(expandedConcept === idx ? null : idx)}
                    className="w-full p-3 flex items-center justify-between text-left hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-cyan-400" />
                      <span className="font-medium text-white text-sm">{concept.title}</span>
                    </div>
                    {expandedConcept === idx ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  
                  <AnimatePresence>
                    {expandedConcept === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 pt-0 border-t border-gray-700">
                          <p className="text-sm text-gray-400 mb-2">{concept.description}</p>
                          <ul className="space-y-1">
                            {concept.details.map((detail, didx) => (
                              <li key={didx} className="text-xs text-gray-500 flex items-start gap-2">
                                <span className="text-cyan-400 mt-1">•</span>
                                {detail}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FirewallPanel;
