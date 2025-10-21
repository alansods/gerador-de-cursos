# Unidade 1 - Assistente de Operações Logísticas

Esta unidade contém o conteúdo principal do curso de Assistente de Operações Logísticas, agora completamente componentizado para melhor escalabilidade e manutenibilidade.

## Estrutura

```
src/pages/unidade-1/
├── index.tsx                    # Componente principal (orquestrador)
├── components/                  # Componentes específicos da unidade
│   ├── index.ts                # Exportações centralizadas
│   ├── SidebarMenu.tsx         # Menu lateral de navegação
│   ├── AulaHeader.tsx          # Cabeçalho da aula (título e status)
│   ├── VideoSection.tsx        # Seção do player de vídeo
│   ├── AulaTabs.tsx            # Abas de conteúdo (sobre, objetivos, material)
│   └── NavigationButtons.tsx   # Botões de navegação e conclusão
├── hooks/                      # Hooks customizados
│   └── useAulaNavigation.ts    # Lógica de navegação entre aulas
├── types/                      # Tipos específicos da unidade
│   └── index.ts                # Definições de tipos
└── README.md                   # Esta documentação
```

## Componentes

### SidebarMenu
- **Responsabilidade**: Navegação lateral com lista de aulas
- **Props**: `unidade`, `aulaAtual`, `onAulaChange`, `onVoltar`, `getAulaStatus`
- **Funcionalidades**: 
  - Exibe progresso da unidade
  - Lista todas as aulas com status visual
  - Permite navegação entre aulas

### AulaHeader
- **Responsabilidade**: Cabeçalho da aula atual
- **Props**: `aula`, `getAulaStatus`
- **Funcionalidades**:
  - Exibe título da aula
  - Mostra status atual (concluída, em andamento, etc.)

### VideoSection
- **Responsabilidade**: Player de vídeo da aula
- **Props**: `aula`
- **Funcionalidades**:
  - Renderiza player apenas se houver vídeo
  - Integração com componente VideoPlayer

### AulaTabs
- **Responsabilidade**: Conteúdo das abas (sobre, objetivos, material)
- **Props**: `aula`
- **Funcionalidades**:
  - Aba "Sobre a aula": texto, imagens e componentes interativos
  - Aba "Objetivos": lista de objetivos da aula
  - Aba "Material complementar": materiais adicionais

### NavigationButtons
- **Responsabilidade**: Navegação entre aulas e conclusão
- **Props**: `aulaAtual`, `totalAulas`, `onAulaAnterior`, `onProximaAula`, `onMarcarConcluida`, `getAulaStatus`
- **Funcionalidades**:
  - Botão "Aula Anterior"
  - Botão "Marcar como concluída"
  - Botão "Próxima Aula"

## Hooks

### useAulaNavigation
- **Responsabilidade**: Gerenciar estado e lógica de navegação
- **Retorna**: `aulaAtual`, `proximaAula`, `aulaAnterior`, `handleMarcarConcluida`, `handleAulaChange`, `getAulaStatus`
- **Funcionalidades**:
  - Estado da aula atual
  - Lógica de navegação entre aulas
  - Gerenciamento de status das aulas

## Vantagens da Nova Estrutura

### 1. **Escalabilidade**
- Cada componente tem responsabilidade única
- Fácil adição de novos módulos seguindo o mesmo padrão
- Componentes reutilizáveis em outros contextos

### 2. **Manutenibilidade**
- Código organizado e modular
- Fácil localização de funcionalidades específicas
- Testes unitários mais simples

### 3. **Performance**
- Componentes menores com re-renderização otimizada
- Possibilidade de lazy loading de componentes
- Melhor tree-shaking

### 4. **Desenvolvimento**
- Desenvolvimento paralelo de componentes
- Debugging mais eficiente
- Código mais legível e documentado

## Componentes Interativos Suportados

### Box de Atenção
Exibe informações importantes com destaque visual.

### Box Sabia Que
Apresenta curiosidades e informações adicionais.

### Accordion
Organiza conteúdo em seções expansíveis.

### Flip Card
Cria cartões com frente e verso para memorização.

### Slideshow
Apresenta conteúdo em formato de slides.

### Modal
Exibe conteúdo em janelas modais.

## Uso

```tsx
import Modulo1 from './pages/modulo-1';

// O componente é renderizado automaticamente na rota /modulo-1
// Agora usa a nova estrutura componentizada
```

## Dependências

- React Router DOM para navegação
- Lucide React para ícones
- Componentes UI customizados
- Hook de progresso do módulo
- Hooks customizados para lógica de negócio

## Próximos Passos

1. **Testes**: Implementar testes unitários para cada componente
2. **Storybook**: Criar stories para documentação visual
3. **Otimizações**: Implementar lazy loading e memoização
4. **Acessibilidade**: Melhorar suporte a screen readers
5. **Responsividade**: Otimizar para diferentes tamanhos de tela