'use client';

import { cn } from '@/lib/utils';
import {
  Users,
  BookOpen,
  GraduationCap,
  TrendingUp,
  Clock,
  ArrowRight,
  Activity,
  Server,
  Cpu,
  HardDrive,
  AlertTriangle,
  CheckCircle2,
  Play,
  Eye,
  FileText,
  Settings,
  Zap,
  BarChart3,
  Shield,
  Radio,
  UserPlus,
  Award,
  Target,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  StatCard,
  ProgressBar,
  CircularProgress,
  SkeletonDashboard,
  StatusBadge,
  Avatar,
  DataTable,
  EmptyState,
} from '@/components/ui';

// ============================================================================
// Types
// ============================================================================

interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalLabs: number;
  completedLabs: number;
  avgScore: number;
  activeToday: number;
  pendingSubmissions: number;
  systemHealth: number;
}

interface RecentActivity {
  id: string;
  user: string;
  avatar?: string;
  action: string;
  lab: string;
  time: string;
  type: 'submit' | 'start' | 'complete' | 'login' | 'register';
}

interface TopStudent {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  labsCompleted: number;
  rank: number;
}

interface SystemStatus {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  value: number;
  unit: string;
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

const activityIcons: Record<string, { icon: typeof Play; color: string }> = {
  submit: { icon: FileText, color: 'text-blue-400' },
  start: { icon: Play, color: 'text-emerald-400' },
  complete: { icon: CheckCircle2, color: 'text-green-400' },
  login: { icon: Users, color: 'text-cyan-400' },
  register: { icon: UserPlus, color: 'text-purple-400' },
};

// ============================================================================
// Components
// ============================================================================

function WelcomeBanner({ stats }: { stats: DashboardStats }) {
  const activePercentage = stats.totalUsers > 0 
    ? Math.round((stats.activeToday / stats.totalUsers) * 100) 
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#088395]/20 via-[#09637E]/15 to-[#7AB2B2]/10 border border-[#088395]/30 p-6 mb-8"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#088395]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#7AB2B2]/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-[#088395]/20 border border-[#088395]/30">
                <Shield className="w-6 h-6 text-[#7AB2B2]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Dashboard Admin</h2>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Panel Kontrol CyberNexus
                </p>
              </div>
            </div>
            <p className="text-[var(--color-muted-foreground)] max-w-xl mt-4">
              {stats.activeToday} pengguna aktif hari ini ({activePercentage}% dari total).
              {stats.pendingSubmissions > 0 && (
                <span className="text-amber-400 ml-1">
                  {stats.pendingSubmissions} pengumpulan menunggu review.
                </span>
              )}
            </p>
          </div>
          
          {/* System Health Indicator */}
          <div className="hidden md:block">
            <div className="text-center">
              <CircularProgress
                value={stats.systemHealth}
                size={90}
                strokeWidth={8}
                color={stats.systemHealth > 80 ? 'success' : stats.systemHealth > 50 ? 'warning' : 'danger'}
                showLabel
              >
                <div className="text-center">
                  <div className={cn(
                    "text-xl font-bold",
                    stats.systemHealth > 80 ? "text-emerald-400" : 
                    stats.systemHealth > 50 ? "text-amber-400" : "text-red-400"
                  )}>
                    {stats.systemHealth}%
                  </div>
                  <div className="text-[10px] text-[var(--color-muted-foreground)]">Kesehatan</div>
                </div>
              </CircularProgress>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 mt-6">
          <Link
            href="/dashboard/admin/monitoring"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#088395] hover:bg-[#09637E] text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Radio className="w-4 h-4" />
            Monitoring Live
          </Link>
          <Link
            href="/dashboard/admin/reports"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-white rounded-xl text-sm font-medium transition-colors border border-[var(--color-border)]"
          >
            <FileText className="w-4 h-4" />
            Lihat Laporan
          </Link>
          <Link
            href="/dashboard/admin/analytics"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-white rounded-xl text-sm font-medium transition-colors border border-[var(--color-border)]"
          >
            <BarChart3 className="w-4 h-4" />
            Analitik
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function SystemHealthCard({ systems }: { systems: SystemStatus[] }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'info';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'healthy': return 'Sehat';
      case 'warning': return 'Peringatan';
      case 'critical': return 'Kritis';
      default: return status;
    }
  };

