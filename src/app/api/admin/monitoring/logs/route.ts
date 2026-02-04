import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

type LogLevel = 'info' | 'warning' | 'error' | 'success';

interface LogEntry {
  id: string;
  level: LogLevel;
  category: string;
  message: string;
  details?: string;
  user?: string;
  ip?: string;
  timestamp: string;
}

// Simulated activity logs
function generateActivityLogs(limit: number = 50): LogEntry[] {
  const categories = ['auth', 'lab', 'system', 'user', 'admin', 'network'];
  const levels: LogLevel[] = ['info', 'warning', 'error', 'success'];
  
  const logTemplates = [
    { level: 'success' as LogLevel, category: 'auth', message: 'User login successful', user: true },
    { level: 'warning' as LogLevel, category: 'auth', message: 'Failed login attempt', user: true },
    { level: 'info' as LogLevel, category: 'lab', message: 'Lab session started', user: true },
    { level: 'success' as LogLevel, category: 'lab', message: 'Lab completed successfully', user: true },
    { level: 'info' as LogLevel, category: 'lab', message: 'Task submitted for verification', user: true },
    { level: 'error' as LogLevel, category: 'system', message: 'Database connection timeout', user: false },
    { level: 'warning' as LogLevel, category: 'system', message: 'High memory usage detected', user: false },
    { level: 'info' as LogLevel, category: 'system', message: 'Backup completed successfully', user: false },
    { level: 'success' as LogLevel, category: 'user', message: 'New user registered', user: true },
    { level: 'info' as LogLevel, category: 'user', message: 'Profile updated', user: true },
    { level: 'warning' as LogLevel, category: 'admin', message: 'Admin permission granted', user: true },
    { level: 'info' as LogLevel, category: 'admin', message: 'Settings updated', user: true },
    { level: 'error' as LogLevel, category: 'network', message: 'Connection to VM failed', user: false },
    { level: 'info' as LogLevel, category: 'network', message: 'Network topology loaded', user: true },
  ];

  const users = [
    'ahmad.rizky', 'siti.nurhaliza', 'budi.santoso', 'dewi.lestari',
    'admin', 'system', 'eko.prasetyo', 'fitri.handayani'
  ];

  const logs: LogEntry[] = [];
  const now = Date.now();

  for (let i = 0; i < limit; i++) {
    const template = logTemplates[Math.floor(Math.random() * logTemplates.length)];
    const minutesAgo = Math.floor(Math.random() * 1440); // Up to 24 hours ago
    
    logs.push({
      id: `log-${i + 1}`,
      level: template.level,
      category: template.category,
      message: template.message,
      details: Math.random() > 0.5 ? `Additional details for log entry ${i + 1}` : undefined,
      user: template.user ? users[Math.floor(Math.random() * users.length)] : undefined,
      ip: template.user ? `192.168.1.${Math.floor(Math.random() * 155) + 100}` : undefined,
      timestamp: new Date(now - minutesAgo * 60000).toISOString(),
    });
  }

  // Sort by timestamp (newest first)
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function GET(request: Request) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const level = searchParams.get('level');
    const category = searchParams.get('category');

    let logs = generateActivityLogs(limit);

    // Filter by level if specified
    if (level && level !== 'all') {
      logs = logs.filter(log => log.level === level);
    }

    // Filter by category if specified
    if (category && category !== 'all') {
      logs = logs.filter(log => log.category === category);
    }

    // Calculate stats
    const allLogs = generateActivityLogs(100);
    const stats = {
      total: allLogs.length,
      byLevel: {
        info: allLogs.filter(l => l.level === 'info').length,
        success: allLogs.filter(l => l.level === 'success').length,
        warning: allLogs.filter(l => l.level === 'warning').length,
        error: allLogs.filter(l => l.level === 'error').length,
      },
      byCategory: {
        auth: allLogs.filter(l => l.category === 'auth').length,
        lab: allLogs.filter(l => l.category === 'lab').length,
        system: allLogs.filter(l => l.category === 'system').length,
        user: allLogs.filter(l => l.category === 'user').length,
        admin: allLogs.filter(l => l.category === 'admin').length,
        network: allLogs.filter(l => l.category === 'network').length,
      },
    };

    return NextResponse.json({
      success: true,
      logs,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
