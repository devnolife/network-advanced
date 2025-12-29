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
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

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
  progress: {
    startedAt: string;
    completedAt: string | null;
    currentScore: number;
    tasksCompleted: number;
  } | null;
}

export default function StudentLabsPage() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  // Fetch labs
  const fetchData = useCallback(async () => {
    try {
      const labsRes = await fetch('/api/labs');
      const labsData = await labsRes.json();
      if (labsData.success && labsData.labs) {
        setLabs(labsData.labs);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Determine lab status
  const getLabStatus = (lab: Lab): 'completed' | 'in-progress' | 'available' | 'locked' => {
    if (lab.isLocked) return 'locked';
    if (lab.progress?.completedAt) return 'completed';
    if (lab.progress?.startedAt) return 'in-progress';
    return 'available';
  };

  // Get progress percentage
  const getProgressPercent = (lab: Lab): number => {
    if (lab.isLocked) return 0;
    if (!lab.progress) return 0;
    if (lab.progress.completedAt) return 100;
    return Math.round((lab.progress.tasksCompleted / lab.totalTasks) * 100);
  };

  // Format difficulty
  const formatDifficulty = (diff: string): string => {
    return diff.charAt(0) + diff.slice(1).toLowerCase();
  };

  // Get prerequisite lab name
  const getPrerequisiteName = (prerequisiteId: string | null): string => {
    if (!prerequisiteId) return '';
    const prereqLab = labs.find((l) => l.id === prerequisiteId);
    return prereqLab ? prereqLab.title : '';
  };

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
      if (formatDifficulty(lab.difficulty) !== filterDifficulty) return false;
    }

    return true;
  });

  // Status badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'in-progress':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'available':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'locked':
        return 'bg-zinc-700/30 text-zinc-500 border-zinc-600/30';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30';
    }
  };

  // Status icons
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-emerald-400" />;
      case 'in-progress':
        return <Play className="h-5 w-5 text-yellow-400" />;
      case 'locked':
        return <Lock className="h-5 w-5 text-zinc-500" />;
      default:
        return <BookOpen className="h-5 w-5 text-cyan-400" />;
    }
  };

  // Difficulty badge
  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'Beginner':
        return 'bg-emerald-500/10 text-emerald-400';
      case 'Intermediate':
        return 'bg-amber-500/10 text-amber-400';
      case 'Advanced':
        return 'bg-red-500/10 text-red-400';
      default:
        return 'bg-zinc-500/10 text-zinc-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/20">
            <BookOpen className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">My Labs</h1>
            <p className="text-sm text-zinc-500">Browse and continue your learning journey</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700">
          <Zap className="h-4 w-4 text-yellow-400" />
          <span className="text-sm font-medium">1,250 XP</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search labs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none pl-4 pr-10 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all cursor-pointer"
            aria-label="Filter by status"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="locked">Locked</option>
          </select>
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
        </div>

        {/* Difficulty Filter */}
        <div className="relative">
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="appearance-none pl-4 pr-10 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all cursor-pointer"
          >
            <option value="all">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <BookOpen className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{labs.length}</p>
              <p className="text-xs text-zinc-500">Total Labs</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{labs.filter(l => getLabStatus(l) === 'completed').length}</p>
              <p className="text-xs text-zinc-500">Completed</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Play className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{labs.filter(l => getLabStatus(l) === 'in-progress').length}</p>
              <p className="text-xs text-zinc-500">In Progress</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-zinc-500/10">
              <Lock className="h-5 w-5 text-zinc-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{labs.filter(l => getLabStatus(l) === 'locked').length}</p>
              <p className="text-xs text-zinc-500">Locked</p>
            </div>
          </div>
        </div>
      </div>

      {/* Labs Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredLabs.map((lab) => {
          const status = getLabStatus(lab);
          const progress = getProgressPercent(lab);
          const tasksCompleted = lab.progress?.tasksCompleted || 0;
          const isLocked = status === 'locked';

          return (
            <div
              key={lab.id}
              className={cn(
                "group relative rounded-2xl border bg-zinc-900 overflow-hidden transition-all duration-300",
                isLocked
                  ? "border-zinc-800 opacity-60"
                  : "border-zinc-800 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/5"
              )}
            >
              {/* Locked Overlay */}
              {isLocked && (
                <div className="absolute inset-0 bg-zinc-900/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                  <div className="text-center p-4">
                    <Lock className="h-10 w-10 text-zinc-500 mx-auto mb-3" />
                    <p className="text-sm text-zinc-400 font-medium">Lab Terkunci</p>
                    <p className="text-xs text-zinc-500 mt-1">{lab.lockedReason || 'Selesaikan lab sebelumnya'}</p>
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(status)}
                    <span className={cn(
                      "text-xs font-medium px-2.5 py-1 rounded-full border",
                      getStatusBadge(status)
                    )}>
                      {status === 'in-progress' ? 'In Progress' :
                        status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </div>
                  <span className={cn(
                    "text-xs font-medium px-2.5 py-1 rounded-full",
                    getDifficultyBadge(formatDifficulty(lab.difficulty))
                  )}>
                    {formatDifficulty(lab.difficulty)}
                  </span>
                </div>

                <h3 className={cn(
                  "text-lg font-semibold mb-2 transition-colors",
                  isLocked ? "text-zinc-500" : "text-white group-hover:text-cyan-400"
                )}>
                  {lab.title}
                </h3>
                <p className={cn(
                  "text-sm line-clamp-2 mb-4",
                  isLocked ? "text-zinc-600" : "text-zinc-400"
                )}>
                  {lab.description}
                </p>

                {/* Meta Info */}
                <div className={cn(
                  "flex items-center gap-4 text-sm",
                  isLocked ? "text-zinc-600" : "text-zinc-500"
                )}>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {lab.durationMinutes} min
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Target className="h-4 w-4" />
                    {tasksCompleted}/{lab.totalTasks} tasks
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="px-6 pb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className={isLocked ? "text-zinc-600" : "text-zinc-500"}>Progress</span>
                  <span className={cn(
                    "font-medium",
                    isLocked ? "text-zinc-600" : "text-cyan-400"
                  )}>{progress}%</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      isLocked ? "bg-zinc-700" : "bg-linear-to-r from-cyan-500 to-blue-500"
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Action Button */}
              <div className="px-6 pb-6">
                {isLocked ? (
                  <div className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-800/50 text-zinc-600 border border-zinc-800 cursor-not-allowed">
                    <Lock className="h-4 w-4" />
                    Terkunci
                  </div>
                ) : status === 'completed' ? (
                  <Link
                    href={`/labs/${lab.id}`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Review Lab
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : status === 'in-progress' ? (
                  <Link
                    href={`/labs/${lab.id}`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 text-white font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
                  >
                    <Play className="h-4 w-4" />
                    Continue Lab
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <Link
                    href={`/labs/${lab.id}`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-800 text-zinc-100 border border-zinc-700 hover:bg-zinc-700 hover:border-cyan-500/50 transition-all"
                  >
                    <ArrowRight className="h-4 w-4" />
                    Start Lab
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredLabs.length === 0 && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 mb-4">
            <Search className="h-8 w-8 text-zinc-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No labs found</h3>
          <p className="text-zinc-400 mb-6">Try adjusting your search or filter criteria</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterStatus('all');
              setFilterDifficulty('all');
            }}
            className="px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-all"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
