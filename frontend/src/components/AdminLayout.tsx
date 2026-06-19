import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, UtensilsCrossed, ClipboardList, BarChart3, LogOut } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

const NAV_ITEMS = [
  { to: '/admin/menu', icon: UtensilsCrossed, label: '菜單管理' },
  { to: '/admin/orders', icon: ClipboardList, label: '訂單管理' },
  { to: '/admin/stats', icon: BarChart3, label: '統計報表' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-charcoal-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-charcoal-900 text-white flex flex-col fixed h-full">
        <div className="p-6 border-b border-charcoal-800">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🥐</span>
            <span className="font-display font-bold text-lg">早餐店</span>
          </div>
          <span className="text-xs text-charcoal-400">管理後台</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                location.pathname === to
                  ? 'bg-dawn-500 text-white'
                  : 'text-charcoal-400 hover:text-white hover:bg-charcoal-800'
              }`}
            >
              <Icon size={18} /> {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-charcoal-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 bg-dawn-500 rounded-full flex items-center justify-center text-sm font-bold">
              {user?.name[0]}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-charcoal-400">管理員</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/auth/login') }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-charcoal-400 hover:text-red-400 hover:bg-charcoal-800 rounded-xl transition-colors"
          >
            <LogOut size={16} /> 登出
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-56 p-8">
        {children}
      </main>
    </div>
  )
}
