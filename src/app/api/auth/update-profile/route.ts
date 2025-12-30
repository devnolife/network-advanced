import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// PUT /api/auth/update-profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { name, username } = await request.json()

    // Validate input
    if (!name || !username) {
      return NextResponse.json(
        { success: false, error: 'Name and username are required' },
        { status: 400 }
      )
    }

    if (username.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Username must be at least 3 characters' },
        { status: 400 }
      )
    }

    // Check if username is taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        username,
        NOT: { id: user.userId },
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Username is already taken' },
        { status: 400 }
      )
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: { name, username },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      user: updatedUser,
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
