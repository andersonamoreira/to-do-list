import { useState, useEffect } from 'react'
import { Plus, FolderOpen, Search } from 'lucide-react'
import { projectsApi } from '../api/projects'
import { useAuth } from '../contexts/AuthContext'
import { ProjectCard } from '../components/ProjectCard'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import type { Project } from '../types'

export function DashboardPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const loadProjects = async () => {
    try {
      const { projects } = await projectsApi.list()
      setProjects(projects)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProjects() }, [])

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) { setCreateError('Nome é obrigatório'); return }
    setCreating(true); setCreateError('')
    try {
      await projectsApi.create(newName.trim(), newDesc.trim() || undefined)
      setNewName(''); setNewDesc(''); setShowCreate(false)
      loadProjects()
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Erro ao criar projeto')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Olá, {user?.name.split(' ')[0]} 👋
          </h1>
          <p className="mt-1 text-gray-500">
            {projects.length === 0 ? 'Crie seu primeiro projeto abaixo' : `${projects.length} projeto${projects.length !== 1 ? 's' : ''} no total`}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Novo Projeto
        </Button>
      </div>

      {/* Search */}
      {projects.length > 0 && (
        <div className="mb-6 max-w-sm">
          <Input
            placeholder="Buscar projetos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            icon={<Search size={16} />}
          />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-100 mb-6">
            <FolderOpen size={36} className="text-violet-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700">
            {search ? 'Nenhum projeto encontrado' : 'Nenhum projeto ainda'}
          </h3>
          <p className="mt-2 text-sm text-gray-400 max-w-xs">
            {search ? 'Tente buscar por outro termo.' : 'Crie seu primeiro projeto e comece a organizar suas tarefas.'}
          </p>
          {!search && (
            <Button className="mt-6" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Criar primeiro projeto
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(project => <ProjectCard key={project.id} project={project} />)}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Novo Projeto">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Nome do projeto *" value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="Ex: App de Delivery" autoFocus />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Descrição</label>
            <textarea
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              rows={3}
              placeholder="Descreva o objetivo do projeto..."
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none resize-none focus:border-violet-400 focus:ring-3 focus:ring-violet-100"
            />
          </div>
          {createError && <p className="text-sm text-rose-500">{createError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button type="submit" loading={creating}>Criar projeto</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
