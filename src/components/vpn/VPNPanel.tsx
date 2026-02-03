'use client';

/**
 * VPN Panel Component
 * 
 * Compact VPN/IPSec panel untuk integrasi ke halaman Lab.
 * Menampilkan:
 * - Status VPN Tunnels
 * - IKE Negotiation visualization
 * - ESP Packet encapsulation demo
 * - Educational content tentang VPN
 * 
 * Network Security Virtual Lab - Educational Platform
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Unlock,
  Shield,
  ShieldCheck,
  ShieldOff,
  Activity,
  Play,
  Pause,
  Settings,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Network,
  Layers,
  Globe,
  Key,
  Zap,
  ArrowRight,
  ArrowLeftRight,
  Server,
  Router,
  Link2,
  Clock,
  RefreshCw,
  Info,
  BookOpen,
  Send,
  Package,
  Box,
  Wifi,
  WifiOff,
  Building2,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useVPNStore,
  selectTunnelCount,
  selectActiveTunnelCount,
  selectIKESACount,
  selectIPSecSACount,
  selectPacketsEncrypted,
  selectPacketsDecrypted,
  selectNegotiationsCompleted,
  TUNNEL_TEMPLATES,
  EXAMPLE_NETWORKS,
  useShallow,
} from '@/store/vpnStore';
import {
  VPNTunnel,
  VPNStatus,
  IKEProposal,
  IPSecProposal,
  IKEMessage,
  ESPPacket,
  VPNEvent,
  IKE_PROPOSALS,
  IPSEC_PROPOSALS,
} from '@/lib/network/vpn/types';

// ============================================================================
// Types
// ============================================================================

interface VPNPanelProps {
  className?: string;
  labId?: string;
  onTunnelCreated?: (tunnel: VPNTunnel) => void;
}

type TabType = 'tunnels' | 'simulate' | 'learn';

// Type for tunnel creation
interface CreateTunnelParams {
  name: string;
  type: 'site-to-site' | 'remote-access' | 'hub-spoke';
  localEndpoint: {
    id: string;
    name: string;
    publicIP: string;
    privateNetwork: string;
  };
  remoteEndpoint: {
    id: string;
    name: string;
    publicIP: string;
    privateNetwork: string;
  };
  ikeProposal: IKEProposal;
  ipsecProposal: IPSecProposal;
  psk: string;
  dpdEnabled?: boolean;
  natTraversal?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const STATUS_STYLES: Record<VPNStatus, { bg: string; text: string; icon: React.ReactNode }> = {
  down: {
    bg: 'bg-gray-500/20',
    text: 'text-gray-400',
    icon: <WifiOff className="w-4 h-4" />,
  },
  connecting: {
    bg: 'bg-yellow-500/20',
    text: 'text-yellow-400',
    icon: <RefreshCw className="w-4 h-4 animate-spin" />,
  },
  established: {
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    icon: <ShieldCheck className="w-4 h-4" />,
  },
  error: {
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    icon: <AlertTriangle className="w-4 h-4" />,
  },
};

const SAMPLE_PACKETS = [
  {
    name: 'HTTP dari Branch ke HQ',
    sourceIP: '192.168.10.100',
    destIP: '192.168.1.50',
    protocol: 'tcp',
    sourcePort: 54321,
    destPort: 80,
  },
  {
    name: 'SSH ke Server',
    sourceIP: '192.168.10.50',
    destIP: '192.168.1.10',
    protocol: 'tcp',
    sourcePort: 49152,
    destPort: 22,
  },
  {
    name: 'Database Query',
    sourceIP: '192.168.10.100',
    destIP: '192.168.1.20',
    protocol: 'tcp',
    sourcePort: 45678,
    destPort: 3306,
  },
  {
    name: 'DNS Query Internal',
    sourceIP: '192.168.10.100',
    destIP: '192.168.1.1',
    protocol: 'udp',
    sourcePort: 53412,
    destPort: 53,
  },
];

// Educational content
const VPN_CONCEPTS = [
  {
    title: 'IPSec VPN Overview',
    description: 'IPSec adalah protokol suite yang menyediakan keamanan pada layer IP. Digunakan untuk membuat tunnel terenkripsi antar jaringan.',
    details: [
      'Site-to-Site: Menghubungkan dua jaringan melalui internet',
      'Remote Access: Koneksi user individual ke jaringan',
      'Menggunakan IKE untuk negosiasi dan ESP/AH untuk proteksi data',
    ],
  },
  {
    title: 'IKE (Internet Key Exchange)',
    description: 'IKE adalah protokol untuk negosiasi Security Association (SA) dan pertukaran kunci kriptografi.',
    details: [
      'Phase 1 (IKE_SA_INIT): Negosiasi parameter dan DH key exchange',
      'Phase 2 (IKE_AUTH): Autentikasi dan pembuatan Child SA',
      'IKEv2 lebih efisien dengan 4 pesan (vs 6-9 di IKEv1)',
    ],
  },
  {
    title: 'ESP (Encapsulating Security Payload)',
    description: 'ESP menyediakan confidentiality (enkripsi), integrity, dan authentication untuk data.',
    details: [
      'Tunnel Mode: Enkripsi seluruh paket IP original',
      'Transport Mode: Hanya enkripsi payload, header tetap',
      'SPI (Security Parameter Index) mengidentifikasi SA',
    ],
  },
  {
    title: 'Security Associations (SA)',
    description: 'SA adalah kontrak keamanan antara dua peer yang berisi parameter kriptografi.',
    details: [
      'IKE SA: Melindungi traffic IKE (control plane)',
      'IPSec SA: Melindungi traffic data (data plane)',
      'SA bersifat unidirectional, jadi diperlukan sepasang untuk komunikasi dua arah',
    ],
  },
];

// ============================================================================
// Sub-Components
// ============================================================================

// Stat Card
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color?: string;
}> = ({ icon, label, value, color = 'text-cyan-400' }) => (
  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
    <div className="flex items-center gap-2 mb-1">
      <span className={color}>{icon}</span>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
    <div className={cn('text-lg font-semibold', color)}>{value}</div>
  </div>
);

// Tunnel Card
const TunnelCard: React.FC<{
  tunnel: VPNTunnel;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}> = ({ tunnel, isSelected, onSelect, onDelete }) => {
  const status = STATUS_STYLES[tunnel.status];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-slate-800/50 rounded-lg p-3 border cursor-pointer transition-all',
        isSelected 
          ? 'border-cyan-500/50 ring-1 ring-cyan-500/30' 
          : 'border-slate-700/50 hover:border-slate-600'
      )}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={cn('p-1.5 rounded', status.bg)}>
            {status.icon}
          </div>
          <div>
            <h4 className="text-sm font-medium text-white">{tunnel.name}</h4>
            <span className={cn('text-xs', status.text)}>
              {tunnel.status.charAt(0).toUpperCase() + tunnel.status.slice(1)}
            </span>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      
      {/* Tunnel Visualization */}
      <div className="flex items-center justify-between text-xs mt-3">
        <div className="flex items-center gap-1">
          <Building2 className="w-3 h-3 text-blue-400" />
          <span className="text-gray-400">{tunnel.localEndpoint.name}</span>
        </div>
        <div className="flex-1 mx-2 relative">
          <div className="border-t border-dashed border-gray-600" />
          {tunnel.status === 'established' && (
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-green-400 rounded-full"
              animate={{ x: ['0%', '100%', '0%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
          )}
        </div>
        <div className="flex items-center gap-1">
          <Building2 className="w-3 h-3 text-purple-400" />
          <span className="text-gray-400">{tunnel.remoteEndpoint.name}</span>
        </div>
      </div>
      
      {/* Stats */}
      {tunnel.status === 'established' && (
        <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
          <div className="text-center">
            <div className="text-gray-500">Packets</div>
            <div className="text-white">{tunnel.packetsIn + tunnel.packetsOut}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500">Uptime</div>
            <div className="text-white">
              {tunnel.establishedAt 
                ? Math.floor((Date.now() - tunnel.establishedAt) / 1000) + 's'
                : '-'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-500">Rekeys</div>
            <div className="text-white">{tunnel.rekeyCount}</div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// IKE Negotiation Visualization
const IKENegotiationViz: React.FC<{
  messages: IKEMessage[];
  isExpanded: boolean;
}> = ({ messages, isExpanded }) => {
  if (!isExpanded || messages.length === 0) return null;
  
  return (
    <div className="bg-slate-900/50 rounded-lg p-3 mt-3 border border-slate-700/30">
      <h4 className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1">
        <Key className="w-3 h-3" />
        IKE Negotiation Messages
      </h4>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {messages.slice(-10).map((msg, idx) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, x: msg.direction === 'sent' ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              'flex items-center gap-2 text-xs p-2 rounded',
              msg.direction === 'sent' 
                ? 'bg-blue-500/10 border-l-2 border-blue-500'
                : 'bg-purple-500/10 border-r-2 border-purple-500 justify-end'
            )}
          >
            <div className={cn(
              'flex items-center gap-2',
              msg.direction === 'received' && 'flex-row-reverse'
            )}>
              {msg.direction === 'sent' 
                ? <Send className="w-3 h-3 text-blue-400" />
                : <Package className="w-3 h-3 text-purple-400" />
              }
              <div>
                <span className="font-mono text-white">{msg.messageType}</span>
                <span className="text-gray-500 ml-2">
                  {msg.isRequest ? '(Request)' : '(Response)'}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ESP Packet Visualization
const ESPPacketViz: React.FC<{
  packet: ESPPacket;
  isExpanded: boolean;
}> = ({ packet, isExpanded }) => {
  if (!isExpanded) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30"
    >
      <h4 className="text-xs font-medium text-gray-400 mb-3">ESP Packet Structure</h4>
      
      {/* Outer IP Header (Tunnel Mode) */}
      {packet.outerHeader && (
        <div className="mb-2">
          <div className="text-xs text-gray-500 mb-1">Outer IP Header (New)</div>
          <div className="bg-blue-500/20 rounded p-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-gray-400">Src:</span>
              <span className="text-blue-300">{packet.outerHeader.sourceIP}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Dst:</span>
              <span className="text-blue-300">{packet.outerHeader.destIP}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Proto:</span>
              <span className="text-blue-300">50 (ESP)</span>
            </div>
          </div>
        </div>
      )}
      
      {/* ESP Header */}
      <div className="mb-2">
        <div className="text-xs text-gray-500 mb-1">ESP Header</div>
        <div className="bg-green-500/20 rounded p-2 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-gray-400">SPI:</span>
            <span className="text-green-300">0x{packet.espHeader.spi}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Seq#:</span>
            <span className="text-green-300">{packet.espHeader.sequenceNumber}</span>
          </div>
        </div>
      </div>
      
      {/* Encrypted Payload */}
      <div className="mb-2">
        <div className="text-xs text-gray-500 mb-1">Encrypted Payload</div>
        <div className="bg-yellow-500/20 rounded p-2 text-xs font-mono">
          {packet.payload.iv && (
            <div className="flex justify-between mb-1">
              <span className="text-gray-400">IV:</span>
              <span className="text-yellow-300 truncate max-w-[150px]">
                {packet.payload.iv.substring(0, 16)}...
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-400">Data:</span>
            <span className="text-yellow-300">[Encrypted]</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Padding:</span>
            <span className="text-yellow-300">{packet.payload.padding} bytes</span>
          </div>
        </div>
      </div>
      
      {/* ICV */}
      {packet.authentication && (
        <div>
          <div className="text-xs text-gray-500 mb-1">Authentication (ICV)</div>
          <div className="bg-red-500/20 rounded p-2 text-xs font-mono">
            <span className="text-red-300 truncate block">
              {packet.authentication.icv.substring(0, 24)}...
            </span>
          </div>
        </div>
      )}
      
      {/* Original Packet (if available) */}
      {packet.originalPacket && (
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <div className="text-xs text-gray-500 mb-1">Original Packet (Before Encryption)</div>
          <div className="bg-slate-700/50 rounded p-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-gray-400">Src:</span>
              <span className="text-white">{packet.originalPacket.sourceIP}:{packet.originalPacket.sourcePort}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Dst:</span>
              <span className="text-white">{packet.originalPacket.destIP}:{packet.originalPacket.destPort}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Proto:</span>
              <span className="text-white">{packet.originalPacket.protocol.toUpperCase()}</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// Tunnel Creator Form
const TunnelCreator: React.FC<{
  onClose: () => void;
  onCreate: (params: CreateTunnelParams) => void;
}> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('Branch-to-HQ VPN');
  const [localEndpoint, setLocalEndpoint] = useState(EXAMPLE_NETWORKS.branch1);
  const [remoteEndpoint, setRemoteEndpoint] = useState(EXAMPLE_NETWORKS.headquarter);
  const [ikeProposal, setIkeProposal] = useState<IKEProposal>(IKE_PROPOSALS.balanced);
  const [ipsecProposal, setIpsecProposal] = useState<IPSecProposal>(IPSEC_PROPOSALS.balanced);
  const [psk, setPsk] = useState('my-secret-key-123');
  
  const handleSubmit = () => {
    onCreate({
      name,
      type: 'site-to-site',
      localEndpoint,
      remoteEndpoint,
      ikeProposal,
      ipsecProposal,
      psk,
      dpdEnabled: true,
      natTraversal: true,
    });
    onClose();
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800 rounded-lg p-4 border border-slate-700"
    >
      <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
        <Plus className="w-4 h-4 text-cyan-400" />
        Create VPN Tunnel
      </h3>
      
      <div className="space-y-3">
        {/* Name */}
        <div>
          <label className="text-xs text-gray-400 block mb-1">Tunnel Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
          />
        </div>
        
        {/* Endpoints */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Local Site</label>
            <select
              value={localEndpoint.id}
              onChange={(e) => setLocalEndpoint(
                Object.values(EXAMPLE_NETWORKS).find(n => n.id === e.target.value) || EXAMPLE_NETWORKS.branch1
              )}
              className="w-full bg-slate-900/50 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
            >
              {Object.values(EXAMPLE_NETWORKS).map(net => (
                <option key={net.id} value={net.id}>{net.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Remote Site</label>
            <select
              value={remoteEndpoint.id}
              onChange={(e) => setRemoteEndpoint(
                Object.values(EXAMPLE_NETWORKS).find(n => n.id === e.target.value) || EXAMPLE_NETWORKS.headquarter
              )}
              className="w-full bg-slate-900/50 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
            >
              {Object.values(EXAMPLE_NETWORKS).map(net => (
                <option key={net.id} value={net.id}>{net.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* IKE Proposal */}
        <div>
          <label className="text-xs text-gray-400 block mb-1">IKE Proposal</label>
          <select
            value={ikeProposal.id}
            onChange={(e) => setIkeProposal(
              Object.values(IKE_PROPOSALS).find(p => p.id === e.target.value) || IKE_PROPOSALS.balanced
            )}
            className="w-full bg-slate-900/50 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
          >
            {Object.values(IKE_PROPOSALS).map(proposal => (
              <option key={proposal.id} value={proposal.id}>{proposal.name}</option>
            ))}
          </select>
        </div>
        
        {/* IPSec Proposal */}
        <div>
          <label className="text-xs text-gray-400 block mb-1">IPSec Proposal</label>
          <select
            value={ipsecProposal.id}
            onChange={(e) => setIpsecProposal(
              Object.values(IPSEC_PROPOSALS).find(p => p.id === e.target.value) || IPSEC_PROPOSALS.balanced
            )}
            className="w-full bg-slate-900/50 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
          >
            {Object.values(IPSEC_PROPOSALS).map(proposal => (
              <option key={proposal.id} value={proposal.id}>{proposal.name}</option>
            ))}
          </select>
        </div>
        
        {/* PSK */}
        <div>
          <label className="text-xs text-gray-400 block mb-1">Pre-Shared Key</label>
          <input
            type="password"
            value={psk}
            onChange={(e) => setPsk(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
          />
        </div>
        
        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSubmit}
            className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white text-sm py-1.5 rounded transition-colors flex items-center justify-center gap-1"
          >
            <ShieldCheck className="w-4 h-4" />
            Create & Connect
          </button>
          <button
            onClick={onClose}
            className="px-3 bg-slate-700 hover:bg-slate-600 text-white text-sm py-1.5 rounded transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const VPNPanel: React.FC<VPNPanelProps> = ({ 
  className,
  labId,
  onTunnelCreated,
}) => {
  // Store state
  const {
    isInitialized,
    isRunning,
    tunnels,
    selectedTunnelId,
    ikeMessages,
    espPackets,
    events,
    statistics,
    showTunnelCreator,
    initialize,
    start,
    stop,
    createTunnel,
    deleteTunnel,
    selectTunnel,
    setShowTunnelCreator,
    encryptPacket,
    refreshStatistics,
  } = useVPNStore(useShallow((state) => ({
    isInitialized: state.isInitialized,
    isRunning: state.isRunning,
    tunnels: state.tunnels,
    selectedTunnelId: state.selectedTunnelId,
    ikeMessages: state.ikeMessages,
    espPackets: state.espPackets,
    events: state.events,
    statistics: state.statistics,
    showTunnelCreator: state.showTunnelCreator,
    initialize: state.initialize,
    start: state.start,
    stop: state.stop,
    createTunnel: state.createTunnel,
    deleteTunnel: state.deleteTunnel,
    selectTunnel: state.selectTunnel,
    setShowTunnelCreator: state.setShowTunnelCreator,
    encryptPacket: state.encryptPacket,
    refreshStatistics: state.refreshStatistics,
  })));

  // Local state
  const [activeTab, setActiveTab] = useState<TabType>('tunnels');
  const [showIKEMessages, setShowIKEMessages] = useState(true);
  const [selectedESPPacket, setSelectedESPPacket] = useState<ESPPacket | null>(null);
  const [expandedConcept, setExpandedConcept] = useState<number | null>(null);
  
  // Initialize on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
      start();
    }
    
    return () => {
      // Don't destroy on unmount to preserve state
    };
  }, [isInitialized, initialize, start]);
  
  // Selectors for counts (React 19 safe)
  const tunnelCount = useVPNStore(selectTunnelCount);
  const activeTunnelCount = useVPNStore(selectActiveTunnelCount);
  const packetsEncrypted = useVPNStore(selectPacketsEncrypted);
  const packetsDecrypted = useVPNStore(selectPacketsDecrypted);
  
  // Get selected tunnel
  const selectedTunnel = useMemo(() => 
    tunnels.find(t => t.id === selectedTunnelId),
    [tunnels, selectedTunnelId]
  );
  
  // Handle tunnel creation
  const handleCreateTunnel = useCallback(async (params: Parameters<typeof createTunnel>[0]) => {
    const tunnel = await createTunnel(params);
    onTunnelCreated?.(tunnel);
  }, [createTunnel, onTunnelCreated]);
  
  // Handle packet simulation
  const handleSimulatePacket = useCallback((packet: typeof SAMPLE_PACKETS[0]) => {
    const result = encryptPacket(packet);
    if (result) {
      setSelectedESPPacket(result);
    }
  }, [encryptPacket]);
  
  // Tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'tunnels':
        return (
          <div className="space-y-4">
            {/* Tunnel Creator */}
            <AnimatePresence>
              {showTunnelCreator && (
                <TunnelCreator
                  onClose={() => setShowTunnelCreator(false)}
                  onCreate={handleCreateTunnel}
                />
              )}
            </AnimatePresence>
            
            {/* Tunnels List */}
            {!showTunnelCreator && (
              <>
                <button
                  onClick={() => setShowTunnelCreator(true)}
                  className="w-full bg-slate-800/50 border border-dashed border-slate-600 rounded-lg p-3 text-sm text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create New Tunnel
                </button>
                
                {tunnels.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Shield className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No VPN tunnels configured</p>
                    <p className="text-xs mt-1">Create a tunnel to get started</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tunnels.map(tunnel => (
                      <TunnelCard
                        key={tunnel.id}
                        tunnel={tunnel}
                        isSelected={tunnel.id === selectedTunnelId}
                        onSelect={() => selectTunnel(tunnel.id)}
                        onDelete={() => deleteTunnel(tunnel.id)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
            
            {/* IKE Messages */}
            {selectedTunnel && (
              <div>
                <button
                  onClick={() => setShowIKEMessages(!showIKEMessages)}
                  className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  {showIKEMessages ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  IKE Messages ({ikeMessages.length})
                </button>
                <IKENegotiationViz
                  messages={ikeMessages}
                  isExpanded={showIKEMessages}
                />
              </div>
            )}
          </div>
        );
        
      case 'simulate':
        return (
          <div className="space-y-4">
            <div className="text-xs text-gray-400 mb-2">
              Pilih paket untuk dienkripsi melalui VPN tunnel:
            </div>
            
            {/* Check if we have active tunnels */}
            {activeTunnelCount === 0 ? (
              <div className="text-center py-6 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <ShieldOff className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                <p className="text-sm text-gray-400">No active tunnels</p>
                <p className="text-xs text-gray-500 mt-1">Create and establish a tunnel first</p>
              </div>
            ) : (
              <>
                {/* Sample Packets */}
                <div className="space-y-2">
                  {SAMPLE_PACKETS.map((packet, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSimulatePacket(packet)}
                      className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-left hover:border-cyan-500/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-white">{packet.name}</span>
                        <span className="text-xs text-cyan-400 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Encrypt
                        </span>
                      </div>
                      <div className="text-xs font-mono text-gray-400">
                        {packet.sourceIP}:{packet.sourcePort} → {packet.destIP}:{packet.destPort}
                      </div>
                    </button>
                  ))}
                </div>
                
                {/* ESP Packet Result */}
                <AnimatePresence>
                  {selectedESPPacket && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-white flex items-center gap-2">
                          <Package className="w-4 h-4 text-green-400" />
                          Encrypted ESP Packet
                        </h4>
                        <button
                          onClick={() => setSelectedESPPacket(null)}
                          className="text-xs text-gray-400 hover:text-white"
                        >
                          Clear
                        </button>
                      </div>
                      <ESPPacketViz
                        packet={selectedESPPacket}
                        isExpanded={true}
                      />
                    </div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        );
        
      case 'learn':
        return (
          <div className="space-y-3">
            {VPN_CONCEPTS.map((concept, idx) => (
              <div
                key={idx}
                className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedConcept(expandedConcept === idx ? null : idx)}
                  className="w-full p-3 text-left flex items-center justify-between hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-medium text-white">{concept.title}</span>
                  </div>
                  {expandedConcept === idx 
                    ? <ChevronUp className="w-4 h-4 text-gray-400" />
                    : <ChevronDown className="w-4 h-4 text-gray-400" />
                  }
                </button>
                
                <AnimatePresence>
                  {expandedConcept === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-700/50"
                    >
                      <div className="p-3">
                        <p className="text-sm text-gray-300 mb-3">{concept.description}</p>
                        <ul className="space-y-1.5">
                          {concept.details.map((detail, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                              <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
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
          </div>
        );
    }
  };
  
  return (
    <div className={cn('flex flex-col h-full bg-slate-900', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-lg',
            isRunning ? 'bg-green-500/20' : 'bg-gray-500/20'
          )}>
            <Shield className={cn(
              'w-5 h-5',
              isRunning ? 'text-green-400' : 'text-gray-400'
            )} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">VPN / IPSec</h2>
            <p className="text-xs text-gray-400">
              {activeTunnelCount} / {tunnelCount} tunnels active
            </p>
          </div>
        </div>
        
        <button
          onClick={() => isRunning ? stop() : start()}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
            isRunning 
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
          )}
        >
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isRunning ? 'Stop' : 'Start'}
        </button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 p-4">
        <StatCard
          icon={<Link2 className="w-4 h-4" />}
          label="Tunnels"
          value={activeTunnelCount}
          color="text-green-400"
        />
        <StatCard
          icon={<Key className="w-4 h-4" />}
          label="IKE SAs"
          value={statistics?.activeIKESAs ?? 0}
          color="text-blue-400"
        />
        <StatCard
          icon={<Lock className="w-4 h-4" />}
          label="Encrypted"
          value={packetsEncrypted}
          color="text-cyan-400"
        />
        <StatCard
          icon={<Unlock className="w-4 h-4" />}
          label="Decrypted"
          value={packetsDecrypted}
          color="text-purple-400"
        />
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-slate-700/50 px-4">
        {(['tunnels', 'simulate', 'learn'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors relative',
              activeTab === tab 
                ? 'text-cyan-400'
                : 'text-gray-400 hover:text-white'
            )}
          >
            {tab === 'tunnels' && 'Tunnels'}
            {tab === 'simulate' && 'Simulate'}
            {tab === 'learn' && 'Learn'}
            {activeTab === tab && (
              <motion.div
                layoutId="vpn-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400"
              />
            )}
          </button>
        ))}
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderTabContent()}
      </div>
      
      {/* Recent Events */}
      {events.length > 0 && (
        <div className="border-t border-slate-700/50 p-3 max-h-32 overflow-y-auto">
          <h4 className="text-xs font-medium text-gray-400 mb-2">Recent Events</h4>
          <div className="space-y-1">
            {events.slice(0, 5).map(event => (
              <div
                key={event.id}
                className={cn(
                  'text-xs px-2 py-1 rounded flex items-center gap-2',
                  event.severity === 'error' && 'bg-red-500/10 text-red-400',
                  event.severity === 'warning' && 'bg-yellow-500/10 text-yellow-400',
                  event.severity === 'info' && 'bg-slate-700/50 text-gray-300'
                )}
              >
                {event.severity === 'error' && <XCircle className="w-3 h-3" />}
                {event.severity === 'warning' && <AlertTriangle className="w-3 h-3" />}
                {event.severity === 'info' && <Info className="w-3 h-3" />}
                <span className="truncate">{event.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VPNPanel;
