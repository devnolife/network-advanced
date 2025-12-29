import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// POST /api/labs/[labId]/save - Save lab state
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

    const body = await request.json()
    const { state } = body

    if (!state) {
      return NextResponse.json(
        { success: false, error: 'State is required' },
        { status: 400 }
      )
    }

    // Find user's progress
    const progress = await prisma.labProgress.findFirst({
      where: {
        userId: user.id,
        labId: labId,
      },
    })

    if (!progress) {
      return NextResponse.json(
        { success: false, error: 'No active lab session' },
        { status: 404 }
      )
    }

    // Update saved state
    await prisma.labProgress.update({
      where: { id: progress.id },
      data: {
        savedState: state,
        lastActivityAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'State saved successfully',
      savedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error saving state:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save state' },
      { status: 500 }
    )
  }
}
