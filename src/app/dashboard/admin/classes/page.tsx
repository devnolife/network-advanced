'use client';

import { cn } from '@/lib/utils';
import {
  GraduationCap,
  Users,
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  UserPlus,
  BookOpen,
  Calendar,
  Clock,
  ChevronRight,
  FolderOpen,
  Settings,
  Download,
  Upload,
  Filter,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  TrendingUp,
  Award,
  X,
  ChevronDown,
  BarChart3,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  StatCard,
  ProgressBar,
  StatusBadge,
  Avatar,
  EmptyState,
  SearchInput,
  ConfirmDialog,
  Dropdown,
  DropdownItem,
  DropdownSeparator,
} from '@/components/ui';

// ============================================================================
// Types
// ============================================================================

interface LabProgress {
  labId: string;
  labNumber: number;
  labTitle: string;
  studentsCompleted: number;
  studentsInProgress: number;
  studentsNotStarted: number;
  avgScore: number;
}

interface ClassData {
  id: string;
  name: string;
  code: string;
  description: string;
  instructor: string;
  studentCount: number;
  maxStudents: number;
  avgProgress: number;
  avgScore: number;
  status: 'active' | 'inactive';
  semester: string;
  createdAt: string;
  labProgress: LabProgress[];
}

interface Student {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  labsCompleted: number;
  totalLabs: number;
  avgScore: number;
  lastActive: string;
  status: 'online' | 'offline';
}

// ============================================================================
// Constants
// ============================================================================

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

// 8 Lab yang sama untuk semua kelas
const labList = [
  { id: 'lab-1', number: 1, title: 'Pengenalan Jaringan Komputer' },
  { id: 'lab-2', number: 2, title: 'Konfigurasi IP Address & Subnetting' },
  { id: 'lab-3', number: 3, title: 'Konfigurasi Router Dasar' },
  { id: 'lab-4', number: 4, title: 'Routing Static & Dynamic' },
  { id: 'lab-5', number: 5, title: 'Konfigurasi Switch & VLAN' },
  { id: 'lab-6', number: 6, title: 'Firewall & Network Security' },
  { id: 'lab-7', number: 7, title: 'Network Monitoring & Troubleshooting' },
  { id: 'lab-8', number: 8, title: 'Implementasi Jaringan Lengkap' },
];

// ============================================================================
// Mock Data - 2 Kelas dengan 8 Lab yang sama
// ============================================================================

const generateLabProgress = (classId: string): LabProgress[] => {
  // Seed random berdasarkan classId untuk konsistensi
  const seed = classId === '1' ? 0.7 : 0.6;
  
  return labList.map((lab, index) => {
    const totalStudents = classId === '1' ? 32 : 28;
    const progressFactor = Math.max(0.2, seed - (index * 0.08));
    const completed = Math.floor(totalStudents * progressFactor * (0.8 + Math.random() * 0.2));
    const inProgress = Math.floor((totalStudents - completed) * 0.4);
    const notStarted = totalStudents - completed - inProgress;
    
    return {
      labId: lab.id,
      labNumber: lab.number,
      labTitle: lab.title,
      studentsCompleted: completed,
      studentsInProgress: inProgress,
      studentsNotStarted: notStarted,
      avgScore: Math.floor(70 + Math.random() * 25),
    };
  });
};

const mockClasses: ClassData[] = [
  {
    id: '1',
    name: 'XII TKJ-1',
    code: 'XII-TKJ-1',
    description: 'Kelas Teknik Komputer dan Jaringan 1 - Angkatan 2026',
    instructor: 'Pak Ahmad Rizky, S.Kom',
    studentCount: 32,
    maxStudents: 36,
    avgProgress: 68,
    avgScore: 78,
    status: 'active',
    semester: 'Ganjil 2026/2027',
    createdAt: '2026-07-15',
    labProgress: generateLabProgress('1'),
  },
  {
    id: '2',
    name: 'XII TKJ-2',
    code: 'XII-TKJ-2',
    description: 'Kelas Teknik Komputer dan Jaringan 2 - Angkatan 2026',
    instructor: 'Bu Siti Nurhaliza, S.Kom',
    studentCount: 28,
    maxStudents: 36,
    avgProgress: 58,
    avgScore: 75,
    status: 'active',
    semester: 'Ganjil 2026/2027',
    createdAt: '2026-07-15',
    labProgress: generateLabProgress('2'),
  },
];

