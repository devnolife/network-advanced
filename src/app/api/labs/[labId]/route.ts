import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/labs/[labId] - Get single lab with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ labId: string }> }
) {
  try {
    const { labId } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get lab with all relations
    const lab = await prisma.lab.findUnique({
      where: { id: labId },
      include: {
        tasks: {
          orderBy: { order: 'asc' },
        },
        hints: {
          orderBy: { order: 'asc' },
        },
        topology: true,
      },
    })

    if (!lab) {
      return NextResponse.json(
        { success: false, error: 'Lab not found' },
        { status: 404 }
      )
    }

    // Get user's progress for this lab
    const progress = await prisma.labProgress.findFirst({
      where: {
        userId: user.userId,
        labId: labId,
      },
      include: {
        taskCompletions: {
          include: {
            task: true,
          },
        },
        hintUsages: {
          include: {
            hint: true,
          },
        },
      },
    })

    // Build task status map
    const completedTaskIds = new Set(
      progress?.taskCompletions.map((tc) => tc.taskId) || []
    )
    const usedHintIds = new Set(
      progress?.hintUsages.map((hu) => hu.hintId) || []
    )

    // Get current task (first incomplete task)
    const currentTaskIndex = lab.tasks.findIndex(
      (t) => !completedTaskIds.has(t.id)
    )
    const currentTask = currentTaskIndex >= 0 ? lab.tasks[currentTaskIndex] : null

    // Format tasks with status
    const tasksWithStatus = lab.tasks.map((task, index) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      points: task.points,
      order: task.order,
      completed: completedTaskIds.has(task.id),
      current: currentTask?.id === task.id,
      locked: index > currentTaskIndex && currentTaskIndex >= 0,
      validation: task.validation,
    }))

    // Format hints (only show for current and completed tasks)
    const hintsWithStatus = lab.hints.map((hint) => {
      const taskCompleted = completedTaskIds.has(hint.taskId || '')
      const isCurrent = hint.taskId === currentTask?.id
      const isAccessible = taskCompleted || isCurrent

      return {
        id: hint.id,
        taskId: hint.taskId,
        content: usedHintIds.has(hint.id) ? hint.content : null,
        pointCost: hint.pointCost,
        used: usedHintIds.has(hint.id),
        accessible: isAccessible,
      }
    })

    // Calculate statistics
    const totalPoints = lab.tasks.reduce((sum, t) => sum + t.points, 0)
    const earnedPoints = progress?.currentScore || 0
    const hintsPointsUsed = progress?.hintUsages.reduce(
      (sum, hu) => sum + hu.pointsCost,
      0
    ) || 0

    return NextResponse.json({
      success: true,
      lab: {
        id: lab.id,
        number: lab.number,
        title: lab.title,
        description: lab.description,
        objectives: lab.objectives,
        difficulty: lab.difficulty,
        durationMinutes: lab.durationMinutes,
        maxScore: lab.maxScore,
        topology: lab.topology
          ? {
            devices: lab.topology.devices,
            links: lab.topology.links,
          }
          : null,
        tasks: tasksWithStatus,
        hints: hintsWithStatus,
      },
      progress: progress
        ? {
          id: progress.id,
          startedAt: progress.startedAt,
          completedAt: progress.completedAt,
          currentScore: progress.currentScore,
          maxScoreEarned: progress.maxScoreEarned,
          savedState: progress.savedState,
          tasksCompleted: completedTaskIds.size,
          totalTasks: lab.tasks.length,
        }
        : null,
      stats: {
        totalPoints,
        earnedPoints,
        hintsPointsUsed,
        netScore: earnedPoints - hintsPointsUsed,
        completionPercentage: Math.round(
          (completedTaskIds.size / lab.tasks.length) * 100
        ),
      },
    })
  } catch (error) {
    console.error('Error fetching lab:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lab' },
      { status: 500 }
    )
  }
}
