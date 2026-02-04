'use client';

import { cn } from '@/lib/utils';
import {
  BookOpen,
  Clock,
  Play,
  CheckCircle,
  ArrowRight,
  Search,
  Filter,
  Zap,
  Target,
  ChevronRight,
  Lock,
  Network,
  Server,
  Shield,
  Wifi,
  Monitor,
  Settings,
  Globe,
  Layers,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ProgressBar, StatusBadge, EmptyState, SkeletonCard } from '@/components/ui';

// ============================================================================
// Types & Constants
// ============================================================================

interface LabProgress {
  startedAt: string | null;
  completedAt: string | null;
  currentScore: number;
  tasksCompleted: number;
}

interface Lab {
  id: string;
  number: number;
  title: string;
  description: string;
  objectives: string[];
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  durationMinutes: number;
  maxScore: number;
  totalTasks: number;
  isLocked: boolean;
  prerequisiteId: string | null;
  progress: LabProgress | null;
  icon: string;
}

// 8 Fixed labs matching the admin classes structure
const FIXED_LABS: Omit<Lab, 'progress'>[] = [
  {
    id: 'lab-1',
    number: 1,
    title: 'Pengenalan Jaringan Komputer',
    description: 'Mempelajari konsep dasar jaringan komputer, model OSI, dan TCP/IP. Memahami cara kerja komunikasi antar perangkat dalam jaringan.',
    objectives: ['Memahami model OSI Layer', 'Mengenal protokol TCP/IP', 'Membedakan jenis-jenis jaringan'],
    difficulty: 'BEGINNER',
    durationMinutes: 45,
    maxScore: 100,
    totalTasks: 5,
    isLocked: false,
    prerequisiteId: null,
    icon: 'network',
  },
  {
    id: 'lab-2',
    number: 2,
    title: 'Konfigurasi IP Address & Subnetting',
    description: 'Belajar mengkonfigurasi IP Address, memahami subnet mask, dan menghitung subnetting untuk pembagian jaringan.',
    objectives: ['Mengkonfigurasi IP Address', 'Menghitung Subnet', 'Memahami CIDR notation'],
    difficulty: 'BEGINNER',
    durationMinutes: 60,
    maxScore: 100,
    totalTasks: 6,
    isLocked: false,
    prerequisiteId: 'lab-1',
    icon: 'settings',
  },
  {
    id: 'lab-3',
    number: 3,
    title: 'Konfigurasi Router Dasar',
    description: 'Mempelajari konfigurasi dasar router, routing table, dan cara menghubungkan jaringan berbeda melalui router.',
    objectives: ['Konfigurasi interface router', 'Membuat routing table', 'Menghubungkan 2 jaringan'],
    difficulty: 'INTERMEDIATE',
    durationMinutes: 75,
    maxScore: 100,
    totalTasks: 7,
    isLocked: false,
    prerequisiteId: 'lab-2',
    icon: 'server',
  },
  {
    id: 'lab-4',
    number: 4,
    title: 'Routing Static & Dynamic',
    description: 'Implementasi routing static dan dynamic (RIP, OSPF) untuk mengelola jalur komunikasi antar jaringan secara efisien.',
    objectives: ['Konfigurasi Static Routing', 'Implementasi RIP', 'Konfigurasi OSPF dasar'],
    difficulty: 'INTERMEDIATE',
    durationMinutes: 90,
    maxScore: 100,
    totalTasks: 8,
    isLocked: false,
    prerequisiteId: 'lab-3',
    icon: 'globe',
  },
  {
    id: 'lab-5',
    number: 5,
    title: 'Konfigurasi Switch & VLAN',
    description: 'Belajar konfigurasi switch layer 2, membuat dan mengelola VLAN untuk segmentasi jaringan yang lebih aman dan efisien.',
    objectives: ['Konfigurasi dasar Switch', 'Membuat VLAN', 'Inter-VLAN Routing'],
    difficulty: 'INTERMEDIATE',
    durationMinutes: 90,
    maxScore: 100,
    totalTasks: 8,
    isLocked: false,
    prerequisiteId: 'lab-4',
    icon: 'layers',
  },
  {
    id: 'lab-6',
    number: 6,
    title: 'Firewall & Network Security',
    description: 'Implementasi firewall, access control list (ACL), dan teknik keamanan jaringan untuk melindungi infrastruktur.',
    objectives: ['Konfigurasi Firewall rules', 'Membuat Access Control List', 'Implementasi NAT'],
    difficulty: 'ADVANCED',
    durationMinutes: 120,
    maxScore: 100,
    totalTasks: 10,
    isLocked: false,
    prerequisiteId: 'lab-5',
    icon: 'shield',
  },
  {
    id: 'lab-7',
    number: 7,
    title: 'Network Monitoring & Troubleshooting',
    description: 'Teknik monitoring jaringan, analisis traffic, dan troubleshooting masalah konektivitas menggunakan berbagai tools.',
    objectives: ['Menggunakan monitoring tools', 'Analisis network traffic', 'Troubleshooting konektivitas'],
    difficulty: 'ADVANCED',
    durationMinutes: 90,
    maxScore: 100,
    totalTasks: 8,
    isLocked: false,
    prerequisiteId: 'lab-6',
    icon: 'monitor',
  },
  {
    id: 'lab-8',
    number: 8,
    title: 'Implementasi Jaringan Lengkap',
    description: 'Project akhir mengimplementasikan jaringan enterprise lengkap dengan router, switch, VLAN, firewall, dan monitoring.',
    objectives: ['Design topologi jaringan', 'Implementasi full network', 'Dokumentasi jaringan'],
    difficulty: 'ADVANCED',
    durationMinutes: 150,
    maxScore: 100,
    totalTasks: 12,
    isLocked: false,
    prerequisiteId: 'lab-7',
    icon: 'wifi',
  },
];

