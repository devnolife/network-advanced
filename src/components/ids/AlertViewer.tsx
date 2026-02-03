'use client';

/**
 * Alert Viewer Component
 * 
 * Displays IDS/IPS alerts with filtering, sorting, and detailed view.
 * 
 * Network Security Virtual Lab - Educational Platform
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Clock,
  MapPin,
  Shield,
  Eye,
  EyeOff,
  CheckCheck,
  Flag,
  Trash2,
  ExternalLink,
  Copy,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIDSStore } from '@/store/idsStore';
import { IDSAlert, AlertSeverity, AlertStatus, RuleCategory } from '@/lib/network/ids/types';

// ============================================================================
// Types
// ============================================================================

interface AlertViewerProps {
  className?: string;
  maxHeight?: string;
}

interface AlertDetailProps {
  alert: IDSAlert;
  onClose: () => void;
  onAcknowledge: () => void;
  onResolve: () => void;
  onMarkFalsePositive: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const SEVERITY_CONFIG: Record<AlertSeverity, { 
  icon: React.ReactNode; 
  color: string; 
  bg: string;
  border: string;
  label: string;
}> = {
  critical: {
    icon: <XCircle className="w-4 h-4" />,
    color: 'text-red-400',
    bg: 'bg-red-500/20',
    border: 'border-red-500/50',
    label: 'Critical',
  },
  high: {
    icon: <AlertTriangle className="w-4 h-4" />,
    color: 'text-orange-400',
    bg: 'bg-orange-500/20',
    border: 'border-orange-500/50',
    label: 'High',
  },
  medium: {
    icon: <AlertCircle className="w-4 h-4" />,
    color: 'text-amber-400',
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/50',
    label: 'Medium',
  },
  low: {
    icon: <Info className="w-4 h-4" />,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/50',
    label: 'Low',
  },
  info: {
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'text-blue-400',
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/50',
    label: 'Info',
  },
};

const STATUS_CONFIG: Record<AlertStatus, {
  icon: React.ReactNode;
  color: string;
  label: string;
}> = {
  new: {
    icon: <AlertCircle className="w-3 h-3" />,
    color: 'text-cyan-400',
    label: 'New',
  },
  acknowledged: {
    icon: <Eye className="w-3 h-3" />,
    color: 'text-amber-400',
    label: 'Acknowledged',
  },
  investigating: {
    icon: <Search className="w-3 h-3" />,
    color: 'text-purple-400',
    label: 'Investigating',
  },
  resolved: {
    icon: <CheckCheck className="w-3 h-3" />,
    color: 'text-emerald-400',
    label: 'Resolved',
  },
  false_positive: {
    icon: <Flag className="w-3 h-3" />,
    color: 'text-zinc-400',
    label: 'False Positive',
  },
};

// ============================================================================
// Alert Detail Panel
// ============================================================================

function AlertDetail({ 
  alert, 
  onClose, 
  onAcknowledge, 
  onResolve, 
  onMarkFalsePositive 
}: AlertDetailProps) {
  const severity = SEVERITY_CONFIG[alert.severity];
  const status = STATUS_CONFIG[alert.status];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="w-full lg:w-96 bg-zinc-900/95 border-l border-zinc-800/50 overflow-y-auto"
    >
      {/* Header */}
      <div className={cn('p-4 border-b', severity.border, severity.bg)}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className={severity.color}>{severity.icon}</span>
            <span className={cn('text-sm font-medium', severity.color)}>
              {severity.label} Severity
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <h3 className="text-lg font-semibold text-zinc-100 mt-2">{alert.message}</h3>
        <p className="text-sm text-zinc-400 mt-1">{alert.ruleName}</p>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Status and Time */}
        <div className="flex items-center justify-between">
          <div className={cn('flex items-center gap-1.5 text-sm', status.color)}>
            {status.icon}
            <span>{status.label}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-zinc-500">
            <Clock className="w-3 h-3" />
            <span>{new Date(alert.timestamp).toLocaleString()}</span>
          </div>
        </div>

        {/* Network Details */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            Network Details
          </h4>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-2 bg-zinc-800/50 rounded-lg">
              <p className="text-zinc-500 text-xs">Source IP</p>
              <div className="flex items-center justify-between">
                <p className="text-zinc-200 font-mono">{alert.sourceIP}</p>
                <button
                  onClick={() => copyToClipboard(alert.sourceIP)}
                  className="p-1 text-zinc-500 hover:text-zinc-300"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
              {alert.sourcePort && (
                <p className="text-zinc-500 text-xs mt-1">Port: {alert.sourcePort}</p>
              )}
            </div>
            
            <div className="p-2 bg-zinc-800/50 rounded-lg">
              <p className="text-zinc-500 text-xs">Destination IP</p>
              <div className="flex items-center justify-between">
                <p className="text-zinc-200 font-mono">{alert.destIP}</p>
                <button
                  onClick={() => copyToClipboard(alert.destIP)}
                  className="p-1 text-zinc-500 hover:text-zinc-300"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
              {alert.destPort && (
                <p className="text-zinc-500 text-xs mt-1">Port: {alert.destPort}</p>
              )}
            </div>
          </div>

          <div className="p-2 bg-zinc-800/50 rounded-lg text-sm">
            <p className="text-zinc-500 text-xs">Protocol</p>
            <p className="text-zinc-200">{alert.protocol}</p>
          </div>
        </div>

        {/* Rule Details */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            Rule Details
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Rule ID</span>
              <span className="text-zinc-300 font-mono">{alert.ruleId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">SID</span>
              <span className="text-zinc-300 font-mono">{alert.ruleSID}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Category</span>
              <span className="text-zinc-300 capitalize">{alert.category.replace('-', ' ')}</span>
            </div>
            {alert.confidence && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Confidence</span>
                <span className="text-zinc-300">{(alert.confidence * 100).toFixed(0)}%</span>
              </div>
            )}
          </div>
        </div>

        {/* MITRE ATT&CK */}
        {alert.mitreAttack && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-amber-400" />
              MITRE ATT&CK
            </h4>
            <div className="p-3 bg-zinc-800/50 rounded-lg text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-500">Tactic</span>
                <span className="text-zinc-300 capitalize">{alert.mitreAttack.tactic}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Technique</span>
                <span className="text-cyan-400 font-mono">{alert.mitreAttack.technique}</span>
              </div>
              {alert.mitreAttack.subtechnique && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Sub-technique</span>
                  <span className="text-cyan-400 font-mono">{alert.mitreAttack.subtechnique}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Packet Info */}
        {alert.packet && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-400" />
              Packet Details
            </h4>
            <div className="p-3 bg-zinc-800/50 rounded-lg text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-500">Length</span>
                <span className="text-zinc-300">{alert.packet.length} bytes</span>
              </div>
              {alert.packet.flags && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Flags</span>
                  <span className="text-zinc-300 font-mono">{alert.packet.flags}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-4 border-t border-zinc-800/50">
          {alert.status === 'new' && (
            <button
              onClick={onAcknowledge}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Acknowledge Alert
            </button>
          )}
          
          {(alert.status === 'new' || alert.status === 'acknowledged') && (
            <button
              onClick={onResolve}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Mark as Resolved
            </button>
          )}
          
          {alert.status !== 'false_positive' && (
            <button
              onClick={onMarkFalsePositive}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-zinc-700/50 text-zinc-400 rounded-lg hover:bg-zinc-700 transition-colors"
            >
              <Flag className="w-4 h-4" />
              Mark as False Positive
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AlertViewer({ className, maxHeight = '600px' }: AlertViewerProps) {
  const {
    alerts,
    selectedAlertId,
    alertFilters,
    selectAlert,
    acknowledgeAlert,
    resolveAlert,
    markFalsePositive,
    clearAlerts,
    setAlertFilters,
    getFilteredAlerts,
  } = useIDSStore();

  const [showFilters, setShowFilters] = useState(false);

  const filteredAlerts = useMemo(() => getFilteredAlerts(), [alerts, alertFilters]);
  const selectedAlert = selectedAlertId 
    ? alerts.find(a => a.id === selectedAlertId) 
    : null;

  const severities: AlertSeverity[] = ['critical', 'high', 'medium', 'low', 'info'];
  const statuses: AlertStatus[] = ['new', 'acknowledged', 'investigating', 'resolved', 'false_positive'];
  const categories: RuleCategory[] = [
    'malware', 'exploit', 'scan', 'dos', 'ddos', 'web-attack', 
    'brute-force', 'policy-violation', 'reconnaissance', 'suspicious'
  ];

  return (
    <div className={cn('flex', className)} style={{ maxHeight }}>
      {/* Main Alert List */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="p-4 border-b border-zinc-800/50 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={alertFilters.searchQuery}
              onChange={(e) => setAlertFilters({ searchQuery: e.target.value })}
              className="w-full pl-10 pr-4 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={cn(
                'w-4 h-4 transition-transform',
                showFilters && 'rotate-180'
              )} />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500">
                {filteredAlerts.length} of {alerts.length} alerts
              </span>
              {alerts.length > 0 && (
                <button
                  onClick={clearAlerts}
                  className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                  title="Clear all alerts"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-3 overflow-hidden"
              >
                {/* Severity Filter */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setAlertFilters({ severity: 'all' })}
                    className={cn(
                      'px-2 py-1 text-xs rounded-md transition-colors',
                      alertFilters.severity === 'all'
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                    )}
                  >
                    All Severities
                  </button>
                  {severities.map((sev) => {
                    const config = SEVERITY_CONFIG[sev];
                    return (
                      <button
                        key={sev}
                        onClick={() => setAlertFilters({ severity: sev })}
                        className={cn(
                          'flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors',
                          alertFilters.severity === sev
                            ? cn(config.bg, config.color)
                            : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                        )}
                      >
                        {config.icon}
                        {config.label}
                      </button>
                    );
                  })}
                </div>

                {/* Status Filter */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setAlertFilters({ status: 'all' })}
                    className={cn(
                      'px-2 py-1 text-xs rounded-md transition-colors',
                      alertFilters.status === 'all'
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                    )}
                  >
                    All Status
                  </button>
                  {statuses.map((status) => {
                    const config = STATUS_CONFIG[status];
                    return (
                      <button
                        key={status}
                        onClick={() => setAlertFilters({ status })}
                        className={cn(
                          'flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors',
                          alertFilters.status === status
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                        )}
                      >
                        {config.icon}
                        {config.label}
                      </button>
                    );
                  })}
                </div>

                {/* Time Range Filter */}
                <div className="flex flex-wrap gap-2">
                  {(['all', '1h', '24h', '7d', '30d'] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setAlertFilters({ timeRange: range })}
                      className={cn(
                        'px-2 py-1 text-xs rounded-md transition-colors',
                        alertFilters.timeRange === range
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                      )}
                    >
                      {range === 'all' ? 'All Time' : `Last ${range}`}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Alert List */}
        <div className="flex-1 overflow-y-auto">
          {filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-zinc-500">
              <Shield className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-lg">No alerts found</p>
              <p className="text-sm mt-1">
                {alerts.length === 0 
                  ? 'System is monitoring for threats'
                  : 'Try adjusting your filters'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/50">
              {filteredAlerts.map((alert) => {
                const severity = SEVERITY_CONFIG[alert.severity];
                const status = STATUS_CONFIG[alert.status];
                const isSelected = selectedAlertId === alert.id;

                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                      'p-4 cursor-pointer transition-colors',
                      isSelected ? 'bg-cyan-500/10' : 'hover:bg-zinc-800/30'
                    )}
                    onClick={() => selectAlert(alert.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('p-1.5 rounded', severity.bg)}>
                        <span className={severity.color}>{severity.icon}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-zinc-200 truncate">
                            {alert.message}
                          </h4>
                          <span className={cn(
                            'flex items-center gap-1 px-1.5 py-0.5 text-xs rounded',
                            status.color,
                            'bg-zinc-800/50'
                          )}>
                            {status.icon}
                            {status.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                          <span className="font-mono">{alert.sourceIP}</span>
                          <span>→</span>
                          <span className="font-mono">{alert.destIP}</span>
                          <span className="capitalize">{alert.protocol}</span>
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-zinc-500">
                            {new Date(alert.timestamp).toLocaleString()}
                          </span>
                          <span className="text-xs text-zinc-600">•</span>
                          <span className="text-xs text-zinc-500 capitalize">
                            {alert.category.replace('-', ' ')}
                          </span>
                        </div>
                      </div>

                      <ChevronRight className={cn(
                        'w-5 h-5 text-zinc-600 transition-transform',
                        isSelected && 'rotate-90'
                      )} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Alert Detail Panel */}
      <AnimatePresence>
        {selectedAlert && (
          <AlertDetail
            alert={selectedAlert}
            onClose={() => selectAlert(null)}
            onAcknowledge={() => acknowledgeAlert(selectedAlert.id)}
            onResolve={() => resolveAlert(selectedAlert.id)}
            onMarkFalsePositive={() => markFalsePositive(selectedAlert.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default AlertViewer;
