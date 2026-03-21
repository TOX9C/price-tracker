import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ItemCard } from '@/components/shared/item-card'
import type { Item } from '@/types'

const mockItem: Item = {
  id: 'test-id',
  name: 'Test Product',
  image_url: 'https://example.com/image.jpg',
  category: 'electronics',
  best_price: 99.99,
  best_store: 'Amazon',
  url_count: 2,
}

const renderWithRouter = (component: React.ReactNode) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('ItemCard', () => {
  it('should render item name', () => {
    renderWithRouter(<ItemCard item={mockItem} />)
    expect(screen.getByText('Test Product')).toBeInTheDocument()
  })

  it('should render formatted price', () => {
    renderWithRouter(<ItemCard item={mockItem} />)
    expect(screen.getByText(/\$99\.99/)).toBeInTheDocument()
  })

  it('should render store name', () => {
    renderWithRouter(<ItemCard item={mockItem} />)
    expect(screen.getByText(/Amazon/)).toBeInTheDocument()
  })

  it('should render category badge', () => {
    renderWithRouter(<ItemCard item={mockItem} />)
    expect(screen.getByText('electronics')).toBeInTheDocument()
  })

  it('should render store count', () => {
    renderWithRouter(<ItemCard item={mockItem} />)
    expect(screen.getByText('2 stores')).toBeInTheDocument()
  })

  it('should show placeholder when no image', () => {
    const itemNoImage = { ...mockItem, image_url: null }
    renderWithRouter(<ItemCard item={itemNoImage} />)
    expect(screen.getByText('📦')).toBeInTheDocument()
  })

  it('should show "No price yet" when no price', () => {
    const itemNoPrice = { ...mockItem, best_price: null }
    renderWithRouter(<ItemCard item={itemNoPrice} />)
    expect(screen.getByText('No price yet')).toBeInTheDocument()
  })

  it('should show singular "store" for single URL', () => {
    const singleStore = { ...mockItem, url_count: 1 }
    renderWithRouter(<ItemCard item={singleStore} />)
    expect(screen.getByText('1 store')).toBeInTheDocument()
  })

  it('should hide category badge when no category', () => {
    const noCategory = { ...mockItem, category: null }
    renderWithRouter(<ItemCard item={noCategory} />)
    expect(screen.queryByText('electronics')).not.toBeInTheDocument()
  })
})
