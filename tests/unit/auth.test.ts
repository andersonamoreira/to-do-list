import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword, signToken, verifyToken } from '../../src/lib/auth'

describe('hashPassword', () => {
  it('retorna hash diferente do texto original', async () => {
    const hash = await hashPassword('minha-senha')
    expect(hash).not.toBe('minha-senha')
  })

  it('gera hashes diferentes para a mesma senha (salt)', async () => {
    const hash1 = await hashPassword('minha-senha')
    const hash2 = await hashPassword('minha-senha')
    expect(hash1).not.toBe(hash2)
  })

  it('hash começa com prefixo bcrypt', async () => {
    const hash = await hashPassword('teste')
    expect(hash).toMatch(/^\$2[aby]\$/)
  })
})

describe('verifyPassword', () => {
  it('retorna true para senha correta', async () => {
    const hash = await hashPassword('correta123')
    const result = await verifyPassword('correta123', hash)
    expect(result).toBe(true)
  })

  it('retorna false para senha incorreta', async () => {
    const hash = await hashPassword('correta123')
    const result = await verifyPassword('errada456', hash)
    expect(result).toBe(false)
  })

  it('retorna false para string vazia', async () => {
    const hash = await hashPassword('senha')
    const result = await verifyPassword('', hash)
    expect(result).toBe(false)
  })
})

describe('signToken', () => {
  it('retorna uma string JWT', () => {
    const token = signToken({ sub: 'user-id', email: 'a@b.com', role: 'USER' })
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)
  })
})

describe('verifyToken', () => {
  it('decodifica o payload corretamente', () => {
    const payload = { sub: 'user-123', email: 'test@test.com', role: 'ADMIN' }
    const token = signToken(payload)
    const decoded = verifyToken(token)
    expect(decoded.sub).toBe(payload.sub)
    expect(decoded.email).toBe(payload.email)
    expect(decoded.role).toBe(payload.role)
  })

  it('lança erro para token inválido', () => {
    expect(() => verifyToken('token.invalido.aqui')).toThrow()
  })

  it('lança erro para token adulterado', () => {
    const token = signToken({ sub: 'id', email: 'e@e.com', role: 'USER' })
    const [header, payload, sig] = token.split('.')
    expect(() => verifyToken(`${header}.${payload}.assinatura-falsa`)).toThrow()
  })
})
