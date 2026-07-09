# Gerador de Cursos SCORM

Sistema web para criação e exportação de cursos educacionais no padrão **SCORM 1.2**, com geração de conteúdo por **Inteligência Artificial** (Google Gemini / OpenAI).

Desenvolvido para uso institucional na **FIEC / SENAI / UNED**.

---

## Funcionalidades

- Criação de cursos com múltiplas unidades e conteúdo rico (markdown)
- **Geração automática de cursos via IA** a partir de documentos Word (.docx/.doc)
  - A IA usa **estritamente o conteúdo do documento enviado**, sem inventar ou adicionar informações extras
  - Suporta dois modos: **automático** (a IA escolhe os melhores recursos) e **com marcadores** (controle preciso via marcadores no documento)
  - Estrutura automaticamente o conteúdo em unidades com recursos interativos (accordion, quiz, flipcard, etc.)
- Preview interativo do curso antes da exportação
- Exportação de pacotes SCORM 1.2 compatíveis com qualquer LMS
- Dark mode integrado no player SCORM
- Autenticação com JWT (login/cadastro)
- Gestão de usuários e log de atividades
- Geração de PDF do curso
- Upload de imagens via Vercel Blob

---

## Stack

| Camada          | Tecnologia                                            |
| --------------- | ----------------------------------------------------- |
| Framework       | Next.js 15 (App Router)                               |
| UI              | React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui   |
| Banco de dados  | PostgreSQL via Prisma ORM                             |
| Autenticação    | JWT (jose + jsonwebtoken) + bcryptjs                  |
| IA              | Google Gemini (`@google/generative-ai`) + OpenAI      |
| SCORM           | Geração de imsmanifest.xml + wrapper JS + ZIP (JSZip) |
| PDF             | jsPDF + html2canvas + Puppeteer                       |
| Testes          | Jest + Testing Library + Playwright                   |
| Deploy          | Vercel                                                |
| Package manager | pnpm                                                  |

---

## Pré-requisitos

- Node.js 20+
- pnpm
- PostgreSQL (Supabase ou Vercel Postgres)

---

## Configuração

### 1. Instalar dependências

```bash
pnpm install
```

### 2. Variáveis de ambiente

Crie `.env.local` na raiz:

```bash
DATABASE_URL=postgresql://usuario:senha@host:porta/database
JWT_SECRET=sua-chave-secreta-aqui
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Para geração de cursos via IA
GOOGLE_AI_API_KEY=sua-chave-gemini
OPENAI_API_KEY=sua-chave-openai   # opcional

# Para upload de imagens
BLOB_READ_WRITE_TOKEN=seu-token-vercel-blob
```

### 3. Banco de dados

```bash
# Criar tabelas
pnpm db:migrate

# (Opcional) Popular com dados iniciais
pnpm db:seed
```

### 4. Rodar em desenvolvimento

```bash
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## Scripts

```bash
pnpm dev              # servidor de desenvolvimento
pnpm build            # build de produção (inclui prisma generate)
pnpm start            # servidor de produção
pnpm lint             # ESLint
pnpm test             # testes unitários (Jest)
pnpm test:coverage    # cobertura de testes
pnpm test:e2e         # testes E2E (Playwright)
pnpm db:migrate       # migrations do banco
pnpm db:studio        # Prisma Studio (UI do banco)
pnpm db:seed          # seed do banco
```

---

## Exportação SCORM

O processo de exportação gera um arquivo `.zip` compatível com SCORM 1.2 contendo:

- `imsmanifest.xml` — manifesto com estrutura do curso
- `scorm-preview/index.html` — página inicial do curso
- `scorm-preview/unidade/<id>.html` — uma página por unidade
- `_next/static/` — assets (CSS, JS, fonts)
- `scorm_api_wrapper.js` — wrapper da API SCORM (1.2 e 2004)
- `images/` — imagens do curso

O pacote ZIP pode ser importado em qualquer LMS compatível com SCORM 1.2 (Moodle, TalentLMS, etc.).

### Geração manual (desenvolvimento)

```bash
node generate-scorm-isolated.mjs "/caminho/para/curso.json" "/caminho/saida.zip"
```

---

## Estrutura do Projeto

```
src/
├── app/
│   ├── api/                    # API Routes (serverless)
│   │   ├── auth/               # Login/logout
│   │   ├── cursos/             # CRUD de cursos
│   │   ├── generate-course-from-text/  # Geração por IA
│   │   ├── generate-scorm-v2/  # Exportação SCORM
│   │   ├── scorm-jobs/         # Fila de jobs SCORM
│   │   ├── scorm-status/       # Status de jobs
│   │   ├── scorm-download/     # Download do ZIP
│   │   ├── users/              # Gestão de usuários
│   │   ├── activities/         # Log de atividades
│   │   ├── extract-document/   # PDF/DOCX → texto
│   │   └── upload-image/       # Upload de imagens
│   ├── scorm-preview/          # Player SCORM (Server Components estáticos)
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── unidade/[unidadeId]/page.tsx
│   ├── cursos/                 # Gestão de cursos
│   ├── home/                   # Dashboard
│   ├── login/                  # Autenticação
│   ├── cadastro/               # Registro
│   └── usuarios/               # Gestão de usuários
├── components/                 # Componentes React
│   ├── SCORMNavbar.tsx         # Navbar do player SCORM
│   ├── ThemeProvider.tsx       # Dark mode
│   ├── ExportModal.tsx         # Modal de exportação
│   ├── PreviewCurso.tsx        # Preview interativo
│   ├── scorm/                  # Componentes SCORM
│   └── ui/                     # shadcn/ui
├── hooks/                      # Custom hooks
│   ├── useSCORM.ts             # Exportação SCORM
│   ├── useLMS.ts               # Integração SCORM API
│   ├── useTheme.ts             # Dark mode
│   └── useCurso.ts             # Dados do curso
├── lib/                        # Utilitários e serviços
│   ├── scorm-build-service.ts  # Geração SCORM em memória
│   ├── scorm-service.ts        # Lógica SCORM
│   ├── auth.ts                 # Autenticação
│   ├── prisma.ts               # Cliente Prisma
│   └── pdf-service.ts          # Geração PDF
├── types/                      # Types TypeScript
└── context/                    # React Context

prisma/
└── schema.prisma               # Modelos: User, Curso, Activity, SCORMJob

generate-scorm-isolated.mjs     # Script de build SCORM isolado
```

---

## Banco de Dados

| Modelo     | Descrição                                       |
| ---------- | ----------------------------------------------- |
| `User`     | Usuários do sistema (nome, cargo, login, senha) |
| `Curso`    | Cursos com unidades (estrutura JSON)            |
| `Activity` | Log de ações dos usuários                       |
| `SCORMJob` | Fila e status de exportações SCORM assíncronas  |

---

## Deploy (Vercel)

1. Conecte o repositório no [Vercel](https://vercel.com)
2. Configure as variáveis de ambiente no painel da Vercel
3. Crie um banco PostgreSQL (Vercel Postgres ou Supabase)
4. Deploy automático a cada push na branch `main`

> **Atenção**: A exportação SCORM via build completo do Next.js não funciona na Vercel por timeout (máximo 60s no plano Pro, build leva 2-5 minutos). A abordagem atual usa geração em memória via `scorm-build-service.ts`.

---

## Licença

Uso interno — FIEC / SENAI / UNED.
