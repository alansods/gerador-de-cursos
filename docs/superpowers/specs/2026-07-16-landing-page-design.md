# Landing Page Marketing - Design Specification

**Data:** 2026-07-16
**Tipo:** Nova Feature
**Escopo:** Landing page de marketing para aquisição de usuários

---

## 1. Visão Geral

Criar uma landing page completa na raiz do site (`/`) para apresentar o Gerador de Cursos SCORM a visitantes externos, substituindo o redirect atual para `/login`. A landing page será focada em marketing e conversão, com design visualmente atraente e moderno.

### Objetivos

- Apresentar o produto para visitantes que ainda não conhecem a plataforma
- Destacar recursos, benefícios e casos de uso
- Converter visitantes em usuários registrados via CTAs para `/cadastro` e `/login`
- Manter SEO otimizado com conteúdo na raiz do domínio
- Suportar internacionalização (PT-BR/EN) usando next-intl já configurado

### Público-alvo

Profissionais de educação, instrutores, empresas e instituições que precisam criar cursos SCORM de forma rápida e eficiente usando IA.

---

## 2. Arquitetura

### Abordagem Escolhida: Landing no mesmo repositório (raiz `/`)

A landing page será implementada na raiz do site existente, aproveitando toda a infraestrutura já configurada (Next.js 15, i18n, Tailwind, Vercel).

**Justificativa:**

- Aproveita setup existente (Next.js, next-intl, Tailwind v4, shadcn/ui, Framer Motion)
- Deploy único e simples
- Rotas SEO-friendly (`/` = conteúdo principal)
- Code splitting automático do Next.js 15 garante bundles otimizados
- Sem duplicação de código ou configuração

### Estrutura de Rotas

```
/                           → Landing page (marketing)
/login                      → Autenticação (mantém atual)
/cadastro                   → Registro (mantém atual)
/home                       → Dashboard (após login, mantém atual)
/cursos                     → Aplicação interna (mantém atual)
/usuarios                   → Gestão usuários (mantém atual)
...demais rotas da aplicação mantidas
```

### Estrutura de Pastas (Route Groups)

```
src/app/
├── (landing)/                    # Route group para landing
│   ├── layout.tsx                # Layout minimalista (sem sidebar/navbar interna)
│   ├── page.tsx                  # Landing page completa
│   └── _components/              # Componentes específicos da landing
│       ├── Hero.tsx
│       ├── Features.tsx
│       ├── HowItWorks.tsx
│       ├── UseCases.tsx
│       ├── Testimonials.tsx
│       ├── Pricing.tsx
│       ├── FAQ.tsx
│       ├── CTA.tsx
│       ├── LandingNavbar.tsx
│       └── LandingFooter.tsx
├── (app)/                        # Route group para aplicação autenticada
│   ├── layout.tsx                # Layout atual (navbar/sidebar)
│   ├── home/
│   ├── cursos/
│   └── ...demais rotas
├── login/                        # Rotas públicas fora dos groups
├── cadastro/
└── ...outras rotas públicas
```

**Benefícios dos Route Groups:**

- Layouts completamente diferentes (landing vs app)
- Organização clara de concerns
- Não afeta as URLs (são grupos lógicos)
- Facilita manutenção e navegação no código

---

## 3. Seções da Landing Page

A landing page terá estrutura completa com as seguintes seções, apresentadas em ordem vertical:

### 3.1 Navbar

**Conteúdo:**

- Logo/nome do produto (esquerda)
- Links de navegação: Recursos, Como Funciona, Casos de Uso, Preços, FAQ
- Toggle de idioma (PT-BR/EN)
- Botões CTA: "Login" e "Começar Grátis" (destaque)

**Comportamento:**

- Fixed/sticky no topo ao fazer scroll
- Mobile: menu hamburger responsivo

---

### 3.2 Hero Section

**Conteúdo:**

- Título principal chamativo (H1)
- Subtítulo explicativo (proposta de valor)
- 2 CTAs principais: "Começar Grátis" (primário) e "Ver como funciona" (secundário, scroll suave)
- Imagem/ilustração/mockup da ferramenta (lado direito no desktop)

**Design:**

- Gradientes de fundo modernos
- Animações sutis de entrada (Framer Motion)
- Layout 2 colunas no desktop (60/40), stack no mobile

**Exemplo de conteúdo:**

