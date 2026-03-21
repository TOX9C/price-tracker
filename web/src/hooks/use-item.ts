import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { ItemDetail, TrackedUrl } from '@/types'

export function useItem(id: string) {
 const queryClient = useQueryClient()

 const { data: item, isLoading, error } = useQuery({
 queryKey: ['item', id],
 queryFn: async () => {
 const response = await api.get(`items/${id}`).json<ItemDetail>()
 return response
 },
 enabled: !!id,
 })

 const addUrlMutation = useMutation({
 mutationFn: async ({ url, storeName }: { url: string; storeName?: string }) => {
 const response = await api.post(`items/${id}/urls`, {
 json: { url, storeName },
 }).json<TrackedUrl>()
 return response
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ['item', id] })
 },
 })

 const removeUrlMutation = useMutation({
 mutationFn: async (urlId: string) => {
 await api.delete(`items/${id}/urls/${urlId}`)
 return urlId
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ['item', id] })
 },
 })

 const checkMutation = useMutation({
 mutationFn: async () => {
 await api.post(`items/${id}/check`)
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ['item', id] })
 },
 })

 return {
 item,
 isLoading,
 error,
 addUrl: addUrlMutation.mutate,
 isAddingUrl: addUrlMutation.isPending,
 removeUrl: removeUrlMutation.mutate,
 isRemovingUrl: removeUrlMutation.isPending,
 checkPrice: checkMutation.mutate,
 isCheckingPrice: checkMutation.isPending,
 }
}
