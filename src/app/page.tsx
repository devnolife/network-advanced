'use client';

import { cn } from '@/lib/utils';
import {
  Shield,
  Lock,
  Network,
  Terminal,
  Activity,
  Wifi,
  ChevronRight,
  Play,
  BookOpen,
  Award,
  Zap,
  Eye,
  FileCode,
  ArrowRight,
  Sparkles,
  Code2,
  Globe,
  Layers,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

// Lab data with unique colors
const labs = [
  {
    id: 1,
    title: 'Dasar-Dasar Jaringan',
    description: 'Pelajari konsep keamanan jaringan, konfigurasi perangkat dasar, dan uji konektivitas',
    icon: Network,
    difficulty: 'Pemula',
    duration: '30 menit',
    gradient: 'from-cyan-500 to-blue-600',
    shadowColor: 'shadow-cyan-500/30',
    iconBg: 'bg-linear-to-br from-cyan-500 to-blue-600',
  },
  {
    id: 2,
    title: 'Analisis Protokol TCP/IP',
    description: 'Tangkap dan analisis paket TCP/IP, pahami kerentanan keamanan protokol',
    icon: Activity,
    difficulty: 'Pemula',
    duration: '45 menit',
    gradient: 'from-emerald-500 to-teal-600',
    shadowColor: 'shadow-emerald-500/30',
    iconBg: 'bg-linear-to-br from-emerald-500 to-teal-600',
  },
  {
    id: 3,
    title: 'Konfigurasi VPN IPSec',
    description: 'Konfigurasi VPN IPSec site-to-site dengan fase IKE dan enkripsi ESP',
    icon: Lock,
    difficulty: 'Menengah',
    duration: '60 menit',
    gradient: 'from-violet-500 to-purple-600',
    shadowColor: 'shadow-violet-500/30',
    iconBg: 'bg-linear-to-br from-violet-500 to-purple-600',
  },
  {
    id: 4,
    title: 'Firewall Generasi Baru',
    description: 'Konfigurasi kebijakan firewall berbasis zona dan filtering lapisan aplikasi',
    icon: Shield,
    difficulty: 'Menengah',
    duration: '60 menit',
    gradient: 'from-orange-500 to-red-600',
    shadowColor: 'shadow-orange-500/30',
    iconBg: 'bg-linear-to-br from-orange-500 to-red-600',
  },
  {
    id: 5,
    title: 'Access Control Lists',
    description: 'Buat ACL standar dan extended untuk filtering lalu lintas tingkat lanjut',
    icon: FileCode,
    difficulty: 'Menengah',
    duration: '45 menit',
    gradient: 'from-pink-500 to-rose-600',
    shadowColor: 'shadow-pink-500/30',
    iconBg: 'bg-linear-to-br from-pink-500 to-rose-600',
  },
  {
    id: 6,
    title: 'Keamanan NAT',
    description: 'Implementasi NAT statis, dinamis, dan PAT untuk translasi alamat jaringan',
    icon: Wifi,
    difficulty: 'Menengah',
    duration: '45 menit',
    gradient: 'from-amber-500 to-orange-600',
    shadowColor: 'shadow-amber-500/30',
    iconBg: 'bg-linear-to-br from-amber-500 to-orange-600',
  },
  {
    id: 7,
    title: 'Deteksi Intrusi',
    description: 'Deploy sensor IDS, buat signature, dan analisis alert keamanan',
    icon: Eye,
    difficulty: 'Lanjutan',
    duration: '60 menit',
    gradient: 'from-sky-500 to-indigo-600',
    shadowColor: 'shadow-sky-500/30',
    iconBg: 'bg-linear-to-br from-sky-500 to-indigo-600',
  },
  {
    id: 8,
    title: 'Proyek UTS',
    description: 'Desain dan implementasi jaringan aman lengkap dengan berbagai kontrol keamanan',
    icon: Award,
    difficulty: 'Lanjutan',
    duration: '120 menit',
    gradient: 'from-fuchsia-500 to-purple-600',
    shadowColor: 'shadow-fuchsia-500/30',
    iconBg: 'bg-linear-to-br from-fuchsia-500 to-purple-600',
  }
];

const features = [
  {
    icon: Terminal,
    title: 'Terminal CLI Nyata',
    description: 'Antarmuka command line seperti Cisco dengan auto-completion',
    color: 'text-cyan-400',
    bgColor: 'from-cyan-500/20 to-blue-500/20',
    ringColor: 'ring-cyan-500/30',
  },
  {
    icon: Network,
    title: 'Topologi Interaktif',
    description: 'Canvas jaringan drag-and-drop dengan animasi paket real-time',
    color: 'text-violet-400',
    bgColor: 'from-violet-500/20 to-purple-500/20',
    ringColor: 'ring-violet-500/30',
  },
  {
    icon: Activity,
    title: 'Penangkapan Paket Live',
    description: 'Pantau dan analisis lalu lintas jaringan secara real-time',
    color: 'text-emerald-400',
    bgColor: 'from-emerald-500/20 to-teal-500/20',
    ringColor: 'ring-emerald-500/30',
  },
  {
    icon: Zap,
    title: 'Umpan Balik Instan',
    description: 'Validasi otomatis konfigurasi dengan sistem penilaian',
    color: 'text-amber-400',
    bgColor: 'from-amber-500/20 to-orange-500/20',
    ringColor: 'ring-amber-500/30',
  }
];

const stats = [
  { value: '8+', label: 'Modul Lab', icon: Layers, color: 'text-cyan-400', glowColor: 'group-hover:shadow-cyan-500/20' },
  { value: '50+', label: 'Perintah CLI', icon: Code2, color: 'text-violet-400', glowColor: 'group-hover:shadow-violet-500/20' },
  { value: '100%', label: 'Berbasis Browser', icon: Globe, color: 'text-emerald-400', glowColor: 'group-hover:shadow-emerald-500/20' },
  { value: 'Gratis', label: 'Open Source', icon: Sparkles, color: 'text-amber-400', glowColor: 'group-hover:shadow-amber-500/20' }
];

// Badge component - modern soft style
function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: React.ReactNode;
  variant?: 'default' | 'beginner' | 'intermediate' | 'advanced' | 'pemula' | 'menengah' | 'lanjutan';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium backdrop-blur-sm transition-all duration-200',
        {
          'bg-zinc-200/80 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300': variant === 'default',
          'bg-emerald-100/80 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400': variant === 'beginner',
          'bg-amber-100/80 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400': variant === 'intermediate',
          'bg-red-100/80 dark:bg-red-500/15 text-red-700 dark:text-red-400': variant === 'advanced',
        },
        className
      )}
    >
      {children}
    </span>
  );
}