- **Título:** "Crie Cursos SCORM Profissionais em Minutos com IA"
- **Subtítulo:** "Transforme seus conteúdos em cursos SCORM completos automaticamente. Powered by Google Gemini."

---

### 3.3 Features (Recursos Principais)

**Conteúdo:**

- Grid de 4-6 cards com ícones
- Cada card: ícone (Lucide), título, descrição curta

**Recursos sugeridos:**

- ⚡ Geração com IA (Google Gemini/OpenAI)
- 📄 Importação de documentos (PDF, DOCX)
- 🎨 Editor visual interativo
- 📦 Exportação SCORM 1.2/2004
- 🌍 Compatível com qualquer LMS
- 🔒 Seguro e privado

**Design:**

- Cards com hover effects
- Animação de entrada escalonada (stagger)
- Responsivo: 3 colunas desktop, 2 tablet, 1 mobile

---

### 3.4 How It Works (Como Funciona)

**Conteúdo:**

- 3-4 passos numerados mostrando o fluxo
- Cada passo: número, título, descrição, mini ilustração

**Passos sugeridos:**

1. **Upload ou Cole o Conteúdo** - Envie PDF/DOCX ou cole texto
2. **IA Gera o Curso** - Nossa IA estrutura automaticamente em unidades
3. **Personalize** - Edite títulos, adicione imagens, ajuste conteúdo
4. **Exporte SCORM** - Download do pacote pronto para seu LMS

**Design:**

- Timeline vertical (mobile) ou horizontal (desktop)
- Animação de progresso ao scrollar
- Ícones temáticos para cada passo

---

### 3.5 Use Cases (Casos de Uso)

**Conteúdo:**

- 3-4 scenarios práticos com ilustração
- Cada caso: título, descrição, benefício

**Casos sugeridos:**

- **Educação Corporativa:** Treinamentos internos rápidos
- **Instituições de Ensino:** Cursos EAD estruturados
- **Consultores:** Entrega ágil para clientes
- **Freelancers:** Criação escalável de conteúdo

**Design:**

- Cards grandes com imagem/ilustração
- Alternância esquerda/direita (zigzag no desktop)
- Hover effects sutis

---

### 3.6 Testimonials (Depoimentos)

**Conteúdo:**

- 3-6 depoimentos de usuários fictícios (inicialmente)
- Cada depoimento: texto, nome, cargo, empresa, foto

**Design:**

- Carousel/slider horizontal (Embla Carousel)
- Cards com aspas, foto circular
- Auto-play opcional com pause on hover

**Nota:** Conteúdo hardcoded inicialmente. Pode ser substituído por depoimentos reais futuramente.

---

### 3.7 Pricing (Planos/Preços)

**Conteúdo:**

- Seção simplificada de "Acesso Gratuito"
- Título: "Comece a Criar Hoje"
- Subtítulo: "Acesso gratuito para começar a usar agora mesmo"
- Descrição: Breve texto explicando que o cadastro é gratuito
- CTA único: "Criar Conta Grátis"

**Design:**

- Card centralizado (não múltiplos cards de planos)
- Destaque visual com borda ou gradiente
- Botão CTA grande e proeminente
- Fundo contrastante para destacar a seção

---

### 3.8 FAQ (Perguntas Frequentes)

**Conteúdo:**

- Accordion com 6-10 perguntas comuns
- Cada item: pergunta (clicável) + resposta (expandível)

**Perguntas sugeridas:**

- O que é SCORM?
- Quais formatos de arquivo são suportados?
- O curso gerado funciona em qual LMS?
- Preciso de conhecimento técnico?
- Como funciona a geração por IA?
- Existe limite de cursos?

**Design:**

- Radix UI Accordion
- Ícone + ou - indicando estado
- Animação suave de expansão

---

### 3.9 Final CTA Section

**Conteúdo:**

- Título chamativo final
- Texto reforçando proposta de valor
- CTA grande: "Começar Agora - É Grátis"

**Design:**

- Fundo com gradiente ou cor sólida contrastante
- Seção full-width
- Botão CTA proeminente

---

### 3.10 Footer

**Conteúdo:**

- Logo/nome do produto
- Links úteis: Sobre, Recursos, Preços, Contato
- Link para Login/Cadastro
- Copyright e informações legais
- Ícones de redes sociais (se aplicável)

**Design:**

- Layout multi-coluna no desktop
- Stack simples no mobile
- Fundo neutro escuro ou claro (conforme tema)

