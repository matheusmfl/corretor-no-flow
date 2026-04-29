import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/c/']
const AUTH_PATHS   = ['/login', '/register']

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const hasSession = req.cookies.has('access_token')

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  const isAuth   = AUTH_PATHS.some((p) => pathname.startsWith(p))

  // Authenticated user tenta acessar login/register → manda pro dashboard
  if (isAuth && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Rota protegida sem sessão → manda pro login
  if (!isPublic && !hasSession) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Roda em todas as rotas exceto:
     * - _next/static, _next/image (assets do Next.js)
     * - favicon.ico
     * - arquivos com extensão (js, css, png, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
