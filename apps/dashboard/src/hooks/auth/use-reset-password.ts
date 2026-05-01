'use client'

import { useMutation } from '@tanstack/react-query'
import { resetPasswordFn } from '@/lib/api/auth.api'

export function useResetPassword() {
  return useMutation({ mutationFn: resetPasswordFn })
}