// Card component with theme support - modern glassmorphism style
function Card({
  children,
  className,
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60 bg-white/70 dark:bg-zinc-800/70 backdrop-blur-xl shadow-sm dark:shadow-lg dark:shadow-black/20 transition-all duration-300',
        hover && 'hover:border-cyan-500/40 dark:hover:border-cyan-400/40 hover:bg-white/90 dark:hover:bg-zinc-800/90 hover:shadow-xl hover:shadow-cyan-500/10 dark:hover:shadow-cyan-500/20',
        className
      )}
    >
      {children}
    </div>
  );
}

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 antialiased transition-colors duration-300">
      {/* Background gradients - theme aware */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Light mode backgrounds - smooth gradients */}
        <div className="dark:hidden absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(6,182,212,0.15),transparent)]" />
        <div className="dark:hidden absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_100%_100%,rgba(139,92,246,0.1),transparent)]" />
        <div className="dark:hidden absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_0%_50%,rgba(16,185,129,0.08),transparent)]" />
        <div className="dark:hidden absolute inset-0 bg-linear-to-b from-zinc-50/80 to-white" />

        {/* Dark mode backgrounds - enhanced visibility */}
        <div className="hidden dark:block absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(6,182,212,0.25),transparent)]" />
        <div className="hidden dark:block absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_100%_100%,rgba(139,92,246,0.2),transparent)]" />
        <div className="hidden dark:block absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_0%_100%,rgba(16,185,129,0.15),transparent)]" />
        <div className="hidden dark:block absolute inset-0 bg-[radial-gradient(ellipse_30%_30%_at_90%_10%,rgba(236,72,153,0.12),transparent)]" />

        {/* Subtle noise texture for depth - very light */}
        <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.02] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')]" />
      </div>

      {/* Header - glassmorphism style */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/40 dark:border-zinc-700/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl transition-all duration-300">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3 animate-fade-in">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-zinc-900 dark:text-white">
              Cyber<span className="text-cyan-500 dark:text-cyan-400">Nexus</span>
            </span>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {['Fitur', 'Lab', 'Dokumentasi'].map((item, i) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className={cn(
                  "rounded-md px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 animate-fade-in",
                  i === 0 && "animation-delay-100",
                  i === 1 && "animation-delay-200",
                  i === 2 && "animation-delay-300"
                )}
              >
                {item}
              </a>
            ))}
          </nav>

          {/* CTA & Theme Toggle */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all duration-300"
                aria-label="Toggle theme"
              >
                {resolvedTheme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
            )}
            <a
              href="/login"
              className="hidden rounded-lg border border-zinc-200 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all sm:inline-flex animate-fade-in"
            >
              Masuk
            </a>
            <a
              href="/register"
              className="hidden rounded-lg bg-linear-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-cyan-500/40 hover:-translate-y-0.5 sm:inline-flex animate-fade-in"
            >
              Mulai Sekarang
            </a>
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 md:hidden transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-4 md:hidden animate-fade-in">
            <nav className="flex flex-col gap-2">
              {['Fitur', 'Lab', 'Dokumentasi'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="rounded-md px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
                </a>
              ))}
              <a
                href="/labs"
                className="mt-2 rounded-lg bg-linear-to-r from-cyan-500 to-blue-600 px-4 py-2 text-center text-sm font-semibold text-white"
              >
                Mulai Sekarang
              </a>
            </nav>
          </div>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 px-4 py-1.5 text-sm animate-fade-in-up">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span className="text-zinc-600 dark:text-zinc-400">Platform Pembelajaran Interaktif</span>
            </div>

            {/* Title */}
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl animate-fade-in-up animation-delay-100">
              <span className="text-zinc-900 dark:text-white">Kuasai </span>
              <span className="bg-linear-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent animate-gradient">
                Keamanan
              </span>
              <br />
              <span className="bg-linear-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent animate-gradient">
                Jaringan
              </span>
              <span className="text-zinc-900 dark:text-white"> Langsung</span>
            </h1>

            {/* Description */}
            <p className="mx-auto mb-10 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400 sm:text-xl animate-fade-in-up animation-delay-200">
              Platform paling canggih untuk belajar VPN, Firewall, dan IDS melalui
              simulasi berbasis browser secara real-time.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-in-up animation-delay-300">
              <a
                href="/labs"
                className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 px-8 py-4 text-lg font-bold text-white shadow-xl shadow-cyan-500/25 transition-all hover:-translate-y-1 hover:shadow-cyan-500/40 hover-lift"
              >
                <Play className="h-5 w-5" />
                Mulai Belajar
              </a>
              <a
                href="#labs"
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-8 py-4 text-lg font-semibold text-zinc-900 dark:text-white transition-all hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover-lift"
              >
                <BookOpen className="h-5 w-5" />
                Lihat Modul
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
            {stats.map((stat, i) => (
              <Card key={i} className={cn(
                "group p-6 text-center transition-all hover:shadow-lg hover-lift card-glow animate-fade-in-up",
                stat.glowColor,
                i === 0 && "animation-delay-400",
                i === 1 && "animation-delay-500",
                i === 2 && "animation-delay-600",
                i === 3 && "animation-delay-700"
              )}>
                <stat.icon className={cn("mx-auto mb-3 h-8 w-8 transition-transform group-hover:scale-110", stat.color)} />
                <div className="text-2xl font-bold text-zinc-900 dark:text-white sm:text-3xl">{stat.value}</div>
                <div className="text-sm text-zinc-600 dark:text-zinc-300">{stat.label}</div>
              </Card>
            ))}
          </div>
        </section>

        {/* Terminal Preview - modern style */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl animate-fade-in-up">
            <Card className="overflow-hidden shadow-2xl shadow-cyan-500/10 dark:shadow-cyan-500/20">
              {/* Terminal Header */}
              <div className="flex items-center gap-4 border-b border-zinc-200/40 dark:border-zinc-700/50 bg-zinc-100/90 dark:bg-zinc-800/90 backdrop-blur-sm px-5 py-4">
                <div className="flex gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-400 dark:bg-red-500 shadow-sm" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400 dark:bg-yellow-500 shadow-sm" />
                  <div className="h-3 w-3 rounded-full bg-green-400 dark:bg-green-500 shadow-sm" />
                </div>
                <span className="flex items-center gap-2 font-mono text-sm text-zinc-500 dark:text-zinc-400">
                  <Terminal className="h-4 w-4" />
                  router-01.ssh
                </span>
              </div>
              {/* Terminal Body */}
              <div className="bg-zinc-950 p-6 font-mono text-sm leading-relaxed sm:text-base">
                <div className="space-y-2">
                  <div>
                    <span className="text-cyan-400">admin@router-01:~$</span>{' '}
                    <span className="text-zinc-300 typing-cursor">configure terminal</span>
                  </div>
                  <div className="text-zinc-600"># Masuk ke mode konfigurasi...</div>
                  <div className="animate-fade-in animation-delay-200">
                    <span className="text-violet-400">router(config)#</span>{' '}
                    <span className="text-zinc-300">interface gigabitEthernet 0/1</span>
                  </div>
                  <div className="animate-fade-in animation-delay-400">
                    <span className="text-violet-400">router(config-if)#</span>{' '}
                    <span className="text-zinc-300">ip address 192.168.1.1 255.255.255.0</span>
                  </div>
                  <div className="animate-fade-in animation-delay-600">
                    <span className="text-violet-400">router(config-if)#</span>{' '}
                    <span className="text-zinc-300">no shutdown</span>
                  </div>
                  <div className="pt-2 text-emerald-400 animate-fade-in animation-delay-800">
                    %LINK-5-CHANGED: Interface GigabitEthernet0/1, changed state to up
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-zinc-900 dark:text-white sm:text-4xl">
                Fitur <span className="text-cyan-500 dark:text-cyan-400">Platform</span>
              </h2>
              <p className="mx-auto max-w-2xl text-zinc-600 dark:text-zinc-400">
                Semua yang Anda butuhkan untuk menguasai keamanan jaringan dalam satu platform.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, i) => (
                <Card key={i} hover className={cn("p-6 animate-fade-in-up hover-lift card-glow", `animation-delay-${(i + 1) * 100}`)}>
                  <div className={cn("mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-linear-to-br ring-1", feature.bgColor, feature.ringColor)}>
                    <feature.icon className={cn("h-6 w-6", feature.color)} />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">{feature.title}</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Labs Section */}
        <section id="labs" className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {/* Section Header */}
            <div className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h2 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-white sm:text-4xl">
                  <span className="text-cyan-500 dark:text-cyan-400">Laboratorium</span> Tersedia
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Jalur pembelajaran progresif dari dasar hingga keamanan lanjutan.
                </p>
              </div>
              <a
                href="/labs"
                className="group inline-flex items-center gap-2 text-sm font-semibold text-cyan-500 dark:text-cyan-400 hover:text-cyan-400 dark:hover:text-cyan-300"
              >
                Lihat Semua Lab
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>

            {/* Labs Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {labs.map((lab, i) => (
                <a
                  key={lab.id}
                  href={`/labs/${lab.id}`}
                  className={cn("group animate-fade-in-up", `animation-delay-${(i + 1) * 100}`)}
                >
                  <Card hover className="flex h-full flex-col p-5 hover-lift card-glow">
                    {/* Icon */}
                    <div className={cn("mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg shadow-lg", lab.iconBg, lab.shadowColor)}>
                      <lab.icon className="h-5 w-5 text-white" />
                    </div>

                    {/* Meta */}
                    <div className="mb-3 flex items-center gap-2">
                      <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                        LAB-{String(lab.id).padStart(2, '0')}
                      </span>
                      <Badge
                        variant={
                          lab.difficulty === 'Pemula'
                            ? 'beginner'
                            : lab.difficulty === 'Menengah'
                              ? 'intermediate'
                              : 'advanced'
                        }
                      >
                        {lab.difficulty}
                      </Badge>
                    </div>

                    {/* Content */}
                    <h3 className="mb-2 font-semibold text-zinc-900 dark:text-white transition-colors group-hover:text-cyan-500 dark:group-hover:text-cyan-400">
                      {lab.title}
                    </h3>
                    <p className="mb-4 flex-1 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                      {lab.description}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 mt-auto">
                      <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-300">
                        <Activity className="h-3.5 w-3.5" />
                        {lab.duration}
                      </span>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-all duration-300 group-hover:bg-cyan-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-cyan-500/30">
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </Card>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer - clean modern style */}
      <footer className="border-t border-zinc-200/50 dark:border-zinc-700/50 bg-zinc-50/90 dark:bg-zinc-900/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-12 md:grid-cols-4">
            {/* Brand */}
            <div className="md:col-span-2">
              <a href="/" className="mb-6 inline-flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-zinc-900 dark:text-white">CyberNexus</span>
              </a>
              <p className="max-w-sm text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                Memberdayakan generasi profesional keamanan siber berikutnya
                melalui pengalaman laboratorium virtual yang imersif dan langsung.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="mb-5 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-300">Platform</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-zinc-600 dark:text-zinc-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Modul Lab</a></li>
                <li><a href="#" className="text-zinc-600 dark:text-zinc-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Dokumentasi</a></li>
                <li><a href="#" className="text-zinc-600 dark:text-zinc-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Jalur Pembelajaran</a></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-5 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-300">Komunitas</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-zinc-600 dark:text-zinc-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">GitHub</a></li>
                <li><a href="#" className="text-zinc-600 dark:text-zinc-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Discord</a></li>
                <li><a href="#" className="text-zinc-600 dark:text-zinc-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Twitter</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-zinc-200/50 dark:border-zinc-700/50 pt-8 text-sm text-zinc-500 dark:text-zinc-400 sm:flex-row">
            <p>© 2024 CyberNexus. Edukasi Open Source.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Kebijakan Privasi</a>
              <a href="#" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Syarat Layanan</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