---

## 4. Internacionalização (i18n)

### Configuração

Usar `next-intl` já configurado no projeto com suporte a PT-BR (padrão) e EN.

### Namespaces

Criar novo namespace `landing.json` em:

```
src/i18n/locales/pt-BR/landing.json
src/i18n/locales/en/landing.json
```

### Estrutura do JSON

```json
{
  "nav": {
    "features": "Recursos",
    "howItWorks": "Como Funciona",
    "useCases": "Casos de Uso",
    "pricing": "Preços",
    "faq": "FAQ",
    "login": "Login",
    "signUp": "Começar Grátis"
  },
  "hero": {
    "title": "Crie Cursos SCORM Profissionais em Minutos com IA",
    "subtitle": "Transforme seus conteúdos em cursos SCORM completos automaticamente. Powered by Google Gemini.",
    "ctaPrimary": "Começar Grátis",
    "ctaSecondary": "Ver como funciona"
  },
  "features": {
    "title": "Recursos Principais",
    "subtitle": "Tudo que você precisa para criar cursos profissionais",
    "items": [
      {
        "title": "Geração com IA",
        "description": "Use Google Gemini ou OpenAI para estruturar seu conteúdo automaticamente"
      },
      {
        "title": "Importação de Documentos",
        "description": "Envie arquivos PDF ou DOCX e extraia o conteúdo instantaneamente"
      },
      {
        "title": "Editor Visual",
        "description": "Personalize títulos, textos, imagens e estrutura com interface intuitiva"
      },
      {
        "title": "Exportação SCORM",
        "description": "Gere pacotes SCORM 1.2 compatíveis com qualquer LMS"
      },
      {
        "title": "Compatível com LMS",
        "description": "Funciona com Moodle, Canvas, Blackboard e outros sistemas"
      },
      {
        "title": "Seguro e Privado",
        "description": "Seus dados e conteúdos protegidos com criptografia"
      }
    ]
  },
  "howItWorks": {
    "title": "Como Funciona",
    "subtitle": "Crie cursos em 4 passos simples",
    "steps": [
      {
        "number": "01",
        "title": "Upload ou Cole o Conteúdo",
        "description": "Envie PDF/DOCX ou cole texto diretamente na plataforma"
      },
      {
        "number": "02",
        "title": "IA Gera o Curso",
        "description": "Nossa IA estrutura automaticamente em unidades e lições"
      },
      {
        "number": "03",
        "title": "Personalize",
        "description": "Edite títulos, adicione imagens e ajuste o conteúdo"
      },
      {
        "number": "04",
        "title": "Exporte SCORM",
        "description": "Download do pacote pronto para seu LMS"
      }
    ]
  },
  "useCases": {
    "title": "Casos de Uso",
    "subtitle": "Para quem é essa ferramenta?",
    "items": [
      {
        "title": "Educação Corporativa",
        "description": "Crie treinamentos internos rápidos para suas equipes",
        "benefit": "Economize tempo e recursos na produção de conteúdo"
      },
      {
        "title": "Instituições de Ensino",
        "description": "Estruture cursos EAD com qualidade profissional",
        "benefit": "Escale a produção de cursos mantendo a qualidade"
      },
      {
        "title": "Consultores",
        "description": "Entregue cursos para clientes com agilidade",
        "benefit": "Aumente sua capacidade de entrega sem contratar mais pessoas"
      },
      {
        "title": "Freelancers",
        "description": "Criação escalável de conteúdo educacional",
        "benefit": "Atenda mais projetos simultaneamente"
      }
    ]
  },
  "testimonials": {
    "title": "O que dizem nossos usuários",
    "items": [
      {
        "text": "Reduzi o tempo de criação de cursos de 2 semanas para 2 dias. Incrível!",
        "name": "Maria Silva",
        "role": "Coordenadora Pedagógica",
        "company": "Empresa XYZ"
      },
      {
        "text": "A qualidade dos cursos gerados pela IA surpreende. Só preciso fazer ajustes mínimos.",
        "name": "João Santos",
        "role": "Designer Instrucional",
        "company": "Consultoria ABC"
      },
      {
        "text": "Ferramenta essencial para quem trabalha com EAD. Recomendo!",
        "name": "Ana Costa",
        "role": "Gestora de Treinamento",
        "company": "Corporação 123"
      }
    ]
  },
  "pricing": {
    "title": "Comece a Criar Hoje",
    "subtitle": "Acesso gratuito para começar a usar agora mesmo",
    "description": "Cadastre-se gratuitamente e comece a criar seus cursos SCORM profissionais em minutos",
    "cta": "Criar Conta Grátis"
  },
  "faq": {
    "title": "Perguntas Frequentes",
    "items": [
      {
        "question": "O que é SCORM?",
        "answer": "SCORM (Sharable Content Object Reference Model) é um padrão internacional para e-learning que garante compatibilidade dos cursos com diferentes plataformas LMS."
      },
      {
        "question": "Quais formatos de arquivo são suportados?",
        "answer": "Aceitamos documentos PDF e DOCX. Você também pode colar texto diretamente na plataforma."
      },
      {
        "question": "O curso gerado funciona em qual LMS?",
        "answer": "Os pacotes SCORM 1.2 gerados são compatíveis com praticamente todos os LMS do mercado, incluindo Moodle, Canvas, Blackboard, e outros."
      },
      {
        "question": "Preciso de conhecimento técnico?",
        "answer": "Não! A interface foi desenvolvida para ser intuitiva. Basta fazer upload do conteúdo e deixar a IA fazer o trabalho pesado."
      },
      {
        "question": "Como funciona a geração por IA?",
        "answer": "Usamos modelos avançados como Google Gemini para analisar seu conteúdo e estruturá-lo automaticamente em unidades, lições e atividades."
      },
      {
        "question": "Existe limite de cursos?",
        "answer": "Não há limite de cursos que você pode criar na plataforma."
      }
    ]
  },
  "cta": {
    "title": "Pronto para Transformar sua Criação de Cursos?",
    "subtitle": "Junte-se a centenas de profissionais que já economizam tempo e recursos com nossa plataforma",
    "button": "Começar Agora - É Grátis"
  },
  "footer": {
    "tagline": "Gerador de Cursos SCORM com IA",
    "about": "Sobre",
    "features": "Recursos",
    "pricing": "Preços",
    "contact": "Contato",
    "login": "Login",
    "signUp": "Cadastro",
    "copyright": "© 2026 Gerador de Cursos SCORM. Todos os direitos reservados."
  }
}
```

