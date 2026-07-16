import type { Metadata } from 'next'
import Hero from './_components/Hero'
import Features from './_components/Features'
import HowItWorks from './_components/HowItWorks'
import UseCases from './_components/UseCases'
import Testimonials from './_components/Testimonials'
import Pricing from './_components/Pricing'
import FAQ from './_components/FAQ'
import CTA from './_components/CTA'
import SectionDivider from './_components/SectionDivider'

export const metadata: Metadata = {
  title: 'Gerador de Cursos SCORM com IA | Crie Cursos em Minutos',
  description:
    'Transforme seus conteúdos em cursos SCORM profissionais automaticamente usando IA. Exportação compatível com qualquer LMS como Moodle, Canvas e Blackboard.',
  keywords: ['scorm', 'lms', 'cursos', 'elearning', 'ia', 'google gemini', 'moodle', 'canvas'],
  authors: [{ name: 'SCORM Generator' }],
  openGraph: {
    title: 'Gerador de Cursos SCORM com IA',
    description: 'Crie cursos SCORM profissionais em minutos com inteligência artificial',
    type: 'website',
    locale: 'pt_BR',
    alternateLocale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gerador de Cursos SCORM com IA',
    description: 'Crie cursos SCORM profissionais em minutos',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function LandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Gerador de Cursos SCORM',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BRL',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />

      <SectionDivider variant="simple" />

      <Features />

      <SectionDivider variant="gradient" />

      <HowItWorks />

      <SectionDivider variant="dots" />

      <UseCases />

      <SectionDivider variant="gradient" />

      <Testimonials />

      <SectionDivider variant="simple" />

      <Pricing />

      <SectionDivider variant="gradient" />

      <FAQ />

      <SectionDivider variant="dots" />

      <CTA />
    </>
  )
}