const generateMockStudents = (classId: string): Student[] => {
  const studentsClass1 = [
    { id: '1', name: 'Ahmad Rizky Pratama', username: 'ahmad.rizky' },
    { id: '2', name: 'Siti Nurhaliza Putri', username: 'siti.nurhaliza' },
    { id: '3', name: 'Budi Santoso', username: 'budi.santoso' },
    { id: '4', name: 'Dewi Lestari', username: 'dewi.lestari' },
    { id: '5', name: 'Eko Prasetyo', username: 'eko.prasetyo' },
    { id: '6', name: 'Fitri Handayani', username: 'fitri.handayani' },
    { id: '7', name: 'Galih Permana', username: 'galih.permana' },
    { id: '8', name: 'Hana Safitri', username: 'hana.safitri' },
  ];

  const studentsClass2 = [
    { id: '9', name: 'Irfan Maulana', username: 'irfan.maulana' },
    { id: '10', name: 'Jihan Aulia', username: 'jihan.aulia' },
    { id: '11', name: 'Kevin Wijaya', username: 'kevin.wijaya' },
    { id: '12', name: 'Layla Azizah', username: 'layla.azizah' },
    { id: '13', name: 'Muhammad Farhan', username: 'muh.farhan' },
    { id: '14', name: 'Nadia Putri', username: 'nadia.putri' },
    { id: '15', name: 'Omar Saputra', username: 'omar.saputra' },
    { id: '16', name: 'Putri Rahayu', username: 'putri.rahayu' },
  ];

  const students = classId === '1' ? studentsClass1 : studentsClass2;

  return students.map(s => ({
    ...s,
    email: `${s.username}@siswa.smk.sch.id`,
    labsCompleted: Math.floor(Math.random() * 6) + 2,
    totalLabs: 8,
    avgScore: Math.floor(60 + Math.random() * 35),
    lastActive: ['5 menit lalu', '30 menit lalu', '1 jam lalu', '2 jam lalu', '1 hari lalu'][Math.floor(Math.random() * 5)],
    status: Math.random() > 0.5 ? 'online' : 'offline' as const,
  }));
};

// ============================================================================
// Components
// ============================================================================

