'use client';

import React from 'react';
import {
    Shield,
    Network,
    Activity,
    Lock,
    FileCode,
    Wifi,
    Eye,
    Award,
    ChevronRight,
    Clock,
    BookOpen,
    Star,
    ArrowLeft
} from 'lucide-react';

const labs = [
    {
        id: 1,
        title: 'Network Security Fundamentals Review',
        description: 'Review network security concepts, set up the lab environment, and configure basic devices. Learn CLI navigation, IP configuration, and connectivity testing.',
        icon: Network,
        difficulty: 'Beginner',
        duration: '30 min',
        topics: ['IP Configuration', 'Routing Basics', 'CLI Navigation', 'Connectivity Testing'],
        color: 'from-cyan-500 to-blue-500',
        progress: 100,
        status: 'completed'
    },
    {
        id: 2,
        title: 'TCP/IP Protocol Security Analysis',
        description: 'Understand the TCP/IP stack, capture and analyze packets with the built-in analyzer, and identify security vulnerabilities in protocols.',
        icon: Activity,
        difficulty: 'Beginner',
        duration: '45 min',
        topics: ['TCP Handshake', 'Packet Headers', 'Protocol Analysis', 'PCAP Export'],
        color: 'from-green-500 to-emerald-500',
        progress: 100,
        status: 'completed'
    },
    {
        id: 3,
        title: 'VPN Technologies - IPSec & SSL VPN',
        description: 'Configure a site-to-site IPSec VPN with IKE Phase 1 and Phase 2, set up crypto maps, and verify tunnel establishment.',
        icon: Lock,
        difficulty: 'Intermediate',
        duration: '60 min',
        topics: ['IKE Phase 1 & 2', 'Pre-Shared Keys', 'Crypto Maps', 'ESP Encryption'],
        color: 'from-purple-500 to-violet-500',
        progress: 45,
        status: 'in-progress'
    },
    {
        id: 4,
        title: 'Next-Generation Firewall (NGFW)',
        description: 'Configure firewall zones, create security policies, set up NAT rules, and implement application-layer filtering.',
        icon: Shield,
        difficulty: 'Intermediate',
        duration: '60 min',
        topics: ['Security Zones', 'Firewall Rules', 'NAT Configuration', 'App Filtering'],
        color: 'from-orange-500 to-red-500',
        progress: 0,
        status: 'locked'
    },
    {
        id: 5,
        title: 'Advanced Access Control Lists (ACL)',
        description: 'Create standard and extended ACLs, implement complex filtering rules, and optimize ACL performance.',
        icon: FileCode,
        difficulty: 'Intermediate',
        duration: '45 min',
        topics: ['Standard ACL', 'Extended ACL', 'Time-based ACL', 'ACL Troubleshooting'],
        color: 'from-pink-500 to-rose-500',
        progress: 0,
        status: 'locked'
    },
    {
        id: 6,
        title: 'Network Address Translation (NAT) Security',
        description: 'Configure static and dynamic NAT, implement PAT for address overloading, and troubleshoot NAT issues.',
        icon: Wifi,
        difficulty: 'Intermediate',
        duration: '45 min',
        topics: ['Static NAT', 'Dynamic NAT Pool', 'PAT/Overload', 'Translation Verification'],
        color: 'from-amber-500 to-yellow-500',
        progress: 0,
        status: 'locked'
    },
    {
        id: 7,
        title: 'Intrusion Detection System (Snort)',
        description: 'Deploy IDS sensors, create detection signatures, analyze alerts, and tune for false positives.',
        icon: Eye,
        difficulty: 'Advanced',
        duration: '60 min',
        topics: ['IDS Deployment', 'Signature Creation', 'Alert Analysis', 'False Positive Tuning'],
        color: 'from-teal-500 to-cyan-500',
        progress: 0,
        status: 'locked'
    },
    {
        id: 8,
        title: 'UTS - Network Security Implementation',
        description: 'Design a secure network topology, implement multiple security controls, and complete a comprehensive security audit.',
        icon: Award,
        difficulty: 'Advanced',
        duration: '120 min',
        topics: ['Network Design', 'Multi-layer Security', 'VPN + Firewall + IDS', 'Documentation'],
        color: 'from-indigo-500 to-purple-500',
        progress: 0,
        status: 'locked'
    }
];

