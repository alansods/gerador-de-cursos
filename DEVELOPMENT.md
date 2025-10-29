# 🛠️ Guia de Desenvolvimento

## 🚀 Configuração Inicial

```bash
# Clone o repositório
git clone <repo-url>
cd gerador-de-cursos

# Instalação automática
./start-dev.sh

# Ou manual:
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```

## 📁 Estrutura do Projeto

```
Gerador-de-Cursos/
├── frontend/                 # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   │   ├── advanced/   # Componentes avançados (futuro)
│   │   │   └── ui/         # Componentes base
│   │   ├── hooks/          # Hooks customizados
│   │   ├── services/       # Serviços (futuro)
│   │   ├── config/         # Configurações
│   │   └── pages/          # Páginas da aplicação
│   └── package.json
├── backend/                 # Express.js + Node.js
│   ├── src/
│   │   ├── services/       # Lógica de negócio
│   │   ├── config/         # Configurações
│   │   └── server.js       # Servidor Express
│   └── package.json
├── README.md               # Documentação principal
├── ROADMAP.md             # Roadmap detalhado
└── start-dev.sh           # Script de inicialização
```

## 🔧 Sistema de Funcionalidades

### Frontend
```typescript
// src/config/features.ts
export const FEATURES = {
  SCORM_EXPORT: true,        // Ativo
  PDF_EXPORT: false,         // Planejado
  ACCORDION_COMPONENT: false, // Planejado
  // ...
};

// src/hooks/useFeatures.ts
const { isEnabled, enable, disable } = useFeatures();
```

### Backend
```javascript
// src/config/features.js
export const FEATURES = {
  SCORM_EXPORT: true,        // Ativo
  PDF_EXPORT: false,         // Planejado
  ANALYTICS: false,          // Planejado
  // ...
};
```

## 🚀 Adicionando Novas Funcionalidades

### 1. **Configurar Funcionalidade**
```typescript
// frontend/src/config/features.ts
export const FEATURES = {
  // ... existentes
  NOVA_FUNCIONALIDADE: false, // Adicionar aqui
};
```

### 2. **Criar Componente**
```typescript
// frontend/src/components/advanced/NovaFuncionalidade.tsx
export const NovaFuncionalidade: React.FC = () => {
  const { isEnabled } = useFeature('NOVA_FUNCIONALIDADE');
  
  if (!isEnabled) return null;
  
  return <div>Nova Funcionalidade</div>;
};
```

### 3. **Adicionar Endpoint**
```javascript
// backend/src/server.js
app.post('/api/nova-funcionalidade', async (req, res) => {
  // Implementar lógica
});
```

### 4. **Habilitar Funcionalidade**
```typescript
// Para desenvolvimento
enableFeature('NOVA_FUNCIONALIDADE');
```

## 🧪 Testes

### Backend
```bash
cd backend
node test-scorm.js
```

### Frontend
```bash
cd frontend
npm run test
```

### Integração
```bash
# 1. Inicie backend e frontend
# 2. Teste funcionalidades
# 3. Verifique logs
```

## 📊 Monitoramento

### Health Check
```bash
curl http://localhost:5001/api/health
```

### Features Status
```bash
curl http://localhost:5001/api/features
```

### Logs
- **Frontend**: Console do navegador
- **Backend**: Terminal onde está rodando

## 🚀 Deploy

### Frontend (Vercel)
```bash
cd frontend
vercel --prod
```

### Backend (Heroku/Railway)
```bash
cd backend
# Configure variáveis de ambiente
# Deploy com sua plataforma preferida
```

## 🔧 Troubleshooting

### Problemas Comuns

#### "Failed to fetch"
- Verifique se backend está rodando
- Verifique CORS
- Recarregue página (Ctrl+Shift+R)

#### "Port already in use"
```bash
# Liberar porta 3000
lsof -ti:3000 | xargs kill

# Liberar porta 5001
lsof -ti:5001 | xargs kill
```

#### "Cannot find module"
```bash
# Reinstalar dependências
cd backend && npm install
cd frontend && npm install
```

## 📋 Checklist de Desenvolvimento

### Antes de Implementar
- [ ] Verificar se funcionalidade está no roadmap
- [ ] Configurar feature flag
- [ ] Criar estrutura de pastas
- [ ] Implementar testes

### Durante o Desenvolvimento
- [ ] Seguir padrões do projeto
- [ ] Adicionar logs de debug
- [ ] Testar integração
- [ ] Documentar mudanças

### Após Implementar
- [ ] Testar funcionalidade
- [ ] Atualizar documentação
- [ ] Habilitar feature flag
- [ ] Deploy se necessário

---

**Status**: MVP funcional ✅  
**Próximo**: Implementar exportação PDF 🚀
