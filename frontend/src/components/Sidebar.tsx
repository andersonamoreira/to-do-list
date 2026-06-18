import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, Tag, User, LogOut, CheckSquare } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/today', icon: CalendarDays, label: 'Tarefas do dia' },
  { to: '/labels', icon: Tag, label: 'Etiquetas' },
  { to: '/profile', icon: User, label: 'Perfil' },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <aside className="flex h-screen w-64 flex-col bg-gradient-to-b from-violet-600 via-violet-700 to-indigo-800 shadow-xl">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
          <CheckSquare size={20} className="text-white" />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">TaskFlow</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200
              ${isActive
                ? 'bg-white text-violet-700 shadow-md'
                : 'text-violet-100 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-white/10 px-3 py-4">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
            <p className="truncate text-xs text-violet-300">{user?.role === 'ADMIN' ? 'Administrador' : 'Usuário'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-violet-200 hover:bg-white/10 hover:text-white transition-all duration-200"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  )
}
