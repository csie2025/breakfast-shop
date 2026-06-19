import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../stores/cartStore'
import { ordersApi } from '../api'
import toast from 'react-hot-toast'
import { CreditCard, MapPin, Package } from 'lucide-react'

export default function CheckoutPage() {
  const { items, subtotal, tax, total, fetchCart } = useCartStore()
  const navigate = useNavigate()
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup')
  const [address, setAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('mock')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => { fetchCart() }, [])

  const shippingFee = deliveryMethod === 'delivery' ? 30 : 0
  const grandTotal = subtotal + tax + shippingFee

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (deliveryMethod === 'delivery' && !address.trim()) {
      toast.error('請填寫配送地址')
      return
    }
    if (items.length === 0) { toast.error('購物車是空的'); return }

    setIsSubmitting(true)
    try {
      const order = await ordersApi.create({
        items: items.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        deliveryAddress: address || undefined,
        deliveryMethod,
        paymentMethod,
        notes: notes || undefined,
      })
      toast.success('訂單建立成功！')
      navigate(`/orders/${order.id}`)
    } catch (err: any) {
      toast.error(err?.response?.data?.error || '建立訂單失敗')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (items.length === 0) {
    navigate('/cart')
    return null
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-display font-bold text-charcoal-900 mb-6">確認訂單</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Order summary */}
        <div className="card p-5">
          <h2 className="font-semibold text-charcoal-800 mb-3 flex items-center gap-2"><Package size={18} /> 訂單內容</h2>
          <div className="space-y-2">
            {items.map(i => (
              <div key={i.id} className="flex justify-between text-sm text-charcoal-700">
                <span>{i.name} × {i.quantity}</span>
                <span>NT$ {i.subtotal}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery */}
        <div className="card p-5">
          <h2 className="font-semibold text-charcoal-800 mb-3 flex items-center gap-2"><MapPin size={18} /> 取餐方式</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {(['pickup', 'delivery'] as const).map(m => (
              <label
                key={m}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  deliveryMethod === m ? 'border-dawn-500 bg-dawn-50 text-dawn-700' : 'border-charcoal-200 text-charcoal-600'
                }`}
              >
                <input type="radio" className="hidden" value={m} checked={deliveryMethod === m} onChange={() => setDeliveryMethod(m)} />
                <span>{m === 'pickup' ? '🏪 自取' : '🛵 外送 (+NT$30)'}</span>
              </label>
            ))}
          </div>
          {deliveryMethod === 'delivery' && (
            <input
              type="text"
              placeholder="請輸入外送地址"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="input"
              required
            />
          )}
        </div>

        {/* Payment */}
        <div className="card p-5">
          <h2 className="font-semibold text-charcoal-800 mb-3 flex items-center gap-2"><CreditCard size={18} /> 付款方式</h2>
          <div className="space-y-2">
            {[
              { value: 'mock', label: '💳 線上付款（模擬）' },
              { value: 'cash', label: '💵 現金付款' },
            ].map(opt => (
              <label
                key={opt.value}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === opt.value ? 'border-dawn-500 bg-dawn-50' : 'border-charcoal-200'
                }`}
              >
                <input type="radio" value={opt.value} checked={paymentMethod === opt.value} onChange={() => setPaymentMethod(opt.value)} />
                <span className="text-sm">{opt.label}</span>
                {opt.value === 'mock' && <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">即時確認</span>}
              </label>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="card p-5">
          <h2 className="font-semibold text-charcoal-800 mb-3">備註 <span className="font-normal text-charcoal-400 text-sm">(選填)</span></h2>
          <textarea
            placeholder="特殊需求、過敏原提醒..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="input resize-none h-24"
          />
        </div>

        {/* Total */}
        <div className="card p-5">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-charcoal-600 text-sm"><span>小計</span><span>NT$ {subtotal.toFixed(0)}</span></div>
            <div className="flex justify-between text-charcoal-600 text-sm"><span>稅金</span><span>NT$ {tax.toFixed(0)}</span></div>
            {shippingFee > 0 && <div className="flex justify-between text-charcoal-600 text-sm"><span>外送費</span><span>NT$ {shippingFee}</span></div>}
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-charcoal-100">
              <span>總計</span><span className="text-dawn-600">NT$ {grandTotal.toFixed(0)}</span>
            </div>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
            {isSubmitting ? '處理中...' : `確認下單 NT$ ${grandTotal.toFixed(0)}`}
          </button>
        </div>
      </form>
    </div>
  )
}
