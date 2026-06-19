import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './stores/authStore'

// Pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import MenuPage from './pages/MenuPage'
import MenuDetailPage from './pages/MenuDetailPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrdersPage from './pages/OrdersPage'
import OrderDetailPage from './pages/OrderDetailPage'
import KitchenPage from './pages/KitchenPage'
import AdminMenuPage from './pages/AdminMenuPage'
import AdminOrdersPage from './pages/AdminOrdersPage'
import AdminStatsPage from './pages/AdminStatsPage'
import Layout from './components/Layout'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string }) {
  const { user, token } = useAuthStore()
  if (!token) return <Navigate to="/auth/login" replace />
  if (role && user?.role !== role && !(role === 'STAFF' && user?.role === 'ADMIN')) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

export default function App() {
  const { loadUser, token } = useAuthStore()

  useEffect(() => {
    if (token) loadUser()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { fontFamily: 'Noto Sans TC, sans-serif', borderRadius: '12px' },
          }}
        />
        <Routes>
          {/* Auth */}
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />

          {/* Customer App */}
          <Route path="/" element={<Layout />}>
            <Route index element={<MenuPage />} />
            <Route path="menu/:id" element={<MenuDetailPage />} />
            <Route path="cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
            <Route path="checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
            <Route path="orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
            <Route path="orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
          </Route>

          {/* Kitchen */}
          <Route path="/kitchen" element={<ProtectedRoute role="STAFF"><KitchenPage /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin/menu" element={<ProtectedRoute role="ADMIN"><AdminMenuPage /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute role="ADMIN"><AdminOrdersPage /></ProtectedRoute>} />
          <Route path="/admin/stats" element={<ProtectedRoute role="ADMIN"><AdminStatsPage /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
