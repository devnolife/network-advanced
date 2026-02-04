import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
  category: 'system' | 'lab' | 'user' | 'report' | 'security';
}

// Simulated notifications store (in production, use database)
let notifications: Notification[] = [];

// Generate initial notifications
function generateNotifications(): Notification[] {
  const now = Date.now();
  
  return [
    {
      id: 'notif-1',
      type: 'info',
      title: 'Siswa Baru Terdaftar',
      message: '3 siswa baru telah bergabung ke kelas XII TKJ-1',
      timestamp: new Date(now - 10 * 60000).toISOString(),
      read: false,
      link: '/dashboard/admin/students',
      category: 'user',
    },
    {
      id: 'notif-2',
      type: 'success',
      title: 'Lab Selesai',
      message: 'Ahmad Rizky menyelesaikan Lab 3 dengan nilai 95',
      timestamp: new Date(now - 25 * 60000).toISOString(),
      read: false,
      link: '/dashboard/admin/reports',
      category: 'lab',
    },
    {
      id: 'notif-3',
      type: 'warning',
      title: 'Penggunaan CPU Tinggi',
      message: 'Server Node 1 mencapai 85% penggunaan CPU',
      timestamp: new Date(now - 45 * 60000).toISOString(),
      read: false,
      link: '/dashboard/admin/monitoring',
      category: 'system',
    },
    {
      id: 'notif-4',
      type: 'info',
      title: 'Laporan Mingguan',
      message: 'Laporan progress kelas minggu ini sudah siap',
      timestamp: new Date(now - 2 * 3600000).toISOString(),
      read: true,
      link: '/dashboard/admin/reports',
      category: 'report',
    },
    {
      id: 'notif-5',
      type: 'error',
      title: 'Gagal Login',
      message: '5 percobaan login gagal dari IP 192.168.1.105',
      timestamp: new Date(now - 3 * 3600000).toISOString(),
      read: true,
      link: '/dashboard/admin/monitoring',
      category: 'security',
    },
    {
      id: 'notif-6',
      type: 'success',
      title: 'Backup Selesai',
      message: 'Backup database harian berhasil dilakukan',
      timestamp: new Date(now - 5 * 3600000).toISOString(),
      read: true,
      category: 'system',
    },
    {
      id: 'notif-7',
      type: 'info',
      title: 'Jadwal Lab Baru',
      message: 'Lab 5 dijadwalkan untuk XII TKJ-2 besok',
      timestamp: new Date(now - 8 * 3600000).toISOString(),
      read: true,
      link: '/dashboard/admin/classes',
      category: 'lab',
    },
    {
      id: 'notif-8',
      type: 'warning',
      title: 'Deadline Mendekati',
      message: '10 siswa belum menyelesaikan Lab 2',
      timestamp: new Date(now - 12 * 3600000).toISOString(),
      read: true,
      link: '/dashboard/admin/reports',
      category: 'report',
    },
  ];
}

// Initialize notifications
if (notifications.length === 0) {
  notifications = generateNotifications();
}

// GET: Fetch all notifications
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
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'INSTRUCTOR')) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Sort by timestamp (newest first)
    const sortedNotifications = [...notifications].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const unreadCount = notifications.filter(n => !n.read).length;

    return NextResponse.json({
      success: true,
      notifications: sortedNotifications,
      unreadCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create new notification or perform actions
export async function POST(request: Request) {
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
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'INSTRUCTOR')) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, id, notification } = body;

    switch (action) {
      case 'mark_read':
        // Mark single notification as read
        notifications = notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        );
        break;

      case 'mark_all_read':
        // Mark all notifications as read
        notifications = notifications.map(n => ({ ...n, read: true }));
        break;

      case 'delete':
        // Delete single notification
        notifications = notifications.filter(n => n.id !== id);
        break;

      case 'clear_all':
        // Clear all notifications
        notifications = [];
        break;

      case 'create':
        // Create new notification
        if (notification) {
          const newNotification: Notification = {
            id: `notif-${Date.now()}`,
            type: notification.type || 'info',
            title: notification.title,
            message: notification.message,
            timestamp: new Date().toISOString(),
            read: false,
            link: notification.link,
            category: notification.category || 'system',
          };
          notifications.unshift(newNotification);
        }
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    const unreadCount = notifications.filter(n => !n.read).length;

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error processing notification action:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
