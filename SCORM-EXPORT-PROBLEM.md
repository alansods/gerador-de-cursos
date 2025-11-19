# Problema de Exportação SCORM - Vercel vs Local

**Data**: 19/11/2024  
**Versão**: 2.0  
**Status**: 🔴 **PROBLEMA CRÍTICO** - Funciona localmente, mas falha na Vercel

---

## 📋 Sumário Executivo

O sistema de exportação SCORM funciona perfeitamente em ambiente local, mas retorna erro 500 (Internal Server Error) quando executado na Vercel. O problema está relacionado ao processo de build do Next.js que é executado em runtime dentro de uma função serverless.

---

## 🏗️ Arquitetura do Projeto

### Stack Tecnológico

```
Frontend:
  - Next.js 15.1.6 (App Router)
  - React 19
  - TypeScript
  - Tailwind CSS
  - shadcn/ui

Backend:
  - Next.js API Routes (Serverless Functions)
  - Prisma ORM
  - PostgreSQL (Supabase/Vercel Postgres)

Deploy:
  - Vercel (Serverless Functions)
  - Node.js 20.x
```

### Estrutura de Rotas Principais

```
/cursos                          # Lista de cursos (autenticado)
/cursos/novo                     # Criar novo curso
/cursos/[id]/editar              # Editar curso
/cursos/[id]/preview             # Preview do curso (Client Component)
/cursos/[id]/preview/unidade/[unidadeId]  # Preview unidade

/scorm-preview                   # Preview SCORM (Server Component)
/scorm-preview/unidade/[unidadeId]  # Unidade SCORM

/api/generate-scorm-v2          # API de exportação SCORM (PROBLEMA AQUI)
```

---

## 📦 Fluxo Completo de Exportação SCORM

### 1. Frontend - Início do Processo

**Arquivo**: `src/hooks/useSCORM.ts`

```typescript
// Usuário clica em "Exportar SCORM" no modal
const generateSCORM = async (curso: CursoGerado, filename: string) => {
  // Faz requisição POST para a API
  const response = await fetch('/api/generate-scorm-v2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ curso: curso }),
  });
  
  // Recebe o blob ZIP e faz download
  const blob = await response.blob();
  // ... download automático
};
```

### 2. API Route - Processamento

**Arquivo**: `src/app/api/generate-scorm-v2/route.ts`

```typescript
export async function POST(req: NextRequest) {
  // 1. Autenticação
  const authResult = await requireAuth(req);
  
  // 2. Recebe dados do curso
  const { curso } = await req.json();
  
  // 3. Cria diretório temporário
  const scormBuildDir = path.join(process.cwd(), '.scorm-build');
  await fs.mkdir(scormBuildDir, { recursive: true });
  
  // 4. Salva curso em JSON temporário
  const cursoFile = path.join(scormBuildDir, `curso-${cursoId}.json`);
  await fs.writeFile(cursoFile, JSON.stringify(cursoData, null, 2));
  
  // 5. Define caminho do ZIP de saída
  const outputZip = path.join(scormBuildDir, `scorm-${cursoId}.zip`);
  
  // 6. ⚠️ PROBLEMA: Executa script que faz build do Next.js
  const scriptPath = path.join(process.cwd(), 'generate-scorm-isolated.mjs');
  const buildResult = await executeBuildScript(scriptPath, cursoFile, outputZip);
  
  // 7. Lê ZIP e retorna
  const zipBuffer = await fs.readFile(outputZip);
  return new NextResponse(new Uint8Array(zipBuffer), { ... });
}
```

### 3. Script de Build Isolado

**Arquivo**: `generate-scorm-isolated.mjs`

Este script executa o seguinte processo:

