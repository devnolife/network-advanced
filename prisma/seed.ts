import 'dotenv/config'
import { PrismaClient, UserRole } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import labsData from '../src/data/labs.json'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

// Type for lab JSON data
interface LabJSON {
  id: string
  number: number
  title: string
  description: string
  objectives: string[]
  difficulty: string
  durationMinutes: number
  maxScore: number
  isLocked?: boolean
  prerequisite?: string | null
  topology: object
  tasks: Array<{
    id: string
    title: string
    description: string
    points: number
    order: number
    validation: object
  }>
  hints: Array<{
    id: string
    taskId: string
    content: string
    pointCost: number
    order: number
  }>
}

// Map difficulty string to enum value
function mapDifficulty(difficulty: string): 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' {
  const upper = difficulty.toUpperCase()
  if (upper === 'BEGINNER' || upper === 'INTERMEDIATE' || upper === 'ADVANCED') {
    return upper as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  }
  return 'BEGINNER'
}

async function seedUsers() {
  console.log('👤 Seeding users...')

  // Create Admin User
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      name: 'Administrator',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
    },
  })
  console.log('  ✅ Admin created:', admin.username)

  // Create Instructor User
  const instructorPassword = await bcrypt.hash('instructor123', 12)
  const instructor = await prisma.user.upsert({
    where: { username: 'instructor' },
    update: {},
    create: {
      username: 'instructor',
      name: 'Dr. Cyber Instructor',
      passwordHash: instructorPassword,
      role: UserRole.INSTRUCTOR,
    },
  })
  console.log('  ✅ Instructor created:', instructor.username)

  // Create Student Users
  const studentPassword = await bcrypt.hash('student123', 12)
  const students = [
    { username: 'ahmad', name: 'Ahmad Mahasiswa' },
    { username: 'budi', name: 'Budi Pelajar' },
    { username: 'citra', name: 'Citra Siswa' },
  ]

  for (const student of students) {
    const created = await prisma.user.upsert({
      where: { username: student.username },
      update: {},
      create: {
        username: student.username,
        name: student.name,
        passwordHash: studentPassword,
        role: UserRole.STUDENT,
      },
    })
    console.log('  ✅ Student created:', created.username)
  }
}

async function seedLabs() {
  console.log('🧪 Seeding labs...')

  // First pass: create all labs without prerequisites
  for (const labData of labsData as LabJSON[]) {
    console.log(`  📦 Processing lab: ${labData.title}`)

    // First, check if lab exists and delete related entities
    const existingLab = await prisma.lab.findUnique({ where: { id: labData.id } })
    if (existingLab) {
      await prisma.labHint.deleteMany({ where: { labId: labData.id } })
      await prisma.labTask.deleteMany({ where: { labId: labData.id } })
      await prisma.topology.deleteMany({ where: { labId: labData.id } })
      await prisma.lab.delete({ where: { id: labData.id } })
    }

    // Create lab without topology and prerequisite first
    const lab = await prisma.lab.create({
      data: {
        id: labData.id,
        number: labData.number,
        title: labData.title,
        description: labData.description,
        objectives: labData.objectives,
        difficulty: mapDifficulty(labData.difficulty),
        durationMinutes: labData.durationMinutes,
        maxScore: labData.maxScore,
        isActive: true,
        isLocked: labData.isLocked ?? false,
        order: labData.number,
      },
    })
    console.log(`    ✅ Lab created: ${lab.id}`)

    // Create topology separately
    const topology = labData.topology as { devices: object[], links: object[] }
    await prisma.topology.create({
      data: {
        labId: lab.id,
        devices: topology.devices,
        links: topology.links,
      },
    })
    console.log(`    ✅ Topology created`)

    // Create tasks
    for (const taskData of labData.tasks) {
      await prisma.labTask.create({
        data: {
          id: taskData.id,
          labId: lab.id,
          title: taskData.title,
          description: taskData.description,
          points: taskData.points,
          order: taskData.order,
          validation: taskData.validation as object,
        },
      })
    }
    console.log(`    ✅ Created ${labData.tasks.length} tasks`)

    // Create hints
    for (const hintData of labData.hints) {
      await prisma.labHint.create({
        data: {
          id: hintData.id,
          labId: lab.id,
          taskId: hintData.taskId,
          content: hintData.content,
          pointCost: hintData.pointCost,
          order: hintData.order,
        },
      })
    }
    console.log(`    ✅ Created ${labData.hints.length} hints`)
  }

  // Second pass: update prerequisites
  console.log('\n  🔗 Setting up prerequisites...')
  for (const labData of labsData as LabJSON[]) {
    if (labData.prerequisite) {
      await prisma.lab.update({
        where: { id: labData.id },
        data: { prerequisiteId: labData.prerequisite },
      })
      console.log(`    ✅ ${labData.id} requires ${labData.prerequisite}`)
    }
  }
}

async function main() {
  console.log('🌱 Starting database seed...\n')

  await seedUsers()
  console.log('')
  await seedLabs()

  console.log('\n🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
