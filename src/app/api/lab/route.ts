import { NextRequest, NextResponse } from 'next/server';
import labsData from '@/data/labs.json';

interface LabTask {
    id: string;
    title: string;
    description: string;
    points: number;
    order: number;
    validation: Record<string, unknown>;
}

interface LabHint {
    id: string;
    taskId: string;
    content: string;
    pointCost: number;
    order: number;
}

interface Lab {
    id: string;
    number: number;
    title: string;
    description: string;
    objectives: string[];
    difficulty: string;
    durationMinutes: number;
    maxScore: number;
    topology: Record<string, unknown>;
    tasks: LabTask[];
    hints: LabHint[];
}

// GET /api/lab - List all labs
// GET /api/lab?id=lab-1 - Get specific lab
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const number = searchParams.get('number');

    const labs = labsData as Lab[];

    if (id) {
        const lab = labs.find(l => l.id === id);
        if (!lab) {
            return NextResponse.json(
                { error: 'Lab not found' },
                { status: 404 }
            );
        }
        return NextResponse.json(lab);
    }

    if (number) {
        const labNum = parseInt(number);
        const lab = labs.find(l => l.number === labNum);
        if (!lab) {
            return NextResponse.json(
                { error: 'Lab not found' },
                { status: 404 }
            );
        }
        return NextResponse.json(lab);
    }

    // Return summary list of all labs
    const labSummaries = labs.map(lab => ({
        id: lab.id,
        number: lab.number,
        title: lab.title,
        description: lab.description,
        difficulty: lab.difficulty,
        durationMinutes: lab.durationMinutes,
        maxScore: lab.maxScore,
        taskCount: lab.tasks.length,
    }));

    return NextResponse.json(labSummaries);
}
