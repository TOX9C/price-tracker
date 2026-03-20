import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'
import { ArrowDown, Package } from 'lucide-react'
import type { Item } from '@/types'

interface ItemCardProps {
 item: Item
}

export function ItemCard({ item }: ItemCardProps) {
 const trend = getTrend(item)

 return (
 <Link to={`/items/${item.id}`}>
 <Card className="overflow-hidden cursor-pointer">
 <div className="aspect-[4/3] bg-gradient-to-br from-stone-50 to-stone-100 relative">
 {item.image_url ? (
 <img
 src={item.image_url}
 alt={item.name}
 className="w-full h-full object-cover"
 />
 ) : (
 <div className="w-full h-full flex items-center justify-center">
 <Package className="w-12 h-12 text-stone-300" />
 </div>
 )}
 {item.category && (
 <Badge className="absolute top-3 left-3" variant="secondary">
 {item.category}
 </Badge>
 )}
 </div>

 <CardContent className="p-4 space-y-3">
 <h3 className="font-semibold text-stone-900 dark:text-white truncate">
 {item.name}
 </h3>

 <div className="flex items-center gap-3">
 {item.best_price !== null ? (
 <>
 <span className="text-xl font-bold text-success tabular-nums">
 {formatPrice(item.best_price)}
 </span>
 {trend.direction === 'down' && (
 <Badge variant="success" className="gap-1">
 <ArrowDown className="w-3 h-3" />
 {trend.percent}
 </Badge>
 )}
 </>
 ) : (
 <span className="text-stone-400 italic">No price yet</span>
 )}
 </div>

 <div className="flex items-center justify-between text-sm text-stone-500">
 {item.best_store && <span>Best: {item.best_store}</span>}
 <span>{item.url_count} {item.url_count === 1 ? 'store' : 'stores'}</span>
 </div>
 </CardContent>
 </Card>
 </Link>
 )
}

function getTrend(item: Item): { direction: string; percent: string } {
 return {
 direction: 'stable',
 percent: '0%',
 }
}