```javascript
async function main() {
  // 1. Lê dados do curso do JSON
  const cursoData = JSON.parse(await fs.readFile(cursoJsonFile, 'utf-8'));
  
  // 2. Cria diretório de trabalho isolado
  const workDir = path.join(process.cwd(), '.scorm-build-work');
  await prepareIsolatedWorkDir(); // Copia arquivos necessários
  
  // 3. ⚠️ PROBLEMA CRÍTICO: Executa build completo do Next.js
  await executeIsolatedBuild(cursoFile, workDir);
  
  // 4. Copia output do build para ZIP
  await createSCORMZip(outputPath, curso, cursoId);
}

async function executeIsolatedBuild(cursoFile, workDir) {
  // Executa: pnpm next build --no-lint
  const buildProcess = spawn('pnpm', ['next', 'build', '--no-lint'], {
    cwd: workDir,
    env: {
      NODE_ENV: 'production',
      NEXT_OUTPUT_EXPORT: 'true',  // Força export estático
      SCORM_BUILD_CURSO_FILE: cursoFile,
    },
  });
  
  // Aguarda conclusão do build (pode levar vários minutos)
}
```

### 4. Processo de Build do Next.js

Durante o build, o Next.js:

1. **Compila TypeScript/React** → Gera JavaScript otimizado
2. **Processa páginas estáticas** → Gera HTML para `/scorm-preview`
3. **Bundle de assets** → CSS, JS, imagens em `_next/static/`
4. **Export estático** → Gera pasta `out/` com HTML estático

**Tempo estimado**: 2-5 minutos (dependendo do tamanho do projeto)

### 5. Montagem do ZIP SCORM

Após o build, o script:

1. Copia `out/scorm-preview.html` → `index.html` no ZIP
2. Copia `out/_next/static/` → `_next/static/` no ZIP
3. Gera `imsmanifest.xml` (manifesto SCORM 1.2)
4. Gera `scorm_api_wrapper.js` (wrapper da API SCORM)
5. Cria ZIP final com todos os arquivos

---

## 🔴 Problema Identificado

### Sintomas

- ✅ **Localmente**: Funciona perfeitamente, gera SCORM em 2-5 minutos
- ❌ **Na Vercel**: Retorna erro 500 (Internal Server Error)
- ❌ **Logs da Vercel**: Não mostram detalhes do erro (apenas 500)

### Causa Raiz

O problema está no **processo de build do Next.js executado em runtime** dentro de uma função serverless da Vercel:

#### Limitações da Vercel

1. **Timeout de Funções Serverless**:
   - **Hobby Plan**: 10 segundos
   - **Pro Plan**: 60 segundos (máximo)
   - **Enterprise**: 300 segundos (5 minutos)

2. **Tempo de Build do Next.js**:
   - **Local**: 2-5 minutos (120-300 segundos)
   - **Vercel**: Pode levar ainda mais tempo (sem cache, recursos limitados)

3. **Sistema de Arquivos**:
   - Funções serverless têm sistema de arquivos **read-only** em algumas áreas
   - Limitações de escrita em `/tmp` (apenas 512MB)
   - Não pode escrever na raiz do projeto durante runtime

4. **Recursos Limitados**:
   - CPU limitada (2 cores)
   - Memória limitada (1-3GB dependendo do plano)
   - Build do Next.js consome muitos recursos

#### Por que funciona localmente?

- ✅ Sem limite de timeout
- ✅ Sistema de arquivos completo (read/write)
- ✅ Recursos ilimitados (CPU/RAM)
- ✅ Cache do Next.js já existe (`.next/`)

---

## 🔍 Análise Técnica Detalhada

### Arquivos Envolvidos

```
src/app/api/generate-scorm-v2/route.ts    # API Route (Serverless Function)
generate-scorm-isolated.mjs                # Script de build isolado
src/app/scorm-preview/page.tsx             # Página que será buildada
src/components/scorm/SCORMPlayer.tsx       # Componente React do player
```

### Fluxo de Execução na Vercel

```
1. Usuário clica "Exportar SCORM"
   ↓
2. Frontend → POST /api/generate-scorm-v2
   ↓
3. API Route inicia (Serverless Function)
   ↓
4. Cria .scorm-build/curso-xxx.json
   ↓
5. Executa spawn('node', ['generate-scorm-isolated.mjs', ...])
   ↓
6. Script cria .scorm-build-work/ (diretório isolado)
   ↓
7. ⚠️ PROBLEMA: Executa pnpm next build (leva 2-5 minutos)
   ↓
8. ❌ TIMEOUT: Vercel mata a função após 60 segundos
   ↓
9. Retorna erro 500
```

### Logs Esperados vs Realidade

