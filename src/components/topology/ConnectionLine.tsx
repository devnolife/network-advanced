'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ConnectionLineProps, CONNECTION_STATUS_COLORS } from './types';

const NODE_RADIUS = 25; // Half of NODE_SIZE

function ConnectionLineComponent({
  connection,
  sourceNode,
  targetNode,
  isSelected = false,
  onClick,
  animated = true
}: ConnectionLineProps) {
  const statusColor = CONNECTION_STATUS_COLORS[connection.status];

  // Calculate line endpoints (from edge of nodes, not center)
  const lineData = useMemo(() => {
    const dx = targetNode.x - sourceNode.x;
    const dy = targetNode.y - sourceNode.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return null;

    // Normalize direction
    const nx = dx / distance;
    const ny = dy / distance;

    // Calculate points on the edge of the nodes
    const x1 = sourceNode.x + nx * NODE_RADIUS;
    const y1 = sourceNode.y + ny * NODE_RADIUS;
    const x2 = targetNode.x - nx * NODE_RADIUS;
    const y2 = targetNode.y - ny * NODE_RADIUS;

    // Midpoint for label
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    // Angle for rotating labels
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    return { x1, y1, x2, y2, midX, midY, angle, distance: distance - NODE_RADIUS * 2 };
  }, [sourceNode.x, sourceNode.y, targetNode.x, targetNode.y]);

  if (!lineData) return null;

  const { x1, y1, x2, y2, midX, midY } = lineData;

  return (
    <g className="connection-line cursor-pointer" onClick={onClick}>
      {/* Selection highlight */}
      {isSelected && (
        <motion.line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#3b82f6"
          strokeWidth={8}
          strokeLinecap="round"
          opacity={0.3}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Main connection line */}
      <motion.line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={connection.status === 'down' ? '#e2e8f0' : statusColor}
        strokeWidth={isSelected ? 4 : 3}
        strokeLinecap="round"
        strokeDasharray={connection.status === 'down' ? '8,4' : 'none'}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5 }}
      />

      {/* Animated packet flow indicator */}
      {animated && connection.status === 'packet-flow' && (
        <motion.circle
          r={4}
          fill="#3b82f6"
          initial={{ cx: x1, cy: y1 }}
          animate={{
            cx: [x1, x2, x1],
            cy: [y1, y2, y1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      )}

      {/* Connection status dot at midpoint */}
      <circle
        cx={midX}
        cy={midY}
        r={6}
        fill="white"
        stroke={statusColor}
        strokeWidth={2}
      />
      <circle
        cx={midX}
        cy={midY}
        r={3}
        fill={statusColor}
      />

      {/* Interface labels */}
      {connection.sourceInterface && (
        <g transform={`translate(${x1 + (x2 - x1) * 0.15}, ${y1 + (y2 - y1) * 0.15})`}>
          <rect
            x={-20}
            y={-8}
            width={40}
            height={16}
            rx={3}
            fill="white"
            stroke="#e2e8f0"
            strokeWidth={1}
          />
          <text
            textAnchor="middle"
            y={4}
            fontSize={9}
            fill="#64748b"
            className="select-none"
          >
            {connection.sourceInterface}
          </text>
        </g>
      )}

      {connection.targetInterface && (
        <g transform={`translate(${x1 + (x2 - x1) * 0.85}, ${y1 + (y2 - y1) * 0.85})`}>
          <rect
            x={-20}
            y={-8}
            width={40}
            height={16}
            rx={3}
            fill="white"
            stroke="#e2e8f0"
            strokeWidth={1}
          />
          <text
            textAnchor="middle"
            y={4}
            fontSize={9}
            fill="#64748b"
            className="select-none"
          >
            {connection.targetInterface}
          </text>
        </g>
      )}

      {/* Bandwidth label (if provided) */}
      {connection.bandwidth && (
        <text
          x={midX}
          y={midY - 14}
          textAnchor="middle"
          fontSize={10}
          fill="#64748b"
          className="select-none"
        >
          {connection.bandwidth}
        </text>
      )}
    </g>
  );
}

// Memoize for performance
export const ConnectionLine = memo(ConnectionLineComponent);
