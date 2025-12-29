import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/admin/stats - Get dashboard statistics
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get counts
    const [totalUsers, totalStudents, totalLabs, labProgress] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.lab.count({ where: { isActive: true } }),
      prisma.labProgress.findMany({
        include: {
          user: { select: { name: true } },
          lab: { select: { title: true, maxScore: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
    ])

    // Calculate average score
    const completedProgress = labProgress.filter(p => p.completedAt)
    const avgScore = completedProgress.length > 0
      ? Math.round(
        completedProgress.reduce((acc, p) => acc + (p.currentScore / p.lab.maxScore) * 100, 0) / completedProgress.length
      )
      : 0

    // Format recent activity
    const recentActivity = labProgress.slice(0, 5).map(p => ({
      id: p.id,
      user: p.user.name,
      action: p.completedAt ? 'completed' : 'started',
      lab: p.lab.title,
      time: getTimeAgo(p.updatedAt),
    }))

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalStudents,
        totalLabs,
        completedLabs: completedProgress.length,
        avgScore,
        activeToday: 0,
      },
      recentActivity,
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}
