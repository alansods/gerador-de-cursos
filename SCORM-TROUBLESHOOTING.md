# SCORM Export - Guia de Troubleshooting

Este documento registra problemas conhecidos e suas soluções relacionadas à exportação SCORM.

## Problema: Página em branco após exportar SCORM

### Sintomas
- Após exportar um curso SCORM, a página fica em branco ou quebrada
- Tela presa em "Verificando autenticação..."
- Erros 404 para arquivos CSS/JS (`/_next/static/css/app/layout.css`)
- Erros no console: `[webpack.cache.PackFileCacheStrategy] Caching failed for pack: Error: ENOENT`

### Causa Raiz
O processo de build SCORM faz backup e restore da pasta `.next/` para não corromper o servidor de desenvolvimento. Porém, o **cache do webpack** dentro de `.next/cache/webpack/` fica corrompido após o restore, causando inconsistências no servidor Next.js.

### Solução Implementada
O script `generate-scorm-isolated.mjs` agora limpa automaticamente o cache do webpack após restaurar `.next/`:

```javascript
// Limpar cache do webpack para evitar erros
const cacheDir = path.join(nextDir, 'cache', 'webpack');
if (await pathExists(cacheDir)) {
  console.log('   🧹 Limpando cache do webpack...');
  await fs.rm(cacheDir, { recursive: true, force: true });
  console.log('   ✅ Cache do webpack limpo');
}
```

### Como Resolver se o Problema Ocorrer

#### Opção 1: Recarregar a página (Hard Refresh)
```bash
# No navegador:
Ctrl + Shift + R  # Windows/Linux
Cmd + Shift + R   # Mac
```

#### Opção 2: Reiniciar o servidor de desenvolvimento
```bash
# Matar processos Next.js na porta 3000
lsof -ti:3000 | xargs kill -9

# Reiniciar servidor
pnpm dev
```

#### Opção 3: Limpar cache manualmente
```bash
# Remover cache do webpack
rm -rf .next/cache/webpack

# Remover toda pasta .next se necessário
rm -rf .next

# Reiniciar servidor
pnpm dev
```

### Código Relacionado
- **Script de build**: `generate-scorm-isolated.mjs` (função `restoreNextDir`)
- **AuthGuard**: `src/components/AuthGuard.tsx` (detecta timeout de 5s e mostra botão de reload)

### Commits Relacionados
- `6c4f52af` - fix: Limpar cache do webpack após restore para evitar erros
- `59b94c21` - fix: Resolver problema de tela branca após exportação SCORM

---

## Problema: Pastas duplicadas causam erro no build

### Sintomas
- Build SCORM falha com erro: `Error: Conflicting app and page file was found`
- Pastas duplicadas como `api 2`, `pdf-preview 2`, etc.

### Solução
O script `generate-scorm-isolated.mjs` oculta automaticamente todas as pastas de API antes do build:

```javascript
async function hideApiRoutes() {
  const appDir = path.join(process.cwd(), 'src', 'app');
  const entries = await fs.readdir(appDir, { withFileTypes: true });
  const apiDirs = entries
    .filter(entry => entry.isDirectory() && entry.name.startsWith('api'))
    .map(entry => entry.name);
  // ... oculta todas as pastas
}
```

### Commits Relacionados
- `3e3b9669` - fix: Corrigir exportação SCORM removendo pastas duplicadas

---

## Fluxo de Funcionamento do Build SCORM

1. **Backup**: `.next/` → `.next-backup-scorm/`
2. **Ocultar**: Pastas `/api*` e problemáticas são temporariamente renomeadas
3. **Build**: `next build` com `NEXT_OUTPUT_EXPORT=true`
4. **Restore**: `.next-backup-scorm/` → `.next/`
5. **Limpar cache**: Remove `.next/cache/webpack/`
6. **Restaurar pastas**: Pastas ocultas voltam aos nomes originais
7. **Aguardar**: 3 segundos para Next.js reprocessar
8. **Criar ZIP**: Arquivos de `out/` são empacotados

### Variáveis de Ambiente Durante Build
```javascript
{
  NODE_ENV: 'production',
  NEXT_OUTPUT_EXPORT: 'true',
  SCORM_BUILD_CURSO_FILE: '/path/to/curso.json'
}
```

---

## Logs Importantes

