'use client';

import { cn } from '@/lib/utils';
import { Shield, User, Lock, Eye, EyeOff, ArrowRight, Loader2, Sparkles, Zap, Globe, Terminal, Network } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Gagal masuk');
        setLoading(false);
        return;
      }

      // Redirect based on role
      if (data.user.role === 'ADMIN') {
        router.push('/dashboard/admin');
      } else if (data.user.role === 'INSTRUCTOR') {
        router.push('/dashboard/instructor');
      } else {
        router.push('/dashboard/student');
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex overflow-hidden transition-colors duration-300">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#09637E] via-[#088395] to-[#7AB2B2] p-12 flex-col justify-between">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#7AB2B2]/30 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-sky-400/20 rounded-full blur-3xl animate-pulse [animation-delay:2s]" />

          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:60px_60px]" />

          {/* Floating Elements */}
          <div className="absolute top-20 right-20 w-3 h-3 bg-white/60 rounded-full animate-bounce [animation-delay:0.5s]" />
          <div className="absolute top-40 left-20 w-2 h-2 bg-[#EBF4F6] rounded-full animate-bounce [animation-delay:1s]" />
          <div className="absolute bottom-40 right-32 w-4 h-4 bg-sky-300/60 rounded-full animate-bounce [animation-delay:1.5s]" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-white">
              Cyber<span className="text-[#EBF4F6]">Nexus</span>
            </span>
          </Link>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
              Kuasai Keamanan Jaringan<br />
              <span className="text-[#EBF4F6]">
                Dengan Praktik Langsung
              </span>
            </h2>
            <p className="text-lg text-white/80 max-w-md">
              Bergabung dengan ribuan pelajar yang membangun keterampilan keamanan siber di lingkungan lab virtual kami.
            </p>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm text-white backdrop-blur-sm">
              <Terminal className="h-4 w-4 text-[#EBF4F6]" />
              Terminal CLI Nyata
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm text-white backdrop-blur-sm">
              <Network className="h-4 w-4 text-amber-300" />
              Simulasi Real-time
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm text-white backdrop-blur-sm">
              <Globe className="h-4 w-4 text-sky-300" />
              Akses 24/7
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-8">
            <div>
              <div className="text-3xl font-bold text-white">2,500+</div>
              <div className="text-sm text-white/70">Pengguna Aktif</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">8+</div>
              <div className="text-sm text-white/70">Modul Lab</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">95%</div>
              <div className="text-sm text-white/70">Tingkat Kelulusan</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-white/60">
          © 2026 CyberNexus. Hak cipta dilindungi.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12 relative">
        {/* Theme Toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="absolute top-6 right-6 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all shadow-sm"
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
        )}

        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#088395] shadow-lg shadow-[#088395]/25">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                Cyber<span className="text-[#088395]">Nexus</span>
              </span>
            </Link>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left mb-8">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
              Selamat Datang Kembali
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Masukkan kredensial untuk mengakses akun Anda
            </p>
          </div>

          {/* Login Form Card */}
          <div className="relative">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#088395]/20 via-transparent to-[#7AB2B2]/20 rounded-3xl blur-xl opacity-50" />

            <div className="relative rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 backdrop-blur-xl p-8 shadow-xl shadow-zinc-200/50 dark:shadow-none">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-4 text-sm text-red-600 dark:text-red-400 flex items-center gap-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    {error}
                  </div>
                )}

                {/* Username Field */}
                <div className="space-y-2">
                  <label htmlFor="username" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Nama Pengguna
                  </label>
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#088395] to-[#7AB2B2] rounded-xl opacity-0 group-focus-within:opacity-100 blur transition-opacity" />
                    <div className="relative flex items-center">
                      <User className="absolute left-4 h-5 w-5 text-zinc-400 dark:text-zinc-500 group-focus-within:text-[#088395] transition-colors" />
                      <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Masukkan nama pengguna"
                        className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 pl-12 pr-4 py-3.5 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#088395]/50 transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Kata Sandi
                  </label>
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#088395] to-[#7AB2B2] rounded-xl opacity-0 group-focus-within:opacity-100 blur transition-opacity" />
                    <div className="relative flex items-center">
                      <Lock className="absolute left-4 h-5 w-5 text-zinc-400 dark:text-zinc-500 group-focus-within:text-[#088395] transition-colors" />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 pl-12 pr-12 py-3.5 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#088395]/50 transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                      />
                      <div className="w-5 h-5 rounded-md border-2 border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 peer-checked:bg-[#088395] peer-checked:border-[#088395] transition-all" />
                      <svg className="absolute top-1 left-1 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 12 12">
                        <path d="M3.5 6L5.5 8L8.5 4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">Ingat saya</span>
                  </label>
                  <Link href="/forgot-password" className="text-sm text-[#088395] hover:text-[#09637E] transition-colors">
                    Lupa kata sandi?
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "relative w-full group overflow-hidden rounded-xl bg-gradient-to-r from-[#088395] to-[#09637E] p-px transition-all hover:shadow-lg hover:shadow-[#088395]/25",
                    loading && "opacity-70 cursor-not-allowed"
                  )}
                >
                  <div className="relative flex items-center justify-center gap-2 rounded-[11px] bg-gradient-to-r from-[#088395] to-[#09637E] px-6 py-3.5 text-base font-semibold text-white transition-all hover:from-[#09637E] hover:to-[#088395]">
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Sedang masuk...
                      </>
                    ) : (
                      <>
                        Masuk
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </div>
                </button>

                {/* Demo Accounts */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400">Akun Demo</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setUsername('admin');
                      setPassword('admin123');
                    }}
                    className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUsername('student');
                      setPassword('student123');
                    }}
                    className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Siswa
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-8 text-center">
            <p className="text-zinc-500 dark:text-zinc-500">
              Belum punya akun?{' '}
              <Link href="/register" className="text-[#088395] hover:text-[#09637E] font-medium transition-colors">
                Buat akun
              </Link>
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-zinc-400 dark:text-zinc-600 mt-8">
            Dengan masuk, Anda menyetujui{' '}
            <Link href="/terms" className="text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-400 transition-colors">Syarat</Link>
            {' '}dan{' '}
            <Link href="/privacy" className="text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-400 transition-colors">Kebijakan Privasi</Link> kami
          </p>
        </div>
      </div>
    </div>
  );
}
