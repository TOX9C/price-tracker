import { useState } from 'react'
import { useItems } from '@/hooks/use-items'
import { useUIStore } from '@/stores/ui-store'
import api from '@/lib/api'
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

interface PreviewResponse {
  name: string | null
  image: string | null
  price: number | null
  currency: string
  store: string
  availability: string
  confidence: string
}

export function AddItemModal() {
  const { addItem, isAddingItem, addError } = useItems()
  const { addItemModalOpen, setAddItemModalOpen } = useUIStore()

  const [step, setStep] = useState<Step>('url')
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [scrapedData, setScrapedData] = useState<{
    name?: string
    image?: string
    price?: number
    store?: string
  } | null>(null)

  const handleUrlSubmit = async () => {
    setIsLoadingPreview(true)
    try {
      const response = await api.get(`items/preview?url=${encodeURIComponent(url)}`).json<PreviewResponse>()
      setScrapedData({
        name: response.name || undefined,
        image: response.image || undefined,
        price: response.price || undefined,
        store: response.store,
      })
      setName('')
      setCategory('')
      setStep('details')
    } catch (error) {
      // If preview fails, still proceed with empty data
      setScrapedData({
        name: 'Product',
        store: 'Store',
      })
      setStep('details')
    } finally {
      setIsLoadingPreview(false)
    }
  }

  const handleDetailsSubmit = async () => {
    addItem({
      name: name || scrapedData?.name || 'Unnamed Item',
      urls: [url],
      category: category || undefined,
      imageUrl: scrapedData?.image || undefined,
    })

    if (!addError) {
      setStep('success')
    }
  }

  const handleClose = () => {
    setAddItemModalOpen(false)
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
                disabled={!url || isLoadingPreview}
                className="w-full"
              >
                {isLoadingPreview ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Fetching info...
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
              {scrapedData?.image && (
                <div className="flex justify-center">
                  <img
                    src={scrapedData.image}
                    alt={scrapedData.name || 'Product'}
                    className="w-24 h-24 object-contain rounded-lg border border-stone-200"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={scrapedData?.name}
                />
              </div>
              {scrapedData?.price && (
                <div className="text-sm text-stone-600">
                  Detected price: ${scrapedData.price.toFixed(2)} from {scrapedData.store}
                </div>
              )}
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
