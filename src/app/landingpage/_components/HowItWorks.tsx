'use client'

import { motion } from 'framer-motion'
import { Upload, Sparkles, Palette, Download, ArrowRight } from 'lucide-react'

const steps = [
  {
    icon: Upload,
    title: 'Crie ou Importe',
    description: 'Comece do zero ou importe documentos para gerar estrutura inicial com IA',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Palette,
    title: 'Edite Visualmente',
    description: 'Use o editor para adicionar quiz, accordion, vídeos, cards e outros recursos',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: Sparkles,
    title: 'Adicione Interatividade',
    description: 'Insira elementos interativos para engajar e avaliar seus alunos',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    icon: Download,
    title: 'Exporte e Publique',
    description: 'Baixe o pacote SCORM e publique em qualquer plataforma LMS',
    gradient: 'from-green-500 to-teal-500',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative overflow-hidden bg-muted/40 py-20 md:py-32">
      <div className="container mx-auto max-w-7xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            Fácil de usar
          </div>
          <h2 className="mt-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            Simples como{' '}
            <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              editar um documento
            </span>
          </h2>
          <p className="mt-6 text-xl leading-relaxed text-muted-foreground">
            Sem necessidade de programação ou design. Interface visual intuitiva.
          </p>
        </motion.div>

        <div className="relative mt-20">
          <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
            {steps.map((step, index) => {
              const Icon = step.icon

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative"
                >
                  <div className="rounded-2xl border bg-card p-8 shadow-lg transition-all hover:shadow-xl">
                    <div className="flex items-start gap-6">
                      <div
                        className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${step.gradient} shadow-lg`}
                      >
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="mb-2 text-sm font-bold text-primary">Passo {index + 1}</div>
                        <h3 className="text-2xl font-bold">{step.title}</h3>
                        <p className="mt-3 leading-relaxed text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
