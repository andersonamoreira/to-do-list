import { apiFetch } from './client'
import type { Task } from '../types'

interface TaskPayload {
  title?: string
  description?: string
  status?: 'PENDING' | 'IN_PROGRESS' | 'DONE'
  dueDate?: string | null
  assigneeId?: string | null
}

export const tasksApi = {
  list: (projectId: string, status?: string) => {
    const qs = status ? `?status=${status}` : ''
    return apiFetch<{ tasks: Task[] }>(`/projects/${projectId}/tasks${qs}`)
  },

  get: (id: string) => apiFetch<{ task: Task }>(`/tasks/${id}`),

  create: (projectId: string, data: TaskPayload) =>
    apiFetch<{ task: Task }>(`/projects/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: TaskPayload) =>
    apiFetch<{ task: Task }>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) => apiFetch<null>(`/tasks/${id}`, { method: 'DELETE' }),

  addLabel: (taskId: string, labelId: string) =>
    apiFetch<unknown>(`/tasks/${taskId}/labels`, {
      method: 'POST',
      body: JSON.stringify({ labelId }),
    }),

  removeLabel: (taskId: string, labelId: string) =>
    apiFetch<null>(`/tasks/${taskId}/labels/${labelId}`, { method: 'DELETE' }),

  today: (date?: string) => {
    const d = date ?? new Date().toLocaleDateString('en-CA')
    return apiFetch<{ tasks: Task[] }>(`/tasks/today?date=${d}`)
  },
}
