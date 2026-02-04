'use client';

import { cn } from '@/lib/utils';
import {
  FileText,
  Search,
  Download,
  Calendar,
  Users,
  BookOpen,
  CheckCircle,
  Clock,
  TrendingUp,
  Filter,
  Loader2,
  Check,
  X,
  Edit3,
  History,
  FileSpreadsheet,
  FileDown,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface Report {
  id: string;
  studentName: string;
  studentUsername: string;
  labTitle: string;
  labNumber: number;
  status: 'completed' | 'in-progress' | 'not-started';
  score: number;
  maxScore: number;
  tasksCompleted: number;
  totalTasks: number;
  startedAt: string | null;
  completedAt: string | null;
  gradedBy?: string;
  gradedAt?: string;
}

interface ReportStats {
  totalSubmissions: number;
  completedLabs: number;
  avgScore: number;
  activeStudents: number;
}

interface GradeHistory {
  id: string;
  reportId: string;
  previousScore: number;
  newScore: number;
  gradedBy: string;
  gradedAt: string;
  reason: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<ReportStats>({
    totalSubmissions: 0,
    completedLabs: 0,
    avgScore: 0,
    activeStudents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterLab, setFilterLab] = useState<string>('all');
  
  // Date range filter
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Batch selection
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Grade override modal
  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [gradeTarget, setGradeTarget] = useState<Report | null>(null);
  const [newScore, setNewScore] = useState('');
  const [gradeReason, setGradeReason] = useState('');
  
  // Batch grade modal
  const [batchGradeModalOpen, setBatchGradeModalOpen] = useState(false);
  const [batchScore, setBatchScore] = useState('');
  const [batchReason, setBatchReason] = useState('');
  
  // Grade history modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [gradeHistory, setGradeHistory] = useState<GradeHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // Export dropdown
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/admin/reports');
      const data = await res.json();
      if (data.success) {
        setReports(data.reports);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.studentUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.labTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    const matchesLab = filterLab === 'all' || report.labNumber.toString() === filterLab;
    
    // Date range filter
    let matchesDate = true;
    if (dateFrom && report.startedAt) {
      matchesDate = new Date(report.startedAt) >= new Date(dateFrom);
    }
    if (dateTo && report.startedAt && matchesDate) {
      matchesDate = new Date(report.startedAt) <= new Date(dateTo + 'T23:59:59');
    }
    
    return matchesSearch && matchesStatus && matchesLab && matchesDate;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      case 'in-progress':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
      case 'not-started':
        return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400';
      default:
        return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400';
    }
  };

  const uniqueLabs = [...new Set(reports.map(r => r.labNumber))].sort((a, b) => a - b);

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedReports(new Set());
    } else {
      setSelectedReports(new Set(filteredReports.map(r => r.id)));
    }
    setSelectAll(!selectAll);
  };

  const toggleSelectReport = (id: string) => {
    const newSelected = new Set(selectedReports);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedReports(newSelected);
    setSelectAll(newSelected.size === filteredReports.length);
  };

  // Grade override handlers
  const openGradeModal = (report: Report) => {
    setGradeTarget(report);
    setNewScore(report.score.toString());
    setGradeReason('');
    setGradeModalOpen(true);
  };

  const handleGradeSubmit = async () => {
    if (!gradeTarget || !newScore) return;
    
    try {
      // Simulated API call
      const updatedReports = reports.map(r => 
        r.id === gradeTarget.id 
          ? { ...r, score: parseInt(newScore), gradedBy: 'Admin', gradedAt: new Date().toISOString() }
          : r
      );
      setReports(updatedReports);
      setGradeModalOpen(false);
      setGradeTarget(null);
      setNewScore('');
      setGradeReason('');
    } catch (error) {
      console.error('Error updating grade:', error);
    }
  };

  // Batch grade handlers
  const handleBatchGrade = async () => {
    if (selectedReports.size === 0 || !batchScore) return;
    
    try {
      const updatedReports = reports.map(r => 
        selectedReports.has(r.id)
          ? { ...r, score: parseInt(batchScore), gradedBy: 'Admin', gradedAt: new Date().toISOString() }
          : r
      );
      setReports(updatedReports);
      setBatchGradeModalOpen(false);
      setBatchScore('');
      setBatchReason('');
      setSelectedReports(new Set());
      setSelectAll(false);
    } catch (error) {
      console.error('Error batch grading:', error);
    }
  };

  // Quick grade buttons
  const quickGrade = (report: Report, percentage: number) => {
    const newScoreVal = Math.round(report.maxScore * percentage);
    const updatedReports = reports.map(r => 
      r.id === report.id 
        ? { ...r, score: newScoreVal, gradedBy: 'Admin', gradedAt: new Date().toISOString() }
        : r
    );
    setReports(updatedReports);
  };

  // View grade history
  const viewGradeHistory = async (reportId: string) => {
    setHistoryLoading(true);
    setHistoryModalOpen(true);
    
    // Simulated data
    setTimeout(() => {
      setGradeHistory([
        { id: '1', reportId, previousScore: 70, newScore: 85, gradedBy: 'Admin', gradedAt: '2026-02-03T10:30:00', reason: 'Nilai dikoreksi setelah review ulang' },
        { id: '2', reportId, previousScore: 60, newScore: 70, gradedBy: 'Instructor', gradedAt: '2026-02-02T14:15:00', reason: 'Partial credit untuk tugas bonus' },
      ]);
      setHistoryLoading(false);
    }, 500);
  };

  // Export functions
  const exportToCSV = () => {
    const headers = ['Nama Siswa', 'Username', 'Lab', 'Status', 'Progres', 'Nilai', 'Mulai', 'Selesai'];
    const dataToExport = selectedReports.size > 0 
      ? filteredReports.filter(r => selectedReports.has(r.id))
      : filteredReports;
    
    const rows = dataToExport.map(r => [
      r.studentName,
      r.studentUsername,
      `Lab ${r.labNumber} - ${r.labTitle}`,
      r.status,
      `${r.tasksCompleted}/${r.totalTasks}`,
      `${r.score}/${r.maxScore}`,
      r.startedAt ? new Date(r.startedAt).toLocaleDateString('id-ID') : '-',
      r.completedAt ? new Date(r.completedAt).toLocaleDateString('id-ID') : '-',
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `laporan-lab-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    setExportDropdownOpen(false);
  };

  const exportToPDF = () => {
    // In production, use a library like jsPDF or call an API endpoint
    alert('Fitur ekspor PDF akan menggunakan library jsPDF. Untuk demo, gunakan ekspor CSV.');
    setExportDropdownOpen(false);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setFilterLab('all');
    setDateFrom('');
    setDateTo('');
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#088395]" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Laporan & Penilaian</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Lihat progres siswa, nilai, dan kelola penilaian batch</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedReports.size > 0 && (
            <button 
              onClick={() => setBatchGradeModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-white font-medium hover:bg-amber-400 transition-colors"
            >
              <Edit3 className="h-4 w-4" />
              Nilai Batch ({selectedReports.size})
            </button>
          )}
          <div className="relative" ref={exportRef}>
            <button 
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#088395] text-white font-medium hover:bg-[#09637E] transition-colors"
            >
              <Download className="h-5 w-5" />
              Ekspor
              <ChevronDown className={cn("h-4 w-4 transition-transform", exportDropdownOpen && "rotate-180")} />
            </button>
            {exportDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-lg z-50 overflow-hidden">
                <button
                  onClick={exportToCSV}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                  Ekspor CSV
                </button>
                <button
                  onClick={exportToPDF}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                >
                  <FileDown className="h-4 w-4 text-rose-500" />
                  Ekspor PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#088395]/10">
              <FileText className="h-5 w-5 text-[#088395]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.totalSubmissions}</p>
              <p className="text-xs text-zinc-500">Total Progres</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.completedLabs}</p>
              <p className="text-xs text-zinc-500">Selesai</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-500/10">
              <TrendingUp className="h-5 w-5 text-sky-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.avgScore}%</p>
              <p className="text-xs text-zinc-500">Rata-rata Nilai</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Users className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.activeStudents}</p>
              <p className="text-xs text-zinc-500">Siswa Aktif</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Cari berdasarkan siswa atau lab..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#088395]/50"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            title="Filter by Status"
            className="px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#088395]/50"
          >
            <option value="all">Semua Status</option>
            <option value="completed">Selesai</option>
            <option value="in-progress">Sedang Berjalan</option>
            <option value="not-started">Belum Dimulai</option>
          </select>
          <select
            value={filterLab}
            onChange={(e) => setFilterLab(e.target.value)}
            title="Filter by Lab"
            className="px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#088395]/50"
          >
            <option value="all">Semua Lab</option>
            {uniqueLabs.map(num => (
              <option key={num} value={num.toString()}>Lab {num}</option>
            ))}
          </select>
        </div>
        
        {/* Date Range Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 sm:max-w-[200px]">
            <label className="block text-xs text-zinc-500 mb-1">Dari Tanggal</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#088395]/50"
              />
            </div>
          </div>
          <div className="flex-1 sm:max-w-[200px]">
            <label className="block text-xs text-zinc-500 mb-1">Sampai Tanggal</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#088395]/50"
              />
            </div>
          </div>
          {(searchQuery || filterStatus !== 'all' || filterLab !== 'all' || dateFrom || dateTo) && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Selection Info Bar */}
      {selectedReports.size > 0 && (
        <div className="flex items-center justify-between p-3 mb-4 rounded-xl bg-[#088395]/10 border border-[#088395]/20">
          <span className="text-sm text-[#088395] font-medium">
            {selectedReports.size} laporan dipilih
          </span>
          <button
            onClick={() => { setSelectedReports(new Set()); setSelectAll(false); }}
            className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          >
            Batalkan Pilihan
          </button>
        </div>
      )}

      {/* Reports Table */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                <th className="text-left py-4 px-4 text-sm font-medium text-zinc-500">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-[#088395] focus:ring-[#088395]"
                  />
                </th>
                <th className="text-left py-4 px-4 text-sm font-medium text-zinc-500">Siswa</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-zinc-500">Lab</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-zinc-500">Status</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-zinc-500">Progres</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-zinc-500">Nilai</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-zinc-500">Tanggal</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-zinc-500">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr key={report.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                  <td className="py-4 px-4">
                    <input
                      type="checkbox"
                      checked={selectedReports.has(report.id)}
                      onChange={() => toggleSelectReport(report.id)}
                      className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-[#088395] focus:ring-[#088395]"
                    />
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#088395] to-[#09637E] flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {report.studentName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-white">{report.studentName}</p>
                        <p className="text-xs text-zinc-500">@{report.studentUsername}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-zinc-400" />
                      <span className="text-zinc-700 dark:text-zinc-300">Lab {report.labNumber}</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">{report.labTitle}</p>
                  </td>
                  <td className="py-4 px-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium",
                      getStatusBadge(report.status)
                    )}>
                      {report.status === 'completed' ? 'Selesai' :
                        report.status === 'in-progress' ? 'Berjalan' : 'Belum Mulai'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#088395] rounded-full"
                          style={{ width: `${(report.tasksCompleted / report.totalTasks) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-500">
                        {report.tasksCompleted}/{report.totalTasks}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-col gap-1">
                      <span className={cn(
                        "font-medium",
                        report.score >= report.maxScore * 0.8 ? "text-emerald-600 dark:text-emerald-400" :
                          report.score >= report.maxScore * 0.5 ? "text-amber-600 dark:text-amber-400" : "text-zinc-500"
                      )}>
                        {report.score}/{report.maxScore}
                      </span>
                      {/* Quick Grade Buttons */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => quickGrade(report, 1)}
                          className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                          title="Nilai Sempurna"
                        >
                          100%
                        </button>
                        <button
                          onClick={() => quickGrade(report, 0.75)}
                          className="px-1.5 py-0.5 text-[10px] rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20"
                          title="Nilai 75%"
                        >
                          75%
                        </button>
                        <button
                          onClick={() => quickGrade(report, 0.5)}
                          className="px-1.5 py-0.5 text-[10px] rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                          title="Nilai 50%"
                        >
                          50%
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm">
                    <div className="text-zinc-600 dark:text-zinc-400">
                      {report.startedAt ? new Date(report.startedAt).toLocaleDateString('id-ID') : '-'}
                    </div>
                    {report.completedAt && (
                      <div className="text-xs text-emerald-600 dark:text-emerald-400">
                        ✓ {new Date(report.completedAt).toLocaleDateString('id-ID')}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openGradeModal(report)}
                        className="p-2 rounded-lg text-zinc-500 hover:text-[#088395] hover:bg-[#088395]/10 transition-colors"
                        title="Edit Nilai"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => viewGradeHistory(report.id)}
                        className="p-2 rounded-lg text-zinc-500 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                        title="Riwayat Nilai"
                      >
                        <History className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-500 dark:text-zinc-400">Laporan tidak ditemukan</p>
            {(searchQuery || filterStatus !== 'all' || filterLab !== 'all' || dateFrom || dateTo) && (
              <button
                onClick={clearFilters}
                className="mt-2 text-sm text-[#088395] hover:underline"
              >
                Reset semua filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="mt-4 text-sm text-zinc-500">
        Menampilkan {filteredReports.length} dari {reports.length} laporan
      </div>

      {/* Grade Override Modal */}
      {gradeModalOpen && gradeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Edit Nilai</h3>
              <p className="text-sm text-zinc-500 mt-1">
                {gradeTarget.studentName} - Lab {gradeTarget.labNumber}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Nilai Baru (maks: {gradeTarget.maxScore})
                </label>
                <input
                  type="number"
                  min={0}
                  max={gradeTarget.maxScore}
                  value={newScore}
                  onChange={(e) => setNewScore(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#088395]/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Alasan Perubahan (opsional)
                </label>
                <textarea
                  value={gradeReason}
                  onChange={(e) => setGradeReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#088395]/50 resize-none"
                  placeholder="Contoh: Koreksi setelah review ulang..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
              <button
                onClick={() => setGradeModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleGradeSubmit}
                className="px-4 py-2.5 rounded-xl bg-[#088395] text-white font-medium hover:bg-[#09637E] transition-colors"
              >
                Simpan Nilai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Grade Modal */}
      {batchGradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Penilaian Batch</h3>
              <p className="text-sm text-zinc-500 mt-1">
                Ubah nilai untuk {selectedReports.size} laporan sekaligus
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Nilai Baru
                </label>
                <input
                  type="number"
                  min={0}
                  value={batchScore}
                  onChange={(e) => setBatchScore(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#088395]/50"
                  placeholder="Masukkan nilai..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Alasan Perubahan
                </label>
                <textarea
                  value={batchReason}
                  onChange={(e) => setBatchReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#088395]/50 resize-none"
                  placeholder="Contoh: Penyesuaian nilai massal..."
                />
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  ⚠️ Perhatian: Tindakan ini akan mengubah nilai {selectedReports.size} laporan dan tidak dapat dibatalkan.
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
              <button
                onClick={() => setBatchGradeModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleBatchGrade}
                disabled={!batchScore}
                className="px-4 py-2.5 rounded-xl bg-amber-500 text-white font-medium hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Terapkan Nilai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grade History Modal */}
      {historyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Riwayat Nilai</h3>
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 max-h-[400px] overflow-y-auto">
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-[#088395]" />
                </div>
              ) : gradeHistory.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-10 w-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
                  <p className="text-zinc-500">Belum ada riwayat perubahan nilai</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {gradeHistory.map((history) => (
                    <div key={history.id} className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500 line-through">{history.previousScore}</span>
                          <span className="text-zinc-400">→</span>
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">{history.newScore}</span>
                        </div>
                        <span className="text-xs text-zinc-500">
                          {new Date(history.gradedAt).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{history.reason}</p>
                      <p className="text-xs text-zinc-500 mt-1">Oleh: {history.gradedBy}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
