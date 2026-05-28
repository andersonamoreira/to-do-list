import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../../src/app'
import { createUser, createAdmin, tokenFor } from '../helpers'

const app = createApp()

describe('GET /users', () => {
  it('ADMIN pode listar todos os usuários', async () => {
    await createUser({ email: 'u1@example.com' })
    await createUser({ email: 'u2@example.com' })
    const admin = await createAdmin()
    const token = tokenFor(admin)

    const res = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.users).toBeInstanceOf(Array)
    expect(res.body.users.length).toBeGreaterThanOrEqual(2)
    res.body.users.forEach((u: { password?: string }) => {
      expect(u.password).toBeUndefined()
    })
  })

  it('USER recebe 403 ao tentar listar usuários', async () => {
    const user = await createUser({ email: 'user@example.com' })
    const token = tokenFor(user)

    const res = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)
  })

  it('retorna 401 sem autenticação', async () => {
    const res = await request(app).get('/users')
    expect(res.status).toBe(401)
  })
})

describe('GET /users/:id', () => {
  it('usuário autenticado pode buscar por ID', async () => {
    const user = await createUser({ email: 'target@example.com' })
    const requester = await createUser({ email: 'requester@example.com' })
    const token = tokenFor(requester)

    const res = await request(app)
      .get(`/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.user.id).toBe(user.id)
  })

  it('retorna 404 para ID inexistente', async () => {
    const user = await createUser()
    const token = tokenFor(user)

    const res = await request(app)
      .get('/users/id-que-nao-existe')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
  })
})

describe('PUT /users/:id', () => {
  it('usuário pode editar seu próprio perfil', async () => {
    const user = await createUser({ email: 'edit@example.com', name: 'Nome Antigo' })
    const token = tokenFor(user)

    const res = await request(app)
      .put(`/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nome Novo' })

    expect(res.status).toBe(200)
    expect(res.body.user.name).toBe('Nome Novo')
  })

  it('USER não pode editar perfil de outro USER', async () => {
    const owner = await createUser({ email: 'owner@example.com' })
    const other = await createUser({ email: 'other@example.com' })
    const token = tokenFor(other)

    const res = await request(app)
      .put(`/users/${owner.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Tentando Editar' })

    expect(res.status).toBe(403)
  })

  it('ADMIN pode editar qualquer usuário', async () => {
    const user = await createUser({ email: 'to-edit@example.com', name: 'Original' })
    const admin = await createAdmin()
    const token = tokenFor(admin)

    const res = await request(app)
      .put(`/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Editado pelo Admin' })

    expect(res.status).toBe(200)
    expect(res.body.user.name).toBe('Editado pelo Admin')
  })
})

describe('DELETE /users/:id', () => {
  it('ADMIN pode deletar usuário', async () => {
    const user = await createUser({ email: 'to-delete@example.com' })
    const admin = await createAdmin()
    const token = tokenFor(admin)

    const res = await request(app)
      .delete(`/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(204)
  })

  it('USER não pode deletar outros usuários', async () => {
    const target = await createUser({ email: 'target@example.com' })
    const user = await createUser({ email: 'attacker@example.com' })
    const token = tokenFor(user)

    const res = await request(app)
      .delete(`/users/${target.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)
  })
})
