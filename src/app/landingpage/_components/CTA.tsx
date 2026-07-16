'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles, Zap, Rocket } from 'lucide-react'

export default function CTA() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600" />

      <div className="absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 animate-pulse rounded-full bg-white/10 blur-3xl" />
        <div className="animation-delay-2000 absolute bottom-1/4 right-1/4 h-96 w-96 animate-pulse rounded-full bg-white/10 blur-3xl" />
      </div>

      <div className="container relative mx-auto max-w-7xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-4xl text-center text-white"
        >
          <div className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Sem código • Sem equipe técnica</span>
          </div>

          <h2 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            Qualquer pessoa pode{' '}
            <span className="relative">
              <span className="relative z-10">criar cursos</span>
              <span className="absolute inset-x-0 bottom-2 h-3 bg-yellow-400/50" />
            </span>{' '}
            profissionais
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-xl leading-relaxed text-white/90 md:text-2xl">
            Interface visual intuitiva. Não precisa de dev, designer ou conhecimento técnico. É só
            usar.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              variant="secondary"
              className="group min-w-[200px] text-base font-semibold shadow-xl"
              asChild
            >
              <Link href="/cadastro">
                <Rocket className="mr-2 h-5 w-5" />
                Começar Grátis
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="min-w-[200px] border-2 border-white bg-transparent text-base font-semibold text-white hover:bg-white/10"
              onClick={() => {
                document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              <Zap className="mr-2 h-5 w-5" />
              Ver Recursos
            </Button>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <div className="h-10 w-10 rounded-full border-2 border-white bg-gradient-to-br from-blue-400 to-indigo-500" />
                <div className="h-10 w-10 rounded-full border-2 border-white bg-gradient-to-br from-purple-400 to-pink-500" />
                <div className="h-10 w-10 rounded-full border-2 border-white bg-gradient-to-br from-green-400 to-teal-500" />
                <div className="h-10 w-10 rounded-full border-2 border-white bg-gradient-to-br from-orange-400 to-red-500" />
              </div>
              <div className="text-left">
                <div className="font-bold">500+</div>
                <div className="text-white/80">Cursos criados</div>
              </div>
            </div>

            <div className="h-12 w-px bg-white/20" />

            <div className="text-left">
              <div className="font-bold">100%</div>
              <div className="text-white/80">Gratuito e Open Source</div>
            </div>

            <div className="h-12 w-px bg-white/20" />

            <div className="text-left">
              <div className="font-bold">⚡ Rápido</div>
              <div className="text-white/80">Cursos em minutos</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
