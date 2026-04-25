// ─── Request DTOs ────────────────────────────────────────────────────────────

export interface RegisterDto {
  name: string
  email: string
  password: string
}

export interface LoginDto {
  email: string
  password: string
}

export interface ForgotPasswordDto {
  email: string
}

export interface ResetPasswordDto {
  token: string
  password: string
}

// ─── Response types ───────────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  email: string
  name: string
  companyId: string | null
}

export interface AuthResponse {
  user: AuthUser
}

export interface RegisterResponse {
  id: string
  email: string
  name: string
  companyId: string | null
}
