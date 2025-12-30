'use client';

import React, { useState } from 'react';
import {
  Shield,
  Network,
  Activity,
  Lock,
  FileCode,
  Wifi,
  Eye,
  Award,
  ChevronRight,
  Clock,
  BookOpen,
  Star,
  ArrowLeft,
  Trophy,
  Target,
  Zap,
  CheckCircle2,
  Play,
  Sparkles,
  GraduationCap,
  TrendingUp,
  Filter,
  LayoutGrid,
  List
} from 'lucide-react';

const labs = [
  {
    id: 1,
    title: 'Review Dasar Keamanan Jaringan',
    description: 'Pelajari konsep keamanan jaringan, siapkan lingkungan lab, dan konfigurasi perangkat dasar. Pelajari navigasi CLI, konfigurasi IP, dan pengujian konektivitas.',
    icon: Network,
    difficulty: 'Pemula',
    duration: '30 menit',
    topics: ['Konfigurasi IP', 'Dasar Routing', 'Navigasi CLI', 'Uji Konektivitas'],
    color: 'from-cyan-500 to-blue-500',
    bgGlow: 'bg-cyan-500/20',
    progress: 100,
    status: 'completed',
    xp: 100,
    tasks: 4
  },
  {
    id: 2,
    title: 'Analisis Keamanan Protokol TCP/IP',
    description: 'Pahami stack TCP/IP, tangkap dan analisis paket dengan penganalisis bawaan, dan identifikasi kerentanan keamanan dalam protokol.',
    icon: Activity,
    difficulty: 'Pemula',
    duration: '45 menit',
    topics: ['Handshake TCP', 'Header Paket', 'Analisis Protokol', 'Ekspor PCAP'],
    color: 'from-green-500 to-emerald-500',
    bgGlow: 'bg-green-500/20',
    progress: 100,
    status: 'completed',
    xp: 150,
    tasks: 5
  },
  {
    id: 3,
    title: 'Teknologi VPN - IPSec & SSL VPN',
    description: 'Konfigurasi VPN IPSec site-to-site dengan IKE Fase 1 dan Fase 2, atur crypto maps, dan verifikasi pembentukan tunnel.',
    icon: Lock,
    difficulty: 'Menengah',
    duration: '60 menit',
    topics: ['IKE Fase 1 & 2', 'Pre-Shared Keys', 'Crypto Maps', 'Enkripsi ESP'],
    color: 'from-purple-500 to-violet-500',
    bgGlow: 'bg-purple-500/20',
    progress: 45,
    status: 'in-progress',
    xp: 200,
    tasks: 6
  },
  {
    id: 4,
    title: 'Firewall Generasi Baru (NGFW)',
    description: 'Konfigurasi zona firewall, buat kebijakan keamanan, atur aturan NAT, dan implementasi filtering lapisan aplikasi.',
    icon: Shield,
    difficulty: 'Menengah',
    duration: '60 menit',
    topics: ['Zona Keamanan', 'Aturan Firewall', 'Konfigurasi NAT', 'Filtering Aplikasi'],
    color: 'from-orange-500 to-red-500',
    bgGlow: 'bg-orange-500/20',
    progress: 0,
    status: 'locked',
    xp: 200,
    tasks: 6
  },
  {
    id: 5,
    title: 'Access Control Lists (ACL) Lanjutan',
    description: 'Buat ACL standar dan extended, implementasi aturan filtering kompleks, dan optimalkan performa ACL.',
    icon: FileCode,
    difficulty: 'Menengah',
    duration: '45 menit',
    topics: ['ACL Standar', 'ACL Extended', 'ACL Berbasis Waktu', 'Troubleshooting ACL'],
    color: 'from-pink-500 to-rose-500',
    bgGlow: 'bg-pink-500/20',
    progress: 0,
    status: 'locked',
    xp: 175,
    tasks: 5
  },
  {
    id: 6,
    title: 'Keamanan Network Address Translation (NAT)',
    description: 'Konfigurasi NAT statis dan dinamis, implementasi PAT untuk address overloading, dan troubleshoot masalah NAT.',
    icon: Wifi,
    difficulty: 'Menengah',
    duration: '45 menit',
    topics: ['NAT Statis', 'Pool NAT Dinamis', 'PAT/Overload', 'Verifikasi Translasi'],
    color: 'from-amber-500 to-yellow-500',
    bgGlow: 'bg-amber-500/20',
    progress: 0,
    status: 'locked',
    xp: 175,
    tasks: 5
  },
  {
    id: 7,
    title: 'Intrusion Detection System (Snort)',
    description: 'Deploy sensor IDS, buat signature deteksi, analisis alert, dan tuning untuk false positives.',
    icon: Eye,
    difficulty: 'Lanjutan',
    duration: '60 menit',
    topics: ['Deployment IDS', 'Pembuatan Signature', 'Analisis Alert', 'Tuning False Positive'],
    color: 'from-teal-500 to-cyan-500',
    bgGlow: 'bg-teal-500/20',
    progress: 0,
    status: 'locked',
    xp: 250,
    tasks: 7
  },
  {
    id: 8,
    title: 'UTS - Implementasi Keamanan Jaringan',
    description: 'Desain topologi jaringan aman, implementasi berbagai kontrol keamanan, dan selesaikan audit keamanan komprehensif.',
    icon: Award,
    difficulty: 'Lanjutan',
    duration: '120 menit',
    topics: ['Desain Jaringan', 'Keamanan Multi-layer', 'VPN + Firewall + IDS', 'Dokumentasi'],
    color: 'from-indigo-500 to-purple-500',
    bgGlow: 'bg-indigo-500/20',
    progress: 0,
    status: 'locked',
    xp: 500,
    tasks: 10
  }
];