  const getIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'cpu': return Cpu;
      case 'memory': return Server;
      case 'storage': return HardDrive;
      default: return Activity;
    }
  };

  return (
    <motion.div
      variants={item}
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Server className="w-5 h-5 text-[#088395]" />
          Status Sistem
        </h3>
        <Link 
          href="/dashboard/admin/monitoring" 
          className="text-xs text-[#088395] hover:text-[#7AB2B2] transition-colors"
        >
          Detail
        </Link>
      </div>
      
      <div className="space-y-4">
        {systems.map((system) => {
          const Icon = getIcon(system.name);
          return (
            <div key={system.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-[var(--color-muted-foreground)]" />
                  <span className="text-sm text-white">{system.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--color-foreground)]">
                    {system.value}{system.unit}
                  </span>
                  <StatusBadge
                    status={getStatusColor(system.status) as 'success' | 'warning' | 'error' | 'info'}
                    size="sm"
                    label={getStatusLabel(system.status)}
                  />
                </div>
              </div>
              <ProgressBar
                value={system.value}
                max={100}
                size="sm"
                color={system.status === 'healthy' ? 'success' : system.status === 'warning' ? 'warning' : 'danger'}
              />
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function RecentActivityList({ activities }: { activities: RecentActivity[] }) {
  if (activities.length === 0) {
    return (
      <motion.div
        variants={item}
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#088395]" />
            Aktivitas Terbaru
          </h3>
        </div>
        <EmptyState
          type="no-data"
          title="Belum Ada Aktivitas"
          description="Aktivitas pengguna akan muncul di sini"
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={item}
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#088395]" />
          Aktivitas Terbaru
        </h3>
        <Link 
          href="/dashboard/admin/reports" 
          className="text-xs text-[#088395] hover:text-[#7AB2B2] transition-colors"
        >
          Lihat semua
        </Link>
      </div>
      
      <div className="space-y-3">
        {activities.slice(0, 6).map((activity) => {
          const activityConfig = activityIcons[activity.type] || activityIcons.login;
          const Icon = activityConfig.icon;
          
          return (
            <div
              key={activity.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] transition-colors"
            >
              <Avatar
                fallback={activity.user}
                src={activity.avatar}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-white font-medium truncate">
                    {activity.user}
                  </p>
                  <Icon className={cn("w-3.5 h-3.5", activityConfig.color)} />
                </div>
                <p className="text-xs text-[var(--color-muted-foreground)] truncate">
                  {activity.action} - {activity.lab}
                </p>
              </div>
              <span className="text-xs text-[var(--color-muted-foreground)] whitespace-nowrap">
                {activity.time}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function TopStudentsCard({ students }: { students: TopStudent[] }) {
  if (students.length === 0) {
    return (
      <motion.div
        variants={item}
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            Siswa Terbaik
          </h3>
        </div>
        <EmptyState
          type="no-data"
          title="Belum Ada Data"
          description="Peringkat siswa akan muncul setelah ada lab yang diselesaikan"
        />
      </motion.div>
    );
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-br from-amber-400 to-amber-600 text-white';
    if (rank === 2) return 'bg-gradient-to-br from-zinc-300 to-zinc-500 text-white';
    if (rank === 3) return 'bg-gradient-to-br from-amber-600 to-amber-800 text-white';
    return 'bg-[var(--color-surface-3)] text-[var(--color-muted-foreground)]';
  };

  return (
    <motion.div
      variants={item}
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          Siswa Terbaik
        </h3>
        <Link 
          href="/dashboard/admin/students" 
          className="text-xs text-[#088395] hover:text-[#7AB2B2] transition-colors"
        >
          Lihat semua
        </Link>
      </div>
      
      <div className="space-y-3">
        {students.slice(0, 5).map((student) => (
          <Link
            key={student.id}
            href={`/dashboard/admin/students/${student.id}`}
            className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] transition-colors"
          >
            <div className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold",
              getRankBadge(student.rank)
            )}>
              {student.rank}
            </div>
            <Avatar
              fallback={student.name}
              src={student.avatar}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">
                {student.name}
              </p>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                {student.labsCompleted} lab selesai
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-[#088395]">{student.score}</p>
              <p className="text-[10px] text-[var(--color-muted-foreground)]">poin</p>
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}

function QuickActionsCard() {
  const actions = [
    {
      title: 'Tambah Pengguna',
      description: 'Daftarkan pengguna baru',
      icon: UserPlus,
      href: '/dashboard/admin/users',
      color: 'primary',
    },
    {
      title: 'Kelola Lab',
      description: 'Konfigurasi lab praktikum',
      icon: BookOpen,
      href: '/dashboard/admin/labs',
      color: 'success',
    },
    {
      title: 'Kelola Kelas',
      description: 'Atur kelas dan siswa',
      icon: GraduationCap,
      href: '/dashboard/admin/classes',
      color: 'info',
    },
    {
      title: 'Pengaturan',
      description: 'Konfigurasi sistem',
      icon: Settings,
      href: '/dashboard/admin/settings',
      color: 'neutral',
    },
  ];

  const colorStyles: Record<string, string> = {
    primary: 'bg-[#088395]/10 text-[#7AB2B2] border-[#088395]/30 hover:bg-[#088395]/20',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20',
    neutral: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30 hover:bg-zinc-500/20',
  };

  return (
    <motion.div
      variants={item}
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5"
    >
      <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
        <Zap className="w-5 h-5 text-amber-400" />
        Aksi Cepat
      </h3>
      
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.title}
              href={action.href}
              className={cn(
                "flex flex-col items-center justify-center p-4 rounded-xl border transition-all text-center",
                colorStyles[action.color]
              )}
            >
              <Icon className="w-6 h-6 mb-2" />
              <p className="text-sm font-medium text-white">{action.title}</p>
              <p className="text-[10px] text-[var(--color-muted-foreground)] mt-0.5">
                {action.description}
              </p>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}

function LabOverviewCard({ stats }: { stats: { total: number; active: number; completed: number; avgCompletion: number } }) {
  return (
    <motion.div
      variants={item}
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-[#088395]" />
          Ringkasan Lab
        </h3>
        <Link 
          href="/dashboard/admin/labs" 
          className="text-xs text-[#088395] hover:text-[#7AB2B2] transition-colors"
        >
          Kelola
        </Link>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-white">{stats.total}</p>
          <p className="text-xs text-[var(--color-muted-foreground)]">Total Lab</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-emerald-400">{stats.active}</p>
          <p className="text-xs text-[var(--color-muted-foreground)]">Aktif</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-[#088395]">{stats.completed}</p>
          <p className="text-xs text-[var(--color-muted-foreground)]">Selesai</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--color-muted-foreground)]">Rata-rata Penyelesaian</span>
          <span className="font-medium text-[#088395]">{stats.avgCompletion}%</span>
        </div>
        <ProgressBar
          value={stats.avgCompletion}
          max={100}
          color="primary"
          animate
        />
      </div>
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalStudents: 0,
    totalLabs: 0,
    completedLabs: 0,
    avgScore: 0,
    activeToday: 0,
    pendingSubmissions: 0,
    systemHealth: 95,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [topStudents, setTopStudents] = useState<TopStudent[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock system status - in real app, fetch from monitoring API
  const systemStatus: SystemStatus[] = [
    { name: 'CPU', status: 'healthy', value: 45, unit: '%' },
    { name: 'Memory', status: 'healthy', value: 62, unit: '%' },
    { name: 'Storage', status: 'warning', value: 78, unit: '%' },
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/stats');
        const data = await res.json();
        if (data.success) {
          setStats(prev => ({
            ...prev,
            ...data.stats,
            systemHealth: 95, // Mock value
            pendingSubmissions: 3, // Mock value
          }));
          setRecentActivity(data.recentActivity || []);
        }

        // Mock top students - in real app, fetch from API
        setTopStudents([
          { id: '1', name: 'Ahmad Rizky', score: 2850, labsCompleted: 8, rank: 1 },
          { id: '2', name: 'Siti Nurhaliza', score: 2720, labsCompleted: 7, rank: 2 },
          { id: '3', name: 'Budi Santoso', score: 2580, labsCompleted: 7, rank: 3 },
          { id: '4', name: 'Dewi Lestari', score: 2450, labsCompleted: 6, rank: 4 },
          { id: '5', name: 'Eko Prasetyo', score: 2320, labsCompleted: 6, rank: 5 },
        ]);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <SkeletonDashboard />
      </div>
    );
  }

  const labStats = {
    total: stats.totalLabs,
    active: stats.totalLabs - stats.completedLabs,
    completed: stats.completedLabs,
    avgCompletion: stats.avgScore,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <WelcomeBanner stats={stats} />

      {/* Stats Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8"
      >
        <motion.div variants={item}>
          <StatCard
            title="Total Pengguna"
            value={stats.totalUsers}
            icon={<Users className="w-5 h-5" />}
            color="primary"
            variant="gradient"
            href="/dashboard/admin/users"
            trend={{ value: 12, direction: 'up', label: 'bulan ini' }}
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard
            title="Total Siswa"
            value={stats.totalStudents}
            icon={<GraduationCap className="w-5 h-5" />}
            color="success"
            variant="gradient"
            href="/dashboard/admin/students"
            trend={{ value: 8, direction: 'up', label: 'bulan ini' }}
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard
            title="Lab Aktif"
            value={stats.totalLabs}
            icon={<BookOpen className="w-5 h-5" />}
            color="info"
            variant="gradient"
            href="/dashboard/admin/labs"
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard
            title="Rata-rata Nilai"
            value={`${stats.avgScore}%`}
            icon={<TrendingUp className="w-5 h-5" />}
            color="warning"
            variant="gradient"
            href="/dashboard/admin/analytics"
            trend={{ value: 5, direction: 'up', label: 'vs minggu lalu' }}
          />
        </motion.div>
      </motion.div>

      {/* Main Content Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 lg:grid-cols-3"
      >
        {/* Left Column - 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Activity */}
          <RecentActivityList activities={recentActivity} />
          
          {/* Lab Overview */}
          <LabOverviewCard stats={labStats} />
        </div>

        {/* Right Column - 1 col */}
        <div className="space-y-6">
          {/* System Health */}
          <SystemHealthCard systems={systemStatus} />
          
          {/* Top Students */}
          <TopStudentsCard students={topStudents} />
          
          {/* Quick Actions */}
          <QuickActionsCard />
        </div>
      </motion.div>
    </div>
  );
}
