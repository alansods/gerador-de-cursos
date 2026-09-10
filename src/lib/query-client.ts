import { QueryClient } from '@tanstack/react-query'

export const STALE_TIME_PADRAO = 60_000
export const GC_TIME_PADRAO = 5 * 60_000

function criarQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_PADRAO,
        gcTime: GC_TIME_PADRAO,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  })
}

let queryClientDoBrowser: QueryClient | undefined

export function getQueryClient() {
  if (typeof window === 'undefined') return criarQueryClient()

  queryClientDoBrowser ??= criarQueryClient()
  return queryClientDoBrowser
}
