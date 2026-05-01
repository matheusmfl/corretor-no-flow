function normalizeBaseUrl(value: string | undefined) {
  return (value ?? '').trim().replace(/\/+$/, '')
}

export function getBrowserApiBaseUrl() {
  return normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL)
}

export function getServerApiBaseUrl() {
  return (
    normalizeBaseUrl(process.env.API_INTERNAL_URL) ||
    normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL) ||
    'http://localhost:3001'
  )
}
