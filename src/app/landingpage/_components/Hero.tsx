'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles, Zap } from 'lucide-react'

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900"
    >
      <div className="absolute inset-0 bg-grid-slate-900/[0.04] dark:bg-grid-slate-100/[0.03]" />
      <div className="absolute -left-4 top-0 h-72 w-72 animate-blob rounded-full bg-purple-300 opacity-20 mix-blend-multiply blur-xl filter dark:opacity-10" />
      <div className="animation-delay-2000 absolute -right-4 top-0 h-72 w-72 animate-blob rounded-full bg-indigo-300 opacity-20 mix-blend-multiply blur-xl filter dark:opacity-10" />
      <div className="animation-delay-4000 absolute -bottom-8 left-20 h-72 w-72 animate-blob rounded-full bg-blue-300 opacity-20 mix-blend-multiply blur-xl filter dark:opacity-10" />

      <div className="container relative mx-auto max-w-7xl px-4 py-24 md:py-32 lg:py-40">
        <div className="grid gap-12 md:grid-cols-2 md:items-center md:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              <span>Sem necessidade de equipe técnica</span>
            </div>

            <h1 className="text-5xl font-bold leading-[1.1] tracking-tight md:text-6xl lg:text-7xl">
              Crie Cursos SCORM{' '}
              <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                Sem Programar
              </span>
            </h1>

            <p className="text-xl leading-relaxed text-muted-foreground md:text-2xl">
              Editor visual intuitivo. Qualquer pessoa pode criar cursos profissionais com quiz,
              vídeos e recursos interativos. Sem dev, sem designer, sem complicação.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Button size="lg" className="group text-base" asChild>
                <Link href="/cadastro">
                  Começar Grátis
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base"
                onClick={() => {
                  document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                <Zap className="mr-2 h-4 w-4" />
                Ver Como Funciona
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10">
                  <span className="text-lg">✓</span>
                </div>
                <span className="font-medium">Sem código</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10">
                  <span className="text-lg">✓</span>
                </div>
                <span className="font-medium">Interface visual</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10">
                  <span className="text-lg">✓</span>
                </div>
                <span className="font-medium">500+ cursos criados</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 opacity-20 blur-2xl" />
            <div className="relative rounded-2xl border bg-card/50 p-6 shadow-2xl backdrop-blur-sm">
              <div className="aspect-video rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" />
            </div>
            <div className="absolute -right-4 -top-4 rounded-xl bg-green-500 px-4 py-2 text-sm font-bold text-white shadow-lg">
              100% Grátis
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
