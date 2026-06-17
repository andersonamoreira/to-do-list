import { useState, useEffect } from 'react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { tasksApi } from '../api/tasks'
import type { Task, Label } from '../types'

interface TaskModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  projectId: string
  task?: Task | null
  labels: Label[]
  defaultStatus?: Task['status']
}

const STATUSES: Task['status'][] = ['PENDING', 'IN_PROGRESS', 'DONE']
const STATUS_LABELS: Record<Task['status'], string> = {
  PENDING: '📋 Pendente',
  IN_PROGRESS: '🔄 Em andamento',
  DONE: '✅ Concluído',
}

export function TaskModal({ open, onClose, onSaved, projectId, task, labels, defaultStatus = 'PENDING' }: TaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<Task['status']>('PENDING')
  const [dueDate, setDueDate] = useState('')
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description ?? '')
      setStatus(task.status)
      setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : '')
      setSelectedLabels(task.labels?.map(l => l.label.id) ?? [])
    } else {
      setTitle(''); setDescription(''); setStatus(defaultStatus); setDueDate(''); setSelectedLabels([])
    }
    setError('')
  }, [task, open])

  const toggleLabel = (id: string) =>
    setSelectedLabels(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('Título é obrigatório'); return }
    setLoading(true); setError('')

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      }

      if (task) {
        await tasksApi.update(task.id, payload)
        const currentLabelIds = task.labels?.map(l => l.label.id) ?? []
        for (const id of selectedLabels) {
          if (!currentLabelIds.includes(id)) await tasksApi.addLabel(task.id, id)
        }
        for (const id of currentLabelIds) {
          if (!selectedLabels.includes(id)) await tasksApi.removeLabel(task.id, id)
        }
      } else {
        const { task: created } = await tasksApi.create(projectId, payload)
        for (const id of selectedLabels) await tasksApi.addLabel(created.id, id)
      }

      onSaved(); onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar tarefa')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={task ? 'Editar Tarefa' : 'Nova Tarefa'} maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Título *" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Implementar autenticação" />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Descrição</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            placeholder="Detalhes opcionais..."
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-violet-400 focus:ring-3 focus:ring-violet-100 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as Task['status'])}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-violet-400 focus:ring-3 focus:ring-violet-100"
            >
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <Input
            label="Prazo"
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
          />
        </div>

        {labels.length > 0 && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Etiquetas</label>
            <div className="flex flex-wrap gap-2">
              {labels.map(label => (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => toggleLabel(label.id)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold text-white transition-all ${selectedLabels.includes(label.id) ? 'opacity-100 ring-2 ring-offset-1 ring-gray-400' : 'opacity-50 hover:opacity-80'}`}
                  style={{ backgroundColor: label.color }}
                >
                  {label.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={loading}>{task ? 'Salvar alterações' : 'Criar tarefa'}</Button>
        </div>
      </form>
    </Modal>
  )
}
