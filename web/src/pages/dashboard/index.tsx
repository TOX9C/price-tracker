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
 <div className="space-y-6 min-h-screen bg-gradient-to-b from-stone-50 to-white">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-3xl font-headline font-bold">Your Items</h1>
 <p className="text-stone-500">
 {items.length} {items.length === 1 ? 'item' : 'items'} tracked
 </p>
 </div>
 <Button onClick={() => setAddItemModalOpen(true)}>
 <Plus className="w-4 h-4 mr-2" />
 Add Item
 </Button>
 </div>

 {items.length === 0 ? (
 <EmptyState onAddItem={() => setAddItemModalOpen(true)} />
 ) : (
 <>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
 {items.map((item) => (
 <ItemCard key={item.id} item={item} />
 ))}
 </div>

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
 <div className="space-y-6 min-h-screen bg-gradient-to-b from-stone-50 to-white">
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
