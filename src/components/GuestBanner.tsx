// src/components/GuestBanner.tsx
'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Info } from 'lucide-react'

export function GuestBanner() {
  const { user } = useAuth()
  const router = useRouter()

  // Só renderiza se for convidado
  if (!user || user.cargo !== 'Convidado') {
    return null
  }

  return (
    <div className="sticky top-0 z-40 w-full border-b border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
      <div className="container flex flex-col items-center justify-between gap-2 py-3 sm:flex-row sm:gap-4">
        <div className="flex items-center gap-2 text-sm text-blue-900 dark:text-blue-100">
          <Info className="h-4 w-4 shrink-0" />
          <span>
            Você está usando uma conta convidado. Crie uma conta para salvar seu progresso.
          </span>
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={() => router.push('/?tab=cadastro')}
          className="shrink-0"
        >
          Criar Conta
        </Button>
      </div>
    </div>
  )
}
