# METADADOS DO CURSO
**Título:** Introdução ao Next.js 14
**Categoria:** Programação
**Carga Horária:** 20 horas
**Modalidade:** Online

## DESCRIÇÃO DO CURSO
Este curso introduz os fundamentos do Next.js 14, o framework React para produção. Os alunos aprenderão sobre Server Components, App Router, otimização de imagens, e deploy na Vercel. Ao final, serão capazes de criar aplicações web modernas, performáticas e otimizadas para SEO.

---

# UNIDADE 1: Fundamentos do Next.js

## Descrição da Unidade
Nesta unidade, você aprenderá os conceitos básicos do Next.js, incluindo instalação, estrutura de pastas e diferenças entre o App Router e Pages Router. Entenderá por que Next.js é uma escolha popular para aplicações React em produção.

## O que é Next.js?

Next.js é um framework React criado pela Vercel que permite criar aplicações web full-stack com funcionalidades como Server-Side Rendering (SSR), Static Site Generation (SSG), e muito mais. Ele resolve muitos problemas comuns do desenvolvimento React, oferecendo uma experiência otimizada tanto para desenvolvedores quanto para usuários finais.

O framework é usado por empresas como Netflix, TikTok, Nike e Twitch, demonstrando sua capacidade de escalar para milhões de usuários.

### Principais Características

**ACCORDION_INICIO**
**Título do Item 1:** Renderização Híbrida
**Conteúdo do Item 1:** Next.js permite combinar Server-Side Rendering (SSR), Static Site Generation (SSG) e Client-Side Rendering (CSR) conforme necessário em uma única aplicação. Isso oferece máxima flexibilidade para otimizar cada página individualmente.

**Título do Item 2:** Otimização Automática
**Conteúdo do Item 2:** Imagens, fontes e código são otimizados automaticamente sem configuração extra. O Next.js detecta recursos e aplica as melhores práticas de performance automaticamente.

**Título do Item 3:** Roteamento Baseado em Arquivos
**Conteúdo do Item 3:** Sem necessidade de configuração manual de rotas. Apenas crie arquivos na pasta `app/` e o Next.js cria as rotas automaticamente. Isso torna o desenvolvimento mais rápido e intuitivo.

**Título do Item 4:** API Routes
**Conteúdo do Item 4:** Crie APIs diretamente no seu projeto sem precisar de um servidor separado. Basta criar arquivos `route.ts` na pasta `app/api/` e ter endpoints REST funcionando.

**Título do Item 5:** TypeScript Nativo
**Conteúdo do Item 5:** Suporte completo para TypeScript sem configuração adicional. O Next.js é desenvolvido com TypeScript e oferece tipagem automática em todo o projeto.

**Título do Item 6:** CSS Modules e Tailwind
**Conteúdo do Item 6:** Suporte integrado para CSS Modules e Tailwind CSS. Escolha a abordagem que preferir ou combine ambas conforme necessário.
**ACCORDION_FIM**

### Instalação e Configuração

Para criar um novo projeto Next.js, execute os seguintes comandos no terminal:

```bash
npx create-next-app@latest meu-projeto
cd meu-projeto
npm run dev
```

O assistente de instalação fará algumas perguntas sobre suas preferências (TypeScript, ESLint, Tailwind CSS, etc). Para este curso, recomendamos aceitar todas as configurações padrão.

O projeto será inicializado na porta 3000 e você poderá acessá-lo em http://localhost:3000

---

# UNIDADE 2: App Router e Roteamento

## Descrição da Unidade
Aprenda sobre o novo App Router do Next.js 14, incluindo layouts, páginas aninhadas, loading states e error handling. Domine a criação de rotas dinâmicas e entenda como o sistema de roteamento funciona internamente.

## Estrutura de Pastas do App Router

O App Router utiliza a pasta `app/` como raiz de todas as rotas. Cada pasta representa um segmento de rota e pode conter arquivos especiais que definem o comportamento da aplicação.

Esta nova abordagem traz melhor organização, loading states automáticos e melhor suporte para layouts compartilhados.

### Arquivos Especiais

**FLIPCARD_INICIO**
**Tipo de Frente:** imagem-titulo
**Imagem da Frente (se aplicável):** [Imagem representando a estrutura de pastas do Next.js com ícones de arquivos especiais]
**Título da Frente:** Arquivos Especiais do Next.js
**Conteúdo do Verso:** O Next.js reconhece alguns arquivos especiais dentro da pasta `app/` que controlam o comportamento da aplicação:

