# Implementação SCORM V2 - Build Isolado

## 📋 Sumário

1. [Visão Geral](#visão-geral)
2. [Arquitetura da Solução](#arquitetura-da-solução)
3. [Componentes Criados](#componentes-criados)
4. [Como Usar](#como-usar)
5. [Diferenças entre V1 e V2](#diferenças-entre-v1-e-v2)
6. [Troubleshooting](#troubleshooting)
7. [Limitações Conhecidas](#limitações-conhecidas)

---

## 🎯 Visão Geral

A **SCORM V2** é uma solução melhorada para exportação de cursos SCORM que executa o build em um **processo isolado**, minimizando conflitos com o servidor de desenvolvimento.

### Problema Resolvido

A versão anterior (V1) executava o build diretamente no processo da API route, sobrescrevendo o cache `.next/` do servidor de desenvolvimento e causando erros 404 após a exportação.

### Solução V2

A V2 executa o build em um **subprocesso Node.js separado** usando o script `generate-scorm-isolated.mjs`, que:

- ✅ Executa o build em processo isolado
- ✅ Minimiza conflitos com o servidor de desenvolvimento
- ✅ Fornece feedback de progresso em tempo real
- ✅ Limpa arquivos temporários automaticamente

---

## 🏗 Arquitetura da Solução

### Fluxo de Execução

```
┌──────────────┐
│  Frontend    │
│  (React)     │
└──────┬───────┘
       │ 1. Click "Exportar SCORM"
       ↓
┌──────────────────────────────────────┐
│  API Route                           │
│  /api/generate-scorm-v2              │
│  ┌────────────────────────────────┐ │
│  │ FASE 1: Download de Imagens    │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │ FASE 2: Salvar curso em JSON   │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │ FASE 3: Executar script isolado│ │
│  │   → generate-scorm-isolated.mjs │ │
│  │   → spawn('node', [...])       │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │ FASE 4: Ler ZIP gerado        │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │ FASE 5: Limpeza                │ │
│  └────────────────────────────────┘ │
└──────┬───────────────────────────────┘
       │ 2. Response com ZIP
       ↓
┌──────────────┐
│  Frontend    │
│  (Download)  │
└──────────────┘
```

### Script Isolado

O script `generate-scorm-isolated.mjs` executa:

1. **Lê o curso** do arquivo JSON temporário
2. **Salva o curso** no local esperado pelo build (`.scorm-build/curso-{id}.json`)
3. **Executa build** em subprocesso: `spawn('pnpm', ['next', 'build'])`
4. **Verifica build output** (diretório `out/`)
5. **Cria ZIP SCORM** com todos os arquivos necessários
6. **Limpa arquivos temporários**

---

## 📦 Componentes Criados

### 1. `generate-scorm-isolated.mjs`

**Localização:** Raiz do projeto

**Função:** Script Node.js (ES modules) que executa o build SCORM em processo isolado.

**Uso:**
```bash
node generate-scorm-isolated.mjs <curso-json-file> <output-zip-path>
```

**Características:**
- Executa build em subprocesso separado
- Gera manifesto SCORM
- Cria ZIP com todos os arquivos necessários
- Limpa arquivos temporários automaticamente

### 2. `/api/generate-scorm-v2/route.ts`

**Localização:** `src/app/api/generate-scorm-v2/route.ts`

**Função:** API route que orquestra o processo de exportação SCORM usando o script isolado.

**Endpoints:**
- `POST /api/generate-scorm-v2`

**Body:**
```json
{
  "curso": {
    "id": "curso-123",
    "titulo": "Meu Curso",
    "unidades": [...]
  }
}
```

**Response:**
- `200 OK`: Arquivo ZIP (application/zip)
- `400 Bad Request`: Curso inválido
- `500 Internal Server Error`: Erro no processo

### 3. `useSCORMExport` Hook

**Localização:** `src/hooks/useSCORMExport.ts`

**Função:** Hook React para gerenciar exportação SCORM com feedback de progresso.

**Uso:**
```typescript
import { useSCORMExport } from '@/hooks/useSCORMExport';

function MyComponent() {
  const { exportSCORM, isExporting, progress, error } = useSCORMExport();

  const handleExport = async () => {
    await exportSCORM(curso, 'nome-arquivo', true); // true = usar V2
  };

  return (
    <div>
      {progress.phase === 'build' && <p>Executando build...</p>}
      {error && <p>Erro: {error}</p>}
      <button onClick={handleExport} disabled={isExporting}>
        Exportar
      </button>
    </div>
  );
}
```

**Estados de Progresso:**
- `idle`: Pronto para exportar
- `images`: Processando imagens
- `build`: Executando build isolado
- `zip`: Criando arquivo ZIP
- `complete`: Download iniciado
- `error`: Erro ocorreu

### 4. `ExportSCORMButton` Component

**Localização:** `src/components/ExportSCORMButton.tsx`

**Função:** Componente React completo com interface visual para exportação SCORM.

**Uso:**
```typescript
import { ExportSCORMButton } from '@/components/ExportSCORMButton';

function MyPage() {
  return (
    <ExportSCORMButton
      curso={curso}
      useV2={true}  // true = usar API v2 (isolada)
    />
  );
}
```

**Características:**
- Dialog de confirmação
- Input para nome do arquivo
- Barra de progresso
- Feedback visual de sucesso/erro
- Aviso sobre reinicialização do servidor

---

## 🚀 Como Usar

### Opção 1: Usar o Componente `ExportSCORMButton`

```typescript
import { ExportSCORMButton } from '@/components/ExportSCORMButton';

<ExportSCORMButton
  curso={curso}
  useV2={true}  // Recomendado: usar V2
/>
```

### Opção 2: Usar o Hook `useSCORMExport`

```typescript
import { useSCORMExport } from '@/hooks/useSCORMExport';

const { exportSCORM, isExporting, progress } = useSCORMExport();

await exportSCORM(curso, 'nome-arquivo', true); // true = V2
```

### Opção 3: Chamar a API Diretamente

```typescript
const response = await fetch('/api/generate-scorm-v2', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ curso }),
});

const blob = await response.blob();
// Criar download...
```

---

## 🔄 Diferenças entre V1 e V2

| Característica | V1 (Original) | V2 (Isolada) |
|---------------|---------------|--------------|
| **Processo** | Build no mesmo processo da API | Build em subprocesso isolado |
| **Conflito com dev server** | ⚠️ Alto (corrompe .next/) | ✅ Baixo (minimizado) |
| **Feedback de progresso** | ❌ Não | ✅ Sim |
| **Limpeza automática** | ✅ Sim | ✅ Sim |
| **Tempo de execução** | ~30-60s | ~30-60s |
| **Reinicialização necessária** | ⚠️ Sempre | ⚠️ Às vezes |

### Quando Usar V1?

- ✅ Quando o servidor de desenvolvimento não está rodando
- ✅ Em ambiente de produção (Vercel)
- ✅ Quando você não se importa em reiniciar o servidor

### Quando Usar V2?

- ✅ Durante desenvolvimento ativo
- ✅ Quando você quer continuar trabalhando após exportar
- ✅ Quando você quer feedback de progresso
- ✅ **Recomendado para uso geral**

---

## 🔧 Troubleshooting

### Problema: Script não encontrado

**Erro:**
```
Error: Cannot find module 'generate-scorm-isolated.mjs'
```

**Solução:**
1. Verificar se o arquivo existe na raiz do projeto
2. Verificar permissões: `chmod +x generate-scorm-isolated.mjs`
3. Verificar se está no diretório correto

### Problema: Build falha no subprocesso

**Erro:**
```
Build falhou com código 1
```

**Solução:**
1. Verificar logs do subprocesso (stdio: 'inherit')
2. Verificar se todas as dependências estão instaladas
3. Verificar se o curso JSON está válido
4. Verificar se as pastas problemáticas foram ocultadas corretamente

### Problema: ZIP não é gerado

**Erro:**
```
Build não foi criado. Diretório out/ não encontrado.
```

**Solução:**
1. Verificar se o build foi executado com sucesso
2. Verificar se `next.config.ts` está configurado corretamente
3. Verificar variáveis de ambiente (`NEXT_OUTPUT_EXPORT='true'`)
4. Verificar logs do build

### Problema: Erros 404 após exportação

**Sintomas:**
- Página em branco
- Console cheio de erros 404
- Servidor não responde

**Solução:**
```bash
# Limpar cache e reiniciar
rm -rf .next out
pnpm dev
```

**Nota:** Isso ainda pode ser necessário mesmo com V2, mas é menos frequente.

### Problema: Memória insuficiente

**Erro:**
```
JavaScript heap out of memory
```

**Solução:**
```bash
# Aumentar limite de memória
export NODE_OPTIONS="--max-old-space-size=4096"
node generate-scorm-isolated.mjs ...
```

---

## ⚠️ Limitações Conhecidas

### 1. Reinicialização do Servidor

Mesmo com V2, o servidor de desenvolvimento **pode precisar ser reiniciado** após a exportação se o cache `.next/` for corrompido. Isso é uma limitação do Next.js, não da nossa solução.

**Workaround:**
- Use V2 para minimizar conflitos
- Reinicie o servidor quando necessário: `rm -rf .next out && pnpm dev`

### 2. Tempo de Execução

O build ainda leva 30-60 segundos, dependendo do tamanho do curso. Isso é normal e esperado.

### 3. Processo Isolado vs. Mesmo Processo

O V2 executa o build em subprocesso, mas ainda usa o mesmo diretório `.next/` e `out/`. Uma solução completamente isolada exigiria copiar todo o projeto, o que seria muito lento.

### 4. Compatibilidade

- ✅ Funciona em macOS, Linux, Windows
- ✅ Requer Node.js 18+
- ✅ Requer pnpm instalado
- ✅ Requer todas as dependências do projeto instaladas

---

## 📝 Notas de Implementação

### Por que não copiar o projeto inteiro?

Copiar todo o projeto (incluindo `node_modules/`) seria:
- ❌ Muito lento (minutos)
- ❌ Consome muito espaço em disco
- ❌ Complexo de manter

### Por que usar subprocesso?

Executar o build em subprocesso:
- ✅ Isola o processo do servidor principal
- ✅ Permite capturar logs separadamente
- ✅ Facilita tratamento de erros
- ✅ Não bloqueia outras requisições

### Por que não usar distDir diferente?

O Next.js não permite mudar `distDir` dinamicamente. Ele é definido em `next.config.ts` e aplicado a todo o projeto.

---

## 🔄 Migração de V1 para V2

### Passo 1: Atualizar Componentes

Substitua:
```typescript
import { useSCORM } from '@/hooks/useSCORM';
const { generateSCORM } = useSCORM();
```

Por:
```typescript
import { useSCORMExport } from '@/hooks/useSCORMExport';
const { exportSCORM } = useSCORMExport();
```

### Passo 2: Atualizar Chamadas

Substitua:
```typescript
await generateSCORM(curso, filename);
```

Por:
```typescript
await exportSCORM(curso, filename, true); // true = usar V2
```

### Passo 3: Usar Componente (Opcional)

Substitua botões customizados por:
```typescript
<ExportSCORMButton curso={curso} useV2={true} />
```

---

## 📚 Referências

- [SCORM-EXPORT-ERRORS.md](./SCORM-EXPORT-ERRORS.md) - Documentação de erros
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitetura do sistema
- [Next.js Static Exports](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)

---

**Última atualização:** 2025-01-12  
**Versão:** 2.0.0  
**Branch:** feat/scorm-build-real-preview

