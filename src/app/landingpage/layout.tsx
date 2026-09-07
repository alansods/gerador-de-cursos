import type { ReactNode } from 'react'
import { LandingThemeProvider } from '@/components/LandingThemeProvider'
import LandingNavbar from './_components/LandingNavbar'
import LandingFooter from './_components/LandingFooter'

export default async function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <LandingThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex min-h-screen flex-col">
        <LandingNavbar />
        <main className="flex-1">{children}</main>
        <LandingFooter />
      </div>
    </LandingThemeProvider>
  )
}
