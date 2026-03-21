# PriceHawk Frontend Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete React web application for PriceHawk including marketing landing page and authenticated dashboard experience.

**Architecture:** React SPA with Vite build tooling. Uses shadcn/ui components with Tailwind CSS styling. React Query manages server state with caching and optimistic updates. Zustand handles client-side UI state. Protected routes gate access to authenticated pages.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, @tanstack/react-query, zustand, Recharts, react-router-dom v7

---

## File Structure

```
web/
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn components (auto-generated)
│   │   ├── layout/
│   │   │   ├── header.tsx         # Main app header with nav
│   │   │   ├── footer.tsx         # Landing page footer
│   │   │   ├── mobile-nav.tsx     # Mobile drawer navigation
│   │   │   └── app-layout.tsx     # Wrapper for authenticated pages
│   │   └── shared/
│   │       ├── item-card.tsx      # Dashboard item card
│   │       ├── notification-bell.tsx
│   │       ├── price-display.tsx  # Formatted price with trend
│   │       └── empty-state.tsx    # Reusable empty state
│   ├── pages/
│   │   ├── landing/
│   │   │   └── index.tsx          # Marketing landing page
│   │   ├── auth/
│   │   │   ├── login.tsx
│   │   │   ├── register.tsx
│   │   │   └── layout.tsx         # Shared auth page layout
│   │   ├── dashboard/
│   │   │   └── index.tsx          # Main dashboard
│   │   ├── item/
│   │   │   └── [id].tsx           # Item detail page
│   │   ├── add-item/
│   │   │   └── index.tsx          # Add item modal/flow
│   │   └── settings/
│   │       └── index.tsx          # Settings page
│   ├── hooks/
│   │   ├── use-auth.ts            # Auth state hook
│   │   ├── use-items.ts           # Items list with infinite scroll
│   │   ├── use-item.ts            # Single item fetch
│   │   ├── use-notifications.ts   # Notifications polling
│   │   └── use-price-history.ts   # Price history for charts
│   ├── lib/
│   │   ├── api.ts                 # Ky HTTP client instance
│   │   ├── utils.ts               # cn helper, formatters
│   │   └── query-client.ts        # React Query client config
│   ├── stores/
│   │   ├── auth-store.ts          # Auth state (user, tokens)
│   │   └── ui-store.ts            # UI state (theme, modals)
│   ├── types/
│   │   └── index.ts               # Shared TypeScript types
│   ├── App.tsx                    # Root component with router
│   ├── main.tsx                   # Entry point
│   └── index.css                  # Tailwind imports + custom styles
├── public/
│   └── favicon.ico
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.ts
```

---

## Task 1: Vite Project Setup

**Files:**
- Create: `web/package.json`
- Create: `web/tsconfig.json`
- Create: `web/vite.config.ts`
- Create: `web/tailwind.config.js`
- Create: `web/postcss.config.js`
- Create: `web/index.html`
- Create: `web/src/main.tsx`
- Create: `web/src/App.tsx`
- Create: `web/src/index.css`

- [ ] **Step 1: Create web directory and initialize Vite project**

Run these commands from project root:
```bash
cd /Users/apollo/Documents/github/price-tracker
mkdir -p web
cd web
npm create vite@latest . -- --template react-ts
```

- [ ] **Step 2: Install core dependencies**

```bash
npm install react-router-dom@7 @tanstack/react-query zustand ky sonner
```

- [ ] **Step 3: Install Tailwind CSS**

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Step 4: Configure Tailwind**

Update `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        headline: ['Outfit', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#0D9488',
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0D9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        accent: {
          DEFAULT: '#F59E0B',
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#F59E0B',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 5: Add Tailwind directives to CSS**

Update `src/index.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: 'Outfit', sans-serif;
  }
}
```

- [ ] **Step 6: Update vite.config.ts for API proxy**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 7: Create minimal App.tsx**

Update `src/App.tsx`:
```tsx
function App() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <h1 className="font-headline text-4xl text-primary p-8">
        PriceHawk
      </h1>
      <p className="font-body text-slate-600 p-4">
        Frontend setup complete
      </p>
    </div>
  )
}

