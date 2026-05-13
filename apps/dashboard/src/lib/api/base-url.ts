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

/** Where `/c/[token]` is hosted (usually this dashboard). Prefer in production over `window.location.origin`. */
export function getPublicLinkBaseUrlFromEnv(): string {
  return normalizeBaseUrl(process.env.NEXT_PUBLIC_PUBLIC_LINK_BASE_URL)
}

/** Header name sent to the API so a local/tunnel backend can see which deploy/surface called it. */
export const DASHBOARD_ENVIRONMENT_HEADER = 'X-Dashboard-Environment'

/**
 * Optional label for the dashboard build (e.g. `production`, `preview`, `demo-mayo`).
 * Set `NEXT_PUBLIC_DASHBOARD_ENVIRONMENT` in the hosted frontend; local API can log or filter on this header.
 */
export function getDashboardEnvironmentHeaders(): Record<string, string> {
  const v = (process.env.NEXT_PUBLIC_DASHBOARD_ENVIRONMENT ?? '').trim()
  if (!v) return {}
  return { [DASHBOARD_ENVIRONMENT_HEADER]: v }
}
