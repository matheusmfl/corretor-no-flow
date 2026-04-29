import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string; quoteId: string }> },
) {
  const { token, quoteId } = await params

  const res = await fetch(`${API_URL}/api/public/c/${token}/quote/${quoteId}/html`, {
    cache: 'no-store',
  })

  if (res.status === 410) {
    return new NextResponse(expiredHtml(), {
      status: 410,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  if (!res.ok) {
    return new NextResponse(notFoundHtml(), {
      status: res.status,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  const html = await res.text()
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

// ─── Páginas de erro inline (sem dependência de React) ────────────────────────

function shell(emoji: string, title: string, body: string, backLabel: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { min-height: 100dvh; display: flex; align-items: center; justify-content: center;
         background: #f4f2ee; font-family: system-ui, sans-serif; padding: 24px; }
  .card { max-width: 360px; width: 100%; text-align: center; }
  .emoji { font-size: 48px; margin-bottom: 16px; }
  h1 { font-size: 20px; font-weight: 700; color: #1a1814; margin-bottom: 8px; }
  p  { font-size: 14px; color: #5a5750; line-height: 1.6; margin-bottom: 24px; }
  a  { display: inline-block; background: #3E1010; color: #f0a500; font-size: 14px;
       font-weight: 600; padding: 10px 24px; border-radius: 8px; text-decoration: none; }
</style>
</head>
<body>
  <div class="card">
    <div class="emoji">${emoji}</div>
    <h1>${title}</h1>
    <p>${body}</p>
    <a href="javascript:history.back()">${backLabel}</a>
  </div>
</body>
</html>`
}

function expiredHtml() {
  return shell('⏰', 'Link expirado', 'Este link de cotação já expirou. Entre em contato com seu corretor para obter um novo link.', '← Voltar')
}

function notFoundHtml() {
  return shell('🔍', 'Cotação não encontrada', 'Esta cotação não existe ou não está disponível.', '← Voltar')
}
