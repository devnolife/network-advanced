'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  Trophy,
  Star,
  Flame,
  Shield,
  Target,
  Zap,
  Award,
  BookOpen,
  Clock,
  CheckCircle2,
  Lock,
  Loader2,
  AlertCircle,
  Medal,
  Crown,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

interface UserStats {
  labsCompleted: number;
  totalLabs: number;
  tasksCompleted: number;
  totalScore: number;
  avgPercentage: number;
  hintsUsed: number;
  perfectScores: number;
  streak: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'progress' | 'performance' | 'special';
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
  maxProgress: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const achievementDefinitions: Achievement[] = [
  // Progress achievements
  {
    id: 'first-steps',
    title: 'Langkah Pertama',
    description: 'Selesaikan lab pertamamu',
    icon: 'Star',
    category: 'progress',
    unlocked: false,
    unlockedAt: null,
    progress: 0,
    maxProgress: 1,
    rarity: 'common',
  },
  {
    id: 'getting-started',
    title: 'Mulai Belajar',
    description: 'Selesaikan 3 lab',
    icon: 'BookOpen',
    category: 'progress',
    unlocked: false,
    unlockedAt: null,
    progress: 0,
    maxProgress: 3,
    rarity: 'common',
  },
  {
    id: 'lab-master',
    title: 'Master Lab',
    description: 'Selesaikan semua lab yang tersedia',
    icon: 'Trophy',
    category: 'progress',
    unlocked: false,
    unlockedAt: null,
    progress: 0,
    maxProgress: 10,
    rarity: 'legendary',
  },
  {
    id: 'task-hunter',
    title: 'Pemburu Tugas',
    description: 'Selesaikan 25 tugas',
    icon: 'Target',
    category: 'progress',
    unlocked: false,
    unlockedAt: null,
    progress: 0,
    maxProgress: 25,
    rarity: 'rare',
  },
  {
    id: 'dedicated-learner',
    title: 'Pelajar Tekun',
    description: 'Selesaikan 50 tugas',
    icon: 'Flame',
    category: 'progress',
    unlocked: false,
    unlockedAt: null,
    progress: 0,
    maxProgress: 50,
    rarity: 'epic',
  },
  // Performance achievements
  {
    id: 'perfect-score',
    title: 'Nilai Sempurna',
    description: 'Dapatkan 100% di lab manapun',
    icon: 'Medal',
    category: 'performance',
    unlocked: false,
    unlockedAt: null,
    progress: 0,
    maxProgress: 1,
    rarity: 'rare',
  },
  {
    id: 'excellence',
    title: 'Keunggulan',
    description: 'Raih nilai A di 3 lab',
    icon: 'Award',
    category: 'performance',
    unlocked: false,
    unlockedAt: null,
    progress: 0,
    maxProgress: 3,
    rarity: 'epic',
  },
  {
    id: 'no-hints-needed',
    title: 'Tanpa Petunjuk',
    description: 'Selesaikan lab tanpa menggunakan petunjuk',
    icon: 'Zap',
    category: 'performance',
    unlocked: false,
    unlockedAt: null,
    progress: 0,
    maxProgress: 1,
    rarity: 'rare',
  },
  {
    id: 'speed-demon',
    title: 'Kecepatan Kilat',
    description: 'Selesaikan lab dalam waktu kurang dari 30 menit',
    icon: 'Clock',
    category: 'performance',
    unlocked: false,
    unlockedAt: null,
    progress: 0,
    maxProgress: 1,
    rarity: 'epic',
  },
  // Special achievements
  {
    id: 'security-expert',
    title: 'Ahli Keamanan',
    description: 'Selesaikan semua lab terkait keamanan',
    icon: 'Shield',
    category: 'special',
    unlocked: false,
    unlockedAt: null,
    progress: 0,
    maxProgress: 5,
    rarity: 'legendary',
  },
  {
    id: 'rising-star',
    title: 'Bintang Naik',
    description: 'Kumpulkan 500 poin',
    icon: 'TrendingUp',
    category: 'special',
    unlocked: false,
    unlockedAt: null,
    progress: 0,
    maxProgress: 500,
    rarity: 'rare',
  },
  {
    id: 'champion',
    title: 'Juara',
    description: 'Kumpulkan 1000 poin',
    icon: 'Crown',
    category: 'special',
    unlocked: false,
    unlockedAt: null,
    progress: 0,
    maxProgress: 1000,
    rarity: 'legendary',
  },
];

const iconMap: Record<string, React.ElementType> = {
  Star,
  BookOpen,
  Trophy,
  Target,
  Flame,
  Medal,
  Award,
  Zap,
  Clock,
  Shield,
  TrendingUp,
  Crown,
  Sparkles,
};

export default function AchievementsPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | 'progress' | 'performance' | 'special'>('all');

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      setLoading(true);

      // Fetch user's lab progress to calculate achievements
      const res = await fetch('/api/labs');
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      // Calculate stats from lab progress
      const labs = data.labs || [];
      const completedLabs = labs.filter((l: { status: string }) => l.status === 'completed');
      const totalScore = labs.reduce((sum: number, l: { progress?: { currentScore?: number } }) =>
        sum + (l.progress?.currentScore || 0), 0);
      const tasksCompleted = labs.reduce((sum: number, l: { progress?: { tasksCompleted?: number } }) =>
        sum + (l.progress?.tasksCompleted || 0), 0);

