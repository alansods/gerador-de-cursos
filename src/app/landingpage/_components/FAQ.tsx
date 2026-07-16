'use client'

import { motion } from 'framer-motion'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqItems = [
  {
    question: 'O que é SCORM?',
    answer:
      'SCORM (Sharable Content Object Reference Model) é um padrão técnico para conteúdo de e-learning que garante compatibilidade entre cursos e plataformas LMS.',
  },
  {
    question: 'Como funciona a geração com IA?',
    answer:
      'Nossa IA analisa o texto ou documento que você fornece e gera automaticamente um curso estruturado com unidades, conteúdo e avaliações.',
  },
  {
    question: 'Posso editar os cursos após a geração?',
    answer:
      'Sim! Você tem controle total para editar, adicionar ou remover conteúdo usando nosso editor visual intuitivo.',
  },
  {
    question: 'Qual formato de arquivo é exportado?',
    answer:
      'Exportamos no formato SCORM 1.2, compatível com a maioria das plataformas LMS como Moodle, Canvas, Blackboard e outros.',
  },
  {
    question: 'Preciso de conhecimento técnico para usar?',
    answer:
      'Não! Nossa interface foi projetada para ser intuitiva e fácil de usar, mesmo para quem não tem experiência técnica.',
  },
  {
    question: 'Posso usar meus próprios documentos?',
    answer:
      'Sim! Você pode fazer upload de PDFs, documentos Word ou colar texto diretamente para gerar cursos a partir do seu conteúdo.',
  },
]

export default function FAQ() {
  return (
    <section id="faq" className="bg-muted/40 py-16 md:py-24">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Perguntas Frequentes</h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-12"
        >
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
}
