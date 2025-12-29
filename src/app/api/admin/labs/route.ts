import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/admin/labs - Get all labs with details
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const labs = await prisma.lab.findMany({
      select: {
        id: true,
        number: true,
        title: true,
        description: true,
        difficulty: true,
        durationMinutes: true,
        maxScore: true,
        isActive: true,
        isLocked: true,
        prerequisiteId: true,
        _count: {
          select: {
            tasks: true,
            hints: true,
            progress: true,
          },
        },
      },
      orderBy: { number: 'asc' },
    })

    return NextResponse.json({
      success: true,
      labs,
    })
  } catch (error) {
    console.error('Error fetching labs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch labs' },
      { status: 500 }
    )
  }
}
