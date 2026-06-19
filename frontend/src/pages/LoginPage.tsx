import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const { login, isLoading } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as any)?.from?.pathname || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(email, password)
      toast.success('歡迎回來！')
      navigate(from, { replace: true })
    } catch (err: any) {
      toast.error(err?.response?.data?.error || '登入失敗，請重試')
    }
  }

  const fillDemo = (role: 'user' | 'staff' | 'admin') => {
    const demos = {
      user: { email: 'user@breakfast.tw', password: 'User12345' },
      staff: { email: 'staff@breakfast.tw', password: 'Staff1234' },
      admin: { email: 'admin@breakfast.tw', password: 'Admin1234' },
    }
    setEmail(demos[role].email)
    setPassword(demos[role].password)
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🥐</div>
          <h1 className="text-3xl font-display font-bold text-charcoal-900">早餐店</h1>
          <p className="text-charcoal-500 mt-2">登入您的帳號繼續點餐</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-1.5">電子郵件</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-1.5">密碼</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="輸入密碼"
                  className="input pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full" disabled={isLoading}>
              {isLoading ? '登入中...' : '登入'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-charcoal-500 text-sm">
              還沒有帳號？{' '}
              <Link to="/auth/register" className="text-dawn-600 hover:text-dawn-700 font-medium">立即註冊</Link>
            </p>
          </div>

          {/* Demo accounts */}
          <div className="mt-6 pt-6 border-t border-charcoal-100">
            <p className="text-xs text-charcoal-400 text-center mb-3">快速填入測試帳號</p>
            <div className="grid grid-cols-3 gap-2">
              {(['user', 'staff', 'admin'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => fillDemo(r)}
                  className="text-xs py-2 px-3 rounded-lg border border-charcoal-200 hover:bg-charcoal-50 text-charcoal-600 transition-colors"
                >
                  {r === 'user' ? '👤 顧客' : r === 'staff' ? '👩‍🍳 廚師' : '⚙️ 管理員'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
