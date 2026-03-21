import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import type { User } from '@/types'

interface LoginCredentials {
 email: string
 password: string
}

interface RegisterCredentials extends LoginCredentials {
 confirmPassword: string
}

interface AuthResponse {
 user: User
 token: string
 refreshToken: string
}

export function useAuth() {
 const navigate = useNavigate()
 const queryClient = useQueryClient()
 const { user, setUser, setToken, logout: storeLogout } = useAuthStore()

 const { isLoading } = useQuery({
 queryKey: ['auth', 'me'],
 queryFn: async () => {
 try {
 const response = await api.get('auth/me').json<{ data: User }>()
 setUser(response.data)
 return response.data
 } catch {
 setUser(null)
 return null
 }
 },
 retry: false,
 })

 const loginMutation = useMutation({
 mutationFn: async (credentials: LoginCredentials) => {
 const response = await api.post('auth/login', {
 json: credentials,
 }).json<AuthResponse>()
 return response
 },
 onSuccess: (response) => {
 setToken(response.token)
 setUser(response.user)
 queryClient.invalidateQueries({ queryKey: ['auth'] })
 navigate('/dashboard')
 },
 })

 const registerMutation = useMutation({
 mutationFn: async (credentials: RegisterCredentials) => {
 const response = await api.post('auth/register', {
 json: {
 email: credentials.email,
 password: credentials.password,
 },
 }).json<AuthResponse>()
 return response
 },
 onSuccess: (response) => {
 setToken(response.token)
 setUser(response.user)
 queryClient.invalidateQueries({ queryKey: ['auth'] })
 navigate('/dashboard')
 },
 })

 const logoutMutation = useMutation({
 mutationFn: async () => {
 await api.post('auth/logout')
 },
 onSuccess: () => {
 storeLogout()
 queryClient.clear()
 navigate('/login')
 },
 })

 return {
 user,
 isLoading,
 isAuthenticated: !!user,
 login: loginMutation.mutate,
 loginError: loginMutation.error,
 isLoggingIn: loginMutation.isPending,
 register: registerMutation.mutate,
 registerError: registerMutation.error,
 isRegistering: registerMutation.isPending,
 logout: logoutMutation.mutate,
 isLoggingOut: logoutMutation.isPending,
 }
}
