import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search, ShoppingCart, Plus } from 'lucide-react'
import { menuApi, cartApi } from '../api'
import { useAuthStore } from '../stores/authStore'
import { useCartStore } from '../stores/cartStore'
import toast from 'react-hot-toast'

const CATEGORIES = ['全部', '蛋餅類', '吐司類', '燒餅類', '飯類', '飲料類', '加點類']

export default function MenuPage() {
  const [category, setCategory] = useState('全部')
  const [search, setSearch] = useState('')
  const { user } = useAuthStore()
  const { fetchCart } = useCartStore()

  const { data, isLoading } = useQuery({
    queryKey: ['menu', category, search],
    queryFn: async () => {
      if (search) {
        return menuApi.search(search)
      }
      return menuApi.getAll({
        category: category === '全部' ? undefined : category,
        limit: 50,
      })
    },
  })

  const items = data?.data || []

  const handleAddToCart = async (menuItemId: string, name: string) => {
    if (!user) {
      toast.error('請先登入才能加入購物車')
      return
    }
    try {
      await cartApi.add({ menuItemId, quantity: 1 })
      await fetchCart()
      toast.success(`已將 ${name} 加入購物車`)
    } catch {
      toast.error('加入失敗，請重試')
    }
  }

  return (
    <div>
      {/* Hero */}
      <div className="mb-8 text-center py-6">
        <h1 className="text-4xl font-display font-bold text-charcoal-900 mb-2">今日菜單</h1>
        <p className="text-charcoal-500">新鮮現做，用心料理每一份早餐</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-400" />
        <input
          type="text"
          placeholder="搜尋餐點..."
          value={search}
          onChange={e => { setSearch(e.target.value); if (e.target.value) setCategory('全部') }}
          className="input pl-11"
        />
      </div>

      {/* Category filter */}
      {!search && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                category === cat
                  ? 'bg-dawn-500 text-white shadow-sm'
                  : 'bg-white text-charcoal-600 hover:bg-charcoal-50 border border-charcoal-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="bg-charcoal-100 h-44 w-full" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-charcoal-100 rounded w-3/4" />
                <div className="h-3 bg-charcoal-100 rounded w-full" />
                <div className="h-4 bg-charcoal-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-charcoal-400">
          <div className="text-5xl mb-4">🍽️</div>
          <p className="text-lg">找不到相關餐點</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item: any) => (
            <div key={item.id} className="card group hover:shadow-md transition-shadow">
              <Link to={`/menu/${item.id}`}>
                <div className="relative overflow-hidden bg-dawn-50 h-44">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">
                      🥐
                    </div>
                  )}
                  {!item.available && (
                    <div className="absolute inset-0 bg-charcoal-900/50 flex items-center justify-center">
                      <span className="text-white font-medium text-sm bg-charcoal-900/70 px-3 py-1 rounded-full">售完</span>
                    </div>
                  )}
                  <span className="absolute top-2 left-2 bg-white/90 backdrop-blur text-dawn-700 text-xs font-medium px-2 py-1 rounded-lg">
                    {item.category}
                  </span>
                </div>
              </Link>
              <div className="p-4">
                <Link to={`/menu/${item.id}`}>
                  <h3 className="font-semibold text-charcoal-900 group-hover:text-dawn-600 transition-colors">{item.name}</h3>
                  <p className="text-xs text-charcoal-500 mt-1 line-clamp-2">{item.description}</p>
                </Link>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-dawn-600 font-bold">NT$ {item.price}</span>
                  <button
                    onClick={() => handleAddToCart(item.id, item.name)}
                    disabled={!item.available}
                    className="w-8 h-8 bg-dawn-500 hover:bg-dawn-600 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-90"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
