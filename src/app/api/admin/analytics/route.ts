import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/admin/analytics - Get platform analytics
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || 'month'

    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    if (range === 'week') {
      startDate.setDate(now.getDate() - 7)
    } else if (range === 'month') {
      startDate.setMonth(now.getMonth() - 1)
    } else {
      startDate = new Date(0) // All time
    }

    // Get overview stats
    const [
      totalStudents,
      activeStudents,
      allProgress,
      labs,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({
        where: {
          role: 'STUDENT',
          labProgress: {
            some: {
              lastActivityAt: { gte: startDate },
            },
          },
        },
      }),
      prisma.labProgress.findMany({
        where: {
          lastActivityAt: { gte: startDate },
        },
        include: {
          user: { select: { id: true, name: true, username: true } },
          lab: { select: { id: true, number: true, title: true, maxScore: true, durationMinutes: true } },
          taskCompletions: true,
        },
      }),
      prisma.lab.findMany({
        where: { isActive: true },
        include: {
          _count: { select: { tasks: true } },
        },
        orderBy: { number: 'asc' },
      }),
    ])

    // Calculate completion rate and avg score
    const completedProgress = allProgress.filter(p => p.completedAt)
    const completionRate = allProgress.length > 0
      ? Math.round((completedProgress.length / allProgress.length) * 100)
      : 0

    const avgScore = completedProgress.length > 0
      ? Math.round(
        completedProgress.reduce((acc, p) => acc + (p.currentScore / (p.lab?.maxScore || 100)) * 100, 0) / completedProgress.length
      )
      : 0

    const totalTimeSpent = completedProgress.reduce((acc, p) => acc + (p.lab?.durationMinutes || 0), 0)

    // Lab stats
    const labStats = labs.map(lab => {
      const labProgress = allProgress.filter(p => p.lab?.id === lab.id)
      const labCompleted = labProgress.filter(p => p.completedAt)

      return {
        labId: lab.id,
        labNumber: lab.number,
        title: lab.title,
        enrollments: labProgress.length,
        completions: labCompleted.length,
        avgScore: labCompleted.length > 0
          ? Math.round(labCompleted.reduce((acc, p) => acc + (p.currentScore / (p.lab?.maxScore || 100)) * 100, 0) / labCompleted.length)
          : 0,
        avgTimeMinutes: lab.durationMinutes,
      }
    })

    // Weekly activity (last 7 days)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const weeklyActivity = days.map((day, index) => {
      const dayProgress = allProgress.filter(p => {
        const progressDay = p.lastActivityAt.getDay()
        return progressDay === index
      })

      return {
        day,
        submissions: dayProgress.length,
        completions: dayProgress.filter(p => p.completedAt).length,
      }
    })

    // Top performers
    const studentScores = new Map<string, { id: string; name: string | null; username: string; completedLabs: number; totalScore: number; count: number }>()

    completedProgress.forEach(p => {
      if (!p.user) return
      const existing = studentScores.get(p.user.id) || {
        id: p.user.id,
        name: p.user.name,
        username: p.user.username,
        completedLabs: 0,
        totalScore: 0,
        count: 0,
      }

      existing.completedLabs += 1
      existing.totalScore += (p.currentScore / (p.lab?.maxScore || 100)) * 100
      existing.count += 1

      studentScores.set(p.user.id, existing)
    })

    const topPerformers = Array.from(studentScores.values())
      .map(s => ({
        id: s.id,
        name: s.name,
        username: s.username,
        completedLabs: s.completedLabs,
        avgScore: Math.round(s.totalScore / s.count),
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 10)

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalStudents,
          activeStudents,
          completionRate,
          avgScore,
          totalTimeSpent,
          labsCompleted: completedProgress.length,
        },
        labStats,
        weeklyActivity,
        topPerformers,
      },
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
