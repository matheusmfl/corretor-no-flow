'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useResetPassword } from '@/hooks/auth/use-reset-password'
import { handleError } from '@/lib/handle-error'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  const reset = useResetPassword()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (password !== confirm) {
      toast.error('As senhas não coincidem.')
      return
    }

    if (!token) {
      toast.error('Link inválido. Solicite um novo e-mail de recuperação.')
      return
    }

    reset.mutate(
      { token, password },
      {
        onSuccess() {
          toast.success('Senha redefinida! Faça login com a nova senha.')
          router.push('/login')
        },
        onError(err) {
          handleError(err, 'Link inválido ou expirado. Solicite um novo.')
        },
      },
    )
  }

  if (!token) {
    return (
      <div className="rounded-xl border border-surface-strong bg-white p-6 text-center space-y-4">
        <p className="font-medium text-ink">Link inválido</p>
        <p className="text-sm text-ink-muted">
          Este link de recuperação é inválido ou já expirou.
        </p>
        <Link
          href="/forgot-password"
          className="block text-sm font-medium text-mahogany hover:underline"
        >
          Solicitar novo link
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="password" className="block text-sm font-medium text-ink">
          Nova senha
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-surface-strong bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-mahogany focus:ring-2 focus:ring-mahogany/20 transition"
          placeholder="Mínimo 8 caracteres"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="confirm" className="block text-sm font-medium text-ink">
          Confirmar senha
        </label>
        <input
          id="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-lg border border-surface-strong bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-mahogany focus:ring-2 focus:ring-mahogany/20 transition"
          placeholder="Repita a senha"
        />
      </div>

      <button
        type="submit"
        disabled={reset.isPending}
        className="w-full rounded-lg bg-mahogany px-4 py-2.5 text-sm font-semibold text-gold hover:bg-mahogany-light disabled:opacity-60 disabled:cursor-not-allowed transition"
      >
        {reset.isPending ? 'Salvando…' : 'Redefinir senha'}
      </button>

      <p className="text-center text-sm text-ink-muted">
        <Link href="/login" className="font-medium text-mahogany hover:underline">
          Voltar para o login
        </Link>
      </p>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="font-display text-2xl font-bold text-mahogany">Corretor no Flow</span>
          <p className="mt-1 text-sm text-ink-muted">Criar nova senha</p>
        </div>

        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
