'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  Trash2,
  Gauge,
  Activity
} from 'lucide-react';
import { Button, Badge } from '../ui';
import { PacketControlsProps } from './types';

function PacketControlsComponent({
  isPlaying,
  onPlayPause,
  onClear,
  onSpeedChange,
  speed,
  packetCount
}: PacketControlsProps) {
  const speedOptions = [
    { value: 0.5, label: '0.5x' },
    { value: 1, label: '1x' },
    { value: 2, label: '2x' },
    { value: 4, label: '4x' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-3"
    >
      <div className="flex items-center gap-4">
        {/* Play/Pause Button */}
        <Button
          size="sm"
          variant={isPlaying ? 'secondary' : 'primary'}
          onClick={onPlayPause}
        >
          {isPlaying ? (
            <>
              <Pause size={14} className="mr-1" />
              Pause
            </>
          ) : (
            <>
              <Play size={14} className="mr-1" />
              Play
            </>
          )}
        </Button>

        {/* Packet Counter */}
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-blue-500" />
          <div>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {packetCount}
            </span>
            <span className="text-xs text-gray-500 ml-1">paket</span>
          </div>
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />

        {/* Speed Control */}
        <div className="flex items-center gap-2">
          <Gauge size={16} className="text-gray-500" />
          <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            {speedOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onSpeedChange(option.value)}
                className={`px-2 py-1 text-xs font-medium transition-colors ${speed === option.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />

        {/* Clear Button */}
        <Button
          size="sm"
          variant="ghost"
          onClick={onClear}
          disabled={packetCount === 0}
        >
          <Trash2 size={14} className="mr-1" />
          Bersihkan
        </Button>

        {/* Status Indicator */}
        {isPlaying && (
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-green-500"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.5, 1]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
              Live
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export const PacketControls = memo(PacketControlsComponent);
