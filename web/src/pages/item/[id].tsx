import { useParams, useNavigate } from 'react-router-dom'
import { useItem } from '@/hooks/use-item'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPrice, formatRelativeTime } from '@/lib/utils'
import { ArrowLeft, RefreshCw, Trash2, Plus, ExternalLink } from 'lucide-react'

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

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="flex gap-6">
        <div className="w-48 h-48 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl">📦</span>
            </div>
          )}
        </div>

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
              <div
                key={url.id}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium">{url.store_name || 'Unknown Store'}</p>
                    <a
                      href={url.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      View product
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <div className="text-right">
                  {url.current_price !== null ? (
                    <p className="text-xl font-bold">{formatPrice(url.current_price)}</p>
                  ) : (
                    <p className="text-slate-400 italic">No price</p>
                  )}
                  <Badge
                    variant={
                      url.availability === 'in_stock'
                        ? 'default'
                        : url.availability === 'out_of_stock'
                          ? 'destructive'
                          : 'secondary'
                    }
                  >
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
