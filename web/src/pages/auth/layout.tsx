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
