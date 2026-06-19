import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Minus, Plus, ShoppingCart } from 'lucide-react'
import { menuApi } from '../api'
import { useCartStore } from '../stores/cartStore'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

export default function MenuDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [qty, setQty] = useState(1)
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { addItem } = useCartStore()

  const { data: item, isLoading, error } = useQuery({
    queryKey: ['menuItem', id],
    queryFn: () => menuApi.getById(id!),
    enabled: !!id,
  })

  const handleAdd = async () => {
    if (!user) { toast.error('請先登入'); return }
    try {
      await addItem(id!, qty)
      toast.success(`已加入 ${qty} 份 ${item.name}`)
      navigate('/cart')
    } catch {
      toast.error('加入失敗')
    }
  }

  if (isLoading) return (
    <div className="max-w-lg mx-auto animate-pulse">
      <div className="bg-charcoal-100 h-72 rounded-2xl mb-6" />
      <div className="space-y-3">
        <div className="h-8 bg-charcoal-100 rounded w-1/2" />
        <div className="h-4 bg-charcoal-100 rounded" />
        <div className="h-4 bg-charcoal-100 rounded w-3/4" />
      </div>
    </div>
  )

  if (error || !item) return (
    <div className="text-center py-20">
      <p className="text-charcoal-500">找不到此餐點</p>
      <Link to="/" className="btn-primary mt-4 inline-block">返回菜單</Link>
    </div>
  )

  return (
    <div className="max-w-lg mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-charcoal-600 hover:text-charcoal-900 mb-6 transition-colors">
        <ArrowLeft size={18} /> 返回
      </button>

      <div className="card overflow-hidden">
        <div className="bg-dawn-50 h-72 flex items-center justify-center">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-8xl">🥐</span>
          )}
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-xs font-medium text-dawn-600 bg-dawn-50 px-2 py-1 rounded-lg">{item.category}</span>
              <h1 className="text-2xl font-display font-bold text-charcoal-900 mt-2">{item.name}</h1>
            </div>
            <span className="text-2xl font-bold text-dawn-600">NT$ {item.price}</span>
          </div>

          <p className="text-charcoal-600 leading-relaxed mb-5">{item.description}</p>

          {item.ingredients && item.ingredients.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-charcoal-700 mb-2">食材</h3>
              <div className="flex flex-wrap gap-1.5">
                {item.ingredients.map((ing: string) => (
                  <span key={ing} className="text-xs bg-charcoal-100 text-charcoal-700 px-2.5 py-1 rounded-full">{ing}</span>
                ))}
              </div>
            </div>
          )}

          {item.available ? (
            <>
              <div className="flex items-center gap-4 mb-5">
                <span className="text-sm font-medium text-charcoal-700">數量</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="w-9 h-9 rounded-xl border-2 border-charcoal-200 flex items-center justify-center hover:border-dawn-400 transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-8 text-center font-semibold text-lg">{qty}</span>
                  <button
                    onClick={() => setQty(qty + 1)}
                    className="w-9 h-9 rounded-xl border-2 border-charcoal-200 flex items-center justify-center hover:border-dawn-400 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <span className="ml-auto font-bold text-dawn-600">小計 NT$ {Number(item.price) * qty}</span>
              </div>

              <button onClick={handleAdd} className="btn-primary w-full flex items-center justify-center gap-2">
                <ShoppingCart size={18} /> 加入購物車
              </button>
            </>
          ) : (
            <div className="text-center py-4 bg-charcoal-100 rounded-xl text-charcoal-500 font-medium">
              此餐點目前售完
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
