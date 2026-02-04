'use client';

import React, { useState, use, useEffect, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  Circle,
  Clock,
  Target,
  Trophy,
  Sparkles,
  ChevronRight,
  Lightbulb,
  Terminal,
  BookOpen,
  Eye,
  AlertTriangle,
  Zap,
  HelpCircle,
  Award,
  RotateCcw,
  Send,
  Code2,
  Network,
  Server,
  Monitor,
  ChevronDown,
  ChevronUp,
  Lock,
  ShieldAlert,
  Radio,
  Shield,
  Filter,
  Key,
  Loader2,
} from 'lucide-react';

// Import labs data
import labsData from '@/data/labs.json';
import { useToast } from '@/components/ui/toast';

// Lazy load the packet capture panel
const PacketCapturePanel = lazy(() => import('@/components/capture/PacketCapturePanel').then(m => ({ default: m.PacketCapturePanel })));

// Lazy load the IDS panel
const IDSPanel = lazy(() => import('@/components/ids/IDSPanel').then(m => ({ default: m.IDSPanel })));

// Lazy load the Firewall panel
const FirewallPanel = lazy(() => import('@/components/firewall/FirewallPanel').then(m => ({ default: m.FirewallPanel })));

// Lazy load the VPN panel
const VPNPanel = lazy(() => import('@/components/vpn/VPNPanel').then(m => ({ default: m.VPNPanel })));

// Loading fallback for PacketCapturePanel
function PacketCapturePanelFallback() {
  return (
    <div className="flex items-center justify-center h-full bg-zinc-950">
      <div className="text-center">
        <Radio className="w-12 h-12 text-cyan-500 mx-auto mb-3 animate-pulse" />
        <p className="text-zinc-400 text-sm">Loading Packet Capture...</p>
      </div>
    </div>
  );
}

// Loading fallback for IDSPanel
function IDSPanelFallback() {
  return (
    <div className="flex items-center justify-center h-full bg-zinc-950">
      <div className="text-center">
        <Shield className="w-12 h-12 text-cyan-500 mx-auto mb-3 animate-pulse" />
        <p className="text-zinc-400 text-sm">Loading IDS/IPS Monitor...</p>
      </div>
    </div>
  );
}

// Wrapped component for lazy loading PacketCapturePanel
function PacketCapturePanelLazy() {
  return (
    <Suspense fallback={<PacketCapturePanelFallback />}>
      <PacketCapturePanel className="h-full" />
    </Suspense>
  );
}

// Wrapped component for lazy loading IDSPanel
function IDSPanelLazy() {
  return (
    <Suspense fallback={<IDSPanelFallback />}>
      <IDSPanel className="h-full" />
    </Suspense>
  );
}

// Loading fallback for FirewallPanel
function FirewallPanelFallback() {
  return (
    <div className="flex items-center justify-center h-full bg-zinc-950">
      <div className="text-center">
        <Filter className="w-12 h-12 text-cyan-500 mx-auto mb-3 animate-pulse" />
        <p className="text-zinc-400 text-sm">Loading Firewall/ACL...</p>
      </div>
    </div>
  );
}

// Wrapped component for lazy loading FirewallPanel
function FirewallPanelLazy() {
  return (
    <Suspense fallback={<FirewallPanelFallback />}>
      <FirewallPanel className="h-full" />
    </Suspense>
  );
}

// Loading fallback for VPNPanel
function VPNPanelFallback() {
  return (
    <div className="flex items-center justify-center h-full bg-zinc-950">
      <div className="text-center">
        <Key className="w-12 h-12 text-cyan-500 mx-auto mb-3 animate-pulse" />
        <p className="text-zinc-400 text-sm">Loading VPN/IPSec...</p>
      </div>
    </div>
  );
}

// Wrapped component for lazy loading VPNPanel
function VPNPanelLazy() {
  return (
    <Suspense fallback={<VPNPanelFallback />}>
      <VPNPanel className="h-full" />
    </Suspense>
  );
}

