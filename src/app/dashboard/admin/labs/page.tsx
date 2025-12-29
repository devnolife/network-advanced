'use client';

import { cn } from '@/lib/utils';
import {
  BookOpen,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  Users,
  Target,
  Lock,
  Unlock,
  ChevronRight,
  Loader2,
  Settings,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Lab {
  id: string;
  number: number;
  title: string;
  description: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  durationMinutes: number;
  maxScore: number;
  isActive: boolean;
  isLocked: boolean;
  prerequisiteId: string | null;
  _count?: {
    tasks: number;
    hints: number;
    progress: number;
  };
  tasks?: {
    id: string;
    title: string;
    points: number;
    expectedAnswer: string;
  }[];
}

export default function AdminLabsPage() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [showTasksModal, setShowTasksModal] = useState(false);

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    try {
      const res = await fetch('/api/admin/labs');
      const data = await res.json();
      if (data.success) {
        setLabs(data.labs);
      }
    } catch (error) {
      console.error('Error fetching labs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLabs = labs.filter((lab) =>
    lab.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lab.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'INTERMEDIATE':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'ADVANCED':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  const viewLabTasks = async (lab: Lab) => {
    try {
      const res = await fetch(`/api/admin/labs/${lab.id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedLab(data.lab);
        setShowTasksModal(true);
      }
    } catch (error) {
      console.error('Error fetching lab details:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Lab Management</h1>
          <p className="text-zinc-400">Manage labs, tasks, and expected answers</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 text-white font-medium hover:bg-cyan-400 transition-colors">
          <Plus className="h-5 w-5" />
          Add Lab
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <BookOpen className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{labs.length}</p>
              <p className="text-xs text-zinc-500">Total Labs</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Unlock className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{labs.filter(l => l.isActive).length}</p>
              <p className="text-xs text-zinc-500">Active</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/10">
              <Target className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{labs.reduce((acc, l) => acc + (l._count?.tasks || 0), 0)}</p>
              <p className="text-xs text-zinc-500">Total Tasks</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Users className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{labs.reduce((acc, l) => acc + (l._count?.progress || 0), 0)}</p>
              <p className="text-xs text-zinc-500">Enrollments</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Search labs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md pl-10 pr-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
        />
      </div>

      {/* Labs Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredLabs.map((lab) => (
          <div
            key={lab.id}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden hover:border-cyan-500/30 transition-all"
          >
            {/* Lab Header */}
            <div className="p-6 pb-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-500">Lab {lab.number}</span>
                  <span className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full border",
                    getDifficultyBadge(lab.difficulty)
                  )}>
                    {lab.difficulty}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {lab.isActive ? (
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Active
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                      <Lock className="h-3.5 w-3.5" />
                      Inactive
                    </span>
                  )}
                </div>
              </div>

              <h3 className="text-lg font-semibold text-white mb-2">{lab.title}</h3>
              <p className="text-sm text-zinc-400 line-clamp-2 mb-4">{lab.description}</p>

              {/* Meta Info */}
              <div className="flex items-center gap-4 text-sm text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {lab.durationMinutes} min
                </div>
                <div className="flex items-center gap-1.5">
                  <Target className="h-4 w-4" />
                  {lab._count?.tasks || 0} tasks
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {lab._count?.progress || 0} students
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-2">
              <button
                onClick={() => viewLabTasks(lab)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-100 hover:bg-zinc-700 transition-colors text-sm font-medium"
              >
                <Eye className="h-4 w-4" />
                View Tasks & Answers
              </button>
              <button className="p-2.5 rounded-xl bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors">
                <Edit className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredLabs.length === 0 && (
        <div className="text-center py-16">
          <BookOpen className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400">No labs found</p>
        </div>
      )}

      {/* Tasks Modal */}
      {showTasksModal && selectedLab && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-3xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">{selectedLab.title}</h2>
                  <p className="text-sm text-zinc-400">Tasks and Expected Answers</p>
                </div>
                <button
                  onClick={() => setShowTasksModal(false)}
                  className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {selectedLab.tasks && selectedLab.tasks.length > 0 ? (
                <div className="space-y-4">
                  {selectedLab.tasks.map((task, index) => (
                    <div key={task.id} className="rounded-xl border border-zinc-800 bg-zinc-800/50 p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-white">
                          Task {index + 1}: {task.title}
                        </h4>
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-400">
                          {task.points} pts
                        </span>
                      </div>
                      <div className="mt-3 p-3 rounded-lg bg-zinc-900 border border-zinc-700">
                        <p className="text-xs text-zinc-500 mb-1">Expected Answer:</p>
                        <code className="text-sm text-emerald-400 font-mono">
                          {task.expectedAnswer}
                        </code>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
                  <p className="text-zinc-400">No tasks configured for this lab</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-zinc-800">
              <button
                onClick={() => setShowTasksModal(false)}
                className="w-full py-3 rounded-xl bg-zinc-800 text-zinc-100 hover:bg-zinc-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
