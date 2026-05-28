import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../../src/app'
import { createUser, tokenFor } from '../helpers'

const app = createApp()

describe('POST /auth/register', () => {
  it('cria conta com sucesso e retorna token', async () => {
    const res = await request(app).post('/auth/register').send({
      name: 'Maria Silva',
      email: 'maria@example.com',
      password: 'senha123',
    })

    expect(res.status).toBe(201)
    expect(res.body.user.email).toBe('maria@example.com')
    expect(res.body.user.role).toBe('USER')
    expect(res.body.token).toBeDefined()
    expect(res.body.user.password).toBeUndefined()
  })

  it('retorna 409 para email já cadastrado', async () => {
    await createUser({ email: 'existente@example.com' })

    const res = await request(app).post('/auth/register').send({
      name: 'Outro',
      email: 'existente@example.com',
      password: 'senha123',
    })

    expect(res.status).toBe(409)
    expect(res.body.error).toBeDefined()
  })

  it('retorna 422 para senha muito curta', async () => {
    const res = await request(app).post('/auth/register').send({
      name: 'João',
      email: 'joao@example.com',
      password: '123',
    })

    expect(res.status).toBe(422)
    expect(res.body.error).toBe('Dados inválidos')
  })

  it('retorna 422 para email inválido', async () => {
    const res = await request(app).post('/auth/register').send({
      name: 'João',
      email: 'nao-e-email',
      password: 'senha123',
    })

    expect(res.status).toBe(422)
  })
})

describe('POST /auth/login', () => {
  it('autentica com credenciais válidas e retorna token', async () => {
    await createUser({ email: 'login@example.com', password: 'minha-senha' })

    const res = await request(app).post('/auth/login').send({
      email: 'login@example.com',
      password: 'minha-senha',
    })

    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.password).toBeUndefined()
  })

  it('retorna 401 para senha incorreta', async () => {
    await createUser({ email: 'user@example.com', password: 'correta' })

    const res = await request(app).post('/auth/login').send({
      email: 'user@example.com',
      password: 'errada',
    })

    expect(res.status).toBe(401)
  })

  it('retorna 401 para email não cadastrado', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'naoexiste@example.com',
      password: 'qualquer',
    })

    expect(res.status).toBe(401)
  })
})

describe('GET /auth/me', () => {
  it('retorna dados do usuário autenticado', async () => {
    const user = await createUser({ email: 'me@example.com' })
    const token = tokenFor(user)

    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe('me@example.com')
    expect(res.body.user.password).toBeUndefined()
  })

  it('retorna 401 quando não há token', async () => {
    const res = await request(app).get('/auth/me')
    expect(res.status).toBe(401)
  })

  it('retorna 401 para token inválido', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', 'Bearer token.invalido.aqui')

    expect(res.status).toBe(401)
  })
})
