# 🎓 Gerador de Cursos

Sistema fullstack para criação e exportação de cursos em formato SCORM, com interface React e backend Express.

## 🚀 Início Rápido

```bash
# Instalação automática
./start-dev.sh

# Ou manual:
# Terminal 1 - Backend
cd backend && npm install && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm install && npm run dev
```

## 🌐 URLs

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5001

## 📦 Funcionalidades Atuais

- ✅ Interface para criação de cursos
- ✅ Gerenciamento de unidades e conteúdos
- ✅ Preview de cursos
- ✅ Geração de pacotes SCORM
- ✅ Download automático

## 🛠️ Arquitetura

```
Gerador-de-Cursos/
├── frontend/          # React + Vite + TypeScript
├── backend/           # Express.js + Node.js
└── start-dev.sh      # Script de inicialização
```

## 🚀 Roadmap MVP

### Próximas Funcionalidades

#### 📄 **Exportação PDF** (Próxima)
- Geração de PDFs dos cursos
- Layout responsivo para impressão
- Índice automático
- Watermark opcional

#### 🎨 **Componentes Avançados**
- **Accordion**: Conteúdo expansível
- **Slideshow**: Apresentações interativas
- **Timeline**: Linha do tempo de progresso
- **Quiz**: Questionários integrados

#### 🎯 **Melhorias de UX**
- Drag & drop para reordenar conteúdo
- Templates pré-definidos
- Preview em tempo real
- Temas personalizáveis

#### 📊 **Analytics**
- Relatórios de progresso
- Métricas de engajamento
- Dashboard de estatísticas

### 🔧 Sistema de Funcionalidades

O sistema inclui um controle de funcionalidades que permite:
- Habilitar/desabilitar funcionalidades
- Desenvolvimento incremental
- Roadmap visual no frontend

**Endpoint**: `GET /api/features` - Status das funcionalidades

## 🔧 Desenvolvimento

### Estrutura do Projeto

```
frontend/src/
├── components/        # Componentes React
├── hooks/            # Hooks customizados
├── pages/            # Páginas da aplicação
└── types/            # Definições TypeScript

backend/src/
├── server.js         # Servidor Express
├── services/         # Lógica de negócio
└── config.js         # Configurações
```

### Adicionando Novas Funcionalidades

1. **Frontend**: Crie componentes em `src/components/`
2. **Backend**: Adicione endpoints em `src/server.js`
3. **Integração**: Use hooks para comunicação

## 🧪 Testes

```bash
# Testar backend
cd backend && node test-scorm.js

# Testar integração
# 1. Inicie backend e frontend
# 2. Crie um curso
# 3. Clique em "Baixar SCORM"
```

## 📋 Scripts

### Frontend
- `npm run dev` - Desenvolvimento
- `npm run build` - Build para produção

### Backend
- `npm run dev` - Desenvolvimento
- `node test-scorm.js` - Teste SCORM

## 🚀 Deploy

### Frontend (Vercel)
```bash
cd frontend && vercel --prod
```

### Backend (Heroku/Railway)
```bash
cd backend
# Configure variáveis de ambiente
# Deploy com sua plataforma preferida
```

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do backend
2. Teste a API com `curl` ou Postman
3. Execute `./start-dev.sh` para setup completo

---

**Status**: MVP funcional ✅  
**Próximo**: Implementar exportação PDF e componentes avançados 🚀