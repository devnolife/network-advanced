'use client';

import { cn } from '@/lib/utils';
import {
  Activity,
  Users,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye,
  Play,
  Pause,
  TrendingUp,
  Globe,
  Zap,
  Database,
  Radio,
  Signal,
  Thermometer,
  Monitor,
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  StatCard,
  ProgressBar,
  StatusBadge,
  Avatar,
  EmptyState,
  SearchInput,
} from '@/components/ui';

// ============================================================================
// Types
// ============================================================================

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    temperature: number;
    history: { time: string; value: number }[];
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
    history: { time: string; value: number }[];
  };
  storage: {
    used: number;
    total: number;
    percentage: number;
    breakdown: { name: string; size: number; color: string }[];
  };
  network: {
    incoming: number;
    outgoing: number;
    totalIncoming: string;
    totalOutgoing: string;
    history: { time: string; incoming: number; outgoing: number }[];
  };
  uptime: {
    days: number;
    hours: number;
    minutes: number;
    lastRestart: string;
  };
}

interface ActiveSession {
  id: string;
  student: {
    id: string;
    name: string;
    username: string;
    class: string;
    avatar: string | null;
  };
  lab: {
    id: string;
    number: number;
    title: string;
  };
  status: 'active' | 'idle' | 'completing';
  progress: number;
  tasksCompleted: number;
  totalTasks: number;
  startedAt: string;
  lastActivity: string;
  ipAddress: string;
  browser: string;
}

interface LogEntry {
  id: string;
  level: 'info' | 'warning' | 'error' | 'success';
  category: string;
  message: string;
  details?: string;
  user?: string;
  ip?: string;
  timestamp: string;
}

interface ServerNode {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'maintenance';
  cpu: number;
  memory: number;
  connections: number;
  uptime: string;
}

// ============================================================================
// Constants
// ============================================================================

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const POLL_INTERVAL = 5000; // 5 seconds

// ============================================================================
// Components
// ============================================================================

function MetricCard({ 
  name, 
  value, 
  unit, 
  status, 
  history,
  icon: Icon,
  subValue,
}: { 
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  history: number[];
  icon: typeof Cpu;
  subValue?: string;
}) {
  return (
    <motion.div
      variants={item}
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2.5 rounded-xl border",
            status === 'healthy' && "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
            status === 'warning' && "bg-amber-500/10 border-amber-500/30 text-amber-400",
            status === 'critical' && "bg-red-500/10 border-red-500/30 text-red-400",
          )}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{name}</h3>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {status === 'healthy' ? 'Normal' : status === 'warning' ? 'Perhatian' : 'Kritis'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn(
            "text-2xl font-bold",
            status === 'healthy' && "text-emerald-400",
            status === 'warning' && "text-amber-400",
            status === 'critical' && "text-red-400",
          )}>
            {value}{unit}
          </p>
          {subValue && (
            <p className="text-xs text-[var(--color-muted-foreground)]">{subValue}</p>
          )}
        </div>
      </div>

      {/* Mini Chart */}
      <div className="flex items-end justify-between h-12 gap-0.5 mb-3">
        {history.map((val, i) => (
          <div
            key={i}
            className={cn(
              "flex-1 rounded-t transition-all duration-300",
              status === 'healthy' && "bg-emerald-500/40",
              status === 'warning' && "bg-amber-500/40",
              status === 'critical' && "bg-red-500/40",
            )}
            style={{ height: `${val}%` }}
          />
        ))}
      </div>

      <ProgressBar
        value={value}
        max={100}
        size="sm"
        color={status === 'healthy' ? 'success' : status === 'warning' ? 'warning' : 'danger'}
      />
    </motion.div>
  );
}

