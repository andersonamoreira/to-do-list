import { apiFetch } from './client'
import type { Project } from '../types'

export const projectsApi = {
  list: () => apiFetch<{ projects: Project[] }>('/projects'),

  get: (id: string) => apiFetch<{ project: Project }>(`/projects/${id}`),

  create: (name: string, description?: string) =>
    apiFetch<{ project: Project }>('/projects', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }),

  update: (id: string, data: { name?: string; description?: string }) =>
    apiFetch<{ project: Project }>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) => apiFetch<null>(`/projects/${id}`, { method: 'DELETE' }),

  addCollaborator: (projectId: string, userId: string) =>
    apiFetch<unknown>(`/projects/${projectId}/collaborators`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  removeCollaborator: (projectId: string, userId: string) =>
    apiFetch<null>(`/projects/${projectId}/collaborators/${userId}`, { method: 'DELETE' }),
}
