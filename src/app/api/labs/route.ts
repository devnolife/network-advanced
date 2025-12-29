import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/labs - Get all labs with user progress and lock status
export async function GET() {
  try {
    const user = await getCurrentUser()

    // Get all active labs with prerequisite info
    const labs = await prisma.lab.findMany({
      where: { isActive: true },
      include: {
        tasks: {
          select: { id: true },
        },
        topology: true,
      },
      orderBy: { number: 'asc' },
    })

    // Get user's progress if logged in
    let completedLabIds: Set<string> = new Set()
    let progressMap = new Map<string, {
      startedAt: Date
      completedAt: Date | null
      currentScore: number
      tasksCompleted: number
    }>()

    if (user) {
      const progresses = await prisma.labProgress.findMany({
        where: { userId: user.userId },
        include: {
          taskCompletions: true,
        },
      })

      progresses.forEach((p) => {
        progressMap.set(p.labId, {
          startedAt: p.startedAt,
          completedAt: p.completedAt,
          currentScore: p.currentScore,
          tasksCompleted: p.taskCompletions.length,
        })

        // Track completed labs
        if (p.completedAt) {
          completedLabIds.add(p.labId)
        }
      })
    }

    // Build response with lock status
    const labsWithProgress = labs.map((lab) => {
      const progress = progressMap.get(lab.id) || null

      // Determine if lab is locked
      // Lab is LOCKED if:
      // 1. It has a prerequisite AND the prerequisite is NOT completed
      // Lab is UNLOCKED if:
      // 1. It's the first lab (number === 1), OR
      // 2. It has no prerequisite, OR
      // 3. The prerequisite has been completed

      let isLocked = false

      // If lab has a prerequisite, check if it's completed
      if (lab.prerequisiteId) {
        // Lab is locked if prerequisite is NOT in completedLabIds
        isLocked = !completedLabIds.has(lab.prerequisiteId)
      }

      // First lab is never locked
      if (lab.number === 1) {
        isLocked = false
      }

      // Find prerequisite lab name for locked reason
      let lockedReason: string | null = null
      if (isLocked && lab.prerequisiteId) {
        const prerequisiteLab = labs.find(l => l.id === lab.prerequisiteId)
        if (prerequisiteLab) {
          lockedReason = `Selesaikan "${prerequisiteLab.title}" terlebih dahulu`
        }
      }

      return {
        id: lab.id,
        number: lab.number,
        title: lab.title,
        description: lab.description,
        objectives: lab.objectives,
        difficulty: lab.difficulty,
        durationMinutes: lab.durationMinutes,
        maxScore: lab.maxScore,
        totalTasks: lab.tasks.length,
        isLocked,
        lockedReason,
        prerequisiteId: lab.prerequisiteId,
        progress,
      }
    })

    return NextResponse.json({
      success: true,
      labs: labsWithProgress,
    })
  } catch (error) {
    console.error('Error fetching labs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch labs' },
      { status: 500 }
    )
  }
}
