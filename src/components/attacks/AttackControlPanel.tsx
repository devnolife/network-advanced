'use client';

/**
 * Attack Control Panel Component
 * 
 * Main control interface for attack simulations including:
 * - Attack template selection
 * - Attack configuration
 * - Start/Stop controls
 * - Real-time statistics
 * - Event log
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Square,
  Settings,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Shield,
  Zap,
  Activity,
  Clock,
  Target,
  Cpu,
  HardDrive,
  Network,
  Eye,
  EyeOff,
  Info,
  BookOpen,
  Filter,
  Trash2,
  RefreshCw,
  Copy,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAttackSimulationStore, selectAttackTemplates } from '@/store/attackSimulationStore';
import { AttackTemplate, AttackConfig, AttackCategory, AttackType } from '@/lib/network/attacks/types';
import { getEducationalContent } from '@/lib/network/attacks';

// ============================================================================
// Types
// ============================================================================

interface AttackControlPanelProps {
  className?: string;
  showEducation?: boolean;
  onAttackStart?: (attackId: string) => void;
  onAttackStop?: (attackId: string) => void;
}

// ============================================================================
// Sub-components
// ============================================================================

function TemplateCard({ 
  template, 
  isSelected, 
  onSelect 
}: { 
  template: AttackTemplate; 
  isSelected: boolean;
  onSelect: () => void;
}) {
  const difficultyColors = {
    beginner: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    intermediate: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    advanced: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    expert: 'text-red-400 bg-red-500/10 border-red-500/30',
  };

  const categoryIcons: Record<AttackCategory, React.ReactNode> = {
    reconnaissance: <Eye className="w-4 h-4" />,
    spoofing: <Shield className="w-4 h-4" />,
    'denial-of-service': <Zap className="w-4 h-4" />,
    'man-in-the-middle': <Network className="w-4 h-4" />,
    injection: <Cpu className="w-4 h-4" />,
    exploitation: <AlertTriangle className="w-4 h-4" />,
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={cn(
        'w-full p-4 rounded-xl border text-left transition-all duration-200',
        isSelected
          ? 'bg-cyan-500/10 border-cyan-500/50 ring-2 ring-cyan-500/30'
          : 'bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600/50'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'p-2 rounded-lg',
          isSelected ? 'bg-cyan-500/20 text-cyan-400' : 'bg-zinc-700/50 text-zinc-400'
        )}>
          {categoryIcons[template.category]}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-white truncate">{template.name}</h4>
            <span className={cn(
              'px-2 py-0.5 rounded-full text-[10px] font-medium border',
              difficultyColors[template.difficulty]
            )}>
              {template.difficulty}
            </span>
          </div>
          <p className="text-xs text-zinc-400 line-clamp-2">{template.description}</p>
          
          {template.cvssScore && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] text-zinc-500">CVSS:</span>
              <span className={cn(
                'text-xs font-mono',
                template.cvssScore >= 9 ? 'text-red-400' :
                template.cvssScore >= 7 ? 'text-orange-400' :
                template.cvssScore >= 4 ? 'text-amber-400' : 'text-emerald-400'
              )}>
                {template.cvssScore.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}

function EventLog({ attackId }: { attackId: string }) {
  const { getFilteredEvents, eventFilter, setEventFilter } = useAttackSimulationStore();
  const events = getFilteredEvents(attackId);

  const eventColors = {
    info: 'text-blue-400 bg-blue-500/10',
    success: 'text-emerald-400 bg-emerald-500/10',
    detection: 'text-amber-400 bg-amber-500/10',
    failure: 'text-red-400 bg-red-500/10',
    'packet-sent': 'text-cyan-400 bg-cyan-500/10',
    'packet-received': 'text-purple-400 bg-purple-500/10',
    'target-response': 'text-zinc-400 bg-zinc-500/10',
  };

  return (
    <div className="space-y-2">
      {/* Filter buttons */}
      <div className="flex items-center gap-1 flex-wrap">
        {(['all', 'info', 'success', 'detection', 'failure'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setEventFilter(filter)}
            className={cn(
              'px-2 py-1 rounded text-xs font-medium transition-colors',
              eventFilter === filter
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Event list */}
      <div className="max-h-[300px] overflow-y-auto space-y-1 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {events.slice(-50).reverse().map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={cn(
                'flex items-start gap-2 p-2 rounded-lg text-xs',
                eventColors[event.type] || 'bg-zinc-800/50 text-zinc-400'
              )}
            >
              <span className="text-[10px] text-zinc-500 font-mono whitespace-nowrap">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
              <span className="flex-1 break-words whitespace-pre-wrap font-mono">
                {event.message}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {events.length === 0 && (
          <div className="text-center py-8 text-zinc-500 text-sm">
            No events yet
          </div>
        )}
      </div>
    </div>
  );
}

