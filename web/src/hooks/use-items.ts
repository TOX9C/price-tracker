import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Item } from '@/types'

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

  const addMutation = useMutation({
    mutationFn: async (data: {
      name: string
      urls: string[]
      category?: string
      imageUrl?: string
    }) => {
      const response = await api.post('items', { json: data }).json<Item>()
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })

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
