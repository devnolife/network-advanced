'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Grid,
  Eye,
  EyeOff,
  Tag
} from 'lucide-react';

interface TopologyControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onFitToContent: () => void;
  onToggleFullscreen?: () => void;
  onToggleLabels?: () => void;
  onToggleGrid?: () => void;
  showLabels?: boolean;
  showGrid?: boolean;
  isFullscreen?: boolean;
  zoomLevel?: number;
  className?: string;
}

interface ControlButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
}

function ControlButton({ onClick, icon, label, isActive = false }: ControlButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`
        relative p-2 rounded-lg transition-colors
        ${isActive
          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
          : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
        }
        shadow-sm border border-gray-200 dark:border-gray-700
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={label}
    >
      {icon}
    </motion.button>
  );
}

function TopologyControlsComponent({
  onZoomIn,
  onZoomOut,
  onReset,
  onFitToContent,
  onToggleFullscreen,
  onToggleLabels,
  onToggleGrid,
  showLabels = true,
  showGrid = false,
  isFullscreen = false,
  zoomLevel = 100,
  className = ''
}: TopologyControlsProps) {
  return (
    <motion.div
      className={`flex flex-col gap-2 ${className}`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
    >
      {/* Zoom Controls */}
      <div className="flex flex-col gap-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl p-1 shadow-lg border border-gray-200 dark:border-gray-700">
        <ControlButton
          onClick={onZoomIn}
          icon={<ZoomIn size={18} />}
          label="Zoom In (Perbesar)"
        />

        {/* Zoom Level Display */}
        <div className="px-2 py-1 text-center text-xs font-medium text-gray-600 dark:text-gray-400 border-y border-gray-100 dark:border-gray-700">
          {Math.round(zoomLevel)}%
        </div>

        <ControlButton
          onClick={onZoomOut}
          icon={<ZoomOut size={18} />}
          label="Zoom Out (Perkecil)"
        />
      </div>

      {/* View Controls */}
      <div className="flex flex-col gap-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl p-1 shadow-lg border border-gray-200 dark:border-gray-700">
        <ControlButton
          onClick={onFitToContent}
          icon={<Maximize2 size={18} />}
          label="Fit to Content (Sesuaikan)"
        />

        <ControlButton
          onClick={onReset}
          icon={<RotateCcw size={18} />}
          label="Reset View (Reset Tampilan)"
        />

        {onToggleFullscreen && (
          <ControlButton
            onClick={onToggleFullscreen}
            icon={isFullscreen ? <Maximize2 size={18} /> : <Maximize2 size={18} />}
            label={isFullscreen ? 'Exit Fullscreen (Keluar Layar Penuh)' : 'Fullscreen (Layar Penuh)'}
            isActive={isFullscreen}
          />
        )}
      </div>

      {/* Display Options */}
      <div className="flex flex-col gap-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl p-1 shadow-lg border border-gray-200 dark:border-gray-700">
        {onToggleLabels && (
          <ControlButton
            onClick={onToggleLabels}
            icon={showLabels ? <Tag size={18} /> : <Tag size={18} className="opacity-50" />}
            label={showLabels ? 'Sembunyikan Label' : 'Tampilkan Label'}
            isActive={showLabels}
          />
        )}

        {onToggleGrid && (
          <ControlButton
            onClick={onToggleGrid}
            icon={showGrid ? <Grid size={18} /> : <Grid size={18} className="opacity-50" />}
            label={showGrid ? 'Sembunyikan Grid' : 'Tampilkan Grid'}
            isActive={showGrid}
          />
        )}
      </div>

      {/* Legend Toggle */}
      <div className="flex flex-col gap-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl p-1 shadow-lg border border-gray-200 dark:border-gray-700">
        <ControlButton
          onClick={() => { }}
          icon={<Eye size={18} />}
          label="Legenda"
        />
      </div>
    </motion.div>
  );
}

export const TopologyControls = memo(TopologyControlsComponent);
