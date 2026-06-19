import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { register, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { toast.error('密碼至少需要 8 個字元'); return }
    try {
      await register(email, password, name)
      toast.success('註冊成功，歡迎加入！')
      navigate('/')
    } catch (err: any) {
      toast.error(err?.response?.data?.error || '註冊失敗，請重試')
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🥐</div>
          <h1 className="text-3xl font-display font-bold text-charcoal-900">建立帳號</h1>
          <p className="text-charcoal-500 mt-2">加入早餐店，開始享受便利點餐</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-1.5">姓名</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="您的名字"
                className="input"
                required
              />
            </div>
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
              <label className="block text-sm font-medium text-charcoal-700 mb-1.5">密碼 <span className="text-charcoal-400 font-normal">(至少 8 個字元)</span></label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="設定密碼"
                className="input"
                required
                minLength={8}
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={isLoading}>
              {isLoading ? '建立中...' : '建立帳號'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-charcoal-500 text-sm">
              已有帳號？{' '}
              <Link to="/auth/login" className="text-dawn-600 hover:text-dawn-700 font-medium">返回登入</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
