# Configuração da Vercel para Geração SCORM

## 📋 Checklist de Configuração

### ✅ 1. Variáveis de Ambiente (OBRIGATÓRIAS)

Configure estas variáveis no painel da Vercel:

**Acesse**: Vercel Dashboard → Seu Projeto → Settings → Environment Variables

#### Variáveis Necessárias:

```bash
# 1. Banco de Dados (OBRIGATÓRIO)
DATABASE_URL=postgresql://usuario:senha@host:porta/database
# Exemplo: postgresql://user:pass@host.vercel-storage.com:5432/db

# 2. Autenticação JWT (OBRIGATÓRIO)
JWT_SECRET=sua-chave-secreta-super-segura-aqui
# Gere uma chave aleatória: openssl rand -base64 32

# 3. URL da Aplicação (OPCIONAL, mas recomendado)
NEXT_PUBLIC_APP_URL=https://seu-projeto.vercel.app
```

#### Como Configurar:

1. Acesse: https://vercel.com/seu-projeto/settings/environment-variables
2. Clique em "Add New"
3. Adicione cada variável acima
4. **IMPORTANTE**: Selecione os ambientes (Production, Preview, Development)
5. Clique em "Save"

---

### ✅ 2. Banco de Dados

**Você NÃO precisa criar um banco separado para SCORM!**

O SCORM usa os mesmos dados do banco principal:
- Os cursos são salvos no PostgreSQL via Prisma
- A geração SCORM apenas lê esses dados e cria o pacote ZIP

**Se você ainda não tem banco configurado:**

#### Opção A: Vercel Postgres (Recomendado)
1. Vercel Dashboard → Seu Projeto → Storage
2. Clique em "Create Database" → "Postgres"
3. Escolha um nome e região
4. Copie a `DATABASE_URL` gerada
5. Adicione como variável de ambiente (veja seção 1)

#### Opção B: Supabase (Alternativa)
1. Crie conta em https://supabase.com
2. Crie um novo projeto
3. Copie a `DATABASE_URL` da aba "Settings" → "Database"
4. Adicione como variável de ambiente na Vercel

---

### ✅ 3. Configuração de Timeout (IMPORTANTE)

O build do SCORM pode levar 2-5 minutos, mas a Vercel tem limites:

**Limites por Plano:**
- **Hobby**: 10 segundos (❌ **NÃO SUFICIENTE**)
- **Pro**: 60 segundos (⚠️ **Pode dar timeout**)
- **Enterprise**: 300 segundos (✅ **Suficiente**)

#### Como Aumentar Timeout (Plano Pro):

1. Acesse: Vercel Dashboard → Seu Projeto → Settings → Functions
2. Encontre a função `/api/generate-scorm-v2`
3. Configure:
   - **Max Duration**: 60s (máximo do Pro Plan)
   - **Memory**: 1024 MB ou mais (recomendado)

**⚠️ AVISO**: Mesmo com 60s, builds grandes podem dar timeout. Considere:
- Usar Background Functions (até 15 minutos)
- Ou otimizar o processo de build

---

### ✅ 4. Configuração de Memória (Recomendado)

O build do Next.js consome bastante memória:

1. Vercel Dashboard → Seu Projeto → Settings → Functions
2. Configure **Memory** para:
   - **Mínimo**: 1024 MB
   - **Recomendado**: 2048 MB (se disponível no seu plano)

---

### ✅ 5. Arquivos e Pastas (JÁ CONFIGURADO)

**✅ NÃO precisa criar pastas especiais!**

O `next.config.ts` já está configurado com `outputFileTracingIncludes` para incluir:
- ✅ `public/**/*` (templates, assets)
- ✅ `generate-scorm-isolated.mjs` (script de build)
- ✅ `src/**/*` (código fonte)
- ✅ Arquivos de configuração

**Não precisa fazer nada aqui!**

---

### ✅ 6. Verificação de Configuração

Após configurar tudo, verifique:

#### 6.1. Variáveis de Ambiente
```bash
# No painel da Vercel, verifique se todas estão configuradas:
✅ DATABASE_URL
✅ JWT_SECRET
✅ NEXT_PUBLIC_APP_URL (opcional)
```

#### 6.2. Deploy
1. Faça push para o repositório
2. Aguarde o deploy na Vercel
3. Verifique os logs do deploy para erros

#### 6.3. Teste de Geração SCORM
1. Acesse sua aplicação na Vercel
2. Faça login
3. Tente exportar um curso como SCORM
4. Verifique os logs em tempo real:
   - Vercel Dashboard → Deployments → Seu Deploy → Functions → `/api/generate-scorm-v2` → Logs

---

## 🔍 Troubleshooting

### Erro: "DATABASE_URL não encontrado"
**Solução**: Configure `DATABASE_URL` nas variáveis de ambiente da Vercel

### Erro: "JWT_SECRET não encontrado"
**Solução**: Configure `JWT_SECRET` nas variáveis de ambiente da Vercel

### Erro: "Timeout" (504)
**Causa**: Build demora mais que o limite de tempo
**Soluções**:
1. Aumentar timeout (máximo 60s no Pro Plan)
2. Usar Background Functions (até 15 minutos)
3. Otimizar o processo de build

### Erro: "Arquivo não encontrado"
**Causa**: Arquivos não foram incluídos no bundle
**Solução**: Já configurado em `next.config.ts` com `outputFileTracingIncludes`

### Erro: "spawn pnpm ENOENT"
**Causa**: pnpm não está disponível no runtime
**Solução**: Já corrigido - usa `process.execPath` com binário direto do Next.js

---

## 📊 Resumo Rápido

| Item | Status | Ação Necessária |
|------|--------|-----------------|
| Variáveis de Ambiente | ⚠️ | **CONFIGURAR** `DATABASE_URL` e `JWT_SECRET` |
| Banco de Dados | ⚠️ | **CRIAR** Vercel Postgres ou Supabase |
| Timeout | ⚠️ | **AUMENTAR** para 60s (Pro Plan) |
| Memória | ⚠️ | **AUMENTAR** para 1024-2048 MB |
| Arquivos/Pastas | ✅ | **JÁ CONFIGURADO** (outputFileTracingIncludes) |
| Script de Build | ✅ | **JÁ CORRIGIDO** (usa process.execPath) |

---

## 🚀 Próximos Passos

1. **Configure as variáveis de ambiente** (DATABASE_URL, JWT_SECRET)
2. **Crie/configure o banco de dados** (Vercel Postgres ou Supabase)
3. **Aumente timeout e memória** nas configurações da função
4. **Faça deploy** e teste a exportação SCORM
5. **Monitore os logs** para identificar problemas

---

## 📝 Notas Importantes

- **Não precisa criar pastas especiais** - tudo já está configurado
- **Não precisa de banco separado para SCORM** - usa o mesmo banco
- **O timeout pode ser um problema** - builds grandes podem falhar
- **Monitore os logs** - eles mostram exatamente o que está acontecendo

---

**Última atualização**: 19/11/2024

