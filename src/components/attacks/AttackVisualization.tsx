'use client';

/**
 * Attack Visualization Component
 * 
 * Real-time visualization of network attacks showing:
 * - Attack flow animation
 * - Packet flow between nodes
 * - Attack status indicators
 * - Detection alerts
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Wifi,
  WifiOff,
  Zap,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Radio,
  Server,
  Monitor,
  Router,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAttackSimulationStore } from '@/store/attackSimulationStore';
import { NetworkNode, AttackPacket, AttackStatus } from '@/lib/network/attacks/types';

// ============================================================================
// Types
// ============================================================================

interface AttackVisualizationProps {
  className?: string;
  width?: number;
  height?: number;
  showPacketFlow?: boolean;
  showLabels?: boolean;
  onNodeClick?: (node: NetworkNode) => void;
}

interface PacketAnimation {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  protocol: string;
  isMalicious: boolean;
  startTime: number;
}

// ============================================================================
// Constants
// ============================================================================

const NODE_SIZE = 60;
const ANIMATION_DURATION = 1000; // ms

const NODE_COLORS: Record<string, { bg: string; border: string; icon: string }> = {
  attacker: { bg: 'bg-red-500/20', border: 'border-red-500/50', icon: 'text-red-400' },
  target: { bg: 'bg-amber-500/20', border: 'border-amber-500/50', icon: 'text-amber-400' },
  router: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', icon: 'text-cyan-400' },
  server: { bg: 'bg-purple-500/20', border: 'border-purple-500/50', icon: 'text-purple-400' },
  pc: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', icon: 'text-emerald-400' },
  firewall: { bg: 'bg-orange-500/20', border: 'border-orange-500/50', icon: 'text-orange-400' },
  switch: { bg: 'bg-blue-500/20', border: 'border-blue-500/50', icon: 'text-blue-400' },
};

const getNodeIcon = (type: string) => {
  switch (type) {
    case 'attacker': return ShieldAlert;
    case 'router': return Router;
    case 'server': return Server;
    case 'pc': return Monitor;
    case 'firewall': return Shield;
    case 'switch': return Wifi;
    default: return Globe;
  }
};

// ============================================================================
// Component
// ============================================================================

export function AttackVisualization({
  className,
  width = 800,
  height = 500,
  showPacketFlow = true,
  showLabels = true,
  onNodeClick,
}: AttackVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [packetAnimations, setPacketAnimations] = useState<PacketAnimation[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);
  
  const { 
    topology, 
    activeAttacks, 
    selectedAttackId,
    alerts,
  } = useAttackSimulationStore();

  // Get current attack
  const currentAttack = selectedAttackId ? activeAttacks.get(selectedAttackId) : null;

  // Normalize node positions to fit container
  const normalizePosition = useCallback((x: number, y: number, maxX: number, maxY: number) => {
    const padding = NODE_SIZE;
    const normalizedX = padding + (x / maxX) * (width - padding * 2);
    const normalizedY = padding + (y / maxY) * (height - padding * 2);
    return { x: normalizedX, y: normalizedY };
  }, [width, height]);

  // Calculate node positions
  const nodePositions = React.useMemo(() => {
    if (!topology?.nodes.length) return new Map<string, { x: number; y: number }>();
    
    const positions = new Map<string, { x: number; y: number }>();
    const maxX = Math.max(...topology.nodes.map(n => n.x || 100), 100);
    const maxY = Math.max(...topology.nodes.map(n => n.y || 100), 100);
    
    topology.nodes.forEach(node => {
      positions.set(node.id, normalizePosition(node.x || 0, node.y || 0, maxX, maxY));
    });
    
    return positions;
  }, [topology, normalizePosition]);

  // Animate packets
  useEffect(() => {
    if (!showPacketFlow || !currentAttack) return;

    const handlePacket = (packet: AttackPacket) => {
      const sourceNode = topology?.nodes.find(n => n.ip === packet.sourceIP);
      const destNode = topology?.nodes.find(n => n.ip === packet.destIP);
      
      if (!sourceNode || !destNode) return;
      
      const sourcePos = nodePositions.get(sourceNode.id);
      const destPos = nodePositions.get(destNode.id);
      
      if (!sourcePos || !destPos) return;

      const animation: PacketAnimation = {
        id: packet.id,
        sourceX: sourcePos.x,
        sourceY: sourcePos.y,
        targetX: destPos.x,
        targetY: destPos.y,
        protocol: packet.protocol,
        isMalicious: packet.isMalicious,
        startTime: Date.now(),
      };

      setPacketAnimations(prev => [...prev.slice(-50), animation]);
    };

    // Subscribe to new packets
    const packets = currentAttack.packets;
    if (packets.length > 0) {
      const lastPacket = packets[packets.length - 1];
      handlePacket(lastPacket);
    }

    // Cleanup old animations
    const cleanup = setInterval(() => {
      setPacketAnimations(prev => 
        prev.filter(a => Date.now() - a.startTime < ANIMATION_DURATION)
      );
    }, 100);

    return () => clearInterval(cleanup);
  }, [currentAttack?.packets.length, showPacketFlow, topology, nodePositions]);

  // Render nothing if no topology
  if (!topology || topology.nodes.length === 0) {
    return (
      <div className={cn(
        'flex items-center justify-center bg-zinc-900/50 rounded-xl border border-zinc-800/50',
        className
      )} style={{ width, height }}>
        <div className="text-center text-zinc-500">
          <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No network topology loaded</p>
          <p className="text-sm mt-1">Configure a network to visualize attacks</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn(
        'relative overflow-hidden bg-zinc-950 rounded-xl border border-zinc-800/50',
        className
      )}
      style={{ width, height }}
    >
      {/* Grid Background */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle, #06b6d4 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      {/* Connection Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          {/* Gradient for malicious traffic */}
          <linearGradient id="malicious-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.8" />
          </linearGradient>
          
          {/* Gradient for normal traffic */}
          <linearGradient id="normal-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.5" />
          </linearGradient>
          
          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Draw links */}
        {topology.links.map((link, i) => {
          const sourcePos = nodePositions.get(link.source);
          const targetPos = nodePositions.get(link.target);
          if (!sourcePos || !targetPos) return null;

          return (
            <line
              key={`link-${i}`}
              x1={sourcePos.x}
              y1={sourcePos.y}
              x2={targetPos.x}
              y2={targetPos.y}
              stroke="#3f3f46"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          );
        })}

        {/* Animated packet flows */}
        <AnimatePresence>
          {packetAnimations.map((anim) => {
            const progress = Math.min((Date.now() - anim.startTime) / ANIMATION_DURATION, 1);
            const x = anim.sourceX + (anim.targetX - anim.sourceX) * progress;
            const y = anim.sourceY + (anim.targetY - anim.sourceY) * progress;

            return (
              <motion.g
                key={anim.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
              >
                {/* Packet trail */}
                <line
                  x1={anim.sourceX}
                  y1={anim.sourceY}
                  x2={x}
                  y2={y}
                  stroke={anim.isMalicious ? 'url(#malicious-gradient)' : 'url(#normal-gradient)'}
                  strokeWidth="3"
                  strokeLinecap="round"
                  filter="url(#glow)"
                />
                
                {/* Packet dot */}
                <circle
                  cx={x}
                  cy={y}
                  r={anim.isMalicious ? 6 : 4}
                  fill={anim.isMalicious ? '#ef4444' : '#06b6d4'}
                  filter="url(#glow)"
                />
              </motion.g>
            );
          })}
        </AnimatePresence>
      </svg>

      {/* Nodes */}
      {topology.nodes.map((node) => {
        const pos = nodePositions.get(node.id);
        if (!pos) return null;

        const NodeIcon = getNodeIcon(node.type);
        const colors = NODE_COLORS[node.isAttacker ? 'attacker' : node.isTarget ? 'target' : node.type] 
          || NODE_COLORS.pc;
        
        const hasAlert = alerts.some(a => a.sourceIP === node.ip && !a.acknowledged);

        return (
          <motion.div
            key={node.id}
            className={cn(
              'absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer',
              'transition-all duration-200'
            )}
            style={{ left: pos.x, top: pos.y }}
            whileHover={{ scale: 1.1 }}
            onClick={() => onNodeClick?.(node)}
          >
            {/* Node container */}
            <div className={cn(
              'relative p-3 rounded-xl border-2 backdrop-blur-sm',
              colors.bg,
              colors.border,
              node.isCompromised && 'ring-2 ring-red-500 ring-offset-2 ring-offset-zinc-950',
              hasAlert && 'animate-pulse'
            )}>
              <NodeIcon className={cn('w-8 h-8', colors.icon)} />
              
              {/* Status indicators */}
              {node.isAttacker && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <Zap className="w-2.5 h-2.5 text-white" />
                </div>
              )}
              
              {node.isTarget && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-2.5 h-2.5 text-white" />
                </div>
              )}
              
              {node.isCompromised && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center">
                  <XCircle className="w-2.5 h-2.5 text-white" />
                </div>
              )}
              
              {hasAlert && (
                <motion.div 
                  className="absolute -top-2 -left-2"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <ShieldAlert className="w-5 h-5 text-red-500" />
                </motion.div>
              )}
            </div>
            
            {/* Label */}
            {showLabels && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 text-center">
                <p className="text-xs font-medium text-zinc-300 whitespace-nowrap">
                  {node.name}
                </p>
                <p className="text-[10px] text-zinc-500">{node.ip}</p>
              </div>
            )}
          </motion.div>
        );
      })}

      {/* Attack Status Overlay */}
      {currentAttack && (
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <div className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg border backdrop-blur-sm',
            currentAttack.status === 'running' 
              ? 'bg-red-500/20 border-red-500/50 text-red-400'
              : currentAttack.status === 'paused'
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
              : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400'
          )}>
            {currentAttack.status === 'running' ? (
              <Activity className="w-4 h-4 animate-pulse" />
            ) : currentAttack.status === 'paused' ? (
              <Radio className="w-4 h-4" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            <span className="text-sm font-medium capitalize">
              {currentAttack.config.name}
            </span>
            <span className="text-xs opacity-70">
              ({currentAttack.status})
            </span>
          </div>
        </div>
      )}

      {/* Packet Rate Display */}
      {currentAttack?.status === 'running' && (
        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700/50 backdrop-blur-sm">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="text-sm text-zinc-300">
            {currentAttack.packets.length} packets
          </span>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex items-center gap-4 text-xs text-zinc-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Attacker</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span>Target</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-0.5 bg-red-500" />
          <span>Malicious Traffic</span>
        </div>
      </div>
    </div>
  );
}

export default AttackVisualization;
