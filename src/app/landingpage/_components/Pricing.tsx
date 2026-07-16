'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Check, Sparkles, ArrowRight, Zap, Crown } from 'lucide-react'

const plans = [
  {
    name: 'Gratuito',
    price: 0,
    description: 'Todos os recursos básicos',
    badge: { text: 'Open Source', icon: Sparkles, color: 'bg-green-500' },
    features: [
      'Editor visual sem código',
      'Quiz, Accordion, Vídeos e Cards',
      'Exportação SCORM 1.2',
      'IA opcional para estrutura inicial',
      'Suporte multilíngue (PT-BR/EN)',
      'Sem necessidade de equipe técnica',
    ],
    cta: 'Começar Agora',
    highlight: false,
  },
  {
    name: 'Pro',
    price: 49,
    description: 'IA avançada + recursos premium',
    badge: { text: 'Mais Popular', icon: Zap, color: 'bg-indigo-500' },
    features: [
      'Tudo do plano Gratuito',
      'Geração de conteúdo com IA',
      'Tradução automática de cursos',
      'Sugestões inteligentes de melhoria',
      'Análise de engajamento',
      'Suporte prioritário',
      'Temas personalizados',
    ],
    cta: 'Começar Teste Grátis',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 149,
    description: 'IA ilimitada + recursos corporativos',
    badge: { text: 'Empresarial', icon: Crown, color: 'bg-purple-500' },
    features: [
      'Tudo do plano Pro',
      'IA ilimitada para geração',
      'Assistente de curadoria automática',
      'Geração de quiz inteligente',
      'Analytics avançado',
      'White label',
      'SSO e integrações corporativas',
      'Suporte 24/7 dedicado',
    ],
    cta: 'Falar com Vendas',
    highlight: false,
  },
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
            Planos para{' '}
            <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              todos
            </span>
          </h2>
          <p className="mt-6 text-xl leading-relaxed text-muted-foreground">
            Comece grátis. Evolua com IA. Escale sem limites.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {plans.map((plan, index) => {
            const BadgeIcon = plan.badge.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative overflow-hidden rounded-3xl bg-card shadow-xl ${
                  plan.highlight
                    ? 'border-2 border-primary/50 ring-4 ring-primary/10'
                    : 'border border-border'
                }`}
              >
                <div
                  className={`absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 opacity-10 blur-3xl`}
                />

                <div
                  className={`absolute right-4 top-4 flex items-center gap-2 rounded-full ${plan.badge.color} px-3 py-1.5 text-xs font-bold text-white shadow-lg`}
                >
                  <BadgeIcon className="h-3.5 w-3.5" />
                  <span>{plan.badge.text}</span>
                </div>

                <div className="relative p-8">
                  <div>
                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                    <div className="mt-6 flex items-baseline gap-2">
                      <span className="text-5xl font-bold tracking-tight">R$ {plan.price}</span>
                      <span className="text-lg text-muted-foreground">/mês</span>
                    </div>
                  </div>

                  <div className="mt-8 space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start gap-3">
                        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-500/10">
                          <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm font-medium leading-tight">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    size="lg"
                    className={`group mt-8 w-full text-base ${
                      plan.highlight ? '' : 'variant-outline'
                    }`}
                    variant={plan.highlight ? 'default' : 'outline'}
                    asChild
                  >
                    <Link href={plan.price === 0 ? '/cadastro' : '#'}>
                      {plan.cta}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>

                  {plan.price === 0 && (
                    <p className="mt-4 text-center text-xs text-muted-foreground">
                      Sem cartão de crédito
                    </p>
                  )}
                  {plan.price > 0 && plan.price < 100 && (
                    <p className="mt-4 text-center text-xs text-muted-foreground">
                      14 dias grátis • Cancele quando quiser
                    </p>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
