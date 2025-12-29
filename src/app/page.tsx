'use client';

import React from 'react';
import {
  Shield,
  Lock,
  Network,
  Terminal,
  Activity,
  Wifi,
  Server,
  Cpu,
  ChevronRight,
  Play,
  BookOpen,
  Award,
  Zap,
  Eye,
  FileCode,
  ArrowRight
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
    description: 'Authentic Cisco-like command line interface with auto-completion and syntax highlighting'
  },
  {
    icon: Network,
    title: 'Interactive Topology',
    description: 'Drag-and-drop network canvas with real-time packet animation and device management'
  },
  {
    icon: Activity,
    title: 'Live Packet Capture',
    description: 'Monitor and analyze network traffic in real-time with protocol decoding and filtering'
  },
  {
    icon: Zap,
    title: 'Instant Feedback',
    description: 'Auto-validation of configurations with immediate feedback and scoring system'
  }
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-[var(--bg-primary)]/80 border-b border-[var(--border-default)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">NetSecLab</h1>
              <p className="text-xs text-[var(--text-muted)]">Virtual Security Lab</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#labs" className="text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">Labs</a>
            <a href="#features" className="text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">Features</a>
            <a href="#docs" className="text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">Documentation</a>
          </nav>

          <div className="flex items-center gap-4">
            <button className="btn btn-ghost text-sm">Sign In</button>
            <button className="btn btn-primary text-sm">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] mb-8">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            <span className="text-sm text-[var(--text-secondary)]">Version 1.0 - Now Available</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              Network Security
            </span>
            <br />
            <span className="text-white">Virtual Lab</span>
          </h1>

          <p className="text-xl text-[var(--text-secondary)] max-w-3xl mx-auto mb-10 leading-relaxed">
            Master network security through hands-on practice. Configure VPNs, firewalls,
            and IDS systems in a realistic virtual environment - all in your browser.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <a href="/labs" className="btn btn-primary text-base px-8 py-3">
              <Play className="w-5 h-5" />
              Start Learning
            </a>
            <a href="#labs" className="btn btn-secondary text-base px-8 py-3">
              <BookOpen className="w-5 h-5" />
              Browse Labs
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { value: '8', label: 'Guided Labs' },
              { value: '50+', label: 'CLI Commands' },
              { value: '100%', label: 'Browser Based' },
              { value: 'Free', label: 'Open Source' }
            ].map((stat, i) => (
              <div key={i} className="glass-card text-center">
                <div className="text-3xl font-bold text-[var(--primary)] mb-1">{stat.value}</div>
                <div className="text-sm text-[var(--text-muted)]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preview Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden border border-[var(--border-default)] shadow-2xl">
            {/* Terminal Preview */}
            <div className="bg-[var(--terminal-bg)]">
              <div className="flex items-center gap-2 px-4 py-3 bg-[var(--bg-tertiary)] border-b border-[var(--border-default)]">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-sm text-[var(--text-muted)] ml-4">Router1 - Terminal</span>
              </div>
              <div className="p-6 font-mono text-sm">
                <div className="text-[var(--terminal-prompt)]">Router1&gt; <span className="text-[var(--terminal-text)]">enable</span></div>
                <div className="text-[var(--terminal-prompt)]">Router1# <span className="text-[var(--terminal-text)]">configure terminal</span></div>
                <div className="text-[var(--terminal-text)]">Enter configuration commands, one per line.  End with CNTL/Z.</div>
                <div className="text-[var(--terminal-prompt)]">Router1(config)# <span className="text-[var(--terminal-text)]">crypto isakmp policy 10</span></div>
                <div className="text-[var(--terminal-prompt)]">Router1(config-isakmp)# <span className="text-[var(--terminal-text)]">encryption aes 256</span></div>
                <div className="text-[var(--terminal-prompt)]">Router1(config-isakmp)# <span className="text-[var(--terminal-text)]">hash sha256</span></div>
                <div className="text-[var(--terminal-prompt)]">Router1(config-isakmp)# <span className="text-[var(--terminal-text)]">group 14</span></div>
                <div className="text-[var(--terminal-success)]">✓ IKE Phase 1 policy configured successfully</div>
                <div className="text-[var(--terminal-prompt)]">Router1(config-isakmp)# <span className="animate-pulse">█</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-[var(--bg-secondary)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Powerful Learning Tools
            </h2>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
              Everything you need to master network security in one integrated platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="card group cursor-pointer">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-[var(--primary)]" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Labs Section */}
      <section id="labs" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Comprehensive Lab Modules
            </h2>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
              8 progressive labs covering essential network security topics from basics to advanced
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {labs.map((lab) => (
              <a
                key={lab.id}
                href={`/labs/${lab.id}`}
                className="card group relative overflow-hidden"
              >
                {/* Gradient Accent */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${lab.color}`} />

                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${lab.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <lab.icon className="w-7 h-7 text-white" />
                </div>

                {/* Content */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-[var(--text-muted)]">Lab {lab.id}</span>
                  <span className="badge badge-info text-[10px]">{lab.difficulty}</span>
                </div>

                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[var(--primary)] transition-colors">
                  {lab.title}
                </h3>

                <p className="text-sm text-[var(--text-secondary)] mb-4 line-clamp-2">
                  {lab.description}
                </p>

                {/* Topics */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {lab.topics.slice(0, 2).map((topic, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                      {topic}
                    </span>
                  ))}
                  {lab.topics.length > 2 && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                      +{lab.topics.length - 2}
                    </span>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-[var(--border-default)]">
                  <span className="text-xs text-[var(--text-muted)]">{lab.duration}</span>
                  <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:translate-x-1 transition-all" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card text-center p-12 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-purple-500/10 pointer-events-none" />

            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 relative z-10">
              Ready to Start Learning?
            </h2>
            <p className="text-lg text-[var(--text-secondary)] mb-8 relative z-10">
              Jump into your first lab and experience hands-on network security training.
            </p>
            <a href="/labs" className="btn btn-primary text-lg px-10 py-4 relative z-10">
              <Play className="w-5 h-5" />
              Launch Lab Environment
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-default)] py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Network Security Virtual Lab</h3>
                <p className="text-xs text-[var(--text-muted)]">Built with ❤️ for Education</p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm text-[var(--text-muted)]">
              <a href="#" className="hover:text-[var(--primary)]">Documentation</a>
              <a href="#" className="hover:text-[var(--primary)]">GitHub</a>
              <a href="#" className="hover:text-[var(--primary)]">Discord</a>
              <a href="#" className="hover:text-[var(--primary)]">License</a>
            </div>

            <p className="text-xs text-[var(--text-muted)]">
              © 2024 NetSecLab. MIT License.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