interface PageProps {
  params: Promise<{ labId: string }>;
}

// Helper to get completed labs from localStorage
function getCompletedLabs(): string[] {
  if (typeof window === 'undefined') return ['lab-1', 'lab-2']; // SSR default
  const saved = localStorage.getItem('completedLabs');
  return saved ? JSON.parse(saved) : ['lab-1', 'lab-2']; // Default: Lab 1 & 2 selesai untuk demo
}

// Check if a lab is accessible
function isLabAccessible(labId: string): boolean {
  const lab = labsData.find(l => l.id === labId);
  if (!lab) return false;

  // Lab 1 is always accessible
  if (!lab.prerequisite) return true;

  // Check if prerequisite is completed
  const completedLabs = getCompletedLabs();
  return completedLabs.includes(lab.prerequisite);
}

export default function LabDetailPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const labId = resolvedParams.labId.startsWith('lab-') ? resolvedParams.labId : `lab-${resolvedParams.labId}`;

  // Authentication state
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          // Not authenticated, redirect to login
          router.push(`/login?redirect=/labs/${resolvedParams.labId}`);
        }
      } catch {
        router.push(`/login?redirect=/labs/${resolvedParams.labId}`);
      } finally {
        setIsAuthLoading(false);
      }
    };

    checkAuth();
  }, [router, resolvedParams.labId]);

  // Find lab data from labs.json
  const rawLabData = labsData.find(l => l.id === labId || l.number.toString() === resolvedParams.labId);

  const [isAccessible, setIsAccessible] = useState(true);
  const [completedLabs, setCompletedLabs] = useState<string[]>([]);

  useEffect(() => {
    const completed = getCompletedLabs();
    setCompletedLabs(completed);
    setIsAccessible(isLabAccessible(rawLabData?.id || labId));
  }, [rawLabData?.id, labId]);

  // Convert labs.json format to component format
  const labData = rawLabData ? {
    id: rawLabData.number,
    title: rawLabData.title,
    description: rawLabData.description,
    difficulty: rawLabData.difficulty === 'BEGINNER' ? 'Pemula' : rawLabData.difficulty === 'INTERMEDIATE' ? 'Menengah' : 'Lanjutan',
    duration: `${rawLabData.durationMinutes} menit`,
    xp: rawLabData.maxScore,
    objectives: rawLabData.objectives,
    tasks: rawLabData.tasks.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      points: t.points,
      completed: false, // Would come from user progress
      hint: rawLabData.hints.find(h => h.taskId === t.id)?.content || 'Tidak ada petunjuk tersedia',
      hintCost: rawLabData.hints.find(h => h.taskId === t.id)?.pointCost || 0,
      hintId: rawLabData.hints.find(h => h.taskId === t.id)?.id
    })),
    topology: {
      devices: rawLabData.topology.devices.map(d => ({
        id: d.id,
        type: d.type,
        name: d.name,
        x: d.x,
        y: d.y
      })),
      links: rawLabData.topology.links.map(l => ({
        source: l.source.device,
        target: l.destination.device
      }))
    },
    prerequisite: rawLabData.prerequisite,
    isLocked: rawLabData.isLocked
  } : null;

  const [activeTab, setActiveTab] = useState<'tasks' | 'topology' | 'terminal' | 'capture' | 'security' | 'firewall' | 'vpn'>('tasks');
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [terminalInput, setTerminalInput] = useState('');

  // Separate terminal history for each device
  const [deviceTerminals, setDeviceTerminals] = useState<Record<string, string[]>>({});

  // Get current device's terminal history
  const getCurrentTerminalHistory = () => {
    const deviceId = selectedDevice || labData?.topology.devices[0]?.id || 'router1';
    if (!deviceTerminals[deviceId]) {
      // Initialize with device-specific welcome message
      const device = labData?.topology.devices.find(d => d.id === deviceId);
      const isRouter = device?.type === 'router';
      const deviceName = device?.name || deviceId;

      return isRouter
        ? [
          ``,
          `╔══════════════════════════════════════════════╗`,
          `║  Network Security Virtual Lab - ${deviceName.padEnd(12)}║`,
          `║  Cisco IOS Simulator                         ║`,
          `║  Type 'enable' to enter privileged mode      ║`,
          `╚══════════════════════════════════════════════╝`,
          ``,
          `${deviceName}>`,
        ]
        : [
          ``,
          `╔══════════════════════════════════════════════╗`,
          `║  Virtual PC Console - ${deviceName.padEnd(21)}║`,
          `║  Type 'help' for available commands          ║`,
          `╚══════════════════════════════════════════════╝`,
          ``,
          `${deviceName}:~$`,
        ];
    }
    return deviceTerminals[deviceId];
  };

  // Get prompt based on device type
  const getPrompt = () => {
    const deviceId = selectedDevice || labData?.topology.devices[0]?.id || 'router1';
    const device = labData?.topology.devices.find(d => d.id === deviceId);
    const isRouter = device?.type === 'router';
    const deviceName = device?.name || deviceId;
    return isRouter ? `${deviceName}>` : `${deviceName}:~$`;
  };

  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [showHint, setShowHint] = useState<string | null>(null);

  // Task completion state
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [totalEarnedPoints, setTotalEarnedPoints] = useState(0);
  const [unlockedHints, setUnlockedHints] = useState<Set<string>>(new Set());

  // Toast hook
  const toast = useToast();

  // Load saved progress from localStorage
  useEffect(() => {
    if (rawLabData) {
      const savedProgress = localStorage.getItem(`lab-progress-${rawLabData.id}`);
      if (savedProgress) {
        try {
          const parsed = JSON.parse(savedProgress);
          setCompletedTaskIds(new Set(parsed.completedTasks || []));
          setTotalEarnedPoints(parsed.earnedPoints || 0);
          setUnlockedHints(new Set(parsed.unlockedHints || []));
        } catch (e) {
          console.error('Failed to parse saved progress:', e);
        }
      }
    }
  }, [rawLabData]);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    if (rawLabData) {
      localStorage.setItem(`lab-progress-${rawLabData.id}`, JSON.stringify({
        completedTasks: Array.from(completedTaskIds),
        earnedPoints: totalEarnedPoints,
        unlockedHints: Array.from(unlockedHints)
      }));
    }
  }, [completedTaskIds, totalEarnedPoints, unlockedHints, rawLabData]);


  // Handle hint unlocking
  const handleUnlockHint = (taskId: string, hintId: string | undefined, cost: number) => {
    if (!hintId) return;

    // If already unlocked, just toggle visibility
    if (unlockedHints.has(hintId)) {
      setShowHint(showHint === taskId ? null : taskId);
      return;
    }

    // Confirm unlock (in a real app, maybe a modal, here we just do it)
    // Deduct points
    setTotalEarnedPoints(prev => Math.max(0, prev - cost));
    setUnlockedHints(prev => new Set([...prev, hintId]));
    setShowHint(taskId);

    toast.info(
      'Petunjuk Dibuka',
      `-${cost} poin telah digunakan.`
    );
  };

  // Show auth loading state
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#088395] animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Memverifikasi akses...</p>
        </div>
      </div>
    );
  }

  // Not authenticated (should have redirected, but just in case)
  if (!isAuthenticated) {
    return null;
  }

  // Show loading/not found state
  if (!labData) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <ShieldAlert className="w-16 h-16 text-zinc-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Lab Tidak Ditemukan</h1>
          <p className="text-zinc-400 mb-6">Lab yang Anda cari tidak tersedia.</p>
          <a href="/labs" className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-zinc-900 font-semibold rounded-xl transition-colors">
            Kembali ke Daftar Lab
          </a>
        </div>
      </div>
    );
  }

  // Show locked state if lab is not accessible
  if (!isAccessible) {
    const prerequisiteLab = labsData.find(l => l.id === labData.prerequisite);
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="relative mb-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center">
              <Lock className="w-10 h-10 text-zinc-500" />
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full">
              <span className="text-xs font-medium text-amber-400">Terkunci</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Lab {labData.id}: {labData.title}</h1>
          <p className="text-zinc-400 mb-6">
            Selesaikan <span className="text-cyan-400 font-medium">{prerequisiteLab?.title || 'lab sebelumnya'}</span> terlebih dahulu untuk membuka lab ini.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={`/labs/${labData.prerequisite?.replace('lab-', '')}`}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-zinc-900 font-semibold rounded-xl transition-colors"
            >
              Buka {prerequisiteLab?.title || 'Lab Sebelumnya'}
            </a>
            <a href="/labs" className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl transition-colors border border-zinc-700">
              Kembali ke Daftar
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Calculate progress based on completed tasks from state (not hardcoded)
  const completedTasksCount = labData.tasks.filter(t => completedTaskIds.has(t.id)).length;
  const totalPoints = labData.tasks.reduce((sum, t) => sum + t.points, 0);
  const earnedPoints = totalEarnedPoints;
  const progress = labData.tasks.length > 0
    ? Math.round((completedTasksCount / labData.tasks.length) * 100)
    : 0;

  // Check if a task is completed
  const isTaskCompleted = (taskId: string) => completedTaskIds.has(taskId);


  // Helper to update terminal history for specific device
  const updateTerminalHistory = (deviceId: string, newLines: string[]) => {
    setDeviceTerminals(prev => ({
      ...prev,
      [deviceId]: [...(prev[deviceId] || getCurrentTerminalHistory()), ...newLines]
    }));
  };

  const handleTerminalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const deviceId = selectedDevice || labData.topology.devices[0]?.id || 'router1';
    const device = labData.topology.devices.find(d => d.id === deviceId);
    const isRouter = device?.type === 'router';
    const deviceName = device?.name || deviceId;

    const command = terminalInput.trim();
    const prompt = isRouter ? `${deviceName}>` : `${deviceName}:~$`;

    // Add command to history
    updateTerminalHistory(deviceId, [`${prompt} ${command}`]);
    setTerminalInput('');

    let commandOutput = '';

    try {
      // Execute command
      const response = await fetch('/api/device/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: deviceId,
          command: command,
        }),
      });

      const result = await response.json();

      if (result.error) {
        // Error message - prefix with % for red styling
        updateTerminalHistory(deviceId, [`% ${result.error}`, '']);
        commandOutput = result.error;
      } else if (result.output) {
        // Split output by newlines and add each line
        const outputLines = result.output.split('\n').map((line: string) =>
          line.replace(/\u001b\[[0-9;]*m/g, '')
        );
        updateTerminalHistory(deviceId, [...outputLines, '']);
        commandOutput = result.output;
      } else {
        updateTerminalHistory(deviceId, ['']);
      }

      // Validate task completion
      try {
        const validationResponse = await fetch('/api/task/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            labId: rawLabData?.id || labId,
            deviceId: deviceId,
            command: command,
            commandOutput: commandOutput,
          }),
        });

        const validation = await validationResponse.json();

        if (validation.taskCompleted && validation.taskId) {
          // Check if task was already completed
          if (!completedTaskIds.has(validation.taskId)) {
            // Mark task as completed
            setCompletedTaskIds(prev => new Set([...prev, validation.taskId]));
            setTotalEarnedPoints(prev => prev + (validation.pointsAwarded || 0));

            // Show success toast with points
            toast.points(
              `✅ ${validation.taskTitle || 'Task'} selesai!`,
              validation.pointsAwarded || 0
            );
          }
        }
      } catch (validationError) {
        console.error('Task validation failed:', validationError);
      }

    } catch (error) {
      updateTerminalHistory(deviceId, [`% Error: Tidak dapat menghubungi server`, '']);
      toast.error('Koneksi Gagal', 'Tidak dapat menghubungi server');
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'pc': return Monitor;
      case 'router': return Server;
      default: return Network;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>


      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-950/80 border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 py-4">
            <div className="flex items-center gap-4">
              <a href="/labs" title="Back to Labs" className="p-2.5 rounded-xl bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/50 transition-all duration-300 hover:scale-105">
                <ArrowLeft className="w-5 h-5 text-zinc-300" />
              </a>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-500">Lab lab-{resolvedParams.labId}</span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-medium border text-emerald-400 bg-emerald-500/10 border-emerald-500/30">
                    {labData.difficulty}
                  </span>
                </div>
                <h1 className="text-lg font-bold text-white truncate max-w-[300px] sm:max-w-none">
                  {labData.title}
                </h1>
              </div>
            </div>

            {/* Progress & Actions */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                <Clock className="w-4 h-4 text-zinc-500" />
                <span className="text-sm text-zinc-400">{labData.duration}</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-amber-400">{labData.xp} XP</span>
              </div>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#088395] hover:bg-[#09637E] text-white font-semibold transition-all duration-300 hover:scale-105">
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Reset Lab</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        {/* Progress Section */}
        <div className="mb-6">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border border-zinc-800/50 p-6">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
                    <Target className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Progres Lab</h2>
                    <p className="text-sm text-zinc-500">{completedTasksCount} dari {labData.tasks.length} tugas selesai</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 max-w-md">
                    <div className="relative h-3 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-1000"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-lg font-bold text-cyan-400">{progress}%</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-center px-4 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                  <div className="text-2xl font-bold text-white">{earnedPoints}</div>
                  <div className="text-xs text-zinc-500">/ {totalPoints} pts</div>
                </div>
                {progress === 100 && (
                  <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20">
                    <Trophy className="w-5 h-5" />
                    Selesaikan Lab
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 mb-6 bg-zinc-800/50 rounded-xl border border-zinc-700/50 w-fit flex-wrap">
          {[
            { id: 'tasks', label: 'Tugas', icon: CheckCircle2 },
            { id: 'topology', label: 'Topologi', icon: Network },
            { id: 'terminal', label: 'Terminal', icon: Terminal },
            { id: 'capture', label: 'Capture', icon: Radio },
            { id: 'security', label: 'IDS/IPS', icon: Shield },
            { id: 'firewall', label: 'Firewall', icon: Filter },
            { id: 'vpn', label: 'VPN', icon: Key }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab.id
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Tasks or Content */}
          <div className="lg:col-span-2 space-y-4">
            {activeTab === 'tasks' && (
              <>
                {/* Objectives Card */}
                <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800/50 p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-cyan-400" />
                    Tujuan Pembelajaran
                  </h3>
                  <ul className="space-y-3">
                    {labData.objectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="p-1 rounded-full bg-cyan-500/20 mt-0.5">
                          <ChevronRight className="w-3 h-3 text-cyan-400" />
                        </div>
                        <span className="text-sm text-zinc-300">{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tasks List */}
                <div className="space-y-3">
                  {labData.tasks.map((task, index) => (
                    <div
                      key={task.id}
                      className={`group rounded-2xl border transition-all duration-300 ${isTaskCompleted(task.id)
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : 'bg-zinc-900/80 border-zinc-800/50 hover:border-zinc-700/50'
                        }`}
                    >
                      <div
                        className="p-5 cursor-pointer"
                        onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                      >
                        <div className="flex items-start gap-4">
                          {/* Status Icon */}
                          <div className={`p-2 rounded-xl ${isTaskCompleted(task.id)
                            ? 'bg-emerald-500/20 border border-emerald-500/30'
                            : 'bg-zinc-800/50 border border-zinc-700/50'
                            }`}>
                            {isTaskCompleted(task.id) ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <Circle className="w-5 h-5 text-zinc-500" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-zinc-500">Tugas {index + 1}</span>
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  +{task.points} poin
                                </span>
                              </div>
                              {expandedTask === task.id ? (
                                <ChevronUp className="w-4 h-4 text-zinc-500" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-zinc-500" />
                              )}
                            </div>
                            <h4 className={`font-semibold ${isTaskCompleted(task.id) ? 'text-emerald-400' : 'text-white'}`}>
                              {task.title}
                            </h4>
                            <p className="text-sm text-zinc-400 mt-1">{task.description}</p>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {expandedTask === task.id && (
                          <div className="mt-4 pt-4 border-t border-zinc-800/50">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUnlockHint(task.id, task.hintId, task.hintCost);
                                }}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${unlockedHints.has(task.hintId || '')
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                                  : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-white'
                                  }`}
                              >
                                <Lightbulb className="w-4 h-4" />
                                {unlockedHints.has(task.hintId || '')
                                  ? (showHint === task.id ? 'Sembunyikan Petunjuk' : 'Lihat Petunjuk')
                                  : `Buka Petunjuk (-${task.hintCost} poin)`
                                }
                              </button>
                              {!task.completed && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveTab('terminal');
                                  }}
                                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors"
                                >
                                  <Terminal className="w-4 h-4" />
                                  Buka Terminal
                                </button>
                              )}
                            </div>
                            {showHint === task.id && (
                              <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                <p className="text-sm text-amber-200 flex items-start gap-2">
                                  <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                  {task.hint}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'topology' && (
              <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800/50 p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Network className="w-5 h-5 text-cyan-400" />
                  Topologi Jaringan
                </h3>

                {/* Topology Visualization */}
                <div className="relative bg-zinc-950 rounded-xl border border-zinc-800 p-8 min-h-[400px]">
                  {/* Grid Background */}
                  <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: 'radial-gradient(circle, #06b6d4 1px, transparent 1px)',
                    backgroundSize: '30px 30px'
                  }} />

                  {/* Connection Lines */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {labData.topology.links.map((link, i) => {
                      const source = labData.topology.devices.find(d => d.id === link.source);
                      const target = labData.topology.devices.find(d => d.id === link.target);
                      if (!source || !target) return null;

                      // Normalize positions for display
                      const x1 = (source.x / 800) * 100;
                      const y1 = (source.y / 400) * 100;
                      const x2 = (target.x / 800) * 100;
                      const y2 = (target.y / 400) * 100;

                      return (
                        <line
                          key={i}
                          x1={`${x1}%`}
                          y1={`${y1}%`}
                          x2={`${x2}%`}
                          y2={`${y2}%`}
                          stroke="#06b6d4"
                          strokeWidth="2"
                          strokeDasharray="5,5"
                          className="animate-pulse"
                        />
                      );
                    })}
                  </svg>

                  {/* Devices */}
                  {labData.topology.devices.map((device) => {
                    const DeviceIcon = getDeviceIcon(device.type);
                    const x = (device.x / 800) * 100;
                    const y = (device.y / 400) * 100;

                    return (
                      <div
                        key={device.id}
                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${selectedDevice === device.id
                          ? 'scale-110'
                          : 'hover:scale-105'
                          }`}
                        style={{ left: `${x}%`, top: `${y}%` }}
                        onClick={() => setSelectedDevice(device.id)}
                      >
                        <div className={`relative p-4 rounded-xl border ${selectedDevice === device.id
                          ? 'bg-cyan-500/20 border-cyan-500/50 shadow-lg shadow-cyan-500/20'
                          : 'bg-zinc-800/80 border-zinc-700/50 hover:border-zinc-600/50'
                          }`}>
                          <DeviceIcon className={`w-8 h-8 ${selectedDevice === device.id ? 'text-cyan-400' : 'text-zinc-400'}`} />
                          {selectedDevice === device.id && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping" />
                          )}
                        </div>
                        <div className="text-center mt-2">
                          <span className={`text-sm font-medium ${selectedDevice === device.id ? 'text-cyan-400' : 'text-zinc-400'}`}>
                            {device.name}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Device Info */}
                {selectedDevice && (
                  <div className="mt-4 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-white">
                          {labData.topology.devices.find(d => d.id === selectedDevice)?.name}
                        </h4>
                        <p className="text-sm text-zinc-500">Klik untuk membuka terminal</p>
                      </div>
                      <button
                        onClick={() => setActiveTab('terminal')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors"
                      >
                        <Terminal className="w-4 h-4" />
                        Buka Terminal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'terminal' && (
              <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800/50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/50 border-b border-zinc-700/50">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <select
                      value={selectedDevice || 'router1'}
                      onChange={(e) => setSelectedDevice(e.target.value)}
                      className="bg-zinc-800 text-sm font-medium text-zinc-300 px-2 py-1 rounded-lg border border-zinc-700 focus:outline-none focus:border-cyan-500"
                    >
                      {labData.topology.devices.map((device) => (
                        <option key={device.id} value={device.id}>
                          {device.name} ({device.type})
                        </option>
                      ))}
                    </select>
                    <span className="text-sm text-zinc-500">- Terminal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button title="Toggle Code View" className="p-1.5 rounded-lg hover:bg-zinc-700/50 text-zinc-500 hover:text-white transition-colors">
                      <Code2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Terminal Output */}
                <div className="p-4 font-mono text-sm bg-zinc-950 min-h-[400px] max-h-[500px] overflow-y-auto">
                  {getCurrentTerminalHistory().map((line: string, i: number) => {
                    // Determine line styling
                    let lineClass = 'text-zinc-300'; // default
                    if (line.includes('>') && !line.includes('╔') && !line.includes('║')) {
                      lineClass = 'text-cyan-400 font-semibold'; // Router prompt
                    } else if (line.includes(':~$')) {
                      lineClass = 'text-emerald-400 font-semibold'; // PC prompt
                    } else if (line.startsWith('%') || line.includes('Error') || line.includes('error')) {
                      lineClass = 'text-red-400';
                    } else if (line.includes('✓') || line.includes('success') || line.includes('Success')) {
                      lineClass = 'text-emerald-400';
                    } else if (line.includes('╔') || line.includes('║') || line.includes('╚')) {
                      lineClass = 'text-cyan-500'; // Box drawing
                    } else if (line.startsWith('Interface') || line.startsWith('Codes:') || line.includes('---')) {
                      lineClass = 'text-zinc-500';
                    }

                    return (
                      <div key={i} className={lineClass} style={{ whiteSpace: 'pre-wrap' }}>
                        {line || '\u00A0'}
                      </div>
                    );
                  })}

                  {/* Input */}
                  <form onSubmit={handleTerminalSubmit} className="flex items-center mt-2">
                    <span className="text-cyan-400 mr-2">{getPrompt()}</span>
                    <input
                      type="text"
                      value={terminalInput}
                      onChange={(e) => setTerminalInput(e.target.value)}
                      className="flex-1 bg-transparent outline-none text-white caret-cyan-400"
                      placeholder="Ketik perintah..."
                      autoFocus
                    />
                    <button
                      type="submit"
                      title="Execute Command"
                      className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>

                {/* Quick Commands */}
                <div className="px-4 py-3 bg-zinc-800/30 border-t border-zinc-700/50">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-zinc-500">Cepat:</span>
                    {['enable', 'show ip interface brief', 'configure terminal', 'ping'].map((cmd) => (
                      <button
                        key={cmd}
                        onClick={() => setTerminalInput(cmd)}
                        className="px-2 py-1 rounded-lg text-xs bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                      >
                        {cmd}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'capture' && (
              <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800/50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/50 border-b border-zinc-700/50">
                  <div className="flex items-center gap-3">
                    <Radio className="w-5 h-5 text-cyan-400" />
                    <span className="text-sm font-medium text-white">Packet Capture</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">Analisis lalu lintas jaringan secara real-time</span>
                  </div>
                </div>
                <div className="h-[600px]">
                  <PacketCapturePanelLazy />
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800/50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/50 border-b border-zinc-700/50">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-cyan-400" />
                    <span className="text-sm font-medium text-white">IDS/IPS Security Monitor</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">Deteksi & Pencegahan Intrusi</span>
                  </div>
                </div>
                <div className="p-4">
                  <IDSPanelLazy />
                </div>
              </div>
            )}

            {activeTab === 'firewall' && (
              <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800/50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/50 border-b border-zinc-700/50">
                  <div className="flex items-center gap-3">
                    <Filter className="w-5 h-5 text-cyan-400" />
                    <span className="text-sm font-medium text-white">Firewall / ACL Manager</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">Access Control & Packet Filtering</span>
                  </div>
                </div>
                <div className="p-4">
                  <FirewallPanelLazy />
                </div>
              </div>
            )}

            {activeTab === 'vpn' && (
              <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800/50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/50 border-b border-zinc-700/50">
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5 text-cyan-400" />
                    <span className="text-sm font-medium text-white">VPN / IPSec</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">Virtual Private Network & Encryption</span>
                  </div>
                </div>
                <div className="h-[600px]">
                  <VPNPanelLazy />
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Info & Quick Actions */}
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800/50 p-5">
              <h3 className="text-sm font-semibold text-zinc-400 mb-4">Statistik Lab</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-zinc-300">Tugas Selesai</span>
                  </div>
                  <span className="text-sm font-bold text-white">{completedTasksCount}/{labData.tasks.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span className="text-sm text-zinc-300">Poin Diperoleh</span>
                  </div>
                  <span className="text-sm font-bold text-white">{earnedPoints}/{totalPoints}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm text-zinc-300">Hadiah XP</span>
                  </div>
                  <span className="text-sm font-bold text-amber-400">{labData.xp} XP</span>
                </div>
              </div>
            </div>

            {/* Hints Used */}
            <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800/50 p-5">
              <h3 className="text-sm font-semibold text-zinc-400 mb-4 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                Petunjuk
              </h3>
              <p className="text-sm text-zinc-500 mb-3">
                Menggunakan petunjuk akan mengurangi XP yang diperoleh. Coba selesaikan tugas tanpa petunjuk untuk hadiah maksimal!
              </p>
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-sm text-amber-400">Petunjuk Digunakan</span>
                <span className="text-lg font-bold text-amber-400">0/4</span>
              </div>
            </div>

            {/* Resources */}
            <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800/50 p-5">
              <h3 className="text-sm font-semibold text-zinc-400 mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                Sumber Daya
              </h3>
              <div className="space-y-2">
                {[
                  { icon: Eye, label: 'Lihat Dokumentasi', color: 'text-cyan-400' },
                  { icon: HelpCircle, label: 'Referensi Perintah', color: 'text-purple-400' },
                  { icon: Award, label: 'Panduan Penilaian', color: 'text-amber-400' }
                ].map((item, i) => (
                  <button
                    key={i}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/50 transition-colors text-left"
                  >
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                    <span className="text-sm text-zinc-300">{item.label}</span>
                    <ChevronRight className="w-4 h-4 text-zinc-600 ml-auto" />
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800/50 p-5">
              <h3 className="text-sm font-semibold text-zinc-400 mb-4">Navigasi</h3>
              <div className="space-y-2">
                <a
                  href="/labs"
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/50 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 text-zinc-500" />
                  <span className="text-sm text-zinc-300">Kembali ke Lab</span>
                </a>
                {parseInt(resolvedParams.labId) < 8 && (
                  <a
                    href={`/labs/${parseInt(resolvedParams.labId) + 1}`}
                    className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 transition-colors"
                  >
                    <span className="text-sm text-cyan-400">Lab Berikutnya</span>
                    <ChevronRight className="w-4 h-4 text-cyan-400" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
