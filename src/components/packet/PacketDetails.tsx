'use client';

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ArrowRight,
  Clock,
  Wifi,
  Server,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import { Badge, Card } from '../ui';
import {
  PacketDetailsProps,
  PACKET_TYPE_COLORS,
  PACKET_TYPE_LABELS,
  PACKET_STATUS_LABELS,
  PACKET_STATUS_COLORS
} from './types';

function PacketDetailsComponent({
  packet,
  steps = [],
  onClose
}: PacketDetailsProps) {
  const color = PACKET_TYPE_COLORS[packet.type];
  const statusColor = PACKET_STATUS_COLORS[packet.status];

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'receive':
        return <Wifi size={14} className="text-blue-500" />;
      case 'process':
        return <Server size={14} className="text-purple-500" />;
      case 'forward':
        return <ArrowRight size={14} className="text-green-500" />;
      case 'drop':
        return <XCircle size={14} className="text-red-500" />;
      case 'respond':
        return <CheckCircle size={14} className="text-emerald-500" />;
      default:
        return <AlertCircle size={14} className="text-gray-500" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-80 max-h-[500px] overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: `${color}15` }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: color }}
          >
            <span className="text-white font-bold text-sm">
              {packet.type.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">
              {PACKET_TYPE_LABELS[packet.type]}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Paket ID: {packet.id.slice(0, 8)}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X size={18} className="text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
          <Badge
            style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
          >
            {PACKET_STATUS_LABELS[packet.status]}
          </Badge>
        </div>

        {/* Source & Target */}
        <Card variant="bordered" className="p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-center flex-1">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sumber</div>
              <div className="font-medium text-sm text-gray-800 dark:text-gray-200">
                {packet.sourceDevice}
              </div>
              {packet.sourceIP && (
                <div className="text-xs text-gray-500">{packet.sourceIP}</div>
              )}
            </div>

            <ArrowRight size={20} className="text-gray-400 flex-shrink-0" />

            <div className="text-center flex-1">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tujuan</div>
              <div className="font-medium text-sm text-gray-800 dark:text-gray-200">
                {packet.targetDevice}
              </div>
              {packet.targetIP && (
                <div className="text-xs text-gray-500">{packet.targetIP}</div>
              )}
            </div>
          </div>
        </Card>

        {/* Details */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Detail Paket
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {packet.protocol && (
              <>
                <span className="text-gray-500">Protokol</span>
                <span className="text-gray-800 dark:text-gray-200">{packet.protocol}</span>
              </>
            )}
            {packet.port && (
              <>
                <span className="text-gray-500">Port</span>
                <span className="text-gray-800 dark:text-gray-200">{packet.port}</span>
              </>
            )}
            {packet.size && (
              <>
                <span className="text-gray-500">Ukuran</span>
                <span className="text-gray-800 dark:text-gray-200">{packet.size} bytes</span>
              </>
            )}
            {packet.ttl && (
              <>
                <span className="text-gray-500">TTL</span>
                <span className="text-gray-800 dark:text-gray-200">{packet.ttl}</span>
              </>
            )}
          </div>
        </div>

        {/* MAC Addresses */}
        {(packet.sourceMAC || packet.targetMAC) && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              MAC Address
            </h4>
            <div className="text-xs font-mono space-y-1">
              {packet.sourceMAC && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Src:</span>
                  <span className="text-gray-700 dark:text-gray-300">{packet.sourceMAC}</span>
                </div>
              )}
              {packet.targetMAC && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Dst:</span>
                  <span className="text-gray-700 dark:text-gray-300">{packet.targetMAC}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock size={12} />
          <span>
            {new Date(packet.timestamp).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              fractionalSecondDigits: 3
            })}
          </span>
        </div>

        {/* Flow Steps */}
        {steps.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Alur Paket
            </h4>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-gray-200 dark:bg-gray-700" />

              {/* Steps */}
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative flex gap-3 pl-6"
                  >
                    {/* Step indicator */}
                    <div className="absolute left-0 w-6 h-6 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center">
                      {getActionIcon(step.action)}
                    </div>

                    {/* Step content */}
                    <div className="flex-1 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-800 dark:text-gray-200">
                          {step.deviceName}
                        </span>
                        <Badge size="sm" variant="default">
                          {step.action}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {step.description}
                      </p>
                      {step.details && step.details.length > 0 && (
                        <ul className="mt-1 text-xs text-gray-400 list-disc list-inside">
                          {step.details.map((detail, i) => (
                            <li key={i}>{detail}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Raw Data */}
        {packet.data && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Data
            </h4>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2 font-mono text-xs text-gray-600 dark:text-gray-400 break-all">
              {packet.data}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export const PacketDetails = memo(PacketDetailsComponent);