export default App
```

- [ ] **Step 8: Verify build works**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 9: Verify dev server starts**

Run: `npm run dev`
Expected: Dev server starts on http://localhost:5173

- [ ] **Step 10: Commit**

```bash
git add web/
git commit -m "feat(web): initialize Vite project with Tailwind CSS"
```

---

## Task 2: shadcn/ui Setup

**Files:**
- Create: `web/components.json`
- Create: `web/src/components/ui/button.tsx`
- Create: `web/src/components/ui/card.tsx`
- Create: `web/src/components/ui/input.tsx`
- Create: `web/src/components/ui/label.tsx`
- Create: `web/src/lib/utils.ts`

- [ ] **Step 1: Initialize shadcn/ui**

```bash
cd web
npx shadcn@latest init
```

When prompted:
- Style: Default
- Base color: Slate
- CSS variables: Yes

- [ ] **Step 2: Install core shadcn components**

```bash
npx shadcn@latest add button card input label dialog sheet dropdown-menu avatar toast skeleton tabs separator badge
```

- [ ] **Step 3: Verify components exist**

Run: `ls src/components/ui/`
Expected: See button.tsx, card.tsx, input.tsx, etc.

- [ ] **Step 4: Test component import**

Add to `src/App.tsx` temporarily:
```tsx
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function App() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Test Card</CardTitle>
        </CardHeader>
        <CardContent>
          <Button>Click me</Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 5: Verify dev server renders components**

Run: `npm run dev`
Open: http://localhost:5173
Expected: Card with button renders correctly

- [ ] **Step 6: Commit**

```bash
git add web/
git commit -m "feat(web): add shadcn/ui components"
```

---

## Task 3: API Client and Types

**Files:**
- Create: `web/src/lib/utils.ts`
- Create: `web/src/lib/api.ts`
- Create: `web/src/lib/query-client.ts`
- Create: `web/src/types/index.ts`

- [ ] **Step 1: Create utils file with cn helper**

Create `src/lib/utils.ts`:
```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price)
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return then.toLocaleDateString()
}

export function formatPercentDrop(oldPrice: number, newPrice: number): string {
  const drop = ((oldPrice - newPrice) / oldPrice) * 100
  return `${drop.toFixed(1)}%`
}
```

Install clsx and tailwind-merge:
```bash
npm install clsx tailwind-merge
```

- [ ] **Step 2: Create API client**

Create `src/lib/api.ts`:
```typescript
import ky from 'ky'

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

export const api = ky.create({
  prefixUrl: API_BASE,
  credentials: 'include',
  hooks: {
    beforeRequest: [
      (request) => {
        // Add any auth headers if needed
      },
    ],
    afterResponse: [
      async (request, options, response) => {
        if (response.status === 401) {
          // Trigger logout event
          window.dispatchEvent(new CustomEvent('auth:logout'))
        }
        return response
      },
    ],
  },
})

export default api
```

- [ ] **Step 3: Create React Query client**

Create `src/lib/query-client.ts`:
```typescript
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
```

- [ ] **Step 4: Create types**

Create `src/types/index.ts`:
```typescript
export interface User {
  id: string
  email: string
  created_at: string
  notification_preferences: NotificationPreferences
}

export interface NotificationPreferences {
  email_enabled: boolean
  push_enabled: boolean
  notify_on_drop_percentage: number
  quiet_hours_start: string | null
  quiet_hours_end: string | null
}

export interface Item {
  id: string
  name: string
  image_url: string | null
  category: string | null
  best_price: number | null
  best_store: string | null
  url_count: number
}

export interface ItemDetail extends Item {
  urls: TrackedUrl[]
}

export interface TrackedUrl {
  id: string
  url: string
  store_name: string | null
  current_price: number | null
  currency: string
  availability: 'in_stock' | 'out_of_stock' | 'hidden_price' | 'unknown'
  last_checked: string | null
  extraction_method: string | null
}

export interface PriceHistory {
  id: string
  tracked_url_id: string
  price: number
  currency: string
  checked_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  message: string
  data: Record<string, unknown> | null
  sent_at: string
  read_at: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  next_cursor: string | null
}

export interface ApiError {
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npm run build`
Expected: No TypeScript errors

- [ ] **Step 6: Commit**

```bash
git add web/src/lib web/src/types
git commit -m "feat(web): add API client and shared types"
```

---

## Task 4: Zustand Stores

**Files:**
- Create: `web/src/stores/auth-store.ts`
- Create: `web/src/stores/ui-store.ts`

- [ ] **Step 1: Create auth store**

Create `src/stores/auth-store.ts`:
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated }),
    }
  )
)
```

- [ ] **Step 2: Create UI store**

Create `src/stores/ui-store.ts`:
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

interface UIState {
  theme: Theme
  sidebarOpen: boolean
  addItemModalOpen: boolean
  setTheme: (theme: Theme) => void
  setSidebarOpen: (open: boolean) => void
  setAddItemModalOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarOpen: false,
      addItemModalOpen: false,
      setTheme: (theme) => set({ theme }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setAddItemModalOpen: (open) => set({ addItemModalOpen: open }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
)

// Theme initialization helper
export function initializeTheme() {
  const { theme } = useUIStore.getState()
  const root = document.documentElement

  if (theme === 'system') {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', systemDark)
  } else {
    root.classList.toggle('dark', theme === 'dark')
  }
}
```