function ActiveSessionCard({ session, onView }: { session: ActiveSession; onView: (id: string) => void }) {
  const getStatusBadge = () => {
    switch (session.status) {
      case 'active':
        return <StatusBadge status="success" size="sm" label="Aktif" />;
      case 'idle':
        return <StatusBadge status="warning" size="sm" label="Idle" />;
      case 'completing':
        return <StatusBadge status="info" size="sm" label="Menyelesaikan" />;
    }
  };

  const timeSinceActivity = () => {
    const diff = Date.now() - new Date(session.lastActivity).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    return `${Math.floor(minutes / 60)} jam lalu`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 hover:border-[#088395]/50 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar
            fallback={session.student.name}
            src={session.student.avatar || undefined}
            size="md"
            status={session.status === 'active' ? 'online' : session.status === 'idle' ? 'idle' : 'busy'}
          />
          <div>
            <p className="font-medium text-white">{session.student.name}</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Lab {session.lab.number}: {session.lab.title}
            </p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-[var(--color-muted-foreground)]">
            {session.tasksCompleted}/{session.totalTasks} tugas
          </span>
          <span className="font-medium text-[#088395]">{session.progress}%</span>
        </div>
        <ProgressBar
          value={session.progress}
          max={100}
          size="sm"
          color="primary"
          animate
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-[var(--color-muted-foreground)]">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{timeSinceActivity()}</span>
          </div>
          <span className="text-[var(--color-border)]">|</span>
          <span>{session.student.class}</span>
        </div>
        <button
          onClick={() => onView(session.id)}
          className="flex items-center gap-1 text-xs text-[#088395] hover:text-[#7AB2B2] transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          Lihat
        </button>
      </div>
    </motion.div>
  );
}

function LiveLogItem({ log }: { log: LogEntry }) {
  const levelConfig = {
    info: { icon: Activity, color: 'text-sky-400', bg: 'bg-sky-500/10' },
    warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    error: { icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    success: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  };

  const config = levelConfig[log.level];
  const Icon = config.icon;

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-surface-2)]"
    >
      <div className={cn("p-1.5 rounded-lg flex-shrink-0", config.bg)}>
        <Icon className={cn("w-4 h-4", config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white">{log.message}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-xs text-[var(--color-muted-foreground)] capitalize">{log.category}</span>
          {log.user && (
            <>
              <span className="text-xs text-[var(--color-muted-foreground)]">•</span>
              <span className="text-xs text-[var(--color-muted-foreground)]">@{log.user}</span>
            </>
          )}
          <span className="text-xs text-[var(--color-muted-foreground)]">•</span>
          <span className="text-xs text-[var(--color-muted-foreground)]">{formatTime(log.timestamp)}</span>
        </div>
      </div>
    </motion.div>
  );
}

function ServerNodeCard({ node }: { node: ServerNode }) {
  const statusConfig = {
    online: { color: 'text-emerald-400', bg: 'bg-emerald-500', label: 'Online' },
    offline: { color: 'text-rose-400', bg: 'bg-rose-500', label: 'Offline' },
    maintenance: { color: 'text-amber-400', bg: 'bg-amber-500', label: 'Maintenance' },
  };

  const config = statusConfig[node.status];

  return (
    <motion.div
      variants={item}
      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full animate-pulse", config.bg)} />
          <span className="font-medium text-white">{node.name}</span>
        </div>
        <span className={cn("text-xs font-medium", config.color)}>{config.label}</span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-lg font-bold text-white">{node.cpu}%</p>
          <p className="text-[10px] text-[var(--color-muted-foreground)]">CPU</p>
        </div>
        <div>
          <p className="text-lg font-bold text-white">{node.memory}%</p>
          <p className="text-[10px] text-[var(--color-muted-foreground)]">Memory</p>
        </div>
        <div>
          <p className="text-lg font-bold text-white">{node.connections}</p>
          <p className="text-[10px] text-[var(--color-muted-foreground)]">Koneksi</p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-muted-foreground)]">
        <span>Uptime</span>
        <span className="font-medium text-white">{node.uptime}</span>
      </div>
    </motion.div>
  );
}

