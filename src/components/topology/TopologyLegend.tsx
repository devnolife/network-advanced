'use client';

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { DEVICE_ICONS, STATUS_COLORS, CONNECTION_STATUS_COLORS } from './types';

interface TopologyLegendProps {
  isOpen: boolean;
  onClose: () => void;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

function TopologyLegendComponent({
  isOpen,
  onClose,
  position = 'bottom-left'
}: TopologyLegendProps) {
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  const deviceTypes = [
    { type: 'router', label: 'Router' },
    { type: 'pc', label: 'PC / Komputer' },
    { type: 'switch', label: 'Switch' },
    { type: 'server', label: 'Server' },
    { type: 'cloud', label: 'Cloud / Internet' }
  ] as const;

  const statusTypes = [
    { status: 'up', label: 'Aktif / Up' },
    { status: 'down', label: 'Mati / Down' },
    { status: 'booting', label: 'Booting' },
    { status: 'warning', label: 'Peringatan' }
  ] as const;

  const connectionTypes = [
    { status: 'up', label: 'Koneksi Aktif' },
    { status: 'down', label: 'Koneksi Mati' },
    { status: 'packet-flow', label: 'Aliran Paket' }
  ] as const;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`absolute ${positionClasses[position]} z-20`}
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ duration: 0.2 }}
        >
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 min-w-[280px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Legenda Topologi
              </h3>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>

            {/* Device Types */}
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Tipe Perangkat
              </h4>
              <div className="space-y-2">
                {deviceTypes.map(({ type, label }) => {
                  const icon = DEVICE_ICONS[type];
                  return (
                    <div key={type} className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${icon.color}15` }}
                      >
                        <svg width={16} height={16} viewBox={icon.viewBox}>
                          <path d={icon.path} fill={icon.color} />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status Indicators */}
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Status Perangkat
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {statusTypes.map(({ status, label }) => (
                  <div key={status} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[status] }}
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Connection Types */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Status Koneksi
              </h4>
              <div className="space-y-2">
                {connectionTypes.map(({ status, label }) => (
                  <div key={status} className="flex items-center gap-3">
                    <div className="w-8 flex items-center justify-center">
                      <svg width={32} height={8} viewBox="0 0 32 8">
                        <line
                          x1={0}
                          y1={4}
                          x2={32}
                          y2={4}
                          stroke={CONNECTION_STATUS_COLORS[status]}
                          strokeWidth={3}
                          strokeDasharray={status === 'down' ? '4,2' : 'none'}
                          strokeLinecap="round"
                        />
                        {status === 'packet-flow' && (
                          <motion.circle
                            r={3}
                            fill={CONNECTION_STATUS_COLORS[status]}
                            animate={{ cx: [2, 30, 2] }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: 'linear'
                            }}
                            cy={4}
                          />
                        )}
                      </svg>
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Interaksi
              </h4>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Klik perangkat untuk memilih</li>
                <li>• Double-klik untuk membuka konfigurasi</li>
                <li>• Drag untuk menggeser tampilan</li>
                <li>• Scroll untuk zoom</li>
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const TopologyLegend = memo(TopologyLegendComponent);
