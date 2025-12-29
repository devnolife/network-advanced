import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// POST /api/labs/[labId]/start - Start or resume a lab session
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

    // Check if lab exists
    const lab = await prisma.lab.findUnique({
      where: { id: labId },
      include: {
        tasks: {
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

    // Check for existing progress
    let progress = await prisma.labProgress.findFirst({
      where: {
        userId: user.userId,
        labId: labId,
      },
      include: {
        taskCompletions: true,
        hintUsages: true,
      },
    })

    if (progress) {
      // Resume existing session - update last activity
      progress = await prisma.labProgress.update({
        where: { id: progress.id },
        data: { lastActivityAt: new Date() },
        include: {
          taskCompletions: true,
          hintUsages: true,
        },
      })

      return NextResponse.json({
        success: true,
        action: 'resumed',
        progress: {
          id: progress.id,
          startedAt: progress.startedAt,
          currentScore: progress.currentScore,
          savedState: progress.savedState,
          tasksCompleted: progress.taskCompletions.length,
          totalTasks: lab.tasks.length,
        },
        lab: {
          id: lab.id,
          title: lab.title,
          topology: lab.topology
            ? {
              devices: lab.topology.devices,
              links: lab.topology.links,
            }
            : null,
        },
      })
    }

    // Create new progress record
    progress = await prisma.labProgress.create({
      data: {
        userId: user.userId,
        labId: labId,
        currentScore: 0,
        maxScoreEarned: 0,
        savedState: {
          deviceConfigs: {},
          commandHistory: {},
          connectivityResults: {},
        },
      },
      include: {
        taskCompletions: true,
        hintUsages: true,
      },
    })

    return NextResponse.json({
      success: true,
      action: 'started',
      progress: {
        id: progress.id,
        startedAt: progress.startedAt,
        currentScore: 0,
        savedState: progress.savedState,
        tasksCompleted: 0,
        totalTasks: lab.tasks.length,
      },
      lab: {
        id: lab.id,
        title: lab.title,
        topology: lab.topology
          ? {
            devices: lab.topology.devices,
            links: lab.topology.links,
          }
          : null,
      },
    })
  } catch (error) {
    console.error('Error starting lab:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to start lab' },
      { status: 500 }
    )
  }
}

// GET /api/labs/[labId]/start - Get current session state
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
            tasks: { orderBy: { order: 'asc' } },
          },
        },
      },
    })

    if (!progress) {
      return NextResponse.json({
        success: true,
        hasSession: false,
      })
    }

    return NextResponse.json({
      success: true,
      hasSession: true,
      progress: {
        id: progress.id,
        startedAt: progress.startedAt,
        completedAt: progress.completedAt,
        currentScore: progress.currentScore,
        savedState: progress.savedState,
        tasksCompleted: progress.taskCompletions.length,
        totalTasks: progress.lab.tasks.length,
        lastActivityAt: progress.lastActivityAt,
      },
    })
  } catch (error) {
    console.error('Error getting session:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get session' },
      { status: 500 }
    )
  }
}
