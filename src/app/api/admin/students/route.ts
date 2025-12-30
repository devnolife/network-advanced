import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/admin/students - Get all students with their lab progress
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if user is admin or instructor
    if (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR') {
      return NextResponse.json(
        { success: false, error: 'Not authorized' },
        { status: 403 }
      )
    }

    // Get all students with their progress
    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
      },
      include: {
        labProgress: {
          include: {
            lab: {
              select: {
                id: true,
                number: true,
                title: true,
                maxScore: true,
              },
            },
            taskCompletions: true,
          },
        },
        submissions: {
          orderBy: { submittedAt: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    })

    // Get total labs count
    const totalLabs = await prisma.lab.count()

    // Format student data with statistics
    const studentsWithStats = students.map((student) => {
      // Create a map of submissions by labId
      const submissionsByLab = new Map(
        student.submissions.map((s) => [s.labId, s])
      )

      const completedLabs = student.labProgress.filter(
        (p) => p.completedAt !== null
      ).length
      const inProgressLabs = student.labProgress.filter(
        (p) => p.completedAt === null
      ).length

      const totalScore = student.submissions.reduce((sum, s) => {
        return sum + s.score
      }, 0)

      const maxPossibleScore = student.submissions.reduce((sum, s) => {
        return sum + s.maxScore
      }, 0)

      const avgScore = maxPossibleScore > 0
        ? Math.round((totalScore / maxPossibleScore) * 100)
        : 0

      // Calculate grade
      const getGrade = (percentage: number) => {
        if (percentage >= 90) return 'A'
        if (percentage >= 80) return 'B'
        if (percentage >= 70) return 'C'
        if (percentage >= 60) return 'D'
        return 'F'
      }

      return {
        id: student.id,
        username: student.username,
        name: student.name,
        createdAt: student.createdAt,
        stats: {
          completedLabs,
          inProgressLabs,
          totalLabs,
          totalScore,
          maxPossibleScore,
          avgScore,
          grade: getGrade(avgScore),
        },
        labProgress: student.labProgress.map((p) => {
          const submission = submissionsByLab.get(p.labId)
          return {
            labId: p.lab.id,
            labNumber: p.lab.number,
            labTitle: p.lab.title,
            maxScore: p.lab.maxScore,
            startedAt: p.startedAt,
            completedAt: p.completedAt,
            currentScore: p.currentScore,
            tasksCompleted: p.taskCompletions.length,
            submission: submission
              ? {
                score: submission.score,
                grade: submission.grade,
                submittedAt: submission.submittedAt,
              }
              : null,
          }
        }),
      }
    })

    // Calculate overall statistics
    const overallStats = {
      totalStudents: students.length,
      totalCompletions: studentsWithStats.reduce(
        (sum, s) => sum + s.stats.completedLabs,
        0
      ),
      avgCompletionRate: students.length > 0
        ? Math.round(
          (studentsWithStats.reduce(
            (sum, s) => sum + s.stats.completedLabs,
            0
          ) /
            (students.length * totalLabs)) *
          100
        )
        : 0,
      avgScore: students.length > 0
        ? Math.round(
          studentsWithStats.reduce((sum, s) => sum + s.stats.avgScore, 0) /
          students.length
        )
        : 0,
    }

    return NextResponse.json({
      success: true,
      students: studentsWithStats,
      stats: overallStats,
    })
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch students' },
      { status: 500 }
    )
  }
}
