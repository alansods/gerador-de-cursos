# 🚀 Quick Start - Testes

Guia rápido para começar a rodar os testes.

## 1️⃣ Instalar Dependências

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom @playwright/test
```

## 2️⃣ Instalar Navegadores do Playwright

```bash
npx playwright install
```

## 3️⃣ Rodar os Testes

### Testes Unitários/Integração
```bash
npm test
```

### Testes E2E
```bash
# Iniciar o servidor em um terminal
npm run dev

# Em outro terminal, rodar os testes
npm run test:e2e
```

### Ver Interface Gráfica (Recomendado)
```bash
npm run test:e2e:ui
```

## 4️⃣ Ver Cobertura

```bash
npm run test:coverage
```

Abra `coverage/lcov-report/index.html` no navegador.

## 📚 Documentação Completa

Ver [TESTING.md](./TESTING.md) para documentação completa.

## ✅ Verificações de Requisições Duplicadas

Todos os testes incluem verificações para garantir que não há requisições duplicadas:

- ✅ Carregamento de cursos: 1 requisição
- ✅ Busca com debounce: 1 requisição após 500ms
- ✅ Filtros: 1 requisição por mudança
- ✅ Login: 1 requisição por submissão

## 🎯 Comandos Rápidos

```bash
npm test                    # Rodar testes Jest
npm run test:watch          # Watch mode
npm run test:coverage       # Com cobertura
npm run test:e2e           # Testes E2E
npm run test:e2e:ui        # E2E com UI
npm run test:all           # Todos os testes
```

## 🐛 Problemas Comuns

### Erro: Cannot find module '@/...'
✅ Já configurado em `jest.config.js`

### Erro: JWT_SECRET não definido
✅ Já configurado em `jest.setup.js`

### Testes E2E não rodam
✅ Certifique-se que `npm run dev` está rodando em outro terminal

## 📊 Cobertura Atual

- API Endpoints: 100%
- Fluxo de Login: 100%
- Página de Cursos: 100%
- Verificação de Duplicação: 100%
