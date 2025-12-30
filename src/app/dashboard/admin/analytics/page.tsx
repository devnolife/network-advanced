'use client';

import { cn } from '@/lib/utils';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  Clock,
  Target,
  Calendar,
  Award,
  Loader2,
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface AnalyticsData {
  overview: {
    totalStudents: number;
    activeStudents: number;
    completionRate: number;
    avgScore: number;
    totalTimeSpent: number;
    labsCompleted: number;
  };
  labStats: {
    labId: string;
    labNumber: number;
    title: string;
    enrollments: number;
    completions: number;
    avgScore: number;
    avgTimeMinutes: number;
  }[];
  weeklyActivity: {
    day: string;
    submissions: number;
    completions: number;
  }[];
  topPerformers: {
    id: string;
    name: string;
    username: string;
    completedLabs: number;
    avgScore: number;
  }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`/api/admin/analytics?range=${timeRange}`);
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  const overview = data?.overview || {
    totalStudents: 0,
    activeStudents: 0,
    completionRate: 0,
    avgScore: 0,
    totalTimeSpent: 0,
    labsCompleted: 0,
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Analitik</h1>
          <p className="text-zinc-400">Performa platform dan wawasan siswa</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTimeRange('week')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              timeRange === 'week'
                ? "bg-cyan-500 text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-white"
            )}
          >
            Minggu
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              timeRange === 'month'
                ? "bg-cyan-500 text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-white"
            )}
          >
            Bulan
          </button>
          <button
            onClick={() => setTimeRange('all')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              timeRange === 'all'
                ? "bg-cyan-500 text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-white"
            )}
          >
            Semua Waktu
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-cyan-400" />
            <span className="text-xs text-zinc-500">Total Siswa</span>
          </div>
          <p className="text-2xl font-bold text-white">{overview.totalStudents}</p>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-zinc-500">Aktif</span>
          </div>
          <p className="text-2xl font-bold text-white">{overview.activeStudents}</p>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-violet-400" />
            <span className="text-xs text-zinc-500">Tingkat Penyelesaian</span>
          </div>
          <p className="text-2xl font-bold text-white">{overview.completionRate}%</p>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-zinc-500">Rata-rata Nilai</span>
          </div>
          <p className="text-2xl font-bold text-white">{overview.avgScore}%</p>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-blue-400" />
            <span className="text-xs text-zinc-500">Waktu Belajar</span>
          </div>
          <p className="text-2xl font-bold text-white">{Math.round(overview.totalTimeSpent / 60)}h</p>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-4 w-4 text-pink-400" />
            <span className="text-xs text-zinc-500">Lab Selesai</span>
          </div>
          <p className="text-2xl font-bold text-white">{overview.labsCompleted}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Weekly Activity */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Aktivitas Mingguan</h2>
          <div className="space-y-4">
            {(data?.weeklyActivity || []).map((day) => (
              <div key={day.day} className="flex items-center gap-4">
                <span className="text-sm text-zinc-400 w-12">{day.day}</span>
                <div className="flex-1 flex gap-2">
                  <div className="flex-1 h-6 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full"
                      style={{ width: `${Math.min((day.submissions / 20) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm text-zinc-400 w-16 text-right">
                  {day.submissions} kirim
                </span>
              </div>
            ))}
            {(!data?.weeklyActivity || data.weeklyActivity.length === 0) && (
              <div className="text-center py-8 text-zinc-500">
                Tidak ada data aktivitas tersedia
              </div>
            )}
          </div>
        </div>

        {/* Top Performers */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Siswa Terbaik</h2>
          <div className="space-y-4">
            {(data?.topPerformers || []).slice(0, 5).map((student, index) => (
              <div key={student.id} className="flex items-center gap-4 p-3 rounded-xl bg-zinc-800/50">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                  index === 0 ? "bg-amber-500/20 text-amber-400" :
                    index === 1 ? "bg-zinc-400/20 text-zinc-300" :
                      index === 2 ? "bg-orange-500/20 text-orange-400" :
                        "bg-zinc-700 text-zinc-400"
                )}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">{student.name}</p>
                  <p className="text-xs text-zinc-500">@{student.username}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-cyan-400">{student.avgScore}%</p>
                  <p className="text-xs text-zinc-500">{student.completedLabs} lab</p>
                </div>
              </div>
            ))}
            {(!data?.topPerformers || data.topPerformers.length === 0) && (
              <div className="text-center py-8 text-zinc-500">
                Tidak ada data siswa tersedia
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lab Performance */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-6">Performa Lab</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Lab</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Pendaftaran</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Penyelesaian</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Rata-rata Nilai</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Rata-rata Waktu</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Tingkat Penyelesaian</th>
              </tr>
            </thead>
            <tbody>
              {(data?.labStats || []).map((lab) => (
                <tr key={lab.labId} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-zinc-500" />
                      <span className="text-white">Lab {lab.labNumber}</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">{lab.title}</p>
                  </td>
                  <td className="py-3 px-4 text-zinc-300">{lab.enrollments}</td>
                  <td className="py-3 px-4 text-zinc-300">{lab.completions}</td>
                  <td className="py-3 px-4">
                    <span className={cn(
                      "font-medium",
                      lab.avgScore >= 80 ? "text-emerald-400" :
                        lab.avgScore >= 60 ? "text-amber-400" : "text-red-400"
                    )}>
                      {lab.avgScore}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-zinc-300">{lab.avgTimeMinutes} min</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-500 rounded-full"
                          style={{ width: `${lab.enrollments > 0 ? (lab.completions / lab.enrollments) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-400">
                        {lab.enrollments > 0 ? Math.round((lab.completions / lab.enrollments) * 100) : 0}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!data?.labStats || data.labStats.length === 0) && (
            <div className="text-center py-12 text-zinc-500">
              Tidak ada data lab tersedia
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
