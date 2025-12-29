import { NextResponse } from 'next/server'

// GET /api/achievements - Get all achievements with user unlock status
// Note: Achievement model not implemented yet, returning empty array
export async function GET() {
  try {
    // TODO: Implement when Achievement model is added to schema
    // For now, return empty achievements array
    return NextResponse.json({
      success: true,
      achievements: [],
    })
  } catch (error) {
    console.error('Error fetching achievements:', error)
    return NextResponse.json({
      success: true,
      achievements: [],
    })
  }
}
