import { z } from 'zod'

const TASK_STATUSES = ['PENDING', 'IN_PROGRESS', 'DONE'] as const

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(TASK_STATUSES).optional().default('PENDING'),
  dueDate: z.string().datetime({ offset: true }).optional().nullable(),
  assigneeId: z.string().optional().nullable(),
})

export const updateTaskSchema = createTaskSchema
  .omit({ status: true })
  .extend({ status: z.enum(TASK_STATUSES).optional() })
  .partial()

export const addLabelSchema = z.object({
  labelId: z.string().min(1, 'ID da etiqueta é obrigatório'),
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
