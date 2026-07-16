'use client'

import Link from 'next/link'

export default function LandingFooter() {
  const scrollToSection = (sectionId: string) => {
    const element = document.querySelector(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <footer className="border-t bg-muted/40">
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <h3 className="text-lg font-bold">SCORM Generator</h3>
            <p className="text-sm text-muted-foreground">Crie cursos profissionais com IA</p>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Links</h4>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => scrollToSection('#features')}
                className="text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Recursos
              </button>
              <button
                onClick={() => scrollToSection('#pricing')}
                className="text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Preços
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Sobre</h4>
            <div className="flex flex-col gap-2">
              <Link
                href="/login"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Login
              </Link>
              <Link
                href="/cadastro"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Cadastrar
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Contato</h4>
            <p className="text-sm text-muted-foreground">contact@example.com</p>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          © 2025 SCORM Generator. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  )
}