**`page.tsx`**: Define a UI da rota e torna o segmento publicamente acessível. Cada pasta que contém um `page.tsx` se torna uma rota navegável.

**`layout.tsx`**: Define um layout compartilhado entre páginas. Útil para componentes comuns como headers, footers e navegação.

**`loading.tsx`**: UI de loading automática exibida durante carregamento. O Next.js mostra este componente automaticamente enquanto dados são carregados.

**`error.tsx`**: UI de erro automática para tratamento de erros. Captura erros em componentes filhos e permite criar páginas de erro customizadas.

**`not-found.tsx`**: UI exibida quando uma rota não é encontrada. Permite criar páginas 404 personalizadas.

**`template.tsx`**: Similar ao layout mas cria uma nova instância ao navegar. Útil quando você precisa remontar componentes a cada navegação.
**FLIPCARD_FIM**

### Criando Rotas

Para criar a rota `/sobre`, basta criar a seguinte estrutura:

```
app/
  sobre/
    page.tsx
```

O conteúdo de `page.tsx` pode ser:

```typescript
export default function SobrePage() {
  return (
    <div>
      <h1>Sobre Nós</h1>
      <p>Bem-vindo à página sobre!</p>
    </div>
  );
}
```

### Rotas Dinâmicas

Para criar rotas dinâmicas, use colchetes no nome da pasta:

```
app/
  blog/
    [slug]/
      page.tsx
```

Isso criará rotas como `/blog/meu-artigo`, `/blog/outro-artigo`, etc.

---

# UNIDADE 3: Server Components e Data Fetching

## Descrição da Unidade
Entenda os Server Components do React e como buscar dados de forma eficiente no Next.js. Aprenda as diferenças entre Server e Client Components e quando usar cada um.

## React Server Components

React Server Components (RSC) são uma nova funcionalidade que permite renderizar componentes no servidor, reduzindo o JavaScript enviado ao cliente e melhorando a performance.

Por padrão, todos os componentes no App Router são Server Components, a menos que você adicione a diretiva `'use client'`.

### Vantagens dos Server Components

Os principais benefícios incluem:

- **Menos JavaScript no cliente**: Componentes server não são enviados ao navegador
- **Acesso direto a recursos do servidor**: Consulte banco de dados diretamente
- **Melhor SEO**: Conteúdo renderizado no servidor é indexável
- **Loading mais rápido**: HTML é enviado imediatamente

### Client Components

Quando você precisa de interatividade (hooks, event listeners, state), use Client Components adicionando `'use client'` no topo do arquivo:

```typescript
'use client';

import { useState } from 'react';

export default function Contador() {
  const [count, setCount] = useState(0);
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Cliques: {count}
    </button>
  );
}
```

### Data Fetching

No Next.js 14, buscar dados é simples usando async/await diretamente nos Server Components:

