'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  BookOpen,
  Trophy,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  TrendingUp,
  Award,
} from 'lucide-react';

interface StudentStats {
  completedLabs: number;
  inProgressLabs: number;
  totalLabs: number;
  totalScore: number;
  maxPossibleScore: number;
  avgScore: number;
  grade: string;
}

interface LabProgress {
  labId: string;
  labNumber: number;
  labTitle: string;
  maxScore: number;
  startedAt: string;
  completedAt: string | null;
  currentScore: number;
  tasksCompleted: number;
  submission: {
    finalScore: number;
    grade: string;
    submittedAt: string;
  } | null;
}

interface Student {
  id: string;
  username: string;
  name: string;
  createdAt: string;
  stats: StudentStats;
  labProgress: LabProgress[];
}

interface OverallStats {
  totalStudents: number;
  totalCompletions: number;
  avgCompletionRate: number;
  avgScore: number;
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'completions'>('name');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/students');
      const data = await res.json();

      if (data.success) {
        setStudents(data.students);
        setStats(data.stats);
      } else {
        setError(data.error);
      }
    } catch {
      setError('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort students
  const filteredStudents = students
    .filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.username.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGrade =
        filterGrade === 'all' || student.stats.grade === filterGrade;
      return matchesSearch && matchesGrade;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.stats.avgScore - a.stats.avgScore;
        case 'completions':
          return b.stats.completedLabs - a.stats.completedLabs;
        default:
          return a.name.localeCompare(b.name);
      }
    });

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Memuat siswa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          <Link href="/dashboard/admin" className="btn btn-primary">
            Kembali ke Dasbor
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/admin"
                className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20">
                  <GraduationCap className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold">Progres Siswa</h1>
                  <p className="text-xs text-zinc-500">Pantau aktivitas lab siswa</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Stats */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-lg bg-cyan-500/20">
                  <Users className="w-5 h-5 text-cyan-400" />
                </div>
                <span className="text-sm text-zinc-400">Total Siswa</span>
              </div>
              <p className="text-3xl font-bold">{stats.totalStudents}</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-sm text-zinc-400">Lab Selesai</span>
              </div>
              <p className="text-3xl font-bold">{stats.totalCompletions}</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-lg bg-violet-500/20">
                  <TrendingUp className="w-5 h-5 text-violet-400" />
                </div>
                <span className="text-sm text-zinc-400">Rata-rata Penyelesaian</span>
              </div>
              <p className="text-3xl font-bold">{stats.avgCompletionRate}%</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-lg bg-amber-500/20">
                  <Trophy className="w-5 h-5 text-amber-400" />
                </div>
                <span className="text-sm text-zinc-400">Rata-rata Nilai</span>
              </div>
              <p className="text-3xl font-bold">{stats.avgScore}%</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama atau username..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>

            {/* Grade Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-zinc-500" />
              <select
                value={filterGrade}
                onChange={(e) => {
                  setFilterGrade(e.target.value);
                  setCurrentPage(1);
                }}
                title="Filter by Grade"
                className="px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                <option value="all">Semua Nilai</option>
                <option value="A">Nilai A</option>
                <option value="B">Nilai B</option>
                <option value="C">Nilai C</option>
                <option value="D">Nilai D</option>
                <option value="F">Nilai F</option>
              </select>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              title="Sort Students"
              className="px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <option value="name">Urutkan Nama</option>
              <option value="score">Urutkan Nilai</option>
              <option value="completions">Urutkan Penyelesaian</option>
            </select>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-800/50">
                  <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400">
                    Siswa
                  </th>
                  <th className="text-center px-4 py-4 text-sm font-medium text-zinc-400">
                    Progres Lab
                  </th>
                  <th className="text-center px-4 py-4 text-sm font-medium text-zinc-400">
                    Rata-rata Nilai
                  </th>
                  <th className="text-center px-4 py-4 text-sm font-medium text-zinc-400">
                    Nilai
                  </th>
                  <th className="text-center px-4 py-4 text-sm font-medium text-zinc-400">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                      Siswa tidak ditemukan
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="border-b border-zinc-800 hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-sm text-zinc-500">@{student.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-emerald-400">
                              {student.stats.completedLabs} selesai
                            </span>
                            <span className="text-zinc-600">•</span>
                            <span className="text-amber-400">
                              {student.stats.inProgressLabs} sedang berjalan
                            </span>
                          </div>
                          <div className="w-32 h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                              style={{
                                width: `${(student.stats.completedLabs / student.stats.totalLabs) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-zinc-500">
                            {student.stats.completedLabs}/{student.stats.totalLabs} lab
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-lg font-semibold">
                          {student.stats.avgScore}%
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-lg font-bold ${getGradeColor(student.stats.grade)}`}
                        >
                          {student.stats.grade}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Link
                          href={`/dashboard/admin/students/${student.id}`}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          Lihat Detail
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800">
              <p className="text-sm text-zinc-500">
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} sampai{' '}
                {Math.min(currentPage * itemsPerPage, filteredStudents.length)} dari{' '}
                {filteredStudents.length} siswa
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  title="Previous Page"
                  className="p-2 rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium ${page === currentPage
                      ? 'bg-cyan-500 text-white'
                      : 'hover:bg-zinc-800'
                      }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  title="Next Page"
                  className="p-2 rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
