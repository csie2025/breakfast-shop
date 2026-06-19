import { Outlet, Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, User, ChefHat, Settings, LogOut, Menu as MenuIcon, X } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useCartStore } from '../stores/cartStore'
import { useEffect } from 'react'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const { fetchCart, itemCount } = useCartStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const count = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0))

  useEffect(() => {
    if (user) fetchCart()
  }, [user])

  const handleLogout = () => {
    logout()
    navigate('/auth/login')
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-charcoal-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🥐</span>
            <span className="font-display font-semibold text-charcoal-900 text-lg hidden sm:block">早餐店</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/" className="btn-ghost text-sm">菜單</Link>
            {user?.role === 'STAFF' && (
              <Link to="/kitchen" className="btn-ghost text-sm">廚房系統</Link>
            )}
            {user?.role === 'ADMIN' && (
              <>
                <Link to="/admin/menu" className="btn-ghost text-sm">菜單管理</Link>
                <Link to="/admin/orders" className="btn-ghost text-sm">訂單管理</Link>
                <Link to="/admin/stats" className="btn-ghost text-sm">統計報表</Link>
              </>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link to="/cart" className="relative p-2 rounded-xl hover:bg-charcoal-100 transition-colors">
                  <ShoppingCart size={22} className="text-charcoal-700" />
                  {count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-dawn-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {count > 9 ? '9+' : count}
                    </span>
                  )}
                </Link>
                <div className="relative group">
                  <button className="flex items-center gap-2 p-2 rounded-xl hover:bg-charcoal-100 transition-colors">
                    <div className="w-8 h-8 bg-dawn-100 rounded-full flex items-center justify-center">
                      <span className="text-dawn-700 font-semibold text-sm">{user.name[0]}</span>
                    </div>
                    <span className="hidden sm:block text-sm text-charcoal-700">{user.name}</span>
                  </button>
                  {/* Dropdown */}
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-2xl shadow-lg border border-charcoal-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <Link to="/orders" className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal-700 hover:bg-charcoal-50">
                      <MenuIcon size={16} /> 我的訂單
                    </Link>
                    {user.role === 'ADMIN' && (
                      <Link to="/admin/menu" className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal-700 hover:bg-charcoal-50">
                        <Settings size={16} /> 管理後台
                      </Link>
                    )}
                    {user.role === 'STAFF' && (
                      <Link to="/kitchen" className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal-700 hover:bg-charcoal-50">
                        <ChefHat size={16} /> 廚房系統
                      </Link>
                    )}
                    <hr className="my-1 border-charcoal-100" />
                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full text-left">
                      <LogOut size={16} /> 登出
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <Link to="/auth/login" className="btn-primary text-sm py-2 px-4">登入</Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 page-enter">
        <Outlet />
      </main>
    </div>
  )
}