### Uso nos Componentes

```tsx
'use client'
import { useTranslations } from 'next-intl'

export function Hero() {
  const t = useTranslations('landing.hero')

  return (
    <h1>{t('title')}</h1>
    // ...
  )
}
```

---

## 5. Design Visual

### Princípios de Design

- **Marketing-first:** Visual chamativo, gradientes, animações sutis
- **Moderno:** Uso de glassmorphism, shadows suaves, bordas arredondadas
- **Conversion-focused:** CTAs destacados, hierarquia visual clara
- **Responsivo:** Mobile-first, otimizado para todos os dispositivos

### Paleta de Cores

Usar variáveis CSS do Tailwind já configuradas + adicionar gradientes:

**Gradientes sugeridos:**

- Hero background: `bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50` (light mode)
- Hero background: `bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900` (dark mode)
- CTAs: gradientes sutis em hover

### Tipografia

- **Títulos:** Inter/System UI (já configurado)
- **Hierarquia:** H1 (48-64px), H2 (36-48px), H3 (24-32px)
- **Corpo:** 16-18px (maior que aplicação interna para legibilidade)

### Espaçamento

- Seções: `py-16 md:py-24` (espaçamento generoso)
- Containers: `max-w-7xl mx-auto px-4`
- Cards/components: `space-y-8 md:space-y-12`

### Animações (Framer Motion)

**Animações de entrada:**

- Hero: fade-in + slide up
- Feature cards: stagger (aparecem um após o outro)
- Scroll-triggered: elementos animam ao entrar no viewport

**Performance:**

- Usar `will-change` com parcimônia
- Lazy load de seções abaixo da fold
- Otimizar imagens com Next.js Image

### Componentes Visuais

- **Cards:** Bordas arredondadas, shadow on hover, transition suave
- **Buttons:** Large size, gradientes/sólido, hover effects
- **Icons:** Lucide React (consistente com o projeto)
- **Ilustrações/Imagens:**
  - Hero mockup: Placeholder com gradiente (div colorido com aspect-video)
  - Use Cases: Placeholders SVG simples ou imagens gratuitas (Unsplash/Pexels)
  - Testimonials: Avatar placeholders circulares com iniciais ou gradientes
  - Seções intermediárias: Usar apenas ícones (Lucide), sem necessidade de imagens pesadas

