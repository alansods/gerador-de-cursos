'use client'

import { motion } from 'framer-motion'
import { Sparkles, FileText, Palette, Package, Globe, Lock } from 'lucide-react'

const features = [
  {
    icon: Palette,
    title: 'Editor Visual Completo',
    description:
      'Crie e edite cursos com interface drag-and-drop intuitiva e preview em tempo real',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: FileText,
    title: 'Recursos Interativos',
    description: 'Accordion, Quiz, Cards, Vídeos e muito mais para engajar seus alunos',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Sparkles,
    title: 'IA Opcional',
    description: 'Geração automática de estrutura de curso a partir de documentos (Gemini/OpenAI)',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    icon: Package,
    title: 'Exportação SCORM',
    description: 'Exporte no padrão SCORM 1.2 compatível com Moodle, Canvas, Blackboard e outros',
    gradient: 'from-green-500 to-teal-500',
  },
  {
    icon: Globe,
    title: 'Multilíngue',
    description: 'Crie cursos em português e inglês com suporte completo a internacionalização',
    gradient: 'from-indigo-500 to-purple-500',
  },
  {
    icon: Lock,
    title: 'Seguro e Confiável',
    description: 'Autenticação JWT, proteção de dados e gerenciamento completo de usuários',
    gradient: 'from-slate-700 to-slate-900',
  },
]

export default function Features() {
  return (
    <section id="features" className="relative bg-background py-20 md:py-32">
      <div className="container mx-auto max-w-7xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            Recursos
          </div>
          <h2 className="mt-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            Simples e{' '}
            <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              poderoso
            </span>
          </h2>
          <p className="mt-6 text-xl leading-relaxed text-muted-foreground">
            Recursos profissionais sem complexidade técnica. Qualquer pessoa pode usar.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative"
              >
                <div className="relative overflow-hidden rounded-2xl border bg-card p-8 shadow-sm transition-all duration-300 hover:shadow-xl">
                  <div
                    className={`absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${feature.gradient} opacity-10 blur-2xl transition-opacity group-hover:opacity-20`}
                  />

                  <div className="relative">
                    <div
                      className={`inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg`}
                    >
                      <Icon className="h-7 w-7 text-white" />
                    </div>

                    <h3 className="mt-6 text-xl font-bold">{feature.title}</h3>
                    <p className="mt-3 leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
