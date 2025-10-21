# 🏗️ Arquitetura do Sistema de Curso

## 📁 Estrutura de Arquivos

```
src/
├── data/
│   ├── curso.json              # Dados estáticos do curso
│   └── unidade1.json           # Dados da primeira unidade
├── context/
│   ├── DrawerContext.tsx       # Context para menu lateral
│   └── ProgressoContext.tsx    # Context API para estado global
├── types/
│   ├── curso.ts               # Interfaces TypeScript do curso
│   └── modulo.ts              # Interfaces dos módulos
├── hooks/
│   ├── index.ts               # Exports centralizados
│   ├── useContinuarCurso.ts   # Hook para continuar curso
│   ├── useCurso.ts            # Hook principal do curso
│   ├── useModuloProgress.ts   # Hook para progresso dos módulos
│   └── useModuloStatus.ts     # Hook para status dos módulos
├── layouts/
│   ├── Drawer.tsx             # Menu lateral
│   ├── Footer.tsx             # Rodapé
│   ├── Header.tsx             # Cabeçalho
│   ├── index.ts               # Exports centralizados
│   └── MainLayout.tsx         # Layout principal
├── pages/
│   ├── home/                  # Página inicial
│   │   ├── index.tsx
│   │   └── components/
│   ├── TesteScorm.tsx         # Página de teste SCORM
│   └── unidade-1/             # Unidade 1 do curso
│       ├── index.tsx
│       └── aulas/             # Aulas da unidade
└── components/
    └── ui/                    # Componentes shadcn/ui
```

## 🎯 Separação de Responsabilidades

### **1. Dados Estáticos (`src/data/`)**
```json
// curso.json
{
  "titulo": "Assistente de Operações Logísticas",
  "categoria": "Logística",
  "descricao": "Desenvolva competências para atuar na área de logística empresarial.",
  "cargaHoraria": "200 horas",
  "modalidade": "Qualificação",
  "instrutor": "Prof. Maria Silva",
  "modulos": [...]
}

// unidade1.json
{
  "titulo": "Fundamentos da Logística",
  "descricao": "Conceitos básicos e importância da logística nas empresas.",
  "aulas": [...]
}
```

**✅ Vantagens:**
- **Fácil edição**: Alterar dados sem tocar no código
- **Reutilização**: Pode ser usado em outras partes da aplicação
- **Versionamento**: Mudanças são rastreáveis no Git
- **Performance**: Carregado uma vez na inicialização

### **2. Estado Dinâmico (`src/context/`)**
```typescript
// ProgressoContext.tsx
interface ProgressoState {
  modulos: ModuloProgresso[];
  progressoGeral: number; // 0-100%
  moduloAtual: number | null;
  ultimaAtualizacao: Date;
}

// DrawerContext.tsx
interface DrawerState {
  isOpen: boolean;
  toggleDrawer: () => void;
}
```

**✅ Funcionalidades:**
- **Gerenciamento de estado**: Reducer pattern para mudanças complexas
- **Persistência**: Salva automaticamente no localStorage
- **Sincronização SCORM**: Integração automática com LMS
- **Performance**: Otimizado com useMemo e useCallback
- **UI State**: Controle de menu lateral e outros estados da interface

### **3. Hooks Customizados (`src/hooks/`)**
```typescript
// useCurso.ts - Hook principal
const curso = useCurso();
// Combina dados estáticos + progresso dinâmico

// useModuloProgress.ts - Progresso dos módulos
const progresso = useModuloProgress(moduloId);

// useModuloStatus.ts - Status dos módulos
const status = useModuloStatus(moduloId);

// useContinuarCurso.ts - Navegação do curso
const { proximoModulo, moduloAnterior } = useContinuarCurso();
```

**✅ Benefícios:**
- **Abstração**: Esconde complexidade da implementação
- **Reutilização**: Pode ser usado em qualquer componente
- **TypeScript**: Tipagem completa e autocomplete
- **Performance**: Memoização automática
- **Especialização**: Hooks específicos para diferentes funcionalidades

## 🔄 Fluxo de Dados

### **Inicialização:**
1. **App.tsx** → Envolve aplicação com `ProgressoProvider` e `DrawerProvider`
2. **ProgressoContext** → Carrega dados do localStorage
3. **DrawerContext** → Inicializa estado do menu lateral
4. **useCurso** → Combina dados estáticos + progresso dinâmico
5. **Layouts** → Aplicam estrutura global (Header, Footer, Drawer)
6. **Componentes** → Consomem dados via hooks

