'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Check, Sparkles, ArrowRight } from 'lucide-react'

const features = [
  'Editor visual sem código',
  'Quiz, Accordion, Vídeos e Cards',
  'Exportação SCORM 1.2',
  'IA opcional para estrutura inicial',
  'Suporte multilíngue (PT-BR/EN)',
  'Sem necessidade de equipe técnica',
]

export default function Pricing() {
  return (
    <section id="pricing" className="relative overflow-hidden py-20 md:py-32">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900" />

      <div className="container relative mx-auto max-w-7xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            Preços
          </div>
          <h2 className="mt-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            Comece{' '}
            <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              100% grátis
            </span>
          </h2>
          <p className="mt-6 text-xl leading-relaxed text-muted-foreground">
            Sem cartão de crédito. Sem pegadinhas. Código aberto e gratuito para sempre.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-16 max-w-2xl"
        >
          <div className="relative overflow-hidden rounded-3xl border-2 border-primary/20 bg-card shadow-2xl">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 opacity-10 blur-3xl" />

            <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-green-500 px-4 py-2 text-sm font-bold text-white shadow-lg">
              <Sparkles className="h-4 w-4" />
              <span>Open Source</span>
            </div>

            <div className="relative p-10 md:p-12">
              <div className="text-center">
                <h3 className="text-3xl font-bold">Plano Gratuito</h3>
                <div className="mt-6 flex items-baseline justify-center gap-2">
                  <span className="text-6xl font-bold tracking-tight">R$ 0</span>
                  <span className="text-2xl text-muted-foreground">/mês</span>
                </div>
                <p className="mt-3 text-muted-foreground">Todos os recursos, sem limites</p>
              </div>

              <div className="mt-10 space-y-4">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex items-center gap-4"
                  >
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-500/10">
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-base font-medium">{feature}</span>
                  </motion.div>
                ))}
              </div>

              <Button size="lg" className="group mt-10 w-full text-base" asChild>
                <Link href="/cadastro">
                  Começar Agora
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Não é necessário cartão de crédito • Comece em menos de 1 minuto
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
