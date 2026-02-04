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
  CheckCircle,
  Users,
  GraduationCap,
  Star,
  Quote,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

// Lab data with varied soft colors (8 soft colors: brand, emerald, sky, amber, rose, teal, cyan, lime)
const labs = [
  {
    id: 1,
    title: 'Network Fundamentals',
    description: 'Pelajari konsep keamanan jaringan, konfigurasi perangkat dasar, dan uji konektivitas',
    icon: Network,
    difficulty: 'Pemula',
    duration: '30 menit',
    color: 'brand', // #088395
  },
  {
    id: 2,
    title: 'TCP/IP Protocol Analysis',
    description: 'Tangkap dan analisis paket TCP/IP, pahami kerentanan keamanan protokol',
    icon: Activity,
    difficulty: 'Pemula',
    duration: '45 menit',
    color: 'emerald',
  },
  {
    id: 3,
    title: 'IPSec VPN Configuration',
    description: 'Konfigurasi VPN IPSec site-to-site dengan fase IKE dan enkripsi ESP',
    icon: Lock,
    difficulty: 'Menengah',
    duration: '60 menit',
    color: 'sky',
  },
  {
    id: 4,
    title: 'Next-Gen Firewall',
    description: 'Konfigurasi kebijakan firewall berbasis zona dan filtering lapisan aplikasi',
    icon: Shield,
    difficulty: 'Menengah',
    duration: '60 menit',
    color: 'rose',
  },
  {
    id: 5,
    title: 'Access Control Lists',
    description: 'Buat ACL standar dan extended untuk filtering lalu lintas tingkat lanjut',
    icon: FileCode,
    difficulty: 'Menengah',
    duration: '45 menit',
    color: 'amber',
  },
  {
    id: 6,
    title: 'NAT Security',
    description: 'Implementasi NAT statis, dinamis, dan PAT untuk translasi alamat jaringan',
    icon: Wifi,
    difficulty: 'Menengah',
    duration: '45 menit',
    color: 'teal',
  },
  {
    id: 7,
    title: 'Intrusion Detection',
    description: 'Deploy sensor IDS, buat signature, dan analisis alert keamanan',
    icon: Eye,
    difficulty: 'Lanjutan',
    duration: '60 menit',
    color: 'cyan',
  },
  {
    id: 8,
    title: 'Midterm Project',
    description: 'Desain dan implementasi jaringan aman lengkap dengan berbagai kontrol keamanan',
    icon: Award,
    difficulty: 'Lanjutan',
    duration: '120 menit',
    color: 'lime',
  }
];

// Features with varied soft colors
const features = [
  {
    icon: Terminal,
    title: 'Terminal CLI Nyata',
    description: 'Antarmuka command line seperti Cisco dengan auto-completion dan syntax highlighting',
    color: 'brand',
  },
  {
    icon: Network,
    title: 'Topologi Interaktif',
    description: 'Canvas jaringan drag-and-drop dengan animasi paket real-time',
    color: 'sky',
  },
  {
    icon: Activity,
    title: 'Penangkapan Paket Live',
    description: 'Pantau dan analisis lalu lintas jaringan secara real-time',
    color: 'emerald',
  },
  {
    icon: Zap,
    title: 'Umpan Balik Instan',
    description: 'Validasi otomatis konfigurasi dengan sistem penilaian detail',
    color: 'amber',
  }
];

// Stats with varied soft colors
const stats = [
  { value: '8+', label: 'Modul Lab', icon: Layers, color: 'brand' },
  { value: '50+', label: 'Perintah CLI', icon: Code2, color: 'sky' },
  { value: '100%', label: 'Berbasis Browser', icon: Globe, color: 'emerald' },
  { value: 'Gratis', label: 'Open Source', icon: Sparkles, color: 'amber' }
];

// Testimonials
const testimonials = [
  {
    name: 'Ahmad Rizky',
    role: 'Mahasiswa IT',
    content: 'Platform yang luar biasa! Saya bisa belajar konfigurasi jaringan tanpa harus punya perangkat fisik.',
    rating: 5,
  },
  {
    name: 'Siti Nurhaliza',
    role: 'Network Engineer',
    content: 'Sangat membantu untuk persiapan sertifikasi. Lab-nya realistis dan feedback-nya sangat detail.',
    rating: 5,
  },
  {
    name: 'Budi Santoso',
    role: 'Dosen Jaringan',
    content: 'Saya gunakan untuk mengajar mahasiswa. Mereka jadi lebih mudah memahami konsep keamanan jaringan.',
    rating: 5,
  },
];

