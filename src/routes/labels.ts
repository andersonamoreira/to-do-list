import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authenticate } from '../middlewares/authenticate.js'
import { authorizeRoles } from '../middlewares/authorize.js'
import { validate } from '../middlewares/validate.js'
import { createLabelSchema, updateLabelSchema } from '../schemas/label.schema.js'

export const labelsRouter = Router()

labelsRouter.post(
  '/',
  authenticate,
  authorizeRoles('ADMIN'),
  validate(createLabelSchema),
  async (req, res) => {
    const { name, color } = req.body

    const existing = await prisma.label.findUnique({ where: { name } })
    if (existing) {
      res.status(409).json({ error: 'Etiqueta com este nome já existe' })
      return
    }

    const label = await prisma.label.create({ data: { name, color } })
    res.status(201).json({ label })
  }
)

labelsRouter.get('/', authenticate, async (_req, res) => {
  const labels = await prisma.label.findMany({ orderBy: { name: 'asc' } })
  res.json({ labels })
})

labelsRouter.get('/:id', authenticate, async (req, res) => {
  const label = await prisma.label.findUnique({
    where: { id: req.params.id },
    include: { tasks: { include: { task: { select: { id: true, title: true, status: true } } } } },
  })

  if (!label) {
    res.status(404).json({ error: 'Etiqueta não encontrada' })
    return
  }

  res.json({ label })
})

labelsRouter.put(
  '/:id',
  authenticate,
  authorizeRoles('ADMIN'),
  validate(updateLabelSchema),
  async (req, res) => {
    const label = await prisma.label.findUnique({ where: { id: req.params.id } })
    if (!label) {
      res.status(404).json({ error: 'Etiqueta não encontrada' })
      return
    }

    if (req.body.name && req.body.name !== label.name) {
      const existing = await prisma.label.findUnique({ where: { name: req.body.name } })
      if (existing) {
        res.status(409).json({ error: 'Etiqueta com este nome já existe' })
        return
      }
    }

    const updated = await prisma.label.update({
      where: { id: req.params.id },
      data: req.body,
    })
    res.json({ label: updated })
  }
)

labelsRouter.delete('/:id', authenticate, authorizeRoles('ADMIN'), async (req, res) => {
  const label = await prisma.label.findUnique({ where: { id: req.params.id } })
  if (!label) {
    res.status(404).json({ error: 'Etiqueta não encontrada' })
    return
  }

  await prisma.label.delete({ where: { id: req.params.id } })
  res.status(204).send()
})