      const userStats: UserStats = {
        labsCompleted: completedLabs.length,
        totalLabs: labs.length,
        tasksCompleted,
        totalScore,
        avgPercentage: completedLabs.length > 0
          ? Math.round(completedLabs.reduce((sum: number, l: { progress?: { percentage?: number } }) =>
            sum + (l.progress?.percentage || 0), 0) / completedLabs.length)
          : 0,
        hintsUsed: 0,
        perfectScores: completedLabs.filter((l: { progress?: { percentage?: number } }) =>
          l.progress?.percentage === 100).length,
        streak: 0,
      };

      setStats(userStats);

      // Calculate achievement progress
      const updatedAchievements = achievementDefinitions.map((achievement) => {
        let progress = 0;
        let unlocked = false;

        switch (achievement.id) {
          case 'first-steps':
            progress = Math.min(userStats.labsCompleted, 1);
            unlocked = progress >= 1;
            break;
          case 'getting-started':
            progress = Math.min(userStats.labsCompleted, 3);
            unlocked = progress >= 3;
            break;
          case 'lab-master':
            progress = userStats.labsCompleted;
            unlocked = progress >= userStats.totalLabs && userStats.totalLabs > 0;
            break;
          case 'task-hunter':
            progress = Math.min(userStats.tasksCompleted, 25);
            unlocked = progress >= 25;
            break;
          case 'dedicated-learner':
            progress = Math.min(userStats.tasksCompleted, 50);
            unlocked = progress >= 50;
            break;
          case 'perfect-score':
            progress = Math.min(userStats.perfectScores, 1);
            unlocked = progress >= 1;
            break;
          case 'excellence':
            progress = Math.min(userStats.perfectScores, 3);
            unlocked = progress >= 3;
            break;
          case 'rising-star':
            progress = Math.min(userStats.totalScore, 500);
            unlocked = progress >= 500;
            break;
          case 'champion':
            progress = Math.min(userStats.totalScore, 1000);
            unlocked = progress >= 1000;
            break;
          default:
            break;
        }

        return {
          ...achievement,
          progress,
          unlocked,
          unlockedAt: unlocked ? new Date().toISOString() : null,
        };
      });

      setAchievements(updatedAchievements);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'from-zinc-400 to-zinc-600';
      case 'rare':
        return 'from-blue-400 to-blue-600';
      case 'epic':
        return 'from-violet-400 to-purple-600';
      case 'legendary':
        return 'from-amber-400 to-orange-600';
      default:
        return 'from-zinc-400 to-zinc-600';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'border-zinc-600';
      case 'rare':
        return 'border-blue-500';
      case 'epic':
        return 'border-violet-500';
      case 'legendary':
        return 'border-amber-500';
      default:
        return 'border-zinc-600';
    }
  };

  const filteredAchievements = activeCategory === 'all'
    ? achievements
    : achievements.filter((a) => a.category === activeCategory);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Memuat pencapaian...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          <Link href="/dashboard/student" className="btn btn-primary">
            Kembali ke Dasbor
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20">
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Pencapaian</h1>
            <p className="text-sm text-zinc-500">Lacak progres dan pencapaianmu</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-amber-400">{unlockedCount}/{totalCount}</p>
          <p className="text-xs text-zinc-500">Terbuka</p>
        </div>
      </div>

      <div>
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
              <BookOpen className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.labsCompleted}</p>
              <p className="text-xs text-zinc-500">Lab Selesai</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
              <Target className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.tasksCompleted}</p>
              <p className="text-xs text-zinc-500">Tugas Selesai</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
              <Star className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.totalScore}</p>
              <p className="text-xs text-zinc-500">Total Poin</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
              <Medal className="w-6 h-6 text-violet-400 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.perfectScores}</p>
              <p className="text-xs text-zinc-500">Nilai Sempurna</p>
            </div>
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'progress', label: 'Progres' },
            { id: 'performance', label: 'Performa' },
            { id: 'special', label: 'Spesial' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as typeof activeCategory)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeCategory === cat.id
                ? 'bg-cyan-500 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map((achievement) => {
            const IconComponent = iconMap[achievement.icon] || Star;
            const progressPercentage = (achievement.progress / achievement.maxProgress) * 100;

            return (
              <div
                key={achievement.id}
                className={`relative bg-zinc-900 border rounded-xl p-5 transition-all ${achievement.unlocked
                  ? `${getRarityBorder(achievement.rarity)} shadow-lg`
                  : 'border-zinc-800 opacity-60'
                  }`}
              >
                {/* Rarity Badge */}
                <div
                  className={`absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-gradient-to-r ${getRarityColor(achievement.rarity)} text-white`}
                >
                  {achievement.rarity}
                </div>

                {/* Icon */}
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${achievement.unlocked
                    ? `bg-gradient-to-br ${getRarityColor(achievement.rarity)}`
                    : 'bg-zinc-800'
                    }`}
                >
                  {achievement.unlocked ? (
                    <IconComponent className="w-7 h-7 text-white" />
                  ) : (
                    <Lock className="w-6 h-6 text-zinc-500" />
                  )}
                </div>

                {/* Title & Description */}
                <h3 className="font-semibold text-white mb-1">{achievement.title}</h3>
                <p className="text-sm text-zinc-400 mb-4">{achievement.description}</p>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Progres</span>
                    <span className={achievement.unlocked ? 'text-emerald-400' : 'text-zinc-400'}>
                      {achievement.progress}/{achievement.maxProgress}
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${achievement.unlocked
                        ? `bg-gradient-to-r ${getRarityColor(achievement.rarity)}`
                        : 'bg-zinc-600'
                        }`}
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Unlocked Status */}
                {achievement.unlocked && (
                  <div className="flex items-center gap-2 mt-4 text-xs text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Terbuka!</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
