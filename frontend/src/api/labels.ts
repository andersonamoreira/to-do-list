import { apiFetch } from './client'
import type { Label } from '../types'

export const labelsApi = {
  list: () => apiFetch<{ labels: Label[] }>('/labels'),

  create: (name: string, color?: string) =>
    apiFetch<{ label: Label }>('/labels', {
      method: 'POST',
      body: JSON.stringify({ name, color }),
    }),

  delete: (id: string) => apiFetch<null>(`/labels/${id}`, { method: 'DELETE' }),
}
