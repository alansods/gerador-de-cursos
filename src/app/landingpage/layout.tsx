import type { ReactNode } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import LandingNavbar from './_components/LandingNavbar'
import LandingFooter from './_components/LandingFooter'

export default async function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex min-h-screen flex-col">
        <LandingNavbar />
        <main className="flex-1">{children}</main>
        <LandingFooter />
      </div>
    </ThemeProvider>
  )
}
