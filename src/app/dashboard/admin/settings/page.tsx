'use client';

import { cn } from '@/lib/utils';
import {
  Settings,
  User,
  Lock,
  Bell,
  Palette,
  Database,
  Shield,
  Save,
  Loader2,
  Check,
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface AdminSettings {
  siteName: string;
  siteDescription: string;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  maxLoginAttempts: number;
  sessionTimeout: number;
  maintenanceMode: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AdminSettings>({
    siteName: 'CyberNexus',
    siteDescription: 'Network Security Learning Platform',
    allowRegistration: true,
    requireEmailVerification: false,
    maxLoginAttempts: 5,
    sessionTimeout: 60,
    maintenanceMode: false,
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications'>('general');

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'Umum', icon: Settings },
    { id: 'security', label: 'Keamanan', icon: Shield },
    { id: 'notifications', label: 'Notifikasi', icon: Bell },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Pengaturan</h1>
          <p className="text-zinc-400">Konfigurasi pengaturan dan preferensi platform</p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors",
            saved
              ? "bg-emerald-500 text-white"
              : "bg-cyan-500 text-white hover:bg-cyan-400"
          )}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : saved ? (
            <Check className="h-5 w-5" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          {saved ? 'Tersimpan!' : 'Simpan Perubahan'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-zinc-800 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-cyan-500/10 text-cyan-400"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Informasi Situs</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Nama Situs
                </label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  placeholder="Masukkan nama situs"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Deskripsi Situs
                </label>
                <textarea
                  value={settings.siteDescription}
                  onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                  rows={3}
                  placeholder="Masukkan deskripsi situs"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Pendaftaran</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-800/50">
                <div>
                  <p className="font-medium text-white">Izinkan Pendaftaran</p>
                  <p className="text-sm text-zinc-500">Aktifkan pendaftaran pengguna baru</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, allowRegistration: !settings.allowRegistration })}
                  title="Toggle Allow Registration"
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    settings.allowRegistration ? "bg-cyan-500" : "bg-zinc-700"
                  )}
                >
                  <span className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                    settings.allowRegistration ? "left-7" : "left-1"
                  )} />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-800/50">
                <div>
                  <p className="font-medium text-white">Wajib Verifikasi Email</p>
                  <p className="text-sm text-zinc-500">Pengguna harus memverifikasi email sebelum akses</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, requireEmailVerification: !settings.requireEmailVerification })}
                  title="Toggle Require Email Verification"
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    settings.requireEmailVerification ? "bg-cyan-500" : "bg-zinc-700"
                  )}
                >
                  <span className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                    settings.requireEmailVerification ? "left-7" : "left-1"
                  )} />
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Pemeliharaan</h3>
            <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-800/50">
              <div>
                <p className="font-medium text-white">Mode Pemeliharaan</p>
                <p className="text-sm text-zinc-500">Nonaktifkan akses platform sementara</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                title="Toggle Maintenance Mode"
                className={cn(
                  "w-12 h-6 rounded-full transition-colors relative",
                  settings.maintenanceMode ? "bg-red-500" : "bg-zinc-700"
                )}
              >
                <span className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                  settings.maintenanceMode ? "left-7" : "left-1"
                )} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Keamanan Login</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Percobaan Login Maksimal
                </label>
                <input
                  type="number"
                  value={settings.maxLoginAttempts}
                  onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) })}
                  min={1}
                  max={10}
                  placeholder="5"
                  className="w-full max-w-xs px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
                <p className="text-sm text-zinc-500 mt-2">Jumlah percobaan gagal sebelum dikunci</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Batas Waktu Sesi (menit)
                </label>
                <input
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                  min={15}
                  max={480}
                  placeholder="60"
                  className="w-full max-w-xs px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
                <p className="text-sm text-zinc-500 mt-2">Waktu sebelum sesi tidak aktif kedaluwarsa</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Kebijakan Kata Sandi</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50">
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="text-zinc-300">Minimal 8 karakter</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50">
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="text-zinc-300">Setidaknya satu huruf kapital</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50">
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="text-zinc-300">Setidaknya satu angka</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Settings */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Notifikasi Email</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-800/50">
                <div>
                  <p className="font-medium text-white">Pendaftaran Pengguna Baru</p>
                  <p className="text-sm text-zinc-500">Notifikasi saat pengguna baru mendaftar</p>
                </div>
                <button title="Toggle New User Registration Notification" className="w-12 h-6 rounded-full bg-cyan-500 relative">
                  <span className="absolute top-1 left-7 w-4 h-4 bg-white rounded-full" />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-800/50">
                <div>
                  <p className="font-medium text-white">Penyelesaian Lab</p>
                  <p className="text-sm text-zinc-500">Notifikasi saat siswa menyelesaikan lab</p>
                </div>
                <button title="Toggle Lab Completion Notification" className="w-12 h-6 rounded-full bg-zinc-700 relative">
                  <span className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full" />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-800/50">
                <div>
                  <p className="font-medium text-white">Peringatan Sistem</p>
                  <p className="text-sm text-zinc-500">Notifikasi sistem penting</p>
                </div>
                <button title="Toggle System Alerts" className="w-12 h-6 rounded-full bg-cyan-500 relative">
                  <span className="absolute top-1 left-7 w-4 h-4 bg-white rounded-full" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
