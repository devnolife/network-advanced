'use client';

/**
 * Attack Simulation Demo Page
 * 
 * Interactive demonstration of network attack simulations
 * for educational purposes in the Network Security Virtual Lab.
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Activity,
  Settings,
  Network,
  Server,
  Monitor,
  Router,
  Play,
  Square,
  Info,
  BookOpen,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AttackVisualization, AttackControlPanel } from '@/components/attacks';
import { useAttackSimulationStore } from '@/store/attackSimulationStore';
import { NetworkTopology, NetworkNode } from '@/lib/network/attacks/types';

// ============================================================================
// Demo Topology
// ============================================================================

const DEMO_TOPOLOGY: NetworkTopology = {
  nodes: [
    {
      id: 'attacker',
      type: 'pc',
      name: 'Attacker',
      ip: '192.168.1.100',
      mac: 'AA:BB:CC:DD:EE:01',
      x: 100,
      y: 200,
      isCompromised: false,
      isTarget: false,
      isAttacker: true,
    },
    {
      id: 'router',
      type: 'router',
      name: 'Gateway',
      ip: '192.168.1.1',
      mac: 'AA:BB:CC:DD:EE:02',
      x: 400,
      y: 100,
      isCompromised: false,
      isTarget: false,
      isAttacker: false,
    },
    {
      id: 'victim',
      type: 'pc',
      name: 'Victim PC',
      ip: '192.168.1.50',
      mac: 'AA:BB:CC:DD:EE:03',
      x: 400,
      y: 300,
      isCompromised: false,
      isTarget: true,
      isAttacker: false,
    },
    {
      id: 'server',
      type: 'server',
      name: 'Web Server',
      ip: '192.168.1.200',
      mac: 'AA:BB:CC:DD:EE:04',
      x: 700,
      y: 200,
      isCompromised: false,
      isTarget: false,
      isAttacker: false,
      services: [
        { port: 80, protocol: 'tcp', service: 'HTTP' },
        { port: 443, protocol: 'tcp', service: 'HTTPS' },
        { port: 22, protocol: 'tcp', service: 'SSH' },
      ],
    },
  ],
  links: [
    { source: 'attacker', target: 'router', type: 'ethernet' },
    { source: 'router', target: 'victim', type: 'ethernet' },
    { source: 'router', target: 'server', type: 'ethernet' },
    { source: 'victim', target: 'server', type: 'ethernet' },
  ],
};

// ============================================================================
// Info Cards
// ============================================================================

function InfoCard({ 
  icon: Icon, 
  title, 
  description, 
  color 
}: { 
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-lg', color)}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-semibold text-white mb-1">{title}</h4>
          <p className="text-sm text-zinc-400">{description}</p>
        </div>
      </div>
    </div>
  );
}

function AlertBanner() {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
      <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
      <div>
        <h4 className="font-semibold text-amber-400 mb-1">Educational Purpose Only</h4>
        <p className="text-sm text-amber-200/80">
          This attack simulation module is designed for educational purposes only. 
          All attacks are simulated in a sandboxed environment and do not affect 
          real networks. Using these techniques on networks without authorization 
          is illegal and unethical.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function AttackSimulationPage() {
  const { 
    initialize, 
    isInitialized,
    setTopology, 
    topology,
    activeAttacks,
    alerts,
    selectedAttackId,
  } = useAttackSimulationStore();

  const [showInfo, setShowInfo] = useState(true);

  // Initialize on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
    // Set demo topology
    setTopology(DEMO_TOPOLOGY);
  }, [isInitialized, initialize, setTopology]);

  const runningAttacks = Array.from(activeAttacks.values()).filter(a => a.status === 'running');
  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-950/80 border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-500/20 border border-red-500/30">
                <ShieldAlert className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Attack Simulation Lab</h1>
                <p className="text-xs text-zinc-500">Network Security Training Environment</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {runningAttacks.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30">
                  <Activity className="w-4 h-4 text-red-400 animate-pulse" />
                  <span className="text-sm font-medium text-red-400">
                    {runningAttacks.length} Active
                  </span>
                </div>
              )}
              
              {unacknowledgedAlerts.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-medium text-amber-400">
                    {unacknowledgedAlerts.length} Alerts
                  </span>
                </div>
              )}
              
              <button
                onClick={() => setShowInfo(!showInfo)}
                className={cn(
                  'p-2 rounded-xl border transition-colors',
                  showInfo 
                    ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400'
                    : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:text-white'
                )}
              >
                <Info className="w-5 h-5" />
              </button>
              
              <a
                href="/labs"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/50 text-zinc-300 transition-colors"
              >
                <span className="text-sm">Back to Labs</span>
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        {/* Alert Banner */}
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <AlertBanner />
          </motion.div>
        )}

        {/* Info Cards */}
        {showInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
          >
            <InfoCard
              icon={Shield}
              title="Safe Environment"
              description="All attacks run in an isolated simulation without affecting real networks."
              color="bg-emerald-500/20 text-emerald-400"
            />
            <InfoCard
              icon={BookOpen}
              title="Learn by Doing"
              description="Understand attack mechanics through hands-on simulation and real-time visualization."
              color="bg-cyan-500/20 text-cyan-400"
            />
            <InfoCard
              icon={ShieldCheck}
              title="Defense Training"
              description="Learn to detect and prevent attacks by understanding how they work."
              color="bg-purple-500/20 text-purple-400"
            />
          </motion.div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Visualization Panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800/50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/50 border-b border-zinc-700/50">
                <div className="flex items-center gap-3">
                  <Network className="w-5 h-5 text-cyan-400" />
                  <span className="font-medium text-white">Network Visualization</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span>{topology?.nodes.length || 0} nodes</span>
                  <span>•</span>
                  <span>{topology?.links.length || 0} links</span>
                </div>
              </div>
              
              <div className="p-4">
                <AttackVisualization
                  width={720}
                  height={400}
                  showPacketFlow={true}
                  showLabels={true}
                />
              </div>
            </div>

            {/* Network Info */}
            <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800/50 p-4">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Server className="w-4 h-4 text-cyan-400" />
                Network Nodes
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {topology?.nodes.map((node) => (
                  <div 
                    key={node.id}
                    className={cn(
                      'p-3 rounded-xl border transition-colors',
                      node.isAttacker 
                        ? 'bg-red-500/10 border-red-500/30'
                        : node.isTarget
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-zinc-800/50 border-zinc-700/50'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {node.type === 'router' && <Router className="w-4 h-4 text-cyan-400" />}
                      {node.type === 'server' && <Server className="w-4 h-4 text-purple-400" />}
                      {node.type === 'pc' && <Monitor className="w-4 h-4 text-emerald-400" />}
                      <span className="text-sm font-medium text-white">{node.name}</span>
                    </div>
                    <p className="text-xs text-zinc-400 font-mono">{node.ip}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">{node.mac}</p>
                    {node.isAttacker && (
                      <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400">
                        Attacker
                      </span>
                    )}
                    {node.isTarget && (
                      <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-400">
                        Target
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Control Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl bg-zinc-900/80 border border-zinc-800/50 overflow-hidden max-h-[calc(100vh-8rem)]">
              <AttackControlPanel 
                showEducation={true}
                onAttackStart={(id) => console.log('Attack started:', id)}
                onAttackStop={(id) => console.log('Attack stopped:', id)}
              />
            </div>
          </div>
        </div>

        {/* Resources Section */}
        <div className="mt-8 rounded-2xl bg-zinc-900/80 border border-zinc-800/50 p-6">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            Learning Resources
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a 
              href="https://attack.mitre.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50 hover:border-cyan-500/30 transition-colors group"
            >
              <div>
                <h4 className="font-medium text-white group-hover:text-cyan-400 transition-colors">MITRE ATT&CK</h4>
                <p className="text-sm text-zinc-500">Knowledge base of adversary tactics</p>
              </div>
              <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
            </a>
            <a 
              href="https://owasp.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50 hover:border-cyan-500/30 transition-colors group"
            >
              <div>
                <h4 className="font-medium text-white group-hover:text-cyan-400 transition-colors">OWASP</h4>
                <p className="text-sm text-zinc-500">Web application security resources</p>
              </div>
              <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
            </a>
            <a 
              href="https://www.sans.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50 hover:border-cyan-500/30 transition-colors group"
            >
              <div>
                <h4 className="font-medium text-white group-hover:text-cyan-400 transition-colors">SANS Institute</h4>
                <p className="text-sm text-zinc-500">Cybersecurity training & certifications</p>
              </div>
              <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-zinc-500">
            Network Security Virtual Lab - Attack Simulation Module
            <br />
            <span className="text-zinc-600">For educational and authorized testing purposes only.</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