- [ ] **Step 3: Verify stores compile**

Run: `npm run build`
Expected: No TypeScript errors

- [ ] **Step 4: Commit**

```bash
git add web/src/stores
git commit -m "feat(web): add Zustand stores for auth and UI state"
```

---

## Task 5: React Query Hooks

**Files:**
- Create: `web/src/hooks/use-auth.ts`
- Create: `web/src/hooks/use-items.ts`
- Create: `web/src/hooks/use-item.ts`
- Create: `web/src/hooks/use-notifications.ts`

- [ ] **Step 1: Create auth hook**

Create `src/hooks/use-auth.ts`:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import type { User } from '@/types'

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterCredentials extends LoginCredentials {
  confirmPassword: string
}

export function useAuth() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, setUser, logout: storeLogout } = useAuthStore()

  // Get current user
  const { isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const response = await api.get('auth/me').json<{ data: User }>()
        setUser(response.data)
        return response.data
      } catch {
        setUser(null)
        return null
      }
    },
    retry: false,
  })

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await api.post('auth/login', {
        json: credentials,
      }).json<{ data: { user: User } }>()
      return response.data.user
    },
    onSuccess: (user) => {
      setUser(user)
      queryClient.invalidateQueries({ queryKey: ['auth'] })
      navigate('/dashboard')
    },
  })

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      const response = await api.post('auth/register', {
        json: {
          email: credentials.email,
          password: credentials.password,
        },
      }).json<{ data: { user: User } }>()
      return response.data.user
    },
    onSuccess: (user) => {
      setUser(user)
      queryClient.invalidateQueries({ queryKey: ['auth'] })
      navigate('/dashboard')
    },
  })

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await api.post('auth/logout')
    },
    onSuccess: () => {
      storeLogout()
      queryClient.clear()
      navigate('/login')
    },
  })

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    loginError: loginMutation.error,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    registerError: registerMutation.error,
    isRegistering: registerMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  }
}
```

- [ ] **Step 2: Create items hook**

Create `src/hooks/use-items.ts`:
```typescript
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Item, PaginatedResponse } from '@/types'

interface ItemsResponse {
  items: Item[]
  next_cursor: string | null
}

export function useItems() {
  const queryClient = useQueryClient()

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['items'],
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam ? `?cursor=${pageParam}` : ''
      const response = await api.get(`items${cursor}`).json<ItemsResponse>()
      return response
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor || null,
  })

  const items = data?.pages.flatMap((page) => page.items) ?? []

  // Add item mutation
  const addMutation = useMutation({
    mutationFn: async (data: {
      name: string
      urls: string[]
      category?: string
      image_url?: string
    }) => {
      const response = await api.post('items', { json: data }).json<{ data: Item }>()
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })

  // Delete item mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`items/${id}`)
      return id
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.removeQueries({ queryKey: ['item', id] })
    },
  })

  return {
    items,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    addItem: addMutation.mutate,
    isAddingItem: addMutation.isPending,
    addError: addMutation.error,
    deleteItem: deleteMutation.mutate,
    isDeletingItem: deleteMutation.isPending,
  }
}
```

- [ ] **Step 3: Create single item hook**

Create `src/hooks/use-item.ts`:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { ItemDetail, TrackedUrl } from '@/types'

export function useItem(id: string) {
  const queryClient = useQueryClient()

  const { data: item, isLoading, error } = useQuery({
    queryKey: ['item', id],
    queryFn: async () => {
      const response = await api.get(`items/${id}`).json<{ data: ItemDetail }>()
      return response.data
    },
    enabled: !!id,
  })

  // Add URL mutation
  const addUrlMutation = useMutation({
    mutationFn: async ({ url, storeName }: { url: string; storeName?: string }) => {
      const response = await api.post(`items/${id}/urls`, {
        json: { url, storeName },
      }).json<{ data: TrackedUrl }>()
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item', id] })
    },
  })

  // Remove URL mutation
  const removeUrlMutation = useMutation({
    mutationFn: async (urlId: string) => {
      await api.delete(`items/${id}/urls/${urlId}`)
      return urlId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item', id] })
    },
  })

  // Manual check mutation
  const checkMutation = useMutation({
    mutationFn: async () => {
      await api.post(`items/${id}/check`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item', id] })
    },
  })

  return {
    item,
    isLoading,
    error,
    addUrl: addUrlMutation.mutate,
    isAddingUrl: addUrlMutation.isPending,
    removeUrl: removeUrlMutation.mutate,
    isRemovingUrl: removeUrlMutation.isPending,
    checkPrice: checkMutation.mutate,
    isCheckingPrice: checkMutation.isPending,
  }
}
```

- [ ] **Step 4: Create notifications hook**

Create `src/hooks/use-notifications.ts`:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Notification } from '@/types'

