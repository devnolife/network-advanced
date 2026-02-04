import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

// Simulated active lab sessions
function generateActiveSessions() {
  const students = [
    { id: '1', name: 'Ahmad Rizky', username: 'ahmad.rizky', class: 'XII TKJ-1' },
    { id: '2', name: 'Siti Nurhaliza', username: 'siti.nurhaliza', class: 'XII TKJ-1' },
    { id: '3', name: 'Budi Santoso', username: 'budi.santoso', class: 'XII TKJ-2' },
    { id: '4', name: 'Dewi Lestari', username: 'dewi.lestari', class: 'XII TKJ-1' },
    { id: '5', name: 'Eko Prasetyo', username: 'eko.prasetyo', class: 'XII TKJ-2' },
    { id: '6', name: 'Fitri Handayani', username: 'fitri.handayani', class: 'XII TKJ-1' },
    { id: '7', name: 'Galih Pratama', username: 'galih.pratama', class: 'XII TKJ-2' },
    { id: '8', name: 'Hana Safitri', username: 'hana.safitri', class: 'XII TKJ-1' },
  ];

  const labs = [
    { id: '1', number: 1, title: 'Pengenalan Jaringan' },
    { id: '2', number: 2, title: 'Konfigurasi IP Address' },
    { id: '3', number: 3, title: 'Konfigurasi Router' },
    { id: '4', number: 4, title: 'Firewall Dasar' },
    { id: '5', number: 5, title: 'VLAN Configuration' },
  ];

  const statuses = ['active', 'idle', 'completing'] as const;

  // Generate random sessions
  const activeCount = Math.floor(Math.random() * 5) + 4; // 4-8 active sessions
  const sessions = students.slice(0, activeCount).map((student, index) => {
    const lab = labs[Math.floor(Math.random() * labs.length)];
    const progress = Math.floor(Math.random() * 80) + 20; // 20-100%
    const startedMinutesAgo = Math.floor(Math.random() * 45) + 5; // 5-50 minutes ago
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    return {
      id: `session-${index + 1}`,
      student: {
        id: student.id,
        name: student.name,
        username: student.username,
        class: student.class,
        avatar: null,
      },
      lab: {
        id: lab.id,
        number: lab.number,
        title: lab.title,
      },
      status,
      progress,
      tasksCompleted: Math.floor((progress / 100) * 5),
      totalTasks: 5,
      startedAt: new Date(Date.now() - startedMinutesAgo * 60000).toISOString(),
      lastActivity: new Date(Date.now() - Math.floor(Math.random() * 5) * 60000).toISOString(),
      ipAddress: `192.168.1.${100 + index}`,
      browser: ['Chrome', 'Firefox', 'Edge', 'Safari'][Math.floor(Math.random() * 4)],
    };
  });

  return sessions;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const sessions = generateActiveSessions();

    return NextResponse.json({
      success: true,
      sessions,
      stats: {
        totalActive: sessions.length,
        byStatus: {
          active: sessions.filter(s => s.status === 'active').length,
          idle: sessions.filter(s => s.status === 'idle').length,
          completing: sessions.filter(s => s.status === 'completing').length,
        },
        byLab: sessions.reduce((acc, s) => {
          acc[s.lab.number] = (acc[s.lab.number] || 0) + 1;
          return acc;
        }, {} as Record<number, number>),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
