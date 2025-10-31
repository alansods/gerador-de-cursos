# Configuração do Banco de Dados

O projeto suporta duas formas de persistência de dados:

## 1. localStorage (Padrão)

Por padrão, o sistema usa `localStorage` do navegador para salvar os cursos. Isso significa:
- ✅ Funciona imediatamente sem configuração
- ✅ Sem necessidade de banco de dados
- ✅ Ideal para desenvolvimento e testes
- ⚠️ Dados salvos apenas no navegador local
- ⚠️ Não compartilha dados entre dispositivos

## 2. Vercel Postgres (Produção)

Para usar banco de dados em produção:

### Passo 1: Criar banco no Vercel

1. Acesse https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em "Storage" > "Create Database" > "Postgres"
4. Siga as instruções para criar o banco

### Passo 2: Configurar variáveis de ambiente

Copie as credenciais fornecidas pelo Vercel e crie um arquivo `.env.local`:

```bash
# .env.local
POSTGRES_URL="postgres://user:password@host:5432/database"
POSTGRES_PRISMA_URL="postgres://user:password@host:5432/database?pgbouncer=true"
POSTGRES_URL_NON_POOLING="postgres://user:password@host:5432/database"
POSTGRES_USER="user"
POSTGRES_HOST="host"
POSTGRES_PASSWORD="password"
POSTGRES_DATABASE="database"
```

### Passo 3: Reiniciar servidor

```bash
pnpm dev
```

O sistema irá:
1. Detectar automaticamente que há `POSTGRES_URL` configurado
2. Criar as tabelas necessárias na primeira execução
3. Usar o banco de dados para todas as operações CRUD

## Esquema do Banco

A tabela `cursos` é criada automaticamente com:

```sql
CREATE TABLE cursos (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  carga_horaria TEXT NOT NULL,
  instrutor TEXT NOT NULL,
  modalidade TEXT NOT NULL,
  categoria TEXT NOT NULL,
  unidades JSONB DEFAULT '[]',
  data_criacao TIMESTAMP DEFAULT NOW(),
  data_modificacao TIMESTAMP DEFAULT NOW()
);
```

## API Routes

O backend fornece as seguintes rotas:

- `GET /api/cursos` - Listar todos os cursos
- `GET /api/cursos/[id]` - Buscar curso por ID
- `POST /api/cursos` - Criar novo curso
- `PUT /api/cursos` - Atualizar curso
- `DELETE /api/cursos?id=[id]` - Deletar curso
- `GET /api/init-db` - Inicializar banco de dados (automático)

## Migrando de localStorage para Banco

Se você já tem dados no `localStorage` e quer migrar para banco:

1. Configure as variáveis de ambiente
2. Os dados do `localStorage` **não serão** migrados automaticamente
3. Você pode exportar os dados manualmente usando o console do navegador:

```javascript
// No console do navegador (F12)
const cursos = localStorage.getItem('gerador-cursos')
console.log(JSON.parse(cursos))
```

4. Use a API `POST /api/cursos` para inserir cada curso no banco

## Troubleshooting

### "Using localStorage for data persistence"

Isso significa que:
- O banco de dados não está configurado
- O sistema está usando `localStorage` como fallback
- Tudo funciona normalmente, mas apenas localmente

### "Database needs initialization"

Isso significa:
- O banco está configurado mas as tabelas não existem ainda
- O sistema irá criar as tabelas automaticamente
- Aguarde alguns segundos e recarregue a página

### Erros de conexão

Se você vê erros de conexão com o banco:
1. Verifique se as variáveis de ambiente estão corretas
2. Teste a conexão usando: `curl http://localhost:3000/api/init-db`
3. Verifique os logs do servidor no terminal

