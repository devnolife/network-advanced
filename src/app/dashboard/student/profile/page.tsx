'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  User,
  Mail,
  Calendar,
  BookOpen,
  Trophy,
  Target,
  Star,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Award,
  Activity,
  Edit3,
} from 'lucide-react';

interface UserProfile {
  id: string;
  username: string;
  name: string;
  role: string;
  createdAt: string;
}

interface UserStats {
  labsCompleted: number;
  totalLabs: number;
  tasksCompleted: number;
  totalTasks: number;
  totalScore: number;
  avgPercentage: number;
  achievementsUnlocked: number;
  totalAchievements: number;
  grade: string;
}

interface LabHistory {
  id: string;
  title: string;
  status: 'completed' | 'in-progress' | 'not-started';
  score: number;
  maxScore: number;
  grade: string | null;
  completedAt: string | null;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [labHistory, setLabHistory] = useState<LabHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);

      // Fetch user profile
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();

      if (!userData.user) {
        throw new Error('Not authenticated');
      }

      setProfile(userData.user);

      // Fetch labs for stats
      const labsRes = await fetch('/api/labs');
      const labsData = await labsRes.json();

      if (labsData.success) {
        const labs = labsData.labs || [];
        const completed = labs.filter((l: { status: string }) => l.status === 'completed');
        const totalScore = labs.reduce((sum: number, l: { progress?: { currentScore?: number } }) =>
          sum + (l.progress?.currentScore || 0), 0);
        const tasksCompleted = labs.reduce((sum: number, l: { progress?: { tasksCompleted?: number } }) =>
          sum + (l.progress?.tasksCompleted || 0), 0);
        const totalTasks = labs.reduce((sum: number, l: { totalTasks?: number }) =>
          sum + (l.totalTasks || 0), 0);
        const avgPercentage = completed.length > 0
          ? Math.round(completed.reduce((sum: number, l: { progress?: { percentage?: number } }) =>
            sum + (l.progress?.percentage || 0), 0) / completed.length)
          : 0;

        const getGrade = (pct: number) => {
          if (pct >= 90) return 'A';
          if (pct >= 80) return 'B';
          if (pct >= 70) return 'C';
          if (pct >= 60) return 'D';
          return 'F';
        };

        setStats({
          labsCompleted: completed.length,
          totalLabs: labs.length,
          tasksCompleted,
          totalTasks,
          totalScore,
          avgPercentage,
          achievementsUnlocked: 0, // Would need achievements API
          totalAchievements: 12,
          grade: getGrade(avgPercentage),
        });

        setLabHistory(labs.map((l: {
          id: string;
          title: string;
          status: string;
          maxScore: number;
          progress?: {
            currentScore?: number;
            completedAt?: string;
          };
        }) => ({
          id: l.id,
          title: l.title,
          status: l.status,
          score: l.progress?.currentScore || 0,
          maxScore: l.maxScore,
          grade: l.status === 'completed' ? getGrade(
            Math.round(((l.progress?.currentScore || 0) / l.maxScore) * 100)
          ) : null,
          completedAt: l.progress?.completedAt || null,
        })));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A':
        return 'text-emerald-400 bg-emerald-500/20';
      case 'B':
        return 'text-blue-400 bg-blue-500/20';
      case 'C':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'D':
        return 'text-orange-400 bg-orange-500/20';
      default:
        return 'text-red-400 bg-red-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-emerald-400 bg-emerald-500/20';
      case 'in-progress':
        return 'text-amber-400 bg-amber-500/20';
      default:
        return 'text-zinc-400 bg-zinc-500/20';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Memuat profil...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error || 'Profil tidak ditemukan'}</p>
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
          <div className="p-2 rounded-lg bg-cyan-500/20">
            <User className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Profil Saya</h1>
            <p className="text-sm text-zinc-500">Lihat informasimu</p>
          </div>
        </div>
        <Link
          href="/dashboard/student/settings"
          className="flex items-center gap-2 px-3 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors text-sm"
        >
          <Edit3 className="w-4 h-4" />
          Edit Profil
        </Link>
      </div>

      <div className="max-w-4xl">
        {/* Profile Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-4xl font-bold text-white">
              {profile.name.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold mb-1">{profile.name}</h2>
              <p className="text-zinc-400 mb-4">@{profile.username}</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm">
                <div className="flex items-center gap-2 text-zinc-400">
                  <User className="w-4 h-4" />
                  <span className="capitalize">{profile.role.toLowerCase()}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-400">
                  <Calendar className="w-4 h-4" />
                  <span>Bergabung {formatDate(profile.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Grade Badge */}
            {stats && (
              <div className="text-center">
                <div
                  className={`w-20 h-20 rounded-xl flex items-center justify-center text-3xl font-bold ${getGradeColor(stats.grade)}`}
                >
                  {stats.grade}
                </div>
                <p className="text-xs text-zinc-500 mt-2">Nilai Keseluruhan</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <BookOpen className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <p className="text-2xl font-bold">
                {stats.labsCompleted}
                <span className="text-sm text-zinc-500 font-normal">/{stats.totalLabs}</span>
              </p>
              <p className="text-xs text-zinc-500">Lab Selesai</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Target className="w-5 h-5 text-blue-400" />
                </div>
              </div>
              <p className="text-2xl font-bold">
                {stats.tasksCompleted}
                <span className="text-sm text-zinc-500 font-normal">/{stats.totalTasks}</span>
              </p>
              <p className="text-xs text-zinc-500">Tugas Selesai</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <Star className="w-5 h-5 text-amber-400" />
                </div>
              </div>
              <p className="text-2xl font-bold">{stats.totalScore}</p>
              <p className="text-xs text-zinc-500">Total Poin</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-violet-500/20">
                  <TrendingUp className="w-5 h-5 text-violet-400" />
                </div>
              </div>
              <p className="text-2xl font-bold">{stats.avgPercentage}%</p>
              <p className="text-xs text-zinc-500">Rata-rata Nilai</p>
            </div>
          </div>
        )}

        {/* Progress Overview */}
        {stats && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Ringkasan Progres
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-400">Penyelesaian Lab</span>
                  <span className="text-sm font-medium">
                    {Math.round((stats.labsCompleted / stats.totalLabs) * 100) || 0}%
                  </span>
                </div>
                <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                    style={{
                      width: `${(stats.labsCompleted / stats.totalLabs) * 100 || 0}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-400">Penyelesaian Tugas</span>
                  <span className="text-sm font-medium">
                    {Math.round((stats.tasksCompleted / stats.totalTasks) * 100) || 0}%
                  </span>
                </div>
                <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-violet-500"
                    style={{
                      width: `${(stats.tasksCompleted / stats.totalTasks) * 100 || 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lab History */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              Riwayat Lab
            </h3>
          </div>
          <div className="divide-y divide-zinc-800">
            {labHistory.length === 0 ? (
              <div className="px-6 py-12 text-center text-zinc-500">
                Belum ada lab yang dimulai
              </div>
            ) : (
              labHistory.map((lab) => (
                <div
                  key={lab.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${lab.status === 'completed'
                        ? 'bg-emerald-500/20'
                        : lab.status === 'in-progress'
                          ? 'bg-amber-500/20'
                          : 'bg-zinc-800'
                        }`}
                    >
                      {lab.status === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : lab.status === 'in-progress' ? (
                        <Clock className="w-5 h-5 text-amber-400" />
                      ) : (
                        <BookOpen className="w-5 h-5 text-zinc-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{lab.title}</p>
                      <p className="text-sm text-zinc-500">
                        {lab.status === 'completed' && lab.completedAt
                          ? `Selesai pada ${formatDate(lab.completedAt)}`
                          : lab.status === 'in-progress'
                            ? 'Sedang berjalan'
                            : 'Belum dimulai'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">
                        {lab.score}/{lab.maxScore}
                      </p>
                      <p className="text-xs text-zinc-500">Poin</p>
                    </div>
                    {lab.grade && (
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${getGradeColor(lab.grade)}`}
                      >
                        {lab.grade}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
