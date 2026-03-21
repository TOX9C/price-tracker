import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Item, ItemDetail, PaginatedResponse } from '@/types';

export function useItems(limit = 20) {
  return useInfiniteQuery({
    queryKey: ['items'],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        limit: String(limit),
        ...(pageParam && { cursor: pageParam as string }),
      });
      return api.get<PaginatedResponse<Item>>(`/items?${params}`);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor || undefined,
  });
}

export function useItem(id: string) {
  return useQuery({
    queryKey: ['item', id],
    queryFn: () => api.get<ItemDetail>(`/items/${id}`),
    enabled: !!id,
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; urls: string[]; category?: string }) =>
      api.post<Item>('/items', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; category?: string } }) =>
      api.put<Item>(`/items/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['item', id] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
}

export function useAddUrl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, url }: { itemId: string; url: string }) =>
      api.post(`/items/${itemId}/urls`, { url }),
    onSuccess: (_, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: ['item', itemId] });
    },
  });
}

export function useRemoveUrl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, urlId }: { itemId: string; urlId: string }) =>
      api.delete(`/items/${itemId}/urls/${urlId}`),
    onSuccess: (_, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: ['item', itemId] });
    },
  });
}

export function useCheckPrice(itemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post(`/items/${itemId}/check`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item', itemId] });
    },
  });
}
