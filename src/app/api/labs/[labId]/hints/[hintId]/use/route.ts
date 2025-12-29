import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// POST /api/labs/[labId]/hints/[hintId]/use - Use a hint
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ labId: string; hintId: string }> }
) {
  try {
    const { labId, hintId } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Find user's progress
    const progress = await prisma.labProgress.findFirst({
      where: {
        userId: user.id,
        labId: labId,
      },
      include: {
        taskCompletions: true,
        hintUsages: true,
      },
    })

    if (!progress) {
      return NextResponse.json(
        { success: false, error: 'No active lab session' },
        { status: 400 }
      )
    }

    // Check if hint already used
    if (progress.hintUsages.some((hu) => hu.hintId === hintId)) {
      // Return the hint content again
      const hint = await prisma.labHint.findUnique({
        where: { id: hintId },
      })

      return NextResponse.json({
        success: true,
        alreadyUsed: true,
        hint: {
          id: hintId,
          content: hint?.content,
          pointCost: 0, // Already paid
        },
      })
    }

    // Get the hint
    const hint = await prisma.labHint.findUnique({
      where: { id: hintId },
      include: {
        task: {
          include: {
            lab: {
              include: {
                tasks: {
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
      },
    })

    if (!hint || hint.labId !== labId) {
      return NextResponse.json(
        { success: false, error: 'Hint not found' },
        { status: 404 }
      )
    }

    // Check if hint is accessible (task is current or completed)
    if (hint.taskId) {
      const completedTaskIds = new Set(
        progress.taskCompletions.map((tc) => tc.taskId)
      )

      // Find current task
      const currentTask = hint.task?.lab.tasks.find(
        (t) => !completedTaskIds.has(t.id)
      )

      const isTaskAccessible =
        completedTaskIds.has(hint.taskId) || currentTask?.id === hint.taskId

      if (!isTaskAccessible) {
        return NextResponse.json(
          { success: false, error: 'Hint is not available for this task yet' },
          { status: 400 }
        )
      }
    }

    // Record hint usage
    await prisma.hintUsage.create({
      data: {
        progressId: progress.id,
        hintId: hintId,
        pointsDeducted: hint.pointCost,
      },
    })

    // Update the current score (deduct points)
    const newScore = Math.max(0, progress.currentScore - hint.pointCost)
    await prisma.labProgress.update({
      where: { id: progress.id },
      data: {
        currentScore: newScore,
        lastActivityAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      hint: {
        id: hint.id,
        content: hint.content,
        pointCost: hint.pointCost,
      },
      progress: {
        currentScore: newScore,
        pointsDeducted: hint.pointCost,
      },
    })
  } catch (error) {
    console.error('Error using hint:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to use hint' },
      { status: 500 }
    )
  }
}
