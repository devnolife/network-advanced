// Lab Progress and Session Management Utilities

import prisma from '@/lib/prisma';

export interface LabSession {
  progressId: string;
  labId: string;
  userId: string;
  startedAt: Date;
  lastActivityAt: Date;
  currentTaskOrder: number;
  savedState: SavedLabState | null;
  totalTimeSpent: number;
  score: number;
  maxPossibleScore: number;
  hintsUsed: number;
  hintPenalty: number;
}

export interface SavedLabState {
  deviceConfigs: Record<string, unknown>;
  commandHistory: Record<string, string[]>;
  completedTaskIds: string[];
  currentTaskId: string | null;
  topologyState: unknown;
  lastUpdated: string;
}

export interface TaskValidationResult {
  valid: boolean;
  message: string;
  partialCredit?: number;
}

// Start or resume a lab session
export async function startOrResumeLabSession(
  userId: string,
  labId: string
): Promise<{ session: LabSession; isNew: boolean }> {
  // Check for existing progress
  let progress = await prisma.labProgress.findUnique({
    where: {
      userId_labId: { userId, labId },
    },
    include: {
      lab: {
        include: {
          tasks: { orderBy: { order: 'asc' } },
        },
      },
      taskCompletions: true,
      hintUsages: {
        include: { hint: true },
      },
    },
  });

  const isNew = !progress;

  if (!progress) {
    // Create new progress record
    progress = await prisma.labProgress.create({
      data: {
        userId,
        labId,
        startedAt: new Date(),
        lastActivityAt: new Date(),
        currentScore: 0,
        maxScoreEarned: 0,
        savedState: null,
        totalTimeSpent: 0,
      },
      include: {
        lab: {
          include: {
            tasks: { orderBy: { order: 'asc' } },
          },
        },
        taskCompletions: true,
        hintUsages: {
          include: { hint: true },
        },
      },
    });
  } else {
    // Update last activity
    await prisma.labProgress.update({
      where: { id: progress.id },
      data: { lastActivityAt: new Date() },
    });
  }

  // Calculate current task order based on completions
  const completedTaskIds = progress.taskCompletions.map((tc) => tc.taskId);
  const nextTask = progress.lab.tasks.find(
    (t) => !completedTaskIds.includes(t.id)
  );
  const currentTaskOrder = nextTask?.order ?? progress.lab.tasks.length + 1;

  // Calculate hint penalty
  const hintPenalty = progress.hintUsages.reduce(
    (sum, hu) => sum + hu.pointsCost,
    0
  );

  const session: LabSession = {
    progressId: progress.id,
    labId: progress.labId,
    userId: progress.userId,
    startedAt: progress.startedAt,
    lastActivityAt: progress.lastActivityAt,
    currentTaskOrder,
    savedState: progress.savedState as SavedLabState | null,
    totalTimeSpent: progress.totalTimeSpent,
    score: progress.currentScore,
    maxPossibleScore: progress.lab.maxScore,
    hintsUsed: progress.hintUsages.length,
    hintPenalty,
  };

  return { session, isNew };
}

// Save lab state (auto-save)
export async function saveLabState(
  progressId: string,
  state: SavedLabState,
  additionalTimeSpent: number = 0
): Promise<void> {
  await prisma.labProgress.update({
    where: { id: progressId },
    data: {
      savedState: state as unknown as Record<string, unknown>,
      lastActivityAt: new Date(),
      totalTimeSpent: {
        increment: additionalTimeSpent,
      },
    },
  });
}

// Complete a task
export async function completeTask(
  progressId: string,
  taskId: string,
  pointsEarned: number
): Promise<{ success: boolean; message: string; newScore: number }> {
  // Check if task already completed
  const existing = await prisma.taskCompletion.findUnique({
    where: {
      progressId_taskId: { progressId, taskId },
    },
  });

  if (existing) {
    const progress = await prisma.labProgress.findUnique({
      where: { id: progressId },
    });
    return {
      success: true,
      message: 'Task already completed',
      newScore: progress?.currentScore ?? 0,
    };
  }

  // Get the task to verify it exists and check order
  const task = await prisma.labTask.findUnique({
    where: { id: taskId },
    include: {
      lab: {
        include: {
          tasks: { orderBy: { order: 'asc' } },
        },
      },
    },
  });

  if (!task) {
    return { success: false, message: 'Task not found', newScore: 0 };
  }

  // Get completed tasks for this progress
  const completedTasks = await prisma.taskCompletion.findMany({
    where: { progressId },
    include: { task: true },
  });

  const completedOrders = completedTasks.map((tc) => tc.task.order);

  // Check if previous tasks are completed (sequential requirement)
  const previousTasks = task.lab.tasks.filter((t) => t.order < task.order);
  const allPreviousCompleted = previousTasks.every((pt) =>
    completedOrders.includes(pt.order)
  );

  if (!allPreviousCompleted) {
    return {
      success: false,
      message: 'You must complete previous tasks first',
      newScore: 0,
    };
  }

  // Create completion record and update score
  const [, updatedProgress] = await prisma.$transaction([
    prisma.taskCompletion.create({
      data: {
        progressId,
        taskId,
        completedAt: new Date(),
        pointsEarned,
      },
    }),
    prisma.labProgress.update({
      where: { id: progressId },
      data: {
        currentScore: { increment: pointsEarned },
        lastActivityAt: new Date(),
      },
    }),
  ]);

  // Check if all tasks are completed
  const totalTasks = task.lab.tasks.length;
  const completedCount = completedTasks.length + 1;

  if (completedCount === totalTasks) {
    await prisma.labProgress.update({
      where: { id: progressId },
      data: {
        completedAt: new Date(),
        maxScoreEarned: updatedProgress.currentScore,
      },
    });
  }

  return {
    success: true,
    message: 'Task completed successfully',
    newScore: updatedProgress.currentScore,
  };
}

