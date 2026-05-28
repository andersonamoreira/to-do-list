import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { hashPassword } from '../lib/auth.js'
import { authenticate } from '../middlewares/authenticate.js'
import { authorizeRoles } from '../middlewares/authorize.js'
import { validate } from '../middlewares/validate.js'
import { updateUserSchema } from '../schemas/user.schema.js'

export const usersRouter = Router()

const safeSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const

usersRouter.get('/', authenticate, authorizeRoles('ADMIN'), async (_req, res) => {
  const users = await prisma.user.findMany({ select: safeSelect })
  res.json({ users })
})

usersRouter.get('/:id', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: safeSelect,
  })

  if (!user) {
    res.status(404).json({ error: 'Usuário não encontrado' })
    return
  }

  res.json({ user })
})

usersRouter.put('/:id', authenticate, validate(updateUserSchema), async (req, res) => {
  const isOwner = req.user!.sub === req.params.id
  const isAdmin = req.user!.role === 'ADMIN'

  if (!isOwner && !isAdmin) {
    res.status(403).json({ error: 'Acesso negado: você só pode editar seu próprio perfil' })
    return
  }

  const { name, email, password } = req.body

  const data: Record<string, unknown> = {}
  if (name) data.name = name
  if (email) data.email = email
  if (password) data.password = await hashPassword(password)

  if (email) {
    const existing = await prisma.user.findFirst({
      where: { email, NOT: { id: req.params.id } },
    })
    if (existing) {
      res.status(409).json({ error: 'Email já está em uso' })
      return
    }
  }

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data,
    select: safeSelect,
  })

  res.json({ user })
})

usersRouter.delete('/:id', authenticate, authorizeRoles('ADMIN'), async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } })
  if (!user) {
    res.status(404).json({ error: 'Usuário não encontrado' })
    return
  }

  await prisma.user.delete({ where: { id: req.params.id } })
  res.status(204).send()
})
