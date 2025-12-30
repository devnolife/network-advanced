import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/admin/students/[studentId] - Get detailed progress for a specific student
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if user is admin or instructor
    if (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR') {
      return NextResponse.json(
        { success: false, error: 'Not authorized' },
        { status: 403 }
      )
    }

    // Get student with full progress details
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        labProgress: {
          include: {
            lab: {
              include: {
                tasks: {
                  orderBy: { order: 'asc' },
                },
              },
            },
            taskCompletions: {
              include: {
                task: true,
              },
              orderBy: { completedAt: 'asc' },
            },
            hintUsages: {
              include: {
                hint: true,
              },
            },
          },
          orderBy: { startedAt: 'desc' },
        },
        submissions: {
          include: {
            lab: true,
          },
          orderBy: { submittedAt: 'desc' },
        },
      },
    })

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      )
    }

    if (student.role !== 'STUDENT') {
      return NextResponse.json(
        { success: false, error: 'User is not a student' },
        { status: 400 }
      )
    }

    // Get all labs for comparison
    const allLabs = await prisma.lab.findMany({
      orderBy: { number: 'asc' },
      select: {
        id: true,
        number: true,
        title: true,
        maxScore: true,
        tasks: {
          select: { id: true },
        },
      },
    })

    // Map progress by lab ID
    const progressByLab = new Map(
      student.labProgress.map((p) => [p.labId, p])
    )

    // Map submissions by lab ID
    const submissionsByLab = new Map<string, typeof student.submissions>()
    for (const submission of student.submissions) {
      const existing = submissionsByLab.get(submission.labId) || []
      existing.push(submission)
      submissionsByLab.set(submission.labId, existing)
    }

    // Calculate detailed statistics
    const completedLabs = student.labProgress.filter((p) => p.completedAt !== null).length
    const inProgressLabs = student.labProgress.filter((p) => p.completedAt === null).length
    const notStartedLabs = allLabs.length - student.labProgress.length

    const totalTasksCompleted = student.labProgress.reduce(
      (sum, p) => sum + p.taskCompletions.length,
      0
    )
    const totalTasks = allLabs.reduce((sum, l) => sum + l.tasks.length, 0)

    const totalHintsUsed = student.labProgress.reduce(
      (sum, p) => sum + p.hintUsages.length,
      0
    )
    const totalPointsDeducted = student.labProgress.reduce(
      (sum, p) => sum + p.hintUsages.reduce((s, h) => s + h.pointsCost, 0),
      0
    )

    const totalScore = student.submissions.reduce((sum, s) => sum + s.score, 0)
    const maxPossibleScore = student.submissions.reduce((sum, s) => sum + s.maxScore, 0)
    const avgPercentage = maxPossibleScore > 0
      ? Math.round((totalScore / maxPossibleScore) * 100)
      : 0

    // Build detailed lab progress
    const labsProgress = allLabs.map((lab) => {
      const progress = progressByLab.get(lab.id)
      const labSubmissions = submissionsByLab.get(lab.id) || []
      const latestSubmission = labSubmissions[0]

      if (!progress) {
        return {
          labId: lab.id,
          labNumber: lab.number,
          labTitle: lab.title,
          maxScore: lab.maxScore,
          totalTasks: lab.tasks.length,
          status: 'not-started' as const,
          progress: null,
        }
      }

      return {
        labId: lab.id,
        labNumber: lab.number,
        labTitle: lab.title,
        maxScore: lab.maxScore,
        totalTasks: lab.tasks.length,
        status: progress.completedAt ? 'completed' : 'in-progress' as const,
        progress: {
          startedAt: progress.startedAt,
          completedAt: progress.completedAt,
          lastActivityAt: progress.lastActivityAt,
          currentScore: progress.currentScore,
          tasksCompleted: progress.taskCompletions.length,
          hintsUsed: progress.hintUsages.length,
          pointsDeducted: progress.hintUsages.reduce(
            (s, h) => s + h.pointsCost,
            0
          ),
          taskDetails: progress.taskCompletions.map((tc) => ({
            taskId: tc.task.id,
            taskTitle: tc.task.title,
            taskOrder: tc.task.order,
            completedAt: tc.completedAt,
            pointsEarned: tc.pointsEarned,
          })),
          submission: latestSubmission
            ? {
              score: latestSubmission.score,
              maxScore: latestSubmission.maxScore,
              percentage: Math.round(
                (latestSubmission.score / latestSubmission.maxScore) * 100
              ),
              grade: latestSubmission.grade,
              submittedAt: latestSubmission.submittedAt,
              feedback: latestSubmission.feedback,
            }
            : null,
        },
      }
    })

    // Activity timeline
    const activities = [
      ...student.labProgress.map((p) => ({
        type: 'lab_started' as const,
        timestamp: p.startedAt,
        labTitle: p.lab.title,
      })),
      ...student.labProgress
        .filter((p) => p.completedAt)
        .map((p) => ({
          type: 'lab_completed' as const,
          timestamp: p.completedAt!,
          labTitle: p.lab.title,
        })),
      ...student.labProgress.flatMap((p) =>
        p.taskCompletions.map((tc) => ({
          type: 'task_completed' as const,
          timestamp: tc.completedAt,
          labTitle: p.lab.title,
          taskTitle: tc.task.title,
        }))
      ),
      ...student.submissions.map((s) => ({
        type: 'submission' as const,
        timestamp: s.submittedAt,
        labTitle: s.lab.title,
        grade: s.grade,
        score: s.score,
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        username: student.username,
        name: student.name,
        createdAt: student.createdAt,
      },
      stats: {
        completedLabs,
        inProgressLabs,
        notStartedLabs,
        totalLabs: allLabs.length,
        totalTasksCompleted,
        totalTasks,
        totalHintsUsed,
        totalPointsDeducted,
        totalScore,
        maxPossibleScore,
        avgPercentage,
      },
      labsProgress,
      recentActivity: activities.slice(0, 20),
    })
  } catch (error) {
    console.error('Error fetching student details:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch student details' },
      { status: 500 }
    )
  }
}
