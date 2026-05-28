import { prisma } from '../src/lib/prisma'
import { hashPassword, signToken } from '../src/lib/auth'

interface CreateUserOptions {
  name?: string
  email?: string
  password?: string
  role?: string
}

export async function createUser(opts: CreateUserOptions = {}) {
  const {
    name = 'Test User',
    email = 'test@example.com',
    password = 'password123',
    role = 'USER',
  } = opts

  return prisma.user.create({
    data: { name, email, password: await hashPassword(password), role },
  })
}

export async function createAdmin(opts: Omit<CreateUserOptions, 'role'> = {}) {
  return createUser({ ...opts, email: opts.email ?? 'admin@example.com', role: 'ADMIN' })
}

export function tokenFor(user: { id: string; email: string; role: string }) {
  return signToken({ sub: user.id, email: user.email, role: user.role })
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` }
}
