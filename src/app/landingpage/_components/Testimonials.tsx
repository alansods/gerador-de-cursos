'use client'

import { motion } from 'framer-motion'
import useEmblaCarousel from 'embla-carousel-react'
import { useCallback } from 'react'
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react'
import { Button } from '@/components/ui/button'

const testimonials = [
  {
    text: 'Incrível! Transformei meus materiais de treinamento em cursos SCORM profissionais em minutos. A IA entendeu perfeitamente o conteúdo.',
    name: 'Ana Silva',
    role: 'Coordenadora Pedagógica',
    company: 'Instituto de Educação',
  },
  {
    text: 'Reduzi em 80% o tempo de criação de cursos. A exportação SCORM funciona perfeitamente no nosso Moodle.',
    name: 'Carlos Mendes',
    role: 'Instrutor EAD',
    company: 'Tech Academy',
  },
  {
    text: 'Ferramenta essencial para quem trabalha com educação corporativa. Interface intuitiva e resultado profissional.',
    name: 'Maria Santos',
    role: 'Gerente de Treinamento',
    company: 'Empresa Global',
  },
]

export default function Testimonials() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' })

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  return (
    <section id="testimonials" className="bg-muted/40 py-16 md:py-24">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            O que dizem nossos usuários
          </h2>
        </div>

        <div className="relative mt-12">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4">
              {testimonials.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="min-w-0 flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.333%]"
                >
                  <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <Quote className="mb-4 h-8 w-8 text-primary" />
                    <p className="text-muted-foreground">{item.text}</p>
                    <div className="mt-6 flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {item.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.role} - {item.company}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-center gap-2">
            <Button variant="outline" size="icon" onClick={scrollPrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={scrollNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
