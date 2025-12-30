import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// POST /api/labs/[labId]/submit - Submit lab for final grading
export async function POST(
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

    // Find user's progress
    const progress = await prisma.labProgress.findFirst({
      where: {
        userId: user.userId,
        labId: labId,
      },
      include: {
        taskCompletions: true,
        hintUsages: true,
        lab: {
          include: {
            tasks: true,
          },
        },
      },
    })

    if (!progress) {
      return NextResponse.json(
        { success: false, error: 'No active lab session' },
        { status: 400 }
      )
    }

    // Check if already submitted
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        userId: user.userId,
        labId: labId,
      },
    })

    if (existingSubmission) {
      return NextResponse.json({
        success: true,
        alreadySubmitted: true,
        submission: {
          id: existingSubmission.id,
          score: existingSubmission.score,
          submittedAt: existingSubmission.submittedAt,
          feedback: existingSubmission.feedback,
        },
      })
    }

    // Calculate final score
    const totalPoints = progress.lab.tasks.reduce((sum, t) => sum + t.points, 0)
    const earnedPoints = progress.taskCompletions.reduce(
      (sum, tc) => sum + tc.pointsEarned,
      0
    )
    const hintsDeducted = progress.hintUsages.reduce(
      (sum, hu) => sum + hu.pointsCost,
      0
    )
    const finalScore = Math.max(0, earnedPoints - hintsDeducted)
    const percentage = Math.round((finalScore / totalPoints) * 100)

    // Generate feedback
    const tasksCompleted = progress.taskCompletions.length
    const totalTasks = progress.lab.tasks.length
    const hintsUsed = progress.hintUsages.length

    let feedback = ''
    if (tasksCompleted === totalTasks) {
      if (hintsUsed === 0) {
        feedback = 'Excellent work! You completed all tasks without using any hints. Perfect performance!'
      } else if (hintsUsed <= 2) {
        feedback = `Great job! You completed all tasks with minimal hint usage (${hintsUsed} hints). Keep practicing!`
      } else {
        feedback = `Good effort! You completed all tasks. Consider reviewing the concepts to reduce hint dependency.`
      }
    } else {
      const remaining = totalTasks - tasksCompleted
      feedback = `Lab partially completed. ${remaining} task(s) remaining. You can continue working on this lab.`
    }

    // Add grade
    let grade = 'F'
    if (percentage >= 90) grade = 'A'
    else if (percentage >= 80) grade = 'B'
    else if (percentage >= 70) grade = 'C'
    else if (percentage >= 60) grade = 'D'

    // Create submission
    const submission = await prisma.submission.create({
      data: {
        userId: user.userId,
        labId: labId,
        score: finalScore,
        maxScore: totalPoints,
        feedback: feedback,
        configuration: {},
      },
    })

    // Mark progress as completed
    await prisma.labProgress.update({
      where: { id: progress.id },
      data: {
        completedAt: new Date(),
        maxScoreEarned: Math.max(progress.maxScoreEarned, finalScore),
      },
    })

    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        submittedAt: submission.submittedAt,
      },
      results: {
        score: finalScore,
        maxScore: totalPoints,
        percentage,
        grade,
        tasksCompleted,
        totalTasks,
        hintsUsed,
        hintsDeducted,
        feedback,
      },
    })
  } catch (error) {
    console.error('Error submitting lab:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit lab' },
      { status: 500 }
    )
  }
}

// GET /api/labs/[labId]/submit - Get submission status
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

    const submission = await prisma.submission.findFirst({
      where: {
        userId: user.userId,
        labId: labId,
      },
    })

    if (!submission) {
      return NextResponse.json({
        success: true,
        submitted: false,
      })
    }

    return NextResponse.json({
      success: true,
      submitted: true,
      submission: {
        id: submission.id,
        score: submission.score,
        maxScore: submission.maxScore,
        feedback: submission.feedback,
        submittedAt: submission.submittedAt,
      },
    })
  } catch (error) {
    console.error('Error getting submission:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get submission' },
      { status: 500 }
    )
  }
}
