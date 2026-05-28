import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authenticate } from '../middlewares/authenticate.js'
import { validate } from '../middlewares/validate.js'
import {
  createProjectSchema,
  updateProjectSchema,
  addCollaboratorSchema,
} from '../schemas/project.schema.js'

export const projectsRouter = Router()

projectsRouter.post('/', authenticate, validate(createProjectSchema), async (req, res) => {
  const { name, description } = req.body
  const project = await prisma.project.create({
    data: { name, description, ownerId: req.user!.sub },
    include: { owner: { select: { id: true, name: true, email: true } } },
  })
  res.status(201).json({ project })
})

projectsRouter.get('/', authenticate, async (req, res) => {
  const userId = req.user!.sub
  const isAdmin = req.user!.role === 'ADMIN'

  const projects = await prisma.project.findMany({
    where: isAdmin
      ? { deletedAt: null }
      : {
          deletedAt: null,
          OR: [
            { ownerId: userId },
            { collaborators: { some: { userId } } },
          ],
        },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { tasks: true, collaborators: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ projects })
})

projectsRouter.get('/:id', authenticate, async (req, res) => {
  const userId = req.user!.sub
  const isAdmin = req.user!.role === 'ADMIN'

  const project = await prisma.project.findFirst({
    where: {
      id: req.params.id,
      deletedAt: null,
      ...(isAdmin
        ? {}
        : {
            OR: [
              { ownerId: userId },
              { collaborators: { some: { userId } } },
            ],
          }),
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      collaborators: { include: { user: { select: { id: true, name: true, email: true } } } },
      tasks: {
        where: { deletedAt: null },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          labels: { include: { label: true } },
        },
      },
    },
  })

  if (!project) {
    res.status(404).json({ error: 'Projeto não encontrado' })
    return
  }

  res.json({ project })
})

projectsRouter.put('/:id', authenticate, validate(updateProjectSchema), async (req, res) => {
  const project = await prisma.project.findFirst({
    where: { id: req.params.id, deletedAt: null },
  })

  if (!project) {
    res.status(404).json({ error: 'Projeto não encontrado' })
    return
  }

  if (project.ownerId !== req.user!.sub && req.user!.role !== 'ADMIN') {
    res.status(403).json({ error: 'Acesso negado: apenas o dono pode editar o projeto' })
    return
  }

  const updated = await prisma.project.update({
    where: { id: req.params.id },
    data: req.body,
    include: { owner: { select: { id: true, name: true, email: true } } },
  })
  res.json({ project: updated })
})

projectsRouter.delete('/:id', authenticate, async (req, res) => {
  const project = await prisma.project.findFirst({
    where: { id: req.params.id, deletedAt: null },
  })

  if (!project) {
    res.status(404).json({ error: 'Projeto não encontrado' })
    return
  }

  if (project.ownerId !== req.user!.sub && req.user!.role !== 'ADMIN') {
    res.status(403).json({ error: 'Acesso negado: apenas o dono pode excluir o projeto' })
    return
  }

  await prisma.project.update({
    where: { id: req.params.id },
    data: { deletedAt: new Date() },
  })
  res.status(204).send()
})

projectsRouter.post(
  '/:id/collaborators',
  authenticate,
  validate(addCollaboratorSchema),
  async (req, res) => {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, deletedAt: null },
    })

    if (!project) {
      res.status(404).json({ error: 'Projeto não encontrado' })
      return
    }

    if (project.ownerId !== req.user!.sub) {
      res.status(403).json({ error: 'Acesso negado: apenas o dono pode adicionar colaboradores' })
      return
    }

    const { userId } = req.body

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' })
      return
    }

    const existing = await prisma.projectCollaborator.findUnique({
      where: { projectId_userId: { projectId: req.params.id, userId } },
    })
    if (existing) {
      res.status(409).json({ error: 'Usuário já é colaborador deste projeto' })
      return
    }

    const collaborator = await prisma.projectCollaborator.create({
      data: { projectId: req.params.id, userId },
      include: { user: { select: { id: true, name: true, email: true } } },
    })
    res.status(201).json({ collaborator })
  }
)

projectsRouter.delete('/:id/collaborators/:userId', authenticate, async (req, res) => {
  const project = await prisma.project.findFirst({
    where: { id: req.params.id, deletedAt: null },
  })

  if (!project) {
    res.status(404).json({ error: 'Projeto não encontrado' })
    return
  }

  if (project.ownerId !== req.user!.sub) {
    res.status(403).json({ error: 'Acesso negado: apenas o dono pode remover colaboradores' })
    return
  }

  const existing = await prisma.projectCollaborator.findUnique({
    where: { projectId_userId: { projectId: req.params.id, userId: req.params.userId } },
  })
  if (!existing) {
    res.status(404).json({ error: 'Colaborador não encontrado' })
    return
  }

  await prisma.projectCollaborator.delete({
    where: { projectId_userId: { projectId: req.params.id, userId: req.params.userId } },
  })
  res.status(204).send()
})
