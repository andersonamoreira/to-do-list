import { useNavigate } from 'react-router-dom'
import { Users, CheckSquare, ArrowRight } from 'lucide-react'
import type { Project } from '../types'

const GRADIENTS = [
  'from-rose-400 to-orange-400',
  'from-violet-400 to-purple-500',
  'from-blue-400 to-cyan-400',
  'from-emerald-400 to-teal-400',
  'from-amber-400 to-orange-400',
  'from-pink-400 to-rose-500',
  'from-lime-400 to-emerald-400',
  'from-sky-400 to-blue-500',
]

function gradientFor(id: string) {
  const idx = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % GRADIENTS.length
  return GRADIENTS[idx]
}

interface ProjectCardProps { project: Project }

export function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate()
  const gradient = gradientFor(project.id)

  return (
    <div
      onClick={() => navigate(`/projects/${project.id}`)}
      className="group cursor-pointer rounded-2xl bg-white shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
    >
      {/* Gradient Header */}
      <div className={`h-24 bg-gradient-to-br ${gradient} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/5" />
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/25 backdrop-blur-sm text-white font-bold text-lg">
            {project.name.charAt(0).toUpperCase()}
          </div>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRight size={16} />
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate group-hover:text-violet-600 transition-colors">
          {project.name}
        </h3>
        {project.description && (
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">{project.description}</p>
        )}

        <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <CheckSquare size={13} className="text-violet-400" />
            {project._count?.tasks ?? 0} tarefas
          </span>
          <span className="flex items-center gap-1.5">
            <Users size={13} className="text-violet-400" />
            {project._count?.collaborators ?? 0} colaboradores
          </span>
        </div>
      </div>
    </div>
  )
}