interface NotificationsResponse {
  notifications: Notification[]
  next_cursor: string | null
}

export function useNotifications() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('notifications').json<NotificationsResponse>()
      return response
    },
    refetchInterval: 60000, // Poll every 60 seconds
    staleTime: 30000,
  })

  const notifications = data?.notifications ?? []
  const unreadCount = notifications.filter((n) => !n.read_at).length

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`notifications/${id}/read`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: markAsReadMutation.mutate,
  }
}
```

- [ ] **Step 5: Verify hooks compile**

Run: `npm run build`
Expected: No TypeScript errors

- [ ] **Step 6: Commit**

```bash
git add web/src/hooks
git commit -m "feat(web): add React Query hooks for auth, items, notifications"
```

---

## Task 6: Routing Setup

**Files:**
- Modify: `web/src/App.tsx`
- Create: `web/src/components/layout/app-layout.tsx`
- Create: `web/src/components/layout/header.tsx`
- Create: `web/src/pages/auth/layout.tsx`

- [ ] **Step 1: Install router**

```bash
npm install react-router-dom@7
```

- [ ] **Step 2: Create auth layout**

Create `src/pages/auth/layout.tsx`:
```tsx
import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="text-3xl font-headline font-bold text-primary">
            PriceHawk
          </a>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create app layout**

Create `src/components/layout/app-layout.tsx`:
```tsx
import { Outlet } from 'react-router-dom'
import { Header } from './header'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Create header component**

Create `src/components/layout/header.tsx`:
```tsx
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useNotifications } from '@/hooks/use-notifications'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bell, User, LogOut, Settings, Menu } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/items', label: 'Items' },
  { href: '/settings', label: 'Settings' },
]

export function Header() {
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const location = useLocation()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-slate-900/95 dark:border-slate-800">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="text-xl font-headline font-bold text-primary">
            PriceHawk
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  location.pathname === item.href
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent text-white text-xs flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-2 py-1.5 text-sm font-medium">
                {user?.email}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile menu */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 5: Install lucide-react for icons**

```bash
npm install lucide-react
```

- [ ] **Step 6: Update App.tsx with router**

Update `src/App.tsx`:
```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { queryClient } from '@/lib/query-client'
import { useAuthStore } from '@/stores/auth-store'
import { initializeTheme } from '@/stores/ui-store'

// Layouts
import { AuthLayout } from '@/pages/auth/layout'
import { AppLayout } from '@/components/layout/app-layout'

// Pages (placeholders for now)
import { LoginPage } from '@/pages/auth/login'
import { RegisterPage } from '@/pages/auth/register'
import { DashboardPage } from '@/pages/dashboard'
import { ItemPage } from '@/pages/item'
import { SettingsPage } from '@/pages/settings'
import { LandingPage } from '@/pages/landing'

// Initialize theme
initializeTheme()

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
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
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/items/:id" element={<ItemPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  )
}

export default App
```

- [ ] **Step 7: Create placeholder pages**

Create minimal placeholder files for each page referenced in App.tsx:
- `src/pages/auth/login.tsx`
- `src/pages/auth/register.tsx`
- `src/pages/dashboard/index.tsx`
- `src/pages/item/[id].tsx`
- `src/pages/settings/index.tsx`
- `src/pages/landing/index.tsx`

Each with a simple export:
```tsx
export function LoginPage() {
  return <div>Login Page</div>
}
```

- [ ] **Step 8: Verify build**

Run: `npm run build`
Expected: No TypeScript errors

- [ ] **Step 9: Commit**

```bash
git add web/src
git commit -m "feat(web): add routing with protected routes and layouts"
```

---

## Task 7: Auth Pages (Login/Register)

**Files:**
- Modify: `web/src/pages/auth/login.tsx`
- Modify: `web/src/pages/auth/register.tsx`

- [ ] **Step 1: Create login page**

Update `src/pages/auth/login.tsx`:
```tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export function LoginPage() {
  const { login, isLoggingIn, loginError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    login({ email, password })
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-headline">Welcome back</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {loginError && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
              Invalid email or password
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoggingIn}>
            {isLoggingIn ? 'Signing in...' : 'Sign in'}
          </Button>
          <p className="text-sm text-center text-slate-600 dark:text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
```

- [ ] **Step 2: Create register page**

Update `src/pages/auth/register.tsx`:
```tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export function RegisterPage() {
  const { register, isRegistering, registerError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    register({ email, password, confirmPassword })
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-headline">Create an account</CardTitle>
        <CardDescription>
          Start tracking prices across your favorite stores
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {(error || registerError) && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
              {error || 'Failed to create account'}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            <p className="text-xs text-slate-500">Must be at least 8 characters</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isRegistering}>
            {isRegistering ? 'Creating account...' : 'Create account'}
          </Button>
          <p className="text-sm text-center text-slate-600 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: No TypeScript errors

- [ ] **Step 4: Commit**

```bash
git add web/src/pages/auth
git commit -m "feat(web): add login and register pages"
```

---

## Task 8: Dashboard Page

**Files:**
- Modify: `web/src/pages/dashboard/index.tsx`
- Create: `web/src/components/shared/item-card.tsx`
- Create: `web/src/components/shared/empty-state.tsx`

- [ ] **Step 1: Create item card component**

Create `src/components/shared/item-card.tsx`:
```tsx
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatRelativeTime } from '@/lib/utils'
import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react'
import type { Item } from '@/types'

