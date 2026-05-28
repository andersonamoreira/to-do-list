import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../../src/app'
import { createUser, tokenFor } from '../helpers'
import { prisma } from '../../src/lib/prisma'

const app = createApp()

async function setupProject(ownerId: string) {
  return prisma.project.create({
    data: { name: 'Projeto Teste', ownerId },
  })
}

describe('POST /projects/:projectId/tasks', () => {
  it('membro do projeto cria tarefa com sucesso', async () => {
    const owner = await createUser({ email: 'task-owner@example.com' })
    const project = await setupProject(owner.id)
    const token = tokenFor(owner)

    const res = await request(app)
      .post(`/projects/${project.id}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Minha Tarefa', description: 'Descrição', status: 'PENDING' })

    expect(res.status).toBe(201)
    expect(res.body.task.title).toBe('Minha Tarefa')
    expect(res.body.task.status).toBe('PENDING')
    expect(res.body.task.createdBy.id).toBe(owner.id)
  })

  it('retorna 403 para usuário sem acesso ao projeto', async () => {
    const owner = await createUser({ email: 'task-proj-owner@example.com' })
    const stranger = await createUser({ email: 'task-stranger@example.com' })
    const project = await setupProject(owner.id)
    const token = tokenFor(stranger)

    const res = await request(app)
      .post(`/projects/${project.id}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Invasão' })

    expect(res.status).toBe(403)
  })

  it('retorna 422 para título vazio', async () => {
    const owner = await createUser({ email: 'task-empty@example.com' })
    const project = await setupProject(owner.id)
    const token = tokenFor(owner)

    const res = await request(app)
      .post(`/projects/${project.id}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '' })

    expect(res.status).toBe(422)
  })
})

describe('GET /projects/:projectId/tasks', () => {
  it('lista tarefas do projeto', async () => {
    const owner = await createUser({ email: 'task-list@example.com' })
    const project = await setupProject(owner.id)
    const token = tokenFor(owner)

    await prisma.task.createMany({
      data: [
        { title: 'Tarefa 1', projectId: project.id, createdById: owner.id },
        { title: 'Tarefa 2', projectId: project.id, createdById: owner.id },
      ],
    })

    const res = await request(app)
      .get(`/projects/${project.id}/tasks`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.tasks).toHaveLength(2)
  })
})

describe('GET /tasks/:id', () => {
  it('retorna tarefa com labels e assignee', async () => {
    const owner = await createUser({ email: 'task-get@example.com' })
    const project = await setupProject(owner.id)
    const task = await prisma.task.create({
      data: { title: 'Get Test', projectId: project.id, createdById: owner.id },
    })
    const token = tokenFor(owner)

    const res = await request(app)
      .get(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.task.id).toBe(task.id)
    expect(res.body.task.labels).toBeInstanceOf(Array)
  })

  it('retorna 404 para tarefa inexistente', async () => {
    const user = await createUser({ email: 'task-404@example.com' })
    const token = tokenFor(user)

    const res = await request(app)
      .get('/tasks/id-inexistente')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
  })
})

describe('PUT /tasks/:id', () => {
  it('criador pode atualizar a tarefa', async () => {
    const owner = await createUser({ email: 'task-put@example.com' })
    const project = await setupProject(owner.id)
    const task = await prisma.task.create({
      data: { title: 'Original', projectId: project.id, createdById: owner.id },
    })
    const token = tokenFor(owner)

    const res = await request(app)
      .put(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Atualizado', status: 'IN_PROGRESS' })

    expect(res.status).toBe(200)
    expect(res.body.task.title).toBe('Atualizado')
    expect(res.body.task.status).toBe('IN_PROGRESS')
  })

  it('não-criador recebe 403 ao tentar atualizar', async () => {
    const owner = await createUser({ email: 'task-put-owner@example.com' })
    const other = await createUser({ email: 'task-put-other@example.com' })
    const project = await setupProject(owner.id)
    const task = await prisma.task.create({
      data: { title: 'Tarefa Alheia', projectId: project.id, createdById: owner.id },
    })
    const token = tokenFor(other)

    const res = await request(app)
      .put(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Tentativa' })

    expect(res.status).toBe(403)
  })
})

describe('DELETE /tasks/:id', () => {
  it('criador pode deletar a tarefa (soft delete)', async () => {
    const owner = await createUser({ email: 'task-del@example.com' })
    const project = await setupProject(owner.id)
    const task = await prisma.task.create({
      data: { title: 'Para Deletar', projectId: project.id, createdById: owner.id },
    })
    const token = tokenFor(owner)

    const res = await request(app)
      .delete(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(204)

    const check = await request(app)
      .get(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${token}`)
    expect(check.status).toBe(404)
  })
})

describe('POST /labels e GET /labels (ADMIN)', () => {
  it('ADMIN cria etiqueta com sucesso', async () => {
    const admin = await createUser({ email: 'label-admin@example.com', role: 'ADMIN' })
    const token = tokenFor(admin)

    const res = await request(app)
      .post('/labels')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Urgente', color: '#FF0000' })

    expect(res.status).toBe(201)
    expect(res.body.label.name).toBe('Urgente')
  })

  it('USER recebe 403 ao tentar criar etiqueta', async () => {
    const user = await createUser({ email: 'label-user@example.com' })
    const token = tokenFor(user)

    const res = await request(app)
      .post('/labels')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Tentativa' })

    expect(res.status).toBe(403)
  })

  it('usuário autenticado pode listar etiquetas', async () => {
    const admin = await createUser({ email: 'label-list-admin@example.com', role: 'ADMIN' })
    const adminToken = tokenFor(admin)
    await request(app)
      .post('/labels')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'ListTest' })

    const user = await createUser({ email: 'label-list-user@example.com' })
    const token = tokenFor(user)

    const res = await request(app).get('/labels').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.labels).toBeInstanceOf(Array)
  })
})
