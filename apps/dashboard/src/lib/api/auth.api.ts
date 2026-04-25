import type { LoginDto, RegisterDto, AuthResponse, RegisterResponse, AuthUser } from '@corretor/types'
import { apiClient } from './client'

export function loginFn(body: LoginDto) {
  return apiClient.post<AuthResponse>('/api/auth/login', body)
}

export function registerFn(body: RegisterDto) {
  return apiClient.post<RegisterResponse>('/api/auth/register', body)
}

export function getMeFn() {
  return apiClient.get<AuthUser>('/api/auth/me')
}

export function logoutFn() {
  return apiClient.post<void>('/api/auth/logout')
}
