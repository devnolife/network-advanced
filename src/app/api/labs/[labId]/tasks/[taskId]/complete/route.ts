import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import {
  validateTask,
  ValidationContext,
  ValidationCriteria,
} from '@/lib/lab/validation'

// POST /api/labs/[labId]/tasks/[taskId]/complete - Complete a task
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ labId: string; taskId: string }> }
) {
  try {
    const { labId, taskId } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get context from request body
    const body = await request.json()
    const context: ValidationContext = body.context || {
      deviceConfigs: {},
      commandHistory: {},
      connectivityResults: {},
    }

    // Find user's progress
    const progress = await prisma.labProgress.findFirst({
      where: {
        userId: user.userId,
        labId: labId,
      },
      include: {
        taskCompletions: true,
      },
    })

    if (!progress) {
      return NextResponse.json(
        { success: false, error: 'No active lab session. Please start the lab first.' },
        { status: 400 }
      )
    }

    // Check if task already completed
    if (progress.taskCompletions.some((tc) => tc.taskId === taskId)) {
      return NextResponse.json({
        success: true,
        alreadyCompleted: true,
        message: 'Task already completed',
      })
    }

    // Get the task
    const task = await prisma.labTask.findUnique({
      where: { id: taskId },
      include: {
        lab: {
          include: {
            tasks: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    })

    if (!task || task.labId !== labId) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      )
    }

    // Check if previous tasks are completed (sequential requirement)
    const previousTasks = task.lab.tasks.filter((t) => t.order < task.order)
    const completedTaskIds = new Set(
      progress.taskCompletions.map((tc) => tc.taskId)
    )

    for (const prevTask of previousTasks) {
      if (!completedTaskIds.has(prevTask.id)) {
        return NextResponse.json(
          {
            success: false,
            error: `Complete previous tasks first. Task "${prevTask.title}" is not completed.`,
            lockedBy: prevTask.id,
          },
          { status: 400 }
        )
      }
    }

    // Validate the task
    const validationCriteria = task.validation as unknown as ValidationCriteria
    const result = validateTask(validationCriteria, context)

    if (!result.valid) {
      return NextResponse.json({
        success: false,
        validated: false,
        message: result.message,
        details: result.details,
      })
    }

    // Task is valid - record completion
    const completion = await prisma.taskCompletion.create({
      data: {
        progressId: progress.id,
        taskId: taskId,
        pointsEarned: task.points,
      },
    })

    // Update progress score
    const newScore = progress.currentScore + task.points
    await prisma.labProgress.update({
      where: { id: progress.id },
      data: {
        currentScore: newScore,
        maxScoreEarned: Math.max(progress.maxScoreEarned, newScore),
        lastActivityAt: new Date(),
      },
    })

    // Check if all tasks are completed
    const allTasksCompleted =
      progress.taskCompletions.length + 1 === task.lab.tasks.length

    // Find next task
    const nextTask = task.lab.tasks.find((t) => t.order > task.order)

    return NextResponse.json({
      success: true,
      validated: true,
      message: result.message,
      completion: {
        id: completion.id,
        pointsEarned: task.points,
        completedAt: completion.completedAt,
      },
      progress: {
        currentScore: newScore,
        tasksCompleted: progress.taskCompletions.length + 1,
        totalTasks: task.lab.tasks.length,
        allCompleted: allTasksCompleted,
      },
      nextTask: nextTask
        ? {
          id: nextTask.id,
          title: nextTask.title,
        }
        : null,
    })
  } catch (error) {
    console.error('Error completing task:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to complete task' },
      { status: 500 }
    )
  }
}