interface ItemCardProps {
  item: Item
}

export function ItemCard({ item }: ItemCardProps) {
  const trend = getTrend(item)

  return (
    <Link to={`/items/${item.id}`}>
      <Card className="overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
        {/* Image */}
        <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-800 relative">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl text-slate-300">📦</span>
            </div>
          )}
          {item.category && (
            <Badge className="absolute top-2 left-2" variant="secondary">
              {item.category}
            </Badge>
          )}
        </div>

        <CardContent className="p-4 space-y-2">
          {/* Name */}
          <h3 className="font-semibold text-slate-900 dark:text-white truncate">
            {item.name}
          </h3>

          {/* Price & Trend */}
          <div className="flex items-center gap-2">
            {item.best_price !== null ? (
              <>
                <span className="text-2xl font-bold tabular-nums">
                  {formatPrice(item.best_price)}
                </span>
                <span className={`flex items-center gap-1 text-sm ${trend.color}`}>
                  {trend.icon}
                  {trend.label}
                </span>
              </>
            ) : (
              <span className="text-slate-400 italic">No price yet</span>
            )}
          </div>

          {/* Store & Time */}
          <div className="flex items-center justify-between text-sm text-slate-500">
            {item.best_store && <span>Best: {item.best_store}</span>}
            <span>{item.url_count} {item.url_count === 1 ? 'store' : 'stores'}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function getTrend(item: Item): { icon: React.ReactNode; label: string; color: string } {
  // For now, show static trend. Will be dynamic when we have history.
  return {
    icon: <ArrowRight className="w-4 h-4" />,
    label: '0%',
    color: 'text-slate-400',
  }
}
```

- [ ] **Step 2: Create empty state component**

Create `src/components/shared/empty-state.tsx`:
```tsx
import { Button } from '@/components/ui/button'
import { Package } from 'lucide-react'

interface EmptyStateProps {
  onAddItem: () => void
}

export function EmptyState({ onAddItem }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
        <Package className="w-12 h-12 text-slate-400" />
      </div>
      <h2 className="text-2xl font-headline font-semibold mb-2">
        Start tracking prices
      </h2>
      <p className="text-slate-500 text-center max-w-sm mb-6">
        Add your first item to get notified when prices drop across your favorite stores.
      </p>
      <Button onClick={onAddItem} size="lg">
        Add Your First Item
      </Button>
    </div>
  )
}
```

- [ ] **Step 3: Create dashboard page**

Update `src/pages/dashboard/index.tsx`:
```tsx
import { useItems } from '@/hooks/use-items'
import { useUIStore } from '@/stores/ui-store'
import { ItemCard } from '@/components/shared/item-card'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus } from 'lucide-react'