function StorageBreakdown({ breakdown }: { breakdown: { name: string; size: number; color: string }[] }) {
  const total = breakdown.reduce((acc, item) => acc + item.size, 0);
  
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5">
      <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
        <HardDrive className="w-5 h-5 text-[#088395]" />
        Storage Breakdown
      </h3>
      <div className="space-y-3">
        {breakdown.map((item, index) => (
          <div key={index}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-[var(--color-muted-foreground)]">{item.name}</span>
              <span className="text-white font-medium">{item.size} GB</span>
            </div>
            <div className="h-2 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${(item.size / total) * 100}%`,
                  backgroundColor: item.color 
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function MonitoringPage() {
  const [isLive, setIsLive] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Server nodes (mock - could be from API)
  const serverNodes: ServerNode[] = [
    { 
      id: '1', 
      name: 'Node 1 (Primary)', 
      status: 'online', 
      cpu: metrics?.cpu.usage || 0, 
      memory: metrics?.memory.percentage || 0, 
      connections: sessions.filter(s => s.status === 'active').length * 15, 
      uptime: metrics ? `${metrics.uptime.days} hari` : '-' 
    },
    { 
      id: '2', 
      name: 'Node 2 (Secondary)', 
      status: 'online', 
      cpu: Math.max(0, (metrics?.cpu.usage || 0) - 10), 
      memory: Math.max(0, (metrics?.memory.percentage || 0) - 8), 
      connections: sessions.filter(s => s.status === 'active').length * 8, 
      uptime: metrics ? `${metrics.uptime.days} hari` : '-' 
    },
    { 
      id: '3', 
      name: 'Node 3 (Backup)', 
      status: 'maintenance', 
      cpu: 0, 
      memory: 0, 
      connections: 0, 
      uptime: '-' 
    },
  ];

  // Fetch all monitoring data
  const fetchMonitoringData = useCallback(async () => {
    try {
      const [systemRes, sessionsRes, logsRes] = await Promise.all([
        fetch('/api/admin/monitoring/system'),
        fetch('/api/admin/monitoring/sessions'),
        fetch('/api/admin/monitoring/logs?limit=15'),
      ]);

      const [systemData, sessionsData, logsData] = await Promise.all([
        systemRes.json(),
        sessionsRes.json(),
        logsRes.json(),
      ]);

      if (systemData.success) {
        setMetrics(systemData.metrics);
      }

      if (sessionsData.success) {
        setSessions(sessionsData.sessions);
      }

      if (logsData.success) {
        setLogs(logsData.logs);
      }

      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching monitoring data:', err);
      setError('Gagal mengambil data monitoring');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchMonitoringData();
  }, [fetchMonitoringData]);

  // Live polling
  useEffect(() => {
    if (isLive) {
      pollRef.current = setInterval(fetchMonitoringData, POLL_INTERVAL);
    } else {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [isLive, fetchMonitoringData]);

  // Calculate stats
  const stats = {
    activeSessions: sessions.filter(s => s.status === 'active').length,
    totalSessions: sessions.length,
    avgProgress: sessions.length > 0 
      ? Math.round(sessions.reduce((acc, s) => acc + s.progress, 0) / sessions.length) 
      : 0,
    systemHealth: metrics 
      ? Math.round(100 - ((metrics.cpu.usage + metrics.memory.percentage + (metrics.storage.percentage || 0)) / 3))
      : 0,
  };

  // Filter sessions based on search
  const filteredSessions = sessions.filter(s =>
    s.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.lab.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.student.class.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewSession = (id: string) => {
    console.log('View session:', id);
    // In real app, open session detail modal or navigate
  };

  const handleRefresh = () => {
    fetchMonitoringData();
  };

  // Get metric status
  const getMetricStatus = (value: number, thresholds: [number, number] = [60, 80]): 'healthy' | 'warning' | 'critical' => {
    if (value >= thresholds[1]) return 'critical';
    if (value >= thresholds[0]) return 'warning';
    return 'healthy';
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#088395] mx-auto mb-4"></div>
            <p className="text-[var(--color-muted-foreground)]">Memuat data monitoring...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#088395]/20 border border-[#088395]/30">
              <Radio className="w-6 h-6 text-[#7AB2B2]" />
            </div>
            Monitoring Realtime
          </h1>
          <p className="text-[var(--color-muted-foreground)] mt-1">
            Pantau aktivitas sistem dan pengguna secara langsung
          </p>
        </div>

        <div className="flex items-center gap-3">
          {error && (
            <span className="text-xs text-rose-400 flex items-center gap-1">
              <XCircle className="w-4 h-4" />
              {error}
            </span>
          )}
          
          <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
            <Clock className="w-4 h-4" />
            Update: {lastUpdate.toLocaleTimeString('id-ID')}
          </div>
          
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] border border-[var(--color-border)] transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-[var(--color-muted-foreground)]" />
          </button>
          
          <button
            onClick={() => setIsLive(!isLive)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
              isLive 
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                : "bg-[var(--color-surface-2)] text-[var(--color-muted-foreground)] border border-[var(--color-border)]"
            )}
          >
            {isLive ? (
              <>
                <Pause className="w-4 h-4" />
                Live
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Paused
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8"
      >
        <motion.div variants={item}>
          <StatCard
            title="Sesi Aktif"
            value={stats.activeSessions}
            icon={<Users className="w-5 h-5" />}
            color="success"
            description={`dari ${stats.totalSessions} total sesi`}
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard
            title="Rata-rata Progress"
            value={`${stats.avgProgress}%`}
            icon={<TrendingUp className="w-5 h-5" />}
            color="primary"
            description="progress lab aktif"
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard
            title="Kesehatan Sistem"
            value={`${stats.systemHealth}%`}
            icon={<Activity className="w-5 h-5" />}
            color={stats.systemHealth > 80 ? 'success' : stats.systemHealth > 60 ? 'warning' : 'danger'}
            description={stats.systemHealth > 80 ? "semua metrik normal" : "perlu perhatian"}
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard
            title="Server Online"
            value={`${serverNodes.filter(n => n.status === 'online').length}/${serverNodes.length}`}
            icon={<Server className="w-5 h-5" />}
            color="info"
            description="node tersedia"
          />
        </motion.div>
      </motion.div>

      {/* System Metrics */}
      {metrics && (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8"
        >
          <MetricCard
            name="CPU"
            value={metrics.cpu.usage}
            unit="%"
            status={getMetricStatus(metrics.cpu.usage)}
            history={metrics.cpu.history.slice(-10).map(h => h.value)}
            icon={Cpu}
            subValue={`${metrics.cpu.temperature}°C | ${metrics.cpu.cores} cores`}
          />
          <MetricCard
            name="Memory"
            value={metrics.memory.percentage}
            unit="%"
            status={getMetricStatus(metrics.memory.percentage)}
            history={metrics.memory.history.slice(-10).map(h => h.value)}
            icon={Monitor}
            subValue={`${metrics.memory.used}/${metrics.memory.total} GB`}
          />
          <MetricCard
            name="Storage"
            value={metrics.storage.percentage}
            unit="%"
            status={getMetricStatus(metrics.storage.percentage, [70, 85])}
            history={Array(10).fill(metrics.storage.percentage)}
            icon={HardDrive}
            subValue={`${metrics.storage.used}/${metrics.storage.total} GB`}
          />
          <MetricCard
            name="Network"
            value={metrics.network.incoming}
            unit=" Mbps"
            status="healthy"
            history={metrics.network.history.slice(-10).map(h => Math.min(100, h.incoming))}
            icon={Wifi}
            subValue={`↓ ${metrics.network.incoming} | ↑ ${metrics.network.outgoing} Mbps`}
          />
        </motion.div>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active Sessions - 2 cols */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Signal className="w-5 h-5 text-[#088395]" />
                Sesi Lab Aktif
                <span className="px-2 py-0.5 rounded-full bg-[#088395]/20 text-[#7AB2B2] text-xs font-medium">
                  {filteredSessions.length}
                </span>
              </h3>
              <div className="w-full sm:w-64">
                <SearchInput
                  placeholder="Cari pengguna, lab, kelas..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                />
              </div>
            </div>

            {filteredSessions.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <AnimatePresence mode="popLayout">
                  {filteredSessions.map((session) => (
                    <ActiveSessionCard
                      key={session.id}
                      session={session}
                      onView={handleViewSession}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <EmptyState
                type="no-results"
                title="Tidak Ada Sesi"
                description={searchQuery ? "Tidak ditemukan sesi yang cocok dengan pencarian" : "Belum ada sesi lab aktif saat ini"}
              />
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Server Nodes */}
          <motion.div
            variants={item}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5"
          >
            <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-[#088395]" />
              Status Server
            </h3>
            <div className="space-y-3">
              {serverNodes.map((node) => (
                <ServerNodeCard key={node.id} node={node} />
              ))}
            </div>
          </motion.div>

          {/* Storage Breakdown */}
          {metrics && (
            <StorageBreakdown breakdown={metrics.storage.breakdown} />
          )}

          {/* Live Logs */}
          <motion.div
            variants={item}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Log Aktivitas
              </h3>
              {isLive && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Live
                </span>
              )}
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              <AnimatePresence mode="popLayout">
                {logs.slice(0, 10).map((log) => (
                  <LiveLogItem key={log.id} log={log} />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Uptime Info */}
      {metrics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 p-4 rounded-xl bg-gradient-to-r from-[#088395]/10 to-[#09637E]/10 border border-[#088395]/20 flex items-center justify-between flex-wrap gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#088395]/20">
              <Thermometer className="w-5 h-5 text-[#088395]" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">System Uptime</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                {metrics.uptime.days} hari, {metrics.uptime.hours} jam, {metrics.uptime.minutes} menit
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-[var(--color-muted-foreground)]">Total Data In: </span>
              <span className="text-white font-medium">{metrics.network.totalIncoming}</span>
            </div>
            <div>
              <span className="text-[var(--color-muted-foreground)]">Total Data Out: </span>
              <span className="text-white font-medium">{metrics.network.totalOutgoing}</span>
            </div>
            <div>
              <span className="text-[var(--color-muted-foreground)]">Last Restart: </span>
              <span className="text-white font-medium">
                {new Date(metrics.uptime.lastRestart).toLocaleDateString('id-ID')}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
