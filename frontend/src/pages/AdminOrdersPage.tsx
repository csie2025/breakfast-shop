import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../api'
import AdminLayout from '../components/AdminLayout'
import { ChevronRight } from 'lucide-react'

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending:   { label: '待確認', cls: 'badge-pending' },
  preparing: { label: '準備中', cls: 'badge-preparing' },
  ready:     { label: '可取餐', cls: 'badge-ready' },
  completed: { label: '已完成', cls: 'badge-completed' },
  cancelled: { label: '已取消', cls: 'badge-cancelled' },
}

export default function AdminOrdersPage() {
  const [status, setStatus] = useState('')
  const [detail, setDetail] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['adminOrders', status],
    queryFn: () => adminApi.orders.getAll({ status: status || undefined, limit: 50 }),
    refetchInterval: 30_000,
  })

  const orders = data?.data || []

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-charcoal-900">訂單管理</h1>
        <select
          className="input w-40"
          value={status}
          onChange={e => setStatus(e.target.value)}
        >
          <option value="">全部狀態</option>
          {Object.entries(STATUS_MAP).map(([v, { label }]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-charcoal-50 border-b border-charcoal-100">
            <tr>
              {['訂單號', '顧客', '取餐方式', '狀態', '金額', '時間', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-charcoal-600 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-charcoal-100">
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-10 text-charcoal-400">載入中...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-charcoal-400">沒有訂單</td></tr>
            ) : orders.map((order: any) => {
              const s = STATUS_MAP[order.status]
              return (
                <tr key={order.id} className="hover:bg-charcoal-50 cursor-pointer" onClick={() => setDetail(order)}>
                  <td className="px-4 py-3 font-medium text-charcoal-900">{order.orderNumber}</td>
                  <td className="px-4 py-3 text-charcoal-700">{order.customerName}</td>
                  <td className="px-4 py-3 text-charcoal-600">{order.deliveryMethod === 'pickup' ? '自取' : '外送'}</td>
                  <td className="px-4 py-3"><span className={s.cls}>{s.label}</span></td>
                  <td className="px-4 py-3 font-semibold text-dawn-600">NT$ {order.total}</td>
                  <td className="px-4 py-3 text-charcoal-500">{new Date(order.createdAt).toLocaleString('zh-TW')}</td>
                  <td className="px-4 py-3"><ChevronRight size={16} className="text-charcoal-400" /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 bg-charcoal-950/50 flex items-center justify-center z-50 px-4" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="font-display font-bold text-lg mb-1">{detail.orderNumber}</h2>
            <p className="text-sm text-charcoal-500 mb-4">{detail.customerName} · {detail.customerEmail}</p>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between"><span className="text-charcoal-500">狀態</span><span className={STATUS_MAP[detail.status]?.cls}>{STATUS_MAP[detail.status]?.label}</span></div>
              <div className="flex justify-between"><span className="text-charcoal-500">取餐</span><span>{detail.deliveryMethod === 'pickup' ? '自取' : '外送'}</span></div>
              <div className="flex justify-between font-semibold"><span>金額</span><span className="text-dawn-600">NT$ {detail.total}</span></div>
            </div>
            <button onClick={() => setDetail(null)} className="btn-primary w-full">關閉</button>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
