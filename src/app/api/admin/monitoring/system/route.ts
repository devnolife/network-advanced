import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

// Simulated system metrics
function generateSystemMetrics() {
  const baseTime = Date.now();
  
  return {
    cpu: {
      usage: Math.floor(Math.random() * 30) + 45, // 45-75%
      cores: 8,
      temperature: Math.floor(Math.random() * 15) + 55, // 55-70°C
      history: Array.from({ length: 20 }, (_, i) => ({
        time: new Date(baseTime - (19 - i) * 60000).toISOString(),
        value: Math.floor(Math.random() * 30) + 40,
      })),
    },
    memory: {
      used: Math.floor(Math.random() * 4) + 12, // 12-16 GB
      total: 32,
      percentage: 0,
      history: Array.from({ length: 20 }, (_, i) => ({
        time: new Date(baseTime - (19 - i) * 60000).toISOString(),
        value: Math.floor(Math.random() * 15) + 35,
      })),
    },
    storage: {
      used: 256,
      total: 512,
      percentage: 50,
      breakdown: [
        { name: 'Lab Files', size: 120, color: '#088395' },
        { name: 'Database', size: 80, color: '#10B981' },
        { name: 'Logs', size: 35, color: '#F59E0B' },
        { name: 'System', size: 21, color: '#EF4444' },
      ],
    },
    network: {
      incoming: Math.floor(Math.random() * 50) + 100, // Mbps
      outgoing: Math.floor(Math.random() * 30) + 50, // Mbps
      totalIncoming: '1.2 TB',
      totalOutgoing: '856 GB',
      history: Array.from({ length: 20 }, (_, i) => ({
        time: new Date(baseTime - (19 - i) * 60000).toISOString(),
        incoming: Math.floor(Math.random() * 50) + 80,
        outgoing: Math.floor(Math.random() * 30) + 40,
      })),
    },
    uptime: {
      days: 45,
      hours: 12,
      minutes: 34,
      lastRestart: '2025-12-20T08:30:00Z',
    },
  };
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

    const metrics = generateSystemMetrics();
    // Calculate memory percentage
    metrics.memory.percentage = Math.round((metrics.memory.used / metrics.memory.total) * 100);

    return NextResponse.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
