import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';
import { User } from '@/types';

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput extends LoginInput {
  name?: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

export function useAuth() {
  const { user, isAuthenticated, setUser, setToken, logout } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: async (input: LoginInput): Promise<AuthResponse> => {
      const response = await api.post<AuthResponse>('/auth/login', input);
      return response;
    },
    onSuccess: (data) => {
      setUser(data.user);
      setToken(data.token);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (input: RegisterInput): Promise<AuthResponse> => {
      const response = await api.post<AuthResponse>('/auth/register', input);
      return response;
    },
    onSuccess: (data) => {
      setUser(data.user);
      setToken(data.token);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await api.post('/auth/logout');
      } catch {
        // Ignore logout API errors
      }
    },
    onSettled: () => {
      logout();
    },
  });

  return {
    user,
    isAuthenticated,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    logout: logoutMutation.mutate,
    isLoading: loginMutation.isPending || registerMutation.isPending,
    isLoginError: loginMutation.isError,
    loginError: loginMutation.error,
    isRegisterError: registerMutation.isError,
    registerError: registerMutation.error,
  };
}
