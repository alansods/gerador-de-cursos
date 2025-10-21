# 📁 Estrutura do Projeto Reorganizada

## 🏗️ Organização de Pastas

```
src/
├── components/                    # Componentes reutilizáveis
│   └── ui/                       # Componentes de UI (shadcn/ui)
│       ├── accordion.tsx
│       ├── alert.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── carousel.tsx
│       ├── dialog.tsx
│       ├── drawer.tsx
│       ├── flipcard.tsx
│       ├── info-box.tsx
│       ├── input.tsx
│       ├── progress.tsx
│       ├── sheet.tsx
│       ├── slideshow.tsx
│       ├── tabs.tsx
│       ├── tooltip.tsx
│       └── video-player.tsx
├── layouts/                      # Layouts da aplicação
│   ├── Drawer.tsx
│   ├── Footer.tsx
│   ├── Header.tsx
│   ├── index.ts
│   └── MainLayout.tsx
├── pages/                        # Páginas da aplicação
│   ├── home/                     # Página Home
│   │   ├── index.tsx            # Página principal (Home)
│   │   └── components/           # Componentes específicos da Home
│   │       ├── HeroSection.tsx
│   │       ├── ModuloCard.tsx
│   │       └── ModulosSection.tsx
│   ├── TesteScorm.tsx           # Página de teste SCORM
│   └── unidade-1/               # Unidade 1 do curso
│       ├── index.tsx            # Página da unidade
│       └── aulas/               # Aulas da unidade
│           ├── aula-1/          # Aula 1
│           │   ├── index.tsx
│           │   ├── components/
│           │   ├── hooks/
│           │   ├── types/
│           │   ├── ARCHITECTURE.md
│           │   └── README.md
│           ├── aula-2/          # Aula 2
│           │   ├── index.tsx
│           │   ├── components/
│           │   ├── hooks/
│           │   ├── types/
│           │   └── README.md
│           └── aula-3/          # Aula 3
│               ├── index.tsx
│               ├── components/
│               ├── hooks/
│               └── types/
├── context/                      # Context API
│   ├── DrawerContext.tsx
│   └── ProgressoContext.tsx
├── hooks/                        # Hooks customizados
│   ├── index.ts
│   ├── useContinuarCurso.ts
│   ├── useCurso.ts
│   ├── useModuloProgress.ts
│   └── useModuloStatus.ts
├── types/                        # Interfaces TypeScript
│   ├── curso.ts
│   └── modulo.ts
├── data/                         # Dados estáticos
│   ├── curso.json
│   └── unidade1.json
├── lib/                          # Utilitários
│   └── utils.ts
└── assets/                       # Assets (imagens, etc.)
    ├── senai-logo.svg
    └── senai-logo-white.svg
```

## 🎯 Princípios da Organização

### **1. Separação por Responsabilidade:**
- **`components/`**: Componentes reutilizáveis em toda a aplicação
- **`layouts/`**: Layouts e estruturas de página
- **`pages/`**: Páginas específicas da aplicação
- **`context/`**: Estado global da aplicação
- **`hooks/`**: Lógica reutilizável
- **`types/`**: Definições TypeScript
- **`data/`**: Dados estáticos
- **`lib/`**: Utilitários e funções auxiliares

### **2. Estrutura de Páginas:**
```
pages/
├── home/                    # Página Home
│   ├── index.tsx           # Ponto de entrada da página
│   └── components/         # Componentes específicos da Home
│       ├── HeroSection.tsx
│       ├── ModuloCard.tsx
│       └── ModulosSection.tsx
├── TesteScorm.tsx         # Página de teste SCORM
└── unidade-1/             # Unidade 1 do curso
    ├── index.tsx          # Página da unidade
    └── aulas/             # Aulas da unidade
        ├── aula-1/        # Aula 1
        ├── aula-2/        # Aula 2
        └── aula-3/        # Aula 3
```

### **3. Componentes Reutilizáveis:**
```
components/
└── ui/                     # Componentes de UI base (shadcn/ui)
    ├── accordion.tsx
    ├── alert.tsx
    ├── button.tsx
    ├── card.tsx
    ├── carousel.tsx
    ├── dialog.tsx
    ├── drawer.tsx
    ├── flipcard.tsx
    ├── info-box.tsx
    ├── input.tsx
    ├── progress.tsx
    ├── sheet.tsx
    ├── slideshow.tsx
    ├── tabs.tsx
    ├── tooltip.tsx
    └── video-player.tsx
```

