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
