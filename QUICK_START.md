# 🚀 Quick Start - Banco de Dados

## ⚡ Setup Rápido (5 minutos)

### 1️⃣ Criar Banco no Neon
```bash
# Acesse: https://neon.tech/
# Crie uma conta gratuita
# Crie um novo projeto
# Copie a Connection String
```

### 2️⃣ Configurar DATABASE_URL
Crie o arquivo `.env.local` na raiz do projeto:

```bash
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require"
```

### 3️⃣ Executar Migração
```bash
pnpm db:migrate
# ou
npx prisma migrate dev --name init
```

### 4️⃣ Popular com Dados de Exemplo
```bash
pnpm db:seed
# ou
npx prisma db seed
```

Isso vai criar:
- ✅ 1 curso de exemplo: "Introdução ao Next.js 14"
- ✅ 3 unidades com conteúdo
- ✅ 3 comentários de teste

### 5️⃣ Iniciar Servidor
```bash
pnpm dev
```

### 6️⃣ Testar
```bash
# Acessar:
http://localhost:3000/cursos

# Deve aparecer o curso "Introdução ao Next.js 14"
```

---

## 📊 Comandos Úteis

```bash
# Ver banco de dados visualmente
pnpm db:studio

# Resetar banco (CUIDADO: deleta tudo)
npx prisma migrate reset

# Gerar Prisma Client
pnpm db:generate

# Criar nova migração
pnpm db:migrate

# Popular com dados de exemplo
pnpm db:seed
```

---

## 🧪 Testar API

### Listar cursos:
```bash
curl http://localhost:3000/api/cursos
```

### Criar curso:
```bash
curl -X POST http://localhost:3000/api/cursos \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Meu Curso",
    "descricao": "Descrição",
    "cargaHoraria": "20h",
    "instrutor": "João Silva",
    "modalidade": "Online",
    "categoria": "Programação"
  }'
```

### Listar comentários:
```bash
curl http://localhost:3000/api/comments
```

---

## ✅ Checklist

- [ ] Criar conta no Neon
- [ ] Copiar connection string
- [ ] Criar `.env.local` com `DATABASE_URL`
- [ ] Executar `pnpm db:migrate`
- [ ] Executar `pnpm db:seed`
- [ ] Iniciar servidor: `pnpm dev`
- [ ] Acessar: `http://localhost:3000/cursos`
- [ ] Verificar curso de exemplo apareceu

---

## 🆘 Problemas?

### "Can't reach database server"
- Verifique se `DATABASE_URL` está correto no `.env.local`
- Teste a connection string no painel do Neon

### "P2021: table does not exist"
- Execute: `pnpm db:migrate`

### "Missing DATABASE_URL"
- Reinicie o servidor após criar `.env.local`
- Use `DATABASE_URL="..." pnpm db:migrate` inline

---

**🎉 Pronto! Sistema funcionando com banco de dados!**

