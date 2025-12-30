'use client';

import React, { useState, use } from 'react';
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
  Lock
} from 'lucide-react';

// Sample lab data - in production this would come from API
const labData = {
  id: 1,
  title: 'Review Dasar Keamanan Jaringan',
  description: 'Pelajari konsep keamanan jaringan, siapkan lingkungan lab, dan konfigurasi perangkat dasar. Pelajari navigasi CLI, konfigurasi IP, dan pengujian konektivitas.',
  difficulty: 'Pemula',
  duration: '30 menit',
  xp: 100,
  objectives: [
    'Navigasi antarmuka lab dan terminal CLI',
    'Konfigurasi alamat IP pada perangkat jaringan',
    'Memahami konsep dasar routing',
    'Uji konektivitas jaringan menggunakan ping dan traceroute'
  ],
  tasks: [
    {
      id: 't1-1',
      title: 'Akses CLI Router',
      description: 'Buka terminal untuk Router1 dan masuk ke mode privileged menggunakan perintah "enable"',
      points: 10,
      completed: true,
      hint: 'Klik pada Router1 di topologi, lalu ketik "enable" di terminal'
    },
    {
      id: 't1-2',
      title: 'Lihat Status Interface',
      description: 'Gunakan perintah "show ip interface brief" untuk melihat semua interface',
      points: 15,
      completed: true,
      hint: 'Setelah masuk mode privileged, ketik "show ip interface brief"'
    },
    {
      id: 't1-3',
      title: 'Konfigurasi Alamat IP PC1',
      description: 'Atur alamat IP PC1 ke 10.1.1.2 dengan mask 255.255.255.0 dan gateway 10.1.1.1',
      points: 20,
      completed: false,
      hint: 'Gunakan perintah "ip address" diikuti IP dan mask'
    },
    {
      id: 't1-4',
      title: 'Uji Konektivitas',
      description: 'Ping dari PC1 ke PC2 untuk memverifikasi konektivitas jaringan',
      points: 25,
      completed: false,
      hint: 'Gunakan "ping 10.2.1.2" dari terminal PC1'
    }
  ],
  topology: {
    devices: [
      { id: 'pc1', type: 'pc', name: 'PC1', x: 100, y: 200 },
      { id: 'router1', type: 'router', name: 'Router1', x: 400, y: 200 },
      { id: 'pc2', type: 'pc', name: 'PC2', x: 700, y: 200 }
    ],
    links: [
      { source: 'pc1', target: 'router1' },
      { source: 'router1', target: 'pc2' }
    ]
  }
};

interface PageProps {
  params: Promise<{ labId: string }>;
}

export default function LabDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const [activeTab, setActiveTab] = useState<'tasks' | 'topology' | 'terminal'>('tasks');
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    '> Selamat datang di Terminal Lab Keamanan Jaringan',
    '> Ketik "help" untuk perintah yang tersedia',
    ''
  ]);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [showHint, setShowHint] = useState<string | null>(null);

  const completedTasks = labData.tasks.filter(t => t.completed).length;
  const totalPoints = labData.tasks.reduce((sum, t) => sum + t.points, 0);
  const earnedPoints = labData.tasks.filter(t => t.completed).reduce((sum, t) => sum + t.points, 0);
  const progress = Math.round((completedTasks / labData.tasks.length) * 100);

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    setTerminalHistory(prev => [...prev, `$ ${terminalInput}`, 'Perintah berhasil dijalankan.', '']);
    setTerminalInput('');
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
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <a href="/labs" title="Back to Labs" className="p-2 rounded-xl bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/50 transition-all duration-300 hover:scale-105">
                <ArrowLeft className="w-5 h-5 text-zinc-300" />
              </a>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-500">Lab {resolvedParams.labId}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border text-emerald-400 bg-emerald-500/10 border-emerald-500/30">
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
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                <Clock className="w-4 h-4 text-zinc-500" />
                <span className="text-sm text-zinc-400">{labData.duration}</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-amber-400">{labData.xp} XP</span>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-900 font-semibold transition-all duration-300 hover:scale-105">
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
                    <p className="text-sm text-zinc-500">{completedTasks} dari {labData.tasks.length} tugas selesai</p>
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
        <div className="flex gap-1 p-1 mb-6 bg-zinc-800/50 rounded-xl border border-zinc-700/50 w-fit">
          {[
            { id: 'tasks', label: 'Tugas', icon: CheckCircle2 },
            { id: 'topology', label: 'Topologi', icon: Network },
            { id: 'terminal', label: 'Terminal', icon: Terminal }
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
                      className={`group rounded-2xl border transition-all duration-300 ${task.completed
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
                          <div className={`p-2 rounded-xl ${task.completed
                            ? 'bg-emerald-500/20 border border-emerald-500/30'
                            : 'bg-zinc-800/50 border border-zinc-700/50'
                            }`}>
                            {task.completed ? (
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
                            <h4 className={`font-semibold ${task.completed ? 'text-emerald-400' : 'text-white'}`}>
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
                                  setShowHint(showHint === task.id ? null : task.id);
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                              >
                                <Lightbulb className="w-4 h-4" />
                                {showHint === task.id ? 'Sembunyikan Petunjuk' : 'Tampilkan Petunjuk'}
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
                    <span className="text-sm font-medium text-zinc-400">
                      {selectedDevice ? labData.topology.devices.find(d => d.id === selectedDevice)?.name : 'Router1'} - Terminal
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button title="Toggle Code View" className="p-1.5 rounded-lg hover:bg-zinc-700/50 text-zinc-500 hover:text-white transition-colors">
                      <Code2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Terminal Output */}
                <div className="p-4 font-mono text-sm bg-zinc-950 min-h-[400px] max-h-[500px] overflow-y-auto">
                  {terminalHistory.map((line, i) => (
                    <div key={i} className={`${line.startsWith('$') ? 'text-cyan-400' : line.startsWith('>') ? 'text-emerald-400' : 'text-zinc-400'}`}>
                      {line || '\u00A0'}
                    </div>
                  ))}

                  {/* Input */}
                  <form onSubmit={handleTerminalSubmit} className="flex items-center mt-2">
                    <span className="text-cyan-400 mr-2">$</span>
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
                  <span className="text-sm font-bold text-white">{completedTasks}/{labData.tasks.length}</span>
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
