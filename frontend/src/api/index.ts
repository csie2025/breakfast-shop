import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  }
)

// ─── Auth ────────────────────────────────────────────────────────────
export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data).then(r => r.data),
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register', data).then(r => r.data),
  getUser: () => api.get('/auth/user').then(r => r.data),
  updateUser: (data: { name?: string; phone?: string }) =>
    api.put('/auth/user', data).then(r => r.data),
  logout: () => api.post('/auth/logout').then(r => r.data),
}

// ─── Menu ────────────────────────────────────────────────────────────
export const menuApi = {
  getAll: (params?: { category?: string; limit?: number; offset?: number }) =>
    api.get('/menu', { params }).then(r => r.data),
  getById: (id: string) => api.get(`/menu/${id}`).then(r => r.data),
  search: (q: string) => api.get('/menu/search', { params: { q } }).then(r => r.data),
}

// ─── Cart ────────────────────────────────────────────────────────────
export const cartApi = {
  get: () => api.get('/cart').then(r => r.data),
  add: (data: { menuItemId: string; quantity: number }) =>
    api.post('/cart', data).then(r => r.data),
  update: (itemId: string, quantity: number) =>
    api.put(`/cart/${itemId}`, { quantity }).then(r => r.data),
  remove: (itemId: string) => api.delete(`/cart/${itemId}`),
  clear: () => api.delete('/cart'),
}

// ─── Orders ──────────────────────────────────────────────────────────
export const ordersApi = {
  create: (data: {
    items: { menuItemId: string; quantity: number }[]
    deliveryAddress?: string
    deliveryMethod?: 'pickup' | 'delivery'
    paymentMethod?: string
    notes?: string
  }) => api.post('/orders', data).then(r => r.data),
  getAll: (params?: { status?: string; limit?: number; offset?: number }) =>
    api.get('/orders', { params }).then(r => r.data),
  getById: (id: string) => api.get(`/orders/${id}`).then(r => r.data),
  cancel: (id: string) => api.put(`/orders/${id}/cancel`).then(r => r.data),
  getStatus: (id: string) => api.get(`/orders/${id}/status`).then(r => r.data),
}

// ─── Kitchen ─────────────────────────────────────────────────────────
export const kitchenApi = {
  getOrders: (params?: { status?: string }) =>
    api.get('/kitchen/orders', { params }).then(r => r.data),
  updateStatus: (id: string, status: string) =>
    api.put(`/kitchen/orders/${id}/status`, { status }).then(r => r.data),
}

// ─── Admin ───────────────────────────────────────────────────────────
export const adminApi = {
  menu: {
    getAll: (params?: { limit?: number; offset?: number; category?: string }) =>
      api.get('/admin/menu', { params }).then(r => r.data),
    create: (data: any) => api.post('/admin/menu', data).then(r => r.data),
    update: (id: string, data: any) => api.put(`/admin/menu/${id}`, data).then(r => r.data),
    delete: (id: string) => api.delete(`/admin/menu/${id}`),
  },
  orders: {
    getAll: (params?: any) => api.get('/admin/orders', { params }).then(r => r.data),
    getById: (id: string) => api.get(`/admin/orders/${id}`).then(r => r.data),
  },
  stats: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/admin/stats', { params }).then(r => r.data),
}
