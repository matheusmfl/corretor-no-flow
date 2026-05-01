'use client'

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, type ReactNode } from 'react'
import { toast, Toaster } from 'sonner'
import { ApiError } from '@/lib/api/client'

// Garante no máximo um redirect para /login por ciclo de página,
// mesmo que várias queries falhem com 401 simultaneamente.
let redirectingToLogin = false

function redirectToLogin() {
  if (redirectingToLogin) return
  redirectingToLogin = true
  window.location.replace('/login')
}

function toastFromError(error: unknown) {
  const message = error instanceof ApiError
    ? error.message
    : 'Erro inesperado. Tente novamente.'
  toast.error(message)
}

function isAuthMeQuery(queryKey: unknown): boolean {
  return Array.isArray(queryKey) && queryKey[0] === 'auth' && queryKey[1] === 'me'
}

function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError(error, query) {
        if (error instanceof ApiError && error.isUnauthorized) {
          redirectToLogin()
          return
        }
        // Erros de auth/me (offline, 404, etc.) são exibidos pelo layout — não duplicar toast
        if (isAuthMeQuery(query.queryKey)) return
        toastFromError(error)
      },
    }),
    mutationCache: new MutationCache({
      onError(error, _variables, _context, mutation) {
        if (mutation.options.onError) return
        toastFromError(error)
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: (failureCount, error) => {
          if (error instanceof ApiError && (error.isUnauthorized || error.isNotFound)) return false
          return failureCount < 2
        },
      },
      mutations: {
        retry: false,
      },
    },
  })
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
          },
        }}
      />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