function Statistics({ attackId }: { attackId: string }) {
  const { getActiveAttack, totalPacketsSent, totalBytesTransferred } = useAttackSimulationStore();
  const attack = getActiveAttack(attackId);

  if (!attack) return null;

  const duration = attack.status === 'running' 
    ? (Date.now() - attack.startTime) / 1000
    : (attack.statistics?.duration || 0) / 1000;

  const stats = [
    { 
      label: 'Packets', 
      value: attack.packets.length.toLocaleString(),
      icon: <Activity className="w-4 h-4" />,
      color: 'text-cyan-400'
    },
    { 
      label: 'Events', 
      value: attack.events.length.toLocaleString(),
      icon: <HardDrive className="w-4 h-4" />,
      color: 'text-purple-400'
    },
    { 
      label: 'Duration', 
      value: `${duration.toFixed(1)}s`,
      icon: <Clock className="w-4 h-4" />,
      color: 'text-amber-400'
    },
    { 
      label: 'Status', 
      value: attack.status,
      icon: <Target className="w-4 h-4" />,
      color: attack.status === 'running' ? 'text-emerald-400' : 'text-zinc-400'
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {stats.map((stat) => (
        <div 
          key={stat.label}
          className="flex items-center gap-2 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50"
        >
          <div className={cn('opacity-70', stat.color)}>{stat.icon}</div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase">{stat.label}</p>
            <p className={cn('text-sm font-bold', stat.color)}>{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function EducationalPanel({ attackType }: { attackType: AttackType }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const education = getEducationalContent(attackType);

  if (!education) return null;

  return (
    <div className="rounded-xl bg-zinc-800/30 border border-zinc-700/50 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span className="font-medium text-white">Educational Content</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-zinc-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-400" />
        )}
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-4 text-sm">
              <div>
                <h5 className="font-medium text-zinc-300 mb-1">Overview</h5>
                <p className="text-zinc-400 text-xs">{education.overview}</p>
              </div>
              
              <div>
                <h5 className="font-medium text-zinc-300 mb-2">How It Works</h5>
                <ol className="space-y-1 text-xs text-zinc-400">
                  {education.howItWorks.map((step: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-cyan-400 font-mono">{i + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-red-400 mb-2">Impact</h5>
                  <ul className="space-y-1 text-xs text-zinc-400">
                    {education.impact.slice(0, 4).map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-1">
                        <AlertTriangle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h5 className="font-medium text-emerald-400 mb-2">Prevention</h5>
                  <ul className="space-y-1 text-xs text-zinc-400">
                    {education.prevention.slice(0, 4).map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-1">
                        <Shield className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {education.mitreAttackId && (
                <div className="flex items-center gap-2 pt-2 border-t border-zinc-700/50">
                  <span className="text-xs text-zinc-500">MITRE ATT&CK:</span>
                  <a 
                    href={`https://attack.mitre.org/techniques/${education.mitreAttackId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-cyan-400 hover:underline font-mono"
                  >
                    {education.mitreAttackId}
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AttackControlPanel({
  className,
  showEducation = true,
  onAttackStart,
  onAttackStop,
}: AttackControlPanelProps) {
  const [activeCategory, setActiveCategory] = useState<AttackCategory | 'all'>('all');
  
  const {
    initialize,
    isInitialized,
    topology,
    activeAttacks,
    selectedAttackId,
    selectedTemplate,
    selectTemplate,
    startFromTemplate,
    startAttack,
    stopAttack,
    pauseAttack,
    resumeAttack,
    stopAllAttacks,
    selectAttack,
    isEventLogExpanded,
    toggleEventLog,
    clearHistory,
  } = useAttackSimulationStore();

  const templates = selectAttackTemplates();
  const filteredTemplates = activeCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === activeCategory);

  const currentAttack = selectedAttackId ? activeAttacks.get(selectedAttackId) : null;
  const isRunning = currentAttack?.status === 'running';
  const isPaused = currentAttack?.status === 'paused';

  // Initialize on mount
  React.useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  const handleStartAttack = useCallback(async () => {
    if (!selectedTemplate) return;
    
    // Check if topology has required nodes
    if (!topology || topology.nodes.length < 2) {
      console.warn('Need at least 2 nodes in topology');
      return;
    }

    // Find attacker and target nodes
    const attackerNode = topology.nodes.find(n => n.isAttacker) || topology.nodes[0];
    const targetNode = topology.nodes.find(n => n.isTarget) || topology.nodes[1];
    const gatewayNode = topology.nodes.find(n => n.type === 'router');

    const config: Partial<AttackConfig> = {
      source: {
        ip: attackerNode.ip,
        mac: attackerNode.mac,
        hostname: attackerNode.name,
      },
      target: {
        ip: targetNode.ip,
        mac: targetNode.mac,
        hostname: targetNode.name,
      },
    };

    // Add gateway for ARP spoofing
    if (selectedTemplate.attackType === 'arp-spoofing' && gatewayNode) {
      (config as any).gateway = {
        ip: gatewayNode.ip,
        mac: gatewayNode.mac,
      };
    }

    try {
      const attackId = await startFromTemplate(selectedTemplate.id, config);
      onAttackStart?.(attackId);
    } catch (error) {
      console.error('Failed to start attack:', error);
    }
  }, [selectedTemplate, topology, startFromTemplate, onAttackStart]);

  const handleStopAttack = useCallback(async () => {
    if (!selectedAttackId) return;
    await stopAttack(selectedAttackId);
    onAttackStop?.(selectedAttackId);
  }, [selectedAttackId, stopAttack, onAttackStop]);

  const categories: Array<{ id: AttackCategory | 'all'; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'reconnaissance', label: 'Recon' },
    { id: 'spoofing', label: 'Spoofing' },
    { id: 'denial-of-service', label: 'DoS' },
    { id: 'man-in-the-middle', label: 'MITM' },
  ];

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800/50">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-white">Attack Simulator</h3>
        </div>
        
        {activeAttacks.size > 0 && (
          <button
            onClick={stopAllAttacks}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
          >
            <Square className="w-3 h-3" />
            Stop All
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-1 p-4 border-b border-zinc-800/50 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
              activeCategory === cat.id
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 border border-transparent'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Template Selection */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {filteredTemplates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isSelected={selectedTemplate?.id === template.id}
            onSelect={() => selectTemplate(template)}
          />
        ))}
      </div>

      {/* Control Panel */}
      {selectedTemplate && (
        <div className="border-t border-zinc-800/50 p-4 space-y-4">
          {/* Attack Controls */}
          <div className="flex items-center gap-2">
            {!isRunning && !isPaused ? (
              <button
                onClick={handleStartAttack}
                disabled={!topology || topology.nodes.length < 2}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all',
                  topology && topology.nodes.length >= 2
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-zinc-900'
                    : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                )}
              >
                <Play className="w-5 h-5" />
                Start Attack
              </button>
            ) : (
              <>
                {isRunning ? (
                  <button
                    onClick={() => pauseAttack(selectedAttackId!)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 font-semibold transition-colors"
                  >
                    <Pause className="w-5 h-5" />
                    Pause
                  </button>
                ) : (
                  <button
                    onClick={() => resumeAttack(selectedAttackId!)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 font-semibold transition-colors"
                  >
                    <Play className="w-5 h-5" />
                    Resume
                  </button>
                )}
                <button
                  onClick={handleStopAttack}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 font-semibold transition-colors"
                >
                  <Square className="w-5 h-5" />
                  Stop
                </button>
              </>
            )}
          </div>

          {/* Statistics */}
          {selectedAttackId && <Statistics attackId={selectedAttackId} />}

          {/* Event Log */}
          {selectedAttackId && (
            <div className="space-y-2">
              <button
                onClick={toggleEventLog}
                className="flex items-center justify-between w-full text-sm font-medium text-zinc-300"
              >
                <span>Event Log</span>
                {isEventLogExpanded ? (
                  <ChevronUp className="w-4 h-4 text-zinc-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-zinc-500" />
                )}
              </button>
              
              <AnimatePresence>
                {isEventLogExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <EventLog attackId={selectedAttackId} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Educational Content */}
          {showEducation && selectedTemplate && (
            <EducationalPanel attackType={selectedTemplate.attackType} />
          )}
        </div>
      )}

      {/* No topology warning */}
      {(!topology || topology.nodes.length < 2) && selectedTemplate && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Configure a network topology with at least 2 nodes to start an attack.</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default AttackControlPanel;