export function DashboardPage() {
  const { items, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useItems()
  const { setAddItemModalOpen } = useUIStore()

  if (isLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">Your Items</h1>
          <p className="text-slate-500">
            {items.length} {items.length === 1 ? 'item' : 'items'} tracked
          </p>
        </div>
        <Button onClick={() => setAddItemModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Items grid or empty state */}
      {items.length === 0 ? (
        <EmptyState onAddItem={() => setAddItemModalOpen(true)} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>

          {/* Load more */}
          {hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? 'Loading...' : 'Load more'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-5 w-24 mt-2" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="aspect-[4/3] w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: No TypeScript errors

- [ ] **Step 5: Commit**

```bash
git add web/src/pages/dashboard web/src/components/shared
git commit -m "feat(web): add dashboard page with item cards grid"
```

---

## Task 9: Item Detail Page with Price Chart

**Files:**
- Modify: `web/src/pages/item/[id].tsx`

- [ ] **Step 1: Install Recharts**

```bash
npm install recharts
```

- [ ] **Step 2: Create item detail page**

Update `src/pages/item/[id].tsx`:
```tsx
import { useParams, useNavigate } from 'react-router-dom'
import { useItem } from '@/hooks/use-item'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { formatPrice, formatRelativeTime } from '@/lib/utils'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { ArrowLeft, RefreshCw, Trash2, Plus, ExternalLink } from 'lucide-react'
import type { PriceHistory } from '@/types'

export function ItemPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { item, isLoading, checkPrice, isCheckingPrice } = useItem(id!)

  if (isLoading) {
    return <ItemSkeleton />
  }

  if (!item) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-headline mb-4">Item not found</h2>
        <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
      </div>
    )
  }

  // Aggregate price history from all URLs
  const allHistory = item.urls.flatMap((url) =>
    // We'll need to fetch price history separately or include it in the item detail
    []
  )

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      {/* Header */}
      <div className="flex gap-6">
        {/* Image */}
        <div className="w-48 h-48 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl">📦</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              {item.category && <Badge variant="secondary">{item.category}</Badge>}
              <h1 className="text-3xl font-headline font-bold mt-2">{item.name}</h1>
            </div>
            <Button variant="outline" size="sm" onClick={() => checkPrice()} disabled={isCheckingPrice}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isCheckingPrice ? 'animate-spin' : ''}`} />
              Check Price
            </Button>
          </div>

          {item.best_price !== null && (
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-primary">
                {formatPrice(item.best_price)}
              </span>
              <span className="text-slate-500">best price</span>
            </div>
          )}
        </div>
      </div>

      {/* Price chart placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Price History (30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-slate-500">Price history will appear here</p>
          </div>
        </CardContent>
      </Card>

      {/* Store comparison */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Store Prices</CardTitle>
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Store
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {item.urls.map((url) => (
              <div key={url.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium">{url.store_name || 'Unknown Store'}</p>
                    <a
                      href={url.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      View product <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <div className="text-right">
                  {url.current_price !== null ? (
                    <p className="text-xl font-bold">{formatPrice(url.current_price)}</p>
                  ) : (
                    <p className="text-slate-400 italic">No price</p>
                  )}
                  <Badge variant={
                    url.availability === 'in_stock' ? 'default' :
                    url.availability === 'out_of_stock' ? 'destructive' : 'secondary'
                  }>
                    {url.availability.replace('_', ' ')}
                  </Badge>
                  {url.last_checked && (
                    <p className="text-xs text-slate-500 mt-1">
                      Checked {formatRelativeTime(url.last_checked)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Item
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function ItemSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-24" />
      <div className="flex gap-6">
        <Skeleton className="w-48 h-48 rounded-lg" />
        <div className="flex-1 space-y-4">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-12 w-32" />
        </div>
      </div>
      <Skeleton className="h-80 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: No TypeScript errors

- [ ] **Step 4: Commit**

```bash
git add web/src/pages/item
git commit -m "feat(web): add item detail page with store comparison"
```

---

## Task 10: Settings Page

**Files:**
- Modify: `web/src/pages/settings/index.tsx`

- [ ] **Step 1: Create settings page**

Update `src/pages/settings/index.tsx`:
```tsx
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Mail, Bell, Moon, Trash2 } from 'lucide-react'

export function SettingsPage() {
  const { user } = useAuth()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">Settings</h1>
        <p className="text-slate-500">Manage your account and preferences</p>
      </div>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Account
          </CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ''} disabled />
          </div>
          <Button variant="outline">Change Password</Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
          <CardDescription>How you receive price drop alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-slate-500">Receive alerts via email</p>
            </div>
            <Badge variant="default">Enabled</Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-slate-500">Browser push alerts</p>
            </div>
            <Badge variant="secondary">Disabled</Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notify on drop</p>
              <p className="text-sm text-slate-500">Alert when price drops by</p>
            </div>
            <Badge variant="outline">5%+</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="w-5 h-5" />
            Appearance
          </CardTitle>
          <CardDescription>Customize how PriceHawk looks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">Light</Button>
            <Button variant="outline" className="flex-1">Dark</Button>
            <Button variant="outline" className="flex-1">System</Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add web/src/pages/settings
git commit -m "feat(web): add settings page with account and notification settings"
```

---

## Task 11: Landing Page

**Files:**
- Modify: `web/src/pages/landing/index.tsx`
- Create: `web/src/components/layout/footer.tsx`

- [ ] **Step 1: Create footer component**

Create `src/components/layout/footer.tsx`:
```tsx
import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="border-t bg-white dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li><a href="#features" className="hover:text-primary">Features</a></li>
              <li><a href="#pricing" className="hover:text-primary">Pricing</a></li>
              <li><a href="#" className="hover:text-primary">Changelog</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li><a href="#" className="hover:text-primary">About</a></li>
              <li><a href="#" className="hover:text-primary">Blog</a></li>
              <li><a href="#" className="hover:text-primary">Careers</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li><a href="#" className="hover:text-primary">Privacy</a></li>
              <li><a href="#" className="hover:text-primary">Terms</a></li>
              <li><a href="#" className="hover:text-primary">Cookie Policy</a></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li><a href="#" className="hover:text-primary">Twitter</a></li>
              <li><a href="#" className="hover:text-primary">GitHub</a></li>
              <li><a href="#" className="hover:text-primary">Discord</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} PriceHawk. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 2: Create landing page**

Update `src/pages/landing/index.tsx`:
```tsx
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Footer } from '@/components/layout/footer'
import {
  Store,
  Bell,
  LineChart,
  Sparkles,
  ArrowRight,
  Check,
} from 'lucide-react'

const features = [
  {
    icon: Store,
    title: 'Multi-Store Tracking',
    description: 'Compare prices across Amazon, Best Buy, Newegg, Walmart, and more. See the best deal instantly.',
  },
  {
    icon: Bell,
    title: 'Instant Notifications',
    description: 'Get email and push alerts the moment prices drop. Never miss a sale again.',
  },
  {
    icon: LineChart,
    title: 'Price History Charts',
    description: 'Visual 30-day price trends help you know if now is the right time to buy.',
  },
  {
    icon: Sparkles,
    title: 'Smart Detection',
    description: 'Just paste a product URL. We automatically detect the name, image, and current price.',
  },
]

const pricing = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for casual shoppers',
    features: ['10 items tracked', 'Email notifications', '24-hour price checks', 'Basic price history'],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$4.99',
    period: 'per month',
    description: 'For serious deal hunters',
    features: ['Unlimited items', 'Push notifications', '1-hour price checks', 'Advanced analytics', 'Price alerts', 'Priority support'],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For teams and businesses',
    features: ['Everything in Pro', 'Team management', 'API access', 'Custom integrations', 'Dedicated support'],
    cta: 'Contact Sales',
    popular: false,
  },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Navigation */}
      <nav className="border-b">
        <div className="container mx-auto px-4 flex items-center justify-between h-16">
          <a href="/" className="text-2xl font-headline font-bold text-primary">
            PriceHawk
          </a>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link to="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-headline font-bold mb-6">
            Never miss a{' '}
            <span className="text-primary">price drop</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
            Track prices across Amazon, Best Buy, Newegg, and more. Get notified instantly when prices drop.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="gap-2">
                Start Tracking Free <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              See How It Works
            </Button>
          </div>

          {/* Dashboard preview */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-900 z-10" />
            <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 shadow-2xl">
              <div className="bg-white dark:bg-slate-900 rounded-lg p-6">
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 text-left">
                      <div className="w-full aspect-video bg-slate-200 dark:bg-slate-700 rounded mb-3" />
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-2" />
                      <div className="h-6 bg-primary/20 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-slate-50 dark:bg-slate-800/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-headline font-bold mb-4">
              Everything you need to save money
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
              Powerful features that make tracking prices effortless
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="border-none shadow-sm">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-headline font-bold mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Start free, upgrade when you need more
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricing.map((plan) => (
              <Card
                key={plan.name}
                className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg">{plan.name}</h3>
                  <div className="mt-2 mb-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-slate-500 ml-1">/{plan.period}</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                    {plan.description}
                  </p>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-headline font-bold text-white mb-4">
            Start tracking prices today
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Join thousands of smart shoppers who save money with PriceHawk
          </p>
          <Link to="/register">
            <Button size="lg" variant="secondary" className="gap-2">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: No TypeScript errors

- [ ] **Step 4: Commit**

```bash
git add web/src/pages/landing web/src/components/layout/footer.tsx
git commit -m "feat(web): add landing page with hero, features, and pricing"
```

---

## Task 12: Add Item Modal

**Files:**
- Create: `web/src/components/shared/add-item-modal.tsx`
- Modify: `web/src/App.tsx`

- [ ] **Step 1: Create add item modal**

Create `src/components/shared/add-item-modal.tsx`:
```tsx
import { useState } from 'react'
import { useItems } from '@/hooks/use-items'
import { useUIStore } from '@/stores/ui-store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle2 } from 'lucide-react'

type Step = 'url' | 'details' | 'success'

export function AddItemModal() {
  const { addItem, isAddingItem, addError } = useItems()
  const { addItemModalOpen, setAddItemModalOpen } = useUIStore()

  const [step, setStep] = useState<Step>('url')
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [scrapedData, setScrapedData] = useState<{
    name?: string
    image_url?: string
    price?: number
    store?: string
  } | null>(null)

  const handleUrlSubmit = async () => {
    // For now, skip actual scraping and go to details step
    // In real implementation, this would call the backend to scrape
    setScrapedData({
      name: 'Product Name',
      store: 'Store',
      price: 99.99,
    })
    setName('')
    setStep('details')
  }

  const handleDetailsSubmit = async () => {
    addItem({
      name: name || scrapedData?.name || 'Unnamed Item',
      urls: [url],
      category: category || undefined,
    })

    if (!addError) {
      setStep('success')
    }
  }

  const handleClose = () => {
    setAddItemModalOpen(false)
    // Reset state
    setTimeout(() => {
      setStep('url')
      setUrl('')
      setName('')
      setCategory('')
      setScrapedData(null)
    }, 200)
  }

  return (
    <Dialog open={addItemModalOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === 'url' && (
          <>
            <DialogHeader>
              <DialogTitle>Add Item</DialogTitle>
              <DialogDescription>
                Paste a product URL to start tracking its price
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {addError && (
                <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                  Failed to add item. Please try again.
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="url">Product URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://www.amazon.com/dp/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <Button
                onClick={handleUrlSubmit}
                disabled={!url || isAddingItem}
                className="w-full"
              >
                {isAddingItem ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            </div>
          </>
        )}

        {step === 'details' && (
          <>
            <DialogHeader>
              <DialogTitle>Confirm Details</DialogTitle>
              <DialogDescription>
                Review and edit the item details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={scrapedData?.name}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category (optional)</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="electronics, gaming, home..."
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('url')} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleDetailsSubmit} disabled={isAddingItem} className="flex-1">
                  {isAddingItem ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Item'
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'success' && (
          <div className="py-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <DialogTitle className="mb-2">Item Added!</DialogTitle>
            <DialogDescription>
              We'll notify you when the price drops.
            </DialogDescription>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                View Dashboard
              </Button>
              <Button
                onClick={() => {
                  setStep('url')
                  setUrl('')
                  setName('')
                  setCategory('')
                  setScrapedData(null)
                }}
                className="flex-1"
              >
                Add Another
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Add modal to App.tsx**

Update `src/App.tsx` to include the modal:
```tsx
// Add import
import { AddItemModal } from '@/components/shared/add-item-modal'

// Add inside the BrowserRouter, after the Routes:
<AddItemModal />
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: No TypeScript errors

- [ ] **Step 4: Commit**

```bash
git add web/src/components/shared/add-item-modal.tsx web/src/App.tsx
git commit -m "feat(web): add item modal with URL input and confirmation flow"
```

---

## Task 13: Final Integration and Polish

**Files:**
- Modify: `web/src/App.tsx`
- Various polish updates

- [ ] **Step 1: Add auth logout event listener**

Update `src/App.tsx` to handle auth logout events:
```tsx
// Add useEffect import
import { useEffect } from 'react'

// Add inside App component, before return:
useEffect(() => {
  const handleLogout = () => {
    useAuthStore.getState().logout()
  }

  window.addEventListener('auth:logout', handleLogout)
  return () => window.removeEventListener('auth:logout', handleLogout)
}, [])
```

- [ ] **Step 2: Add theme initialization**

Ensure theme is applied on app load:
```tsx
// Initialize theme on mount
useEffect(() => {
  initializeTheme()
}, [])
```

- [ ] **Step 3: Add loading state for auth check**

Update `src/App.tsx` to show loading while checking auth:
```tsx
// Inside App component
const [isInitializing, setIsInitializing] = useState(true)

useEffect(() => {
  // Give auth query time to complete
  const timer = setTimeout(() => setIsInitializing(false), 1000)
  return () => clearTimeout(timer)
}, [])

if (isInitializing) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  )
}
```

- [ ] **Step 4: Run full build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 5: Test dev server**

Run: `npm run dev`
Open: http://localhost:5173
Expected: Landing page loads

- [ ] **Step 6: Final commit**

```bash
git add web/src
git commit -m "feat(web): add auth initialization and polish"
```

---

## Task 14: Package Scripts and Environment

**Files:**
- Modify: `web/package.json`

- [ ] **Step 1: Add useful scripts**

Update `package.json` scripts:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  }
}
```

- [ ] **Step 2: Create environment file**

Create `web/.env.example`:
```
VITE_API_URL=/api/v1
```

- [ ] **Step 3: Update .gitignore**

Ensure `web/.env` and `web/dist/` are ignored in project root `.gitignore`

- [ ] **Step 4: Commit**

```bash
git add web/package.json web/.env.example
git commit -m "chore(web): add package scripts and environment config"
```

---

## Summary

This plan creates a complete React frontend for PriceHawk with:

1. **Project setup** - Vite, TypeScript, Tailwind CSS
2. **UI components** - shadcn/ui component library
3. **State management** - React Query + Zustand
4. **Routing** - Protected routes with auth guards
5. **Auth pages** - Login and register forms
6. **Dashboard** - Item cards grid with empty state
7. **Item detail** - Price comparison, store list
8. **Settings** - Account and notification preferences
9. **Landing page** - Marketing content with pricing
10. **Add item modal** - Multi-step flow for tracking new items

Each task produces working, testable output with frequent commits.
