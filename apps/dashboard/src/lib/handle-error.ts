import { toast } from 'sonner'
import { ApiError } from './api/client'

export function handleError(error: unknown, fallback = 'Erro inesperado. Tente novamente.') {
  const message = error instanceof ApiError ? error.message : fallback
  toast.error(message)
}
