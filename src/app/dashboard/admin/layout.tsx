'use client';

import { cn } from '@/lib/utils';
import {
  Shield,
  Users,
  BookOpen,
  Settings,
  BarChart3,
  LogOut,
  Menu,
  X,
  Home,
  GraduationCap,
  FileText,
  Bell,
  Search,
  ChevronDown,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  role: string;
}

const sidebarItems = [
  { name: 'Dashboard', href: '/dashboard/admin', icon: Home },
  { name: 'Users', href: '/dashboard/admin/users', icon: Users },
  { name: 'Labs', href: '/dashboard/admin/labs', icon: BookOpen },
  { name: 'Students', href: '/dashboard/admin/students', icon: GraduationCap },
  { name: 'Reports', href: '/dashboard/admin/reports', icon: FileText },
  { name: 'Analytics', href: '/dashboard/admin/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/admin/settings', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          // Redirect if not admin
          if (data.user.role !== 'ADMIN') {
            router.push('/dashboard/student');
          }
        } else {
          router.push('/login');
        }
        setLoading(false);
      })
      .catch(() => {
        router.push('/login');
        setLoading(false);
      });
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-zinc-900 border-r border-zinc-800 transform transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-zinc-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-cyan-500 to-blue-600">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-white">CyberNexus</span>
            <p className="text-xs text-zinc-500">Admin Panel</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {sidebarItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard/admin' &&
                pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-zinc-800"
              >
                {sidebarOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>

              {/* Search */}
              <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 w-80">
                <Search className="h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent border-none outline-none text-sm text-zinc-100 placeholder-zinc-500 w-full"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 rounded-lg hover:bg-zinc-800">
                <Bell className="h-5 w-5 text-zinc-400" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-cyan-500 rounded-full"></span>
              </button>

              {/* User Menu */}
              <div className="flex items-center gap-3 pl-4 border-l border-zinc-800">
                <div className="w-9 h-9 rounded-full bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.name?.charAt(0) || 'A'}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-white">
                    {user?.name || 'Administrator'}
                  </p>
                  <p className="text-xs text-zinc-500">{user?.role || 'Admin'}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-zinc-500" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main>{children}</main>
      </div>
    </div>
  );
}
