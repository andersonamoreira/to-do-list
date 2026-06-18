import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, ExternalLink } from 'lucide-react'
import { tasksApi } from '../api/tasks'
import { TaskCard } from '../components/TaskCard'
import type { Task } from '../types'

const STATUS_ORDER: Record<Task['status'], number> = { PENDING: 0, IN_PROGRESS: 1, DONE: 2 }
const STATUS_LABEL: Record<Task['status'], string> = {
  PENDING: '📋 Pendente',
  IN_PROGRESS: '🔄 Em andamento',
  DONE: '✅ Concluído',
}

export function TodayPage() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const load = useCallback(async () => {
    try {
      const { tasks } = await tasksApi.today()
      setTasks(tasks)
    } catch {
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

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

  const grouped = tasks.reduce<Record<string, Task[]>>((acc, task) => {
    const key = task.project?.id ?? 'unknown'
    if (!acc[key]) acc[key] = []
    acc[key].push(task)
    return acc
  }, {})

  const projectNames: Record<string, string> = {}
  tasks.forEach(t => { if (t.project) projectNames[t.project.id] = t.project.name })

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
    </div>
  )

  const sorted = [...tasks].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
  const groupedSorted: Record<string, Task[]> = {}
  sorted.forEach(t => {
    const key = t.project?.id ?? 'unknown'
    if (!groupedSorted[key]) groupedSorted[key] = []
    groupedSorted[key].push(t)
  })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
            <CalendarDays size={20} className="text-violet-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Tarefas do dia</h1>
        </div>
        <p className="ml-[52px] text-sm text-gray-500 capitalize">{today}</p>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
          <CalendarDays size={40} className="text-gray-300 mb-3" />
          <p className="text-base font-medium text-gray-500">Nenhuma tarefa para hoje</p>
          <p className="text-sm text-gray-400 mt-1">Aproveite o dia livre!</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Summary bar */}
          <div className="flex gap-3 flex-wrap">
            {(Object.keys(STATUS_LABEL) as Task['status'][]).map(s => {
              const count = tasks.filter(t => t.status === s).length
              if (count === 0) return null
              return (
                <div key={s} className="rounded-xl bg-white border border-gray-100 shadow-sm px-4 py-2.5 text-sm font-medium text-gray-700">
                  {STATUS_LABEL[s]} <span className="ml-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold">{count}</span>
                </div>
              )
            })}
            <div className="rounded-xl bg-violet-50 border border-violet-100 px-4 py-2.5 text-sm font-semibold text-violet-700">
              Total: {tasks.length}
            </div>
          </div>

          {/* Tasks grouped by project */}
          {Object.entries(groupedSorted).map(([projectId, projectTasks]) => (
            <div key={projectId}>
              <button
                onClick={() => navigate(`/projects/${projectId}`)}
                className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-violet-600 transition-colors group"
              >
                <span className="h-2 w-2 rounded-full bg-violet-400" />
                {projectNames[projectId] ?? 'Projeto'}
                <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {projectTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={() => navigate(`/projects/${task.projectId}`)}
                    onDelete={handleDeleteTask}
                    onStatusChange={handleStatusChange}
                    canEdit={true}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