### **4. Layouts da Aplicação:**
```
layouts/
├── Drawer.tsx              # Menu lateral
├── Footer.tsx              # Rodapé
├── Header.tsx              # Cabeçalho
├── index.ts                # Exports centralizados
└── MainLayout.tsx          # Layout principal
```

## ✅ Vantagens da Nova Estrutura

### **1. Organização Clara:**
- **Páginas isoladas**: Cada página tem seus próprios componentes
- **Layouts centralizados**: Estruturas reutilizáveis em `layouts/`
- **Componentes reutilizáveis**: Ficam na pasta `components/`
- **Separação lógica**: Fácil de encontrar e manter

### **2. Escalabilidade:**
- **Novas páginas**: Criar pasta em `pages/` com seus componentes
- **Novas unidades**: Seguir padrão `unidade-X/` com aulas
- **Componentes globais**: Adicionar em `components/`
- **Layouts globais**: Adicionar em `layouts/`
- **Lógica compartilhada**: Usar `hooks/` e `context/`

### **3. Manutenibilidade:**
- **Responsabilidades claras**: Cada pasta tem um propósito
- **Fácil navegação**: Estrutura intuitiva
- **Isolamento**: Mudanças em uma página não afetam outras

## 🚀 Como Adicionar Novas Páginas

### **1. Criar Nova Página:**
```bash
mkdir src/pages/nova-pagina
mkdir src/pages/nova-pagina/components
```

### **2. Estrutura da Página:**
```
pages/nova-pagina/
├── index.tsx              # Ponto de entrada
└── components/            # Componentes específicos
    ├── Header.tsx
    ├── Content.tsx
    └── Footer.tsx
```

### **3. Importar no App.tsx:**
```typescript
import NovaPagina from "./pages/nova-pagina";

// No JSX
<Route path="/nova-pagina" element={<NovaPagina />} />
```

## 🔄 Como Adicionar Componentes Reutilizáveis

### **1. Componente Global:**
```typescript
// src/components/Layout.tsx
export default function Layout({ children }) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
```

### **2. Usar em Qualquer Página:**
```typescript
import Layout from "@/components/Layout";

export default function MinhaPagina() {
  return (
    <Layout>
      <h1>Minha Página</h1>
    </Layout>
  );
}
```

## 📱 Exemplo de Uso

### **Página Home:**
```typescript
// src/pages/home/index.tsx
import HeroSection from "./components/HeroSection";
import ModulosSection from "./components/ModulosSection";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <ModulosSection />
    </div>
  );
}
```

### **Componente Específico:**
```typescript
// src/pages/home/components/HeroSection.tsx
import { useCurso } from "@/hooks/useCurso";

export default function HeroSection() {
  const curso = useCurso();
  // ... lógica específica da Home
}
```

### **Layout Global:**
```typescript
// src/layouts/MainLayout.tsx
import Header from "./Header";
import Footer from "./Footer";

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
```

## 🎯 Regras de Organização

### **1. Componentes em `components/`:**
- ✅ **Reutilizáveis** em múltiplas páginas
- ✅ **UI base** (botões, cards, inputs)
- ✅ **Utilitários** visuais

### **2. Layouts em `layouts/`:**
- ✅ **Estruturas** de página reutilizáveis
- ✅ **Header, Footer, Drawer** globais
- ✅ **Layout principal** da aplicação

### **3. Componentes em `pages/[pagina]/components/`:**
- ✅ **Específicos** de uma página
- ✅ **Lógica** particular da página
- ✅ **Não reutilizáveis** em outras páginas

### **4. Arquivo `index.tsx`:**
- ✅ **Ponto de entrada** da página
- ✅ **Composição** dos componentes
- ✅ **Lógica** de roteamento da página

## 📝 Próximos Passos

1. **Criar mais unidades** seguindo o padrão `unidade-X/`
2. **Adicionar componentes reutilizáveis** em `components/`
3. **Expandir layouts** em `layouts/` conforme necessário
4. **Implementar testes** para cada componente
5. **Adicionar documentação** para cada página/aula
6. **Criar storybook** para componentes reutilizáveis

## 🎓 Estrutura de Unidades

Para adicionar novas unidades, siga o padrão:

```
pages/
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

Esta estrutura garante **organização**, **escalabilidade** e **manutenibilidade** do projeto! 🎉
