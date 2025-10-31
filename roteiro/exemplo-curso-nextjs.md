# METADADOS DO CURSO
**Título:** Introdução ao Next.js 14
**Categoria:** Programação
**Carga Horária:** 20 horas
**Modalidade:** Online
**Instrutor:** João Silva

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

Next.js oferece diversas funcionalidades prontas para uso que aceleram o desenvolvimento:

- **Renderização híbrida**: Combine SSR, SSG e CSR conforme necessário em uma única aplicação
- **Otimização automática**: Imagens, fontes e código são otimizados automaticamente sem configuração extra
- **Roteamento baseado em arquivos**: Sem necessidade de configuração manual de rotas, apenas crie arquivos
- **API Routes**: Crie APIs diretamente no seu projeto sem precisar de um servidor separado
- **TypeScript nativo**: Suporte completo para TypeScript sem configuração adicional
- **CSS Modules e Tailwind**: Suporte integrado para as principais soluções de estilização

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

O Next.js reconhece alguns arquivos especiais dentro da pasta `app/`:

- **`page.tsx`**: Define a UI da rota e torna o segmento publicamente acessível
- **`layout.tsx`**: Define um layout compartilhado entre páginas
- **`loading.tsx`**: UI de loading automática exibida durante carregamento
- **`error.tsx`**: UI de erro automática para tratamento de erros
- **`not-found.tsx`**: UI exibida quando uma rota não é encontrada
- **`template.tsx`**: Similar ao layout mas cria uma nova instância ao navegar

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

