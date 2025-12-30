'use client';

import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  status: 'up' | 'down' | 'admin-down' | 'booting' | 'online' | 'offline';
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
  className?: string;
}

export function StatusIndicator({
  status,
  size = 'md',
  showPulse = true,
  className,
}: StatusIndicatorProps) {
  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const statusColors: Record<StatusIndicatorProps['status'], string> = {
    up: 'bg-emerald-500',
    online: 'bg-emerald-500',
    down: 'bg-red-500',
    offline: 'bg-red-500',
    'admin-down': 'bg-amber-500',
    booting: 'bg-amber-500',
  };

  const pulseColors: Record<StatusIndicatorProps['status'], string> = {
    up: 'bg-emerald-400',
    online: 'bg-emerald-400',
    down: 'bg-red-400',
    offline: 'bg-red-400',
    'admin-down': 'bg-amber-400',
    booting: 'bg-amber-400',
  };

  const shouldPulse = showPulse && (status === 'booting' || status === 'admin-down');

  return (
    <span className={cn('relative inline-flex', className)}>
      <span
        className={cn(
          'rounded-full',
          sizes[size],
          statusColors[status]
        )}
      />
      {shouldPulse && (
        <span
          className={cn(
            'absolute inset-0 rounded-full animate-ping opacity-75',
            sizes[size],
            pulseColors[status]
          )}
        />
      )}
    </span>
  );
}

// Interface Status Component
interface InterfaceStatusProps {
  name: string;
  ip?: string;
  mask?: string;
  status: 'up' | 'down' | 'admin-down';
  description?: string;
  className?: string;
}

export function InterfaceStatus({
  name,
  ip,
  mask,
  status,
  description,
  className,
}: InterfaceStatusProps) {
  const statusLabels: Record<InterfaceStatusProps['status'], string> = {
    up: 'Aktif',
    down: 'Mati',
    'admin-down': 'Dinonaktifkan',
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <StatusIndicator status={status} size="md" />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-zinc-100 text-sm">{name}</span>
            <span
              className={cn(
                'text-xs px-1.5 py-0.5 rounded',
                status === 'up'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : status === 'down'
                    ? 'bg-red-500/10 text-red-400'
                    : 'bg-amber-500/10 text-amber-400'
              )}
            >
              {statusLabels[status]}
            </span>
          </div>
          {ip && (
            <span className="text-xs text-zinc-500">
              {ip}/{mask ? mask.split('.').reduce((acc, octet) => acc + (parseInt(octet).toString(2).match(/1/g) || []).length, 0) : '24'}
            </span>
          )}
          {description && (
            <span className="text-xs text-zinc-500 block">{description}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// Device Status Header
interface DeviceStatusHeaderProps {
  name: string;
  hostname: string;
  type: string;
  status: 'online' | 'offline' | 'booting';
  className?: string;
}

export function DeviceStatusHeader({
  name,
  hostname,
  type,
  status,
  className,
}: DeviceStatusHeaderProps) {
  const statusLabels: Record<DeviceStatusHeaderProps['status'], string> = {
    online: 'Online',
    offline: 'Offline',
    booting: 'Booting...',
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <StatusIndicator status={status} size="lg" />
      <div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">{name}</span>
          <span className="text-xs text-zinc-500">({hostname})</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-400 capitalize">{type}</span>
          <span className="text-zinc-600">•</span>
          <span
            className={cn(
              status === 'online'
                ? 'text-emerald-400'
                : status === 'offline'
                  ? 'text-red-400'
                  : 'text-amber-400'
            )}
          >
            {statusLabels[status]}
          </span>
        </div>
      </div>
    </div>
  );
}
