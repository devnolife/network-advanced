'use client';

import { cn } from '@/lib/utils';
import { Shield, User, Lock, Eye, EyeOff, ArrowRight, Loader2, Sparkles, Zap, Globe } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen bg-zinc-950 flex overflow-hidden">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-linear-to-br from-cyan-950 via-zinc-900 to-violet-950 p-12 flex-col justify-between">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse [animation-delay:2s]" />

          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

          {/* Floating Elements */}
          <div className="absolute top-20 right-20 w-3 h-3 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.5s]" />
          <div className="absolute top-40 left-20 w-2 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:1s]" />
          <div className="absolute bottom-40 right-32 w-4 h-4 bg-blue-400 rounded-full animate-bounce [animation-delay:1.5s]" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-white">
              Cyber<span className="text-cyan-400">Nexus</span>
            </span>
          </Link>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
              Master Network Security<br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-violet-400">
                Through Practice
              </span>
            </h2>
            <p className="text-lg text-zinc-400 max-w-md">
              Join thousands of learners building real-world cybersecurity skills in our immersive virtual lab environment.
            </p>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-zinc-300">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              Lab Interaktif
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-zinc-300">
              <Zap className="h-4 w-4 text-yellow-400" />
              Simulasi Real-time
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-zinc-300">
              <Globe className="h-4 w-4 text-violet-400" />
              Komunitas Global
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-zinc-500">
          © 2025 CyberNexus. Hak cipta dilindungi.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">
                Cyber<span className="text-cyan-400">Nexus</span>
              </span>
            </Link>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Selamat Datang Kembali
            </h1>
            <p className="text-zinc-400">
              Masukkan kredensial untuk mengakses akun Anda
            </p>
          </div>

          {/* Login Form Card */}
          <div className="relative">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-linear-to-r from-cyan-500/20 via-transparent to-violet-500/20 rounded-3xl blur-xl opacity-50" />

            <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-xl p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 flex items-center gap-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    {error}
                  </div>
                )}

                {/* Username Field */}
                <div className="space-y-2">
                  <label htmlFor="username" className="block text-sm font-medium text-zinc-300">
                    Nama Pengguna
                  </label>
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-linear-to-r from-cyan-500 to-violet-500 rounded-xl opacity-0 group-focus-within:opacity-100 blur transition-opacity" />
                    <div className="relative flex items-center">
                      <User className="absolute left-4 h-5 w-5 text-zinc-500 group-focus-within:text-cyan-400 transition-colors" />
                      <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Masukkan nama pengguna"
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 pl-12 pr-4 py-3.5 text-white placeholder:text-zinc-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
                    Kata Sandi
                  </label>
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-linear-to-r from-cyan-500 to-violet-500 rounded-xl opacity-0 group-focus-within:opacity-100 blur transition-opacity" />
                    <div className="relative flex items-center">
                      <Lock className="absolute left-4 h-5 w-5 text-zinc-500 group-focus-within:text-cyan-400 transition-colors" />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 pl-12 pr-12 py-3.5 text-white placeholder:text-zinc-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 text-zinc-500 hover:text-zinc-300 transition-colors"
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
                      <div className="w-5 h-5 rounded-md border-2 border-zinc-600 bg-zinc-800 peer-checked:bg-cyan-500 peer-checked:border-cyan-500 transition-all" />
                      <svg className="absolute top-1 left-1 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 12 12">
                        <path d="M3.5 6L5.5 8L8.5 4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">Ingat saya</span>
                  </label>
                  <Link href="/forgot-password" className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                    Lupa kata sandi?
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "relative w-full group overflow-hidden rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 p-px",
                    loading && "opacity-70 cursor-not-allowed"
                  )}
                >
                  <div className="relative flex items-center justify-center gap-2 rounded-[11px] bg-linear-to-r from-cyan-500 to-blue-600 px-6 py-3.5 text-base font-semibold text-white transition-all group-hover:bg-transparent">
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
              </form>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-8 text-center">
            <p className="text-zinc-500">
              Belum punya akun?{' '}
              <Link href="/register" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                Buat akun
              </Link>
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-zinc-600 mt-8">
            Dengan masuk, Anda menyetujui{' '}
            <Link href="/terms" className="text-zinc-500 hover:text-zinc-400 transition-colors">Syarat</Link>
            {' '}dan{' '}
            <Link href="/privacy" className="text-zinc-500 hover:text-zinc-400 transition-colors">Kebijakan Privasi</Link> kami
          </p>
        </div>
      </div>
    </div>
  );
}
