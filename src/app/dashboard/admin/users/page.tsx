'use client';

import { cn } from '@/lib/utils';
import {
  Users,
  Search,
  Plus,
  MoreVertical,
  Mail,
  Shield,
  GraduationCap,
  Trash2,
  Edit,
  UserCheck,
  UserX,
  Loader2,
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  name: string;
  email: string | null;
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
  isActive: boolean;
  createdAt: string;
  _count?: {
    labProgress: number;
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'INSTRUCTOR':
        return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
      case 'STUDENT':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Shield className="h-4 w-4" />;
      case 'INSTRUCTOR':
        return <UserCheck className="h-4 w-4" />;
      case 'STUDENT':
        return <GraduationCap className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
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
          <h1 className="text-2xl font-bold text-white mb-2">User Management</h1>
          <p className="text-zinc-400">Manage all users including admins, instructors, and students</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 text-white font-medium hover:bg-cyan-400 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <Users className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="text-xs text-zinc-500">Total Users</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <Shield className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{users.filter(u => u.role === 'ADMIN').length}</p>
              <p className="text-xs text-zinc-500">Admins</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/10">
              <UserCheck className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{users.filter(u => u.role === 'INSTRUCTOR').length}</p>
              <p className="text-xs text-zinc-500">Instructors</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <GraduationCap className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{users.filter(u => u.role === 'STUDENT').length}</p>
              <p className="text-xs text-zinc-500">Students</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
        >
          <option value="all">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="INSTRUCTOR">Instructor</option>
          <option value="STUDENT">Student</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-4 px-6 text-sm font-medium text-zinc-400">User</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-zinc-400">Role</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-zinc-400">Status</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-zinc-400">Labs</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-zinc-400">Joined</th>
                <th className="text-right py-4 px-6 text-sm font-medium text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {user.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">{user.name}</p>
                        <p className="text-sm text-zinc-500">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                      getRoleBadge(user.role)
                    )}>
                      {getRoleIcon(user.role)}
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    {user.isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-zinc-400">
                    {user._count?.labProgress || 0}
                  </td>
                  <td className="py-4 px-6 text-zinc-400 text-sm">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400">No users found</p>
          </div>
        )}
      </div>
    </div>
  );
}
