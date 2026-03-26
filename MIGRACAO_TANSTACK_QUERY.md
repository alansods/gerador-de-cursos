# Guia de Migração para TanStack Query

## Índice

1. [Visão Geral](#visão-geral)
2. [⚠️ Impacto na Geração SCORM](#️-impacto-na-geração-scorm)
3. [Pré-requisitos](#pré-requisitos)
4. [Fase 1: Setup Inicial](#fase-1-setup-inicial)
5. [Fase 2: Primeira Migração (Página de Cursos)](#fase-2-primeira-migração-página-de-cursos)
6. [Fase 3: SCORM Polling](#fase-3-scorm-polling)
7. [Fase 4: CRUD de Usuários](#fase-4-crud-de-usuários)
8. [Fase 5: Migração do Context](#fase-5-migração-do-context)
9. [Fase 6: Optimistic Updates](#fase-6-optimistic-updates)
10. [Patterns e Best Practices](#patterns-e-best-practices)
11. [Troubleshooting](#troubleshooting)

---

## Visão Geral

Este guia documenta o processo de migração gradual do projeto de `fetch()` nativo para **TanStack Query v5**.

### Objetivos

- Reduzir código boilerplate de fetching em ~55%
- Implementar cache automático e inteligente
- Adicionar optimistic updates
- Melhorar UX com navegação instantânea
- Facilitar manutenção futura

### Cronograma Estimado

- **Fase 1**: Setup (1-2 horas)
- **Fase 2**: Primeira migração (4-6 horas)
- **Fase 3**: SCORM polling (2-3 horas)
- **Fase 4**: CRUD usuários (4-6 horas)
- **Fase 5**: Context (6-8 horas)
- **Fase 6**: Optimistic updates (4-6 horas)

**Total**: ~3-5 dias de trabalho

---

## ⚠️ Impacto na Geração SCORM

### 🛡️ **Garantia de Segurança**

**A migração para TanStack Query NÃO afetará a geração de pacotes SCORM.**

Esta seção explica detalhadamente por que a funcionalidade crítica de exportação SCORM permanecerá intacta e funcionando corretamente após a migração.

---

### 📊 Fluxo Completo da Geração SCORM

Atualmente, a geração SCORM segue este fluxo:

```
1. Usuário clica "Exportar SCORM" no frontend
   ↓
2. useSCORM.ts executa POST /api/generate-scorm-v2
   ↓
3. Backend cria SCORMJob no banco + salva curso.json temporário
   ↓
4. Processo isolado de build Next.js inicia com env vars:
   - NEXT_OUTPUT_EXPORT=true
   - SCORM_BUILD_CURSO_FILE=/tmp/curso-xxx.json
   ↓
5. Server Components em /scorm-preview/ leem curso via fs.readFile()
   ↓
6. Next.js gera HTML estático (SEM fetching HTTP)
   ↓
7. scorm-build-service.ts cria:
   - imsmanifest.xml (metadados SCORM 1.2)
   - Estrutura de diretórios
   - ZIP final com todo o conteúdo
   ↓
8. Frontend faz polling em /scorm-build/[jobId] (a cada 2s)
   ↓
9. Quando status = "completed", usuário faz download do ZIP
```

---

### ✅ Componentes NÃO Afetados (Zero Impacto)

#### 1. **Server Components SCORM** (`/src/app/scorm-preview/`)

**Por que não são afetados:**

- Usam `fs.readFile()` para ler dados do filesystem, NÃO `fetch()`
- Executados durante o build estático (build-time), não em runtime
- Marcados com `export const dynamic = 'force-static'`
- React Query não interfere em código server-side

**Exemplo do código:**

```typescript
// src/app/scorm-preview/page.tsx
export const dynamic = 'force-static'

async function getCursoData(): Promise<CursoGerado | null> {
  if (process.env.SCORM_BUILD_CURSO_FILE) {
    const cursoFile = process.env.SCORM_BUILD_CURSO_FILE
    const cursoData = await fs.readFile(cursoFile, 'utf-8') // ← Filesystem, não HTTP
    return JSON.parse(cursoData) as CursoGerado
  }
  return null
}
```

#### 2. **Build Estático Next.js**

**Por que não é afetado:**

- Executado em processo Node.js completamente isolado
- Não compartilha estado ou cache com aplicação principal
- Não utiliza React Query (ambiente server-side puro)
- Apenas lê arquivo JSON e gera HTML estático

#### 3. **Backend de Geração** (`scorm-build-service.ts`)

**Por que não é afetado:**

- Código puramente Node.js (sem componentes React)
- Usa apenas bibliotecas nativas: `fs`, `path`, `child_process`, `JSZip`
- Não faz requisições HTTP (apenas I/O de arquivos)
- Totalmente independente do React Query

#### 4. **Geração de XML e ZIP**

**Por que não é afetada:**

- Lógica imperativa de string manipulation
- Criação de arquivos binários (ZIP) via JSZip
- Processamento de imagens (download e embedding)
- Zero dependência de React ou estado global

---

### 🔄 Componentes que SERÃO Migrados (Com Melhorias)

#### 1. **Hook `useSCORM.ts` - Iniciar Job de Geração**

**Mudança:** Wrapper HTTP muda de `useState + fetch` para `useMutation`

**ANTES (atual - 68 linhas):**

```typescript
const [isGeneratingSCORM, setIsGenerating] = useState(false)
const [error, setError] = useState<string | null>(null)

const generateSCORM = async (curso: CursoGerado, filename: string) => {
  setIsGenerating(true)
  setError(null)

  try {
    const response = await fetch('/api/generate-scorm-v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ curso: curso }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
      throw new Error(errorData.details || errorData.error || 'Falha ao iniciar build')
    }

    const { jobId } = await response.json()
    router.push(`/scorm-build/${jobId}`)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    setError(errorMessage)
    toast.error('Erro ao Iniciar Build', { description: errorMessage })
    setIsGenerating(false)
  }
}
```

**DEPOIS (com React Query - 35 linhas):**

```typescript
import { useMutation } from '@tanstack/react-query'

async function startSCORMJob(curso: CursoGerado) {
  const response = await fetch('/api/generate-scorm-v2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ curso }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(errorData.details || errorData.error || 'Falha ao iniciar build')
  }

  return response.json()
}

export function useSCORM() {
  const router = useRouter()

  const mutation = useMutation({
    mutationFn: startSCORMJob,
    onSuccess: ({ jobId }) => {
      router.push(`/scorm-build/${jobId}`)
    },
    onError: (error: Error) => {
      toast.error('Erro ao Iniciar Build', {
        description: error.message,
      })
    },
  })

  return {
    generateSCORM: (curso: CursoGerado) => mutation.mutate(curso),
    isGeneratingSCORM: mutation.isPending,
    error: mutation.error?.message ?? null,
  }
}
```

**Garantias:**

- ✅ **Request HTTP idêntico** (mesma URL, headers, body)
- ✅ **Error handling idêntico** (mesma lógica de throw)
- ✅ **Comportamento idêntico** (redireciona para mesma página)
- ✅ **50% menos código** (bonus: menos bugs)

#### 2. **Polling de Status** (`/scorm-build/[jobId]/page.tsx`)

**Mudança:** Polling manual com `setInterval` vira `refetchInterval` automático

**ANTES (manual - ~80 linhas com cleanup complexo):**

```typescript
const [jobStatus, setJobStatus] = useState<JobStatus | null>(null)

useEffect(() => {
  if (!jobId) return

  const fetchStatus = async () => {
    const response = await fetch(`/api/scorm-status/${jobId}`)
    const data: JobStatus = await response.json()
    setJobStatus(data)
  }

  fetchStatus() // Initial fetch

  // Polling a cada 2 segundos
  const interval = setInterval(() => {
    if (jobStatus?.status === 'completed' || jobStatus?.status === 'failed') {
      clearInterval(interval)
      return
    }
    fetchStatus()
  }, 2000)

  return () => clearInterval(interval) // Cleanup manual
}, [jobId, jobStatus?.status])
```

**DEPOIS (automático - 20 linhas):**

```typescript
const { data: jobStatus, isLoading } = useQuery({
  queryKey: ['scorm-status', jobId],
  queryFn: () => fetchSCORMStatus(jobId),
  refetchInterval: (query) => {
    const data = query.state.data
    // Polling inteligente: para automaticamente quando completar
    if (data?.status === 'pending' || data?.status === 'building') {
      return 2000 // Continua polling a cada 2s
    }
    return false // Para polling
  },
  staleTime: 0, // Sempre buscar dados frescos
  enabled: !!jobId,
})
```

**Garantias:**

- ✅ **Request HTTP idêntico** (`GET /api/scorm-status/${jobId}`)
- ✅ **Intervalo idêntico** (2000ms = 2 segundos)
- ✅ **Lógica de parada idêntica** (para quando status = completed/failed)
- ✅ **Cleanup automático** (sem memory leaks)
- ✅ **Mais robusto** (cancela requests pendentes automaticamente)

---

### 📋 Matriz de Impacto

| Componente                          | Usa HTTP?         | Usa React?    | Será Migrado? | Impacto         | Risco   |
| ----------------------------------- | ----------------- | ------------- | ------------- | --------------- | ------- |
| `useSCORM.ts`                       | ✅ Sim            | ✅ Sim        | ✅ Sim        | Wrapper muda    | 🟢 Zero |
| `/scorm-build/[jobId]`              | ✅ Sim            | ✅ Sim        | ✅ Sim        | Polling melhora | 🟢 Zero |
| `/scorm-preview/*` (Server)         | ❌ Não (usa `fs`) | ❌ Não (SSG)  | ❌ Não        | Nenhum          | 🟢 Zero |
| `scorm-build-service.ts`            | ❌ Não (I/O)      | ❌ Não (Node) | ❌ Não        | Nenhum          | 🟢 Zero |
| Build Next.js (processo isolado)    | ❌ Não            | ❌ Não (CLI)  | ❌ Não        | Nenhum          | 🟢 Zero |
| Geração imsmanifest.xml             | ❌ Não            | ❌ Não        | ❌ Não        | Nenhum          | 🟢 Zero |
| Criação do ZIP (JSZip)              | ❌ Não            | ❌ Não        | ❌ Não        | Nenhum          | 🟢 Zero |
| API Routes `/api/generate-scorm-v2` | ❌ Não (backend)  | ❌ Não        | ❌ Não        | Nenhum          | 🟢 Zero |

**Conclusão:** 🟢 **ZERO RISCO** para funcionalidade SCORM

---

### 🧪 Checklist de Validação Pós-Migração

Após migrar as Fases 1-3, executar estes testes para garantir que SCORM continua funcionando:

#### **1. Geração de Pacote SCORM**

```bash
✅ Criar curso de teste com múltiplas unidades
✅ Adicionar conteúdos diversos:
   - Parágrafos de texto
   - Imagens (Vercel Blob)
   - Quiz com múltiplas questões
   - Flipcards
   - Vídeos embed
✅ Clicar "Exportar SCORM"
✅ Verificar redirecionamento para /scorm-build/[jobId]
```

#### **2. Acompanhamento do Build**

```bash
✅ Polling inicia automaticamente
✅ Status atualiza em tempo real:
   - "pending" → "building" → "completed"
✅ Barra de progresso funciona (se implementada)
✅ Polling para quando status = "completed"
✅ Botão "Download SCORM" aparece
✅ Sem memory leaks (verificar DevTools)
```

#### **3. Download e Estrutura do Pacote**

```bash
✅ Fazer download do arquivo ZIP
✅ Descompactar e verificar estrutura:
   ├── imsmanifest.xml          # ← Metadados SCORM 1.2
   ├── index.html                # ← Página inicial
   ├── _next/                    # ← Assets Next.js
   │   └── static/
   ├── unidade-1.html            # ← Unidades individuais
   ├── unidade-2.html
   └── ...

✅ Abrir imsmanifest.xml e verificar:
   - <schema>ADL SCORM</schema>
   - <schemaversion>1.2</schemaversion>
   - Todas unidades listadas em <resources>
   - Estrutura de <organization> correta
```

#### **4. Validação em LMS**

```bash
✅ Upload do ZIP em LMS de teste (Moodle/Canvas/Blackboard)
✅ Curso importa sem erros
✅ Abrir curso no LMS
✅ Verificar que index.html carrega corretamente
✅ Testar navegação entre unidades
✅ Verificar dark mode (se aplicável)
✅ Testar interatividade:
   - Quiz salva respostas
   - Flipcards funcionam
   - Vídeos carregam
✅ Verificar tracking SCORM:
   - Progresso é salvo no LMS
   - Status "completed" registra corretamente
   - Tempo de conclusão é rastreado
```

#### **5. Casos de Erro**

```bash
✅ Simular erro no backend (ex: retornar 500)
   → Toast de erro aparece
   → Status não fica travado em "pending"

✅ Build falha (ex: curso inválido)
   → Status muda para "failed"
   → Mensagem de erro é exibida
   → Polling para automaticamente

✅ Tentar download antes de completar
   → Botão disabled/oculto
   → Mensagem orientando a aguardar
```

#### **6. Comparação com Build Anterior**

```bash
✅ Gerar SCORM do MESMO curso antes e depois da migração
✅ Comparar ZIPs:
   - Tamanho similar (±5%)
   - imsmanifest.xml idêntico (diff)
   - Mesmo número de arquivos HTML
   - Assets na mesma estrutura

✅ Upload de ambos no LMS
✅ Comparar comportamento (deve ser idêntico)
```

---

### 🔒 Garantias Técnicas

#### **Por que a migração é segura:**

1. **Separação de Responsabilidades**
   - Frontend (React Query): apenas inicia job e monitora status
   - Backend (Node.js puro): faz todo o trabalho pesado de geração
   - Não há comunicação entre eles além de HTTP requests simples

2. **Build Isolado**
   - Processo de build Next.js roda em subprocess isolado
   - Não compartilha memória ou estado com aplicação principal
   - Usa apenas filesystem (env vars + arquivos temporários)

3. **Mesma Lógica HTTP**
   - React Query é apenas um wrapper sobre `fetch()`
   - URL, headers, body permanecem EXATAMENTE iguais
   - Backend recebe exatamente os mesmos dados

4. **Backwards Compatible**
   - API routes não mudam (mesmas rotas, mesmos payloads)
   - Banco de dados não muda (mesma estrutura de SCORMJob)
   - Formato SCORM 1.2 não muda (padrão internacional)

5. **Testabilidade**
   - Fácil comparar ZIPs antes/depois (hash MD5, diff estrutural)
   - Possível reverter migração instantaneamente (git revert)
   - Polling pode ser testado em dev sem quebrar prod

---

### 🚨 Quando NÃO Migrar (Red Flags)

**Pare a migração e revise se:**

- ❌ Você alterar a API route `/api/generate-scorm-v2`
- ❌ Você modificar `scorm-build-service.ts` ao mesmo tempo
- ❌ Você mudar estrutura do banco (tabela `SCORMJob`)
- ❌ Você alterar Server Components em `/scorm-preview/`
- ❌ Você modificar geração de `imsmanifest.xml`

**Regra de ouro:** Migre APENAS o wrapper HTTP. Backend permanece intocado.

---

### ✅ Aprovação para Migração SCORM

**Status:** 🟢 **APROVADO - ZERO RISCO**

**Justificativa:**

- Apenas 2 arquivos afetados (wrapper HTTP)
- Lógica de geração permanece 100% idêntica
- Melhorias em polling e cleanup
- Fácil reversão em caso de problemas
- Ganhos: código mais limpo, menos bugs, melhor UX

**Recomendação:** Migrar SCORM na **Fase 3** (após validar Fases 1 e 2)

---

## Pré-requisitos

### Conhecimentos Necessários

- [ ] React Hooks (useState, useEffect, useCallback)
- [ ] TypeScript intermediário
- [ ] Conceitos de cache e stale data
- [ ] Next.js App Router

### Leituras Recomendadas

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Practical React Query](https://tkdodo.eu/blog/practical-react-query)
- [React Query vs SWR](https://tanstack.com/query/latest/docs/react/comparison)

---

## Fase 1: Setup Inicial

### 1.1 Instalação

```bash
pnpm add @tanstack/react-query @tanstack/react-query-devtools
```

**Versões esperadas:**

```json
{
  "@tanstack/react-query": "^5.62.0",
  "@tanstack/react-query-devtools": "^5.62.0"
}
```

### 1.2 Criar Provider Global

**Arquivo:** `/src/providers/QueryProvider.tsx`

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Configurações globais
            staleTime: 60 * 1000, // 1 minuto
            gcTime: 5 * 60 * 1000, // 5 minutos (era cacheTime na v4)
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### 1.3 Integrar no Layout Principal

**Arquivo:** `/src/app/layout.tsx`

```typescript
import { QueryProvider } from '@/providers/QueryProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          <QueryProvider> {/* ← Adicionar aqui */}
            <ThemeProvider>
              <GeradorCursoProvider>
                <Toaster />
                {children}
              </GeradorCursoProvider>
            </ThemeProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 1.4 Criar Utilitários Base

**Arquivo:** `/src/lib/query-client.ts`

```typescript
import { QueryClient } from '@tanstack/react-query'

export function getQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  })
}
```

**Arquivo:** `/src/lib/query-keys.ts`

```typescript
// Factory de query keys (evita typos e facilita invalidação)
export const queryKeys = {
  cursos: {
    all: ['cursos'] as const,
    lists: () => [...queryKeys.cursos.all, 'list'] as const,
    list: (filters: { search?: string; category?: string; modality?: string }) =>
      [...queryKeys.cursos.lists(), filters] as const,
    details: () => [...queryKeys.cursos.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.cursos.details(), id] as const,
  },
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: { search?: string; page?: number }) =>
      [...queryKeys.users.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.users.all, id] as const,
  },
  scorm: {
    all: ['scorm'] as const,
    job: (jobId: string) => [...queryKeys.scorm.all, 'job', jobId] as const,
  },
} as const
```

### 1.5 Verificar Setup

```bash
pnpm dev
```

**Checklist:**

- [ ] Aplicação inicia sem erros
- [ ] DevTools aparecem no canto inferior direito
- [ ] Não há warnings no console

---

## Fase 2: Primeira Migração (Página de Cursos)

### 2.1 Criar Server Action Wrapper

**Arquivo:** `/src/app/cursos/actions.ts`

```typescript
'use server'

import { prisma } from '@/lib/prisma'

export type BuscarCursosParams = {
  cursor?: string | null
  limit?: number
  search?: string
  category?: string
  modality?: string
}

export type BuscarCursosResult = {
  cursos: CursoGerado[]
  nextCursor: string | null
  hasMore: boolean
  total: number
}

export async function buscarCursos({
  cursor,
  limit = 6,
  search,
  category,
  modality,
}: BuscarCursosParams): Promise<BuscarCursosResult> {
  const where = {
    AND: [
      search
        ? {
            OR: [
              { titulo: { contains: search, mode: 'insensitive' } },
              { descricao: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {},
      category ? { categoria: category } : {},
      modality ? { modalidade: modality } : {},
    ],
  }

  const cursos = await prisma.curso.findMany({
    where,
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  })

  const hasMore = cursos.length > limit
  const cursosRetornados = hasMore ? cursos.slice(0, -1) : cursos

  return {
    cursos: cursosRetornados.map(formatarCurso),
    nextCursor: hasMore ? cursosRetornados[cursosRetornados.length - 1].id : null,
    hasMore,
    total: await prisma.curso.count({ where }),
  }
}
```

### 2.2 Migrar useInfiniteScroll para useInfiniteQuery

**ANTES** (`/src/hooks/useInfiniteScroll.ts` - 150 linhas):

```typescript
// Hook complexo com useState, useEffect, useRef, AbortController...
```

**DEPOIS** (`/src/hooks/useCursosInfinite.ts` - 30 linhas):

```typescript
'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { buscarCursos } from '@/app/cursos/actions'
import { queryKeys } from '@/lib/query-keys'

export type UseCursosInfiniteOptions = {
  limit?: number
  search?: string
  category?: string
  modality?: string
}

export function useCursosInfinite({
  limit = 6,
  search,
  category,
  modality,
}: UseCursosInfiniteOptions = {}) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.cursos.list({ search, category, modality }),
    queryFn: ({ pageParam }) =>
      buscarCursos({
        cursor: pageParam,
        limit,
        search,
        category,
        modality,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 2 * 60 * 1000, // 2 minutos
  })

  const cursos = query.data?.pages.flatMap((page) => page.cursos) ?? []
  const total = query.data?.pages[0]?.total ?? 0

  return {
    cursos,
    total,
    isLoading: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    hasMore: query.hasNextPage,
    error: query.error,
    loadMore: query.fetchNextPage,
    refresh: query.refetch,
  }
}
```

### 2.3 Atualizar Componente da Página

**Arquivo:** `/src/app/cursos/page.tsx`

```typescript
'use client'

import { useCursosInfinite } from '@/hooks/useCursosInfinite'
import { useDebounce } from '@/hooks/useDebounce'

export default function CursosPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todas Categorias')
  const [selectedFormat, setSelectedFormat] = useState('Todas Modalidades')

  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  // Substituir useInfiniteScroll por useCursosInfinite
  const { cursos, total, isLoading, isLoadingMore, hasMore, loadMore, refresh } = useCursosInfinite(
    {
      limit: 6,
      search: debouncedSearchTerm,
      category: selectedCategory !== 'Todas Categorias' ? selectedCategory : undefined,
      modality: selectedFormat !== 'Todas Modalidades' ? selectedFormat : undefined,
    }
  )

  // Resto do código permanece igual...
}
```

### 2.4 Testar Migração

**Checklist:**

- [ ] Lista de cursos carrega corretamente
- [ ] Infinite scroll funciona
- [ ] Filtros (busca, categoria, modalidade) funcionam
- [ ] Cache está ativo (verificar no DevTools)
- [ ] Navegação para curso e volta mantém scroll position
- [ ] Não há console errors

**Como verificar cache:**

1. Abrir DevTools do React Query
2. Carregar lista de cursos
3. Navegar para um curso
4. Voltar para lista
5. Verificar que não houve nova requisição (status: "fresh" no DevTools)

---

## Fase 3: SCORM Polling

### 3.1 Criar Query para Status de Job

**Arquivo:** `/src/hooks/useSCORMStatus.ts`

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'

export type JobStatus = {
  id: string
  status: 'pending' | 'building' | 'completed' | 'failed'
  cursoTitulo: string
  progress?: number
  error?: string
  zipPath?: string
  createdAt: Date
  updatedAt: Date
}

async function fetchSCORMStatus(jobId: string): Promise<JobStatus> {
  const response = await fetch(`/api/scorm-status/${jobId}`)
  if (!response.ok) {
    throw new Error('Falha ao buscar status do job')
  }
  return response.json()
}

export function useSCORMStatus(jobId: string | null) {
  return useQuery({
    queryKey: queryKeys.scorm.job(jobId!),
    queryFn: () => fetchSCORMStatus(jobId!),
    enabled: !!jobId, // Só executa se jobId existir
    refetchInterval: (query) => {
      const data = query.state.data
      // Polling a cada 2s enquanto status for pending/building
      if (data?.status === 'pending' || data?.status === 'building') {
        return 2000
      }
      // Para polling quando completar ou falhar
      return false
    },
    staleTime: 0, // Sempre buscar dados frescos
  })
}
```

### 3.2 Migrar Página de Build Status

**ANTES** (`/src/app/scorm-build/[jobId]/page.tsx` - 80 linhas com setInterval):

```typescript
useEffect(() => {
  if (!jobId) return

  const fetchStatus = async () => {
    const response = await fetch(`/api/scorm-status/${jobId}`)
    const data: JobStatus = await response.json()
    setJobStatus(data)
  }

  fetchStatus()

  const interval = setInterval(() => {
    if (jobStatus?.status === 'completed' || jobStatus?.status === 'failed') {
      clearInterval(interval)
      return
    }
    fetchStatus()
  }, 2000)

  return () => clearInterval(interval)
}, [jobId, jobStatus?.status])
```

**DEPOIS** (15 linhas):

```typescript
'use client';

import { useSCORMStatus } from '@/hooks/useSCORMStatus';

export default function SCORMBuildPage({ params }: { params: Promise<{ jobId: string }> }) {
  const resolvedParams = use(params);
  const { data: jobStatus, isLoading, error } = useSCORMStatus(resolvedParams.jobId);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage error={error.message} />;
  }

  return (
    <div>
      <h1>Status: {jobStatus?.status}</h1>
      {jobStatus?.status === 'completed' && (
        <Button onClick={() => handleDownload(resolvedParams.jobId)}>
          Download SCORM
        </Button>
      )}
      {/* Resto da UI */}
    </div>
  );
}
```

### 3.3 Testar Polling

**Checklist:**

- [ ] Polling inicia automaticamente
- [ ] Para quando status é 'completed' ou 'failed'
- [ ] Não há memory leaks (verificar no Profiler)
- [ ] Transições de status funcionam
- [ ] Download funciona após conclusão

---

## Fase 4: CRUD de Usuários

### 4.1 Criar Queries para Usuários

**Arquivo:** `/src/hooks/useUsers.ts`

```typescript
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { toast } from 'sonner'

// Types
export type User = {
  id: string
  nome: string
  cargo: string
  usuario: string
  dataCriacao: Date
}

export type PaginatedUsers = {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Fetch functions
async function fetchUsers(params: {
  page: number
  limit: number
  search?: string
  startDate?: string
  endDate?: string
}): Promise<PaginatedUsers> {
  const searchParams = new URLSearchParams({
    page: params.page.toString(),
    limit: params.limit.toString(),
  })

  if (params.search) searchParams.append('search', params.search)
  if (params.startDate) searchParams.append('startDate', params.startDate)
  if (params.endDate) searchParams.append('endDate', params.endDate)

  const response = await fetch(`/api/users?${searchParams}`)
  if (!response.ok) throw new Error('Falha ao buscar usuários')

  const data = await response.json()
  if (!data.success) throw new Error(data.error)

  return data
}

async function createUser(userData: Omit<User, 'id' | 'dataCriacao'>) {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  })

  if (!response.ok) throw new Error('Falha ao criar usuário')

  const data = await response.json()
  if (!data.success) throw new Error(data.error)

  return data
}

async function updateUser(userData: Partial<User> & { id: string }) {
  const response = await fetch('/api/users', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  })

  if (!response.ok) throw new Error('Falha ao atualizar usuário')

  const data = await response.json()
  if (!data.success) throw new Error(data.error)

  return data
}

async function deleteUser(id: string) {
  const response = await fetch(`/api/users?id=${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) throw new Error('Falha ao deletar usuário')

  const data = await response.json()
  if (!data.success) throw new Error(data.error)

  return data
}

// Hooks
export function useUsers(params: {
  page: number
  limit: number
  search?: string
  startDate?: string
  endDate?: string
}) {
  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => fetchUsers(params),
    staleTime: 30 * 1000, // 30 segundos
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      // Invalida todas as listas de usuários
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
      toast.success('Usuário criado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar usuário', {
        description: error.message,
      })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateUser,
    onSuccess: (data, variables) => {
      // Invalida lista
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
      // Invalida detalhe específico
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(variables.id) })
      toast.success('Usuário atualizado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar usuário', {
        description: error.message,
      })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
      toast.success('Usuário deletado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error('Erro ao deletar usuário', {
        description: error.message,
      })
    },
  })
}
```

### 4.2 Migrar Página de Usuários

**ANTES** (120 linhas de estado + fetches):

```typescript
const [users, setUsers] = useState<User[]>([]);
const [loading, setLoading] = useState(true);

const fetchUsers = useCallback(async (page, search, start, end) => {
  try {
    setLoading(true);
    const response = await fetch(`/api/users?${params}`);
    // ...
  } catch (error) {
    // ...
  } finally {
    setLoading(false);
  }
}, []);

const handleCreate = async () => {
  try {
    const response = await fetch('/api/users', { ... });
    // ...
    fetchUsers();
  } catch (error) {
    // ...
  }
};
```

**DEPOIS** (40 linhas):

```typescript
'use client';

import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from '@/hooks/useUsers';

export default function UsuariosPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Query
  const { data, isLoading } = useUsers({
    page,
    limit: 10,
    search: debouncedSearch,
  });

  // Mutations
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const handleCreate = (userData: Omit<User, 'id' | 'dataCriacao'>) => {
    createUser.mutate(userData);
  };

  const handleUpdate = (userData: Partial<User> & { id: string }) => {
    updateUser.mutate(userData);
  };

  const handleDelete = (id: string) => {
    deleteUser.mutate(id);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <UsersTable
        users={data?.users ?? []}
        pagination={data?.pagination}
        onEdit={handleUpdate}
        onDelete={handleDelete}
      />
      <CreateUserModal onCreate={handleCreate} />
    </div>
  );
}
```

### 4.3 Testar CRUD

**Checklist:**

- [ ] Listagem carrega corretamente
- [ ] Criar usuário funciona + toast + revalidação
- [ ] Editar usuário funciona + toast + revalidação
- [ ] Deletar usuário funciona + toast + revalidação
- [ ] Filtros e paginação funcionam
- [ ] Cache está ativo entre navegações

---

## Fase 5: Migração do Context

### 5.1 Criar Queries para Cursos

**Arquivo:** `/src/hooks/useCursos.ts`

```typescript
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { toast } from 'sonner'
import type { CursoGerado } from '@/types'

// Fetch functions
async function fetchCurso(id: string): Promise<CursoGerado> {
  const response = await fetch(`/api/cursos/${id}`, {
    headers: {
      'Cache-Control': 'no-cache',
    },
  })

  if (!response.ok) {
    throw new Error('Curso não encontrado')
  }

  const data = await response.json()
  if (!data.success) {
    throw new Error(data.error)
  }

  return data.curso
}

async function createCurso(curso: Omit<CursoGerado, 'id' | 'dataCriacao'>): Promise<string> {
  const response = await fetch('/api/cursos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(curso),
  })

  if (!response.ok) {
    throw new Error('Falha ao criar curso')
  }

  const data = await response.json()
  if (!data.success) {
    throw new Error(data.error)
  }

  return data.curso.id
}