function ClassCard({ 
  classData, 
  onViewLabs,
  onManageStudents 
}: { 
  classData: ClassData;
  onViewLabs: (classData: ClassData) => void;
  onManageStudents: (classData: ClassData) => void;
}) {
  const capacityPercentage = Math.round((classData.studentCount / classData.maxStudents) * 100);
  
  // Hitung total progress
  const totalCompleted = classData.labProgress.reduce((acc, lp) => acc + lp.studentsCompleted, 0);
  const totalPossible = classData.studentCount * 8; // 8 lab
  const overallProgress = Math.round((totalCompleted / totalPossible) * 100);

  return (
    <motion.div
      variants={item}
      whileHover={{ y: -4 }}
      className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 hover:border-[#088395]/50 hover:shadow-lg hover:shadow-[#088395]/5 transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#088395] to-[#09637E] flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{classData.name}</h3>
            <p className="text-sm text-zinc-500">{classData.code}</p>
          </div>
        </div>
        <StatusBadge status="success" size="sm" label="Aktif" />
      </div>

      {/* Description */}
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">{classData.description}</p>

      {/* Instructor */}
      <div className="flex items-center gap-2 text-sm text-zinc-500 mb-4">
        <Users className="w-4 h-4" />
        <span>{classData.instructor}</span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-xl bg-zinc-100 dark:bg-zinc-800 p-3 text-center">
          <p className="text-xl font-bold text-zinc-900 dark:text-white">{classData.studentCount}</p>
          <p className="text-[10px] text-zinc-500">Siswa</p>
        </div>
        <div className="rounded-xl bg-[#088395]/10 p-3 text-center">
          <p className="text-xl font-bold text-[#088395]">8</p>
          <p className="text-[10px] text-zinc-500">Lab</p>
        </div>
        <div className="rounded-xl bg-emerald-500/10 p-3 text-center">
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{classData.avgScore}%</p>
          <p className="text-[10px] text-zinc-500">Rata-rata</p>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">Progress Keseluruhan</span>
          <span className="font-medium text-zinc-900 dark:text-white">{overallProgress}%</span>
        </div>
        <ProgressBar
          value={overallProgress}
          max={100}
          size="sm"
          color="primary"
        />
      </div>

      {/* Lab Progress Mini Preview */}
      <div className="mb-4">
        <p className="text-xs text-zinc-500 mb-2">Progress per Lab</p>
        <div className="flex gap-1">
          {classData.labProgress.map((lp) => {
            const completion = Math.round((lp.studentsCompleted / classData.studentCount) * 100);
            return (
              <div
                key={lp.labId}
                className="flex-1 h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden"
                title={`Lab ${lp.labNumber}: ${completion}%`}
              >
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    completion >= 80 ? "bg-emerald-500" :
                    completion >= 50 ? "bg-[#088395]" :
                    completion >= 20 ? "bg-amber-500" : "bg-zinc-400"
                  )}
                  style={{ width: `${completion}%` }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-zinc-400">Lab 1</span>
          <span className="text-[9px] text-zinc-400">Lab 8</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => onViewLabs(classData)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#088395] text-white hover:bg-[#09637E] text-sm font-medium transition-colors"
        >
          <FlaskConical className="w-4 h-4" />
          Lihat Progress Lab
        </button>
        <button
          onClick={() => onManageStudents(classData)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm font-medium transition-colors"
        >
          <Users className="w-4 h-4" />
          Kelola Siswa
        </button>
      </div>
    </motion.div>
  );
}

function LabProgressModal({
  isOpen,
  onClose,
  classData,
}: {
  isOpen: boolean;
  onClose: () => void;
  classData: ClassData | null;
}) {
  const [selectedLab, setSelectedLab] = useState<LabProgress | null>(null);

  if (!isOpen || !classData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-4xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#088395] to-[#09637E] flex items-center justify-center">
                <FlaskConical className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Progress Lab - {classData.name}</h2>
                <p className="text-sm text-zinc-500">{classData.studentCount} siswa · 8 Lab Praktikum</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5 text-zinc-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-4">
            {classData.labProgress.map((lp) => {
              const completionRate = Math.round((lp.studentsCompleted / classData.studentCount) * 100);
              const isSelected = selectedLab?.labId === lp.labId;
              
              return (
                <div
                  key={lp.labId}
                  className={cn(
                    "rounded-xl border p-4 transition-all cursor-pointer",
                    isSelected
                      ? "border-[#088395] bg-[#088395]/5"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-[#088395]/50"
                  )}
                  onClick={() => setSelectedLab(isSelected ? null : lp)}
                >
                  <div className="flex items-center gap-4">
                    {/* Lab Number Badge */}
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg",
                      completionRate >= 80 ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" :
                      completionRate >= 50 ? "bg-[#088395]/20 text-[#088395]" :
                      completionRate >= 20 ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" :
                      "bg-zinc-200 dark:bg-zinc-800 text-zinc-500"
                    )}>
                      {lp.labNumber}
                    </div>

                    {/* Lab Info */}
                    <div className="flex-1">
                      <h4 className="font-medium text-zinc-900 dark:text-white">
                        Lab {lp.labNumber}: {lp.labTitle}
                      </h4>
                      <div className="flex items-center gap-4 mt-1 text-sm">
                        <span className="text-emerald-600 dark:text-emerald-400">
                          ✓ {lp.studentsCompleted} selesai
                        </span>
                        <span className="text-amber-600 dark:text-amber-400">
                          ◐ {lp.studentsInProgress} berjalan
                        </span>
                        <span className="text-zinc-500">
                          ○ {lp.studentsNotStarted} belum mulai
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-lg font-bold text-zinc-900 dark:text-white">{completionRate}%</p>
                        <p className="text-[10px] text-zinc-500">Selesai</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{lp.avgScore}</p>
                        <p className="text-[10px] text-zinc-500">Rata-rata</p>
                      </div>
                      <ChevronDown className={cn(
                        "w-5 h-5 text-zinc-400 transition-transform",
                        isSelected && "rotate-180"
                      )} />
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex h-3 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                      <div
                        className="bg-emerald-500 transition-all"
                        style={{ width: `${(lp.studentsCompleted / classData.studentCount) * 100}%` }}
                      />
                      <div
                        className="bg-amber-500 transition-all"
                        style={{ width: `${(lp.studentsInProgress / classData.studentCount) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                          <div className="grid grid-cols-3 gap-4">
                            <div className="rounded-lg bg-emerald-500/10 p-3">
                              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-sm font-medium">Selesai</span>
                              </div>
                              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{lp.studentsCompleted}</p>
                              <p className="text-xs text-zinc-500">siswa</p>
                            </div>
                            <div className="rounded-lg bg-amber-500/10 p-3">
                              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm font-medium">Sedang Berjalan</span>
                              </div>
                              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{lp.studentsInProgress}</p>
                              <p className="text-xs text-zinc-500">siswa</p>
                            </div>
                            <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3">
                              <div className="flex items-center gap-2 text-zinc-500 mb-1">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">Belum Mulai</span>
                              </div>
                              <p className="text-2xl font-bold text-zinc-600 dark:text-zinc-400">{lp.studentsNotStarted}</p>
                              <p className="text-xs text-zinc-500">siswa</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-zinc-500">Selesai</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-zinc-500">Berjalan</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-zinc-300 dark:bg-zinc-600" />
              <span className="text-zinc-500">Belum Mulai</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-medium transition-colors"
          >
            Tutup
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function StudentListModal({
  isOpen,
  onClose,
  classData,
}: {
  isOpen: boolean;
  onClose: () => void;
  classData: ClassData | null;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    if (classData) {
      setStudents(generateMockStudents(classData.id));
    }
  }, [classData]);

  if (!isOpen || !classData) return null;

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-3xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Siswa - {classData.name}</h2>
              <p className="text-sm text-zinc-500">{classData.studentCount} siswa terdaftar</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5 text-zinc-500" />
            </button>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
          <div className="flex-1">
            <SearchInput
              placeholder="Cari siswa..."
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#088395] text-white hover:bg-[#09637E] text-sm font-medium transition-colors">
            <UserPlus className="w-4 h-4" />
            Tambah
          </button>
        </div>

        {/* Student List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Avatar 
                fallback={student.name} 
                src={student.avatar} 
                size="md" 
                status={student.status}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-zinc-900 dark:text-white">{student.name}</p>
                <p className="text-xs text-zinc-500">@{student.username}</p>
              </div>
              <div className="text-center px-3">
                <p className="text-sm font-medium text-[#088395]">{student.labsCompleted}/{student.totalLabs}</p>
                <p className="text-[10px] text-zinc-500">Lab Selesai</p>
              </div>
              <div className="text-center px-3">
                <p className={cn(
                  "text-sm font-medium",
                  student.avgScore >= 80 ? "text-emerald-600 dark:text-emerald-400" :
                  student.avgScore >= 60 ? "text-amber-600 dark:text-amber-400" :
                  "text-rose-600 dark:text-rose-400"
                )}>{student.avgScore}</p>
                <p className="text-[10px] text-zinc-500">Rata-rata</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500">{student.lastActive}</p>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors" title="Lihat Detail">
                  <Eye className="w-4 h-4 text-zinc-500" />
                </button>
                <button className="p-2 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/10 transition-colors" title="Hapus">
                  <Trash2 className="w-4 h-4 text-rose-500" />
                </button>
              </div>
            </div>
          ))}

          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-500">Tidak ada siswa yang ditemukan</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-sm transition-colors">
              <Upload className="w-4 h-4" />
              Import CSV
            </button>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-sm transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-medium transition-colors"
          >
            Tutup
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function ClassManagementPage() {
  const [classes] = useState<ClassData[]>(mockClasses);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);

  // Stats
  const totalStudents = classes.reduce((acc, c) => acc + c.studentCount, 0);
  const avgProgress = Math.round(classes.reduce((acc, c) => acc + c.avgProgress, 0) / classes.length);
  const avgScore = Math.round(classes.reduce((acc, c) => acc + c.avgScore, 0) / classes.length);

  const handleViewLabs = (classData: ClassData) => {
    setSelectedClass(classData);
    setIsLabModalOpen(true);
  };

  const handleManageStudents = (classData: ClassData) => {
    setSelectedClass(classData);
    setIsStudentModalOpen(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#088395]/20 border border-[#088395]/30">
              <FolderOpen className="w-6 h-6 text-[#088395]" />
            </div>
            Manajemen Kelas
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            2 Kelas · 8 Lab Praktikum yang sama untuk setiap kelas
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="rounded-xl bg-[#088395]/10 border border-[#088395]/20 p-4 mb-6">
        <div className="flex items-start gap-3">
          <FlaskConical className="w-5 h-5 text-[#088395] mt-0.5" />
          <div>
            <p className="text-sm text-[#088395] font-medium">Semua kelas mengerjakan Lab 1-8 yang identik</p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              Lab: Pengenalan Jaringan → IP Address → Router → Routing → Switch/VLAN → Firewall → Monitoring → Implementasi
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8"
      >
        <motion.div variants={item}>
          <StatCard
            title="Total Kelas"
            value={classes.length}
            icon={<FolderOpen className="w-5 h-5" />}
            color="primary"
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard
            title="Total Siswa"
            value={totalStudents}
            icon={<Users className="w-5 h-5" />}
            color="info"
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard
            title="Rata-rata Progress"
            value={`${avgProgress}%`}
            icon={<TrendingUp className="w-5 h-5" />}
            color="warning"
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard
            title="Rata-rata Nilai"
            value={`${avgScore}%`}
            icon={<Award className="w-5 h-5" />}
            color="success"
          />
        </motion.div>
      </motion.div>

      {/* Lab List Overview */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">8 Lab Praktikum</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {labList.map((lab) => (
            <div
              key={lab.id}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-lg bg-[#088395]/20 text-[#088395] flex items-center justify-center text-sm font-bold">
                  {lab.number}
                </span>
                <span className="text-xs text-zinc-500">Lab {lab.number}</span>
              </div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white line-clamp-2">{lab.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Classes Grid */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Daftar Kelas</h2>
      </div>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-2"
      >
        {classes.map((classData) => (
          <ClassCard
            key={classData.id}
            classData={classData}
            onViewLabs={handleViewLabs}
            onManageStudents={handleManageStudents}
          />
        ))}
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {isLabModalOpen && (
          <LabProgressModal
            isOpen={isLabModalOpen}
            onClose={() => {
              setIsLabModalOpen(false);
              setSelectedClass(null);
            }}
            classData={selectedClass}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isStudentModalOpen && (
          <StudentListModal
            isOpen={isStudentModalOpen}
            onClose={() => {
              setIsStudentModalOpen(false);
              setSelectedClass(null);
            }}
            classData={selectedClass}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