### **Atualização de Progresso:**
1. **Usuário** → Clica em "Continuar" ou "Concluir"
2. **Componente** → Chama função do Context (`concluirModulo`)
3. **Context** → Atualiza estado via reducer
4. **Persistência** → Salva automaticamente no localStorage
5. **SCORM** → Sincroniza com LMS automaticamente
6. **UI** → Re-renderiza com novos dados

## 🎨 Como Usar

### **1. Em Qualquer Componente:**
```typescript
import { useCurso } from '@/hooks/useCurso';
import { useProgresso } from '@/context/ProgressoContext';

function MeuComponente() {
  const curso = useCurso(); // Dados completos do curso
  const { concluirModulo, iniciarModulo } = useProgresso(); // Funções de controle
  
  return (
    <div>
      <h1>{curso.titulo}</h1>
      <p>Progresso: {curso.progressoGeral}%</p>
      <button onClick={() => concluirModulo(1)}>
        Concluir Módulo 1
      </button>
    </div>
  );
}
```

### **2. Alterar Dados do Curso:**
```json
// src/data/curso.json
{
  "titulo": "Assistente de Operações Logísticas",
  "categoria": "Logística",
  "cargaHoraria": "200 horas",
  "modulos": [
    {
      "id": 1,
      "titulo": "Fundamentos da Logística",
      "descricao": "Conceitos básicos e importância da logística nas empresas.",
      "duracao": "40 horas"
    }
  ]
}

// src/data/unidade1.json
{
  "titulo": "Fundamentos da Logística",
  "descricao": "Conceitos básicos e importância da logística nas empresas.",
  "aulas": [
    {
      "id": 1,
      "titulo": "Introdução à Logística",
      "descricao": "Conceitos fundamentais da logística empresarial."
    }
  ]
}
```

### **3. Adicionar Novos Módulos:**
```json
{
  "modulos": [
    // ... módulos existentes
    {
      "id": 5,
      "titulo": "Novo Módulo",
      "descricao": "Descrição do novo módulo",
      "duracao": "30 horas"
    }
  ]
}
```

## 🔧 Funcionalidades Avançadas

### **Persistência Automática:**
- **localStorage**: Salva progresso automaticamente
- **Recuperação**: Carrega dados na inicialização
- **Sincronização**: Mantém dados atualizados

### **Integração SCORM:**
- **Status do curso**: `completed` / `incomplete`
- **Score**: Progresso geral (0-100%)
- **Localização**: Módulo atual
- **Commit**: Salva mudanças no LMS

### **Controle de Estado:**
- **Módulos**: Status individual (concluído, em andamento, bloqueado)
- **Progresso**: Percentual de cada módulo
- **Sequência**: Desbloqueia próximo módulo automaticamente
- **Histórico**: Data de conclusão e tempo de estudo

## 🚀 Vantagens da Arquitetura

### **Manutenibilidade:**
- **Separação clara** entre dados estáticos e dinâmicos
- **Código limpo** e bem organizado
- **Fácil de estender** com novas funcionalidades

### **Performance:**
- **Carregamento otimizado** de dados
- **Re-renders mínimos** com memoização
- **Persistência eficiente** no localStorage

### **Escalabilidade:**
- **Adicionar módulos** sem alterar código
- **Novos tipos de progresso** facilmente implementáveis
- **Integração** com outros sistemas

### **Developer Experience:**
- **TypeScript** completo com autocomplete
- **Hooks customizados** para abstração
- **Context API** nativo do React

## 📝 Próximos Passos

1. **Personalizar dados** em `src/data/curso.json` e `src/data/unidade1.json`
2. **Adicionar funcionalidades** no Context se necessário
3. **Criar novos componentes** usando `useCurso()` e outros hooks
4. **Expandir layouts** em `src/layouts/` conforme necessário
5. **Implementar testes** para as funções do Context
6. **Adicionar validações** de dados se necessário
7. **Criar novas unidades** seguindo o padrão `unidade-X/`

## 🎓 Estrutura de Unidades

Para adicionar novas unidades:

```
src/pages/
└── unidade-2/               # Nova unidade
    ├── index.tsx           # Página da unidade
    └── aulas/              # Aulas da unidade
        ├── aula-1/         # Aula 1
        │   ├── index.tsx
        │   ├── components/
        │   ├── hooks/
        │   └── types/
        └── aula-2/         # Aula 2
            ├── index.tsx
            ├── components/
            ├── hooks/
            └── types/
```

Esta arquitetura oferece **flexibilidade**, **performance** e **manutenibilidade** para o sistema de curso SCORM! 🎉
