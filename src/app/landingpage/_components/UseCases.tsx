'use client'

import { motion } from 'framer-motion'
import { Building2, GraduationCap, Briefcase, User } from 'lucide-react'

const useCases = [
  {
    icon: Building2,
    title: 'Empresas e RH',
    description:
      'Crie programas de treinamento corporativo, onboarding de novos colaboradores e capacitações técnicas com rapidez e qualidade profissional.',
    benefit: 'Reduza custos e acelere o desenvolvimento de equipes',
  },
  {
    icon: GraduationCap,
    title: 'Instituições de Ensino',
    description:
      'Transforme conteúdo acadêmico em cursos online interativos, compatíveis com Moodle e outras plataformas educacionais.',
    benefit: 'Amplie o alcance do ensino e facilite o aprendizado híbrido',
  },
  {
    icon: Briefcase,
    title: 'Consultores e Freelancers',
    description:
      'Ofereça cursos personalizados para seus clientes de forma profissional e escalável, sem necessidade de equipe técnica.',
    benefit: 'Aumente sua receita com produtos digitais de alta qualidade',
  },
  {
    icon: User,
    title: 'Instrutores Independentes',
    description:
      'Crie e venda seus próprios cursos online de forma autônoma, com exportação para qualquer plataforma LMS do mercado.',
    benefit: 'Monetize seu conhecimento com autonomia total',
  },
]

export default function UseCases() {
  return (
    <section id="use-cases" className="py-20 md:py-32">
      <div className="container mx-auto max-w-7xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            Casos de Uso
          </div>
          <h2 className="mt-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            Para quem é{' '}
            <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              este editor
            </span>
          </h2>
          <p className="mt-6 text-xl leading-relaxed text-muted-foreground">
            Qualquer pessoa ou organização que precise criar cursos SCORM profissionais
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:gap-8">
          {useCases.map((item, index) => {
            const Icon = item.icon

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
                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 blur-2xl transition-opacity group-hover:opacity-100" />

                  <div className="relative">
                    <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                      <Icon className="h-7 w-7 text-white" />
                    </div>

                    <h3 className="text-2xl font-bold">{item.title}</h3>
                    <p className="mt-4 leading-relaxed text-muted-foreground">{item.description}</p>

                    <div className="mt-6 flex items-start gap-2 rounded-lg bg-primary/5 p-4">
                      <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-xs font-bold text-primary">✓</span>
                      </div>
                      <p className="text-sm font-medium text-primary">{item.benefit}</p>
                    </div>
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
