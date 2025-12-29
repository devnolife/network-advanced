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
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Lab {
  id: string;
  number: number;
  title: string;
  description: string;
  difficulty: string;
  durationMinutes: number;
  totalTasks: number;
  isLocked: boolean;
  lockedReason: string | null;
  progress: {
    startedAt: string;
    completedAt: string | null;
    currentScore: number;
    tasksCompleted: number;
  } | null;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
}

const achievementIcons: Record<string, typeof Star> = {
  star: Star,
  flame: Flame,
  shield: Shield,
  target: Target,
  trophy: Trophy,
};

export default function StudentDashboard() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    completedLabs: 0,
    totalLabs: 0,
    unlockedAchievements: 0,
    totalAchievements: 0,
    totalTimeMinutes: 0,
    streak: 0,
  });

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch labs
        const labsRes = await fetch('/api/labs');
        const labsData = await labsRes.json();

        if (labsData.success) {
          setLabs(labsData.labs);

          // Calculate stats from labs
          const completed = labsData.labs.filter((l: Lab) => l.progress?.completedAt).length;
          const totalTime = labsData.labs.reduce((acc: number, l: Lab) => {
            if (l.progress) {
              return acc + l.durationMinutes;
            }
            return acc;
          }, 0);

          setStats(prev => ({
            ...prev,
            completedLabs: completed,
            totalLabs: labsData.labs.length,
            totalTimeMinutes: totalTime,
          }));
        }

        // Fetch achievements
        const achievementsRes = await fetch('/api/achievements');
        const achievementsData = await achievementsRes.json();

        if (achievementsData.success) {
          setAchievements(achievementsData.achievements || []);
          const unlocked = (achievementsData.achievements || []).filter((a: Achievement) => a.unlockedAt).length;
          setStats(prev => ({
            ...prev,
            unlockedAchievements: unlocked,
            totalAchievements: achievementsData.achievements?.length || 10,
          }));
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

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
    return difficulty.charAt(0) + difficulty.slice(1).toLowerCase();
  };

  const overallProgress = stats.totalLabs > 0
    ? Math.round((stats.completedLabs / stats.totalLabs) * 100)
    : 0;

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}.${Math.round(mins / 6)} hrs` : `${hours} hrs`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  // Get first 4 labs for display
  const displayLabs = labs.slice(0, 4);
  // Get first 4 achievements for display
  const displayAchievements = achievements.slice(0, 4);

  return (
    <div className="p-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-linear-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          Welcome back! 👋
        </h2>
        <p className="text-zinc-300">
          You've completed {stats.completedLabs} of {stats.totalLabs} labs. {stats.completedLabs < stats.totalLabs ? 'Keep going to unlock more achievements!' : 'Amazing! You\'ve completed all labs!'}
        </p>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
          <span className="text-sm text-zinc-400">{overallProgress}% complete</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <BookOpen className="h-5 w-5 text-cyan-400" />
            </div>
            <span className="text-sm text-zinc-400">Labs Completed</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.completedLabs} / {stats.totalLabs}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Trophy className="h-5 w-5 text-emerald-400" />
            </div>
            <span className="text-sm text-zinc-400">Achievements</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.unlockedAchievements} / {stats.totalAchievements}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-violet-500/10">
              <Clock className="h-5 w-5 text-violet-400" />
            </div>
            <span className="text-sm text-zinc-400">Time Spent</span>
          </div>
          <p className="text-3xl font-bold text-white">{formatTime(stats.totalTimeMinutes)}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Flame className="h-5 w-5 text-amber-400" />
            </div>
            <span className="text-sm text-zinc-400">Streak</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.streak} days</p>
        </div>
      </div>

      {/* Continue Learning */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Continue Learning</h2>
          <Link href="/dashboard/student/labs" className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {displayLabs.map((lab) => {
            const status = getLabStatus(lab);
            const progress = getProgressPercent(lab);

            return (
              <div
                key={lab.id}
                className={cn(
                  "rounded-2xl border p-5 transition-all",
                  status === 'locked'
                    ? "border-zinc-800 bg-zinc-900/30 opacity-60"
                    : "border-zinc-800 bg-zinc-900/50 hover:border-cyan-500/30"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white mb-1">{lab.title}</h3>
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      lab.difficulty === 'BEGINNER' && "bg-emerald-500/10 text-emerald-400",
                      lab.difficulty === 'INTERMEDIATE' && "bg-amber-500/10 text-amber-400",
                      lab.difficulty === 'ADVANCED' && "bg-red-500/10 text-red-400"
                    )}>
                      {formatDifficulty(lab.difficulty)}
                    </span>
                  </div>
                  {status === 'completed' && (
                    <CheckCircle className="h-6 w-6 text-emerald-400" />
                  )}
                  {status === 'locked' && (
                    <Lock className="h-6 w-6 text-zinc-600" />
                  )}
                </div>

                {status !== 'locked' ? (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-cyan-500 to-blue-600 rounded-full"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-zinc-400">{progress}%</span>
                    </div>
                    <Link
                      href={`/labs/${lab.id}`}
                      className={cn(
                        "flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium transition-all",
                        status === 'completed'
                          ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                          : "bg-cyan-500 text-white hover:bg-cyan-400"
                      )}
                    >
                      {status === 'completed' ? (
                        <>Review Lab</>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          {progress > 0 ? 'Continue' : 'Start Lab'}
                        </>
                      )}
                    </Link>
                  </>
                ) : (
                  <p className="text-xs text-zinc-500 mt-2">{lab.lockedReason || 'Complete previous lab to unlock'}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Achievements</h2>
          <Link href="/dashboard/student/achievements" className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {displayAchievements.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {displayAchievements.map((achievement) => {
              const IconComponent = achievementIcons[achievement.icon] || Star;
              const isUnlocked = !!achievement.unlockedAt;

              return (
                <div
                  key={achievement.id}
                  className={cn(
                    "rounded-2xl border p-5 text-center",
                    isUnlocked
                      ? "border-zinc-800 bg-zinc-900/50"
                      : "border-zinc-800/50 bg-zinc-900/20 opacity-50"
                  )}
                >
                  <div className={cn(
                    "mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3",
                    isUnlocked
                      ? "bg-linear-to-br from-amber-500/20 to-orange-600/20"
                      : "bg-zinc-800"
                  )}>
                    <IconComponent className={cn(
                      "h-6 w-6",
                      isUnlocked ? "text-amber-400" : "text-zinc-600"
                    )} />
                  </div>
                  <h3 className={cn(
                    "font-semibold mb-1",
                    isUnlocked ? "text-white" : "text-zinc-500"
                  )}>
                    {achievement.title}
                  </h3>
                  <p className="text-xs text-zinc-500">{achievement.description}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Default achievements if no data */}
            {[
              { title: 'First Steps', description: 'Complete your first lab', icon: Star, unlocked: false },
              { title: 'Quick Learner', description: 'Complete 3 labs in a week', icon: Flame, unlocked: false },
              { title: 'Security Expert', description: 'Complete all labs', icon: Shield, unlocked: false },
              { title: 'Perfect Score', description: 'Get 100% on any lab', icon: Target, unlocked: false },
            ].map((achievement, i) => (
              <div
                key={i}
                className="rounded-2xl border border-zinc-800/50 bg-zinc-900/20 opacity-50 p-5 text-center"
              >
                <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-zinc-800">
                  <achievement.icon className="h-6 w-6 text-zinc-600" />
                </div>
                <h3 className="font-semibold mb-1 text-zinc-500">{achievement.title}</h3>
                <p className="text-xs text-zinc-500">{achievement.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
