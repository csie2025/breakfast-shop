import { create } from 'zustand'
import { cartApi } from '../api'

interface CartItem {
  id: string
  menuItemId: string
  name: string
  price: number
  quantity: number
  subtotal: number
  imageUrl?: string
}

interface CartState {
  items: CartItem[]
  subtotal: number
  tax: number
  shippingFee: number
  total: number
  isLoading: boolean
  fetchCart: () => Promise<void>
  addItem: (menuItemId: string, quantity?: number) => Promise<void>
  updateItem: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  clearCart: () => Promise<void>
  itemCount: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  subtotal: 0,
  tax: 0,
  shippingFee: 0,
  total: 0,
  isLoading: false,

  fetchCart: async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    set({ isLoading: true })
    try {
      const cart = await cartApi.get()
      set({
        items: cart.items || [],
        subtotal: cart.subtotal,
        tax: cart.tax,
        shippingFee: cart.shippingFee,
        total: cart.total,
        isLoading: false,
      })
    } catch {
      set({ isLoading: false })
    }
  },

  addItem: async (menuItemId, quantity = 1) => {
    await cartApi.add({ menuItemId, quantity })
    await get().fetchCart()
  },

  updateItem: async (itemId, quantity) => {
    await cartApi.update(itemId, quantity)
    await get().fetchCart()
  },

  removeItem: async (itemId) => {
    await cartApi.remove(itemId)
    await get().fetchCart()
  },

  clearCart: async () => {
    await cartApi.clear()
    set({ items: [], subtotal: 0, tax: 0, shippingFee: 0, total: 0 })
  },

  itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}))