```typescript
async function getPosts() {
  const res = await fetch('https://api.exemplo.com/posts');
  return res.json();
}

export default async function BlogPage() {
  const posts = await getPosts();
  
  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

### Teste seu Conhecimento

**QUIZ_INICIO**
**Pergunta 1:** Qual é a principal diferença entre Server Components e Client Components no Next.js 14?
**Dica:** Lembre-se que Server Components são o padrão no App Router e não precisam de diretiva especial.
**Opção A:** Server Components só funcionam no servidor e Client Components só no cliente
**Feedback Opção A:** Incorreto. Ambos os tipos podem ser usados, mas Server Components são renderizados no servidor e não enviam JavaScript ao cliente, enquanto Client Components precisam da diretiva 'use client' e são renderizados no navegador.
**Opção B:** Server Components são renderizados no servidor e não enviam JavaScript ao cliente, enquanto Client Components precisam da diretiva 'use client' e são renderizados no navegador
**Feedback Opção B:** Correto! Server Components são o padrão no App Router e permitem acesso direto a recursos do servidor sem enviar JavaScript adicional ao cliente. Client Components são usados quando você precisa de interatividade.
**Opção C:** Server Components são mais lentos que Client Components
**Feedback Opção C:** Incorreto. Server Components são geralmente mais rápidos porque reduzem a quantidade de JavaScript enviado ao cliente e podem acessar recursos do servidor diretamente.
**Opção D:** Client Components são obrigatórios para qualquer interatividade
**Feedback Opção D:** Parcialmente correto, mas não completo. Client Components são necessários para interatividade como hooks e event handlers, mas Server Components podem fazer muito trabalho no servidor antes de enviar HTML ao cliente.
**Opção E:** Não há diferença entre eles
**Feedback Opção E:** Incorreto. Existem diferenças significativas: Server Components são renderizados no servidor, acessam recursos do servidor diretamente e não enviam JavaScript ao cliente. Client Components são renderizados no navegador e permitem interatividade.
**Resposta Correta:** B

**Pergunta 2:** Quando você deve usar a diretiva 'use client' em um componente Next.js?
**Dica:** Pense sobre o que precisa rodar no navegador do usuário.
**Opção A:** Sempre que o componente usa JSX
**Feedback Opção A:** Incorreto. A maioria dos componentes Next.js usa JSX e não precisa de 'use client', pois são Server Components por padrão.
**Opção B:** Quando você precisa de hooks React como useState, useEffect ou event handlers
**Feedback Opção B:** Correto! A diretiva 'use client' é necessária quando você precisa de funcionalidades que só funcionam no navegador, como hooks React, event handlers (onClick, onChange), ou acesso a APIs do navegador.
**Opção C:** Quando você precisa buscar dados de uma API
**Feedback Opção C:** Incorreto. Buscar dados de uma API pode ser feito em Server Components usando async/await, sem necessidade de 'use client'.
**Opção D:** Quando você usa TypeScript
**Feedback Opção D:** Incorreto. TypeScript funciona tanto em Server Components quanto em Client Components sem necessidade de 'use client'.
**Opção E:** Nunca, pois todos os componentes são client components por padrão
**Feedback Opção E:** Incorreto. No Next.js 14 com App Router, todos os componentes são Server Components por padrão. Você só precisa de 'use client' quando precisa de funcionalidades que rodam no navegador.
**Resposta Correta:** B
**QUIZ_FIM**

---

# UNIDADE 4: Otimização e Performance

## Descrição da Unidade
Aprenda técnicas de otimização que o Next.js oferece, incluindo otimização de imagens, fontes, e code splitting. Entenda como melhorar métricas Core Web Vitals.

## Image Optimization

O componente `next/image` otimiza automaticamente imagens, melhorando performance e Core Web Vitals:

```typescript
import Image from 'next/image';

export default function Avatar() {
  return (
    <Image
      src="/perfil.jpg"
      alt="Foto de perfil"
      width={200}
      height={200}
      priority
    />
  );
}
```

Benefícios incluem lazy loading automático, redimensionamento responsivo e conversão para formatos modernos como WebP.

### Font Optimization

Next.js otimiza fontes automaticamente com `next/font`:

```typescript
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  return (
    <html lang="pt" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

### Code Splitting

Next.js automaticamente divide o código por rota, mas você pode usar dynamic imports para componentes pesados:

```typescript
import dynamic from 'next/dynamic';

const GraficoPesado = dynamic(() => import('./GraficoPesado'), {
  loading: () => <p>Carregando gráfico...</p>,
  ssr: false, // Desabilita SSR se necessário
});
```

---

# UNIDADE 5: Deploy e Produção

## Descrição da Unidade
Aprenda a fazer deploy da sua aplicação Next.js na Vercel e configure variáveis de ambiente, domínios customizados e analytics.

## Deploy na Vercel

A Vercel (criadora do Next.js) oferece a melhor experiência de deploy. Passos para deploy:

1. Crie uma conta em [vercel.com](https://vercel.com)
2. Conecte seu repositório GitHub
3. Configure variáveis de ambiente
4. Deploy automático a cada push!

### Variáveis de Ambiente

Crie um arquivo `.env.local` para desenvolvimento:

```
DATABASE_URL=sua-url-aqui
NEXT_PUBLIC_API_URL=https://api.exemplo.com
```

Variáveis prefixadas com `NEXT_PUBLIC_` são expostas ao navegador.

### Analytics e Monitoring

A Vercel oferece analytics integrado para monitorar performance, Core Web Vitals e erros em produção.

Configure no dashboard da Vercel sem necessidade de código adicional.

---

# RECURSOS COMPLEMENTARES

## Links Úteis
- Documentação oficial: https://nextjs.org/docs
- Tutorial interativo: https://nextjs.org/learn
- Exemplos práticos: https://github.com/vercel/next.js/tree/canary/examples

## Leituras Recomendadas
- React Documentation: https://react.dev
- Vercel Blog: https://vercel.com/blog
- Next.js Weekly Newsletter

## Ferramentas e Materiais
- VS Code com extensão ES7+ React/Redux/React-Native snippets
- Vercel CLI para deploy local
- React DevTools e Next.js DevTools

