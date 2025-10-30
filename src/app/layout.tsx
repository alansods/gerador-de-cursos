import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { GeradorCursoProvider } from '@/context/GeradorCursoContext'
import { ProgressoProvider } from '@/context/ProgressoContext'
import { DatabaseInit } from '@/components/DatabaseInit'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Gerador de Cursos SCORM',
  description: 'Crie e exporte cursos em formato SCORM',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <GeradorCursoProvider>
          <ProgressoProvider>
            <DatabaseInit />
            {children}
          </ProgressoProvider>
        </GeradorCursoProvider>
      </body>
    </html>
  )
}
