'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useForgotPassword } from '@/hooks/auth/use-forgot-password'
import { handleError } from '@/lib/handle-error'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const forgot = useForgotPassword()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    forgot.mutate(
      { email },
      {
        onSuccess() {
          setSent(true)
        },
        onError(err) {
          handleError(err)
        },
      },
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="font-display text-2xl font-bold text-mahogany">Corretor no Flow</span>
          <p className="mt-1 text-sm text-ink-muted">Recuperar senha</p>
        </div>

        {sent ? (
          <div className="rounded-xl border border-surface-strong bg-white p-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-ember/10 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ember">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-ink">E-mail enviado!</p>
              <p className="mt-1 text-sm text-ink-muted">
                Se existe uma conta com <span className="font-medium text-ink">{email}</span>,
                você receberá um link para redefinir sua senha em instantes.
              </p>
            </div>
            <p className="text-xs text-ink-faint">Verifique também a caixa de spam.</p>
            <Link
              href="/login"
              className="block text-sm font-medium text-mahogany hover:underline"
            >
              Voltar para o login
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="email" className="block text-sm font-medium text-ink">
                  E-mail da sua conta
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-surface-strong bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-mahogany focus:ring-2 focus:ring-mahogany/20 transition"
                  placeholder="seu@email.com"
                />
              </div>

              <button
                type="submit"
                disabled={forgot.isPending}
                className="w-full rounded-lg bg-mahogany px-4 py-2.5 text-sm font-semibold text-gold hover:bg-mahogany-light disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {forgot.isPending ? 'Enviando…' : 'Enviar link de recuperação'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-ink-muted">
              Lembrou a senha?{' '}
              <Link href="/login" className="font-medium text-mahogany hover:underline">
                Voltar para o login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
