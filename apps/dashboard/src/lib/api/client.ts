import { getBrowserApiBaseUrl } from './base-url'

const BASE_URL = getBrowserApiBaseUrl()

// ─── Error ────────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly data?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }

  get isUnauthorized() { return this.status === 401 }
  get isNotFound()     { return this.status === 404 }
  get isConflict()     { return this.status === 409 }
  get isValidation()   { return this.status === 422 || this.status === 400 }
}

// ─── Token refresh ────────────────────────────────────────────────────────────

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
    return res.ok
  } catch {
    return false
  }
}

// ─── Core request ─────────────────────────────────────────────────────────────

const AUTH_PATHS = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh']

async function request<T>(
  path: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const isFormData = options.body instanceof FormData

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        ...(!isFormData && { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
    })
  } catch {
    throw new ApiError(0, 'Sem conexão com o servidor. Verifique sua internet.')
  }

  // 401 → tenta refresh uma vez e repete a requisição original
  // (não aplica a endpoints de auth para não esconder erros de credencial)
  if (res.status === 401 && !isRetry && !AUTH_PATHS.includes(path)) {
    const refreshed = await tryRefresh()
    if (refreshed) return request<T>(path, options, true)
    throw new ApiError(401, 'Sessão expirada. Faça login novamente.')
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const message = Array.isArray(data?.message)
      ? data.message[0]
      : (data?.message ?? 'Erro inesperado. Tente novamente.')
    throw new ApiError(res.status, message, data)
  }

  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

// ─── Client ───────────────────────────────────────────────────────────────────

export const apiClient = {
  get<T>(path: string, options?: RequestInit) {
    return request<T>(path, { method: 'GET', ...options })
  },

  post<T>(path: string, body?: unknown, options?: RequestInit) {
    return request<T>(path, {
      method: 'POST',
      body: body instanceof FormData
        ? body
        : body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    })
  },

  patch<T>(path: string, body?: unknown, options?: RequestInit) {
    return request<T>(path, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    })
  },

  delete<T>(path: string, options?: RequestInit) {
    return request<T>(path, { method: 'DELETE', ...options })
  },
}
