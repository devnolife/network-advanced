'use client';

import { cn } from '@/lib/utils';
import {
  Trophy,
  Medal,
  Crown,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  Flame,
  Target,
  Award,
  ChevronUp,
  ChevronDown,
  Search,
  Filter,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Avatar,
  AvatarGroup,
  SearchInput,
  Skeleton,
  SkeletonTable,
  EmptyState,
  StatusBadge,
  ProgressBar,
  Dropdown,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
} from '@/components/ui';

// ============================================================================
// Types
// ============================================================================

interface LeaderboardEntry {
  id: string;
  rank: number;
  previousRank: number;
  name: string;
  avatar?: string;
  nim: string;
  score: number;
  labsCompleted: number;
  totalLabs: number;
  streak: number;
  achievements: number;
  lastActive: string;
  isCurrentUser?: boolean;
}

type TimeFilter = 'all-time' | 'this-week' | 'this-month';
type SortBy = 'score' | 'labs' | 'streak' | 'achievements';

// ============================================================================
// Mock Data
// ============================================================================

const mockLeaderboard: LeaderboardEntry[] = [
  {
    id: '1',
    rank: 1,
    previousRank: 1,
    name: 'Ahmad Rizki',
    nim: '2021001',
    score: 2850,
    labsCompleted: 11,
    totalLabs: 11,
    streak: 15,
    achievements: 8,
    lastActive: '2 jam lalu',
  },
  {
    id: '2',
    rank: 2,
    previousRank: 3,
    name: 'Siti Nurhaliza',
    nim: '2021002',
    score: 2720,
    labsCompleted: 10,
    totalLabs: 11,
    streak: 12,
    achievements: 7,
    lastActive: '1 jam lalu',
  },
  {
    id: '3',
    rank: 3,
    previousRank: 2,
    name: 'Budi Santoso',
    nim: '2021003',
    score: 2680,
    labsCompleted: 10,
    totalLabs: 11,
    streak: 8,
    achievements: 6,
    lastActive: '30 menit lalu',
  },
  {
    id: '4',
    rank: 4,
    previousRank: 4,
    name: 'Dewi Lestari',
    nim: '2021004',
    score: 2540,
    labsCompleted: 9,
    totalLabs: 11,
    streak: 10,
    achievements: 6,
    lastActive: '3 jam lalu',
  },
  {
    id: '5',
    rank: 5,
    previousRank: 7,
    name: 'Eko Prasetyo',
    nim: '2021005',
    score: 2420,
    labsCompleted: 9,
    totalLabs: 11,
    streak: 5,
    achievements: 5,
    lastActive: '1 hari lalu',
    isCurrentUser: true,
  },
  {
    id: '6',
    rank: 6,
    previousRank: 5,
    name: 'Fitri Handayani',
    nim: '2021006',
    score: 2380,
    labsCompleted: 8,
    totalLabs: 11,
    streak: 7,
    achievements: 5,
    lastActive: '5 jam lalu',
  },
  {
    id: '7',
    rank: 7,
    previousRank: 6,
    name: 'Gunawan Wijaya',
    nim: '2021007',
    score: 2250,
    labsCompleted: 8,
    totalLabs: 11,
    streak: 3,
    achievements: 4,
    lastActive: '2 hari lalu',
  },
  {
    id: '8',
    rank: 8,
    previousRank: 9,
    name: 'Hana Permata',
    nim: '2021008',
    score: 2180,
    labsCompleted: 7,
    totalLabs: 11,
    streak: 6,
    achievements: 4,
    lastActive: '4 jam lalu',
  },
  {
    id: '9',
    rank: 9,
    previousRank: 8,
    name: 'Irfan Maulana',
    nim: '2021009',
    score: 2050,
    labsCompleted: 7,
    totalLabs: 11,
    streak: 2,
    achievements: 3,
    lastActive: '1 minggu lalu',
  },
  {
    id: '10',
    rank: 10,
    previousRank: 10,
    name: 'Julia Rahayu',
    nim: '2021010',
    score: 1920,
    labsCompleted: 6,
    totalLabs: 11,
    streak: 4,
    achievements: 3,
    lastActive: '3 hari lalu',
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

const getRankChange = (current: number, previous: number) => {
  if (current < previous) return { direction: 'up', change: previous - current };
  if (current > previous) return { direction: 'down', change: current - previous };
  return { direction: 'same', change: 0 };
};

const getRankBadge = (rank: number) => {
  switch (rank) {
    case 1:
      return { icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    case 2:
      return { icon: Medal, color: 'text-gray-300', bg: 'bg-gray-500/20' };
    case 3:
      return { icon: Medal, color: 'text-amber-600', bg: 'bg-amber-600/20' };
    default:
      return null;
  }
};

// ============================================================================
// Components
// ============================================================================

function TopThreePodium({ entries }: { entries: LeaderboardEntry[] }) {
  const [first, second, third] = entries;
  
  return (
    <div className="flex items-end justify-center gap-4 mb-8">
      {/* 2nd Place */}
      {second && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center"
        >
          <Avatar
            fallback={second.name}
            src={second.avatar}
            size="lg"
            className="mb-2 ring-2 ring-gray-400"
          />
          <div className="w-24 h-20 bg-gradient-to-t from-gray-600/30 to-gray-500/20 rounded-t-xl flex flex-col items-center justify-center border border-gray-500/30">
            <Medal className="w-6 h-6 text-gray-300 mb-1" />
            <span className="text-2xl font-bold text-gray-300">2</span>
          </div>
          <div className="text-center mt-2">
            <p className="text-sm font-semibold text-white truncate max-w-[100px]">{second.name}</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">{second.score} pts</p>
          </div>
        </motion.div>
      )}

      {/* 1st Place */}
      {first && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center -mb-4"
        >
          <div className="relative">
            <Avatar
              fallback={first.name}
              src={first.avatar}
              size="xl"
              className="mb-2 ring-4 ring-yellow-400"
            />
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/30">
              <Crown className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="w-28 h-28 bg-gradient-to-t from-yellow-600/30 to-yellow-500/20 rounded-t-xl flex flex-col items-center justify-center border border-yellow-500/30">
            <Trophy className="w-8 h-8 text-yellow-400 mb-1" />
            <span className="text-3xl font-bold text-yellow-400">1</span>
          </div>
          <div className="text-center mt-2">
            <p className="text-sm font-semibold text-white truncate max-w-[120px]">{first.name}</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">{first.score} pts</p>
          </div>
        </motion.div>
      )}

      {/* 3rd Place */}
      {third && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center"
        >
          <Avatar
            fallback={third.name}
            src={third.avatar}
            size="lg"
            className="mb-2 ring-2 ring-amber-600"
          />
          <div className="w-24 h-16 bg-gradient-to-t from-amber-700/30 to-amber-600/20 rounded-t-xl flex flex-col items-center justify-center border border-amber-600/30">
            <Medal className="w-5 h-5 text-amber-600 mb-1" />
            <span className="text-xl font-bold text-amber-600">3</span>
          </div>
          <div className="text-center mt-2">
            <p className="text-sm font-semibold text-white truncate max-w-[100px]">{third.name}</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">{third.score} pts</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function LeaderboardRow({ entry, index }: { entry: LeaderboardEntry; index: number }) {
  const rankBadge = getRankBadge(entry.rank);
  const rankChange = getRankChange(entry.rank, entry.previousRank);
  const progressPercent = Math.round((entry.labsCompleted / entry.totalLabs) * 100);

  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "border-b border-[var(--color-border)] transition-colors",
        entry.isCurrentUser
          ? "bg-[#088395]/10 hover:bg-[#088395]/15"
          : "hover:bg-[var(--color-surface-hover)]"
      )}
    >
      {/* Rank */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          {rankBadge ? (
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", rankBadge.bg)}>
              <rankBadge.icon className={cn("w-5 h-5", rankBadge.color)} />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-2)] flex items-center justify-center">
              <span className="text-sm font-bold text-[var(--color-muted-foreground)]">{entry.rank}</span>
            </div>
          )}
          
          {/* Rank change indicator */}
          {rankChange.direction === 'up' && (
            <div className="flex items-center text-emerald-400">
              <ChevronUp className="w-4 h-4" />
              <span className="text-xs">{rankChange.change}</span>
            </div>
          )}
          {rankChange.direction === 'down' && (
            <div className="flex items-center text-red-400">
              <ChevronDown className="w-4 h-4" />
              <span className="text-xs">{rankChange.change}</span>
            </div>
          )}
          {rankChange.direction === 'same' && (
            <Minus className="w-4 h-4 text-[var(--color-muted-foreground)]" />
          )}
        </div>
      </td>

      {/* User */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <Avatar
            fallback={entry.name}
            src={entry.avatar}
            size="sm"
            status={entry.isCurrentUser ? "online" : "none"}
          />
          <div>
            <p className={cn(
              "font-medium",
              entry.isCurrentUser ? "text-[#088395]" : "text-white"
            )}>
              {entry.name}
              {entry.isCurrentUser && <span className="ml-2 text-xs text-[#088395]">(Kamu)</span>}
            </p>
            <p className="text-xs text-[var(--color-muted-foreground)]">{entry.nim}</p>
          </div>
        </div>
      </td>

      {/* Score */}
      <td className="py-4 px-4">
        <span className="text-lg font-bold text-[#088395]">{entry.score.toLocaleString()}</span>
        <span className="text-xs text-[var(--color-muted-foreground)] ml-1">pts</span>
      </td>

      {/* Labs Progress */}
      <td className="py-4 px-4">
        <div className="w-32">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[var(--color-muted-foreground)]">
              {entry.labsCompleted}/{entry.totalLabs}
            </span>
            <span className="font-medium text-[#088395]">{progressPercent}%</span>
          </div>
          <ProgressBar
            value={progressPercent}
            max={100}
            size="sm"
            color={progressPercent === 100 ? 'success' : 'primary'}
          />
        </div>
      </td>

      {/* Streak */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-1.5">
          <Flame className={cn(
            "w-4 h-4",
            entry.streak >= 7 ? "text-amber-400" : "text-[var(--color-muted-foreground)]"
          )} />
          <span className={cn(
            "font-medium",
            entry.streak >= 7 ? "text-amber-400" : "text-white"
          )}>
            {entry.streak}
          </span>
        </div>
      </td>

      {/* Achievements */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-1.5">
          <Award className="w-4 h-4 text-violet-400" />
          <span className="font-medium text-white">{entry.achievements}</span>
        </div>
      </td>

      {/* Last Active */}
      <td className="py-4 px-4">
        <span className="text-sm text-[var(--color-muted-foreground)]">{entry.lastActive}</span>
      </td>
    </motion.tr>
  );
}

function UserRankCard({ entry }: { entry: LeaderboardEntry }) {
  const rankChange = getRankChange(entry.rank, entry.previousRank);
  const progressPercent = Math.round((entry.labsCompleted / entry.totalLabs) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[#088395]/30 bg-gradient-to-br from-[#088395]/10 to-transparent p-6 mb-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar
              fallback={entry.name}
              src={entry.avatar}
              size="lg"
              status="online"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#088395] flex items-center justify-center text-xs font-bold text-white">
              #{entry.rank}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{entry.name}</h3>
            <p className="text-sm text-[var(--color-muted-foreground)]">{entry.nim}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Rank Change */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              {rankChange.direction === 'up' && (
                <>
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  <span className="text-lg font-bold text-emerald-400">+{rankChange.change}</span>
                </>
              )}
              {rankChange.direction === 'down' && (
                <>
                  <TrendingDown className="w-5 h-5 text-red-400" />
                  <span className="text-lg font-bold text-red-400">-{rankChange.change}</span>
                </>
              )}
              {rankChange.direction === 'same' && (
                <span className="text-lg font-bold text-[var(--color-muted-foreground)]">-</span>
              )}
            </div>
            <p className="text-xs text-[var(--color-muted-foreground)]">Perubahan</p>
          </div>

          {/* Score */}
          <div className="text-center">
            <p className="text-2xl font-bold text-[#088395]">{entry.score.toLocaleString()}</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">Total Skor</p>
          </div>

          {/* Progress */}
          <div className="w-32">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[var(--color-muted-foreground)]">Lab Progress</span>
              <span className="font-medium text-[#088395]">{progressPercent}%</span>
            </div>
          <ProgressBar
            value={progressPercent}
            max={100}
            size="md"
            color="primary"
            animate
          />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all-time');
  const [sortBy, setSortBy] = useState<SortBy>('score');

  useEffect(() => {
    // Simulate API fetch
    const timer = setTimeout(() => {
      setEntries(mockLeaderboard);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Filter and sort entries
  const filteredEntries = entries
    .filter(entry => 
      entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.nim.includes(searchQuery)
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'labs':
          return b.labsCompleted - a.labsCompleted;
        case 'streak':
          return b.streak - a.streak;
        case 'achievements':
          return b.achievements - a.achievements;
        default:
          return b.score - a.score;
      }
    });

  const currentUser = entries.find(e => e.isCurrentUser);
  const topThree = filteredEntries.slice(0, 3);

  const timeFilterLabels: Record<TimeFilter, string> = {
    'all-time': 'Sepanjang Waktu',
    'this-week': 'Minggu Ini',
    'this-month': 'Bulan Ini',
  };

  const sortByLabels: Record<SortBy, string> = {
    score: 'Skor',
    labs: 'Lab Selesai',
    streak: 'Streak',
    achievements: 'Pencapaian',
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-48 w-full mb-8 rounded-2xl" />
        <SkeletonTable rows={10} columns={7} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
          <Trophy className="w-7 h-7 text-amber-400" />
          Papan Peringkat
        </h1>
        <p className="text-[var(--color-muted-foreground)]">
          Lihat peringkat dan bandingkan progresmu dengan mahasiswa lainnya
        </p>
      </div>

      {/* Current User Rank Card */}
      {currentUser && <UserRankCard entry={currentUser} />}

      {/* Top 3 Podium */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-6 text-center">🏆 Top 3 Mahasiswa</h2>
        <TopThreePodium entries={topThree} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Cari nama atau NIM..."
          className="w-64"
        />
        
        <div className="flex items-center gap-3">
          {/* Time Filter */}
          <Dropdown
            trigger={
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm text-white hover:bg-[var(--color-surface-3)] transition-colors">
                <Filter className="w-4 h-4" />
                {timeFilterLabels[timeFilter]}
              </button>
            }
          >
            <DropdownLabel>Periode Waktu</DropdownLabel>
            {(Object.keys(timeFilterLabels) as TimeFilter[]).map((key) => (
              <DropdownItem
                key={key}
                onClick={() => setTimeFilter(key)}
                selected={timeFilter === key}
              >
                {timeFilterLabels[key]}
              </DropdownItem>
            ))}
          </Dropdown>

          {/* Sort By */}
          <Dropdown
            trigger={
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm text-white hover:bg-[var(--color-surface-3)] transition-colors">
                Urutkan: {sortByLabels[sortBy]}
              </button>
            }
          >
            <DropdownLabel>Urutkan Berdasarkan</DropdownLabel>
            {(Object.keys(sortByLabels) as SortBy[]).map((key) => (
              <DropdownItem
                key={key}
                onClick={() => setSortBy(key)}
                selected={sortBy === key}
              >
                {sortByLabels[key]}
              </DropdownItem>
            ))}
          </Dropdown>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)] overflow-hidden">
        {filteredEntries.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
                <th className="py-3 px-4 text-left text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider">
                  Peringkat
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider">
                  Mahasiswa
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider">
                  Skor
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider">
                  Progress Lab
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider">
                  Streak
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider">
                  Pencapaian
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider">
                  Terakhir Aktif
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry, index) => (
                <LeaderboardRow key={entry.id} entry={entry} index={index} />
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState
            type="no-results"
            title="Tidak Ada Hasil"
            description="Tidak ditemukan mahasiswa dengan kriteria pencarian tersebut."
            className="py-12"
          />
        )}
      </div>
    </div>
  );
}
