import { Outlet } from 'react-router-dom'
import { Header } from './header'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