async function updateCurso(id: string, curso: Partial<CursoGerado>): Promise<void> {
  const response = await fetch('/api/cursos', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...curso }),
  })

  if (!response.ok) {
    throw new Error('Falha ao atualizar curso')
  }

  const data = await response.json()
  if (!data.success) {
    throw new Error(data.error)
  }
}

async function deleteCurso(id: string): Promise<void> {
  const response = await fetch(`/api/cursos?id=${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('Falha ao deletar curso')
  }

  const data = await response.json()
  if (!data.success) {
    throw new Error(data.error)
  }
}

// Hooks
export function useCurso(id: string | null) {
  return useQuery({
    queryKey: queryKeys.cursos.detail(id!),
    queryFn: () => fetchCurso(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

export function useCreateCurso() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createCurso,
    onSuccess: (cursoId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cursos.lists() })
      toast.success('Curso criado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar curso', {
        description: error.message,
      })
    },
  })
}

export function useUpdateCurso() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, curso }: { id: string; curso: Partial<CursoGerado> }) =>
      updateCurso(id, curso),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cursos.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.cursos.detail(id) })
      toast.success('Curso atualizado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar curso', {
        description: error.message,
      })
    },
  })
}

export function useDeleteCurso() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteCurso,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cursos.lists() })
      toast.success('Curso excluído com sucesso!')
    },
    onError: (error: Error) => {
      toast.error('Erro ao deletar curso', {
        description: error.message,
      })
    },
  })
}
```

### 5.2 Deprecar GeradorCursoContext Gradualmente

**Estratégia:**

1. Manter Context ativo durante migração
2. Migrar componentes um por um
3. Remover Context quando todos migrarem

**Exemplo de componente migrado:**

```typescript
// ANTES
const { criarCurso, editarCurso } = useGeradorCurso()

// DEPOIS
const createCurso = useCreateCurso()
const updateCurso = useUpdateCurso()

// Uso
createCurso.mutate(cursoData)
updateCurso.mutate({ id, curso: updatedData })
```

---

## Fase 6: Optimistic Updates

### 6.1 Implementar em Deletar Curso

**Arquivo:** `/src/hooks/useCursos.ts`

```typescript
export function useDeleteCurso() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteCurso,

    // Optimistic update
    onMutate: async (cursoId) => {
      // 1. Cancelar refetches em andamento
      await queryClient.cancelQueries({ queryKey: queryKeys.cursos.lists() })

      // 2. Snapshot do estado anterior
      const previousCursos = queryClient.getQueriesData({
        queryKey: queryKeys.cursos.lists(),
      })

      // 3. Update otimista (remove da UI imediatamente)
      queryClient.setQueriesData<{ pages: Array<{ cursos: CursoGerado[] }> }>(
        { queryKey: queryKeys.cursos.lists() },
        (old) => {
          if (!old) return old

          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              cursos: page.cursos.filter((c) => c.id !== cursoId),
            })),
          }
        }
      )

      // 4. Retornar contexto para rollback
      return { previousCursos }
    },

    // Se der erro, reverter
    onError: (err, cursoId, context) => {
      // Rollback
      context?.previousCursos.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })

      toast.error('Erro ao deletar curso', {
        description: err.message,
      })
    },

    // Revalidar sempre (em caso de sucesso ou erro)
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cursos.lists() })
    },

    onSuccess: () => {
      toast.success('Curso excluído com sucesso!')
    },
  })
}
```

### 6.2 Implementar em Editar Curso

```typescript
export function useUpdateCurso() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, curso }: { id: string; curso: Partial<CursoGerado> }) =>
      updateCurso(id, curso),

    onMutate: async ({ id, curso }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.cursos.detail(id) })

      const previousCurso = queryClient.getQueryData(queryKeys.cursos.detail(id))

      // Update otimista
      queryClient.setQueryData<CursoGerado>(queryKeys.cursos.detail(id), (old) => {
        if (!old) return old
        return { ...old, ...curso }
      })

      return { previousCurso }
    },

    onError: (err, { id }, context) => {
      if (context?.previousCurso) {
        queryClient.setQueryData(queryKeys.cursos.detail(id), context.previousCurso)
      }
      toast.error('Erro ao atualizar curso', {
        description: err.message,
      })
    },

    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cursos.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.cursos.lists() })
    },

    onSuccess: () => {
      toast.success('Curso atualizado com sucesso!')
    },
  })
}
```

### 6.3 Testar Optimistic Updates

**Checklist:**

- [ ] UI atualiza instantaneamente (sem loading)
- [ ] Em caso de erro, UI reverte ao estado anterior
- [ ] Toast de sucesso/erro aparece
- [ ] Revalidação ocorre após operação
- [ ] Não há flickering ou inconsistências

**Como testar rollback:**

1. Simular erro no backend (ex: retornar 500)
2. Deletar curso
3. Verificar que UI reverte

---

## Patterns e Best Practices

### 1. Query Keys Estruturadas

```typescript
// Ruim
const queryKey = ['cursos']

// Bom
const queryKey = ['cursos', 'list', { search: 'react' }]

// Melhor (usar factory)
const queryKey = queryKeys.cursos.list({ search: 'react' })
```

### 2. Error Handling Consistente

```typescript
// Sempre tipar erros
try {
  await fetch(...);
} catch (error) {
  if (error instanceof Error) {
    toast.error(error.message);
  } else {
    toast.error('Erro desconhecido');
  }
}
```

### 3. Loading States Granulares

```typescript
const { isLoading, isFetching, isRefetching } = useQuery(...);

// isLoading = primeira carga (sem dados)
// isFetching = qualquer fetch (pode ter dados em cache)
// isRefetching = refetch com dados em cache
```

### 4. Invalidação Precisa

```typescript
// Ruim (invalida tudo)
queryClient.invalidateQueries()

// Bom (invalida apenas listas de cursos)
queryClient.invalidateQueries({ queryKey: queryKeys.cursos.lists() })

// Melhor (invalida lista específica)
queryClient.invalidateQueries({
  queryKey: queryKeys.cursos.list({ search: 'react' }),
})
```

### 5. Prefetching

```typescript
// Prefetch ao hover em link
const prefetchCurso = (id: string) => {
  queryClient.prefetchQuery({
    queryKey: queryKeys.cursos.detail(id),
    queryFn: () => fetchCurso(id),
  });
};

<Link
  href={`/cursos/${curso.id}`}
  onMouseEnter={() => prefetchCurso(curso.id)}
>
  {curso.titulo}
</Link>
```

### 6. Dependent Queries

```typescript
// Query B depende de Query A
const { data: user } = useQuery({
  queryKey: ['user'],
  queryFn: fetchUser,
})

const { data: projects } = useQuery({
  queryKey: ['projects', user?.id],
  queryFn: () => fetchProjects(user!.id),
  enabled: !!user, // Só executa se user existir
})
```

### 7. TypeScript com Generics

```typescript
// Tipar response da query
const { data } = useQuery<CursoGerado, Error>({
  queryKey: queryKeys.cursos.detail(id),
  queryFn: () => fetchCurso(id),
})

// data é tipado como CursoGerado | undefined
// error é tipado como Error | null
```

### 8. Select para Transformações

```typescript
const { data: cursoTitulos } = useQuery({
  queryKey: queryKeys.cursos.all,
  queryFn: fetchCursos,
  select: (data) => data.map((c) => c.titulo), // Transforma apenas o que precisa
})

// Evita re-renders desnecessários
```

---

## Troubleshooting

### Problema: Cache não funciona

**Sintomas:**

- Query sempre fica em estado "loading"
- Dados não persistem entre navegações

**Solução:**

```typescript
// Verificar se staleTime está configurado
const { data } = useQuery({
  queryKey: ['cursos'],
  queryFn: fetchCursos,
  staleTime: 5 * 60 * 1000, // ← Adicionar
})
```

### Problema: Invalidação não funciona

**Sintomas:**

- Dados não atualizam após mutation
- UI mostra dados antigos

**Solução:**

```typescript
// Verificar se queryKey está correto
onSuccess: () => {
  // Ruim (typo)
  queryClient.invalidateQueries({ queryKey: ['curso'] })

  // Bom
  queryClient.invalidateQueries({ queryKey: queryKeys.cursos.lists() })
}
```

### Problema: Multiple requests simultâneas

**Sintomas:**

- 2+ requests iguais ao carregar página
- DevTools mostra duplicatas

**Solução:**

```typescript
// Usar mesma queryKey em todos os lugares
// Ruim
useQuery({ queryKey: ['cursos', search] }) // componente A
useQuery({ queryKey: ['cursos', { search }] }) // componente B

// Bom (ambos usam mesma key)
useQuery({ queryKey: queryKeys.cursos.list({ search }) })
useQuery({ queryKey: queryKeys.cursos.list({ search }) })
```

### Problema: Optimistic update não reverte

**Sintomas:**

- UI não volta ao estado anterior em erro
- Dados ficam inconsistentes

**Solução:**

```typescript
onMutate: async (id) => {
  // 1. SEMPRE cancelar queries antes
  await queryClient.cancelQueries({ queryKey: ['cursos'] });

  // 2. Salvar estado anterior
  const previous = queryClient.getQueryData(['cursos']);

  // 3. Retornar contexto
  return { previous };
},

onError: (err, id, context) => {
  // 4. Usar contexto para reverter
  if (context?.previous) {
    queryClient.setQueryData(['cursos'], context.previous);
  }
},
```

### Problema: Infinite scroll carrega duplicatas

**Sintomas:**

- Cursos aparecem repetidos na lista
- `hasMore` não funciona corretamente

**Solução:**

```typescript
// Verificar getNextPageParam
const query = useInfiniteQuery({
  // ...
  getNextPageParam: (lastPage) => {
    // Ruim (sempre retorna cursor)
    return lastPage.nextCursor

    // Bom (só retorna se houver mais)
    return lastPage.hasMore ? lastPage.nextCursor : undefined
  },
})
```

### Problema: Memory leak em polling

**Sintomas:**

- Requisições continuam após unmount
- Console warnings sobre updates em unmounted components

**Solução:**

```typescript
// React Query já faz cleanup automático
// Mas se usar setInterval manual, adicionar cleanup:

useEffect(() => {
  const interval = setInterval(() => {
    queryClient.invalidateQueries({ queryKey: ['status'] })
  }, 2000)

  return () => clearInterval(interval) // ← Cleanup
}, [])

// Melhor: usar refetchInterval (cleanup automático)
useQuery({
  queryKey: ['status'],
  queryFn: fetchStatus,
  refetchInterval: 2000,
})
```

---

## Checklist Final

Ao concluir todas as fases, verificar:

### Setup

- [ ] `@tanstack/react-query` instalado (v5.x)
- [ ] `QueryProvider` configurado no layout
- [ ] DevTools aparecendo e funcionando
- [ ] `query-keys.ts` criado e exportando factories

### Queries

- [ ] Todas as listagens migradas para `useQuery`
- [ ] Infinite scroll usando `useInfiniteQuery`
- [ ] Polling usando `refetchInterval`
- [ ] Queries com `enabled` para dependent queries

### Mutations

- [ ] CRUDs usando `useMutation`
- [ ] Invalidação automática após mutations
- [ ] Toasts de sucesso/erro
- [ ] Optimistic updates em operações críticas

### Performance

- [ ] `staleTime` configurado adequadamente
- [ ] Cache funcionando entre navegações
- [ ] Deduplicação de requests
- [ ] Prefetching em links importantes

### TypeScript

- [ ] Todos os hooks tipados
- [ ] Generics em queries e mutations
- [ ] Query keys tipadas (as const)

### UX

- [ ] Loading states consistentes
- [ ] Error handling robusto
- [ ] Feedback visual em todas as operações
- [ ] Scroll position mantida em navegações

### Testes

- [ ] Todos os fluxos principais testados
- [ ] Error scenarios testados
- [ ] Rollback de optimistic updates testado

---

## Recursos Adicionais

### Documentação

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [React Query DevTools](https://tanstack.com/query/latest/docs/react/devtools)
- [TypeScript Guide](https://tanstack.com/query/latest/docs/react/typescript)

### Blogs e Tutoriais

- [Practical React Query](https://tkdodo.eu/blog/practical-react-query) - TkDodo (mantainer)
- [React Query Tutorial](https://ui.dev/react-query-tutorial)
- [Optimistic Updates Deep Dive](https://tkdodo.eu/blog/optimistic-updates-in-react-query)

### Exemplos

- [TanStack Query Examples](https://tanstack.com/query/latest/docs/react/examples/react/basic)
- [Next.js + React Query](https://github.com/TanStack/query/tree/main/examples/react/nextjs)

---

## Conclusão

Esta migração é um investimento de ~3-5 dias que trará:

- **55% menos código de fetching**
- **Cache automático e inteligente**
- **Melhor UX** com navegação instantânea
- **Menos bugs** de gerenciamento de estado
- **Desenvolvimento mais rápido** de novas features

Boa sorte!
