'use client'

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { ILLUSTRATIONS_MANIFEST_URL, type IllustrationManifest } from '@/lib/illustration-catalog'

export function useIllustrationManifestQuery() {
  return useQuery({
    queryKey: queryKeys.illustrations.manifest,
    queryFn: async (): Promise<IllustrationManifest> => {
      const response = await fetch(ILLUSTRATIONS_MANIFEST_URL)
      if (!response.ok) throw new Error('Não foi possível carregar o acervo de ilustrações')
      return response.json()
    },
    staleTime: Infinity,
  })
}
