import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight } from 'lucide-react'
import { useCartStore } from '../stores/cartStore'
import toast from 'react-hot-toast'

export default function CartPage() {
  const { items, subtotal, tax, total, fetchCart, updateItem, removeItem, isLoading } = useCartStore()
  const navigate = useNavigate()

  useEffect(() => { fetchCart() }, [])

  const handleUpdate = async (id: string, qty: number) => {
    if (qty < 1) return
    try { await updateItem(id, qty) } catch { toast.error('更新失敗') }
  }

  const handleRemove = async (id: string, name: string) => {
    try { await removeItem(id); toast.success(`已移除 ${name}`) } catch { toast.error('移除失敗') }
  }

  if (items.length === 0) return (
    <div className="text-center py-24">
      <ShoppingCart size={64} className="mx-auto text-charcoal-200 mb-4" />
      <h2 className="text-xl font-display font-semibold text-charcoal-700 mb-2">購物車是空的</h2>
      <p className="text-charcoal-500 mb-6">快去挑選喜歡的早餐吧！</p>
      <Link to="/" className="btn-primary">瀏覽菜單</Link>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-display font-bold text-charcoal-900 mb-6">購物車</h1>

      <div className="space-y-3 mb-6">
        {items.map(item => (
          <div key={item.id} className="card p-4 flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-dawn-50 flex-shrink-0 overflow-hidden">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">🥐</div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-charcoal-900 truncate">{item.name}</h3>
              <p className="text-dawn-600 text-sm font-medium">NT$ {item.price}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleUpdate(item.id, item.quantity - 1)}
                disabled={item.quantity <= 1}
                className="w-7 h-7 rounded-lg border border-charcoal-200 flex items-center justify-center hover:bg-charcoal-50 disabled:opacity-40"
              >
                <Minus size={12} />
              </button>
              <span className="w-8 text-center font-semibold">{item.quantity}</span>
              <button
                onClick={() => handleUpdate(item.id, item.quantity + 1)}
                className="w-7 h-7 rounded-lg border border-charcoal-200 flex items-center justify-center hover:bg-charcoal-50"
              >
                <Plus size={12} />
              </button>
            </div>

            <span className="text-charcoal-700 font-semibold w-20 text-right">NT$ {item.subtotal}</span>

            <button onClick={() => handleRemove(item.id, item.name)} className="text-charcoal-400 hover:text-red-500 transition-colors ml-1">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="card p-6">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-charcoal-600">
            <span>小計</span><span>NT$ {subtotal.toFixed(0)}</span>
          </div>
          <div className="flex justify-between text-charcoal-600">
            <span>稅金 (5%)</span><span>NT$ {tax.toFixed(0)}</span>
          </div>
          <div className="border-t border-charcoal-100 pt-3 mt-3 flex justify-between font-bold text-lg text-charcoal-900">
            <span>合計</span><span className="text-dawn-600">NT$ {total.toFixed(0)}</span>
          </div>
        </div>

        <button onClick={() => navigate('/checkout')} className="btn-primary w-full flex items-center justify-center gap-2">
          前往結帳 <ArrowRight size={18} />
        </button>
        <Link to="/" className="btn-ghost w-full text-center block mt-2">繼續選購</Link>
      </div>
    </div>
  )
}
