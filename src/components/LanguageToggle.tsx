'use client'

import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const localeConfig = {
  'pt-BR': { flag: '🇧🇷', label: 'PT' },
  en: { flag: '🇺🇸', label: 'EN' },
}

export function LanguageToggle() {
  const locale = useLocale()
  const router = useRouter()

  const changeLanguage = (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`
    router.refresh()
  }

  const currentLocale = localeConfig[locale as keyof typeof localeConfig] || localeConfig['pt-BR']

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="px-3 py-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-border text-foreground hover:bg-muted transition-colors flex items-center gap-2"
          aria-label="Alterar idioma"
        >
          <span className="text-lg leading-none">{currentLocale.flag}</span>
          <span className="text-xs font-medium">{currentLocale.label}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => changeLanguage('pt-BR')}
          className={locale === 'pt-BR' ? 'bg-accent' : ''}
        >
          <span className="mr-2">🇧🇷</span>
          Português
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => changeLanguage('en')}
          className={locale === 'en' ? 'bg-accent' : ''}
        >
          <span className="mr-2">🇺🇸</span>
          English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