export default function LabsPage() {
    const completedLabs = labs.filter(l => l.status === 'completed').length;
    const inProgressLabs = labs.filter(l => l.status === 'in-progress').length;
    const overallProgress = Math.round(
        labs.reduce((sum, lab) => sum + lab.progress, 0) / labs.length
    );

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-lg bg-[var(--bg-primary)]/80 border-b border-[var(--border-default)]">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <a href="/" className="btn btn-ghost btn-icon">
                            <ArrowLeft className="w-5 h-5" />
                        </a>
                        <div>
                            <h1 className="text-xl font-semibold text-white">Lab Modules</h1>
                            <p className="text-sm text-[var(--text-muted)]">8 comprehensive security labs</p>
                        </div>
                    </div>

                    {/* Progress Summary */}
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="stat-card py-2 px-4">
                                <div className="text-sm text-[var(--text-muted)]">Completed</div>
                                <div className="text-xl font-bold text-[var(--accent)]">{completedLabs}/8</div>
                            </div>
                            <div className="stat-card py-2 px-4">
                                <div className="text-sm text-[var(--text-muted)]">In Progress</div>
                                <div className="text-xl font-bold text-[var(--primary)]">{inProgressLabs}</div>
                            </div>
                            <div className="stat-card py-2 px-4">
                                <div className="text-sm text-[var(--text-muted)]">Overall</div>
                                <div className="text-xl font-bold text-white">{overallProgress}%</div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Labs Grid */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Learning Path */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-[var(--primary)]" />
                        Learning Path
                    </h2>
                    <div className="glass-card p-4">
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-[var(--text-secondary)]">Course Progress</span>
                                    <span className="text-sm font-medium text-white">{overallProgress}%</span>
                                </div>
                                <div className="progress h-2">
                                    <div className="progress-bar" style={{ width: `${overallProgress}%` }} />
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-white">{completedLabs * 100}</div>
                                <div className="text-xs text-[var(--text-muted)]">Points Earned</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Labs */}
                <div className="grid gap-6">
                    {labs.map((lab, index) => (
                        <a
                            key={lab.id}
                            href={lab.status !== 'locked' ? `/labs/${lab.id}` : '#'}
                            className={`card flex gap-6 relative overflow-hidden group ${lab.status === 'locked' ? 'opacity-60 cursor-not-allowed' : ''
                                }`}
                        >
                            {/* Progress Indicator */}
                            <div
                                className="absolute top-0 left-0 h-full w-1"
                                style={{
                                    background: lab.status === 'completed'
                                        ? 'var(--accent)'
                                        : lab.status === 'in-progress'
                                            ? 'var(--primary)'
                                            : 'var(--border-default)'
                                }}
                            />

                            {/* Lab Number */}
                            <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${lab.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                                <lab.icon className="w-8 h-8 text-white" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-xs text-[var(--text-muted)]">Lab {lab.id}</span>
                                    <span className={`badge ${lab.difficulty === 'Beginner' ? 'badge-success' :
                                            lab.difficulty === 'Intermediate' ? 'badge-warning' :
                                                'badge-danger'
                                        } text-[10px]`}>
                                        {lab.difficulty}
                                    </span>
                                    {lab.status === 'completed' && (
                                        <span className="badge badge-success text-[10px] flex items-center gap-1">
                                            <Star className="w-3 h-3" /> Completed
                                        </span>
                                    )}
                                    {lab.status === 'in-progress' && (
                                        <span className="badge badge-info text-[10px]">In Progress</span>
                                    )}
                                    {lab.status === 'locked' && (
                                        <span className="badge text-[10px] bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                                            <Lock className="w-3 h-3 mr-1" /> Locked
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-[var(--primary)] transition-colors">
                                    {lab.title}
                                </h3>

                                <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">
                                    {lab.description}
                                </p>

                                {/* Topics */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {lab.topics.map((topic, i) => (
                                        <span key={i} className="text-xs px-2 py-1 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                                            {topic}
                                        </span>
                                    ))}
                                </div>

                                {/* Progress Bar */}
                                {lab.status !== 'locked' && (
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 max-w-xs">
                                            <div className="progress">
                                                <div className="progress-bar" style={{ width: `${lab.progress}%` }} />
                                            </div>
                                        </div>
                                        <span className="text-xs text-[var(--text-muted)]">{lab.progress}%</span>
                                    </div>
                                )}
                            </div>

                            {/* Right Section */}
                            <div className="flex flex-col items-end justify-between flex-shrink-0">
                                <div className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
                                    <Clock className="w-4 h-4" />
                                    {lab.duration}
                                </div>

                                <ChevronRight className={`w-6 h-6 ${lab.status === 'locked'
                                        ? 'text-[var(--text-muted)]'
                                        : 'text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:translate-x-1 transition-all'
                                    }`} />
                            </div>
                        </a>
                    ))}
                </div>

                {/* Prerequisites Note */}
                <div className="mt-8 glass-card p-6">
                    <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[var(--accent-warning)]" />
                        Prerequisites
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                        Labs are unlocked progressively. Complete the current lab to unlock the next one.
                        Each lab builds upon concepts learned in previous modules.
                    </p>
                </div>
            </main>
        </div>
    );
}
