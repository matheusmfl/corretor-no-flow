'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCurrentUser } from '@/hooks/auth/use-current-user'
import { useLogout } from '@/hooks/auth/use-logout'

// ─── Icons (inline SVG) ───────────────────────────────────────────────────────

function IconHome() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function IconFiles() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function IconBuilding() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" />
      <path d="M3 9h6" />
      <path d="M3 15h6" />
      <path d="M15 9h3" />
      <path d="M15 15h3" />
    </svg>
  )
}

function IconLogOut() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

function IconMenu() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function IconX() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

// ─── Nav config ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: 'Dashboard',  href: '/dashboard',         icon: <IconHome /> },
  { label: 'Cotações',   href: '/dashboard/quotes',   icon: <IconFiles /> },
  { label: 'Empresa',    href: '/dashboard/company',  icon: <IconBuilding /> },
]

// ─── Sidebar content ──────────────────────────────────────────────────────────

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { data: user } = useCurrentUser()
  const logout = useLogout()

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-mahogany-light/30">
        <span className="font-display text-base font-bold text-gold">Corretor no Flow</span>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gold/60 hover:text-gold transition lg:hidden"
            aria-label="Fechar menu"
          >
            <IconX />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-mahogany-light text-gold'
                  : 'text-gold/70 hover:bg-mahogany-light/50 hover:text-gold'
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-mahogany-light/30">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-ember flex items-center justify-center text-xs font-bold text-white shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gold truncate">{user?.name ?? '…'}</p>
            <p className="text-xs text-gold/50 truncate">{user?.email ?? ''}</p>
          </div>
        </div>
        <button
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="mt-1 flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-gold/60 hover:text-gold hover:bg-mahogany-light/50 disabled:opacity-50 transition-colors"
        >
          <IconLogOut />
          Sair
        </button>
      </div>
    </div>
  )
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  const currentPage = NAV_ITEMS.find((i) => i.href === pathname)?.label ?? 'Dashboard'

  return (
    <div className="min-h-screen bg-canvas flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 fixed inset-y-0 left-0 bg-mahogany z-30">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-mahogany flex flex-col transform transition-transform duration-200 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent onClose={() => setMobileOpen(false)} />
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col lg:ml-64 min-w-0">
        {/* Top header */}
        <header className="sticky top-0 z-20 flex items-center gap-4 bg-white border-b border-surface-strong px-4 lg:px-6 h-14">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden text-ink-muted hover:text-ink transition"
            aria-label="Abrir menu"
          >
            <IconMenu />
          </button>

          <h1 className="font-display font-semibold text-ink text-base flex-1 truncate">
            {currentPage}
          </h1>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
