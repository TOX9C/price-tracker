import { renderHook, act } from '@testing-library/react'
import { useAuthStore } from '@/stores/auth-store'
import type { User } from '@/types'

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
    })
  })

  it('should start with no user', () => {
    const { result } = renderHook(() => useAuthStore())

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should set user and mark authenticated', () => {
    const { result } = renderHook(() => useAuthStore())

    const testUser: User = {
      id: 'test-id',
      email: 'test@example.com',
      created_at: '2024-01-01',
      notification_preferences: {
        email_enabled: true,
        push_enabled: true,
        notify_on_drop_percentage: 5,
        quiet_hours_start: null,
        quiet_hours_end: null,
      },
    }

    act(() => {
      result.current.setUser(testUser)
    })

    expect(result.current.user).not.toBeNull()
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('should clear user on logout', () => {
    const { result } = renderHook(() => useAuthStore())

    const testUser: User = {
      id: 'test-id',
      email: 'test@example.com',
      created_at: '2024-01-01',
      notification_preferences: {
        email_enabled: true,
        push_enabled: true,
        notify_on_drop_percentage: 5,
        quiet_hours_start: null,
        quiet_hours_end: null,
      },
    }

    act(() => {
      result.current.setUser(testUser)
    })

    expect(result.current.isAuthenticated).toBe(true)

    act(() => {
      result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should handle setting null user', () => {
    const { result } = renderHook(() => useAuthStore())

    act(() => {
      result.current.setUser(null)
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })
})
