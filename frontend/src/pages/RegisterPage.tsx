import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres'); return }
    setLoading(true); setError('')
    try {
      await register(name, email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-200">
              <User size={28} className="text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Crie sua conta</h2>
          <p className="mt-1 text-sm text-gray-500">Comece a gerenciar seus projetos hoje</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-xl shadow-gray-100 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Nome completo" type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="João Silva" icon={<User size={16} />} required autoFocus />
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com" icon={<Mail size={16} />} required />
            <Input label="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres" icon={<Lock size={16} />} required />

            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-600">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full mt-2" loading={loading}>
              Criar conta
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Já tem conta?{' '}
          <Link to="/login" className="font-semibold text-violet-600 hover:text-violet-700">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  )
}
