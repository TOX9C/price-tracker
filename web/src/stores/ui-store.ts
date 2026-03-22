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
      theme: 'light', // Default to light mode instead of system
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

export function initializeTheme() {
  const { theme } = useUIStore.getState()
  const root = document.documentElement

  // Always start with light mode
  root.classList.remove('dark')

  if (theme === 'dark') {
    root.classList.add('dark')
  } else if (theme === 'system') {
    // If user explicitly selects system, respect it
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', systemDark)
  }
}
