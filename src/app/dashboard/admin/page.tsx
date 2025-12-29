'use client';

import { cn } from '@/lib/utils';
import {
  Users,
  BookOpen,
  GraduationCap,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Plus,
  Settings,
  BarChart3,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalLabs: number;
  completedLabs: number;
  avgScore: number;
  activeToday: number;
}

interface RecentActivity {
  id: string;
  user: string;
  action: string;
  lab: string;
  time: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalStudents: 0,
    totalLabs: 0,
    completedLabs: 0,
    avgScore: 0,
    activeToday: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/stats');
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
          setRecentActivity(data.recentActivity || []);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const statCards = [
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'cyan',
      href: '/dashboard/admin/users',
    },
    {
      label: 'Students',
      value: stats.totalStudents,
      icon: GraduationCap,
      color: 'emerald',
      href: '/dashboard/admin/students',
    },
    {
      label: 'Active Labs',
      value: stats.totalLabs,
      icon: BookOpen,
      color: 'violet',
      href: '/dashboard/admin/labs',
    },
    {
      label: 'Avg. Score',
      value: `${stats.avgScore}%`,
      icon: TrendingUp,
      color: 'amber',
      href: '/dashboard/admin/analytics',
    },
  ];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-zinc-400">Welcome back! Here's an overview of your platform.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-cyan-500/30 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={cn(
                  'p-2 rounded-lg',
                  stat.color === 'cyan' && 'bg-cyan-500/10',
                  stat.color === 'emerald' && 'bg-emerald-500/10',
                  stat.color === 'violet' && 'bg-violet-500/10',
                  stat.color === 'amber' && 'bg-amber-500/10'
                )}
              >
                <stat.icon
                  className={cn(
                    'h-5 w-5',
                    stat.color === 'cyan' && 'text-cyan-400',
                    stat.color === 'emerald' && 'text-emerald-400',
                    stat.color === 'violet' && 'text-violet-400',
                    stat.color === 'amber' && 'text-amber-400'
                  )}
                />
              </div>
              <ArrowUpRight className="h-4 w-4 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
            </div>
            <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
            <p className="text-sm text-zinc-400">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            <Link
              href="/dashboard/admin/reports"
              className="text-sm text-cyan-400 hover:text-cyan-300"
            >
              View all
            </Link>
          </div>
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.slice(0, 5).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 p-3 rounded-xl bg-zinc-800/50"
                >
                  <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {activity.user.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">
                      <span className="font-medium">{activity.user}</span>{' '}
                      {activity.action}
                    </p>
                    <p className="text-xs text-zinc-500">{activity.lab}</p>
                  </div>
                  <span className="text-xs text-zinc-500">{activity.time}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400">No recent activity</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Quick Actions</h2>
          <div className="grid gap-4">
            <Link
              href="/dashboard/admin/users"
              className="flex items-center gap-4 p-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
            >
              <div className="p-3 rounded-lg bg-cyan-500/10">
                <Users className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <p className="font-medium text-white">Manage Users</p>
                <p className="text-sm text-zinc-400">Add, edit, or remove users</p>
              </div>
            </Link>
            <Link
              href="/dashboard/admin/labs"
              className="flex items-center gap-4 p-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
            >
              <div className="p-3 rounded-lg bg-violet-500/10">
                <BookOpen className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <p className="font-medium text-white">Manage Labs</p>
                <p className="text-sm text-zinc-400">Configure labs and answers</p>
              </div>
            </Link>
            <Link
              href="/dashboard/admin/students"
              className="flex items-center gap-4 p-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
            >
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <GraduationCap className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-white">Student Progress</p>
                <p className="text-sm text-zinc-400">View student lab progress</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
