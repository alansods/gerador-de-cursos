# 🚀 Configuração Prisma + Neon PostgreSQL

Este projeto está configurado para usar **Prisma ORM** com **Neon PostgreSQL** como banco de dados.

## 📋 Índice

- [Instalação](#instalação)
- [Configuração do Neon](#configuração-do-neon)
- [Migrações](#migrações)
- [API Routes](#api-routes)
- [Modelos](#modelos)
- [Testes](#testes)
- [Troubleshooting](#troubleshooting)

---

## ✅ Instalação

As dependências já estão instaladas:

```bash
pnpm add prisma @prisma/client
```

---

## 🔧 Configuração do Neon

### Passo 1: Criar conta no Neon

1. Acesse: https://neon.tech/
2. Crie uma conta gratuita
3. Crie um novo projeto

### Passo 2: Obter Connection String

1. No painel do Neon, vá em **Connection Details**
2. Copie a **Connection String** (formato: `postgresql://user:password@host/database`)
3. Certifique-se de incluir `?sslmode=require` no final

### Passo 3: Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```bash
# .env.local
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

**⚠️ IMPORTANTE:** Nunca commite o arquivo `.env.local`! Ele já está no `.gitignore`.

---

## 🗄️ Migrações

### Criar as tabelas no banco de dados:

```bash
# Criar migração inicial e aplicar
npx prisma migrate dev --name init

# Ou apenas aplicar migrações existentes
npx prisma migrate deploy
```

### Gerar Prisma Client após mudanças no schema:

```bash
npx prisma generate
```

### Visualizar o banco de dados:

```bash
npx prisma studio
```

Isso abrirá uma interface web em `http://localhost:5555` para visualizar e editar dados.

---

## 🛠️ API Routes

### API de Comentários (Exemplo)

**Endpoint:** `/api/comments`

- `GET /api/comments` - Lista todos os comentários
- `POST /api/comments` - Cria novo comentário

**Exemplo de uso:**

```typescript
// GET
const response = await fetch('/api/comments');
const comments = await response.json();

// POST
await fetch('/api/comments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: 'Meu comentário' }),
});
```

### API de Cursos com Prisma

**Endpoint:** `/api/cursos-prisma`

- `GET /api/cursos-prisma` - Lista todos os cursos
- `POST /api/cursos-prisma` - Cria novo curso
- `PUT /api/cursos-prisma` - Atualiza curso
- `DELETE /api/cursos-prisma?id={id}` - Deleta curso
- `GET /api/cursos-prisma/[id]` - Busca curso por ID

**Exemplo de uso:**

```typescript
// Criar curso
await fetch('/api/cursos-prisma', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    titulo: 'Curso de Next.js',
    descricao: 'Aprenda Next.js do zero',
    cargaHoraria: '40h',
    instrutor: 'João Silva',
    modalidade: 'Online',
    categoria: 'Desenvolvimento Web',
    unidades: []
  }),
});
```

---

## 📊 Modelos

### Comment (Exemplo)

```prisma
model Comment {
  id        Int      @id @default(autoincrement())
  text      String
  createdAt DateTime @default(now())

  @@map("comments")
}
```

### Curso (Sistema Principal)

```prisma
model Curso {
  id               String   @id @default(cuid())
  titulo           String
  descricao        String
  cargaHoraria     String
  instrutor        String
  modalidade       String
  categoria        String
  unidades         Json     @default("[]")
  dataCriacao      DateTime @default(now())
  dataModificacao  DateTime @updatedAt

  @@index([titulo])
  @@index([categoria])
  @@map("cursos")
}
```

---

## 🧪 Testes

### Testar a API de Comentários

Acesse: `http://localhost:3000/test-prisma`

Esta página permite:
- ✅ Criar novos comentários
- ✅ Listar comentários existentes
- ✅ Verificar se a conexão com o banco está funcionando

### Testar via curl

```bash
# Listar comentários
curl http://localhost:3000/api/comments

# Criar comentário
curl -X POST http://localhost:3000/api/comments \
  -H "Content-Type: application/json" \
  -d '{"text":"Meu primeiro comentário"}'

# Listar cursos
curl http://localhost:3000/api/cursos-prisma
```

---

## 🔍 Troubleshooting

### Erro: "DATABASE_URL not found"

**Solução:**
- Certifique-se que o arquivo `.env.local` existe na raiz do projeto
- Verifique se a variável `DATABASE_URL` está configurada
- Reinicie o servidor: `pnpm dev`

### Erro: "P2021: table does not exist"

**Solução:**
```bash
npx prisma migrate dev --name init
```

### Erro: "P2002: Unique constraint failed"

**Solução:**
- Você está tentando inserir um registro duplicado
- Verifique os campos únicos no schema

### Erro: "Can't reach database server"

**Solução:**
- Verifique se a connection string está correta
- Teste a conexão no painel do Neon
- Certifique-se que `?sslmode=require` está na URL

### Regenerar Prisma Client

Se houver problemas de tipagem ou erros de import:

```bash
DATABASE_URL="postgresql://placeholder:placeholder@placeholder/placeholder" npx prisma generate
```

---

## 📚 Comandos Úteis

```bash
# Ver status do banco
npx prisma db pull

# Resetar banco (⚠️ CUIDADO: deleta todos os dados)
npx prisma migrate reset

# Formatar schema
npx prisma format

# Validar schema
npx prisma validate

# Ver logs do Prisma
npx prisma studio
```

---

## 🔄 Migração da API Antiga

O projeto tem duas APIs de cursos:

1. **`/api/cursos`** - Usa `@vercel/postgres` diretamente (legado)
2. **`/api/cursos-prisma`** - Usa Prisma ORM (recomendado)

Para migrar para Prisma:

1. Configure o `DATABASE_URL` no `.env.local`
2. Execute as migrações: `npx prisma migrate dev`
3. Atualize o contexto para usar `/api/cursos-prisma`

---

## 🌐 Recursos

- [Documentação Prisma](https://www.prisma.io/docs/)
- [Neon PostgreSQL](https://neon.tech/docs)
- [Prisma + Next.js Guide](https://www.prisma.io/nextjs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)

---

## 💡 Dicas

1. **Sempre use transactions para operações complexas:**
```typescript
await prisma.$transaction([
  prisma.curso.create({ data: {...} }),
  prisma.comment.create({ data: {...} }),
]);
```

2. **Use relações para evitar joins manuais:**
```prisma
model User {
  id       String   @id
  cursos   Curso[]  // Relação 1:N
}
```

3. **Aproveite o Prisma Studio para debug:**
```bash
npx prisma studio
```

---

**✨ Pronto! Seu projeto está configurado com Prisma + Neon PostgreSQL!**

