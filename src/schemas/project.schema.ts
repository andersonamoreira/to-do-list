import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(200),
  description: z.string().max(1000).optional(),
})

export const updateProjectSchema = createProjectSchema.partial()

export const addCollaboratorSchema = z.object({
  userId: z.string().min(1, 'ID do usuário é obrigatório'),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
