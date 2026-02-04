'use client';

import { cn } from '@/lib/utils';
import {
  Shield,
  BookOpen,
  Trophy,
  LogOut,
  Menu,
  X,
  Home,
  User,
  Settings,
  Bell,
  FlaskConical,
  Medal,
  Calendar,
  Search,
  ChevronDown,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface UserData {
  id: string;
  username: string;
  name: string;
  role: string;
}

const sidebarItems = [
  { name: 'Dashboard', href: '/dashboard/student', icon: Home },
  { name: 'Lab Saya', href: '/dashboard/student/labs', icon: FlaskConical },
  { name: 'Papan Peringkat', href: '/dashboard/student/leaderboard', icon: Medal },
  { name: 'Jadwal', href: '/dashboard/student/schedule', icon: Calendar },
  { name: 'Pencapaian', href: '/dashboard/student/achievements', icon: Trophy },
  { name: 'Profil', href: '/dashboard/student/profile', icon: User },
  { name: 'Pengaturan', href: '/dashboard/student/settings', icon: Settings },
];

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        } else {
          router.push('/login');
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        router.push('/login');
      });
  }, [router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#088395]"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-zinc-100">
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(8,131,149,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(8,131,149,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[280px] transform transition-all duration-300 lg:translate-x-0 p-3',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-full rounded-2xl bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50 flex flex-col overflow-hidden">
          {/* Logo */}
          <div className="p-5">
            <Link href="/dashboard/student" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#088395] to-[#09637E] shadow-lg shadow-[#088395]/20">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-white">CyberNexus</span>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Portal Siswa</p>
              </div>
            </Link>
          </div>

          {/* User Card */}
          <div className="mx-4 mb-4 p-3 rounded-xl bg-gradient-to-r from-[#088395]/10 to-[#09637E]/10 border border-[#088395]/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#088395] to-[#09637E] flex items-center justify-center text-white font-bold shadow-lg">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-zinc-500">@{user.username}</p>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] font-medium text-emerald-400">Pro</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
            <p className="px-3 py-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Menu Utama</p>
            {sidebarItems.slice(0, 5).map((item) => {
              const isActive =
                item.href === '/dashboard/student'
                  ? pathname === '/dashboard/student'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative group',
                    isActive
                      ? 'bg-[#088395]/15 text-[#088395]'
                      : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#088395] rounded-r-full" />
                  )}
                  <div className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    isActive ? "bg-[#088395]/20" : "bg-zinc-800/50 group-hover:bg-zinc-700/50"
                  )}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  {item.name}
                </Link>
              );
            })}

            <p className="px-3 py-2 mt-4 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Akun</p>
            {sidebarItems.slice(5).map((item) => {
              const isActive = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative group',
                    isActive
                      ? 'bg-[#088395]/15 text-[#088395]'
                      : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#088395] rounded-r-full" />
                  )}
                  <div className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    isActive ? "bg-[#088395]/20" : "bg-zinc-800/50 group-hover:bg-zinc-700/50"
                  )}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-3 mt-auto">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all group"
            >
              <div className="p-1.5 rounded-lg bg-zinc-800/50 group-hover:bg-rose-500/20 transition-colors">
                <LogOut className="h-4 w-4" />
              </div>
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="lg:pl-[280px] min-h-screen flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 p-3 lg:p-4">
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/50 px-4 lg:px-6 py-3">
            {/* Left Side */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl hover:bg-zinc-800/50 text-zinc-400 hover:text-white transition-colors"
                aria-label="Buka menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Search */}
              <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700/50 w-72 group focus-within:border-[#088395]/50 transition-colors">
                <Search className="h-4 w-4 text-zinc-500 group-focus-within:text-[#088395] transition-colors" />
                <input
                  type="text"
                  placeholder="Cari lab, materi..."
                  className="bg-transparent border-none outline-none text-sm text-zinc-100 placeholder-zinc-500 w-full"
                />
                <kbd className="hidden lg:inline-flex items-center px-2 py-0.5 rounded bg-zinc-700/50 text-[10px] text-zinc-400 font-mono">⌘K</kbd>
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-2">
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-xl hover:bg-zinc-800/50 text-zinc-400 hover:text-white transition-colors"
                title={darkMode ? 'Light Mode' : 'Dark Mode'}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              {/* Notifications */}
              <button 
                className="relative p-2 rounded-xl hover:bg-zinc-800/50 text-zinc-400 hover:text-white transition-colors" 
                aria-label="Notifikasi"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-zinc-900"></span>
              </button>

              {/* Divider */}
              <div className="w-px h-8 bg-zinc-800 mx-2 hidden sm:block" />

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 p-1.5 pr-3 rounded-xl hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#088395] to-[#09637E] flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-[#088395]/20">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-white leading-tight">{user.name}</p>
                    <p className="text-[10px] text-zinc-500">@{user.username}</p>
                  </div>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-zinc-500 transition-transform hidden sm:block",
                    userMenuOpen && "rotate-180"
                  )} />
                </button>

                {/* User Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/50">
                      <p className="text-sm font-medium text-white">{user.name}</p>
                      <p className="text-xs text-zinc-500">@{user.username}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/dashboard/student/profile"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        Profil Saya
                      </Link>
                      <Link
                        href="/dashboard/student/settings"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        Pengaturan
                      </Link>
                    </div>
                    <div className="border-t border-zinc-800">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Keluar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-3 lg:p-4 pt-0">
          <div className="rounded-2xl bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 min-h-[calc(100vh-120px)] overflow-hidden">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
