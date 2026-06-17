const BASE_URL = '/api'

function getToken(): string | null {
  return localStorage.getItem('token')
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (response.status === 204) return null as T

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error ?? `Erro HTTP ${response.status}`)
  }

  return data as T
}
