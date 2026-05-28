import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authenticate } from '../middlewares/authenticate.js'
import { validate } from '../middlewares/validate.js'
import { createTaskSchema, updateTaskSchema, addLabelSchema } from '../schemas/task.schema.js'

export const tasksRouter = Router()

async function isProjectMember(projectId: string, userId: string): Promise<boolean> {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      deletedAt: null,
      OR: [{ ownerId: userId }, { collaborators: { some: { userId } } }],
    },
  })
  return !!project
}

tasksRouter.post(
  '/projects/:projectId/tasks',
  authenticate,
  validate(createTaskSchema),
  async (req, res) => {
    const { projectId } = req.params
    const userId = req.user!.sub

    const project = await prisma.project.findFirst({ where: { id: projectId, deletedAt: null } })
    if (!project) {
      res.status(404).json({ error: 'Projeto não encontrado' })
      return
    }

    const isMember = req.user!.role === 'ADMIN' || (await isProjectMember(projectId, userId))
    if (!isMember) {
      res.status(403).json({ error: 'Acesso negado: você não é membro deste projeto' })
      return
    }

    const { title, description, status, dueDate, assigneeId } = req.body
    const task = await prisma.task.create({
      data: {
        title,
        description,
        status,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId: assigneeId ?? null,
        createdById: userId,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        labels: { include: { label: true } },
      },
    })
    res.status(201).json({ task })
  }
)

tasksRouter.get('/projects/:projectId/tasks', authenticate, async (req, res) => {
  const { projectId } = req.params
  const userId = req.user!.sub

  const project = await prisma.project.findFirst({ where: { id: projectId, deletedAt: null } })
  if (!project) {
    res.status(404).json({ error: 'Projeto não encontrado' })
    return
  }

  const isMember = req.user!.role === 'ADMIN' || (await isProjectMember(projectId, userId))
  if (!isMember) {
    res.status(403).json({ error: 'Acesso negado: você não é membro deste projeto' })
    return
  }

  const { status } = req.query
  const tasks = await prisma.task.findMany({
    where: {
      projectId,
      deletedAt: null,
      ...(status ? { status: String(status) } : {}),
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      labels: { include: { label: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ tasks })
})

tasksRouter.get('/tasks/:id', authenticate, async (req, res) => {
  const task = await prisma.task.findFirst({
    where: { id: req.params.id, deletedAt: null },
    include: {
      project: { select: { id: true, name: true, ownerId: true } },
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      labels: { include: { label: true } },
    },
  })

  if (!task) {
    res.status(404).json({ error: 'Tarefa não encontrada' })
    return
  }

  const userId = req.user!.sub
  const isMember = req.user!.role === 'ADMIN' || (await isProjectMember(task.projectId, userId))
  if (!isMember) {
    res.status(403).json({ error: 'Acesso negado' })
    return
  }

  res.json({ task })
})

tasksRouter.put('/tasks/:id', authenticate, validate(updateTaskSchema), async (req, res) => {
  const task = await prisma.task.findFirst({
    where: { id: req.params.id, deletedAt: null },
    include: { project: true },
  })

  if (!task) {
    res.status(404).json({ error: 'Tarefa não encontrada' })
    return
  }

  const userId = req.user!.sub
  const isAdmin = req.user!.role === 'ADMIN'
  const isCreator = task.createdById === userId
  const isProjectOwner = task.project.ownerId === userId

  if (!isAdmin && !isCreator && !isProjectOwner) {
    res.status(403).json({ error: 'Acesso negado: apenas o criador ou dono do projeto pode editar' })
    return
  }

  const { title, description, status, dueDate, assigneeId } = req.body
  const data: Record<string, unknown> = {}
  if (title !== undefined) data.title = title
  if (description !== undefined) data.description = description
  if (status !== undefined) data.status = status
  if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null
  if (assigneeId !== undefined) data.assigneeId = assigneeId

  const updated = await prisma.task.update({
    where: { id: req.params.id },
    data,
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      labels: { include: { label: true } },
    },
  })
  res.json({ task: updated })
})

tasksRouter.delete('/tasks/:id', authenticate, async (req, res) => {
  const task = await prisma.task.findFirst({
    where: { id: req.params.id, deletedAt: null },
    include: { project: true },
  })

  if (!task) {
    res.status(404).json({ error: 'Tarefa não encontrada' })
    return
  }

  const userId = req.user!.sub
  const isAdmin = req.user!.role === 'ADMIN'
  const isCreator = task.createdById === userId
  const isProjectOwner = task.project.ownerId === userId

  if (!isAdmin && !isCreator && !isProjectOwner) {
    res.status(403).json({ error: 'Acesso negado: apenas o criador ou dono do projeto pode excluir' })
    return
  }

  await prisma.task.update({
    where: { id: req.params.id },
    data: { deletedAt: new Date() },
  })
  res.status(204).send()
})

tasksRouter.post('/tasks/:id/labels', authenticate, validate(addLabelSchema), async (req, res) => {
  const task = await prisma.task.findFirst({
    where: { id: req.params.id, deletedAt: null },
  })

  if (!task) {
    res.status(404).json({ error: 'Tarefa não encontrada' })
    return
  }

  const userId = req.user!.sub
  const isMember = req.user!.role === 'ADMIN' || (await isProjectMember(task.projectId, userId))
  if (!isMember) {
    res.status(403).json({ error: 'Acesso negado' })
    return
  }

  const { labelId } = req.body

  const label = await prisma.label.findUnique({ where: { id: labelId } })
  if (!label) {
    res.status(404).json({ error: 'Etiqueta não encontrada' })
    return
  }

  const existing = await prisma.taskLabel.findUnique({
    where: { taskId_labelId: { taskId: req.params.id, labelId } },
  })
  if (existing) {
    res.status(409).json({ error: 'Etiqueta já adicionada a esta tarefa' })
    return
  }

  await prisma.taskLabel.create({ data: { taskId: req.params.id, labelId } })
  res.status(201).json({ message: 'Etiqueta adicionada com sucesso' })
})

tasksRouter.delete('/tasks/:id/labels/:labelId', authenticate, async (req, res) => {
  const task = await prisma.task.findFirst({
    where: { id: req.params.id, deletedAt: null },
  })

  if (!task) {
    res.status(404).json({ error: 'Tarefa não encontrada' })
    return
  }

  const userId = req.user!.sub
  const isMember = req.user!.role === 'ADMIN' || (await isProjectMember(task.projectId, userId))
  if (!isMember) {
    res.status(403).json({ error: 'Acesso negado' })
    return
  }

  const existing = await prisma.taskLabel.findUnique({
    where: { taskId_labelId: { taskId: req.params.id, labelId: req.params.labelId } },
  })
  if (!existing) {
    res.status(404).json({ error: 'Etiqueta não encontrada nesta tarefa' })
    return
  }

  await prisma.taskLabel.delete({
    where: { taskId_labelId: { taskId: req.params.id, labelId: req.params.labelId } },
  })
  res.status(204).send()
})