const labIcons: Record<string, typeof Network> = {
  network: Network,
  settings: Settings,
  server: Server,
  globe: Globe,
  layers: Layers,
  shield: Shield,
  monitor: Monitor,
  wifi: Wifi,
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

// ============================================================================
// Helper Functions
// ============================================================================

const getLabStatus = (lab: Lab): 'completed' | 'in-progress' | 'available' | 'locked' => {
  if (lab.isLocked) return 'locked';
  if (lab.progress?.completedAt) return 'completed';
  if (lab.progress?.startedAt) return 'in-progress';
  return 'available';
};

const getProgressPercent = (lab: Lab): number => {
  if (lab.isLocked) return 0;
  if (!lab.progress) return 0;
  if (lab.progress.completedAt) return 100;
  return Math.round((lab.progress.tasksCompleted / lab.totalTasks) * 100);
};

const formatDifficulty = (diff: string): string => {
  switch (diff) {
    case 'BEGINNER': return 'Pemula';
    case 'INTERMEDIATE': return 'Menengah';
    case 'ADVANCED': return 'Lanjutan';
    default: return diff;
  }
};

const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours} jam ${mins} menit` : `${hours} jam`;
};

const getDifficultyColor = (diff: string): 'success' | 'warning' | 'error' => {
  switch (diff) {
    case 'BEGINNER': return 'success';
    case 'INTERMEDIATE': return 'warning';
    case 'ADVANCED': return 'error';
    default: return 'success';
  }
};

// ============================================================================
// Components
// ============================================================================

function StatsOverview({ labs }: { labs: Lab[] }) {
  const completed = labs.filter(l => getLabStatus(l) === 'completed').length;
  const inProgress = labs.filter(l => getLabStatus(l) === 'in-progress').length;
  const available = labs.filter(l => getLabStatus(l) === 'available').length;
  const locked = labs.filter(l => getLabStatus(l) === 'locked').length;
  const totalProgress = labs.length > 0 
    ? Math.round(labs.reduce((acc, l) => acc + getProgressPercent(l), 0) / labs.length) 
    : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6"
    >
      <div className="rounded-xl bg-[var(--color-surface-1)] border border-[var(--color-border)] p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#088395]/10">
            <BookOpen className="h-5 w-5 text-[#088395]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{labs.length}</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">Total Lab</p>
          </div>
        </div>
      </div>
      <div className="rounded-xl bg-[var(--color-surface-1)] border border-[var(--color-border)] p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{completed}</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">Selesai</p>
          </div>
        </div>
      </div>
      <div className="rounded-xl bg-[var(--color-surface-1)] border border-[var(--color-border)] p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Play className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{inProgress}</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">Berjalan</p>
          </div>
        </div>
      </div>
      <div className="rounded-xl bg-[var(--color-surface-1)] border border-[var(--color-border)] p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sky-500/10">
            <Target className="h-5 w-5 text-sky-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{available}</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">Tersedia</p>
          </div>
        </div>
      </div>
      <div className="col-span-2 lg:col-span-1 rounded-xl bg-gradient-to-br from-[#088395]/20 to-[#09637E]/20 border border-[#088395]/30 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-white">{totalProgress}%</p>
            <p className="text-xs text-[#7AB2B2]">Progress Keseluruhan</p>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-[#088395]/30 flex items-center justify-center">
            <span className="text-sm font-bold text-[#088395]">{completed}/{labs.length}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function LabCard({ lab, index }: { lab: Lab; index: number }) {
  const status = getLabStatus(lab);
  const progress = getProgressPercent(lab);
  const tasksCompleted = lab.progress?.tasksCompleted || 0;
  const isLocked = status === 'locked';
  const IconComponent = labIcons[lab.icon] || Network;

  return (
    <motion.div
      variants={item}
      whileHover={!isLocked ? { y: -4, scale: 1.01 } : {}}
      className={cn(
        "group relative rounded-2xl border overflow-hidden transition-all duration-300",
        isLocked
          ? "border-[var(--color-border)]/50 bg-[var(--color-surface-1)]/30 opacity-60"
          : "border-[var(--color-border)] bg-[var(--color-surface-1)] hover:border-[#088395]/50 hover:shadow-xl hover:shadow-[#088395]/5"
      )}
    >
      {/* Locked Overlay */}
      {isLocked && (
        <div className="absolute inset-0 bg-[var(--color-background)]/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
          <div className="text-center p-4">
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-2)] flex items-center justify-center mx-auto mb-3">
              <Lock className="h-6 w-6 text-[var(--color-muted-foreground)]" />
            </div>
            <p className="text-sm text-[var(--color-muted-foreground)] font-medium">Lab Terkunci</p>
            <p className="text-xs text-[var(--color-muted-foreground)]/70 mt-1">Selesaikan Lab {lab.number - 1} terlebih dahulu</p>
          </div>
        </div>
      )}

      {/* Lab Number Badge */}
      <div className="absolute top-4 left-4 z-5">
        <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-[var(--color-surface-2)] text-[var(--color-muted-foreground)] border border-[var(--color-border)]">
          Lab #{lab.number.toString().padStart(2, '0')}
        </span>
      </div>

      {/* Header with Icon */}
      <div className="p-6 pb-4 pt-14">
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
            status === 'completed' 
              ? "bg-emerald-500/10" 
              : status === 'in-progress'
                ? "bg-amber-500/10"
                : "bg-[#088395]/10 group-hover:bg-[#088395]/20"
          )}>
            <IconComponent className={cn(
              "h-6 w-6",
              status === 'completed' 
                ? "text-emerald-400" 
                : status === 'in-progress'
                  ? "text-amber-400"
                  : "text-[#088395]"
            )} />
          </div>
          <StatusBadge
            status={getDifficultyColor(lab.difficulty)}
            size="sm"
            label={formatDifficulty(lab.difficulty)}
          />
        </div>

        <h3 className={cn(
          "text-lg font-semibold mb-2 transition-colors line-clamp-1",
          isLocked ? "text-[var(--color-muted-foreground)]" : "text-white group-hover:text-[#088395]"
        )}>
          {lab.title}
        </h3>
        <p className={cn(
          "text-sm line-clamp-2 mb-4",
          isLocked ? "text-[var(--color-muted-foreground)]/50" : "text-[var(--color-muted-foreground)]"
        )}>
          {lab.description}
        </p>

        {/* Meta Info */}
        <div className={cn(
          "flex items-center gap-4 text-sm",
          isLocked ? "text-[var(--color-muted-foreground)]/50" : "text-[var(--color-muted-foreground)]"
        )}>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{formatDuration(lab.durationMinutes)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Target className="h-4 w-4" />
            <span>{tasksCompleted}/{lab.totalTasks} tugas</span>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="px-6 pb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className={isLocked ? "text-[var(--color-muted-foreground)]/50" : "text-[var(--color-muted-foreground)]"}>
            Progress
          </span>
          <span className={cn(
            "font-semibold",
            status === 'completed' ? "text-emerald-400" : "text-[#088395]"
          )}>
            {progress}%
          </span>
        </div>
        <ProgressBar
          value={progress}
          max={100}
          size="sm"
          color={status === 'completed' ? 'success' : 'primary'}
        />
      </div>

      {/* Objectives Preview */}
      {!isLocked && lab.objectives.length > 0 && (
        <div className="px-6 pb-4">
          <div className="flex flex-wrap gap-1.5">
            {lab.objectives.slice(0, 2).map((obj, i) => (
              <span 
                key={i} 
                className="text-[10px] px-2 py-1 rounded-md bg-[var(--color-surface-2)] text-[var(--color-muted-foreground)] border border-[var(--color-border)]"
              >
                {obj.length > 25 ? obj.slice(0, 25) + '...' : obj}
              </span>
            ))}
            {lab.objectives.length > 2 && (
              <span className="text-[10px] px-2 py-1 rounded-md bg-[var(--color-surface-2)] text-[var(--color-muted-foreground)]">
                +{lab.objectives.length - 2} lagi
              </span>
            )}
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="px-6 pb-6">
        {isLocked ? (
          <div className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--color-surface-2)]/50 text-[var(--color-muted-foreground)] border border-[var(--color-border)]/50 cursor-not-allowed">
            <Lock className="h-4 w-4" />
            Terkunci
          </div>
        ) : status === 'completed' ? (
          <Link
            href={`/labs/${lab.id}`}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all font-medium"
          >
            <CheckCircle className="h-4 w-4" />
            Tinjau Lab
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : status === 'in-progress' ? (
          <Link
            href={`/labs/${lab.id}`}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#088395] to-[#09637E] text-white font-medium hover:shadow-lg hover:shadow-[#088395]/25 transition-all"
          >
            <Play className="h-4 w-4" />
            Lanjutkan Lab
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <Link
            href={`/labs/${lab.id}`}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--color-surface-2)] text-white border border-[var(--color-border)] hover:bg-[#088395]/10 hover:border-[#088395]/30 hover:text-[#088395] transition-all font-medium"
          >
            <ArrowRight className="h-4 w-4" />
            Mulai Lab
          </Link>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function StudentLabsPage() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  useEffect(() => {
    // Simulate fetching data - in real app, this would come from API
    const fetchLabs = async () => {
      try {
        // For demo, we use mock progress data
        // In production, fetch from /api/labs
        const mockProgress: Record<string, LabProgress> = {
          'lab-1': { startedAt: '2026-01-15', completedAt: '2026-01-16', currentScore: 95, tasksCompleted: 5 },
          'lab-2': { startedAt: '2026-01-18', completedAt: '2026-01-20', currentScore: 88, tasksCompleted: 6 },
          'lab-3': { startedAt: '2026-01-22', completedAt: null, currentScore: 60, tasksCompleted: 4 },
          'lab-4': { startedAt: null, completedAt: null, currentScore: 0, tasksCompleted: 0 },
        };

        const labsWithProgress: Lab[] = FIXED_LABS.map((lab, index) => {
          // Lock labs if previous lab is not completed (except first lab)
          const prevLab = index > 0 ? FIXED_LABS[index - 1] : null;
          const prevProgress = prevLab ? mockProgress[prevLab.id] : null;
          const isLocked = prevLab ? !prevProgress?.completedAt : false;

          return {
            ...lab,
            isLocked,
            progress: mockProgress[lab.id] || null,
          };
        });

        setLabs(labsWithProgress);
      } catch (error) {
        console.error('Error fetching labs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLabs();
  }, []);

  // Filter labs
  const filteredLabs = labs.filter((lab) => {
    // Search filter
    if (
      searchQuery &&
      !lab.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !lab.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    // Status filter
    if (filterStatus !== 'all') {
      const status = getLabStatus(lab);
      if (filterStatus === 'locked' && !lab.isLocked) return false;
      if (filterStatus !== 'locked' && filterStatus !== status) return false;
    }

    // Difficulty filter
    if (filterDifficulty !== 'all') {
      if (lab.difficulty !== filterDifficulty) return false;
    }

    return true;
  });

  const resetFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setFilterDifficulty('all');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-2)] animate-pulse" />
          <div className="space-y-2">
            <div className="w-32 h-5 rounded bg-[var(--color-surface-2)] animate-pulse" />
            <div className="w-48 h-4 rounded bg-[var(--color-surface-2)] animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-[var(--color-surface-1)] animate-pulse" />
          ))}
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Page Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#088395]/20 to-[#09637E]/20 border border-[#088395]/30">
            <BookOpen className="w-5 h-5 text-[#088395]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Lab Praktikum</h1>
            <p className="text-sm text-[var(--color-muted-foreground)]">8 Lab untuk menguasai keamanan jaringan</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
          <Zap className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-medium text-amber-400">1,250 XP</span>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <StatsOverview labs={labs} />

      {/* Search and Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col md:flex-row gap-3 mb-6"
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted-foreground)]" />
          <input
            type="text"
            placeholder="Cari lab..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-[var(--color-surface-1)] border border-[var(--color-border)] text-white placeholder-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#088395]/50 focus:border-[#088395]/50 transition-all"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none pl-4 pr-10 py-3 rounded-xl bg-[var(--color-surface-1)] border border-[var(--color-border)] text-white focus:outline-none focus:ring-2 focus:ring-[#088395]/50 focus:border-[#088395]/50 transition-all cursor-pointer"
            aria-label="Filter by status"
          >
            <option value="all">Semua Status</option>
            <option value="available">Tersedia</option>
            <option value="in-progress">Sedang Berjalan</option>
            <option value="completed">Selesai</option>
            <option value="locked">Terkunci</option>
          </select>
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted-foreground)] pointer-events-none" />
        </div>

        {/* Difficulty Filter */}
        <div className="relative">
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            title="Filter by Difficulty Level"
            className="appearance-none pl-4 pr-10 py-3 rounded-xl bg-[var(--color-surface-1)] border border-[var(--color-border)] text-white focus:outline-none focus:ring-2 focus:ring-[#088395]/50 focus:border-[#088395]/50 transition-all cursor-pointer"
          >
            <option value="all">Semua Level</option>
            <option value="BEGINNER">Pemula</option>
            <option value="INTERMEDIATE">Menengah</option>
            <option value="ADVANCED">Lanjutan</option>
          </select>
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted-foreground)] pointer-events-none" />
        </div>
      </motion.div>

      {/* Labs Grid */}
      {filteredLabs.length > 0 ? (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {filteredLabs.map((lab, index) => (
            <LabCard key={lab.id} lab={lab} index={index} />
          ))}
        </motion.div>
      ) : (
        <EmptyState
          type="no-results"
          title="Lab tidak ditemukan"
          description="Coba sesuaikan pencarian atau kriteria filter"
          action={{
            label: 'Hapus Filter',
            onClick: resetFilters,
          }}
        />
      )}

      {/* Learning Path Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 p-5 rounded-2xl bg-gradient-to-br from-[#088395]/10 to-[#09637E]/10 border border-[#088395]/20"
      >
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <Zap className="w-5 h-5 text-[#088395]" />
          Learning Path
        </h3>
        <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
          Lab disusun secara berurutan dari dasar hingga lanjutan. Selesaikan setiap lab untuk membuka lab berikutnya dan kumpulkan XP untuk naik peringkat!
        </p>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
            <span className="text-[var(--color-muted-foreground)]">Selesai</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="text-[var(--color-muted-foreground)]">Sedang Berjalan</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#088395]" />
            <span className="text-[var(--color-muted-foreground)]">Tersedia</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-zinc-500" />
            <span className="text-[var(--color-muted-foreground)]">Terkunci</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
