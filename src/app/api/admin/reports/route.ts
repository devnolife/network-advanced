import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/admin/reports - Get student progress reports
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all lab progress
    const progress = await prisma.labProgress.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        lab: {
          select: {
            id: true,
            number: true,
            title: true,
            maxScore: true,
            _count: {
              select: { tasks: true },
            },
          },
        },
        taskCompletions: true,
      },
      orderBy: { lastActivityAt: 'desc' },
    })

    // Format reports
    const reports = progress.map(p => ({
      id: p.id,
      studentName: p.user.name,
      studentUsername: p.user.username,
      labTitle: p.lab.title,
      labNumber: p.lab.number,
      status: p.completedAt ? 'completed' : p.taskCompletions.length > 0 ? 'in-progress' : 'not-started',
      score: p.currentScore,
      maxScore: p.lab.maxScore,
      tasksCompleted: p.taskCompletions.length,
      totalTasks: p.lab._count.tasks,
      startedAt: p.startedAt.toISOString(),
      completedAt: p.completedAt?.toISOString() || null,
    }))

    // Calculate stats
    const completedCount = reports.filter(r => r.status === 'completed').length
    const totalScores = reports.filter(r => r.status === 'completed')
    const avgScore = totalScores.length > 0
      ? Math.round(totalScores.reduce((acc, r) => acc + (r.score / r.maxScore) * 100, 0) / totalScores.length)
      : 0

    const uniqueStudents = new Set(reports.map(r => r.studentUsername))

    return NextResponse.json({
      success: true,
      reports,
      stats: {
        totalSubmissions: reports.length,
        completedLabs: completedCount,
        avgScore,
        activeStudents: uniqueStudents.size,
      },
    })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}
