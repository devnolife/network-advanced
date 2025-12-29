'use client';

import React, { useState, useEffect } from 'react';
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
  Layers
} from 'lucide-react';

const labs = [
  {
    id: 1,
    title: 'Network Fundamentals',
    description: 'Review network security concepts, configure basic devices, and test connectivity',
    icon: Network,
    difficulty: 'Beginner',
    duration: '30 min',
    topics: ['IP Configuration', 'Routing Basics', 'Connectivity Testing'],
    color: 'from-cyan-500 to-blue-500'
  },
  {
    id: 2,
    title: 'TCP/IP Protocol Analysis',
    description: 'Capture and analyze TCP/IP packets, understand protocol security vulnerabilities',
    icon: Activity,
    difficulty: 'Beginner',
    duration: '45 min',
    topics: ['Packet Capture', 'Protocol Analysis', 'PCAP Export'],
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 3,
    title: 'IPSec VPN Configuration',
    description: 'Configure site-to-site IPSec VPN with IKE phases and ESP encryption',
    icon: Lock,
    difficulty: 'Intermediate',
    duration: '60 min',
    topics: ['IKE Phase 1 & 2', 'Crypto Maps', 'Tunnel Verification'],
    color: 'from-purple-500 to-violet-500'
  },
  {
    id: 4,
    title: 'Next-Gen Firewall',
    description: 'Configure zone-based firewall policies and application-layer filtering',
    icon: Shield,
    difficulty: 'Intermediate',
    duration: '60 min',
    topics: ['Security Zones', 'Firewall Rules', 'NAT Configuration'],
    color: 'from-orange-500 to-red-500'
  },
  {
    id: 5,
    title: 'Access Control Lists',
    description: 'Create standard and extended ACLs for advanced traffic filtering',
    icon: FileCode,
    difficulty: 'Intermediate',
    duration: '45 min',
    topics: ['Standard ACL', 'Extended ACL', 'Time-based ACL'],
    color: 'from-pink-500 to-rose-500'
  },
  {
    id: 6,
    title: 'NAT Security',
    description: 'Implement static, dynamic NAT and PAT for network address translation',
    icon: Wifi,
    difficulty: 'Intermediate',
    duration: '45 min',
    topics: ['Static NAT', 'Dynamic NAT', 'PAT/Overload'],
    color: 'from-amber-500 to-yellow-500'
  },
  {
    id: 7,
    title: 'Intrusion Detection',
    description: 'Deploy IDS sensors, create signatures, and analyze security alerts',
    icon: Eye,
    difficulty: 'Advanced',
    duration: '60 min',
    topics: ['Signature Creation', 'Alert Analysis', 'False Positive Tuning'],
    color: 'from-teal-500 to-cyan-500'
  },
  {
    id: 8,
    title: 'UTS Project',
    description: 'Design and implement a complete secure network with multiple controls',
    icon: Award,
    difficulty: 'Advanced',
    duration: '120 min',
    topics: ['Network Design', 'Multi-layer Security', 'Documentation'],
    color: 'from-indigo-500 to-purple-500'
  }
];

const features = [
  {
    icon: Terminal,
    title: 'Real CLI Terminal',
    description: 'Authentic Cisco-like command line interface with auto-completion and syntax highlighting',
    gradient: 'from-cyan-500 to-blue-600'
  },
  {
    icon: Network,
    title: 'Interactive Topology',
    description: 'Drag-and-drop network canvas with real-time packet animation and device management',
    gradient: 'from-purple-500 to-pink-600'
  },
  {
    icon: Activity,
    title: 'Live Packet Capture',
    description: 'Monitor and analyze network traffic in real-time with protocol decoding and filtering',
    gradient: 'from-emerald-500 to-teal-600'
  },
  {
    icon: Zap,
    title: 'Instant Feedback',
    description: 'Auto-validation of configurations with immediate feedback and scoring system',
    gradient: 'from-amber-500 to-orange-600'
  }
];

