'use client';

import { cn } from '@/lib/utils';
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Bell,
  Target,
  BookOpen,
  Play,
  CalendarDays,
  Timer,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  StatusBadge,
  ProgressBar,
  Skeleton,
  EmptyState,
} from '@/components/ui';

// ============================================================================
// Types
// ============================================================================

interface Deadline {
  id: string;
  labId: string;
  labNumber: number;
  title: string;
  description: string;
  dueDate: Date;
  type: 'lab' | 'quiz' | 'assignment';
  status: 'upcoming' | 'urgent' | 'overdue' | 'completed';
  progress: number;
  totalTasks: number;
  completedTasks: number;
}

interface ScheduleEvent {
  id: string;
  title: string;
  date: Date;
  time: string;
  type: 'lab-session' | 'deadline' | 'announcement';
  labId?: string;
}

// ============================================================================
// Mock Data
// ============================================================================

const today = new Date();

const mockDeadlines: Deadline[] = [
  {
    id: '1',
    labId: 'lab-3',
    labNumber: 3,
    title: 'Lab 3: Konfigurasi Firewall',
    description: 'Konfigurasi firewall menggunakan iptables dan ufw',
    dueDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days
    type: 'lab',
    status: 'urgent',
    progress: 60,
    totalTasks: 5,
    completedTasks: 3,
  },
  {
    id: '2',
    labId: 'lab-4',
    labNumber: 4,
    title: 'Lab 4: Access Control List',
    description: 'Implementasi ACL pada router dan switch',
    dueDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days
    type: 'lab',
    status: 'upcoming',
    progress: 20,
    totalTasks: 6,
    completedTasks: 1,
  },
  {
    id: '3',
    labId: 'lab-5',
    labNumber: 5,
    title: 'Lab 5: VPN Configuration',
    description: 'Setup VPN menggunakan OpenVPN dan IPSec',
    dueDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days
    type: 'lab',
    status: 'upcoming',
    progress: 0,
    totalTasks: 7,
    completedTasks: 0,
  },
  {
    id: '4',
    labId: 'lab-2',
    labNumber: 2,
    title: 'Lab 2: Network Scanning',
    description: 'Teknik scanning jaringan dengan Nmap',
    dueDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    type: 'lab',
    status: 'completed',
    progress: 100,
    totalTasks: 4,
    completedTasks: 4,
  },
];

const mockEvents: ScheduleEvent[] = [
  {
    id: '1',
    title: 'Sesi Lab Firewall',
    date: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000),
    time: '09:00 - 11:00',
    type: 'lab-session',
    labId: 'lab-3',
  },
  {
    id: '2',
    title: 'Deadline Lab 3',
    date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
    time: '23:59',
    type: 'deadline',
    labId: 'lab-3',
  },
  {
    id: '3',
    title: 'Pengumuman Nilai Lab 2',
    date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
    time: '10:00',
    type: 'announcement',
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatShortDate = (date: Date): string => {
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  });
};

const getDaysRemaining = (date: Date): number => {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const getTimeRemaining = (date: Date): string => {
  const days = getDaysRemaining(date);
  if (days < 0) return `${Math.abs(days)} hari yang lalu`;
  if (days === 0) return 'Hari ini';
  if (days === 1) return 'Besok';
  if (days < 7) return `${days} hari lagi`;
  if (days < 30) return `${Math.floor(days / 7)} minggu lagi`;
  return `${Math.floor(days / 30)} bulan lagi`;
};

const getStatusColor = (status: Deadline['status']): 'success' | 'warning' | 'error' | 'info' => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'urgent':
      return 'error';
    case 'overdue':
      return 'error';
    default:
      return 'info';
  }
};

const getStatusLabel = (status: Deadline['status']): string => {
  switch (status) {
    case 'completed':
      return 'Selesai';
    case 'urgent':
      return 'Mendesak';
    case 'overdue':
      return 'Terlambat';
    default:
      return 'Mendatang';
  }
};

// ============================================================================
// Components
// ============================================================================

