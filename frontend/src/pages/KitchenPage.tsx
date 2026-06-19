import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { kitchenApi } from '../api'
import { useAuthStore } from '../stores/authStore'
import { ChefHat, RefreshCw, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const STATUS_NEXT: Record<string, { label: string; next: string }> = {
  pending:   { label: '開始製作', next: 'preparing' },
  preparing: { label: '製作完成', next: 'ready' },
  ready:     { label: '已取餐', next: 'completed' },
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'border-yellow-300 bg-yellow-50',
  preparing: 'border-blue-300 bg-blue-50',
  ready: 'border-green-300 bg-green-50',
}

export default function KitchenPage() {
  const { logout } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['kitchenOrders'],
    queryFn: () => kitchenApi.getOrders(),
    refetchInterval: 15_000,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      kitchenApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kitchenOrders'] })
      toast.success('訂單狀態已更新')
    },
    onError: () => toast.error('更新失敗'),
  })

  const orders = data?.data || []
  const pending = orders.filter((o: any) => o.status === 'pending')
  const preparing = orders.filter((o: any) => o.status === 'preparing')
  const ready = orders.filter((o: any) => o.status === 'ready')

  const handleRefresh = () => { refetch(); setLastRefresh(new Date()) }

  return (
    <div className="min-h-screen bg-charcoal-950 text-white">
      {/* Header */}
      <header className="bg-charcoal-900 border-b border-charcoal-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChefHat size={28} className="text-dawn-400" />
          <div>
            <h1 className="font-display font-bold text-xl">廚房顯示系統 (KDS)</h1>
            <p className="text-charcoal-400 text-xs">最後更新：{lastRefresh.toLocaleTimeString('zh-TW')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-charcoal-800 hover:bg-charcoal-700 rounded-xl text-sm transition-colors">
            <RefreshCw size={16} /> 刷新
          </button>
          <button onClick={() => { logout(); navigate('/auth/login') }} className="flex items-center gap-2 px-4 py-2 bg-red-900/50 hover:bg-red-900 rounded-xl text-sm text-red-300 transition-colors">
            <LogOut size={16} /> 登出
          </button>
        </div>
      </header>

      {/* Stats bar */}
      <div className="bg-charcoal-900/50 px-6 py-3 flex gap-6 border-b border-charcoal-800">
        <span className="text-sm">🟡 待確認：<strong className="text-yellow-400">{pending.length}</strong></span>
        <span className="text-sm">🔵 製作中：<strong className="text-blue-400">{preparing.length}</strong></span>
        <span className="text-sm">🟢 可取餐：<strong className="text-green-400">{ready.length}</strong></span>
      </div>

      {/* Order columns */}
      <div className="p-6 grid grid-cols-3 gap-6">
        {(['pending', 'preparing', 'ready'] as const).map(status => {
          const cols: Record<string, any[]> = { pending, preparing, ready }
          const colOrders = cols[status]
          const colLabel = { pending: '⏳ 待確認', preparing: '🔥 製作中', ready: '✅ 可取餐' }[status]

          return (
            <div key={status} className="space-y-4">
              <h2 className="font-semibold text-charcoal-300 text-sm tracking-wider uppercase">{colLabel} ({colOrders.length})</h2>
              {colOrders.map((order: any) => (
                <div key={order.id} className={`rounded-2xl border-2 p-5 ${STATUS_COLOR[status]} text-charcoal-900`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-lg">{order.orderNumber}</span>
                    <span className="text-xs text-charcoal-600">
                      {new Date(order.createdAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-charcoal-700 mb-3">👤 {order.customerName}</p>

                  <div className="space-y-1.5 mb-4">
                    {order.items.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.name}</span>
                        <span className="bg-white/70 px-2 py-0.5 rounded-full font-bold text-xs">×{item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <div className="bg-yellow-100 border border-yellow-200 rounded-lg px-3 py-2 text-xs text-yellow-800 mb-3">
                      📝 {order.notes}
                    </div>
                  )}

                  {order.deliveryMethod === 'delivery' && (
                    <div className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded-lg mb-3">🛵 外送</div>
                  )}

                  {STATUS_NEXT[status] && (
                    <button
                      onClick={() => updateMutation.mutate({ id: order.id, status: STATUS_NEXT[status].next })}
                      disabled={updateMutation.isPending}
                      className="w-full py-2.5 bg-charcoal-900 hover:bg-charcoal-800 text-white rounded-xl text-sm font-semibold transition-colors active:scale-98"
                    >
                      {STATUS_NEXT[status].label}
                    </button>
                  )}
                </div>
              ))}
              {colOrders.length === 0 && (
                <div className="text-center py-10 text-charcoal-600 text-sm border-2 border-dashed border-charcoal-700 rounded-2xl">
                  暫無訂單
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
