import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil, Trash2, Users } from 'lucide-react'
import { projectsApi } from '../api/projects'
import { tasksApi } from '../api/tasks'
import { labelsApi } from '../api/labels'
import { useAuth } from '../contexts/AuthContext'
import { TaskCard } from '../components/TaskCard'
import { TaskModal } from '../components/TaskModal'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import type { Project, Task, Label } from '../types'

const COLUMNS: { status: Task['status']; label: string; color: string; ring: string }[] = [
  { status: 'PENDING',     label: '📋 Pendente',      color: 'bg-amber-50 border-amber-200',   ring: 'bg-amber-400' },
  { status: 'IN_PROGRESS', label: '🔄 Em andamento',  color: 'bg-blue-50 border-blue-200',     ring: 'bg-blue-400' },
  { status: 'DONE',        label: '✅ Concluído',      color: 'bg-emerald-50 border-emerald-200', ring: 'bg-emerald-400' },
]

export function ProjectPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [labels, setLabels] = useState<Label[]>([])
  const [loading, setLoading] = useState(true)

  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [defaultStatus, setDefaultStatus] = useState<Task['status']>('PENDING')

  const [editProjectOpen, setEditProjectOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [saving, setSaving] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)

  const [collabOpen, setCollabOpen] = useState(false)
  const [collabUserId, setCollabUserId] = useState('')
  const [collabError, setCollabError] = useState('')

  const load = useCallback(async () => {
    if (!id) return
    try {
      const [{ project }, { tasks }, { labels }] = await Promise.all([
        projectsApi.get(id),
        tasksApi.list(id),
        labelsApi.list(),
      ])
      setProject(project)
      setTasks(tasks)
      setLabels(labels)
    } catch {
      navigate('/')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => { load() }, [load])

  const isOwner = project?.ownerId === user?.id
  const isAdmin = user?.role === 'ADMIN'
  const canManage = isOwner || isAdmin

  const handleStatusChange = async (taskId: string, status: Task['status']) => {
    try {
      await tasksApi.update(taskId, { status })
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t))
    } catch { /* ignore */ }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Excluir esta tarefa?')) return
    try {
      await tasksApi.delete(taskId)
      setTasks(prev => prev.filter(t => t.id !== taskId))
    } catch { /* ignore */ }
  }

  const openNewTask = (status: Task['status']) => {
    setDefaultStatus(status); setEditingTask(null); setTaskModalOpen(true)
  }

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setSaving(true)
    try {
      const { project } = await projectsApi.update(id, { name: editName, description: editDesc || undefined })
      setProject(project); setEditProjectOpen(false)
    } catch { /* ignore */ } finally { setSaving(false) }
  }

  const handleDeleteProject = async () => {
    if (!id) return
    await projectsApi.delete(id)
    navigate('/')
  }

  const handleAddCollab = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !collabUserId.trim()) return
    setCollabError('')
    try {
      await projectsApi.addCollaborator(id, collabUserId.trim())
      setCollabUserId(''); setCollabOpen(false); load()
    } catch (err) {
      setCollabError(err instanceof Error ? err.message : 'Erro ao adicionar')
    }
  }

  const handleRemoveCollab = async (userId: string) => {
    if (!id) return
    await projectsApi.removeCollaborator(id, userId)
    load()
  }

  const tasksIn = (status: Task['status']) => tasks.filter(t => t.status === status)

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
    </div>
  )

  if (!project) return null

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white px-8 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
              <ArrowLeft size={16} /> Projetos
            </button>
            <div className="h-4 w-px bg-gray-200" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
              {project.description && <p className="text-sm text-gray-500 mt-0.5">{project.description}</p>}
            </div>
          </div>
          {canManage && (
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => { setCollabOpen(true) }}>
                <Users size={14} /> Colaboradores
              </Button>
              <Button variant="secondary" size="sm" onClick={() => { setEditName(project.name); setEditDesc(project.description ?? ''); setEditProjectOpen(true) }}>
                <Pencil size={14} /> Editar
              </Button>
              <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
                <Trash2 size={14} /> Excluir
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Kanban */}
      <div className="flex-1 overflow-x-auto p-8">
        <div className="flex gap-6 h-full min-w-max">
          {COLUMNS.map(col => {
            const colTasks = tasksIn(col.status)
            return (
              <div key={col.status} className="flex flex-col w-80">
                {/* Column header */}
                <div className={`flex items-center justify-between rounded-xl border px-4 py-3 mb-4 ${col.color}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">{col.label}</span>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-gray-600 shadow-sm">
                      {colTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => openNewTask(col.status)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-white hover:text-violet-600 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Tasks */}
                <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
                  {colTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
                      <p className="text-sm text-gray-400">Sem tarefas aqui</p>
                      <button onClick={() => openNewTask(col.status)} className="mt-2 text-xs font-medium text-violet-500 hover:text-violet-700">
                        + Adicionar
                      </button>
                    </div>
                  ) : (
                    colTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onEdit={t => { setEditingTask(t); setTaskModalOpen(true) }}
                        onDelete={handleDeleteTask}
                        onStatusChange={handleStatusChange}
                        canEdit={canManage || task.createdById === user?.id}
                      />
                    ))
                  )}
                </div>

                <button
                  onClick={() => openNewTask(col.status)}
                  className="mt-3 flex items-center gap-2 rounded-xl border-2 border-dashed border-gray-200 px-4 py-3 text-sm text-gray-400 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 transition-all"
                >
                  <Plus size={15} /> Adicionar tarefa
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Task Modal */}
      <TaskModal
        open={taskModalOpen}
        onClose={() => { setTaskModalOpen(false); setEditingTask(null) }}
        onSaved={load}
        projectId={project.id}
        task={editingTask}
        labels={labels}
        defaultStatus={defaultStatus}
      />

      {/* Edit Project Modal */}
      <Modal open={editProjectOpen} onClose={() => setEditProjectOpen(false)} title="Editar Projeto">
        <form onSubmit={handleSaveProject} className="space-y-4">
          <Input label="Nome *" value={editName} onChange={e => setEditName(e.target.value)} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Descrição</label>
            <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none resize-none focus:border-violet-400 focus:ring-3 focus:ring-violet-100" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditProjectOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Salvar</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Project Modal */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Excluir Projeto">
        <p className="text-sm text-gray-600">Tem certeza que deseja excluir <strong>{project.name}</strong>? Todas as tarefas serão removidas.</p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDeleteProject}>Excluir</Button>
        </div>
      </Modal>

      {/* Collaborators Modal */}
      <Modal open={collabOpen} onClose={() => setCollabOpen(false)} title="Colaboradores" maxWidth="max-w-md">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Membros atuais</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-600">
                  {project.owner.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{project.owner.name}</p>
                  <p className="text-xs text-gray-400">Dono</p>
                </div>
              </li>
              {project.collaborators?.map(c => (
                <li key={c.id} className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                    {c.user.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.user.name}</p>
                    <p className="text-xs text-gray-400 truncate">{c.user.email}</p>
                  </div>
                  {isOwner && (
                    <button onClick={() => handleRemoveCollab(c.user.id)} className="text-gray-400 hover:text-rose-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {isOwner && (
            <form onSubmit={handleAddCollab} className="border-t border-gray-100 pt-4 space-y-3">
              <Input label="Adicionar por ID do usuário" value={collabUserId} onChange={e => setCollabUserId(e.target.value)} placeholder="ID do usuário" />
              {collabError && <p className="text-xs text-rose-500">{collabError}</p>}
              <Button type="submit" size="sm" className="w-full">Adicionar colaborador</Button>
            </form>
          )}
        </div>
      </Modal>
    </div>
  )
}
