'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useRegister } from '@/hooks/auth/use-register'
import { handleError } from '@/lib/handle-error'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  const register = useRegister()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (password !== confirm) {
      toast.error('As senhas não coincidem.')
      return
    }

    register.mutate({ name, email, password }, { onError: (err) => handleError(err) })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="font-display text-2xl font-bold text-mahogany">Corretor no Flow</span>
          <p className="mt-1 text-sm text-ink-muted">Crie sua conta gratuita</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="name" className="block text-sm font-medium text-ink">
              Nome completo
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-surface-strong bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-mahogany focus:ring-2 focus:ring-mahogany/20 transition"
              placeholder="João Silva"
            />
          </div>

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
            <label htmlFor="password" className="block text-sm font-medium text-ink">
              Senha
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
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-surface-strong bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-mahogany focus:ring-2 focus:ring-mahogany/20 transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={register.isPending}
            className="w-full rounded-lg bg-mahogany px-4 py-2.5 text-sm font-semibold text-gold hover:bg-mahogany-light disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {register.isPending ? 'Criando conta…' : 'Criar conta'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Já tem conta?{' '}
          <Link href="/login" className="font-medium text-mahogany hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
