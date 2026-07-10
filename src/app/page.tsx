import { redirect } from 'next/navigation'

// Esta página não deve ser exportada estaticamente (redireciona)
export const dynamic = 'error'

export default function Home() {
  redirect('/login')
}