**Esperado (local)**:
```
🚀 [API generate-scorm-v2] Executando build SCORM...
[Build] Creating an optimized production build...
[Build] ✓ Compiled successfully
[Build] ✓ Generating static pages
✅ SCORM gerado com sucesso
```

**Realidade (Vercel)**:
```
🚀 [API generate-scorm-v2] Executando build SCORM...
[Build] Creating an optimized production build...
❌ [TIMEOUT após 60 segundos]
500 Internal Server Error
```

---

## 💡 Soluções Tentadas (e por que não funcionaram)

### 1. ❌ Template Pré-Buildado

**Abordagem**: Gerar template durante `next build` do projeto, depois apenas injetar dados do curso.

**Problema**: 
- Template não estava sendo gerado corretamente na Vercel
- Erro ao tentar acessar `public/scorm-template/` durante runtime
- Sistema de arquivos read-only na Vercel

### 2. ❌ Método Direto (scorm-service.ts)

**Abordagem**: Gerar HTML/JS/XML diretamente sem build do Next.js.

**Problema**:
- Layout diferente do preview (não usa SCORMPlayer React)
- Usuário quer manter o layout do preview (SPA com React)

### 3. ❌ Build com Timeout Aumentado

**Problema**: 
- Vercel não permite aumentar timeout além de 60s (Pro Plan)
- Build leva 2-5 minutos, sempre vai dar timeout

---

## 🎯 Requisitos

### Funcionalidades que DEVEM ser mantidas

1. ✅ **Layout do Preview**: SCORM deve ter o mesmo layout que `/scorm-preview` (SCORMPlayer React)
2. ✅ **Funcionamento Local**: Deve continuar funcionando localmente
3. ✅ **SPA**: Navegação Single Page Application dentro do SCORM
4. ✅ **SCORM 1.2**: Compatibilidade com LMS padrão

### Restrições da Vercel

1. ❌ **Timeout**: Máximo 60 segundos (Pro Plan)
2. ❌ **Sistema de Arquivos**: Read-only em algumas áreas
3. ❌ **Recursos**: CPU/RAM limitados
4. ❌ **Build em Runtime**: Não pode fazer build completo do Next.js

---

## 🔧 Possíveis Soluções

### Opção 1: Background Jobs / Queue System

**Como funciona**:
- API retorna imediatamente (job ID)
- Build executa em background (Vercel Background Functions ou serviço externo)
- Frontend faz polling ou usa WebSocket para verificar status
- Quando pronto, faz download

**Prós**:
- ✅ Resolve problema de timeout
- ✅ Mantém layout do preview
- ✅ Funciona na Vercel

**Contras**:
- ❌ Complexidade adicional
- ❌ Requer serviço externo (Redis, Queue, etc)
- ❌ Usuário precisa aguardar

**Implementação**:
- Usar Vercel Background Functions (até 15 minutos)
- Ou usar serviço externo (BullMQ, AWS SQS, etc)

### Opção 2: Build Durante Deploy

**Como funciona**:
- Gerar template SCORM durante `next build` do projeto
- Template fica em `public/scorm-template/`
- API apenas injeta dados do curso no template e monta ZIP

**Prós**:
- ✅ Rápido (segundos)
- ✅ Compatível com Vercel
- ✅ Mantém layout do preview

**Contras**:
- ❌ Template precisa ser gerado corretamente durante deploy
- ❌ Pode ter problemas com sistema de arquivos na Vercel
- ❌ Já foi tentado e não funcionou (mas pode ser ajustado)

**Implementação**:
- Script `build:scorm-template` no `package.json`
- Executar antes de `next build`
- API lê template de `public/scorm-template/`

### Opção 3: Serviço Externo de Build

**Como funciona**:
- API chama serviço externo (ex: GitHub Actions, AWS Lambda, etc)
- Serviço externo faz o build
- Retorna URL do ZIP ou faz upload para storage

**Prós**:
- ✅ Resolve problema de timeout
- ✅ Mantém layout do preview
- ✅ Escalável

**Contras**:
- ❌ Requer infraestrutura adicional
- ❌ Custo adicional
- ❌ Complexidade

### Opção 4: Otimizar Build (Reduzir Tempo)

