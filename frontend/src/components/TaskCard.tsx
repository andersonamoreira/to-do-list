import { Calendar, User2, Pencil, Trash2 } from 'lucide-react'
import type { Task } from '../types'

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  onStatusChange: (taskId: string, status: Task['status']) => void
  canEdit: boolean
}

const STATUS_NEXT: Record<Task['status'], Task['status'] | null> = {
  PENDING: 'IN_PROGRESS',
  IN_PROGRESS: 'DONE',
  DONE: null,
}

const STATUS_LABEL: Record<Task['status'], string> = {
  PENDING: 'Iniciar',
  IN_PROGRESS: 'Concluir',
  DONE: 'Concluído',
}

const STATUS_COLOR: Record<Task['status'], string> = {
  PENDING: 'bg-amber-50 border-amber-200 hover:border-amber-300',
  IN_PROGRESS: 'bg-blue-50 border-blue-200 hover:border-blue-300',
  DONE: 'bg-emerald-50 border-emerald-200 hover:border-emerald-300',
}

function isOverdue(dueDate?: string | null) {
  if (!dueDate) return false
  const taskDate = dueDate.slice(0, 10)
  const today = new Date().toLocaleDateString('en-CA')
  return taskDate < today
}

function formatDate(dueDate: string) {
  return new Date(dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

export function TaskCard({ task, onEdit, onDelete, onStatusChange, canEdit }: TaskCardProps) {
  const nextStatus = STATUS_NEXT[task.status]
  const overdue = isOverdue(task.dueDate)

  return (
    <div className={`rounded-xl border p-4 shadow-sm transition-all duration-200 ${STATUS_COLOR[task.status]}`}>
      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {task.labels.map(({ label }) => (
            <span
              key={label.id}
              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold text-white shadow-sm"
              style={{ backgroundColor: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <p className={`text-sm font-semibold text-gray-800 leading-snug ${task.status === 'DONE' ? 'line-through text-gray-400' : ''}`}>
        {task.title}
      </p>

      {task.description && (
        <p className="mt-1 text-xs text-gray-500 line-clamp-2">{task.description}</p>
      )}

      {/* Meta */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-400">
        {task.assignee && (
          <span className="flex items-center gap-1">
            <User2 size={12} />
            {task.assignee.name}
          </span>
        )}
        {task.dueDate && (
          <span className={`flex items-center gap-1 ${overdue && task.status !== 'DONE' ? 'text-rose-500 font-medium' : ''}`}>
            <Calendar size={12} />
            {formatDate(task.dueDate)}
          </span>
        )}
      </div>

      {/* Actions */}
      {canEdit && (
        <div className="mt-3 flex items-center justify-between">
          {nextStatus ? (
            <button
              onClick={() => onStatusChange(task.id, nextStatus)}
              className="rounded-lg bg-white/60 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-white hover:text-violet-600 border border-gray-200 transition-colors"
            >
              {STATUS_LABEL[task.status]} →
            </button>
          ) : (
            <span className="text-xs font-medium text-emerald-600">✓ Concluído</span>
          )}
          <div className="flex items-center gap-1">
            <button onClick={() => onEdit(task)} className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-violet-600 transition-colors">
              <Pencil size={13} />
            </button>
            <button onClick={() => onDelete(task.id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-rose-500 transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
