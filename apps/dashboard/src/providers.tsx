'use client'

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, type ReactNode } from 'react'
import { toast, Toaster } from 'sonner'
import { ApiError } from '@/lib/api/client'

function toastFromError(error: unknown) {
  const message = error instanceof ApiError
    ? error.message
    : 'Erro inesperado. Tente novamente.'
  toast.error(message)
}

function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError(error) {
        if (error instanceof ApiError && error.isUnauthorized) {
          window.location.href = '/login'
          return
        }
        toastFromError(error)
      },
    }),
    mutationCache: new MutationCache({
      onError(error, _variables, _context, mutation) {
        // Se a mutação já tem onError próprio, não duplica o toast
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
