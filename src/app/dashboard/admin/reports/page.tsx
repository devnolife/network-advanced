'use client';

import { cn } from '@/lib/utils';
import {
  FileText,
  Search,
  Download,
  Calendar,
  Users,
  BookOpen,
  CheckCircle,
  Clock,
  TrendingUp,
  Filter,
  Loader2,
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface Report {
  id: string;
  studentName: string;
  studentUsername: string;
  labTitle: string;
  labNumber: number;
  status: 'completed' | 'in-progress' | 'not-started';
  score: number;
  maxScore: number;
  tasksCompleted: number;
  totalTasks: number;
  startedAt: string | null;
  completedAt: string | null;
}

interface ReportStats {
  totalSubmissions: number;
  completedLabs: number;
  avgScore: number;
  activeStudents: number;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<ReportStats>({
    totalSubmissions: 0,
    completedLabs: 0,
    avgScore: 0,
    activeStudents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterLab, setFilterLab] = useState<string>('all');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/admin/reports');
      const data = await res.json();
      if (data.success) {
        setReports(data.reports);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.studentUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.labTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    const matchesLab = filterLab === 'all' || report.labNumber.toString() === filterLab;
    return matchesSearch && matchesStatus && matchesLab;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-400';
      case 'in-progress':
        return 'bg-amber-500/10 text-amber-400';
      case 'not-started':
        return 'bg-zinc-500/10 text-zinc-400';
      default:
        return 'bg-zinc-500/10 text-zinc-400';
    }
  };

  const uniqueLabs = [...new Set(reports.map(r => r.labNumber))].sort((a, b) => a - b);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Reports</h1>
          <p className="text-zinc-400">View student progress and lab completion reports</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 text-white font-medium hover:bg-cyan-400 transition-colors">
          <Download className="h-5 w-5" />
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <FileText className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalSubmissions}</p>
              <p className="text-xs text-zinc-500">Total Progress</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.completedLabs}</p>
              <p className="text-xs text-zinc-500">Completed</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/10">
              <TrendingUp className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.avgScore}%</p>
              <p className="text-xs text-zinc-500">Avg Score</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Users className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.activeStudents}</p>
              <p className="text-xs text-zinc-500">Active Students</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by student or lab..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="in-progress">In Progress</option>
          <option value="not-started">Not Started</option>
        </select>
        <select
          value={filterLab}
          onChange={(e) => setFilterLab(e.target.value)}
          className="px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
        >
          <option value="all">All Labs</option>
          {uniqueLabs.map(num => (
            <option key={num} value={num.toString()}>Lab {num}</option>
          ))}
        </select>
      </div>

      {/* Reports Table */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-4 px-6 text-sm font-medium text-zinc-400">Student</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-zinc-400">Lab</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-zinc-400">Status</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-zinc-400">Progress</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-zinc-400">Score</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-zinc-400">Started</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-zinc-400">Completed</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr key={report.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {report.studentName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">{report.studentName}</p>
                        <p className="text-xs text-zinc-500">@{report.studentUsername}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-zinc-500" />
                      <span className="text-zinc-300">Lab {report.labNumber}</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">{report.labTitle}</p>
                  </td>
                  <td className="py-4 px-6">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium",
                      getStatusBadge(report.status)
                    )}>
                      {report.status === 'in-progress' ? 'In Progress' :
                        report.status.charAt(0).toUpperCase() + report.status.slice(1).replace('-', ' ')}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-500 rounded-full"
                          style={{ width: `${(report.tasksCompleted / report.totalTasks) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-400">
                        {report.tasksCompleted}/{report.totalTasks}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={cn(
                      "font-medium",
                      report.score >= report.maxScore * 0.8 ? "text-emerald-400" :
                        report.score >= report.maxScore * 0.5 ? "text-amber-400" : "text-zinc-400"
                    )}>
                      {report.score}/{report.maxScore}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-zinc-400 text-sm">
                    {report.startedAt ? new Date(report.startedAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="py-4 px-6 text-zinc-400 text-sm">
                    {report.completedAt ? new Date(report.completedAt).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400">No reports found</p>
          </div>
        )}
      </div>
    </div>
  );
}
