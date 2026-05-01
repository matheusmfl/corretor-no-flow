'use client'

import { useMutation } from '@tanstack/react-query'
import { forgotPasswordFn } from '@/lib/api/auth.api'

export function useForgotPassword() {
  return useMutation({ mutationFn: forgotPasswordFn })
}
