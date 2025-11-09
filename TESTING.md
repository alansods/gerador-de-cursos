# 🧪 Documentação de Testes

Este documento descreve a estratégia de testes implementada no projeto Gerador de Cursos SCORM.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Tipos de Testes](#tipos-de-testes)
- [Instalação](#instalação)
- [Executando os Testes](#executando-os-testes)
- [Estrutura de Testes](#estrutura-de-testes)
- [Verificações de Requisições Duplicadas](#verificações-de-requisições-duplicadas)
- [Cobertura de Testes](#cobertura-de-testes)
- [Boas Práticas](#boas-práticas)

## 🎯 Visão Geral

O projeto possui uma suite completa de testes automatizados que cobrem:

- ✅ **Testes de API**: Endpoints de autenticação e cursos
- ✅ **Testes de Integração**: Fluxos de login e páginas
- ✅ **Testes E2E**: Navegação completa no navegador
- ✅ **Verificação de Performance**: Detecção de requisições duplicadas

## 🔍 Tipos de Testes

### 1. Testes de API (Jest)

Testam os endpoints da API de forma isolada.

**Localização**: `src/__tests__/api/`

**Cobertura**:
- `auth.test.ts` - Testes de autenticação
  - POST `/api/auth/login`
  - GET `/api/auth/me`
  - POST `/api/auth/logout`

- `cursos.test.ts` - Testes de cursos
  - GET `/api/cursos` (listar com paginação)
  - GET `/api/cursos/[id]` (buscar por ID)
  - POST `/api/cursos` (criar)
  - PUT `/api/cursos` (atualizar)
  - DELETE `/api/cursos` (deletar)

### 2. Testes de Integração (Jest + React Testing Library)

Testam componentes e fluxos completos.

**Localização**: `src/__tests__/integration/`

**Cobertura**:
- `login-flow.test.tsx` - Fluxo completo de login
  - Renderização do formulário
  - Validação de campos
  - Submissão de login
  - Tratamento de erros
  - Verificação de requisições duplicadas

- `cursos-page.test.tsx` - Página de cursos
  - Carregamento inicial
  - Busca com debounce
  - Filtros
  - Paginação
  - Verificação de requisições duplicadas

### 3. Testes E2E (Playwright)

Testam o fluxo completo no navegador real.

**Localização**: `e2e/`

**Cobertura**:
- `login.spec.ts` - Fluxo de login
- `cursos.spec.ts` - Gerenciamento de cursos

## 📦 Instalação

### 1. Instalar Dependências de Teste

```bash
npm install --save-dev \
  jest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jest-environment-jsdom \
  @playwright/test
```

### 2. Instalar Navegadores do Playwright

```bash
npx playwright install
```

## 🚀 Executando os Testes

### Testes Unitários e de Integração (Jest)

```bash
# Rodar todos os testes
npm test

# Rodar em modo watch (útil durante desenvolvimento)
npm run test:watch

# Gerar relatório de cobertura
npm run test:coverage

# Rodar apenas testes de API
npm test -- src/__tests__/api

# Rodar apenas testes de integração
npm test -- src/__tests__/integration
```

### Testes E2E (Playwright)

```bash
# Rodar todos os testes E2E
npm run test:e2e

# Rodar com interface gráfica
npm run test:e2e:ui

# Rodar em modo debug
npm run test:e2e:debug

# Rodar apenas testes de login
npm run test:e2e -- login

# Rodar apenas testes de cursos
npm run test:e2e -- cursos
```

### Rodar Todos os Testes

```bash
npm run test:all
```

## 📁 Estrutura de Testes

```
gerador-de-cursos/
├── src/
│   └── __tests__/
│       ├── api/
│       │   ├── auth.test.ts
│       │   └── cursos.test.ts
│       └── integration/
│           ├── login-flow.test.tsx
│           └── cursos-page.test.tsx
├── e2e/
│   ├── login.spec.ts
│   └── cursos.spec.ts
├── jest.config.js
├── jest.setup.js
└── playwright.config.ts
```

## 🔄 Verificações de Requisições Duplicadas

### Por que verificar?

Requisições duplicadas podem causar:
- ❌ Lentidão no carregamento
- ❌ Dados inconsistentes
- ❌ Maior consumo de recursos
- ❌ Problemas de UX

### Como verificamos?

Todos os testes incluem verificações específicas para garantir que não há requisições duplicadas:

#### Testes de API
```typescript
expect(mockPrisma.curso.findMany).toHaveBeenCalledTimes(1)
```

#### Testes de Integração
```typescript
const mockFetch = jest.fn()
global.fetch = mockFetch

// ... realizar ação ...

// Verificar que foi chamado apenas uma vez
expect(mockFetch).toHaveBeenCalledTimes(1)
```

#### Testes E2E
```typescript
const apiRequests: string[] = []

page.on('request', (request) => {
  if (request.url().includes('/api/cursos')) {
    apiRequests.push(request.url())
  }
})

// ... realizar ação ...

// Verificar que não houve duplicação
expect(apiRequests).toHaveLength(1)
```

### Cenários Testados

1. **Carregamento Inicial de Cursos**
   - ✅ Página de cursos carrega dados apenas UMA VEZ
   - ✅ GeradorCursoContext NÃO faz requisição duplicada

2. **Busca com Debounce**
   - ✅ Digitar "JavaScript" (10 letras) = 1 requisição
   - ✅ Não faz requisição a cada tecla

3. **Filtros e Paginação**
   - ✅ Mudar categoria = 1 requisição
   - ✅ Mudar modalidade = 1 requisição
   - ✅ Mudar página = 1 requisição

4. **Login Flow**
   - ✅ Submeter login = 1 requisição
   - ✅ Não duplica em caso de erro

## 📊 Cobertura de Testes

### Endpoints Testados

| Endpoint | GET | POST | PUT | DELETE |
|----------|-----|------|-----|--------|
| `/api/auth/login` | - | ✅ | - | - |
| `/api/auth/me` | ✅ | - | - | - |
| `/api/auth/logout` | - | ✅ | - | - |
| `/api/cursos` | ✅ | ✅ | ✅ | ✅ |
| `/api/cursos/[id]` | ✅ | - | - | - |

### Páginas Testadas

| Página | Integração | E2E |
|--------|------------|-----|
| `/login` | ✅ | ✅ |
| `/cursos` | ✅ | ✅ |
| `/home` | ⏳ | ⏳ |

### Funcionalidades Testadas

- ✅ Autenticação (login/logout)
- ✅ Proteção de rotas
- ✅ Validação de formulários
- ✅ Busca com debounce
- ✅ Filtros e paginação
- ✅ Tratamento de erros
- ✅ Estados de loading
- ✅ Requisições sem duplicação

## 📝 Boas Práticas

### 1. Padrão AAA (Arrange, Act, Assert)

```typescript
test('deve fazer login com sucesso', async () => {
  // Arrange - Preparar
  const mockUser = { id: '1', usuario: 'test' }
  mockPrisma.user.findUnique.mockResolvedValue(mockUser)

  // Act - Agir
  const response = await loginHandler(request)

  // Assert - Verificar
  expect(response.status).toBe(200)
})
```

### 2. Testes Isolados

- Cada teste deve ser independente
- Limpar mocks antes de cada teste
- Não depender de ordem de execução

```typescript
beforeEach(() => {
  jest.clearAllMocks()
})
```

### 3. Verificar Requisições

Sempre verificar:
- ✅ Que a requisição foi feita
- ✅ Que foi feita apenas uma vez
- ✅ Com os parâmetros corretos

```typescript
expect(mockFetch).toHaveBeenCalledTimes(1)
expect(mockFetch).toHaveBeenCalledWith('/api/cursos', { method: 'GET' })
```

### 4. Testes Descritivos

```typescript
// ❌ Ruim
test('teste 1', () => { ... })

// ✅ Bom
test('deve retornar erro 401 quando usuário não está autenticado', () => { ... })
```

### 5. Simular Cenários Reais

- Testar casos de sucesso E falha
- Testar validações
- Testar estados de loading
- Testar cenários de erro de rede

## 🐛 Debugging

### Testes Jest

```bash
# Rodar um teste específico
npm test -- -t "deve fazer login"

# Ver output completo
npm test -- --verbose

# Rodar em modo debug
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Testes Playwright

```bash
# Modo debug (pausa execução)
npm run test:e2e:debug

# Interface gráfica
npm run test:e2e:ui

# Ver traces de falhas
npx playwright show-trace trace.zip
```

## 📈 Métricas de Sucesso

### Nossos Objetivos

- ✅ **Cobertura**: > 80% de cobertura de código
- ✅ **Performance**: Zero requisições duplicadas
- ✅ **Confiabilidade**: Todos os testes passando
- ✅ **Manutenibilidade**: Testes claros e bem documentados

### Como Verificar

```bash
# Ver cobertura de código
npm run test:coverage

# Relatório interativo em: coverage/lcov-report/index.html
```

## 🔧 Troubleshooting

### Problema: "Cannot find module '@/...'"

**Solução**: Verificar configuração de aliases em `jest.config.js`

```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
}
```

### Problema: "JWT_SECRET não definido"

**Solução**: Verificar `jest.setup.js`

```javascript
process.env.JWT_SECRET = 'test-jwt-secret-key'
```

### Problema: Testes E2E falhando

**Solução**: Verificar se o servidor está rodando

```bash
# Em um terminal
npm run dev

# Em outro terminal
npm run test:e2e
```

## 🎓 Recursos de Aprendizado

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://testingjavascript.com/)

## 🚀 Próximos Passos

1. ⏳ Adicionar testes para página `/home`
2. ⏳ Adicionar testes para criação/edição de cursos
3. ⏳ Adicionar testes de acessibilidade (a11y)
4. ⏳ Integrar com CI/CD
5. ⏳ Adicionar testes de performance com Lighthouse

## 📞 Suporte

Se encontrar problemas ou tiver dúvidas sobre os testes:

1. Verificar este documento
2. Ver exemplos nos arquivos de teste existentes
3. Consultar a documentação oficial das ferramentas

---

**Última atualização**: 2025-11-09
**Versão**: 1.0.0
