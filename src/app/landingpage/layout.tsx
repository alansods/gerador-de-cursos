import type { ReactNode } from 'react'
import LandingNavbar from './_components/LandingNavbar'
import LandingFooter from './_components/LandingFooter'

export default async function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingNavbar />
      <main className="flex-1">{children}</main>
      <LandingFooter />
    </div>
  )
}
