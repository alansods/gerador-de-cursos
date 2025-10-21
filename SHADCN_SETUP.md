# Configuração do shadcn/ui

## ✅ Instalação Concluída

O shadcn/ui foi instalado e configurado com sucesso no projeto React/TypeScript com Vite.

## 📦 Dependências Instaladas

- **Tailwind CSS** - Framework CSS utilitário
- **class-variance-authority** - Para variantes de componentes
- **clsx** - Para combinação de classes CSS
- **tailwind-merge** - Para merge inteligente de classes Tailwind
- **lucide-react** - Ícones
- **@radix-ui/react-*** - Componentes primitivos acessíveis
- **Vite** - Build tool moderno com path mapping nativo

## 🗂️ Estrutura Criada

```
src/
├── components/
│   └── ui/
│       ├── button.tsx
│       ├── card.tsx
│       └── input.tsx
├── lib/
│   └── utils.ts
└── index.css (atualizado com variáveis CSS do shadcn/ui)
```

## ⚙️ Configurações

### 1. Tailwind CSS
- `tailwind.config.js` - Configuração com tema do shadcn/ui
- `postcss.config.js` - Configuração do PostCSS

### 2. TypeScript
- `tsconfig.json` - Path mapping configurado (`@/*` → `./src/*`)

### 3. Vite
- `vite.config.ts` - Configuração com path mapping nativo
- Scripts atualizados para usar `vite` em vez de `react-scripts`

## 🚀 Como Usar

### Importar Componentes
```tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
```

### Exemplo de Uso
```tsx
<Card>
  <CardHeader>
    <CardTitle>Título do Card</CardTitle>
  </CardHeader>
  <CardContent>
    <Input placeholder="Digite algo..." />
    <Button>Clique aqui</Button>
  </CardContent>
</Card>
```

## 🎨 Personalização

### Cores
As cores podem ser personalizadas no arquivo `src/index.css` através das variáveis CSS:

```css
:root {
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  /* ... outras variáveis */
}
```

### Tema Escuro
O tema escuro está configurado e pode ser ativado adicionando a classe `dark` ao elemento raiz.

## 📝 Comandos Disponíveis

- `npm run dev` ou `npm start` - Inicia o servidor de desenvolvimento (Vite)
- `npm run build` - Cria build de produção
- `npm run preview` - Preview do build de produção
- `npm test` - Executa testes (Vitest)
- `npm run package-scorm` - Empacota para SCORM

## 🔧 Adicionando Novos Componentes

Para adicionar novos componentes do shadcn/ui, você pode:

1. Usar o CLI (se disponível): `npx shadcn@latest add [component-name]`
2. Copiar manualmente do site oficial: https://ui.shadcn.com/docs/components
3. Criar componentes customizados seguindo os padrões existentes

## ✨ Funcionalidades Testadas

- ✅ Build de produção funcionando (Vite)
- ✅ Servidor de desenvolvimento funcionando (HMR super rápido)
- ✅ Path mapping (`@/`) funcionando nativamente
- ✅ Componentes shadcn/ui renderizando
- ✅ Integração com SCORM mantida
- ✅ Tailwind CSS funcionando
- ✅ TypeScript funcionando
- ✅ Vitest para testes funcionando

## 🚀 Vantagens do Vite

- **HMR instantâneo** - Mudanças refletem imediatamente
- **Build 3-5x mais rápido** que Create React App
- **Path mapping nativo** - Sem necessidade de CRACO
- **Bundle otimizado** - Menor tamanho e melhor performance

O projeto está pronto para desenvolvimento com shadcn/ui e Vite! 🎉