const benefits = [
  'Simulasi jaringan realistis tanpa perangkat keras',
  'Penilaian otomatis dan umpan balik instan',
  'Jalur pembelajaran terstruktur dari pemula hingga mahir',
  'Akses 24/7 dari browser manapun',
];

// Color utility function - 8 soft colors (no purple/violet)
const getColorClasses = (color: string) => {
  const colors: Record<string, { bg: string; bgHover: string; text: string; border: string; light: string }> = {
    brand: {
      bg: 'bg-[#088395]/10 dark:bg-[#088395]/20',
      bgHover: 'group-hover:bg-[#088395]',
      text: 'text-[#088395]',
      border: 'border-[#088395]/20 hover:border-[#088395]/40',
      light: 'bg-[#088395]/5',
    },
    emerald: {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      bgHover: 'group-hover:bg-emerald-500',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      light: 'bg-emerald-500/5',
    },
    sky: {
      bg: 'bg-sky-500/10 dark:bg-sky-500/20',
      bgHover: 'group-hover:bg-sky-500',
      text: 'text-sky-600 dark:text-sky-400',
      border: 'border-sky-500/20 hover:border-sky-500/40',
      light: 'bg-sky-500/5',
    },
    amber: {
      bg: 'bg-amber-500/10 dark:bg-amber-500/20',
      bgHover: 'group-hover:bg-amber-500',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-500/20 hover:border-amber-500/40',
      light: 'bg-amber-500/5',
    },
    rose: {
      bg: 'bg-rose-500/10 dark:bg-rose-500/20',
      bgHover: 'group-hover:bg-rose-500',
      text: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-500/20 hover:border-rose-500/40',
      light: 'bg-rose-500/5',
    },
    teal: {
      bg: 'bg-teal-500/10 dark:bg-teal-500/20',
      bgHover: 'group-hover:bg-teal-500',
      text: 'text-teal-600 dark:text-teal-400',
      border: 'border-teal-500/20 hover:border-teal-500/40',
      light: 'bg-teal-500/5',
    },
    cyan: {
      bg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
      bgHover: 'group-hover:bg-cyan-500',
      text: 'text-cyan-600 dark:text-cyan-400',
      border: 'border-cyan-500/20 hover:border-cyan-500/40',
      light: 'bg-cyan-500/5',
    },
    lime: {
      bg: 'bg-lime-500/10 dark:bg-lime-500/20',
      bgHover: 'group-hover:bg-lime-500',
      text: 'text-lime-600 dark:text-lime-400',
      border: 'border-lime-500/20 hover:border-lime-500/40',
      light: 'bg-lime-500/5',
    },
  };
  return colors[color] || colors.brand;
};

// Badge component
function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: React.ReactNode;
  variant?: 'default' | 'beginner' | 'intermediate' | 'advanced';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all',
        {
          'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400': variant === 'default',
          'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20': variant === 'beginner',
          'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20': variant === 'intermediate',
          'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20': variant === 'advanced',
        },
        className
      )}
    >
      {children}
    </span>
  );
}

