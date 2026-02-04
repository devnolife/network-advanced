'use client';

import { cn } from '@/lib/utils';
import {
  BookOpen,
  Trophy,
  Clock,
  Play,
  CheckCircle,
  Lock,
  ArrowRight,
  Flame,
  Target,
  Star,
  Shield,
  TrendingUp,
  Calendar,
  Zap,
  Award,
  ChevronRight,
  Network,
  Server,
  Settings,
  Globe,
  Layers,
  Monitor,
  Wifi,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  StatCard,
  ProgressBar,
  CircularProgress,
  SkeletonDashboard,
  EmptyState,
  StatusBadge,
} from '@/components/ui';

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
  difficulty: string;
  durationMinutes: number;
  totalTasks: number;
  isLocked: boolean;
  progress: LabProgress | null;
  icon: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
}

// 8 Fixed labs matching the course structure
const FIXED_LABS: Omit<Lab, 'progress' | 'isLocked'>[] = [
  {
    id: 'lab-1',
    number: 1,
    title: 'Pengenalan Jaringan Komputer',
    description: 'Mempelajari konsep dasar jaringan komputer, model OSI, dan TCP/IP.',
    difficulty: 'BEGINNER',
    durationMinutes: 45,
    totalTasks: 5,
    icon: 'network',
  },
  {
    id: 'lab-2',
    number: 2,
    title: 'Konfigurasi IP Address & Subnetting',
    description: 'Belajar mengkonfigurasi IP Address dan menghitung subnetting.',
    difficulty: 'BEGINNER',
    durationMinutes: 60,
    totalTasks: 6,
    icon: 'settings',
  },
  {
    id: 'lab-3',
    number: 3,
    title: 'Konfigurasi Router Dasar',
    description: 'Mempelajari konfigurasi dasar router dan routing table.',
    difficulty: 'INTERMEDIATE',
    durationMinutes: 75,
    totalTasks: 7,
    icon: 'server',
  },
  {
    id: 'lab-4',
    number: 4,
    title: 'Routing Static & Dynamic',
    description: 'Implementasi routing static dan dynamic (RIP, OSPF).',
    difficulty: 'INTERMEDIATE',
    durationMinutes: 90,
    totalTasks: 8,
    icon: 'globe',
  },
  {
    id: 'lab-5',
    number: 5,
    title: 'Konfigurasi Switch & VLAN',
    description: 'Belajar konfigurasi switch dan membuat VLAN.',
    difficulty: 'INTERMEDIATE',
    durationMinutes: 90,
    totalTasks: 8,
    icon: 'layers',
  },
  {
    id: 'lab-6',
    number: 6,
    title: 'Firewall & Network Security',
    description: 'Implementasi firewall dan access control list.',
    difficulty: 'ADVANCED',
    durationMinutes: 120,
    totalTasks: 10,
    icon: 'shield',
  },
  {
    id: 'lab-7',
    number: 7,
    title: 'Network Monitoring & Troubleshooting',
    description: 'Teknik monitoring dan troubleshooting jaringan.',
    difficulty: 'ADVANCED',
    durationMinutes: 90,
    totalTasks: 8,
    icon: 'monitor',
  },
  {
    id: 'lab-8',
    number: 8,
    title: 'Implementasi Jaringan Lengkap',
    description: 'Project akhir implementasi jaringan enterprise.',
    difficulty: 'ADVANCED',
    durationMinutes: 150,
    totalTasks: 12,
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

const achievementIcons: Record<string, typeof Star> = {
  star: Star,
  flame: Flame,
  shield: Shield,
  target: Target,
  trophy: Trophy,
  award: Award,
  zap: Zap,
};

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

// ============================================================================
// Helper Functions
// ============================================================================

const getLabStatus = (lab: Lab): 'completed' | 'in-progress' | 'available' | 'locked' => {
  if (lab.isLocked) return 'locked';
  if (lab.progress?.completedAt) return 'completed';
  if (lab.progress?.tasksCompleted && lab.progress.tasksCompleted > 0) return 'in-progress';
  return 'available';
};

const getProgressPercent = (lab: Lab): number => {
  if (!lab.progress || lab.totalTasks === 0) return 0;
  return Math.round((lab.progress.tasksCompleted / lab.totalTasks) * 100);
};

const formatDifficulty = (difficulty: string): string => {
  switch (difficulty) {
    case 'BEGINNER': return 'Pemula';
    case 'INTERMEDIATE': return 'Menengah';
    case 'ADVANCED': return 'Lanjutan';
    default: return difficulty.charAt(0) + difficulty.slice(1).toLowerCase();
  }
};

const formatTime = (minutes: number): string => {
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}.${Math.round(mins / 6)} jam` : `${hours} jam`;
};

const getDifficultyColor = (difficulty: string): 'success' | 'warning' | 'error' => {
  switch (difficulty) {
    case 'BEGINNER': return 'success';
    case 'INTERMEDIATE': return 'warning';
    case 'ADVANCED': return 'error';
    default: return 'success';
  }
};

// ============================================================================
// Components
// ============================================================================

function WelcomeBanner({ 
  completedLabs, 
  totalLabs, 
  overallProgress,
  userName,
}: { 
  completedLabs: number; 
  totalLabs: number; 
  overallProgress: number;
  userName: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#088395]/20 via-[#09637E]/15 to-[#7AB2B2]/10 border border-[#088395]/30 p-6 mb-6"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#088395]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#7AB2B2]/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              Selamat datang, {userName}! 
              <span className="text-3xl">👋</span>
            </h2>
            <p className="text-[var(--color-muted-foreground)] max-w-xl">
              {completedLabs < totalLabs 
                ? `Kamu sudah menyelesaikan ${completedLabs} dari ${totalLabs} lab. Terus lanjutkan untuk membuka lebih banyak pencapaian!`
                : 'Luar biasa! Kamu sudah menyelesaikan semua lab! 🎉'
              }
            </p>
          </div>
          
          {/* Circular Progress */}
          <div className="hidden md:block">
            <CircularProgress
              value={overallProgress}
              size={100}
              strokeWidth={8}
              color="primary"
              showLabel
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-[#088395]">{overallProgress}%</div>
                <div className="text-xs text-[var(--color-muted-foreground)]">Selesai</div>
              </div>
            </CircularProgress>
          </div>
        </div>
        
        {/* Progress Bar for mobile */}
        <div className="mt-6 md:hidden">
          <ProgressBar
            value={overallProgress}
            max={100}
            color="primary"
            showLabel
            animate
          />
        </div>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 mt-6">
          <Link
            href="/dashboard/student/labs"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#088395] hover:bg-[#09637E] text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-[#088395]/20"
          >
            <Play className="w-4 h-4" />
            Lanjutkan Belajar
          </Link>
          <Link
            href="/dashboard/student/achievements"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-white rounded-xl text-sm font-medium transition-colors border border-[var(--color-border)]"
          >
            <Trophy className="w-4 h-4" />
            Lihat Pencapaian
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function LabCard({ lab }: { lab: Lab }) {
  const status = getLabStatus(lab);
  const progress = getProgressPercent(lab);
  const IconComponent = labIcons[lab.icon] || Network;

  return (
    <motion.div
      variants={item}
      whileHover={{ y: -4 }}
      className={cn(
        "group rounded-2xl border p-5 transition-all duration-300",
        status === 'locked'
          ? "border-[var(--color-border)] bg-[var(--color-surface-1)]/30 opacity-60"
          : "border-[var(--color-border)] bg-[var(--color-surface-1)] hover:border-[#088395]/50 hover:shadow-lg hover:shadow-[#088395]/5"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-[var(--color-muted-foreground)]">
              Lab #{lab.number.toString().padStart(2, '0')}
            </span>
            <StatusBadge
              status={getDifficultyColor(lab.difficulty)}
              size="sm"
              label={formatDifficulty(lab.difficulty)}
            />
          </div>
          <h3 className="font-semibold text-white mb-1 truncate group-hover:text-[#088395] transition-colors">
            {lab.title}
          </h3>
          <p className="text-xs text-[var(--color-muted-foreground)] line-clamp-2">
            {lab.description}
          </p>
        </div>
        
        <div className="ml-3 flex-shrink-0">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
            status === 'completed' 
              ? "bg-emerald-500/10" 
              : status === 'in-progress'
                ? "bg-amber-500/10"
                : status === 'locked'
                  ? "bg-[var(--color-surface-2)]"
                  : "bg-[#088395]/10 group-hover:bg-[#088395]/20"
          )}>
            {status === 'completed' ? (
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            ) : status === 'in-progress' ? (
              <Play className="h-5 w-5 text-amber-400" />
            ) : status === 'locked' ? (
              <Lock className="h-5 w-5 text-[var(--color-muted-foreground)]" />
            ) : (
              <IconComponent className="h-5 w-5 text-[#088395]" />
            )}
          </div>
        </div>
      </div>

      {status !== 'locked' ? (
        <>
          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-[var(--color-muted-foreground)]">
                {lab.progress?.tasksCompleted || 0} / {lab.totalTasks} tugas
              </span>
              <span className={cn(
                "font-medium",
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
          
          {/* Action Button */}
          <Link
            href={`/labs/${lab.id}`}
            className={cn(
              "flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium transition-all",
              status === 'completed'
                ? "bg-[var(--color-surface-2)] text-[var(--color-foreground)] hover:bg-[var(--color-surface-3)]"
                : "bg-[#088395] text-white hover:bg-[#09637E]"
            )}
          >
            {status === 'completed' ? (
              <>Tinjau Lab</>
            ) : (
              <>
                <Play className="h-4 w-4" />
                {progress > 0 ? 'Lanjutkan' : 'Mulai Lab'}
              </>
            )}
          </Link>
        </>
      ) : (
        <div className="flex items-center gap-2 mt-3 p-3 rounded-xl bg-[var(--color-surface-2)]">
          <Lock className="h-4 w-4 text-[var(--color-muted-foreground)]" />
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Selesaikan Lab {lab.number - 1} terlebih dahulu
          </p>
        </div>
      )}
    </motion.div>
  );
}

function AchievementCard({ 
  achievement, 
  isUnlocked 
}: { 
  achievement: Achievement | { title: string; description: string; icon: typeof Star }; 
  isUnlocked: boolean;
}) {
  const IconComponent = 'icon' in achievement 
    ? (typeof achievement.icon === 'string' ? achievementIcons[achievement.icon] : achievement.icon) || Star
    : Star;

  return (
    <motion.div
      variants={item}
      whileHover={{ scale: 1.02 }}
      className={cn(
        "relative rounded-2xl border p-5 text-center transition-all",
        isUnlocked
          ? "border-[var(--color-border)] bg-[var(--color-surface-1)] hover:border-amber-500/30"
          : "border-[var(--color-border)]/50 bg-[var(--color-surface-1)]/30 opacity-60"
      )}
    >
      {isUnlocked && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        </div>
      )}
      
      <div className={cn(
        "mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-all",
        isUnlocked
          ? "bg-gradient-to-br from-amber-500/20 to-orange-600/20 shadow-lg shadow-amber-500/10"
          : "bg-[var(--color-surface-2)]"
      )}>
        <IconComponent className={cn(
          "h-7 w-7 transition-colors",
          isUnlocked ? "text-amber-400" : "text-[var(--color-muted-foreground)]"
        )} />
      </div>
      
      <h3 className={cn(
        "font-semibold mb-1 transition-colors",
        isUnlocked ? "text-white" : "text-[var(--color-muted-foreground)]"
      )}>
        {achievement.title}
      </h3>
      <p className="text-xs text-[var(--color-muted-foreground)] line-clamp-2">
        {achievement.description}
      </p>
    </motion.div>
  );
}

function UpcomingDeadlines() {
  const deadlines = [
    { id: 1, title: 'Lab 3: Konfigurasi Router Dasar', dueDate: '2 hari lagi', urgent: true },
    { id: 2, title: 'Lab 5: Konfigurasi Switch & VLAN', dueDate: '5 hari lagi', urgent: false },
  ];

  if (deadlines.length === 0) return null;

  return (
    <motion.div
      variants={item}
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#088395]" />
          Deadline Mendatang
        </h3>
        <Link 
          href="/dashboard/student/schedule" 
          className="text-xs text-[#088395] hover:text-[#7AB2B2] transition-colors"
        >
          Lihat semua
        </Link>
      </div>
      
      <div className="space-y-3">
        {deadlines.map((deadline) => (
          <div 
            key={deadline.id}
            className={cn(
              "flex items-center justify-between p-3 rounded-xl",
              deadline.urgent 
                ? "bg-rose-500/10 border border-rose-500/20" 
                : "bg-[var(--color-surface-2)]"
            )}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{deadline.title}</p>
              <p className={cn(
                "text-xs",
                deadline.urgent ? "text-rose-400" : "text-[var(--color-muted-foreground)]"
              )}>
                {deadline.dueDate}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--color-muted-foreground)]" />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function QuickStats({ stats }: { stats: { streak: number; rank: number; totalStudents: number; xp: number } }) {
  return (
    <motion.div
      variants={item}
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5"
    >
      <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
        <Zap className="w-5 h-5 text-amber-400" />
        Statistik Cepat
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Flame className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Streak</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Hari berturut-turut</p>
            </div>
          </div>
          <span className="text-2xl font-bold text-amber-400">{stats.streak}</span>
        </div>
        
        <div className="h-px bg-[var(--color-border)]" />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#088395]/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#088395]" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Peringkat</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Dari {stats.totalStudents} siswa</p>
            </div>
          </div>
          <span className="text-2xl font-bold text-[#088395]">#{stats.rank}</span>
        </div>

        <div className="h-px bg-[var(--color-border)]" />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Total XP</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Experience Points</p>
            </div>
          </div>
          <span className="text-2xl font-bold text-emerald-400">{stats.xp.toLocaleString()}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function StudentDashboard() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Siswa');
  const [stats, setStats] = useState({
    completedLabs: 0,
    totalLabs: 8,
    unlockedAchievements: 0,
    totalAchievements: 10,
    totalTimeMinutes: 0,
    streak: 5,
    rank: 12,
    totalStudents: 45,
    xp: 1250,
  });

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch user info
        const userRes = await fetch('/api/auth/me');
        const userData = await userRes.json();
        if (userData.user) {
          setUserName(userData.user.name.split(' ')[0]);
        }

        // Mock progress data for demo
        const mockProgress: Record<string, LabProgress> = {
          'lab-1': { startedAt: '2026-01-15', completedAt: '2026-01-16', currentScore: 95, tasksCompleted: 5 },
          'lab-2': { startedAt: '2026-01-18', completedAt: '2026-01-20', currentScore: 88, tasksCompleted: 6 },
          'lab-3': { startedAt: '2026-01-22', completedAt: null, currentScore: 60, tasksCompleted: 4 },
        };

        // Build labs with progress
        const labsWithProgress: Lab[] = FIXED_LABS.map((lab, index) => {
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

        // Calculate stats
        const completed = labsWithProgress.filter(l => l.progress?.completedAt).length;
        const totalTime = labsWithProgress.reduce((acc, l) => {
          if (l.progress) {
            return acc + l.durationMinutes;
          }
          return acc;
        }, 0);

        setStats(prev => ({
          ...prev,
          completedLabs: completed,
          totalTimeMinutes: totalTime,
        }));

        // Mock achievements
        const mockAchievements: Achievement[] = [
          { id: '1', title: 'Langkah Pertama', description: 'Selesaikan lab pertamamu', icon: 'star', unlockedAt: '2026-01-16' },
          { id: '2', title: 'Cepat Belajar', description: 'Selesaikan 2 lab dalam seminggu', icon: 'flame', unlockedAt: '2026-01-20' },
          { id: '3', title: 'Ahli Keamanan', description: 'Selesaikan semua lab', icon: 'shield', unlockedAt: null },
          { id: '4', title: 'Nilai Sempurna', description: 'Dapatkan 100% di lab manapun', icon: 'target', unlockedAt: null },
        ];

        setAchievements(mockAchievements);
        const unlocked = mockAchievements.filter(a => a.unlockedAt).length;
        setStats(prev => ({
          ...prev,
          unlockedAchievements: unlocked,
          totalAchievements: mockAchievements.length,
        }));

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const overallProgress = stats.totalLabs > 0
    ? Math.round((stats.completedLabs / stats.totalLabs) * 100)
    : 0;

  if (loading) {
    return (
      <div className="p-6">
        <SkeletonDashboard />
      </div>
    );
  }

  // Get first 4 labs for display
  const displayLabs = labs.slice(0, 4);
  const displayAchievements = achievements.slice(0, 4);

  const defaultAchievements = [
    { title: 'Langkah Pertama', description: 'Selesaikan lab pertamamu', icon: Star },
    { title: 'Cepat Belajar', description: 'Selesaikan 3 lab dalam seminggu', icon: Flame },
    { title: 'Ahli Keamanan', description: 'Selesaikan semua lab', icon: Shield },
    { title: 'Nilai Sempurna', description: 'Dapatkan 100% di lab manapun', icon: Target },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <WelcomeBanner
        completedLabs={stats.completedLabs}
        totalLabs={stats.totalLabs}
        overallProgress={overallProgress}
        userName={userName}
      />

      {/* Stats Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6"
      >
        <motion.div variants={item}>
          <StatCard
            title="Lab Selesai"
            value={`${stats.completedLabs}/${stats.totalLabs}`}
            icon={<BookOpen className="w-5 h-5" />}
            color="primary"
            trend={stats.completedLabs > 0 ? { value: stats.completedLabs, direction: 'up' } : undefined}
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard
            title="Pencapaian"
            value={`${stats.unlockedAchievements}/${stats.totalAchievements}`}
            icon={<Trophy className="w-5 h-5" />}
            color="success"
            trend={stats.unlockedAchievements > 0 ? { value: stats.unlockedAchievements, direction: 'up' } : undefined}
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard
            title="Waktu Belajar"
            value={formatTime(stats.totalTimeMinutes)}
            icon={<Clock className="w-5 h-5" />}
            color="info"
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard
            title="Streak Harian"
            value={`${stats.streak} hari`}
            icon={<Flame className="w-5 h-5" />}
            color="warning"
            trend={stats.streak > 0 ? { value: stats.streak, direction: 'up' } : undefined}
          />
        </motion.div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Labs Section - 2 columns */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#088395]" />
              Lanjutkan Belajar
            </h2>
            <Link 
              href="/dashboard/student/labs" 
              className="text-sm text-[#088395] hover:text-[#7AB2B2] flex items-center gap-1 transition-colors"
            >
              Lihat semua <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          {displayLabs.length > 0 ? (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid gap-4 sm:grid-cols-2"
            >
              {displayLabs.map((lab) => (
                <LabCard key={lab.id} lab={lab} />
              ))}
            </motion.div>
          ) : (
            <EmptyState
              type="no-data"
              title="Belum Ada Lab"
              description="Lab praktikum akan segera tersedia. Tunggu pengumuman dari koordinator."
            />
          )}
        </div>

        {/* Sidebar - 1 column */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          <QuickStats stats={{ streak: stats.streak, rank: stats.rank, totalStudents: stats.totalStudents, xp: stats.xp }} />
          <UpcomingDeadlines />
        </motion.div>
      </div>

      {/* Achievements Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Pencapaian Terbaru
          </h2>
          <Link 
            href="/dashboard/student/achievements" 
            className="text-sm text-[#088395] hover:text-[#7AB2B2] flex items-center gap-1 transition-colors"
          >
            Lihat semua <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {displayAchievements.length > 0 ? (
            displayAchievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                isUnlocked={!!achievement.unlockedAt}
              />
            ))
          ) : (
            defaultAchievements.map((achievement, i) => (
              <AchievementCard
                key={i}
                achievement={achievement}
                isUnlocked={false}
              />
            ))
          )}
        </motion.div>
      </div>

      {/* Learning Path Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8 p-5 rounded-2xl bg-gradient-to-br from-[#088395]/10 to-[#09637E]/10 border border-[#088395]/20"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-[#088395]" />
          Progress Learning Path
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          {labs.map((lab, index) => {
            const status = getLabStatus(lab);
            return (
              <div key={lab.id} className="flex items-center">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all",
                  status === 'completed' 
                    ? "bg-emerald-500 text-white" 
                    : status === 'in-progress'
                      ? "bg-amber-500 text-white animate-pulse"
                      : status === 'locked'
                        ? "bg-zinc-700 text-zinc-500"
                        : "bg-[#088395] text-white"
                )}>
                  {lab.number}
                </div>
                {index < labs.length - 1 && (
                  <div className={cn(
                    "w-6 h-1 mx-1 rounded",
                    status === 'completed' ? "bg-emerald-500" : "bg-zinc-700"
                  )} />
                )}
              </div>
            );
          })}
        </div>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-4">
          Selesaikan semua 8 lab untuk mendapatkan sertifikat &ldquo;Network Security Specialist&rdquo;
        </p>
      </motion.div>
    </div>
  );
}