type ViewMode = 'grid' | 'list';
type FilterType = 'all' | 'completed' | 'in-progress' | 'locked';

export default function LabsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filter, setFilter] = useState<FilterType>('all');

  const completedLabs = labs.filter(l => l.status === 'completed').length;
  const inProgressLabs = labs.filter(l => l.status === 'in-progress').length;
  const totalXP = labs.filter(l => l.status === 'completed').reduce((sum, lab) => sum + lab.xp, 0);
  const overallProgress = Math.round(
    labs.reduce((sum, lab) => sum + lab.progress, 0) / labs.length
  );

  const filteredLabs = labs.filter(lab => {
    if (filter === 'all') return true;
    return lab.status === filter;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Pemula': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'Menengah': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'Lanjutan': return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      default: return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'in-progress': return <Play className="w-5 h-5 text-cyan-400" />;
      case 'locked': return <Lock className="w-5 h-5 text-zinc-500" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-950/80 border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-3 sm:gap-4">
              <a href="/" title="Back to Home" className="p-2 rounded-xl bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/50 transition-all duration-300 hover:scale-105">
                <ArrowLeft className="w-5 h-5 text-zinc-300" />
              </a>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
                  Modul Lab
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 hidden sm:block">Kuasai keamanan jaringan melalui praktik langsung</p>
              </div>
            </div>

            {/* Quick Stats - Hidden on mobile */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-white">{totalXP}</span>
                <span className="text-xs text-zinc-500">XP</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                <Target className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold text-white">{completedLabs}/8</span>
                <span className="text-xs text-zinc-500">Labs</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
        {/* Progress Hero Section */}
        <div className="mb-8 sm:mb-10">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border border-zinc-800/50 p-6 sm:p-8">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Main Progress */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
                    <GraduationCap className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">Progres Pembelajaran</h2>
                    <p className="text-xs sm:text-sm text-zinc-500">Perjalanan Anda menuju penguasaan keamanan jaringan</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-400">Penyelesaian Keseluruhan</span>
                    <span className="text-sm font-bold text-cyan-400">{overallProgress}%</span>
                  </div>
                  <div className="relative h-3 sm:h-4 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${overallProgress}%` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  <div className="text-center p-3 sm:p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xl sm:text-2xl font-bold text-emerald-400">{completedLabs}</span>
                    </div>
                    <span className="text-xs text-zinc-500">Selesai</span>
                  </div>
                  <div className="text-center p-3 sm:p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Zap className="w-4 h-4 text-cyan-400" />
                      <span className="text-xl sm:text-2xl font-bold text-cyan-400">{inProgressLabs}</span>
                    </div>
                    <span className="text-xs text-zinc-500">Sedang Berjalan</span>
                  </div>
                  <div className="text-center p-3 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span className="text-xl sm:text-2xl font-bold text-amber-400">{totalXP}</span>
                    </div>
                    <span className="text-xs text-zinc-500">XP Diperoleh</span>
                  </div>
                </div>
              </div>

              {/* Level/Rank Card */}
              <div className="flex flex-col justify-center items-center p-6 rounded-2xl bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/50">
                <div className="relative mb-4">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 p-1">
                    <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center">
                      <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                        {completedLabs + 1}
                      </span>
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-zinc-900">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">
                  {completedLabs < 2 ? 'Pemula' : completedLabs < 5 ? 'Pembela' : completedLabs < 7 ? 'Penjaga' : 'Master'}
                </h3>
                <p className="text-xs text-zinc-500 text-center">
                  {completedLabs < 8 ? `${8 - completedLabs} lab lagi ke peringkat berikutnya` : 'Peringkat maksimal tercapai!'}
                </p>
                <div className="mt-3 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span className="text-xs text-emerald-400">+{totalXP} XP kursus ini</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter and View Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-500" />
            <div className="flex gap-1 p-1 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
              {(['all', 'completed', 'in-progress', 'locked'] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${filter === f
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50'
                    }`}
                >
                  {f === 'all' ? 'Semua' : f === 'in-progress' ? 'Sedang Berjalan' : f === 'completed' ? 'Selesai' : 'Terkunci'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-1 p-1 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
            <button
              onClick={() => setViewMode('grid')}
              title="Grid View"
              className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'grid' ? 'bg-cyan-500/20 text-cyan-400' : 'text-zinc-500 hover:text-white'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="List View"
              className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'list' ? 'bg-cyan-500/20 text-cyan-400' : 'text-zinc-500 hover:text-white'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Labs Grid/List */}
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6'
          : 'flex flex-col gap-4'
        }>
          {filteredLabs.map((lab, index) => (
            <a
              key={lab.id}
              href={lab.status !== 'locked' ? `/labs/${lab.id}` : '#'}
              className={`group relative overflow-hidden rounded-2xl bg-zinc-900/80 border transition-all duration-500 ${lab.status === 'locked'
                ? 'border-zinc-800/50 opacity-60 cursor-not-allowed'
                : 'border-zinc-800/50 hover:border-zinc-700/50 hover:shadow-2xl hover:shadow-cyan-500/5 hover:-translate-y-1'
                }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Glow Effect on Hover */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${lab.bgGlow} blur-3xl`} />

              {/* Card Content */}
              <div className="relative p-5 sm:p-6">
                {/* Header Row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    {/* Icon Container */}
                    <div className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${lab.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <lab.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      {/* Status Badge */}
                      <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-zinc-900 border-2 border-zinc-800">
                        {getStatusIcon(lab.status)}
                      </div>
                    </div>

                    {/* Title & Meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-zinc-500">Lab {lab.id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getDifficultyColor(lab.difficulty)}`}>
                          {lab.difficulty}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-cyan-400 transition-colors duration-300 line-clamp-1">
                        {lab.title}
                      </h3>
                    </div>
                  </div>

                  {/* XP Badge */}
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span className="text-xs font-bold text-amber-400">{lab.xp} XP</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-zinc-400 mb-4 line-clamp-2">
                  {lab.description}
                </p>

                {/* Topics */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {lab.topics.slice(0, viewMode === 'list' ? 4 : 3).map((topic, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 text-xs rounded-lg bg-zinc-800/80 text-zinc-400 border border-zinc-700/50"
                    >
                      {topic}
                    </span>
                  ))}
                  {lab.topics.length > (viewMode === 'list' ? 4 : 3) && (
                    <span className="px-2 py-1 text-xs rounded-lg bg-zinc-800/80 text-zinc-500 border border-zinc-700/50">
                      +{lab.topics.length - (viewMode === 'list' ? 4 : 3)} lagi
                    </span>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-zinc-500">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs">{lab.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-500">
                      <Target className="w-4 h-4" />
                      <span className="text-xs">{lab.tasks} tugas</span>
                    </div>
                  </div>

                  {/* Progress or CTA */}
                  {lab.status !== 'locked' ? (
                    <div className="flex items-center gap-3">
                      {lab.progress > 0 && lab.progress < 100 && (
                        <div className="flex items-center gap-2">
                          <div className="w-16 sm:w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full"
                              style={{ width: `${lab.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-cyan-400 font-medium">{lab.progress}%</span>
                        </div>
                      )}
                      <div className={`p-2 rounded-xl transition-all duration-300 ${lab.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white'
                        }`}>
                        {lab.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-zinc-500">
                      <Lock className="w-4 h-4" />
                      <span className="text-xs">Selesaikan Lab {lab.id - 1} untuk membuka</span>
                    </div>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Learning Tips Card */}
        <div className="mt-8 sm:mt-10 relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500/10 via-zinc-900 to-purple-500/10 border border-zinc-800/50 p-6 sm:p-8">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />

          <div className="relative flex flex-col sm:flex-row items-start gap-4">
            <div className="p-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
              <BookOpen className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <span>Tips Belajar</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h3>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Lab dirancang untuk diselesaikan secara berurutan, setiap lab membangun konsep dari lab sebelumnya</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Gunakan petunjuk secukupnya untuk memaksimalkan pengalaman belajar dan perolehan XP</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Selesaikan semua tugas dalam lab untuk membuka modul berikutnya dan dapatkan hadiah bonus</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