---

## 6. Componentes e Estrutura

### Layout da Landing (`(landing)/layout.tsx`)

```tsx
// Server Component
import { getTranslations } from 'next-intl/server'
import LandingNavbar from './_components/LandingNavbar'
import LandingFooter from './_components/LandingFooter'

export default async function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingNavbar />
      <main className="flex-1">{children}</main>
      <LandingFooter />
    </div>
  )
}
```

### Página Principal (`(landing)/page.tsx`)

```tsx
// Server Component
import Hero from './_components/Hero'
import Features from './_components/Features'
import HowItWorks from './_components/HowItWorks'
import UseCases from './_components/UseCases'
import Testimonials from './_components/Testimonials'
import Pricing from './_components/Pricing'
import FAQ from './_components/FAQ'
import FinalCTA from './_components/CTA'

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <UseCases />
      <Testimonials />
      <Pricing />
      <FAQ />
      <FinalCTA />
    </>
  )
}
```

### Componentes Individuais

Cada seção será um Client Component (`'use client'`) para usar:

- `useTranslations` (next-intl)
- Framer Motion (animações)
- Event handlers (clicks, hovers)

**Exemplo - Hero.tsx:**

```tsx
'use client'

import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Hero() {
  const t = useTranslations('landing.hero')

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900">
      <div className="container mx-auto max-w-7xl px-4 py-24 md:py-32">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl font-bold leading-tight tracking-tight md:text-6xl">
              {t('title')}
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">{t('subtitle')}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <Link href="/cadastro">{t('ctaPrimary')}</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#how-it-works">{t('ctaSecondary')}</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Placeholder para mockup/screenshot */}
            <div className="rounded-xl bg-white/50 p-4 shadow-2xl backdrop-blur">
              <div className="aspect-video rounded-lg bg-gradient-to-br from-indigo-400 to-purple-400" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
```

---

## 7. Fluxo de Navegação

### Jornada do Usuário

1. **Visitante chega em `/`** → vê landing page completa
2. **Clica "Começar Grátis"** → redireciona para `/cadastro`
3. **Após cadastro** → redireciona para `/home` (dashboard)
4. **Clica "Login"** → redireciona para `/login`
5. **Após login** → redireciona para `/home`

### Navegação Interna da Landing

- Links da navbar levam para seções via scroll suave (`href="#features"`)
- CTAs sempre levam para `/cadastro` (conversão) ou `/login`
- Footer tem links rápidos para seções e páginas

### Smooth Scroll

Implementar scroll behavior suave:

```tsx
// LandingNavbar.tsx
<Link
  href="#features"
  onClick={(e) => {
    e.preventDefault()
    document.querySelector('#features')?.scrollIntoView({
      behavior: 'smooth',
    })
  }}
>
  {t('nav.features')}
</Link>
```

---

## 8. SEO e Metadata

### Metadata da Página

```tsx
// (landing)/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gerador de Cursos SCORM com IA | Crie Cursos em Minutos',
  description:
    'Transforme seus conteúdos em cursos SCORM profissionais automaticamente usando IA. Exportação compatível com qualquer LMS.',
  keywords: ['scorm', 'lms', 'cursos', 'elearning', 'ia', 'google gemini'],
  openGraph: {
    title: 'Gerador de Cursos SCORM com IA',
    description: 'Crie cursos SCORM profissionais em minutos com inteligência artificial',
    type: 'website',
    url: 'https://seudominio.com',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gerador de Cursos SCORM com IA',
    description: 'Crie cursos SCORM profissionais em minutos',
    images: ['/og-image.png'],
  },
}
```

### Structured Data (JSON-LD)

Adicionar schema.org para melhor SEO:

```tsx
// (landing)/page.tsx
export default function LandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Gerador de Cursos SCORM',
    applicationCategory: 'EducationalApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BRL',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Componentes da landing */}
    </>
  )
}
```

---

## 9. Performance

### Otimizações

- **Code Splitting:** Route groups garantem bundles separados
- **Lazy Loading:** Seções abaixo da fold carregam sob demanda
- **Images:** Next.js Image com otimização automática
- **Fonts:** System fonts ou subset de Google Fonts
- **Analytics:** Adicionar Google Analytics ou Vercel Analytics (opcional)

### Métricas Alvo

- First Contentful Paint (FCP): < 1.8s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- Lighthouse Score: > 90

