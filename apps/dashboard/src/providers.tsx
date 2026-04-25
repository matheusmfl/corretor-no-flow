'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { Toaster } from 'sonner'
import { ApiError } from '@/lib/api/client'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,       // 1 min — evita refetch desnecessário
        retry: (failureCount, error) => {
          // Não tenta de novo em erros de autenticação ou not found
          if (error instanceof ApiError && (error.isUnauthorized || error.isNotFound)) {
            return false
          }
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
  const router = useRouter()
  const [queryClient] = useState(() => {
    const client = makeQueryClient()

    // Redireciona para /login em qualquer 401 não recuperado
    client.getQueryCache().subscribe((event) => {
      if (
        event.type === 'updated' &&
        event.action.type === 'error' &&
        event.action.error instanceof ApiError &&
        event.action.error.isUnauthorized
      ) {
        router.push('/login')
      }
    })

    return client
  })

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
