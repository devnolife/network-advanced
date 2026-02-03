'use client';

/**
 * IDS Dashboard Component
 * 
 * Main dashboard for the Intrusion Detection System showing:
 * - Real-time statistics and metrics
 * - Alert summary
 * - System status
 * - Quick actions
 * 
 * Network Security Virtual Lab - Educational Platform
 */

import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Activity,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  Eye,
  EyeOff,
  Play,
  Pause,
  Settings,
  Database,
  Server,
  Wifi,
  Ban,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIDSStore, selectCriticalAlertsCount, selectNewAlertsCount } from '@/store/idsStore';
import { AlertSeverity } from '@/lib/network/ids/types';

// ============================================================================
// Types
// ============================================================================

interface IDSDashboardProps {
  className?: string;
  compact?: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; isUp: boolean };
  color: 'cyan' | 'red' | 'amber' | 'emerald' | 'purple' | 'zinc';
  onClick?: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const SEVERITY_COLORS: Record<AlertSeverity, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' },
  high: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/50' },
  medium: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/50' },
  low: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/50' },
  info: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50' },
};

const SEVERITY_ICONS: Record<AlertSeverity, React.ReactNode> = {
  critical: <XCircle className="w-4 h-4" />,
  high: <AlertTriangle className="w-4 h-4" />,
  medium: <AlertCircle className="w-4 h-4" />,
  low: <AlertCircle className="w-4 h-4" />,
  info: <CheckCircle className="w-4 h-4" />,
};

// ============================================================================
// Sub-Components
// ============================================================================

