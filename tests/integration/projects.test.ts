import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../../src/app'
import { createUser, tokenFor } from '../helpers'
import { prisma } from '../../src/lib/prisma'

const app = createApp()

async function createProject(ownerId: string, name = 'Meu Projeto') {
  return prisma.project.create({
    data: { name, description: 'Descrição', ownerId },
  })
}

describe('POST /projects', () => {
  it('cria projeto com sucesso', async () => {
    const user = await createUser({ email: 'creator@example.com' })
    const token = tokenFor(user)

    const res = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Novo Projeto', description: 'Descrição do projeto' })

    expect(res.status).toBe(201)
    expect(res.body.project.name).toBe('Novo Projeto')
    expect(res.body.project.owner.id).toBe(user.id)
  })

  it('retorna 422 para nome vazio', async () => {
    const user = await createUser()
    const token = tokenFor(user)

    const res = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '' })

    expect(res.status).toBe(422)
  })

  it('retorna 401 sem autenticação', async () => {
    const res = await request(app).post('/projects').send({ name: 'Projeto' })
    expect(res.status).toBe(401)
  })
})

describe('GET /projects', () => {
  it('lista projetos do usuário (próprios e como colaborador)', async () => {
    const owner = await createUser({ email: 'owner@example.com' })
    const collab = await createUser({ email: 'collab@example.com' })
    const project = await createProject(owner.id, 'Projeto do Owner')

    await prisma.projectCollaborator.create({
      data: { projectId: project.id, userId: collab.id },
    })

    const token = tokenFor(collab)
    const res = await request(app)
      .get('/projects')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.projects.some((p: { id: string }) => p.id === project.id)).toBe(true)
  })
})

describe('GET /projects/:id', () => {
  it('retorna projeto com tarefas e colaboradores', async () => {
    const user = await createUser({ email: 'owner2@example.com' })
    const project = await createProject(user.id, 'Projeto Completo')
    const token = tokenFor(user)

    const res = await request(app)
      .get(`/projects/${project.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.project.id).toBe(project.id)
    expect(res.body.project.tasks).toBeInstanceOf(Array)
    expect(res.body.project.collaborators).toBeInstanceOf(Array)
  })

  it('retorna 403 para usuário sem acesso ao projeto', async () => {
    const owner = await createUser({ email: 'proj-owner@example.com' })
    const stranger = await createUser({ email: 'stranger@example.com' })
    const project = await createProject(owner.id, 'Privado')
    const token = tokenFor(stranger)

    const res = await request(app)
      .get(`/projects/${project.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
  })
})

describe('PUT /projects/:id', () => {
  it('dono pode atualizar o projeto', async () => {
    const owner = await createUser({ email: 'put-owner@example.com' })
    const project = await createProject(owner.id)
    const token = tokenFor(owner)

    const res = await request(app)
      .put(`/projects/${project.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nome Atualizado' })

    expect(res.status).toBe(200)
    expect(res.body.project.name).toBe('Nome Atualizado')
  })

  it('não-dono recebe 403 ao tentar atualizar', async () => {
    const owner = await createUser({ email: 'real-owner@example.com' })
    const other = await createUser({ email: 'not-owner@example.com' })
    const project = await createProject(owner.id)
    const token = tokenFor(other)

    const res = await request(app)
      .put(`/projects/${project.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Tentando Atualizar' })

    expect(res.status).toBe(403)
  })
})

describe('DELETE /projects/:id', () => {
  it('dono pode deletar o projeto (soft delete)', async () => {
    const owner = await createUser({ email: 'del-owner@example.com' })
    const project = await createProject(owner.id)
    const token = tokenFor(owner)

    const res = await request(app)
      .delete(`/projects/${project.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(204)

    const check = await request(app)
      .get(`/projects/${project.id}`)
      .set('Authorization', `Bearer ${token}`)
    expect(check.status).toBe(404)
  })

  it('não-dono recebe 403 ao tentar deletar', async () => {
    const owner = await createUser({ email: 'del-real-owner@example.com' })
    const other = await createUser({ email: 'del-other@example.com' })
    const project = await createProject(owner.id)
    const token = tokenFor(other)

    const res = await request(app)
      .delete(`/projects/${project.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)
  })
})

describe('POST /projects/:id/collaborators', () => {
  it('dono pode adicionar colaborador', async () => {
    const owner = await createUser({ email: 'collab-owner@example.com' })
    const newCollab = await createUser({ email: 'new-collab@example.com' })
    const project = await createProject(owner.id)
    const token = tokenFor(owner)

    const res = await request(app)
      .post(`/projects/${project.id}/collaborators`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: newCollab.id })

    expect(res.status).toBe(201)
    expect(res.body.collaborator.user.id).toBe(newCollab.id)
  })

  it('não-dono recebe 403 ao tentar adicionar colaborador', async () => {
    const owner = await createUser({ email: 'collab-real-owner@example.com' })
    const other = await createUser({ email: 'collab-other@example.com' })
    const third = await createUser({ email: 'collab-third@example.com' })
    const project = await createProject(owner.id)
    const token = tokenFor(other)

    const res = await request(app)
      .post(`/projects/${project.id}/collaborators`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: third.id })

    expect(res.status).toBe(403)
  })
})
