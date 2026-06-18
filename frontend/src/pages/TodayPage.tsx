import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, ExternalLink, AlertTriangle } from 'lucide-react'
import { tasksApi } from '../api/tasks'
import { TaskCard } from '../components/TaskCard'
import type { Task } from '../types'

export function TodayPage() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [includeOverdue, setIncludeOverdue] = useState(false)
  const [includeDone, setIncludeDone] = useState(false)

  const todayStr = new Date().toLocaleDateString('en-CA')

  const todayLabel = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { tasks } = await tasksApi.today({ includeOverdue, includeDone })
      setTasks(tasks)
    } catch {
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [includeOverdue, includeDone])

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

  const isTaskToday = (t: Task) => t.dueDate?.slice(0, 10) === todayStr
  const isTaskOverdue = (t: Task) => !!t.dueDate && t.dueDate.slice(0, 10) < todayStr

  const todayTasks = tasks.filter(isTaskToday)
  const overdueTasks = tasks.filter(isTaskOverdue)

  const projectNames: Record<string, string> = {}
  tasks.forEach(t => { if (t.project) projectNames[t.project.id] = t.project.name })

  function groupByProject(list: Task[]) {
    return list.reduce<Record<string, Task[]>>((acc, task) => {
      const key = task.project?.id ?? 'unknown'
      if (!acc[key]) acc[key] = []
      acc[key].push(task)
      return acc
    }, {})
  }

  const counts = {
    pending: tasks.filter(t => t.status === 'PENDING').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    done: tasks.filter(t => t.status === 'DONE').length,
  }

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
    </div>
  )

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
              <CalendarDays size={20} className="text-violet-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Tarefas do dia</h1>
          </div>
          <p className="ml-[52px] text-sm text-gray-500 capitalize">{todayLabel}</p>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-gray-500">Exibir:</span>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() => setIncludeOverdue(v => !v)}
              className={`relative h-5 w-9 rounded-full transition-colors ${includeOverdue ? 'bg-rose-500' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${includeOverdue ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-gray-600">Atrasadas</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() => setIncludeDone(v => !v)}
              className={`relative h-5 w-9 rounded-full transition-colors ${includeDone ? 'bg-emerald-500' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${includeDone ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-gray-600">Concluídas</span>
          </label>
        </div>
      </div>

      {/* Resumo */}
      {tasks.length > 0 && (
        <div className="mb-6 flex gap-3 flex-wrap">
          {counts.pending > 0 && (
            <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-2 text-sm font-medium text-amber-700">
              📋 Pendente <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-bold">{counts.pending}</span>
            </div>
          )}
          {counts.inProgress > 0 && (
            <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-2 text-sm font-medium text-blue-700">
              🔄 Em andamento <span className="ml-1 rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-bold">{counts.inProgress}</span>
            </div>
          )}
          {counts.done > 0 && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700">
              ✅ Concluída <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs font-bold">{counts.done}</span>
            </div>
          )}
          <div className="rounded-xl bg-violet-50 border border-violet-100 px-4 py-2 text-sm font-semibold text-violet-700">
            Total: {tasks.length}
          </div>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
          <CalendarDays size={40} className="text-gray-300 mb-3" />
          <p className="text-base font-medium text-gray-500">Nenhuma tarefa para hoje</p>
          <p className="text-sm text-gray-400 mt-1">Aproveite o dia livre!</p>
        </div>
      ) : (
        <div className="space-y-10">

          {/* Atrasadas */}
          {includeOverdue && overdueTasks.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={16} className="text-rose-500" />
                <h2 className="text-sm font-bold text-rose-600 uppercase tracking-wide">
                  Atrasadas ({overdueTasks.length})
                </h2>
              </div>
              <div className="space-y-6">
                {Object.entries(groupByProject(overdueTasks)).map(([projectId, list]) => (
                  <div key={projectId}>
                    <button
                      onClick={() => navigate(`/projects/${projectId}`)}
                      className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-rose-600 transition-colors group"
                    >
                      <span className="h-2 w-2 rounded-full bg-rose-400" />
                      {projectNames[projectId] ?? 'Projeto'}
                      <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {list.map(task => (
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
            </section>
          )}

          {/* Hoje */}
          {todayTasks.length > 0 && (
            <section>
              {includeOverdue && (
                <div className="flex items-center gap-2 mb-4">
                  <CalendarDays size={16} className="text-violet-500" />
                  <h2 className="text-sm font-bold text-violet-600 uppercase tracking-wide">
                    Hoje ({todayTasks.length})
                  </h2>
                </div>
              )}
              <div className="space-y-6">
                {Object.entries(groupByProject(todayTasks)).map(([projectId, list]) => (
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
                      {list.map(task => (
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
            </section>
          )}

          {/* Nenhuma tarefa para hoje (mas tem atrasadas) */}
          {todayTasks.length === 0 && includeOverdue && (
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-6 py-4 text-sm text-gray-400 text-center">
              Nenhuma tarefa agendada para hoje.
            </div>
          )}

        </div>
      )}
    </div>
  )
}
