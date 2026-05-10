import type { Metadata } from 'next'
import { HealthPreviewClient } from './health-client'

export const metadata: Metadata = {
  title: 'Bradesco Saúde Nacional II — Preview',
  description: 'Preview demonstrativo de cotação de plano de saúde empresarial.',
}

export default function HealthPreviewPage() {
  return <HealthPreviewClient />
}
