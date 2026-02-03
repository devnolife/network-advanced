'use client';

/**
 * IDS Panel Component
 * 
 * Compact IDS/IPS panel untuk integrasi ke halaman Lab.
 * Menampilkan:
 * - Status IDS/IPS (aktif/nonaktif)
 * - Alert real-time
 * - Simulasi serangan
 * - Mode selector (IDS/IPS/Hybrid)
 * 
 * Network Security Virtual Lab - Educational Platform
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Activity,
  AlertTriangle,
  AlertCircle,
  XCircle,
  CheckCircle,
  Play,
  Pause,
  Eye,
  EyeOff,
  Ban,
  Zap,
  Target,
  Wifi,
  Server,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Info,
  Clock,
  TrendingUp,
  Crosshair,
  Radio,
  Skull,
  Bug,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIDSStore, selectCriticalAlertsCount, selectNewAlertsCount } from '@/store/idsStore';
import { AlertSeverity, IDSAlert } from '@/lib/network/ids/types';
import { AttackPacket } from '@/lib/network/attacks/types';
import { getIDSEngine } from '@/lib/network/ids';

// ============================================================================
// Types
// ============================================================================

interface IDSPanelProps {
  className?: string;
  labId?: string;
  onAlertDetected?: (alert: IDSAlert) => void;
}

// ============================================================================
// Constants
// ============================================================================

const SEVERITY_COLORS: Record<AlertSeverity, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  critical: { 
    bg: 'bg-red-500/20', 
    text: 'text-red-400', 
    border: 'border-red-500/50',
    icon: <XCircle className="w-4 h-4" />
  },
  high: { 
    bg: 'bg-orange-500/20', 
    text: 'text-orange-400', 
    border: 'border-orange-500/50',
    icon: <AlertTriangle className="w-4 h-4" />
  },
  medium: { 
    bg: 'bg-amber-500/20', 
    text: 'text-amber-400', 
    border: 'border-amber-500/50',
    icon: <AlertCircle className="w-4 h-4" />
  },
  low: { 
    bg: 'bg-yellow-500/20', 
    text: 'text-yellow-400', 
    border: 'border-yellow-500/50',
    icon: <AlertCircle className="w-4 h-4" />
  },
  info: { 
    bg: 'bg-blue-500/20', 
    text: 'text-blue-400', 
    border: 'border-blue-500/50',
    icon: <Info className="w-4 h-4" />
  },
};

const ATTACK_SIMULATIONS = [
  {
    id: 'port-scan',
    name: 'Port Scan',
    description: 'Simulasi pemindaian port untuk mencari layanan terbuka',
    icon: Search,
    color: 'amber',
    packets: 10,
  },
  {
    id: 'syn-flood',
    name: 'SYN Flood',
    description: 'Simulasi serangan DoS dengan membanjiri SYN packets',
    icon: Zap,
    color: 'red',
    packets: 20,
  },
  {
    id: 'arp-spoof',
    name: 'ARP Spoofing',
    description: 'Simulasi serangan Man-in-the-Middle via ARP',
    icon: Bug,
    color: 'purple',
    packets: 5,
  },
  {
    id: 'sql-injection',
    name: 'SQL Injection',
    description: 'Simulasi serangan injeksi SQL ke web server',
    icon: Skull,
    color: 'orange',
    packets: 8,
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

function generateAttackPackets(type: string): AttackPacket[] {
  const packets: AttackPacket[] = [];
  const timestamp = Date.now();
  
  const generateMAC = () => {
    const hexDigits = '0123456789abcdef';
    let mac = '';
    for (let i = 0; i < 6; i++) {
      mac += hexDigits[Math.floor(Math.random() * 16)];
      mac += hexDigits[Math.floor(Math.random() * 16)];
      if (i < 5) mac += ':';
    }
    return mac;
  };
  
  switch (type) {
    case 'port-scan':
      // Generate SYN packets to different ports
      for (let i = 0; i < 10; i++) {
        packets.push({
          id: `scan-${timestamp}-${i}`,
          timestamp: timestamp + i * 100,
          sourceIP: '192.168.1.100',
          destIP: '192.168.1.1',
          sourceMAC: 'aa:bb:cc:dd:ee:01',
          destMAC: '00:11:22:33:44:55',
          sourcePort: 45000 + i,
          destPort: [21, 22, 23, 25, 80, 443, 3306, 3389, 5432, 8080][i],
          protocol: 'TCP',
          flags: ['SYN'],
          payload: '',
          size: 64,
          direction: 'outbound',
          isSpoofed: false,
          isMalicious: true,
        });
      }
      break;
      
    case 'syn-flood':
      // Generate many SYN packets to same port
      for (let i = 0; i < 20; i++) {
        packets.push({
          id: `flood-${timestamp}-${i}`,
          timestamp: timestamp + i * 50,
          sourceIP: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          destIP: '192.168.1.1',
          sourceMAC: generateMAC(),
          destMAC: '00:11:22:33:44:55',
          sourcePort: Math.floor(Math.random() * 65535),
          destPort: 80,
          protocol: 'TCP',
          flags: ['SYN'],
          payload: '',
          size: 64,
          direction: 'inbound',
          isSpoofed: true,
          isMalicious: true,
        });
      }
      break;
      
    case 'arp-spoof':
      // Generate ARP spoofing packets
      for (let i = 0; i < 5; i++) {
        packets.push({
          id: `arp-${timestamp}-${i}`,
          timestamp: timestamp + i * 200,
          sourceIP: '192.168.1.100',
          destIP: '192.168.1.1',
          sourceMAC: 'aa:bb:cc:dd:ee:ff',
          destMAC: 'ff:ff:ff:ff:ff:ff',
          sourcePort: 0,
          destPort: 0,
          protocol: 'ARP',
          flags: [],
          payload: JSON.stringify({
            operation: 'reply',
            senderMAC: 'aa:bb:cc:dd:ee:ff',
            senderIP: '192.168.1.1',
            targetMAC: '00:11:22:33:44:55',
            targetIP: '192.168.1.100',
          }),
          size: 42,
          direction: 'outbound',
          isSpoofed: true,
          isMalicious: true,
        });
      }
      break;
      
    case 'sql-injection':
      // Generate HTTP packets with SQL injection
      const sqlPayloads = [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "' UNION SELECT * FROM passwords --",
        "admin'--",
        "1; UPDATE users SET password='hacked'",
        "' OR 1=1 #",
        "'; INSERT INTO users VALUES('hacker','pass'); --",
        "' AND 1=0 UNION SELECT username,password FROM users --",
      ];
      
      for (let i = 0; i < 8; i++) {
        packets.push({
          id: `sql-${timestamp}-${i}`,
          timestamp: timestamp + i * 150,
          sourceIP: '192.168.1.100',
          destIP: '192.168.1.10',
          sourceMAC: 'aa:bb:cc:dd:ee:01',
          destMAC: '00:11:22:33:44:10',
          sourcePort: 54000 + i,
          destPort: 80,
          protocol: 'TCP',
          flags: ['PSH', 'ACK'],
          payload: `GET /login?username=${encodeURIComponent(sqlPayloads[i])}&password=test HTTP/1.1`,
          size: 256 + sqlPayloads[i].length,
          direction: 'outbound',
          isSpoofed: false,
          isMalicious: true,
        });
      }
      break;
  }
  
  return packets;
}

// ============================================================================
// Sub-Components
// ============================================================================

function MiniModeSelector({ mode, setMode, isRunning }: { 
  mode: 'ids' | 'ips' | 'hybrid'; 
  setMode: (mode: 'ids' | 'ips' | 'hybrid') => void;
  isRunning: boolean;
}) {
  const modes = [
    { id: 'ids', label: 'IDS', icon: Eye, tip: 'Deteksi saja' },
    { id: 'ips', label: 'IPS', icon: Shield, tip: 'Blokir otomatis' },
    { id: 'hybrid', label: 'Hybrid', icon: ShieldAlert, tip: 'Cerdas' },
  ] as const;

  return (
    <div className="flex items-center gap-1 p-0.5 bg-zinc-900/80 rounded-lg border border-zinc-800/50">
      {modes.map((m) => {
        const Icon = m.icon;
        const isActive = mode === m.id;
        
        return (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            disabled={isRunning}
            title={m.tip}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-md transition-all text-xs',
              isActive
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50',
              isRunning && !isActive && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Icon className="w-3 h-3" />
            <span className="hidden sm:inline">{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function AlertItem({ alert, onClick }: { alert: IDSAlert; onClick?: () => void }) {
  const colors = SEVERITY_COLORS[alert.severity];
  const timeAgo = useMemo(() => {
    const seconds = Math.floor((Date.now() - alert.timestamp) / 1000);
    if (seconds < 60) return `${seconds}d lalu`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m lalu`;
    return `${Math.floor(seconds / 3600)}j lalu`;
  }, [alert.timestamp]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 10, scale: 0.95 }}
      className={cn(
        'flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-all',
        colors.bg,
        colors.border,
        'hover:scale-[1.02]'
      )}
      onClick={onClick}
    >
      <div className={cn('mt-0.5', colors.text)}>
        {colors.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-zinc-200 truncate font-medium">{alert.message}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-zinc-500 truncate">
            {alert.sourceIP} → {alert.destIP}
          </span>
          <span className="text-[10px] text-zinc-600">•</span>
          <span className="text-[10px] text-zinc-500">{timeAgo}</span>
        </div>
      </div>
      <div className={cn(
        'px-1.5 py-0.5 rounded text-[10px] font-medium uppercase',
        colors.bg, colors.text
      )}>
        {alert.severity}
      </div>
    </motion.div>
  );
}

function AttackSimulationButton({ 
  attack, 
  onSimulate, 
  isRunning,
  disabled 
}: { 
  attack: typeof ATTACK_SIMULATIONS[0];
  onSimulate: () => void;
  isRunning: boolean;
  disabled: boolean;
}) {
  const Icon = attack.icon;
  const colorClasses = {
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20',
    red: 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20',
    orange: 'bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20',
  };

  return (
    <button
      onClick={onSimulate}
      disabled={disabled || !isRunning}
      title={!isRunning ? 'Aktifkan IDS terlebih dahulu' : attack.description}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-left w-full',
        colorClasses[attack.color as keyof typeof colorClasses],
        (disabled || !isRunning) && 'opacity-50 cursor-not-allowed'
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{attack.name}</p>
        <p className="text-[10px] opacity-70 truncate">{attack.packets} paket</p>
      </div>
    </button>
  );
}

function StatsCard({ label, value, icon, color }: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className={cn(
      'flex items-center gap-2 p-2 rounded-lg border',
      color
    )}>
      {icon}
      <div>
        <p className="text-[10px] text-zinc-500">{label}</p>
        <p className="text-sm font-bold">{value}</p>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function IDSPanel({ className, labId, onAlertDetected }: IDSPanelProps) {
  const {
    isInitialized,
    isRunning,
    mode,
    alerts,
    statistics,
    blocklist,
    initialize,
    start,
    stop,
    setMode,
    clearAlerts,
  } = useIDSStore();

  const criticalCount = useIDSStore(selectCriticalAlertsCount);
  const newCount = useIDSStore(selectNewAlertsCount);

  const [isExpanded, setIsExpanded] = useState(true);
  const [activeSection, setActiveSection] = useState<'alerts' | 'simulate' | 'learn'>('alerts');
  const [isSimulating, setIsSimulating] = useState(false);

  // Initialize IDS on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // Notify parent when alert detected
  useEffect(() => {
    if (alerts.length > 0 && onAlertDetected) {
      onAlertDetected(alerts[0]);
    }
  }, [alerts.length, onAlertDetected]);

  // Handle attack simulation
  const handleSimulateAttack = useCallback(async (attackType: string) => {
    if (!isRunning || isSimulating) return;
    
    setIsSimulating(true);
    const packets = generateAttackPackets(attackType);
    const idsEngine = getIDSEngine();
    
    // Send packets to IDS with delay for realism
    for (const packet of packets) {
      await new Promise(resolve => setTimeout(resolve, 100));
      idsEngine.analyzePacket(packet);
    }
    
    setIsSimulating(false);
  }, [isRunning, isSimulating]);

  const recentAlerts = alerts.slice(0, 5);

  return (
    <div className={cn(
      'rounded-2xl bg-zinc-900/80 border border-zinc-800/50 overflow-hidden',
      className
    )}>
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 bg-zinc-800/50 border-b border-zinc-700/50 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-lg',
            isRunning ? 'bg-cyan-500/20' : 'bg-zinc-800'
          )}>
            {isRunning ? (
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
            ) : (
              <ShieldOff className="w-5 h-5 text-zinc-500" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">IDS/IPS Monitor</span>
              {isRunning && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                  <Activity className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-400">Aktif</span>
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500">
              {isRunning 
                ? `${mode.toUpperCase()} • ${alerts.length} alert${alerts.length !== 1 ? 's' : ''}`
                : 'Sistem tidak aktif'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Alert badges */}
          {criticalCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30">
              <XCircle className="w-3 h-3 text-red-400" />
              <span className="text-xs font-medium text-red-400">{criticalCount}</span>
            </span>
          )}
          
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-zinc-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          )}
        </div>
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Controls */}
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/50 border-b border-zinc-800/50">
              <MiniModeSelector mode={mode} setMode={setMode} isRunning={isRunning} />
              
              <div className="flex items-center gap-2">
                {alerts.length > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); clearAlerts(); }}
                    className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
                    title="Hapus semua alert"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}
                
                <button
                  onClick={(e) => { e.stopPropagation(); isRunning ? stop() : start(); }}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    isRunning
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50'
                      : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/50'
                  )}
                >
                  {isRunning ? (
                    <>
                      <Pause className="w-3 h-3" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" />
                      <span>Start</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-2 p-3 border-b border-zinc-800/50">
              <StatsCard
                label="Paket"
                value={statistics?.packetsAnalyzed || 0}
                icon={<Server className="w-4 h-4 text-cyan-400" />}
                color="bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
              />
              <StatsCard
                label="Alerts"
                value={alerts.length}
                icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
                color="bg-amber-500/10 border-amber-500/30 text-amber-400"
              />
              <StatsCard
                label="Critical"
                value={criticalCount}
                icon={<XCircle className="w-4 h-4 text-red-400" />}
                color="bg-red-500/10 border-red-500/30 text-red-400"
              />
              <StatsCard
                label="Blocked"
                value={blocklist.length}
                icon={<Ban className="w-4 h-4 text-purple-400" />}
                color="bg-purple-500/10 border-purple-500/30 text-purple-400"
              />
            </div>

            {/* Section Tabs */}
            <div className="flex gap-1 p-2 bg-zinc-900/50 border-b border-zinc-800/50">
              {[
                { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
                { id: 'simulate', label: 'Simulasi', icon: Crosshair },
                { id: 'learn', label: 'Pelajari', icon: Info },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSection(tab.id as typeof activeSection)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-1 justify-center',
                      activeSection === tab.id
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Section Content */}
            <div className="p-3 max-h-[300px] overflow-y-auto">
              {activeSection === 'alerts' && (
                <div className="space-y-2">
                  {recentAlerts.length === 0 ? (
                    <div className="text-center py-6">
                      <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-zinc-700" />
                      <p className="text-sm text-zinc-500">Tidak ada alert</p>
                      <p className="text-xs text-zinc-600 mt-1">
                        {isRunning 
                          ? 'Sistem sedang memantau jaringan'
                          : 'Aktifkan IDS untuk mulai memantau'
                        }
                      </p>
                    </div>
                  ) : (
                    <>
                      <AnimatePresence mode="popLayout">
                        {recentAlerts.map((alert) => (
                          <AlertItem key={alert.id} alert={alert} />
                        ))}
                      </AnimatePresence>
                      {alerts.length > 5 && (
                        <p className="text-center text-xs text-zinc-500 mt-2">
                          + {alerts.length - 5} alert lainnya
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              {activeSection === 'simulate' && (
                <div className="space-y-3">
                  <p className="text-xs text-zinc-400 mb-3">
                    Simulasikan serangan untuk melihat bagaimana IDS/IPS mendeteksi dan merespons ancaman.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {ATTACK_SIMULATIONS.map((attack) => (
                      <AttackSimulationButton
                        key={attack.id}
                        attack={attack}
                        onSimulate={() => handleSimulateAttack(attack.id)}
                        isRunning={isRunning}
                        disabled={isSimulating}
                      />
                    ))}
                  </div>

                  {isSimulating && (
                    <div className="flex items-center justify-center gap-2 py-3 mt-2 bg-zinc-800/50 rounded-lg">
                      <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                      <span className="text-xs text-cyan-400">Mengirim paket serangan...</span>
                    </div>
                  )}

                  {!isRunning && (
                    <div className="flex items-center gap-2 p-2 mt-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <p className="text-xs text-amber-400">
                        Aktifkan IDS terlebih dahulu untuk menjalankan simulasi serangan.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'learn' && (
                <div className="space-y-3">
                  <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                    <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                      <Eye className="w-4 h-4 text-cyan-400" />
                      Apa itu IDS?
                    </h4>
                    <p className="text-xs text-zinc-400">
                      <strong>Intrusion Detection System (IDS)</strong> adalah sistem yang memantau lalu lintas jaringan 
                      untuk mendeteksi aktivitas mencurigakan atau serangan. IDS hanya <em>mendeteksi dan melaporkan</em>, 
                      tidak memblokir.
                    </p>
                  </div>

                  <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                    <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      Apa itu IPS?
                    </h4>
                    <p className="text-xs text-zinc-400">
                      <strong>Intrusion Prevention System (IPS)</strong> adalah pengembangan dari IDS yang tidak hanya 
                      mendeteksi, tapi juga <em>memblokir</em> serangan secara otomatis. IPS aktif mencegah ancaman.
                    </p>
                  </div>

                  <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                    <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-purple-400" />
                      Mode Hybrid
                    </h4>
                    <p className="text-xs text-zinc-400">
                      Mode <strong>Hybrid</strong> menggabungkan keduanya: mendeteksi semua ancaman seperti IDS, 
                      tapi hanya memblokir ancaman dengan tingkat keparahan tinggi (high/critical).
                    </p>
                  </div>

                  <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
                    <h4 className="text-sm font-semibold text-cyan-400 mb-2">Tips</h4>
                    <ul className="text-xs text-zinc-400 space-y-1">
                      <li>• Coba simulasikan serangan dan lihat alert yang muncul</li>
                      <li>• Bandingkan perilaku IDS vs IPS mode</li>
                      <li>• Perhatikan severity level setiap alert</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default IDSPanel;
