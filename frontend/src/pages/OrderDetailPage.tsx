import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi } from '../api'
import { ArrowLeft, CheckCircle, Clock, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_STEPS = ['pending', 'preparing', 'ready', 'completed']
const STATUS_LABELS: Record<string, string> = {
  pending: '待確認', preparing: '準備中', ready: '可取餐', completed: '已完成', cancelled: '已取消',
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getById(id!),
    refetchInterval: 15_000,
  })

  const cancelMutation = useMutation({
    mutationFn: () => ordersApi.cancel(id!),
    onSuccess: () => {
      toast.success('訂單已取消')
      qc.invalidateQueries({ queryKey: ['order', id] })
      qc.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || '取消失敗'),
  })

  if (isLoading) return (
    <div className="max-w-lg mx-auto animate-pulse space-y-4">
      <div className="h-8 bg-charcoal-100 rounded w-48" />
      <div className="card h-40" />
      <div className="card h-60" />
    </div>
  )

  if (!order) return (
    <div className="text-center py-20">
      <p className="text-charcoal-500">找不到訂單</p>
      <Link to="/orders" className="btn-primary mt-4 inline-block">返回訂單列表</Link>
    </div>
  )

  const currentStep = STATUS_STEPS.indexOf(order.status)
  const isCancelled = order.status === 'cancelled'
  const canCancel = order.status === 'pending'

  return (
    <div className="max-w-lg mx-auto">
      <button onClick={() => navigate('/orders')} className="flex items-center gap-2 text-charcoal-600 hover:text-charcoal-900 mb-6 transition-colors">
        <ArrowLeft size={18} /> 訂單列表
      </button>

      <div className="card p-5 mb-4">
        <div className="flex items-start justify-between mb-1">
          <h1 className="font-display font-bold text-lg text-charcoal-900">{order.orderNumber}</h1>
          <span className={`badge-${order.status}`}>{STATUS_LABELS[order.status]}</span>
        </div>
        <p className="text-xs text-charcoal-500">{new Date(order.createdAt).toLocaleString('zh-TW')}</p>
      </div>

      {/* Progress */}
      {!isCancelled && (
        <div className="card p-5 mb-4">
          <div className="flex items-center justify-between">
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className="flex items-center">
                <div className={`flex flex-col items-center ${i <= currentStep ? 'text-dawn-600' : 'text-charcoal-300'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    i < currentStep ? 'bg-dawn-500 text-white' :
                    i === currentStep ? 'bg-dawn-100 text-dawn-600 ring-2 ring-dawn-400' :
                    'bg-charcoal-100 text-charcoal-400'
                  }`}>
                    {i < currentStep ? '✓' : i + 1}
                  </div>
                  <span className="text-xs mt-1 whitespace-nowrap">{STATUS_LABELS[step]}</span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`h-0.5 w-8 mx-1 mb-5 ${i < currentStep ? 'bg-dawn-400' : 'bg-charcoal-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Items */}
      <div className="card p-5 mb-4">
        <h2 className="font-semibold text-charcoal-800 mb-3">訂單內容</h2>
        <div className="space-y-2">
          {order.items.map((item: any, i: number) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-charcoal-700">{item.name} × {item.quantity}</span>
              <span className="text-charcoal-900 font-medium">NT$ {item.subtotal}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-charcoal-100 mt-4 pt-4 space-y-1.5">
          <div className="flex justify-between text-sm text-charcoal-600"><span>小計</span><span>NT$ {order.subtotal}</span></div>
          <div className="flex justify-between text-sm text-charcoal-600"><span>稅金</span><span>NT$ {order.tax}</span></div>
          {order.shippingFee > 0 && <div className="flex justify-between text-sm text-charcoal-600"><span>外送費</span><span>NT$ {order.shippingFee}</span></div>}
          <div className="flex justify-between font-bold text-charcoal-900"><span>合計</span><span className="text-dawn-600">NT$ {order.total}</span></div>
        </div>
      </div>

      {/* Info */}
      <div className="card p-5 mb-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-charcoal-500">取餐方式</span><span className="text-charcoal-900">{order.deliveryMethod === 'pickup' ? '自取' : '外送'}</span></div>
          {order.deliveryAddress && <div className="flex justify-between"><span className="text-charcoal-500">配送地址</span><span className="text-charcoal-900">{order.deliveryAddress}</span></div>}
          {order.notes && <div className="flex justify-between"><span className="text-charcoal-500">備註</span><span className="text-charcoal-900">{order.notes}</span></div>}
        </div>
      </div>

      {canCancel && (
        <button
          onClick={() => { if (confirm('確定要取消這筆訂單？')) cancelMutation.mutate() }}
          className="w-full py-3 border-2 border-red-300 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors"
          disabled={cancelMutation.isPending}
        >
          {cancelMutation.isPending ? '取消中...' : '取消訂單'}
        </button>
      )}
    </div>
  )
}
