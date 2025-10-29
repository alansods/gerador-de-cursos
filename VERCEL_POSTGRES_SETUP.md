# 🗄️ Configuração do Vercel Postgres

## ⚠️ Status Atual

O projeto está configurado para usar **Vercel Postgres**, mas o banco de dados ainda **NÃO foi criado**.

Atualmente, o app funciona com **localStorage** como fallback, mas para ter persistência de dados em nuvem, você precisa configurar o banco.

## 📋 Passo a Passo

### 1. Acessar o Dashboard da Vercel

1. Acesse: https://vercel.com/dashboard
2. Faça login na conta `alansods-projects`
3. Selecione o projeto `gerador-de-cursos`

### 2. Criar o Banco de Dados Postgres

1. No menu lateral, clique em **"Storage"**
2. Clique em **"Create Database"**
3. Selecione **"Postgres"**
4. Configure:
   - **Database Name**: `gerador-cursos-db` (ou qualquer nome)
   - **Region**: Escolha a região mais próxima (ex: `Washington, D.C.`)
   - **Plan**: Selecione **Hobby** (gratuito)
5. Clique em **"Create"**
6. Aguarde 1-2 minutos para o banco ser provisionado

### 3. Conectar o Banco ao Projeto

1. Após criar, você verá a página do banco de dados
2. Clique na aba **"Projects"**
3. Clique em **"Connect Project"**
4. Selecione o projeto `gerador-de-cursos`
5. Clique em **"Connect"**

### 4. Verificar Variáveis de Ambiente

As variáveis de ambiente serão configuradas automaticamente:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

### 5. Inicializar o Banco

Após o deploy, o banco será inicializado automaticamente na primeira vez que você abrir o app.

Ou você pode inicializar manualmente acessando:
```
https://gerador-de-cursos-v2.vercel.app/api/init-db
```

Método: `POST`

Você verá uma mensagem de sucesso:
```json
{
  "message": "Banco de dados inicializado com sucesso",
  "tables": ["cursos", "modulos", "aulas"]
}
```

### 6. Testar a Aplicação

1. Acesse: https://gerador-de-cursos-v2.vercel.app
2. O loading deve aparecer brevemente
3. Os cursos devem carregar normalmente
4. Crie um novo curso para testar

## 🔍 Verificar se está Funcionando

### ✅ Funcionando Corretamente:
- Loading spinner aparece ao carregar
- Nenhum erro 500 no console
- Cursos são salvos e carregados corretamente
- Não aparece o alerta amarelo sobre banco não configurado

### ❌ Ainda usando localStorage:
- Aparece alerta amarelo: "Banco de dados não configurado"
- Erro 500 no console ao fazer GET/POST para `/api/courses`
- Cursos só aparecem no navegador onde foram criados

## 🎯 Benefícios após Configurar

- ✅ Dados sincronizados entre dispositivos
- ✅ Backup automático no Vercel
- ✅ Performance melhor para muitos cursos
- ✅ Acesso de qualquer lugar
- ✅ Colaboração entre múltiplos usuários

## 🆘 Troubleshooting

### Erro 500 ao acessar `/api/courses`
- O banco não foi criado ou conectado ao projeto
- Verifique se as variáveis de ambiente estão configuradas
- Tente reconectar o banco ao projeto

### Tabelas não foram criadas
- Acesse manualmente `/api/init-db` com método POST
- Verifique os logs do Vercel Functions

### Dados não aparecem
- Limpe o localStorage: `localStorage.clear()`
- Recarregue a página
- Verifique se o banco foi inicializado

## 📊 Schema do Banco

O banco tem 3 tabelas principais:

**cursos**
- `id`, `titulo`, `descricao`, `duracao`, `nivel`, `idioma`, etc.

**modulos**
- `id`, `curso_id`, `titulo`, `descricao`, `ordem`

**aulas**
- `id`, `modulo_id`, `curso_id`, `titulo`, `tipo`, `conteudo` (JSONB), `ordem`

## 💰 Custo

O plano **Hobby** do Vercel Postgres é **GRATUITO** e inclui:
- 256 MB de armazenamento
- 60 horas de compute por mês
- Suficiente para este projeto

## 🔗 Links Úteis

- Dashboard: https://vercel.com/dashboard
- Documentação Vercel Postgres: https://vercel.com/docs/storage/vercel-postgres
- Projeto: https://gerador-de-cursos-v2.vercel.app

