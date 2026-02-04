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
  FlaskConical,
  BarChart2,
  Radio,
  FolderOpen,
  Check,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  Trash2,
  ExternalLink,
  Sun,
  Moon,
  RefreshCw,
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  role: string;
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
  category: string;
}

const sidebarItems = [
  { name: 'Dashboard', href: '/dashboard/admin', icon: Home },
  { name: 'Monitoring', href: '/dashboard/admin/monitoring', icon: Radio },
  { name: 'Pengguna', href: '/dashboard/admin/users', icon: Users },
  { name: 'Kelas', href: '/dashboard/admin/classes', icon: FolderOpen },
  { name: 'Lab', href: '/dashboard/admin/labs', icon: FlaskConical },
  { name: 'Siswa', href: '/dashboard/admin/students', icon: GraduationCap },
  { name: 'Laporan', href: '/dashboard/admin/reports', icon: FileText },
  { name: 'Analitik', href: '/dashboard/admin/analytics', icon: BarChart2 },
  { name: 'Pengaturan', href: '/dashboard/admin/settings', icon: Settings },
];

const NOTIFICATION_POLL_INTERVAL = 30000; // 30 seconds

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications');
      const data = await res.json();
      
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, []);

  // Handle notification actions
  const handleNotificationAction = async (action: string, id?: string, notification?: Partial<Notification>) => {
    setNotificationLoading(true);
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, id, notification }),
      });
      const data = await res.json();
      
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error handling notification action:', error);
    } finally {
      setNotificationLoading(false);
    }
  };

  const markAsRead = (id: string) => handleNotificationAction('mark_read', id);
  const markAllAsRead = () => handleNotificationAction('mark_all_read');
  const deleteNotification = (id: string) => handleNotificationAction('delete', id);
  const clearAllNotifications = () => handleNotificationAction('clear_all');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          // Redirect if not admin
          if (data.user.role !== 'ADMIN') {
            router.push('/dashboard/student');
          } else {
            // Fetch notifications for admin
            fetchNotifications();
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
  }, [router, fetchNotifications]);

  // Poll notifications
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      pollRef.current = setInterval(fetchNotifications, NOTIFICATION_POLL_INTERVAL);
    }
    
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [user, fetchNotifications]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle dark mode
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

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-500" />;
      default:
        return <Info className="w-5 h-5 text-[#088395]" />;
    }
  };

  const getNotificationBg = (type: Notification['type'], read: boolean) => {
    if (read) return 'bg-transparent';
    switch (type) {
      case 'success':
        return 'bg-emerald-500/5';
      case 'warning':
        return 'bg-amber-500/5';
      case 'error':
        return 'bg-rose-500/5';
      default:
        return 'bg-[#088395]/5';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const now = Date.now();
    const time = new Date(timestamp).getTime();
    const diff = now - time;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    return `${days} hari lalu`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#088395]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transform transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#088395] to-[#09637E]">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-zinc-900 dark:text-white">CyberNexus</span>
            <p className="text-xs text-zinc-500">Panel Admin</p>
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
                    ? 'bg-[#088395]/10 text-[#088395] border border-[#088395]/20'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
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
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
          >
            <LogOut className="h-5 w-5" />
            Keluar
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
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {sidebarOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>

              {/* Search */}
              <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-80">
                <Search className="h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Cari..."
                  className="bg-transparent border-none outline-none text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 w-full"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
                title={darkMode ? 'Light Mode' : 'Dark Mode'}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              {/* Notifications */}
              <div className="relative" ref={notificationRef}>
                <button 
                  onClick={() => setNotificationOpen(!notificationOpen)}
                  className="relative p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Notifikasi"
                >
                  <Bell className="h-5 w-5 text-zinc-500" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {notificationOpen && (
                  <div className="absolute right-0 mt-2 w-96 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-zinc-900 dark:text-white">Notifikasi</h3>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-rose-500/10 text-rose-500">
                            {unreadCount} baru
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => fetchNotifications()}
                          className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                          title="Refresh"
                        >
                          <RefreshCw className={cn("w-4 h-4", notificationLoading && "animate-spin")} />
                        </button>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-[#088395] hover:underline"
                          >
                            Tandai semua dibaca
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="text-center py-8">
                          <Bell className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
                          <p className="text-sm text-zinc-500">Tidak ada notifikasi</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={cn(
                              "px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0 transition-colors",
                              getNotificationBg(notification.type, notification.read),
                              !notification.read && "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                            )}
                          >
                            <div className="flex gap-3">
                              <div className="flex-shrink-0 mt-0.5">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className={cn(
                                    "text-sm",
                                    notification.read 
                                      ? "font-medium text-zinc-700 dark:text-zinc-300" 
                                      : "font-semibold text-zinc-900 dark:text-white"
                                  )}>
                                    {notification.title}
                                  </h4>
                                  <button
                                    onClick={() => deleteNotification(notification.id)}
                                    className="p-1 rounded text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 line-clamp-2">
                                  {notification.message}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatTimestamp(notification.timestamp)}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {!notification.read && (
                                      <button
                                        onClick={() => markAsRead(notification.id)}
                                        className="text-[10px] text-[#088395] hover:underline"
                                      >
                                        Tandai dibaca
                                      </button>
                                    )}
                                    {notification.link && (
                                      <Link
                                        href={notification.link}
                                        onClick={() => {
                                          markAsRead(notification.id);
                                          setNotificationOpen(false);
                                        }}
                                        className="text-[10px] text-[#088395] hover:underline flex items-center gap-0.5"
                                      >
                                        Lihat
                                        <ExternalLink className="w-2.5 h-2.5" />
                                      </Link>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                      <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                        <button
                          onClick={clearAllNotifications}
                          className="text-xs text-zinc-500 hover:text-rose-500 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Hapus semua
                        </button>
                        <Link
                          href="/dashboard/admin/settings?tab=notifications"
                          className="text-xs text-[#088395] hover:underline"
                          onClick={() => setNotificationOpen(false)}
                        >
                          Pengaturan notifikasi
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 pl-4 ml-2 border-l border-zinc-200 dark:border-zinc-800"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#088395] to-[#09637E] flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.name?.charAt(0) || 'A'}
                    </span>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">
                      {user?.name || 'Administrator'}
                    </p>
                    <p className="text-xs text-zinc-500">{user?.role || 'Admin'}</p>
                  </div>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-zinc-500 transition-transform",
                    userMenuOpen && "rotate-180"
                  )} />
                </button>

                {/* User Menu Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">{user?.name}</p>
                      <p className="text-xs text-zinc-500">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/dashboard/admin/settings"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        Pengaturan
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
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
        <main>{children}</main>
      </div>
    </div>
  );
}