function DeadlineCard({ deadline }: { deadline: Deadline }) {
  const daysRemaining = getDaysRemaining(deadline.dueDate);
  const isUrgent = daysRemaining <= 2 && deadline.status !== 'completed';
  const isOverdue = daysRemaining < 0 && deadline.status !== 'completed';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={cn(
        "rounded-2xl border p-5 transition-all",
        isOverdue
          ? "border-red-500/30 bg-red-500/5"
          : isUrgent
            ? "border-amber-500/30 bg-amber-500/5"
            : deadline.status === 'completed'
              ? "border-emerald-500/30 bg-emerald-500/5"
              : "border-[var(--color-border)] bg-[var(--color-surface-1)] hover:border-[#088395]/30"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-[var(--color-muted-foreground)]">
              Lab #{deadline.labNumber.toString().padStart(2, '0')}
            </span>
            <StatusBadge
              status={getStatusColor(deadline.status)}
              size="sm"
              label={getStatusLabel(deadline.status)}
            />
          </div>
          <h3 className="font-semibold text-white mb-1">{deadline.title}</h3>
          <p className="text-xs text-[var(--color-muted-foreground)] line-clamp-2">
            {deadline.description}
          </p>
        </div>

        {/* Time indicator */}
        <div className={cn(
          "flex flex-col items-center justify-center w-16 h-16 rounded-xl ml-4",
          isOverdue
            ? "bg-red-500/20"
            : isUrgent
              ? "bg-amber-500/20"
              : deadline.status === 'completed'
                ? "bg-emerald-500/20"
                : "bg-[var(--color-surface-2)]"
        )}>
          {deadline.status === 'completed' ? (
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          ) : isOverdue ? (
            <>
              <AlertCircle className="w-6 h-6 text-red-400" />
              <span className="text-xs text-red-400 mt-1">Terlambat</span>
            </>
          ) : (
            <>
              <span className={cn(
                "text-2xl font-bold",
                isUrgent ? "text-amber-400" : "text-[#088395]"
              )}>
                {daysRemaining}
              </span>
              <span className={cn(
                "text-xs",
                isUrgent ? "text-amber-400" : "text-[var(--color-muted-foreground)]"
              )}>
                hari
              </span>
            </>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-[var(--color-muted-foreground)]">
            {deadline.completedTasks} / {deadline.totalTasks} tugas selesai
          </span>
          <span className={cn(
            "font-medium",
            deadline.status === 'completed' ? "text-emerald-400" : "text-[#088395]"
          )}>
            {deadline.progress}%
          </span>
        </div>
        <ProgressBar
          value={deadline.progress}
          max={100}
          size="sm"
          color={deadline.status === 'completed' ? 'success' : isUrgent ? 'warning' : 'primary'}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
          <Calendar className="w-4 h-4" />
          <span>{formatShortDate(deadline.dueDate)}</span>
        </div>

        {deadline.status !== 'completed' && (
          <Link
            href={`/labs/${deadline.labId}`}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              isUrgent
                ? "bg-amber-500 text-white hover:bg-amber-600"
                : "bg-[#088395] text-white hover:bg-[#09637E]"
            )}
          >
            <Play className="w-3.5 h-3.5" />
            Lanjutkan
          </Link>
        )}
      </div>
    </motion.div>
  );
}

function CalendarWidget({ events }: { events: ScheduleEvent[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const monthName = currentMonth.toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });

  const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const hasEvent = (day: number): ScheduleEvent | undefined => {
    return events.find(event => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === currentMonth.getMonth() &&
        eventDate.getFullYear() === currentMonth.getFullYear()
      );
    });
  };

  const isToday = (day: number): boolean => {
    const now = new Date();
    return (
      day === now.getDate() &&
      currentMonth.getMonth() === now.getMonth() &&
      currentMonth.getFullYear() === now.getFullYear()
    );
  };

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-[#088395]" />
          Kalender
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-[var(--color-muted-foreground)]" />
          </button>
          <span className="text-sm font-medium text-white min-w-[140px] text-center">
            {monthName}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-[var(--color-muted-foreground)]" />
          </button>
        </div>
      </div>

      {/* Days header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {days.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-[var(--color-muted-foreground)] py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before first day of month */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Days of month */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const event = hasEvent(day);
          const today = isToday(day);

          return (
            <div
              key={day}
              className={cn(
                "aspect-square flex flex-col items-center justify-center rounded-lg text-sm relative transition-colors",
                today
                  ? "bg-[#088395] text-white font-bold"
                  : event
                    ? "bg-[var(--color-surface-2)] text-white cursor-pointer hover:bg-[var(--color-surface-3)]"
                    : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-2)]"
              )}
              title={event?.title}
            >
              {day}
              {event && (
                <div
                  className={cn(
                    "absolute bottom-1 w-1.5 h-1.5 rounded-full",
                    event.type === 'deadline' ? "bg-red-400" : 
                    event.type === 'lab-session' ? "bg-emerald-400" : "bg-amber-400"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-[var(--color-border)]">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <span className="text-xs text-[var(--color-muted-foreground)]">Deadline</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs text-[var(--color-muted-foreground)]">Sesi Lab</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-xs text-[var(--color-muted-foreground)]">Pengumuman</span>
        </div>
      </div>
    </div>
  );
}

function UpcomingEvents({ events }: { events: ScheduleEvent[] }) {
  const sortedEvents = [...events].sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5">
      <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
        <Bell className="w-5 h-5 text-amber-400" />
        Jadwal Mendatang
      </h3>

      <div className="space-y-3">
        {sortedEvents.slice(0, 5).map((event) => (
          <div
            key={event.id}
            className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] transition-colors"
          >
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
              event.type === 'deadline' ? "bg-red-500/20" :
              event.type === 'lab-session' ? "bg-emerald-500/20" : "bg-amber-500/20"
            )}>
              {event.type === 'deadline' ? (
                <AlertCircle className={cn("w-5 h-5", "text-red-400")} />
              ) : event.type === 'lab-session' ? (
                <BookOpen className={cn("w-5 h-5", "text-emerald-400")} />
              ) : (
                <Bell className={cn("w-5 h-5", "text-amber-400")} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{event.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-[var(--color-muted-foreground)]">
                  {formatShortDate(event.date)}
                </span>
                <span className="text-xs text-[var(--color-muted-foreground)]">•</span>
                <span className="text-xs text-[var(--color-muted-foreground)] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {event.time}
                </span>
              </div>
            </div>

            <span className={cn(
              "text-xs px-2 py-1 rounded-full",
              event.type === 'deadline' ? "bg-red-500/20 text-red-400" :
              event.type === 'lab-session' ? "bg-emerald-500/20 text-emerald-400" : 
              "bg-amber-500/20 text-amber-400"
            )}>
              {getTimeRemaining(event.date)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsOverview({ deadlines }: { deadlines: Deadline[] }) {
  const upcoming = deadlines.filter(d => d.status === 'upcoming').length;
  const urgent = deadlines.filter(d => d.status === 'urgent').length;
  const completed = deadlines.filter(d => d.status === 'completed').length;
  const overdue = deadlines.filter(d => d.status === 'overdue').length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-1)] p-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{upcoming}</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">Mendatang</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Timer className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-400">{urgent}</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">Mendesak</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-400">{completed}</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">Selesai</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className={cn(
          "rounded-2xl border p-4",
          overdue > 0 ? "border-red-500/30 bg-red-500/5" : "border-[var(--color-border)] bg-[var(--color-surface-1)]"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            overdue > 0 ? "bg-red-500/20" : "bg-[var(--color-surface-2)]"
          )}>
            <AlertCircle className={cn(
              "w-5 h-5",
              overdue > 0 ? "text-red-400" : "text-[var(--color-muted-foreground)]"
            )} />
          </div>
          <div>
            <p className={cn(
              "text-2xl font-bold",
              overdue > 0 ? "text-red-400" : "text-white"
            )}>{overdue}</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">Terlambat</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function SchedulePage() {
  const [loading, setLoading] = useState(true);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [filter, setFilter] = useState<'all' | 'urgent' | 'upcoming' | 'completed'>('all');

  useEffect(() => {
    // Simulate API fetch
    const timer = setTimeout(() => {
      setDeadlines(mockDeadlines);
      setEvents(mockEvents);
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const filteredDeadlines = deadlines.filter(d => {
    if (filter === 'all') return true;
    return d.status === filter;
  });

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
          <Calendar className="w-7 h-7 text-[#088395]" />
          Jadwal & Deadline
        </h1>
        <p className="text-[var(--color-muted-foreground)]">
          Pantau deadline lab dan jadwal kegiatan praktikum
        </p>
      </div>

      {/* Stats Overview */}
      <StatsOverview deadlines={deadlines} />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'Semua' },
          { key: 'urgent', label: 'Mendesak' },
          { key: 'upcoming', label: 'Mendatang' },
          { key: 'completed', label: 'Selesai' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as typeof filter)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap",
              filter === tab.key
                ? "bg-[#088395] text-white"
                : "bg-[var(--color-surface-2)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-3)]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Deadlines List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-[#088395]" />
            Deadline Lab
          </h2>

          {filteredDeadlines.length > 0 ? (
            <div className="space-y-4">
              {filteredDeadlines.map((deadline) => (
                <DeadlineCard key={deadline.id} deadline={deadline} />
              ))}
            </div>
          ) : (
            <EmptyState
              type="no-data"
              title="Tidak Ada Deadline"
              description={
                filter === 'all'
                  ? "Belum ada deadline yang perlu dikerjakan."
                  : `Tidak ada deadline dengan status "${filter}".`
              }
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <CalendarWidget events={events} />
          <UpcomingEvents events={events} />
        </div>
      </div>
    </div>
  );
}
