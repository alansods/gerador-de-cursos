# 🔐 Configuração de Variáveis de Ambiente

Este documento explica como configurar as variáveis de ambiente necessárias para o projeto.

## 📋 Variáveis Necessárias

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```bash
# Database (Neon PostgreSQL)
# Configure sua conexão com o banco de dados Neon
# Obtenha em: https://console.neon.tech/
DATABASE_URL="postgresql://user:password@your-host.neon.tech/dbname?sslmode=require"
POSTGRES_URL="postgresql://user:password@your-host.neon.tech/dbname?sslmode=require"

# OpenAI API Key (para geração de cursos por IA)
# Obtenha em: https://platform.openai.com/api-keys
# Necessário apenas se você for usar a funcionalidade "Gerar por IA"
OPENAI_API_KEY="sk-..."
```

## 🗄️ Database Setup

### 1. Criar conta no Neon (PostgreSQL)

1. Acesse [https://console.neon.tech/](https://console.neon.tech/)
2. Crie uma conta gratuita
3. Crie um novo projeto
4. Copie a connection string fornecida

### 2. Configurar no projeto

```bash
# Adicione ao .env.local
DATABASE_URL="sua-connection-string-aqui"
POSTGRES_URL="sua-connection-string-aqui"
```

### 3. Rodar migrations

```bash
pnpm db:migrate
```

### 4. Popular o banco (opcional)

```bash
pnpm db:seed
```

## 🤖 OpenAI Setup (Opcional)

A chave da OpenAI é **necessária apenas** se você for usar a funcionalidade de geração de cursos por IA.

### 1. Obter API Key

1. Acesse [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Faça login ou crie uma conta
3. Clique em "Create new secret key"
4. Copie a chave (ela aparece apenas uma vez!)

### 2. Configurar no projeto

```bash
# Adicione ao .env.local
OPENAI_API_KEY="sk-proj-..."
```

### 3. Configurar billing (se necessário)

- O plano gratuito da OpenAI é limitado
- Para uso em produção, adicione um método de pagamento
- A API cobra por tokens usados (muito barato para testes)

## 📝 Notas Importantes

1. **Nunca commite o arquivo `.env.local`** - ele já está no `.gitignore`
2. **Para deploy na Vercel**: Configure as variáveis no dashboard da Vercel
3. **Sem OpenAI Key**: O sistema funciona normalmente, apenas a geração por IA ficará desabilitada
4. **Banco de dados é obrigatório**: Sem `DATABASE_URL`, o sistema não funcionará

## 🚀 Verificar configuração

Após configurar, teste:

```bash
# Desenvolvimento
pnpm dev

# Acessar http://localhost:3000
# Tente criar um curso manualmente
# Se tiver OpenAI, teste a geração por IA
```

## 🆘 Troubleshooting

### Erro: "Can't reach database server"
- Verifique se a `DATABASE_URL` está correta
- Certifique-se de que termina com `?sslmode=require`
- Teste a conexão no console do Neon

### Erro: "API Key não configurada"
- Adicione `OPENAI_API_KEY` no `.env.local`
- Reinicie o servidor (`pnpm dev`)

### Erro: "Table does not exist"
- Rode as migrations: `pnpm db:migrate`
- Se persistir: `pnpm db:push`

