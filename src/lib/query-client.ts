import { QueryClient } from '@tanstack/react-query'

export const DEFAULT_STALE_TIME = 60_000
export const DEFAULT_GC_TIME = 5 * 60_000

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: DEFAULT_STALE_TIME,
        gcTime: DEFAULT_GC_TIME,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

export function getQueryClient() {
  if (typeof window === 'undefined') return createQueryClient()

  browserQueryClient ??= createQueryClient()
  return browserQueryClient
}
