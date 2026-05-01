import { useState, useCallback } from 'react'
import { stripMask } from '@/lib/masks'

interface CepResult {
  city: string
  state: string
  street: string | null
  neighborhood: string | null
}

interface UseCepReturn {
  fetchCep: (cep: string) => Promise<CepResult | null>
  isLoading: boolean
}

export function useCep(): UseCepReturn {
  const [isLoading, setIsLoading] = useState(false)

  const fetchCep = useCallback(async (cep: string): Promise<CepResult | null> => {
    const digits = stripMask(cep)
    if (digits.length !== 8) return null

    setIsLoading(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      if (!res.ok) return null
      const data = await res.json()
      if (data.erro) return null
      return {
        city: data.localidade,
        state: data.uf,
        street: data.logradouro || null,
        neighborhood: data.bairro || null,
      }
    } catch {
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { fetchCep, isLoading }
}
