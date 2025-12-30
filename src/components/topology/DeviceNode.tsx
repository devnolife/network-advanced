'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { DeviceNodeProps, DEVICE_ICONS, STATUS_COLORS } from './types';

const NODE_SIZE = 50;
const ICON_SIZE = 28;

function DeviceNodeComponent({
  node,
  isSelected = false,
  isHovered = false,
  onClick,
  onDoubleClick,
  onMouseEnter,
  onMouseLeave,
  showLabel = true,
  showStatus = true
}: DeviceNodeProps) {
  const icon = DEVICE_ICONS[node.type];
  const statusColor = STATUS_COLORS[node.status];

  // Calculate selection/hover ring size
  const ringSize = NODE_SIZE + 8;

  return (
    <motion.g
      className="device-node cursor-pointer"
      transform={`translate(${node.x}, ${node.y})`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Selection/Hover Ring */}
      {(isSelected || isHovered) && (
        <motion.circle
          r={ringSize / 2}
          fill="none"
          stroke={isSelected ? '#3b82f6' : '#94a3b8'}
          strokeWidth={isSelected ? 3 : 2}
          strokeDasharray={isSelected ? 'none' : '5,5'}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}

      {/* Background Circle */}
      <circle
        r={NODE_SIZE / 2}
        fill="white"
        stroke={isSelected ? '#3b82f6' : '#e2e8f0'}
        strokeWidth={2}
        filter="url(#dropShadow)"
      />

      {/* Device Icon */}
      <g transform={`translate(${-ICON_SIZE / 2}, ${-ICON_SIZE / 2})`}>
        <svg
          width={ICON_SIZE}
          height={ICON_SIZE}
          viewBox={icon.viewBox}
        >
          <path
            d={icon.path}
            fill={icon.color}
          />
        </svg>
      </g>

      {/* Status Indicator */}
      {showStatus && (
        <motion.g transform={`translate(${NODE_SIZE / 2 - 8}, ${-NODE_SIZE / 2 + 8})`}>
          <circle
            r={6}
            fill="white"
            stroke="#e2e8f0"
            strokeWidth={1}
          />
          <motion.circle
            r={4}
            fill={statusColor}
            animate={node.status === 'booting' ? {
              opacity: [1, 0.3, 1],
              scale: [1, 0.8, 1]
            } : {}}
            transition={{
              duration: 1,
              repeat: node.status === 'booting' ? Infinity : 0,
              ease: 'easeInOut'
            }}
          />
        </motion.g>
      )}

      {/* Label */}
      {showLabel && (
        <text
          y={NODE_SIZE / 2 + 16}
          textAnchor="middle"
          fill="#374151"
          fontSize={12}
          fontWeight={500}
          className="select-none"
        >
          {node.label}
        </text>
      )}

      {/* Device Type Badge */}
      <g transform={`translate(${-NODE_SIZE / 2 - 2}, ${NODE_SIZE / 2 - 12})`}>
        <rect
          x={0}
          y={0}
          width={NODE_SIZE + 4}
          height={14}
          rx={3}
          fill={icon.color}
          opacity={0.1}
        />
        <text
          x={(NODE_SIZE + 4) / 2}
          y={10}
          textAnchor="middle"
          fill={icon.color}
          fontSize={8}
          fontWeight={600}
          className="select-none uppercase"
        >
          {node.type}
        </text>
      </g>
    </motion.g>
  );
}

// Memoize for performance
export const DeviceNode = memo(DeviceNodeComponent);