### Build bem-sucedido
```
✅ Backup de .next/ criado
✅ Pasta /api ocultada
✅ .next/ restaurado
🧹 Limpando cache do webpack...
✅ Cache do webpack limpo
⏳ Aguardando Next.js reprocessar arquivos (3s)...
✅ Servidor deve estar pronto novamente
```

### Erro de cache corrompido
```
<w> [webpack.cache.PackFileCacheStrategy] Caching failed for pack:
Error: ENOENT: no such file or directory, stat '.next/cache/webpack/...'
```

### 404s após export (problema)
```
GET /_next/static/css/app/layout.css?v=1763076788764 404 in 56ms
GET /_next/static/chunks/main-app.js?v=1763076788764 404 in 37ms
```

---

## Prevenção

1. ✅ Sempre use `generate-scorm-isolated.mjs` (inclui limpeza de cache)
2. ✅ Aguarde os 3 segundos de delay após export
3. ✅ Se aparecer o botão "Recarregar Página" no AuthGuard, clique nele
4. ⚠️ Evite fazer múltiplos exports SCORM seguidos sem aguardar
5. ⚠️ Não manipule `.next/` manualmente durante o export

---

## Problema: React Error #418 e 404s no LMS

### Sintomas
- React Error #418 no console do LMS
- Múltiplos 404s para arquivos CSS, JS, e fontes
- Tentativas de fetch de arquivos `.html.txt?_rsc=`
- Dark mode não funciona no SCORM exportado
- Nome do aluno do LMS não aparece na navbar

### Causa Raiz
As páginas SCORM eram **Server Components** (async functions) que tentavam usar `fs/promises` dinamicamente. Quando exportadas como estáticas, o Next.js tentava fazer RSC (React Server Components) fetches que não existem no pacote SCORM.

Além disso:
- `ThemeProvider` não estava incluído no layout SCORM
- Dados do curso não eram injetados no HTML estático

### Solução Implementada (FINAL - CORRIGIDA)

⚠️ **IMPORTANTE**: Next.js 15 **NÃO PERMITE** usar `'use client'` e `generateStaticParams()` juntos!

A solução correta é usar **Server Components** com geração **completamente estática**:

1. **Páginas SCORM são Server Components** (sem `'use client'`):
   - `scorm-preview/page.tsx` → Server Component
   - `scorm-preview/unidade/[unidadeId]/page.tsx` → Server Component

2. **Forçar geração estática completa**:
   ```tsx
   // Previne RSC fetches forçando geração estática
   export const dynamic = 'force-static';
   export const dynamicParams = false;
   ```

3. **Dados carregados durante BUILD** (não runtime):
   ```tsx
   import fs from 'fs/promises'; // Import estático, não dinâmico

   async function getCursoData(): Promise<CursoGerado | null> {
     if (process.env.SCORM_BUILD_CURSO_FILE) {
       const cursoFile = process.env.SCORM_BUILD_CURSO_FILE;
       const cursoData = await fs.readFile(cursoFile, 'utf-8');
       return JSON.parse(cursoData);
     }
     return null;
   }

   export default async function Page() {
     const curso = await getCursoData();
     // Renderiza HTML com dados embutidos
   }
   ```

4. **ThemeProvider no layout** (Client Component):
   ```tsx
   // scorm-preview/layout.tsx
   import { ThemeProvider } from "@/components/ThemeProvider";

   export default function SCORMPreviewLayout({ children }) {
     return <ThemeProvider>{children}</ThemeProvider>;
   }
   ```

5. **Componentes interativos são Client Components**:
   - `SCORMNavbar` → `'use client'` (usa hooks: useLMS)
   - `ThemeProvider` → `'use client'`
   - Server Component (página) renderiza Client Components filhos

### Por que isso funciona?
- `dynamic = 'force-static'` força Next.js a gerar HTML completamente estático
- Dados são lidos do arquivo JSON durante BUILD e embutidos no HTML
- Não há tentativas de RSC fetches porque tudo é estático
- Client Components filhos (ThemeProvider, SCORMNavbar) funcionam normalmente
- Dark mode funciona via ThemeProvider
- Nome do aluno funciona via SCORM API no useLMS hook

### Commits Relacionados
- `03096d2c` - Primeira tentativa (Client Components com window.__SCORM_CURSO_DATA__)
- `34edbf3a` - Segunda tentativa (adicionar generateStaticParams a Client Component - ERRO!)
- Commit atual - Solução final (Server Components com dynamic = 'force-static')

---

**Última atualização**: 14/01/2025
**Versão do Next.js**: 15.1.6
