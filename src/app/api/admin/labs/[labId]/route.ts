import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/admin/labs/[labId] - Get lab details with tasks and answers
export async function GET(
  request: Request,
  { params }: { params: Promise<{ labId: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { labId } = await params

    const lab = await prisma.lab.findUnique({
      where: { id: labId },
      include: {
        tasks: {
          select: {
            id: true,
            order: true,
            title: true,
            description: true,
            points: true,
            validation: true,
          },
          orderBy: { order: 'asc' },
        },
        hints: {
          select: {
            id: true,
            order: true,
            content: true,
            pointCost: true,
          },
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

    // Transform tasks to include expectedAnswer from validation JSON
    const tasksWithAnswers = lab.tasks.map(task => {
      const validation = task.validation as { expectedAnswer?: string; type?: string } | null
      return {
        id: task.id,
        order: task.order,
        title: task.title,
        description: task.description,
        points: task.points,
        expectedAnswer: validation?.expectedAnswer || 'No answer configured',
        answerType: validation?.type || 'text',
      }
    })

    return NextResponse.json({
      success: true,
      lab: {
        ...lab,
        tasks: tasksWithAnswers,
      },
    })
  } catch (error) {
    console.error('Error fetching lab details:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lab details' },
      { status: 500 }
    )
  }
}
