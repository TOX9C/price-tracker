import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Analytics } from '@vercel/analytics/react'
import { Toaster } from '@/components/ui/sonner'
import { queryClient } from '@/lib/query-client'
import { useAuthStore } from '@/stores/auth-store'
import { initializeTheme } from '@/stores/ui-store'

// Layouts
import { AuthLayout } from '@/pages/auth/layout'
import { AppLayout } from '@/components/layout/app-layout'

// Pages
import { LoginPage } from '@/pages/auth/login'
import { RegisterPage } from '@/pages/auth/register'
import { DashboardPage } from '@/pages/dashboard'
import { ItemPage } from '@/pages/item/[id]'
import { SettingsPage } from '@/pages/settings'
import { LandingPage } from '@/pages/landing'

// Components
import { AddItemModal } from '@/components/shared/add-item-modal'

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  const [isInitializing, setIsInitializing] = useState(true)

  // Initialize theme on mount
  useEffect(() => {
    initializeTheme()
  }, [])

  // Handle auth logout events from API client
  useEffect(() => {
    const handleLogout = () => {
      useAuthStore.getState().logout()
    }

    window.addEventListener('auth:logout', handleLogout)
    return () => window.removeEventListener('auth:logout', handleLogout)
  }, [])

  // Short delay for initial load
  useEffect(() => {
    const timer = setTimeout(() => setIsInitializing(false), 500)
    return () => clearTimeout(timer)
  }, [])

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />

          {/* Auth routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Protected routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/items/:id" element={<ItemPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <AddItemModal />
      <Toaster />
      <Analytics />
    </QueryClientProvider>
  )
}

export default App
