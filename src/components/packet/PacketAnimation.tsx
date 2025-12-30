'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PacketAnimationProps, PACKET_TYPE_COLORS } from './types';

function PacketAnimationComponent({
  packet,
  sourcePosition,
  targetPosition,
  progress,
  isSelected = false,
  onClick
}: PacketAnimationProps) {
  const color = PACKET_TYPE_COLORS[packet.type];

  // Calculate current position based on progress
  const currentPosition = useMemo(() => {
    const x = sourcePosition.x + (targetPosition.x - sourcePosition.x) * progress;
    const y = sourcePosition.y + (targetPosition.y - sourcePosition.y) * progress;
    return { x, y };
  }, [sourcePosition, targetPosition, progress]);

  // Calculate rotation based on direction
  const rotation = useMemo(() => {
    const dx = targetPosition.x - sourcePosition.x;
    const dy = targetPosition.y - sourcePosition.y;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  }, [sourcePosition, targetPosition]);

  return (
    <motion.g
      className="packet-animation cursor-pointer"
      onClick={onClick}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
    >
      {/* Packet trail */}
      <motion.line
        x1={sourcePosition.x}
        y1={sourcePosition.y}
        x2={currentPosition.x}
        y2={currentPosition.y}
        stroke={color}
        strokeWidth={2}
        strokeOpacity={0.3}
        strokeDasharray="4,4"
      />

      {/* Selection ring */}
      {isSelected && (
        <motion.circle
          cx={currentPosition.x}
          cy={currentPosition.y}
          r={18}
          fill="none"
          stroke={color}
          strokeWidth={2}
          opacity={0.5}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.2, 0.5]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      )}

      {/* Packet body (arrow shape) */}
      <motion.g
        transform={`translate(${currentPosition.x}, ${currentPosition.y}) rotate(${rotation})`}
      >
        {/* Outer glow */}
        <motion.ellipse
          cx={0}
          cy={0}
          rx={14}
          ry={8}
          fill={color}
          opacity={0.2}
          animate={{
            rx: [14, 18, 14],
            ry: [8, 10, 8]
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />

        {/* Main packet shape */}
        <motion.polygon
          points="-8,-5 8,0 -8,5 -4,0"
          fill={color}
          animate={{
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 0.3,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />

        {/* Packet type indicator */}
        <text
          x={-2}
          y={2}
          fontSize={6}
          fill="white"
          fontWeight="bold"
          textAnchor="middle"
        >
          {packet.type.charAt(0).toUpperCase()}
        </text>
      </motion.g>

      {/* Packet label */}
      <text
        x={currentPosition.x}
        y={currentPosition.y - 16}
        fontSize={10}
        fill={color}
        textAnchor="middle"
        fontWeight={500}
        className="select-none"
      >
        {packet.type.toUpperCase()}
      </text>
    </motion.g>
  );
}

export const PacketAnimation = memo(PacketAnimationComponent);
