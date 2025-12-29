'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  GraduationCap,
  BookOpen,
  Trophy,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Loader2,
  Lightbulb,
  Calendar,
  Target,
  Award,
  Activity,
  FileText,
  TrendingUp,
  Play,
} from 'lucide-react';

interface StudentData {
  id: string;
  username: string;
  name: string;
  createdAt: string;
}

interface StudentStats {
  completedLabs: number;
  inProgressLabs: number;
  notStartedLabs: number;
  totalLabs: number;
  totalTasksCompleted: number;
  totalTasks: number;
  totalHintsUsed: number;
  totalPointsDeducted: number;
  totalScore: number;
  maxPossibleScore: number;
  avgPercentage: number;
}

interface TaskDetail {
  taskId: string;
  taskTitle: string;
  taskOrder: number;
  completedAt: string;
  pointsEarned: number;
}

interface SubmissionDetail {
  finalScore: number;
  maxScore: number;
  percentage: number;
  grade: string;
  submittedAt: string;
  feedback: string;
}

interface LabProgressDetail {
  startedAt: string;
  completedAt: string | null;
  lastActivityAt: string;
  currentScore: number;
  tasksCompleted: number;
  hintsUsed: number;
  pointsDeducted: number;
  taskDetails: TaskDetail[];
  submission: SubmissionDetail | null;
}

interface LabProgress {
  labId: string;
  labNumber: number;
  labTitle: string;
  maxScore: number;
  totalTasks: number;
  status: 'not-started' | 'in-progress' | 'completed';
  progress: LabProgressDetail | null;
}

interface RecentActivity {
  type: 'lab_started' | 'lab_completed' | 'task_completed' | 'submission';
  timestamp: string;
  labTitle: string;
  taskTitle?: string;
  grade?: string;
  score?: number;
}