function StatCard({ title, value, icon, trend, color, onClick }: StatCardProps) {
  const colorClasses = {
    cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    zinc: 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400',
  };

  return (
    <motion.div
      className={cn(
        'p-4 rounded-xl border backdrop-blur-sm cursor-pointer transition-all',
        colorClasses[color],
        onClick && 'hover:scale-[1.02]'
      )}
      whileHover={onClick ? { y: -2 } : undefined}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-zinc-500 mb-1">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {trend && (
            <div className={cn(
              'flex items-center gap-1 text-xs mt-1',
              trend.isUp ? 'text-emerald-400' : 'text-red-400'
            )}>
              {trend.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{trend.value}%</span>
            </div>
          )}
        </div>
        <div className="p-2 rounded-lg bg-zinc-900/50">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

function ModeSelector() {
  const { mode, setMode, isRunning } = useIDSStore();

  const modes = [
    { id: 'ids', label: 'IDS', icon: Eye, description: 'Detection only' },
    { id: 'ips', label: 'IPS', icon: Shield, description: 'Prevention mode' },
    { id: 'hybrid', label: 'Hybrid', icon: ShieldAlert, description: 'Smart blocking' },
  ] as const;

  return (
    <div className="flex items-center gap-2 p-1 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
      {modes.map((m) => {
        const Icon = m.icon;
        const isActive = mode === m.id;
        
        return (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            disabled={isRunning}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-md transition-all text-sm',
              isActive
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50',
              isRunning && 'opacity-50 cursor-not-allowed'
            )}
            title={m.description}
          >
            <Icon className="w-4 h-4" />
            <span>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function AlertSeverityChart({ alerts }: { alerts: { severity: AlertSeverity }[] }) {
  const counts = useMemo(() => {
    const result: Record<AlertSeverity, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };
    alerts.forEach(a => result[a.severity]++);
    return result;
  }, [alerts]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const severities: AlertSeverity[] = ['critical', 'high', 'medium', 'low', 'info'];

  return (
    <div className="space-y-2">
      {severities.map((severity) => {
        const count = counts[severity];
        const percentage = total > 0 ? (count / total) * 100 : 0;
        const colors = SEVERITY_COLORS[severity];

        return (
          <div key={severity} className="flex items-center gap-3">
            <div className={cn('w-16 text-xs capitalize', colors.text)}>
              {severity}
            </div>
            <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className={cn('h-full rounded-full', colors.bg.replace('/20', ''))}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <div className="w-12 text-xs text-zinc-500 text-right">{count}</div>
          </div>
        );
      })}
    </div>
  );
}

function RecentAlertsList() {
  const { alerts, selectAlert, setActiveTab } = useIDSStore();
  const recentAlerts = alerts.slice(0, 5);

  if (recentAlerts.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500">
        <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No alerts detected</p>
        <p className="text-sm mt-1">System is monitoring traffic</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {recentAlerts.map((alert) => {
        const colors = SEVERITY_COLORS[alert.severity];
        
        return (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
              colors.bg,
              colors.border,
              'hover:bg-opacity-30'
            )}
            onClick={() => {
              selectAlert(alert.id);
              setActiveTab('alerts');
            }}
          >
            <div className={colors.text}>
              {SEVERITY_ICONS[alert.severity]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-200 truncate">{alert.message}</p>
              <p className="text-xs text-zinc-500">
                {alert.sourceIP} → {alert.destIP}
              </p>
            </div>
            <div className="text-xs text-zinc-500">
              {new Date(alert.timestamp).toLocaleTimeString()}
            </div>
          </motion.div>
        );
      })}
      
      {alerts.length > 5 && (
        <button
          onClick={() => setActiveTab('alerts')}
          className="w-full text-center text-sm text-cyan-400 hover:text-cyan-300 py-2"
        >
          View all {alerts.length} alerts →
        </button>
      )}
    </div>
  );
}

function SystemStatus() {
  const { isRunning, statistics, mode, blocklist } = useIDSStore();

  const statusItems = [
    {
      label: 'Engine Status',
      value: isRunning ? 'Running' : 'Stopped',
      icon: isRunning ? <Activity className="w-4 h-4 text-emerald-400 animate-pulse" /> : <Pause className="w-4 h-4 text-zinc-500" />,
      color: isRunning ? 'text-emerald-400' : 'text-zinc-500',
    },
    {
      label: 'Mode',
      value: mode.toUpperCase(),
      icon: mode === 'ips' ? <Shield className="w-4 h-4 text-cyan-400" /> : <Eye className="w-4 h-4 text-amber-400" />,
      color: mode === 'ips' ? 'text-cyan-400' : 'text-amber-400',
    },
    {
      label: 'Rules Loaded',
      value: statistics?.rulesLoaded || 0,
      icon: <Database className="w-4 h-4 text-purple-400" />,
      color: 'text-purple-400',
    },
    {
      label: 'Active Blocks',
      value: blocklist.length,
      icon: <Ban className="w-4 h-4 text-red-400" />,
      color: blocklist.length > 0 ? 'text-red-400' : 'text-zinc-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {statusItems.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800/50"
        >
          {item.icon}
          <div>
            <p className="text-xs text-zinc-500">{item.label}</p>
            <p className={cn('text-sm font-medium', item.color)}>{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function IDSDashboard({ className, compact = false }: IDSDashboardProps) {
  const {
    isInitialized,
    isRunning,
    alerts,
    statistics,
    blocklist,
    initialize,
    start,
    stop,
  } = useIDSStore();

  const criticalAlertsCount = useIDSStore(selectCriticalAlertsCount);
  const newAlertsCount = useIDSStore(selectNewAlertsCount);

  // Initialize on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // Format numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatBytes = (bytes: number) => {
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-3 rounded-xl',
            isRunning ? 'bg-cyan-500/20' : 'bg-zinc-800/50'
          )}>
            {isRunning ? (
              <ShieldCheck className="w-6 h-6 text-cyan-400" />
            ) : (
              <ShieldOff className="w-6 h-6 text-zinc-500" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-100">IDS/IPS Dashboard</h2>
            <p className="text-sm text-zinc-500">
              {isRunning ? 'System is actively monitoring' : 'System is stopped'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ModeSelector />
          
          <button
            onClick={() => isRunning ? stop() : start()}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
              isRunning
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50'
                : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/50'
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
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Packets Analyzed"
          value={formatNumber(statistics?.packetsAnalyzed || 0)}
          icon={<Server className="w-5 h-5 text-cyan-400" />}
          color="cyan"
        />
        <StatCard
          title="Total Alerts"
          value={alerts.length}
          icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}
          color="amber"
          trend={newAlertsCount > 0 ? { value: newAlertsCount, isUp: true } : undefined}
        />
        <StatCard
          title="Critical Alerts"
          value={criticalAlertsCount}
          icon={<XCircle className="w-5 h-5 text-red-400" />}
          color="red"
        />
        <StatCard
          title="Blocked IPs"
          value={blocklist.length}
          icon={<Ban className="w-5 h-5 text-purple-400" />}
          color="purple"
        />
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Packets/Second"
          value={statistics?.packetsPerSecond.toFixed(0) || 0}
          icon={<Zap className="w-5 h-5 text-emerald-400" />}
          color="emerald"
        />
        <StatCard
          title="Data Analyzed"
          value={formatBytes(statistics?.bytesAnalyzed || 0)}
          icon={<Database className="w-5 h-5 text-cyan-400" />}
          color="cyan"
        />
        <StatCard
          title="Avg Latency"
          value={`${(statistics?.avgLatency || 0).toFixed(2)}ms`}
          icon={<Clock className="w-5 h-5 text-amber-400" />}
          color="zinc"
        />
        <StatCard
          title="Rules Matched"
          value={statistics?.rulesMatched || 0}
          icon={<CheckCircle className="w-5 h-5 text-emerald-400" />}
          color="emerald"
        />
      </div>

      {!compact && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alert Severity Distribution */}
          <div className="p-5 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
            <h3 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Alert Severity Distribution
            </h3>
            <AlertSeverityChart alerts={alerts} />
          </div>

          {/* System Status */}
          <div className="p-5 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
            <h3 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              System Status
            </h3>
            <SystemStatus />
          </div>

          {/* Recent Alerts */}
          <div className="lg:col-span-2 p-5 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
            <h3 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
              <Wifi className="w-4 h-4 text-cyan-400" />
              Recent Alerts
            </h3>
            <RecentAlertsList />
          </div>
        </div>
      )}
    </div>
  );
}

export default IDSDashboard;