export default function HomePage() {
  const [particles, setParticles] = useState<Array<{ left: string, top: string, delay: string, size: number }>>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const newParticles = [...Array(30)].map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 8}s`,
      size: Math.random() * 4 + 2,
    }));
    setParticles(newParticles);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-[#030712] text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Gradient Mesh */}
        <div
          className="absolute w-[800px] h-[800px] rounded-full opacity-30 blur-[120px]"
          style={{
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, transparent 70%)',
            left: mousePosition.x / 10 - 400,
            top: mousePosition.y / 10 - 400,
            transition: 'left 0.3s ease-out, top 0.3s ease-out',
          }}
        />
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-25 blur-[100px]"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
            right: mousePosition.x / 15 - 300,
            bottom: mousePosition.y / 15 - 300,
            transition: 'right 0.3s ease-out, bottom 0.3s ease-out',
          }}
        />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px',
          }}
        />

        {/* Floating Particles */}
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-cyan-400"
            style={{
              left: particle.left,
              top: particle.top,
              width: particle.size,
              height: particle.size,
              opacity: 0.4,
              boxShadow: `0 0 ${particle.size * 3}px rgba(6, 182, 212, 0.5)`,
              animation: `float ${10 + i % 5}s ease-in-out infinite`,
              animationDelay: particle.delay,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#030712]/70 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 blur-lg opacity-50" />
              <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">NetSecLab</h1>
              <p className="text-[11px] text-slate-500 font-medium tracking-wide">VIRTUAL SECURITY LAB</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#labs" className="text-sm text-slate-400 hover:text-white transition-colors font-medium">Labs</a>
            <a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors font-medium">Features</a>
            <a href="#docs" className="text-sm text-slate-400 hover:text-white transition-colors font-medium">Documentation</a>
          </nav>

          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors font-medium">Sign In</button>
            <button className="group relative px-5 py-2.5 rounded-xl font-semibold text-sm overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center gap-2 text-white">
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-cyan-500/20 mb-10 backdrop-blur-sm">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </div>
            <span className="text-sm font-medium text-slate-300">
              <Sparkles className="w-4 h-4 inline mr-1.5 text-amber-400" />
              Version 1.0 — Now Available
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="relative">
            <span className="block text-7xl md:text-8xl lg:text-[10rem] font-black tracking-tight leading-none">
              <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_50px_rgba(6,182,212,0.3)]">
                Network
              </span>
            </span>
            <span className="block text-7xl md:text-8xl lg:text-[10rem] font-black tracking-tight leading-none mt-2">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_50px_rgba(168,85,247,0.3)]">
                Security
              </span>
            </span>
            <span className="block text-3xl md:text-4xl lg:text-5xl font-bold text-slate-400 mt-6 tracking-wide">
              Virtual Lab
            </span>
          </h1>

          {/* Description */}
          <p className="mt-10 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Master network security through{' '}
            <span className="text-cyan-400 font-semibold">hands-on practice</span>.
            Configure VPNs, firewalls, and IDS systems in a realistic virtual environment.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
            <a
              href="/labs"
              className="group relative px-8 py-4 rounded-2xl font-bold text-lg overflow-hidden shadow-2xl shadow-cyan-500/20"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 bg-[length:200%_100%] animate-shimmer" />
              <span className="relative flex items-center gap-3 text-white">
                <Play className="w-5 h-5" />
                Start Learning
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </a>
            <a
              href="#labs"
              className="group px-8 py-4 rounded-2xl font-bold text-lg border-2 border-slate-700 hover:border-slate-500 transition-all bg-slate-900/50 backdrop-blur-sm hover:bg-slate-800/50"
            >
              <span className="flex items-center gap-3 text-slate-300 group-hover:text-white transition-colors">
                <BookOpen className="w-5 h-5" />
                Browse Labs
              </span>
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 max-w-4xl mx-auto">
            {[
              { value: '8', label: 'Guided Labs', icon: Layers },
              { value: '50+', label: 'CLI Commands', icon: Code2 },
              { value: '100%', label: 'Browser Based', icon: Globe },
              { value: 'Free', label: 'Open Source', icon: Sparkles }
            ].map((stat, i) => (
              <div
                key={i}
                className="group relative p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/30 transition-all duration-500 hover:shadow-lg hover:shadow-cyan-500/5 backdrop-blur-sm"
              >
                <stat.icon className="w-6 h-6 text-cyan-500 mb-3 group-hover:scale-110 transition-transform" />
                <div className="text-3xl md:text-4xl font-black bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-500 font-medium mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500">
          <span className="text-xs font-medium tracking-wider uppercase">Scroll</span>
          <div className="w-6 h-10 rounded-full border-2 border-slate-700 flex items-start justify-center p-2">
            <div className="w-1.5 h-3 rounded-full bg-slate-500 animate-bounce" />
          </div>
        </div>
      </section>

      {/* Terminal Preview Section */}
      <section className="py-32 px-6 relative">
        <div className="max-w-5xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6">
              <Terminal className="w-4 h-4" />
              Interactive Terminal
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Real-World{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                CLI Experience
              </span>
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Practice with authentic Cisco-like commands in our fully interactive terminal
            </p>
          </div>

          {/* Terminal Window */}
          <div className="relative">
            {/* Glow Effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-3xl blur-2xl opacity-60" />

            <div className="relative rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl shadow-black/50">
              {/* Terminal Header */}
              <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700/50">
                <div className="flex items-center gap-4">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
                  </div>
                  <div className="h-4 w-px bg-slate-700" />
                  <span className="text-sm font-medium text-slate-400 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    Router1 — Terminal
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold tracking-wide">
                  ● CONNECTED
                </span>
              </div>

              {/* Terminal Content */}
              <div className="bg-[#0a0a0f] p-6 font-mono text-sm space-y-1.5 min-h-[320px]">
                <div className="flex">
                  <span className="text-cyan-400 font-semibold">Router1&gt;</span>
                  <span className="text-slate-200 ml-2">enable</span>
                </div>
                <div className="flex">
                  <span className="text-cyan-400 font-semibold">Router1#</span>
                  <span className="text-slate-200 ml-2">configure terminal</span>
                </div>
                <div className="text-slate-500 italic pl-4">Enter configuration commands, one per line. End with CNTL/Z.</div>
                <div className="flex">
                  <span className="text-amber-400 font-semibold">Router1(config)#</span>
                  <span className="text-slate-200 ml-2">crypto isakmp policy 10</span>
                </div>
                <div className="flex">
                  <span className="text-amber-400 font-semibold">Router1(config-isakmp)#</span>
                  <span className="text-slate-200 ml-2">encryption aes 256</span>
                </div>
                <div className="flex">
                  <span className="text-amber-400 font-semibold">Router1(config-isakmp)#</span>
                  <span className="text-slate-200 ml-2">hash sha256</span>
                </div>
                <div className="flex">
                  <span className="text-amber-400 font-semibold">Router1(config-isakmp)#</span>
                  <span className="text-slate-200 ml-2">authentication pre-share</span>
                </div>
                <div className="flex">
                  <span className="text-amber-400 font-semibold">Router1(config-isakmp)#</span>
                  <span className="text-slate-200 ml-2">group 14</span>
                </div>
                <div className="mt-3 py-2.5 px-4 bg-emerald-500/10 border-l-4 border-emerald-500 text-emerald-400 rounded-r-lg font-medium">
                  ✓ IKE Phase 1 policy configured successfully
                </div>
                <div className="flex mt-3">
                  <span className="text-amber-400 font-semibold">Router1(config-isakmp)#</span>
                  <span className="ml-2 w-2.5 h-5 bg-cyan-400 animate-pulse rounded-sm" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 relative">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Features
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Powerful Learning{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                Tools
              </span>
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Everything you need to master network security in one integrated platform
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group relative p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all duration-500 hover:-translate-y-2 backdrop-blur-sm"
              >
                {/* Icon with Gradient Background */}
                <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-50 blur-xl`} />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-300 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Labs Section */}
      <section id="labs" className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
              <BookOpen className="w-4 h-4" />
              Lab Modules
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Comprehensive{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
                Lab Modules
              </span>
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              8 progressive labs covering essential network security topics from basics to advanced
            </p>
          </div>

          {/* Lab Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {labs.map((lab, index) => (
              <a
                key={lab.id}
                href={`/labs/${lab.id}`}
                className="group relative p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-600 transition-all duration-500 hover:-translate-y-2 backdrop-blur-sm overflow-hidden"
              >
                {/* Gradient Accent */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${lab.color}`} />

                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${lab.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <lab.icon className="w-7 h-7 text-white" />
                </div>

                {/* Content */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-500">LAB {lab.id}</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    {lab.difficulty}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                  {lab.title}
                </h3>

                <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                  {lab.description}
                </p>

                {/* Topics */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {lab.topics.slice(0, 2).map((topic, i) => (
                    <span key={i} className="text-[10px] px-2 py-1 rounded-full bg-slate-800 text-slate-400 font-medium">
                      {topic}
                    </span>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <span className="text-xs text-slate-500 font-medium">{lab.duration}</span>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 relative">
        <div className="max-w-4xl mx-auto">
          <div className="relative p-12 md:p-16 rounded-3xl overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20" />
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" />
            <div className="absolute inset-0 border border-slate-700/50 rounded-3xl" />

            {/* Glow */}
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/30 rounded-full blur-[100px]" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/30 rounded-full blur-[100px]" />

            <div className="relative z-10 text-center">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Start Learning?
              </h2>
              <p className="text-lg text-slate-300 mb-10 max-w-xl mx-auto">
                Jump into your first lab and experience hands-on network security training.
              </p>
              <a
                href="/labs"
                className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-bold text-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-2xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 transition-all duration-300"
              >
                <Play className="w-6 h-6" />
                Launch Lab Environment
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white">Network Security Virtual Lab</h3>
                <p className="text-xs text-slate-500">Built with ❤️ for Education</p>
              </div>
            </div>

            <div className="flex items-center gap-8 text-sm text-slate-500">
              <a href="#" className="hover:text-white transition-colors">Documentation</a>
              <a href="#" className="hover:text-white transition-colors">GitHub</a>
              <a href="#" className="hover:text-white transition-colors">Discord</a>
              <a href="#" className="hover:text-white transition-colors">License</a>
            </div>

            <p className="text-sm text-slate-500">
              © 2024 NetSecLab. MIT License.
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-10px) translateX(-10px); }
          75% { transform: translateY(-30px) translateX(5px); }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
