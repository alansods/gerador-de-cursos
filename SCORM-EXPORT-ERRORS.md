# Documentação de Erros na Exportação SCORM

## 📋 Sumário

1. [Erro Principal: 404 Após Exportação](#erro-principal-404-após-exportação)
2. [Causa Raiz do Problema](#causa-raiz-do-problema)
3. [Análise Técnica Detalhada](#análise-técnica-detalhada)
4. [Soluções](#soluções)
5. [Prevenção](#prevenção)
6. [FAQ](#faq)

---

## ⚠️ Erro Principal: 404 Após Exportação

### Sintomas

Após clicar no botão "Exportar SCORM" e o pacote ser gerado com sucesso, ao tentar acessar qualquer página da aplicação web (http://localhost:3000), ocorrem os seguintes erros no console do navegador:

```
GET http://localhost:3000/cursos/[id]/editar 404 (Not Found)
GET http://localhost:3000/_next/static/css/app/layout.css 404 (Not Found)
GET http://localhost:3000/_next/static/chunks/main-app.js 404 (Not Found)
GET http://localhost:3000/_next/static/chunks/app-pages-internals.js 404 (Not Found)
GET http://localhost:3000/_next/static/chunks/app/layout.js 404 (Not Found)
```

### Evidência no Terminal

```bash
 GET /cursos/cmhl9fxw70000la04q23a5qle/editar 404 in 443ms
 GET /_next/static/css/app/layout.css?v=1762969777919 404 in 28ms
 GET /_next/static/chunks/main-app.js?v=1762969777919 404 in 41ms
 GET /_next/static/chunks/app-pages-internals.js 404 in 39ms
 GET /_next/static/chunks/app/layout.js 404 in 38ms
```

### Comportamento Visual

- A página aparece em branco ou com layout quebrado
- Console do navegador cheio de erros 404
- A aplicação fica inutilizável
- Pode aparecer mensagem "Verificando autenticação..." sem nunca carregar

---

## 🔍 Causa Raiz do Problema

### Conflito Entre Modos de Build

O projeto Next.js opera em **dois modos diferentes** que são incompatíveis:

1. **Modo Desenvolvimento** (`pnpm dev`)
   - Servidor local com hot-reload
   - Renderização server-side
   - Cache em `.next/`

2. **Modo Export Estático** (`next build` com `output: 'export'`)
   - Build estático para SCORM
   - Apenas HTML/CSS/JS puro
   - Arquivos salvos em `out/`

### O Que Acontece Durante a Exportação SCORM

```
┌─────────────────────────────────────────────────────────┐
│ 1. Usuário clica "Exportar SCORM"                       │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 2. API /generate-scorm executa "next build"            │
│    com output: 'export'                                 │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Next.js reescreve arquivos em .next/                │
│    (mode: production, static export)                    │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Servidor de desenvolvimento (.next/ com mode: dev)  │
│    TENTA usar cache corrompido                          │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 5. ERRO: Módulos não encontrados (404)                 │
└─────────────────────────────────────────────────────────┘
```

### Por Que Isso Acontece?

O Next.js armazena metadados no diretório `.next/` que são **específicos do modo de build**:

- **Development mode**: Inclui server components, API routes, hot-reload, etc.
- **Export mode**: Apenas static generation, sem server-side

Quando o build SCORM é executado, ele **sobrescreve** os arquivos de desenvolvimento em `.next/` com arquivos de exportação estática. Quando o servidor de desenvolvimento tenta usar esses arquivos, ele **não encontra** os módulos que espera, resultando em erros 404.

---

## 📊 Análise Técnica Detalhada

### Estrutura do Diretório .next/

#### Durante Desenvolvimento (`pnpm dev`)

```
.next/
├── cache/                    # Cache de builds incrementais
├── server/
│   ├── app/                 # Server Components compilados
│   ├── chunks/              # Webpack chunks (server-side)
│   ├── pages/               # API Routes e Pages
│   └── middleware-manifest.json
├── static/
│   ├── chunks/              # JavaScript bundles
│   ├── css/                 # Estilos compilados
│   └── webpack/             # Metadados do webpack
└── build-manifest.json      # Manifesto do build DEV
```

#### Durante Build SCORM (`next build --output export`)

```
.next/
├── cache/                    # Cache (diferente)
├── server/
│   └── app/                 # Apenas rotas estáticas
├── static/
│   ├── chunks/              # Bundles estáticos (diferentes)
│   └── css/                 # CSS estático
└── build-manifest.json      # Manifesto do build EXPORT (diferente!)
```

### O Problema do build-manifest.json

O arquivo `build-manifest.json` mapeia rotas para chunks JavaScript. Quando o build SCORM é executado, este arquivo é **completamente reescrito** com referências a chunks que só existem no modo export.

**Exemplo de referência quebrada:**

```json
// Antes (dev mode)
{
  "pages": {
    "/cursos/[id]/editar": ["chunks/app/cursos/[id]/editar.js"]
  }
}

// Depois (export mode)
{
  "pages": {
    "/scorm-preview": ["chunks/app/scorm-preview.js"]
  }
}
```

Quando o servidor de desenvolvimento tenta carregar `/cursos/[id]/editar`, ele procura pelo chunk no manifesto e **não encontra**, retornando 404.

---

## ✅ Soluções

### Solução 1: Reiniciar o Servidor de Desenvolvimento (RECOMENDADA)

**Esta é a solução mais rápida e confiável.**

#### Passos:

1. **Parar o servidor de desenvolvimento**
   - Pressione `Ctrl + C` no terminal onde `pnpm dev` está rodando
   - OU feche o terminal

2. **Limpar cache corrompido**
   ```bash
   rm -rf .next out
   ```

3. **Reiniciar o servidor**
   ```bash
   pnpm dev
   ```

#### Tempo estimado: 10-15 segundos

#### Por que funciona?

Remove completamente o cache corrompido, forçando o Next.js a reconstruir tudo em modo desenvolvimento desde o zero.

---

### Solução 2: Reiniciar Apenas o Servidor (Temporária)

Se você não quiser deletar o cache:

```bash
# Ctrl + C no terminal
pnpm dev
```

⚠️ **Atenção**: Esta solução pode não funcionar 100% das vezes, pois o cache corrompido permanece. Recomenda-se usar a Solução 1.

---

### Solução 3: Implementar Build SCORM Isolado (AVANÇADA)

**Esta solução requer modificações no código e ainda não está implementada.**

#### Ideia:

Executar o build SCORM em um diretório separado, sem tocar no cache de desenvolvimento.

```bash
# Criar diretório temporário para build SCORM
mkdir .scorm-build-temp

# Build com diretório customizado
NEXT_BUILD_DIR=.scorm-build-temp next build
```

#### Vantagens:

- Não corrompe o cache de desenvolvimento
- Servidor continua funcionando após export

#### Desvantagens:

- Requer mudanças significativas no código
- Next.js não suporta diretórios de build customizados nativamente
- Complexidade adicional

---

### Solução 4: Hot Fix no Código (NÃO RECOMENDADA)

Algumas pessoas tentam "contornar" o problema fazendo o servidor de desenvolvimento reiniciar automaticamente após o export.

```typescript
// ❌ NÃO FAZER ISSO
exec('pkill -f "next dev" && pnpm dev', (error) => {
  // Reinicia servidor após export
});
```

#### Por que NÃO fazer isso?

- Pode causar loops infinitos
- Mata processos de outros projetos
- Não é confiável
- Pode perder estado importante

---

## 🛡️ Prevenção

### Workflow Recomendado

1. **Durante desenvolvimento normal**: Use apenas `pnpm dev`
2. **Para testar SCORM**:
   - Exporte o SCORM
   - Reinicie o servidor (Solução 1)
   - Continue desenvolvendo

3. **Não tente usar a aplicação web e exportar SCORM simultaneamente**

### Avisos ao Usuário

Seria ideal adicionar um aviso na interface:

```tsx
// Botão "Exportar SCORM" com aviso
<button onClick={handleExportSCORM}>
  Exportar SCORM
</button>

{showWarning && (
  <Alert variant="warning">
    ⚠️ Após a exportação, você precisará reiniciar o servidor de desenvolvimento.
    Execute: rm -rf .next out && pnpm dev
  </Alert>
)}
```

### Script de Reinicialização Automática

Criar um script no `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "reset-dev": "rm -rf .next out && pnpm dev"
  }
}
```

Instruir usuários a usar `pnpm reset-dev` após exportar SCORM.

---

## 📚 FAQ

### 1. Por que não usar um servidor separado para SCORM?

**Resposta:** O SCORM precisa usar o mesmo código React para garantir que o curso exportado seja idêntico ao preview. Usar um servidor separado exigiria duplicar todo o código.

### 2. Posso exportar SCORM em produção (Vercel)?

**Resposta:** Sim! Em produção, cada requisição é isolada, então não há conflito de cache. O problema só ocorre no servidor de desenvolvimento local.

### 3. O ZIP SCORM gerado está correto mesmo com os erros 404?

**Resposta:** SIM! Os erros 404 afetam apenas a aplicação web local, **não o pacote SCORM exportado**. O ZIP está completo e funcional.

### 4. Posso automatizar a limpeza do cache?

**Resposta:** Sim, mas não é recomendado fazer isso dentro do endpoint de exportação, pois pode causar problemas. É melhor deixar o usuário decidir quando reiniciar.

### 5. Isso vai para produção (Vercel)?

**Resposta:** NÃO. O problema **não afeta** a aplicação em produção (Vercel), apenas o servidor de desenvolvimento local.

### 6. Por que não usar `distDir` diferente?

**Resposta:** O Next.js não permite mudar `distDir` dinamicamente. Ele é definido no `next.config.ts` e aplicado a todo o projeto.

### 7. Quanto tempo leva para limpar e reiniciar?

**Resposta:**
- Limpar cache: 1-2 segundos
- Reiniciar servidor: 5-10 segundos
- **Total: ~15 segundos**

### 8. Posso continuar trabalhando sem reiniciar?

**Resposta:** Tecnicamente não. O servidor ficará instável e retornará erros 404. Você **deve** reiniciar para continuar desenvolvendo.

### 9. Existe alguma forma de prevenir isso automaticamente?

**Resposta:** Atualmente não, sem modificações profundas no Next.js. A melhor estratégia é documentar o workflow e instruir os usuários.

### 10. Por que o Next.js não isola os builds?

**Resposta:** O Next.js foi projetado para ter **um único modo de build por projeto**. Alternar entre modos (dev e export) em runtime não é um caso de uso oficial suportado.

---

## 🔧 Solução de Problemas (Troubleshooting)

### Problema: Mesmo após reiniciar, ainda vejo erros 404

**Possíveis causas:**

1. **Cache do navegador**
   - Solução: Abra DevTools → Network → Disable cache
   - OU: Ctrl+Shift+R (hard refresh)

2. **node_modules/.cache não foi limpo**
   ```bash
   rm -rf node_modules/.cache
   pnpm dev
   ```

3. **Múltiplos servidores rodando**
   ```bash
   lsof -ti:3000 | xargs kill
   pnpm dev
   ```

---

### Problema: Build SCORM falha durante o processo

**Possíveis causas:**

1. **Pastas não foram restauradas**
   - Verificar se `/api`, `/cursos/[id]`, `/pdf-preview` existem em `src/app/`

2. **Arquivo temporário não foi removido**
   ```bash
   rm -rf .scorm-build/
   ```

3. **Permissões de arquivo**
   ```bash
   chmod -R 755 .scorm-build
   ```

---

### Problema: SCORM exportado não funciona no LMS

**Possíveis causas:**

1. **Manifesto inválido**
   - Verificar `imsmanifest.xml` no ZIP
   - Validar em https://www.scorm.com/scorm-tools/scorm-manifest-validator/

2. **Caminhos absolutos**
   - Verificar se HTML usa caminhos relativos (`../_next/static/`)
   - Não deve ter `/_next/static/` (barra inicial)

3. **Arquivos faltando**
   - Verificar se todos os chunks JavaScript foram copiados
   - Verificar se `scorm_api_wrapper.js` existe

---

## 📖 Referências

- [Next.js Static Exports](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Next.js Build Output](https://nextjs.org/docs/app/api-reference/next-config-js/output)
- [SCORM Specification](https://scorm.com/scorm-explained/)

---

## 🔄 Histórico de Versões

| Versão | Data       | Mudanças                           |
|--------|------------|-------------------------------------|
| 1.0.0  | 2025-11-12 | Criação da documentação inicial     |

---

## 📝 Notas Finais

Este documento explica um **comportamento esperado** do sistema, não um bug. O conflito entre modos de build do Next.js é uma limitação arquitetural que exige que o usuário reinicie o servidor após exportações SCORM.

**Resumo:**

✅ **Exportação SCORM funciona corretamente**
⚠️ **Servidor local precisa ser reiniciado após export**
🚀 **Solução rápida: `rm -rf .next out && pnpm dev`**
✅ **Problema não afeta produção**

---

**Última atualização:** 2025-11-12
**Versão:** 1.0.0
**Branch:** release/scorm-v1.0-stable
