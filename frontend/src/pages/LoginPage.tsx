import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, CheckSquare } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-12 text-white">
        <div className="max-w-md text-center">
          <div className="mb-8 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 backdrop-blur-sm">
              <CheckSquare size={40} />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">TaskFlow</h1>
          <p className="text-lg text-violet-200 leading-relaxed">
            Gerencie seus projetos e tarefas de forma simples, visual e colaborativa.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6 text-center">
            {[['🚀', 'Projetos', 'Organize por projeto'], ['✅', 'Tarefas', 'Kanban visual'], ['🏷️', 'Etiquetas', 'Categorize rápido']].map(([icon, title, desc]) => (
              <div key={title} className="rounded-2xl bg-white/10 p-4">
                <div className="text-2xl mb-2">{icon}</div>
                <div className="font-semibold text-sm">{title}</div>
                <div className="text-xs text-violet-300 mt-1">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex lg:hidden justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
              <CheckSquare size={24} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Bem-vindo de volta</h2>
          <p className="mt-1 text-sm text-gray-500">Entre com sua conta para continuar</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com" icon={<Mail size={16} />} required autoFocus />
            <Input label="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" icon={<Lock size={16} />} required />

            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-600">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" loading={loading}>
              Entrar
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Não tem conta?{' '}
            <Link to="/register" className="font-semibold text-violet-600 hover:text-violet-700">
              Criar conta grátis
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