---

## 10. Testes

### Checklist de Validação

- [ ] Landing carrega corretamente em `/`
- [ ] Todas as seções visíveis e responsivas
- [ ] CTAs redirecionam para `/cadastro` e `/login`
- [ ] Navegação interna (smooth scroll) funciona
- [ ] Toggle de idioma (PT-BR/EN) alterna conteúdo
- [ ] Animações funcionam sem lag
- [ ] Mobile responsivo em todos os breakpoints
- [ ] Dark mode funciona em todas as seções
- [ ] SEO metadata correto (title, description, OG tags)
- [ ] Performance: Lighthouse > 90

### Testes E2E (Playwright)

Criar teste básico:

```ts
// tests/landing.spec.ts
test('landing page loads and CTAs work', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('h1')).toBeVisible()
  await expect(page.locator('text=Começar Grátis')).toBeVisible()

  await page.click('text=Começar Grátis')
  await expect(page).toHaveURL('/cadastro')
})
```

---

## 11. Implementação - Ordem de Trabalho

### Fase 1: Estrutura Base

1. Criar Route Groups `(landing)` e `(app)`
2. Mover páginas existentes para `(app)/`
3. Criar layout da landing `(landing)/layout.tsx`
4. Criar namespace i18n `landing.json` (PT-BR + EN)

### Fase 2: Componentes Core

5. LandingNavbar (navbar fixa com navegação)
6. Hero section (título, CTAs, mockup)
7. LandingFooter (links e copyright)

### Fase 3: Seções de Conteúdo

8. Features (grid de recursos)
9. HowItWorks (timeline de passos)
10. UseCases (casos de uso)

### Fase 4: Social Proof & Conversão

11. Testimonials (carousel de depoimentos)
12. Pricing (planos/acesso)
13. FAQ (accordion de perguntas)
14. FinalCTA (seção final de conversão)

### Fase 5: Polish

15. Animações Framer Motion
16. Responsividade mobile
17. Dark mode ajustes
18. SEO metadata
19. Testes E2E

---

## 12. Riscos e Mitigações

### Risco: Bundle size aumentado

**Mitigação:**

- Route groups separam bundles automaticamente
- Lazy load de componentes pesados (`next/dynamic`)
- Tree-shaking de Framer Motion (importar apenas hooks necessários)

### Risco: Conteúdo desatualizado

**Mitigação:**

- Documentar localização dos textos no `landing.json`
- Criar guia de atualização de conteúdo no README
- Considerar futuramente migrar para CMS headless se necessário

### Risco: Animações causarem lag em mobile

**Mitigação:**

- `prefers-reduced-motion` media query para desabilitar animações
- Animações simples e leves (apenas opacity/transform)
- Testes em dispositivos reais

---

## 13. Próximos Passos (Pós-MVP)

- [ ] Adicionar analytics (Google Analytics / Vercel Analytics)
- [ ] A/B testing de CTAs e headlines
- [ ] Blog/recursos educacionais (nova rota `/blog`)
- [ ] Depoimentos reais de usuários
- [ ] Vídeo demo na Hero section
- [ ] Integração com Calendly/chatbot para contato
- [ ] Mais idiomas além de PT-BR/EN

---

## 14. Decisões Técnicas Finais

| Decisão            | Escolha                      | Razão                                   |
| ------------------ | ---------------------------- | --------------------------------------- |
| **Repositório**    | Mesmo repositório            | Aproveitar infraestrutura existente     |
| **Rota principal** | `/` (raiz)                   | SEO e UX otimizados                     |
| **Organização**    | Route Groups                 | Layouts e bundles separados             |
| **Conteúdo**       | Hardcoded nos componentes    | Sem necessidade de CMS (solicitado)     |
| **i18n**           | next-intl (PT-BR + EN)       | Sistema já configurado                  |
| **Design**         | Marketing-focused            | Visual chamativo, gradientes, animações |
| **Conversão**      | CTAs para /cadastro e /login | Sem formulários extras                  |
| **Animações**      | Framer Motion                | Já usado no projeto                     |

---

## Conclusão

Este design cria uma landing page completa e profissional que aproveita toda a stack existente do projeto, mantendo organização clara via Route Groups e garantindo performance através de code splitting automático do Next.js 15. A implementação será incremental, começando pela estrutura base e evoluindo até componentes polidos com animações e responsividade completa.