export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const resolvedParams = use(params);
  const { studentId } = resolvedParams;

  const [student, setStudent] = useState<StudentData | null>(null);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [labsProgress, setLabsProgress] = useState<LabProgress[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'labs' | 'activity'>('overview');

  useEffect(() => {
    fetchStudentDetails();
  }, [studentId]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/students/${studentId}`);
      const data = await res.json();

      if (data.success) {
        setStudent(data.student);
        setStats(data.stats);
        setLabsProgress(data.labsProgress);
        setRecentActivity(data.recentActivity);
      } else {
        setError(data.error);
      }
    } catch {
      setError('Failed to fetch student details');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A':
        return 'text-emerald-400 bg-emerald-500/20';
      case 'B':
        return 'text-blue-400 bg-blue-500/20';
      case 'C':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'D':
        return 'text-orange-400 bg-orange-500/20';
      default:
        return 'text-red-400 bg-red-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-emerald-400 bg-emerald-500/20';
      case 'in-progress':
        return 'text-amber-400 bg-amber-500/20';
      default:
        return 'text-zinc-400 bg-zinc-500/20';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lab_started':
        return <Play className="w-4 h-4 text-cyan-400" />;
      case 'lab_completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'task_completed':
        return <Target className="w-4 h-4 text-blue-400" />;
      case 'submission':
        return <FileText className="w-4 h-4 text-violet-400" />;
      default:
        return <Activity className="w-4 h-4 text-zinc-400" />;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading student details...</p>
        </div>
      </div>
    );
  }

  if (error || !student || !stats) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error || 'Student not found'}</p>
          <Link href="/dashboard/admin/students" className="btn btn-primary">
            Back to Students
          </Link>
        </div>
      </div>
    );
  }

  const overallGrade = (() => {
    if (stats.avgPercentage >= 90) return 'A';
    if (stats.avgPercentage >= 80) return 'B';
    if (stats.avgPercentage >= 70) return 'C';
    if (stats.avgPercentage >= 60) return 'D';
    return 'F';
  })();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/admin/students"
                className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold">
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-lg font-semibold">{student.name}</h1>
                  <p className="text-sm text-zinc-500">@{student.username}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center justify-center w-12 h-12 rounded-xl text-2xl font-bold ${getGradeColor(overallGrade)}`}
              >
                {overallGrade}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/20">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-sm text-zinc-400">Completed</span>
            </div>
            <p className="text-2xl font-bold">
              {stats.completedLabs}
              <span className="text-sm font-normal text-zinc-500">/{stats.totalLabs} labs</span>
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-lg bg-blue-500/20">
                <Target className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-sm text-zinc-400">Tasks Done</span>
            </div>
            <p className="text-2xl font-bold">
              {stats.totalTasksCompleted}
              <span className="text-sm font-normal text-zinc-500">/{stats.totalTasks}</span>
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-lg bg-amber-500/20">
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-sm text-zinc-400">Total Score</span>
            </div>
            <p className="text-2xl font-bold">
              {stats.totalScore}
              <span className="text-sm font-normal text-zinc-500">/{stats.maxPossibleScore}</span>
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-lg bg-violet-500/20">
                <Lightbulb className="w-5 h-5 text-violet-400" />
              </div>
              <span className="text-sm text-zinc-400">Hints Used</span>
            </div>
            <p className="text-2xl font-bold">
              {stats.totalHintsUsed}
              <span className="text-sm font-normal text-zinc-500">
                (-{stats.totalPointsDeducted} pts)
              </span>
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-zinc-800">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'labs', label: 'Lab Progress', icon: BookOpen },
            { id: 'activity', label: 'Recent Activity', icon: Activity },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                  ? 'text-cyan-400 border-cyan-400'
                  : 'text-zinc-400 border-transparent hover:text-zinc-200'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Progress Overview */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                Progress Overview
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-400">Lab Completion</span>
                    <span className="text-sm font-medium">
                      {Math.round((stats.completedLabs / stats.totalLabs) * 100)}%
                    </span>
                  </div>
                  <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all"
                      style={{
                        width: `${(stats.completedLabs / stats.totalLabs) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-400">Task Completion</span>
                    <span className="text-sm font-medium">
                      {Math.round((stats.totalTasksCompleted / stats.totalTasks) * 100)}%
                    </span>
                  </div>
                  <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all"
                      style={{
                        width: `${(stats.totalTasksCompleted / stats.totalTasks) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-400">Average Score</span>
                    <span className="text-sm font-medium">{stats.avgPercentage}%</span>
                  </div>
                  <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                      style={{ width: `${stats.avgPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Lab Status Summary */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                Lab Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>Completed</span>
                  </div>
                  <span className="text-xl font-bold text-emerald-400">
                    {stats.completedLabs}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-amber-400" />
                    <span>In Progress</span>
                  </div>
                  <span className="text-xl font-bold text-amber-400">
                    {stats.inProgressLabs}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-zinc-500/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Circle className="w-5 h-5 text-zinc-400" />
                    <span>Not Started</span>
                  </div>
                  <span className="text-xl font-bold text-zinc-400">
                    {stats.notStartedLabs}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'labs' && (
          <div className="space-y-4">
            {labsProgress.map((lab) => (
              <div
                key={lab.labId}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs text-zinc-500">Lab {lab.labNumber}</span>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(lab.status)}`}
                      >
                        {lab.status.replace('-', ' ')}
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold">{lab.labTitle}</h4>
                  </div>
                  {lab.progress?.submission && (
                    <span
                      className={`inline-flex items-center justify-center w-12 h-12 rounded-xl text-xl font-bold ${getGradeColor(lab.progress.submission.grade)}`}
                    >
                      {lab.progress.submission.grade}
                    </span>
                  )}
                </div>

                {lab.progress ? (
                  <div className="space-y-4">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-zinc-400">Tasks Completed</span>
                        <span className="text-sm">
                          {lab.progress.tasksCompleted}/{lab.totalTasks}
                        </span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                          style={{
                            width: `${(lab.progress.tasksCompleted / lab.totalTasks) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div className="bg-zinc-800/50 rounded-lg p-3">
                        <p className="text-zinc-500 mb-1">Score</p>
                        <p className="font-semibold">
                          {lab.progress.submission?.finalScore || lab.progress.currentScore}/
                          {lab.maxScore}
                        </p>
                      </div>
                      <div className="bg-zinc-800/50 rounded-lg p-3">
                        <p className="text-zinc-500 mb-1">Hints Used</p>
                        <p className="font-semibold">
                          {lab.progress.hintsUsed}{' '}
                          <span className="text-red-400 text-xs">
                            (-{lab.progress.pointsDeducted})
                          </span>
                        </p>
                      </div>
                      <div className="bg-zinc-800/50 rounded-lg p-3">
                        <p className="text-zinc-500 mb-1">Started</p>
                        <p className="font-semibold text-xs">
                          {formatDate(lab.progress.startedAt)}
                        </p>
                      </div>
                      <div className="bg-zinc-800/50 rounded-lg p-3">
                        <p className="text-zinc-500 mb-1">
                          {lab.progress.completedAt ? 'Completed' : 'Last Activity'}
                        </p>
                        <p className="font-semibold text-xs">
                          {formatDate(
                            lab.progress.completedAt || lab.progress.lastActivityAt
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Task Details */}
                    {lab.progress.taskDetails.length > 0 && (
                      <div>
                        <p className="text-sm text-zinc-400 mb-2">Completed Tasks:</p>
                        <div className="flex flex-wrap gap-2">
                          {lab.progress.taskDetails.map((task) => (
                            <span
                              key={task.taskId}
                              className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-lg"
                            >
                              Task {task.taskOrder}: {task.taskTitle} (+{task.pointsEarned})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-zinc-500 text-sm">Not started yet</p>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
            {recentActivity.length === 0 ? (
              <div className="p-12 text-center text-zinc-500">
                No activity recorded yet
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-4 p-4">
                    <div className="p-2 rounded-lg bg-zinc-800">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {activity.type === 'lab_started' && (
                          <>
                            Started <span className="text-cyan-400">{activity.labTitle}</span>
                          </>
                        )}
                        {activity.type === 'lab_completed' && (
                          <>
                            Completed{' '}
                            <span className="text-emerald-400">{activity.labTitle}</span>
                          </>
                        )}
                        {activity.type === 'task_completed' && (
                          <>
                            Completed task{' '}
                            <span className="text-blue-400">{activity.taskTitle}</span> in{' '}
                            {activity.labTitle}
                          </>
                        )}
                        {activity.type === 'submission' && (
                          <>
                            Submitted{' '}
                            <span className="text-violet-400">{activity.labTitle}</span> -{' '}
                            Grade: {activity.grade} ({activity.score} pts)
                          </>
                        )}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