// Card component
function Card({
  children,
  className,
  hover = false,
  color,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  color?: string;
}) {
  const colorClasses = color ? getColorClasses(color) : null;
  
  return (
    <div
      className={cn(
        'rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-all duration-300',
        hover && !color && 'hover:border-[#088395]/40 hover:shadow-lg hover:shadow-[#088395]/5',
        hover && color && colorClasses?.border,
        hover && 'hover:shadow-lg',
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
  const { setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 antialiased transition-colors duration-300">
      {/* Subtle background accents */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* Light mode - multi-color subtle gradients (soft colors, no purple) */}
        <div className="dark:hidden absolute top-0 left-1/4 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(8,131,149,0.05),transparent_60%)]" />
        <div className="dark:hidden absolute top-1/3 right-0 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(14,165,233,0.04),transparent_60%)]" />
        <div className="dark:hidden absolute bottom-0 left-0 w-[400px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.04),transparent_60%)]" />
        
        {/* Dark mode - multi-color subtle gradients (soft colors, no purple) */}
        <div className="hidden dark:block absolute top-0 left-1/4 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(8,131,149,0.1),transparent_60%)]" />
        <div className="hidden dark:block absolute top-1/3 right-0 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(14,165,233,0.08),transparent_60%)]" />
        <div className="hidden dark:block absolute bottom-0 left-0 w-[400px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.06),transparent_60%)]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#088395]">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-zinc-900 dark:text-white">
              Cyber<span className="text-[#088395]">Nexus</span>
            </span>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {['Fitur', 'Lab', 'Testimoni'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                {item}
              </a>
            ))}
          </nav>

          {/* CTA & Theme Toggle */}
          <div className="flex items-center gap-3">
            {mounted && (
              <button
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
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
              className="hidden rounded-lg border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all sm:inline-flex"
            >
              Masuk
            </a>
            <a
              href="/register"
              className="hidden rounded-lg bg-[#088395] hover:bg-[#09637E] px-4 py-2 text-sm font-semibold text-white transition-all sm:inline-flex"
            >
              Mulai Sekarang
            </a>
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 md:hidden transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-2">
              {['Fitur', 'Lab', 'Testimoni'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
                </a>
              ))}
              <div className="flex gap-2 mt-2">
                <a
                  href="/login"
                  className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-center text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Masuk
                </a>
                <a
                  href="/register"
                  className="flex-1 rounded-lg bg-[#088395] px-4 py-2 text-center text-sm font-semibold text-white"
                >
                  Daftar
                </a>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-1.5 text-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span className="text-zinc-600 dark:text-zinc-400">Platform Pembelajaran Interaktif</span>
            </div>

            {/* Title with gradient - soft colors only */}
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              <span className="text-zinc-900 dark:text-white">Kuasai </span>
              <span className="bg-gradient-to-r from-[#088395] to-[#7AB2B2] bg-clip-text text-transparent">Keamanan Jaringan</span>
              <br />
              <span className="text-zinc-900 dark:text-white">dengan </span>
              <span className="bg-gradient-to-r from-sky-500 to-cyan-400 bg-clip-text text-transparent">Praktik Langsung</span>
            </h1>

            {/* Description */}
            <p className="mx-auto mb-10 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
              Platform paling canggih untuk belajar VPN, Firewall, dan IDS melalui
              simulasi berbasis browser secara real-time. Tanpa instalasi, langsung praktik.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="/labs"
                className="inline-flex items-center gap-2 rounded-xl bg-[#088395] hover:bg-[#09637E] px-8 py-4 text-lg font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#088395]/25"
              >
                <Play className="h-5 w-5" />
                Mulai Belajar
              </a>
              <a
                href="#labs"
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-8 py-4 text-lg font-semibold text-zinc-900 dark:text-white transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <BookOpen className="h-5 w-5" />
                Lihat Modul
              </a>
            </div>
          </div>

          {/* Stats with varied colors */}
          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((stat, i) => {
              const colors = getColorClasses(stat.color);
              return (
                <Card key={i} className="group p-5 text-center hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
                  <div className={cn("mx-auto mb-3 w-12 h-12 rounded-xl flex items-center justify-center transition-colors", colors.bg)}>
                    <stat.icon className={cn("h-6 w-6", colors.text)} />
                  </div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-white">{stat.value}</div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">{stat.label}</div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Terminal Preview */}
        <section className="px-4 py-12 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="mx-auto max-w-4xl">
            <Card className="overflow-hidden shadow-xl">
              {/* Terminal Header */}
              <div className="flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 px-5 py-3">
                <div className="flex gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-400" />
                  <div className="h-3 w-3 rounded-full bg-amber-400" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <span className="flex items-center gap-2 font-mono text-sm text-zinc-500 dark:text-zinc-400">
                  <Terminal className="h-4 w-4" />
                  router-01.ssh
                </span>
              </div>
              {/* Terminal Body */}
              <div className="bg-zinc-950 p-6 font-mono text-sm leading-relaxed">
                <div className="space-y-2">
                  <div>
                    <span className="text-[#7AB2B2]">admin@router-01:~$</span>{' '}
                    <span className="text-zinc-300">configure terminal</span>
                  </div>
                  <div className="text-zinc-600"># Masuk ke mode konfigurasi...</div>
                  <div>
                    <span className="text-sky-400">router(config)#</span>{' '}
                    <span className="text-zinc-300">interface gigabitEthernet 0/1</span>
                  </div>
                  <div>
                    <span className="text-sky-400">router(config-if)#</span>{' '}
                    <span className="text-zinc-300">ip address 192.168.1.1 255.255.255.0</span>
                  </div>
                  <div>
                    <span className="text-sky-400">router(config-if)#</span>{' '}
                    <span className="text-zinc-300">no shutdown</span>
                  </div>
                  <div className="pt-2 text-emerald-400">
                    %LINK-5-CHANGED: Interface GigabitEthernet0/1, changed state to up
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Features Section with varied colors */}
        <section id="fitur" className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-zinc-900 dark:text-white sm:text-4xl">
                Fitur <span className="text-[#088395]">Platform</span>
              </h2>
              <p className="mx-auto max-w-2xl text-zinc-600 dark:text-zinc-400">
                Semua yang Anda butuhkan untuk menguasai keamanan jaringan dalam satu platform.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, i) => {
                const colors = getColorClasses(feature.color);
                return (
                  <Card key={i} hover color={feature.color} className="p-6 group">
                    <div className={cn("mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl transition-colors", colors.bg, colors.bgHover)}>
                      <feature.icon className={cn("h-6 w-6 transition-colors", colors.text, "group-hover:text-white")} />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">{feature.title}</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{feature.description}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="px-4 py-20 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              {/* Left - Text */}
              <div>
                <h2 className="mb-4 text-3xl font-bold text-zinc-900 dark:text-white sm:text-4xl">
                  Mengapa Memilih <span className="text-[#088395]">CyberNexus</span>?
                </h2>
                <p className="mb-8 text-lg text-zinc-600 dark:text-zinc-400">
                  Platform kami dirancang khusus untuk mahasiswa dan profesional yang ingin
                  menguasai keamanan jaringan dengan cara yang paling efektif.
                </p>
                
                <ul className="space-y-4">
                  {benefits.map((benefit, i) => {
                    const iconColors = ['text-[#088395]', 'text-emerald-500', 'text-sky-500', 'text-amber-500'];
                    return (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className={cn("h-5 w-5 mt-0.5 flex-shrink-0", iconColors[i])} />
                        <span className="text-zinc-700 dark:text-zinc-300">{benefit}</span>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-8 flex items-center gap-6">
                  <div className="flex -space-x-2">
                    {[
                      'bg-[#088395]',
                      'bg-sky-500',
                      'bg-emerald-500',
                      'bg-amber-500',
                    ].map((bg, i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-10 w-10 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center text-white text-sm font-medium",
                          bg
                        )}
                      >
                        {String.fromCharCode(65 + i)}
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-white">500+ Pengguna</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Bergabung bulan ini</p>
                  </div>
                </div>
              </div>

              {/* Right - Stats Cards with varied soft colors */}
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { icon: Users, value: '2,500+', label: 'Siswa Terdaftar', color: 'brand' },
                  { icon: GraduationCap, value: '95%', label: 'Tingkat Kelulusan', color: 'emerald' },
                  { icon: Award, value: '8,000+', label: 'Lab Diselesaikan', color: 'sky' },
                  { icon: Zap, value: '4.9/5', label: 'Rating Pengguna', color: 'amber' },
                ].map((stat, i) => {
                  const colors = getColorClasses(stat.color);
                  return (
                    <Card key={i} className="p-6 text-center">
                      <div className={cn("mx-auto mb-3 w-14 h-14 rounded-xl flex items-center justify-center", colors.bg)}>
                        <stat.icon className={cn("h-7 w-7", colors.text)} />
                      </div>
                      <div className="text-3xl font-bold text-zinc-900 dark:text-white">{stat.value}</div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">{stat.label}</div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Labs Section with varied colors */}
        <section id="lab" className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {/* Section Header */}
            <div className="mb-12 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h2 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-white sm:text-4xl">
                  <span className="text-[#088395]">Laboratorium</span> Tersedia
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Jalur pembelajaran progresif dari dasar hingga keamanan lanjutan.
                </p>
              </div>
              <a
                href="/labs"
                className="group inline-flex items-center gap-2 text-sm font-semibold text-[#088395] hover:text-[#09637E]"
              >
                Lihat Semua Lab
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>

            {/* Labs Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {labs.map((lab) => {
                const colors = getColorClasses(lab.color);
                return (
                  <a
                    key={lab.id}
                    href={`/labs/${lab.id}`}
                    className="group"
                  >
                    <Card hover color={lab.color} className="flex h-full flex-col p-5">
                      {/* Icon */}
                      <div className={cn("mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg transition-colors", colors.bg, colors.bgHover)}>
                        <lab.icon className={cn("h-5 w-5 transition-colors", colors.text, "group-hover:text-white")} />
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
                      <h3 className={cn("mb-2 font-semibold text-zinc-900 dark:text-white transition-colors", `group-hover:${colors.text}`)}>
                        {lab.title}
                      </h3>
                      <p className="mb-4 flex-1 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                        {lab.description}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 mt-auto border-t border-zinc-100 dark:border-zinc-800">
                        <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                          <Activity className="h-3.5 w-3.5" />
                          {lab.duration}
                        </span>
                        <div className={cn("flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-all", colors.bgHover, "group-hover:text-white")}>
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </Card>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimoni" className="px-4 py-20 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-zinc-900 dark:text-white sm:text-4xl">
                Apa Kata <span className="text-[#088395]">Pengguna</span>
              </h2>
              <p className="mx-auto max-w-2xl text-zinc-600 dark:text-zinc-400">
                Dengarkan pengalaman dari mereka yang sudah menggunakan platform kami.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {testimonials.map((testimonial, i) => {
                const accentColors = ['border-t-[#088395]', 'border-t-sky-500', 'border-t-emerald-500'];
                const avatarColors = ['bg-[#088395]', 'bg-sky-500', 'bg-emerald-500'];
                return (
                  <Card key={i} className={cn("p-6 border-t-4", accentColors[i])}>
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <Quote className="h-8 w-8 text-zinc-300 dark:text-zinc-600 mb-3" />
                    <p className="text-zinc-700 dark:text-zinc-300 mb-6">{testimonial.content}</p>
                    <div className="flex items-center gap-3">
                      <div className={cn("h-10 w-10 rounded-full flex items-center justify-center text-white font-medium", avatarColors[i])}>
                        {testimonial.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-white">{testimonial.name}</p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">{testimonial.role}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <Card className="relative overflow-hidden p-8 sm:p-12 text-center">
              {/* Multi-color gradient overlay - soft colors only */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#088395]/5 via-sky-500/5 to-amber-500/5 pointer-events-none" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(ellipse_at_center,rgba(14,165,233,0.1),transparent_70%)] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-[radial-gradient(ellipse_at_center,rgba(8,131,149,0.1),transparent_70%)] pointer-events-none" />
              
              <div className="relative">
                <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-white sm:text-3xl">
                  Siap Memulai Perjalanan Anda?
                </h2>
                <p className="mb-8 text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
                  Bergabung dengan ribuan profesional yang telah meningkatkan keahlian keamanan jaringan mereka.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <a
                    href="/register"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#088395] hover:bg-[#09637E] px-8 py-3 font-semibold text-white transition-all hover:shadow-lg hover:shadow-[#088395]/25"
                  >
                    Daftar Gratis
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <a
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 px-8 py-3 font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                  >
                    Sudah Punya Akun? Masuk
                  </a>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            {/* Brand */}
            <div className="md:col-span-2">
              <a href="/" className="mb-4 inline-flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#088395]">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-zinc-900 dark:text-white">CyberNexus</span>
              </a>
              <p className="max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
                Memberdayakan generasi profesional keamanan siber berikutnya
                melalui pengalaman laboratorium virtual yang imersif dan langsung.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-zinc-600 dark:text-zinc-400 hover:text-[#088395] transition-colors">Modul Lab</a></li>
                <li><a href="#" className="text-zinc-600 dark:text-zinc-400 hover:text-[#088395] transition-colors">Dokumentasi</a></li>
                <li><a href="#" className="text-zinc-600 dark:text-zinc-400 hover:text-[#088395] transition-colors">Jalur Pembelajaran</a></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Komunitas</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-zinc-600 dark:text-zinc-400 hover:text-teal-500 transition-colors">GitHub</a></li>
                <li><a href="#" className="text-zinc-600 dark:text-zinc-400 hover:text-cyan-500 transition-colors">Discord</a></li>
                <li><a href="#" className="text-zinc-600 dark:text-zinc-400 hover:text-sky-500 transition-colors">Twitter</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-zinc-200 dark:border-zinc-800 pt-8 text-sm text-zinc-500 dark:text-zinc-400 sm:flex-row">
            <p>© 2026 CyberNexus. Edukasi Open Source.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-[#088395] transition-colors">Kebijakan Privasi</a>
              <a href="#" className="hover:text-[#088395] transition-colors">Syarat Layanan</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
