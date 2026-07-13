import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { GeradorCursoProvider } from '@/context/GeradorCursoContext'
import { ProgressoProvider } from '@/context/ProgressoContext'
import { AuthProviderWrapper } from '@/components/AuthProviderWrapper'
import { ThemeProvider } from '@/components/ThemeProvider'
import { I18nProvider } from '@/i18n/provider'
import { Toaster } from 'sonner'
import { cookies } from 'next/headers'
import { defaultLocale, type Locale } from '@/i18n/config'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Gerador de Cursos SCORM',
  description: 'Crie e exporte cursos em formato SCORM',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  let locale: Locale = defaultLocale

  if (process.env.NEXT_OUTPUT_EXPORT !== 'true') {
    const cookieStore = await cookies()
    const localeCookie = cookieStore.get('NEXT_LOCALE')
    locale = (localeCookie?.value as Locale) || defaultLocale
  }

  // Import all namespace files and wrap them in their namespace keys
  const messages = {
    common: (await import(`@/i18n/locales/${locale}/common.json`)).default,
    auth: (await import(`@/i18n/locales/${locale}/auth.json`)).default,
    courses: (await import(`@/i18n/locales/${locale}/courses.json`)).default,
    home: (await import(`@/i18n/locales/${locale}/home.json`)).default,
    users: (await import(`@/i18n/locales/${locale}/users.json`)).default,
    scorm: (await import(`@/i18n/locales/${locale}/scorm.json`)).default,
    errors: (await import(`@/i18n/locales/${locale}/errors.json`)).default,
  }

  return (
    <html lang={locale}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <I18nProvider locale={locale} messages={messages}>
          <ThemeProvider>
            <AuthProviderWrapper>
              <GeradorCursoProvider>
                <ProgressoProvider>{children}</ProgressoProvider>
              </GeradorCursoProvider>
            </AuthProviderWrapper>
            <Toaster position="bottom-right" richColors closeButton />
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
