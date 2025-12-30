'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Settings,
  User,
  Lock,
  Bell,
  Moon,
  Sun,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Save,
} from 'lucide-react';

interface UserProfile {
  id: string;
  username: string;
  name: string;
  role: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'notifications' | 'appearance'>('profile');

  // Profile form
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [labReminders, setLabReminders] = useState(true);
  const [achievementNotifications, setAchievementNotifications] = useState(true);

  // Appearance
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/me');
      const data = await res.json();

      if (data.user) {
        setProfile(data.user);
        setName(data.user.name);
        setUsername(data.user.username);
      } else {
        throw new Error('Not authenticated');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const res = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage('Profile updated successfully!');
        setProfile(data.user);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Memuat pengaturan...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error || 'Tidak terautentikasi'}</p>
          <Link href="/login" className="btn btn-primary">
            Ke Halaman Masuk
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-zinc-800">
          <Settings className="w-5 h-5 text-zinc-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Pengaturan</h1>
          <p className="text-sm text-zinc-500">Kelola akunmu</p>
        </div>
      </div>

      <div className="max-w-3xl">
        {/* Horizontal Tabs */}
        <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl mb-6 overflow-x-auto">
          {[
            { id: 'profile', label: 'Profil', icon: User },
            { id: 'password', label: 'Kata Sandi', icon: Lock },
            { id: 'notifications', label: 'Notifikasi', icon: Bell },
            { id: 'appearance', label: 'Tampilan', icon: Moon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as typeof activeTab);
                setError(null);
                setSuccessMessage(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-3 text-emerald-400">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            {successMessage}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              Informasi Profil
            </h2>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  placeholder="Nama lengkapmu"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Nama Pengguna
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  placeholder="Nama penggunamu"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Peran
                </label>
                <input
                  type="text"
                  value={profile.role}
                  disabled
                  placeholder="Peran"
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-500 capitalize"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                Simpan Perubahan
              </button>
            </form>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Lock className="w-5 h-5 text-cyan-400" />
              Ubah Kata Sandi
            </h2>
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Kata Sandi Saat Ini
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 pr-12"
                    placeholder="Masukkan kata sandi saat ini"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                    aria-label="Toggle password visibility"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 pr-12"
                    placeholder="Masukkan kata sandi baru"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                    aria-label="Toggle password visibility"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Konfirmasi Kata Sandi Baru
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  placeholder="Konfirmasi kata sandi baru"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Lock className="w-5 h-5" />
                )}
                Ubah Kata Sandi
              </button>
            </form>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Bell className="w-5 h-5 text-cyan-400" />
              Preferensi Notifikasi
            </h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notifikasi Email</p>
                  <p className="text-sm text-zinc-500">Terima pembaruan via email</p>
                </div>
                <button
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={`w-12 h-7 rounded-full transition-colors ${emailNotifications ? 'bg-cyan-500' : 'bg-zinc-700'
                    }`}
                  aria-label="Toggle email notifications"
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${emailNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Pengingat Lab</p>
                  <p className="text-sm text-zinc-500">Diingatkan tentang lab yang belum selesai</p>
                </div>
                <button
                  onClick={() => setLabReminders(!labReminders)}
                  className={`w-12 h-7 rounded-full transition-colors ${labReminders ? 'bg-cyan-500' : 'bg-zinc-700'
                    }`}
                  aria-label="Toggle lab reminders"
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${labReminders ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Peringatan Pencapaian</p>
                  <p className="text-sm text-zinc-500">Diberitahu saat membuka pencapaian</p>
                </div>
                <button
                  onClick={() => setAchievementNotifications(!achievementNotifications)}
                  className={`w-12 h-7 rounded-full transition-colors ${achievementNotifications ? 'bg-cyan-500' : 'bg-zinc-700'
                    }`}
                  aria-label="Toggle achievement notifications"
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${achievementNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-6">
              Catatan: Preferensi notifikasi disimpan secara lokal untuk keperluan demo.
            </p>
          </div>
        )}

        {/* Appearance Tab */}
        {activeTab === 'appearance' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Moon className="w-5 h-5 text-cyan-400" />
              Tampilan
            </h2>
            <div>
              <p className="text-sm text-zinc-400 mb-4">Pilih tema yang kamu sukai</p>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setTheme('dark')}
                  className={`p-4 rounded-lg border-2 transition-colors ${theme === 'dark'
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-zinc-700 hover:border-zinc-600'
                    }`}
                >
                  <Moon className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">Gelap</p>
                </button>
                <button
                  onClick={() => setTheme('light')}
                  className={`p-4 rounded-lg border-2 transition-colors ${theme === 'light'
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-zinc-700 hover:border-zinc-600'
                    }`}
                >
                  <Sun className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">Terang</p>
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`p-4 rounded-lg border-2 transition-colors ${theme === 'system'
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-zinc-700 hover:border-zinc-600'
                    }`}
                >
                  <Settings className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">Sistem</p>
                </button>
              </div>
              <p className="text-xs text-zinc-500 mt-4">
                Catatan: Pengaturan tema disimpan secara lokal. Saat ini hanya mode gelap yang sepenuhnya ditata.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
