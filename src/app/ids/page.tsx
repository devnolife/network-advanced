'use client';

/**
 * IDS/IPS Demo Page
 * 
 * Interactive demonstration of the Intrusion Detection and Prevention System.
 * Allows users to explore IDS features, view alerts, and learn about detection.
 * 
 * Network Security Virtual Lab - Educational Platform
 */

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Play,
  Pause,
  RefreshCw,
  Settings,
  BookOpen,
  Zap,
  AlertTriangle,
  Activity,
  Database,
  List,
  LayoutDashboard,
  Ban,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIDSStore, selectDetectionProfiles } from '@/store/idsStore';
import { IDSDashboard, AlertViewer } from '@/components/ids';
import { getIDSEngine } from '@/lib/network/ids';
import { IDS_EDUCATIONAL_CONTENT, getAllRules } from '@/lib/network/ids/RuleDatabase';
import { AttackPacket } from '@/lib/network/attacks/types';

// ============================================================================
// Demo Packet Generator
// ============================================================================

function generateDemoPacket(type: 'normal' | 'scan' | 'dos' | 'arp' | 'sql' | 'random'): AttackPacket {
  const id = `pkt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = Date.now();
  
  const basePacket: AttackPacket = {
    id,
    timestamp,
    direction: 'outbound',
    sourceIP: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
    destIP: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
    sourceMAC: 'aa:bb:cc:dd:ee:ff',
    destMAC: '11:22:33:44:55:66',
    protocol: 'TCP',
    size: Math.floor(Math.random() * 1000) + 64,
    isSpoofed: false,
    isMalicious: false,
  };

  switch (type) {
    case 'scan':
      return {
        ...basePacket,
        sourceIP: '10.0.0.100',
        destIP: '192.168.1.10',
        sourcePort: Math.floor(Math.random() * 65535),
        destPort: Math.floor(Math.random() * 1024) + 1,
        protocol: 'TCP',
        flags: ['SYN'],
        isMalicious: true,
      };

    case 'dos':
      return {
        ...basePacket,
        sourceIP: `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
        destIP: '192.168.1.10',
        sourcePort: Math.floor(Math.random() * 65535),
        destPort: 80,
        protocol: 'TCP',
        flags: ['SYN'],
        size: 64,
        isSpoofed: true,
        isMalicious: true,
      };

    case 'arp':
      return {
        ...basePacket,
        protocol: 'ARP',
        sourcePort: undefined,
        destPort: undefined,
        payload: 'ARP reply - gratuitous',
        isMalicious: true,
      };

    case 'sql':
      return {
        ...basePacket,
        sourceIP: '10.0.0.50',
        destIP: '192.168.1.20',
        sourcePort: Math.floor(Math.random() * 65535),
        destPort: 80,
        protocol: 'HTTP',
        payload: "GET /search?q=1' UNION SELECT * FROM users-- HTTP/1.1",
        isMalicious: true,
      };

    case 'normal':
    default:
      return {
        ...basePacket,
        sourcePort: Math.floor(Math.random() * 65535),
        destPort: [80, 443, 22, 53][Math.floor(Math.random() * 4)],
        isMalicious: false,
      };
  }
}

// ============================================================================
// Tab Content Components
// ============================================================================

