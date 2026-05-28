import { z } from 'zod'

export const createLabelSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(50),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve estar no formato hexadecimal (#RRGGBB)')
    .optional()
    .default('#3B82F6'),
})

export const updateLabelSchema = createLabelSchema.partial()

export type CreateLabelInput = z.infer<typeof createLabelSchema>
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>
