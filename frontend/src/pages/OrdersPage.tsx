import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ordersApi } from '../api'
import { ChevronRight, Package } from 'lucide-react'

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending:    { label: '待確認', cls: 'badge-pending' },
  preparing:  { label: '準備中', cls: 'badge-preparing' },
  ready:      { label: '可取餐', cls: 'badge-ready' },
  completed:  { label: '已完成', cls: 'badge-completed' },
  cancelled:  { label: '已取消', cls: 'badge-cancelled' },
}

export default function OrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.getAll({ limit: 20 }),
    refetchInterval: 30_000,
  })

  const orders = data?.data || []

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-display font-bold text-charcoal-900 mb-6">我的訂單</h1>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex justify-between mb-3">
                <div className="h-4 bg-charcoal-100 rounded w-32" />
                <div className="h-6 bg-charcoal-100 rounded-full w-16" />
              </div>
              <div className="h-3 bg-charcoal-100 rounded w-48" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <Package size={64} className="mx-auto text-charcoal-200 mb-4" />
          <h2 className="text-xl font-display font-semibold text-charcoal-700 mb-2">還沒有訂單</h2>
          <p className="text-charcoal-500 mb-6">快去點一份早餐吧！</p>
          <Link to="/" className="btn-primary">瀏覽菜單</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order: any) => {
            const s = STATUS_MAP[order.status] || { label: order.status, cls: 'badge' }
            return (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow group"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="font-semibold text-charcoal-900 text-sm">{order.orderNumber}</span>
                    <span className={s.cls}>{s.label}</span>
                  </div>
                  <p className="text-xs text-charcoal-500">
                    {new Date(order.createdAt).toLocaleString('zh-TW')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-dawn-600">NT$ {order.total}</p>
                </div>
                <ChevronRight size={18} className="text-charcoal-300 group-hover:text-charcoal-600 transition-colors" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