function RulesTab() {
  const rules = getAllRules();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [...new Set(rules.map(r => r.category))];
  
  const filteredRules = rules.filter(r => {
    const matchesCategory = selectedCategory === 'all' || r.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.options.msg.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search rules..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-cyan-500/50"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat.replace('-', ' ')}</option>
          ))}
        </select>
      </div>

      {/* Rules List */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {filteredRules.map(rule => (
          <div
            key={rule.id}
            className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800/50 hover:border-zinc-700/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-medium text-zinc-200">{rule.name}</h4>
                <p className="text-xs text-zinc-500 mt-1">{rule.options.msg}</p>
              </div>
              <div className={cn(
                'px-2 py-0.5 text-xs rounded',
                rule.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                rule.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                rule.severity === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                'bg-blue-500/20 text-blue-400'
              )}>
                {rule.severity}
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
              <span>SID: {rule.options.sid}</span>
              <span>Protocol: {rule.protocol}</span>
              <span className="capitalize">{rule.category.replace('-', ' ')}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-sm text-zinc-500">
        Showing {filteredRules.length} of {rules.length} rules
      </p>
    </div>
  );
}

function EducationTab() {
  return (
    <div className="space-y-6">
      {IDS_EDUCATIONAL_CONTENT.map((content) => (
        <div
          key={content.concept}
          className="p-5 bg-zinc-900/50 rounded-xl border border-zinc-800/50"
        >
          <h3 className="text-lg font-semibold text-zinc-100 mb-2">{content.title}</h3>
          <p className="text-sm text-zinc-400 mb-4">{content.overview}</p>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-zinc-300 mb-2">Key Points</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-zinc-400">
                {content.details.map((detail, i) => (
                  <li key={i}>{detail}</li>
                ))}
              </ul>
            </div>
            
            {content.bestPractices && (
              <div>
                <h4 className="text-sm font-medium text-emerald-400 mb-2">Best Practices</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-zinc-400">
                  {content.bestPractices.map((practice, i) => (
                    <li key={i}>{practice}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {content.commonMistakes && (
              <div>
                <h4 className="text-sm font-medium text-red-400 mb-2">Common Mistakes</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-zinc-400">
                  {content.commonMistakes.map((mistake, i) => (
                    <li key={i}>{mistake}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function BlocklistTab() {
  const { blocklist, unblockIP, clearBlocklist, blockIP } = useIDSStore();
  const [newIP, setNewIP] = useState('');
  const [reason, setReason] = useState('');

  const handleBlock = () => {
    if (newIP && reason) {
      blockIP(newIP, reason, 3600000); // 1 hour
      setNewIP('');
      setReason('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Add to blocklist */}
      <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
        <h3 className="text-sm font-medium text-zinc-300 mb-3">Add to Blocklist</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="IP Address"
            value={newIP}
            onChange={(e) => setNewIP(e.target.value)}
            className="flex-1 px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50"
          />
          <input
            type="text"
            placeholder="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="flex-1 px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50"
          />
          <button
            onClick={handleBlock}
            disabled={!newIP || !reason}
            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
          >
            Block
          </button>
        </div>
      </div>

      {/* Blocklist */}
      {blocklist.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No blocked IPs</p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-zinc-300">Blocked IPs ({blocklist.length})</h3>
            <button
              onClick={clearBlocklist}
              className="text-sm text-red-400 hover:text-red-300"
            >
              Clear All
            </button>
          </div>
          <div className="space-y-2">
            {blocklist.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg border border-red-500/30"
              >
                <div>
                  <p className="font-mono text-sm text-zinc-200">{entry.ip}</p>
                  <p className="text-xs text-zinc-500">{entry.reason}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500">
                    Hits: {entry.hitCount}
                  </span>
                  <button
                    onClick={() => unblockIP(entry.ip)}
                    className="text-sm text-cyan-400 hover:text-cyan-300"
                  >
                    Unblock
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function IDSPage() {
  const {
    isInitialized,
    isRunning,
    initialize,
    start,
    stop,
    mode,
  } = useIDSStore();

  const profiles = selectDetectionProfiles();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'alerts' | 'rules' | 'blocklist' | 'learn'>('dashboard');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationType, setSimulationType] = useState<'mixed' | 'scan' | 'dos' | 'sql'>('mixed');

  // Initialize on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // Simulation effect
  useEffect(() => {
    if (!isSimulating || !isRunning) return;

    const idsEngine = getIDSEngine();
    
    const interval = setInterval(() => {
      let packetType: 'normal' | 'scan' | 'dos' | 'arp' | 'sql' | 'random';
      
      if (simulationType === 'mixed') {
        const rand = Math.random();
        if (rand < 0.6) packetType = 'normal';
        else if (rand < 0.75) packetType = 'scan';
        else if (rand < 0.85) packetType = 'dos';
        else if (rand < 0.95) packetType = 'sql';
        else packetType = 'arp';
      } else {
        packetType = Math.random() < 0.3 ? 'normal' : simulationType;
      }
      
      const packet = generateDemoPacket(packetType);
      idsEngine.analyzePacket(packet);
    }, 200);

    return () => clearInterval(interval);
  }, [isSimulating, isRunning, simulationType]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'rules', label: 'Rules', icon: FileText },
    { id: 'blocklist', label: 'Blocklist', icon: Ban },
    { id: 'learn', label: 'Learn', icon: BookOpen },
  ] as const;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2 rounded-lg',
                isRunning ? 'bg-cyan-500/20' : 'bg-zinc-800'
              )}>
                {isRunning ? (
                  <ShieldCheck className="w-6 h-6 text-cyan-400" />
                ) : (
                  <Shield className="w-6 h-6 text-zinc-500" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold">IDS/IPS Security Monitor</h1>
                <p className="text-sm text-zinc-500">Intrusion Detection & Prevention System</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Simulation Controls */}
              <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                <select
                  value={simulationType}
                  onChange={(e) => setSimulationType(e.target.value as typeof simulationType)}
                  className="bg-transparent text-sm text-zinc-300 focus:outline-none"
                  disabled={isSimulating}
                >
                  <option value="mixed">Mixed Traffic</option>
                  <option value="scan">Port Scan</option>
                  <option value="dos">DoS Attack</option>
                  <option value="sql">SQL Injection</option>
                </select>
                <button
                  onClick={() => setIsSimulating(!isSimulating)}
                  disabled={!isRunning}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1 rounded-md text-sm transition-colors',
                    isSimulating
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-emerald-500/20 text-emerald-400',
                    !isRunning && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {isSimulating ? (
                    <>
                      <Activity className="w-4 h-4 animate-pulse" />
                      Simulating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Simulate
                    </>
                  )}
                </button>
              </div>

              {/* Engine Control */}
              <button
                onClick={() => isRunning ? stop() : start()}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                  isRunning
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
                )}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Stop Engine
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Start Engine
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors',
                    activeTab === tab.id
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <IDSDashboard />
        )}

        {activeTab === 'alerts' && (
          <div className="bg-zinc-900/30 rounded-xl border border-zinc-800/50">
            <AlertViewer maxHeight="calc(100vh - 250px)" />
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="p-6 bg-zinc-900/30 rounded-xl border border-zinc-800/50">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-400" />
              Detection Rules
            </h2>
            <RulesTab />
          </div>
        )}

        {activeTab === 'blocklist' && (
          <div className="p-6 bg-zinc-900/30 rounded-xl border border-zinc-800/50">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Ban className="w-5 h-5 text-red-400" />
              IP Blocklist
            </h2>
            <BlocklistTab />
          </div>
        )}

        {activeTab === 'learn' && (
          <div className="p-6 bg-zinc-900/30 rounded-xl border border-zinc-800/50">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              Learn About IDS/IPS
            </h2>
            <EducationTab />
          </div>
        )}
      </main>
    </div>
  );
}
