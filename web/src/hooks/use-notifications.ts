import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Notification } from '@/types'

interface NotificationsResponse {
  notifications: Notification[]
  next_cursor: string | null
}

export function useNotifications() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('notifications').json<NotificationsResponse>()
      return response
    },
    refetchInterval: 60000,
    staleTime: 30000,
  })

  const notifications = data?.notifications ?? []
  const unreadCount = notifications.filter((n) => !n.read_at).length

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`notifications/${id}/read`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: markAsReadMutation.mutate,
  }
}
