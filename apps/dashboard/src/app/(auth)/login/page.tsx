'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useLogin } from '@/hooks/auth/use-login'
import { handleError } from '@/lib/handle-error'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const justRegistered = searchParams.get('registered') === '1'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const login = useLogin()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    login.mutate({ email, password }, { onError: (err) => handleError(err) })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="font-display text-2xl font-bold text-mahogany">Corretor no Flow</span>
          <p className="mt-1 text-sm text-ink-muted">Acesse sua conta</p>
        </div>

        {justRegistered && (
          <div className="mb-4 rounded-lg bg-ember/10 border border-ember/30 px-4 py-3 text-sm text-ember">
            Conta criada! Faça login para continuar.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-ink">
              E-mail
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

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-ink">
                Senha
              </label>
              <Link href="/forgot-password" className="text-xs text-ink-muted hover:text-mahogany transition">
                Esqueci minha senha
              </Link>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-surface-strong bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-mahogany focus:ring-2 focus:ring-mahogany/20 transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={login.isPending}
            className="w-full rounded-lg bg-mahogany px-4 py-2.5 text-sm font-semibold text-gold hover:bg-mahogany-light disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {login.isPending ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Não tem conta?{' '}
          <Link href="/register" className="font-medium text-mahogany hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  )
}
