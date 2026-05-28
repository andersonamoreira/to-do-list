import { describe, it, expect } from 'vitest'
import { registerSchema, loginSchema } from '../../src/schemas/auth.schema'
import { createProjectSchema, updateProjectSchema } from '../../src/schemas/project.schema'
import { createTaskSchema } from '../../src/schemas/task.schema'
import { createLabelSchema } from '../../src/schemas/label.schema'

describe('registerSchema', () => {
  it('valida dados corretos', () => {
    const result = registerSchema.safeParse({
      name: 'João Silva',
      email: 'joao@example.com',
      password: 'senha123',
    })
    expect(result.success).toBe(true)
  })

  it('rejeita senha muito curta', () => {
    const result = registerSchema.safeParse({
      name: 'João',
      email: 'joao@example.com',
      password: '123',
    })
    expect(result.success).toBe(false)
    expect(result.error?.errors[0].message).toContain('6 caracteres')
  })

  it('rejeita email inválido', () => {
    const result = registerSchema.safeParse({
      name: 'João',
      email: 'nao-e-email',
      password: 'senha123',
    })
    expect(result.success).toBe(false)
  })

  it('rejeita nome muito curto', () => {
    const result = registerSchema.safeParse({
      name: 'J',
      email: 'j@example.com',
      password: 'senha123',
    })
    expect(result.success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('valida dados corretos', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com', password: 'pass' })
    expect(result.success).toBe(true)
  })

  it('rejeita sem email', () => {
    const result = loginSchema.safeParse({ password: 'pass' })
    expect(result.success).toBe(false)
  })

  it('rejeita senha vazia', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com', password: '' })
    expect(result.success).toBe(false)
  })
})

describe('createProjectSchema', () => {
  it('valida projeto com nome e descrição', () => {
    const result = createProjectSchema.safeParse({
      name: 'Meu Projeto',
      description: 'Descrição do projeto',
    })
    expect(result.success).toBe(true)
  })

  it('valida projeto sem descrição (campo opcional)', () => {
    const result = createProjectSchema.safeParse({ name: 'Projeto Sem Desc' })
    expect(result.success).toBe(true)
  })

  it('rejeita nome vazio', () => {
    const result = createProjectSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })
})

describe('updateProjectSchema (parcial)', () => {
  it('valida objeto vazio (todos campos opcionais)', () => {
    const result = updateProjectSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('valida atualização parcial', () => {
    const result = updateProjectSchema.safeParse({ name: 'Novo Nome' })
    expect(result.success).toBe(true)
  })
})

describe('createTaskSchema', () => {
  it('valida tarefa completa', () => {
    const result = createTaskSchema.safeParse({
      title: 'Tarefa de teste',
      description: 'Descrição',
      status: 'IN_PROGRESS',
    })
    expect(result.success).toBe(true)
  })

  it('aplica status padrão PENDING', () => {
    const result = createTaskSchema.safeParse({ title: 'Tarefa' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('PENDING')
    }
  })

  it('rejeita status inválido', () => {
    const result = createTaskSchema.safeParse({ title: 'Tarefa', status: 'INVALIDO' })
    expect(result.success).toBe(false)
  })

  it('rejeita título vazio', () => {
    const result = createTaskSchema.safeParse({ title: '' })
    expect(result.success).toBe(false)
  })
})

describe('createLabelSchema', () => {
  it('valida etiqueta com nome e cor', () => {
    const result = createLabelSchema.safeParse({ name: 'Bug', color: '#FF0000' })
    expect(result.success).toBe(true)
  })

  it('aplica cor padrão quando não fornecida', () => {
    const result = createLabelSchema.safeParse({ name: 'Feature' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.color).toBe('#3B82F6')
    }
  })

  it('rejeita cor em formato inválido', () => {
    const result = createLabelSchema.safeParse({ name: 'X', color: 'vermelho' })
    expect(result.success).toBe(false)
  })
})
