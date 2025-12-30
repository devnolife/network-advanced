'use client';

import { memo, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge, Card } from '../ui';
import {
  PacketInfo,
  PACKET_TYPE_COLORS,
  PACKET_TYPE_LABELS,
  PACKET_STATUS_LABELS,
  PACKET_STATUS_COLORS
} from './types';

interface PacketListProps {
  packets: PacketInfo[];
  selectedPacketId?: string | null;
  onPacketClick?: (packet: PacketInfo) => void;
  maxItems?: number;
}

function PacketListComponent({
  packets,
  selectedPacketId,
  onPacketClick,
  maxItems = 50
}: PacketListProps) {
  const [filter, setFilter] = useState<PacketInfo['type'] | 'all'>('all');

  // Filter packets
  const filteredPackets = useMemo(() => {
    let filtered = packets;
    if (filter !== 'all') {
      filtered = packets.filter(p => p.type === filter);
    }
    return filtered.slice(-maxItems).reverse();
  }, [packets, filter, maxItems]);

  // Get unique packet types for filter
  const packetTypes = useMemo(() => {
    const types = new Set(packets.map(p => p.type));
    return Array.from(types);
  }, [packets]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
          Daftar Paket
        </h3>

        {/* Filter */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-2 py-1 text-xs rounded-full transition-colors ${filter === 'all'
                ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
              }`}
          >
            Semua ({packets.length})
          </button>
          {packetTypes.map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-2 py-1 text-xs rounded-full transition-colors ${filter === type
                  ? 'text-white'
                  : 'text-gray-600 hover:opacity-80 dark:text-gray-400'
                }`}
              style={{
                backgroundColor: filter === type ? PACKET_TYPE_COLORS[type] : `${PACKET_TYPE_COLORS[type]}20`
              }}
            >
              {type.toUpperCase()} ({packets.filter(p => p.type === type).length})
            </button>
          ))}
        </div>
      </div>

      {/* Packet List */}
      <div className="flex-1 overflow-y-auto">
        {filteredPackets.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            Belum ada paket
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            <AnimatePresence>
              {filteredPackets.map((packet, index) => (
                <motion.div
                  key={packet.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => onPacketClick?.(packet)}
                  className={`p-3 cursor-pointer transition-colors ${selectedPacketId === packet.id
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Packet Type Icon */}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${PACKET_TYPE_COLORS[packet.type]}20` }}
                    >
                      <span
                        className="text-xs font-bold"
                        style={{ color: PACKET_TYPE_COLORS[packet.type] }}
                      >
                        {packet.type.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Packet Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {PACKET_TYPE_LABELS[packet.type]}
                        </span>
                        <Badge
                          size="sm"
                          style={{
                            backgroundColor: `${PACKET_STATUS_COLORS[packet.status]}20`,
                            color: PACKET_STATUS_COLORS[packet.status]
                          }}
                        >
                          {PACKET_STATUS_LABELS[packet.status]}
                        </Badge>
                      </div>

                      <div className="text-xs text-gray-500 truncate">
                        {packet.sourceDevice} → {packet.targetDevice}
                      </div>

                      {packet.sourceIP && packet.targetIP && (
                        <div className="text-xs text-gray-400 font-mono truncate">
                          {packet.sourceIP} → {packet.targetIP}
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(packet.timestamp).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
              {packets.filter(p => p.status === 'received').length}
            </div>
            <div className="text-xs text-gray-500">Diterima</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
              {packets.filter(p => p.status === 'sending' || p.status === 'in-transit').length}
            </div>
            <div className="text-xs text-gray-500">Transit</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-500">
              {packets.filter(p => p.status === 'dropped').length}
            </div>
            <div className="text-xs text-gray-500">Dropped</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-500">
              {packets.filter(p => p.status === 'timeout').length}
            </div>
            <div className="text-xs text-gray-500">Timeout</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const PacketList = memo(PacketListComponent);
