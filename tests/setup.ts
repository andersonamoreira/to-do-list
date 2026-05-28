import { afterEach, afterAll } from 'vitest'
import { prisma } from '../src/lib/prisma'

afterEach(async () => {
  await prisma.taskLabel.deleteMany()
  await prisma.task.deleteMany()
  await prisma.projectCollaborator.deleteMany()
  await prisma.project.deleteMany()
  await prisma.label.deleteMany()
  await prisma.user.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})