// Use a hint
export async function useHint(
  progressId: string,
  hintId: string
): Promise<{ success: boolean; content: string; pointsCost: number }> {
  // Check if hint already used
  const existing = await prisma.hintUsage.findFirst({
    where: { progressId, hintId },
  });

  if (existing) {
    const hint = await prisma.labHint.findUnique({ where: { id: hintId } });
    return {
      success: true,
      content: hint?.content ?? '',
      pointsCost: 0, // Already used, no additional cost
    };
  }

  // Get hint details
  const hint = await prisma.labHint.findUnique({ where: { id: hintId } });
  if (!hint) {
    return { success: false, content: 'Hint not found', pointsCost: 0 };
  }

  // Record hint usage
  await prisma.hintUsage.create({
    data: {
      progressId,
      hintId,
      usedAt: new Date(),
      pointsCost: hint.pointCost,
    },
  });

  return {
    success: true,
    content: hint.content,
    pointsCost: hint.pointCost,
  };
}

// Submit lab for final grade
export async function submitLab(
  userId: string,
  labId: string,
  configuration: Record<string, unknown>
): Promise<{
  success: boolean;
  submissionId: string;
  finalScore: number;
  grade: string;
  feedback: string;
}> {
  // Get progress
  const progress = await prisma.labProgress.findUnique({
    where: {
      userId_labId: { userId, labId },
    },
    include: {
      lab: true,
      taskCompletions: true,
      hintUsages: true,
    },
  });

  if (!progress) {
    return {
      success: false,
      submissionId: '',
      finalScore: 0,
      grade: 'F',
      feedback: 'No progress found for this lab',
    };
  }

  // Calculate final score with hint penalties
  const hintPenalty = progress.hintUsages.reduce(
    (sum, hu) => sum + hu.pointsCost,
    0
  );
  const taskScore = progress.taskCompletions.reduce(
    (sum, tc) => sum + tc.pointsEarned,
    0
  );
  const finalScore = Math.max(0, taskScore - hintPenalty);

  // Calculate grade
  const percentage = (finalScore / progress.lab.maxScore) * 100;
  let grade: string;
  if (percentage >= 90) grade = 'A';
  else if (percentage >= 80) grade = 'B';
  else if (percentage >= 70) grade = 'C';
  else if (percentage >= 60) grade = 'D';
  else grade = 'F';

  // Generate feedback
  const completedTasks = progress.taskCompletions.length;
  const totalTasks = await prisma.labTask.count({
    where: { labId },
  });

  let feedback = `Completed ${completedTasks}/${totalTasks} tasks. `;
  feedback += `Base score: ${taskScore}. `;
  if (hintPenalty > 0) {
    feedback += `Hint penalty: -${hintPenalty} points. `;
  }
  feedback += `Final score: ${finalScore}/${progress.lab.maxScore} (${percentage.toFixed(1)}%)`;

  // Check for existing submission
  const existingSubmission = await prisma.submission.findFirst({
    where: { userId, labId },
    orderBy: { submittedAt: 'desc' },
  });

  let submission;
  if (existingSubmission && finalScore <= existingSubmission.score) {
    // Keep the higher score
    submission = existingSubmission;
    feedback += ' (Previous higher score retained)';
  } else {
    // Create new submission
    submission = await prisma.submission.create({
      data: {
        userId,
        labId,
        submittedAt: new Date(),
        score: finalScore,
        totalTimeSpent: progress.totalTimeSpent,
        configuration: configuration,
        feedback,
        grade,
      },
    });

    // Update progress with max score
    await prisma.labProgress.update({
      where: { id: progress.id },
      data: {
        maxScoreEarned: Math.max(progress.maxScoreEarned, finalScore),
        completedAt: new Date(),
      },
    });
  }

  return {
    success: true,
    submissionId: submission.id,
    finalScore,
    grade,
    feedback,
  };
}

// Get lab progress summary for a user
export async function getUserLabProgress(userId: string) {
  const progress = await prisma.labProgress.findMany({
    where: { userId },
    include: {
      lab: {
        include: {
          tasks: true,
        },
      },
      taskCompletions: true,
    },
  });

  return progress.map((p) => ({
    labId: p.labId,
    labTitle: p.lab.title,
    labNumber: p.lab.number,
    difficulty: p.lab.difficulty,
    totalTasks: p.lab.tasks.length,
    completedTasks: p.taskCompletions.length,
    progressPercentage: Math.round(
      (p.taskCompletions.length / p.lab.tasks.length) * 100
    ),
    currentScore: p.currentScore,
    maxScore: p.lab.maxScore,
    startedAt: p.startedAt,
    completedAt: p.completedAt,
    totalTimeSpent: p.totalTimeSpent,
    status: p.completedAt
      ? 'completed'
      : p.taskCompletions.length > 0
        ? 'in-progress'
        : 'started',
  }));
}
