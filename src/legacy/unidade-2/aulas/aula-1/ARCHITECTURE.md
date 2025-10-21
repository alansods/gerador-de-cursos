# Arquitetura da Unidade 1

## Visão Geral

A unidade 1 foi refatorada seguindo princípios de arquitetura limpa e componentização, resultando em uma estrutura mais escalável e manutenível.

## Diagrama de Componentes

```
Unidade1 (index.tsx)
├── SidebarMenu
│   ├── Progresso da unidade
│   ├── Lista de aulas
│   └── Navegação lateral
├── AulaHeader
│   ├── Título da aula
│   └── Status visual
├── VideoSection
│   └── Player de vídeo
├── AulaTabs
│   ├── Aba "Sobre a aula"
│   │   ├── Texto da aula
│   │   ├── Imagens
│   │   └── Componentes interativos
│   ├── Aba "Objetivos"
│   │   └── Lista de objetivos
│   └── Aba "Material complementar"
│       └── Materiais adicionais
└── NavigationButtons
    ├── Botão "Aula Anterior"
    ├── Botão "Marcar como concluída"
    └── Botão "Próxima Aula"
```

## Fluxo de Dados

```
useAulaNavigation Hook
├── Estado: aulaAtual
├── Funções: proximaAula, aulaAnterior
├── Funções: handleMarcarConcluida, handleAulaChange
└── Funções: getAulaStatus

Componentes
├── Recebem props específicas
├── Chamam funções do hook via props
└── Renderizam UI baseada no estado
```

## Separação de Responsabilidades

### 1. **Unidade1 (index.tsx)**
- **Responsabilidade**: Orquestração e layout principal
- **Não faz**: Lógica de negócio, renderização de conteúdo específico
- **Faz**: Composição de componentes, layout responsivo

### 2. **SidebarMenu**
- **Responsabilidade**: Navegação e progresso
- **Não faz**: Conteúdo da aula, controles de vídeo
- **Faz**: Lista de aulas, progresso visual, navegação lateral

### 3. **AulaHeader**
- **Responsabilidade**: Informações da aula atual
- **Não faz**: Navegação, conteúdo detalhado
- **Faz**: Título, status, informações básicas

### 4. **VideoSection**
- **Responsabilidade**: Reprodução de vídeo
- **Não faz**: Navegação, conteúdo textual
- **Faz**: Player de vídeo, controles de mídia

### 5. **AulaTabs**
- **Responsabilidade**: Conteúdo organizado em abas
- **Não faz**: Navegação entre aulas, controles de vídeo
- **Faz**: Conteúdo textual, objetivos, materiais

### 6. **NavigationButtons**
- **Responsabilidade**: Controles de navegação
- **Não faz**: Conteúdo da aula, progresso visual
- **Faz**: Navegação anterior/próxima, conclusão de aula

### 7. **useAulaNavigation**
- **Responsabilidade**: Lógica de negócio e estado
- **Não faz**: Renderização, UI
- **Faz**: Gerenciamento de estado, lógica de navegação

## Vantagens da Arquitetura

### 1. **Single Responsibility Principle**
Cada componente tem uma única responsabilidade bem definida.

### 2. **Open/Closed Principle**
Fácil extensão sem modificação de código existente.

### 3. **Dependency Inversion**
Componentes dependem de abstrações (props) não de implementações.

### 4. **Composição sobre Herança**
Componentes são compostos, não herdados.

## Padrões Utilizados

### 1. **Container/Presentational**
- **Container**: Modulo1 (gerencia estado e lógica)
- **Presentational**: Todos os outros componentes (apenas renderização)

### 2. **Custom Hooks**
- Encapsula lógica complexa
- Reutilizável em outros contextos
- Testável independentemente

### 3. **Props Drilling Controlado**
- Props específicas para cada componente
- Não há props desnecessárias
- Interface clara entre componentes

### 4. **Separation of Concerns**
- UI separada da lógica
- Estado centralizado no hook
- Componentes focados em apresentação

## Benefícios para Escalabilidade

### 1. **Novos Módulos**
- Copiar estrutura de pastas
- Implementar componentes específicos
- Reutilizar hooks e tipos

### 2. **Novos Componentes**
- Adicionar na pasta components/
- Exportar no index.ts
- Usar no Modulo1

### 3. **Modificações**
- Mudanças isoladas por componente
- Sem impacto em outros componentes
- Testes unitários focados

### 4. **Performance**
- Re-renderização otimizada
- Lazy loading possível
- Memoização por componente

## Métricas de Qualidade

### 1. **Complexidade Ciclomática**
- Cada componente: baixa complexidade
- Funções pequenas e focadas
- Fácil de entender e manter

### 2. **Acoplamento**
- Baixo acoplamento entre componentes
- Dependências explícitas via props
- Fácil de testar isoladamente

### 3. **Coesão**
- Alta coesão dentro de cada componente
- Responsabilidades bem definidas
- Funcionalidades relacionadas agrupadas

### 4. **Reutilização**
- Componentes reutilizáveis
- Hooks reutilizáveis
- Tipos compartilhados

## Próximos Passos Arquiteturais

### 1. **Testes**
- Testes unitários para cada componente
- Testes de integração para fluxos
- Testes de acessibilidade

### 2. **Documentação**
- Storybook para componentes
- JSDoc para funções
- Diagramas de fluxo

### 3. **Otimizações**
- React.memo para componentes
- useMemo para cálculos pesados
- Lazy loading de componentes

### 4. **Monitoramento**
- Métricas de performance
- Logs de erro
- Analytics de uso
