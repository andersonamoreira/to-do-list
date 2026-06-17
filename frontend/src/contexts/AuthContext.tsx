import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { authApi } from '../api/auth'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    if (!token) { setLoading(false); return }
    authApi.me()
      .then(({ user }) => setUser(user))
      .catch(() => logout())
      .finally(() => setLoading(false))
  }, [token, logout])

  const login = async (email: string, password: string) => {
    const { user, token } = await authApi.login(email, password)
    localStorage.setItem('token', token)
    setToken(token)
    setUser(user)
  }

  const register = async (name: string, email: string, password: string) => {
    const { user, token } = await authApi.register(name, email, password)
    localStorage.setItem('token', token)
    setToken(token)
    setUser(user)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
