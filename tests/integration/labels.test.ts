import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../../src/app'
import { createUser, tokenFor } from '../helpers'
import { prisma } from '../../src/lib/prisma'

const app = createApp()

async function createLabel(name = 'Teste', color = '#FF0000') {
  return prisma.label.create({ data: { name, color } })
}

describe('POST /labels', () => {
  it('ADMIN cria etiqueta com sucesso', async () => {
    const admin = await createUser({ email: 'label-create@example.com', role: 'ADMIN' })
    const token = tokenFor(admin)

    const res = await request(app)
      .post('/labels')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nova Etiqueta', color: '#FF5733' })

    expect(res.status).toBe(201)
    expect(res.body.label.name).toBe('Nova Etiqueta')
    expect(res.body.label.color).toBe('#FF5733')
  })

  it('retorna 409 para nome de etiqueta duplicado', async () => {
    await createLabel('Duplicada')
    const admin = await createUser({ email: 'label-dup@example.com', role: 'ADMIN' })
    const token = tokenFor(admin)

    const res = await request(app)
      .post('/labels')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Duplicada' })

    expect(res.status).toBe(409)
  })

  it('retorna 422 para cor em formato inválido', async () => {
    const admin = await createUser({ email: 'label-invalid@example.com', role: 'ADMIN' })
    const token = tokenFor(admin)

    const res = await request(app)
      .post('/labels')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'X', color: 'vermelho' })

    expect(res.status).toBe(422)
  })

  it('USER recebe 403', async () => {
    const user = await createUser({ email: 'label-forbidden@example.com' })
    const token = tokenFor(user)

    const res = await request(app)
      .post('/labels')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Tentativa' })

    expect(res.status).toBe(403)
  })
})

describe('GET /labels', () => {
  it('lista todas as etiquetas para usuário autenticado', async () => {
    await createLabel('Label A')
    await createLabel('Label B')
    const user = await createUser({ email: 'label-list@example.com' })
    const token = tokenFor(user)

    const res = await request(app).get('/labels').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.labels).toBeInstanceOf(Array)
    expect(res.body.labels.length).toBeGreaterThanOrEqual(2)
  })

  it('retorna 401 sem autenticação', async () => {
    const res = await request(app).get('/labels')
    expect(res.status).toBe(401)
  })
})

describe('GET /labels/:id', () => {
  it('retorna etiqueta por ID com tarefas relacionadas', async () => {
    const label = await createLabel('By ID')
    const user = await createUser({ email: 'label-get@example.com' })
    const token = tokenFor(user)

    const res = await request(app)
      .get(`/labels/${label.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.label.id).toBe(label.id)
    expect(res.body.label.tasks).toBeInstanceOf(Array)
  })

  it('retorna 404 para ID inexistente', async () => {
    const user = await createUser({ email: 'label-404@example.com' })
    const token = tokenFor(user)

    const res = await request(app)
      .get('/labels/id-invalido')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
  })
})

describe('PUT /labels/:id', () => {
  it('ADMIN atualiza etiqueta', async () => {
    const label = await createLabel('Antiga')
    const admin = await createUser({ email: 'label-put@example.com', role: 'ADMIN' })
    const token = tokenFor(admin)

    const res = await request(app)
      .put(`/labels/${label.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Atualizada', color: '#00FF00' })

    expect(res.status).toBe(200)
    expect(res.body.label.name).toBe('Atualizada')
  })

  it('retorna 404 para etiqueta inexistente', async () => {
    const admin = await createUser({ email: 'label-put-404@example.com', role: 'ADMIN' })
    const token = tokenFor(admin)

    const res = await request(app)
      .put('/labels/nao-existe')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nova' })

    expect(res.status).toBe(404)
  })

  it('USER recebe 403', async () => {
    const label = await createLabel('Alvo')
    const user = await createUser({ email: 'label-put-user@example.com' })
    const token = tokenFor(user)

    const res = await request(app)
      .put(`/labels/${label.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Tentativa' })

    expect(res.status).toBe(403)
  })
})

describe('DELETE /labels/:id', () => {
  it('ADMIN deleta etiqueta', async () => {
    const label = await createLabel('Para Deletar')
    const admin = await createUser({ email: 'label-del@example.com', role: 'ADMIN' })
    const token = tokenFor(admin)

    const res = await request(app)
      .delete(`/labels/${label.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(204)
  })

  it('retorna 404 para etiqueta inexistente', async () => {
    const admin = await createUser({ email: 'label-del-404@example.com', role: 'ADMIN' })
    const token = tokenFor(admin)

    const res = await request(app)
      .delete('/labels/nao-existe')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
  })

  it('USER recebe 403', async () => {
    const label = await createLabel('Protegida')
    const user = await createUser({ email: 'label-del-user@example.com' })
    const token = tokenFor(user)

    const res = await request(app)
      .delete(`/labels/${label.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)
  })
})