**Como funciona**:
- Reduzir tamanho do projeto (remover dependências desnecessárias)
- Usar cache do Next.js
- Build incremental

**Prós**:
- ✅ Pode funcionar se reduzir para < 60 segundos

**Contras**:
- ❌ Difícil reduzir de 2-5 minutos para < 60 segundos
- ❌ Pode perder funcionalidades

---

## 📊 Comparação de Soluções

| Solução | Tempo de Implementação | Complexidade | Custo | Compatibilidade Vercel | Mantém Layout |
|---------|----------------------|--------------|-------|----------------------|---------------|
| Background Jobs | Média | Alta | Baixo | ✅ | ✅ |
| Build Durante Deploy | Baixa | Média | Grátis | ⚠️ (já tentado) | ✅ |
| Serviço Externo | Alta | Alta | Médio | ✅ | ✅ |
| Otimizar Build | Alta | Média | Grátis | ⚠️ (improvável) | ✅ |

---

## 🚀 Recomendação

**Solução Recomendada**: **Opção 1 - Background Jobs com Vercel Background Functions**

### Por quê?

1. ✅ Resolve o problema de timeout (até 15 minutos)
2. ✅ Mantém layout do preview
3. ✅ Funciona na Vercel sem infraestrutura adicional
4. ✅ Não requer mudanças no código de build

### Implementação Sugerida

```typescript
// 1. API retorna job ID imediatamente
export async function POST(req: NextRequest) {
  const jobId = generateJobId();
  
  // 2. Inicia build em background
  await startBackgroundBuild(jobId, cursoData);
  
  // 3. Retorna job ID
  return NextResponse.json({ jobId, status: 'processing' });
}

// 2. Background Function faz o build
export async function backgroundBuild(jobId, cursoData) {
  // Executa generate-scorm-isolated.mjs
  // Faz upload do ZIP para storage
  // Atualiza status do job
}

// 3. API de status
export async function GET(req: NextRequest) {
  const { jobId } = req.nextUrl.searchParams;
  const status = await getJobStatus(jobId);
  return NextResponse.json(status);
}
```

---

## 📝 Arquivos Relevantes

### Código Principal

- `src/app/api/generate-scorm-v2/route.ts` - API Route (problema aqui)
- `generate-scorm-isolated.mjs` - Script de build isolado
- `src/hooks/useSCORM.ts` - Hook frontend
- `src/components/ExportModal.tsx` - Modal de exportação

### Configuração

- `package.json` - Scripts de build
- `next.config.ts` - Configuração Next.js
- `.gitignore` - Arquivos ignorados

### Preview SCORM

- `src/app/scorm-preview/page.tsx` - Página preview
- `src/app/scorm-preview/layout.tsx` - Layout com SCORM wrapper
- `src/components/scorm/SCORMPlayer.tsx` - Componente principal

---

## 🔍 Como Reproduzir o Problema

### Localmente (Funciona)

```bash
# 1. Iniciar servidor
pnpm dev

# 2. Acessar http://localhost:3000
# 3. Criar/editar um curso
# 4. Clicar em "Exportar SCORM"
# 5. ✅ Download funciona (leva 2-5 minutos)
```

### Na Vercel (Falha)

```bash
# 1. Deploy automático após push
git push origin main

# 2. Acessar aplicação na Vercel
# 3. Criar/editar um curso
# 4. Clicar em "Exportar SCORM"
# 5. ❌ Erro 500 após ~60 segundos
```

---

## 📞 Próximos Passos

1. **Pesquisar soluções**:
   - Vercel Background Functions
   - Alternativas de build assíncrono
   - Otimizações de build do Next.js

2. **Testar Background Functions**:
   - Verificar se resolve timeout
   - Implementar polling no frontend

3. **Considerar alternativas**:
   - Serviço externo de build
   - Revisar abordagem de template pré-buildado

---

## 📚 Referências

- [Vercel Serverless Functions - Timeout Limits](https://vercel.com/docs/functions/runtimes#max-duration)
- [Vercel Background Functions](https://vercel.com/docs/functions/background-functions)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [SCORM 1.2 Specification](https://scorm.com/scorm-explained/technical-scorm/)

---

**Última atualização**: 19/11/2024  
**Status**: 🔴 Problema ativo - Requer solução

