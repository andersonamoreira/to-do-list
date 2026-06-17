import { useState, useEffect } from 'react'
import { Plus, Tag, Trash2 } from 'lucide-react'
import { labelsApi } from '../api/labels'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import type { Label } from '../types'

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899',
  '#10B981', '#F43F5E', '#6366F1', '#0EA5E9',
]

export function LabelsPage() {
  const { user } = useAuth()
  const [labels, setLabels] = useState<Label[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#8B5CF6')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const isAdmin = user?.role === 'ADMIN'

  const load = async () => {
    try {
      const { labels } = await labelsApi.list()
      setLabels(labels)
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Nome é obrigatório'); return }
    setCreating(true); setError('')
    try {
      await labelsApi.create(name.trim(), color)
      setName(''); setColor('#8B5CF6'); setShowCreate(false); load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar')
    } finally { setCreating(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta etiqueta?')) return
    try {
      await labelsApi.delete(id)
      setLabels(prev => prev.filter(l => l.id !== id))
    } catch { /* ignore */ }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Etiquetas</h1>
          <p className="mt-1 text-gray-500">Categorize suas tarefas com etiquetas coloridas</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Nova Etiqueta
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 w-28 rounded-full bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : labels.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-100 mb-6">
            <Tag size={36} className="text-violet-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700">Nenhuma etiqueta ainda</h3>
          {isAdmin
            ? <Button className="mt-6" onClick={() => setShowCreate(true)}><Plus size={16} /> Criar etiqueta</Button>
            : <p className="mt-2 text-sm text-gray-400">Apenas administradores podem criar etiquetas.</p>
          }
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {labels.map(label => (
            <div key={label.id} className="flex items-center justify-between rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full shadow-sm" style={{ backgroundColor: label.color }} />
                <span className="font-medium text-gray-800">{label.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <span
                  className="rounded-full px-3 py-1 text-xs font-bold text-white"
                  style={{ backgroundColor: label.color }}
                >
                  Prévia
                </span>
                {isAdmin && (
                  <button onClick={() => handleDelete(label.id)} className="ml-2 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-rose-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nova Etiqueta">
        <form onSubmit={handleCreate} className="space-y-5">
          <Input label="Nome *" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Bug, Feature, Urgente..." autoFocus />

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Cor</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-10 w-10 rounded-xl cursor-pointer border border-gray-200" />
              <span className="text-sm text-gray-500">Personalizar cor</span>
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-3">
            <span className="text-sm text-gray-500">Prévia:</span>
            <span className="rounded-full px-3 py-1 text-xs font-bold text-white" style={{ backgroundColor: color }}>
              {name || 'Etiqueta'}
            </span>
          </div>

          {error && <p className="text-sm text-rose-500">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button type="submit" loading={creating}>Criar etiqueta</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
