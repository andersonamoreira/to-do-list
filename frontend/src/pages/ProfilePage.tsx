import { useState } from 'react'
import { User, Mail, Lock, Shield } from 'lucide-react'
import { apiFetch } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function ProfilePage() {
  const { user, logout } = useAuth()
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError(''); setSuccess('')
    try {
      const body: Record<string, string> = {}
      if (name !== user?.name) body.name = name
      if (email !== user?.email) body.email = email
      if (password) body.password = password

      if (Object.keys(body).length === 0) { setSaving(false); return }

      await apiFetch(`/users/${user?.id}`, { method: 'PUT', body: JSON.stringify(body) })
      setSuccess('Perfil atualizado! Faça login novamente se mudou o email ou senha.')
      setPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar perfil')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="mt-1 text-gray-500">Gerencie suas informações pessoais</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Avatar card */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 text-center">
            <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 text-3xl font-bold text-white shadow-lg shadow-violet-200 mb-4">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{user?.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-violet-100 text-violet-700">
              <Shield size={12} />
              {user?.role === 'ADMIN' ? 'Administrador' : 'Usuário'}
            </div>
            <div className="mt-4 text-xs text-gray-400">
              Conta criada em {user ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '—'}
            </div>
          </div>
        </div>

        {/* Edit form */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-6">Editar informações</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nome"
                value={name}
                onChange={e => setName(e.target.value)}
                icon={<User size={16} />}
              />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                icon={<Mail size={16} />}
              />
              <Input
                label="Nova senha"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Deixe em branco para não alterar"
                icon={<Lock size={16} />}
              />

              {success && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
                  {success}
                </div>
              )}
              {error && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-600">
                  {error}
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <Button type="submit" loading={saving}>Salvar alterações</Button>
                <Button type="button" variant="ghost" onClick={logout} className="text-rose-500 hover:bg-rose-50 hover:text-rose-600">
                  Sair da conta
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
