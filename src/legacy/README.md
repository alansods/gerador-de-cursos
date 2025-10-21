# 🗂️ Arquivos Legacy

Esta pasta contém os arquivos do projeto SCORM original que foram mantidos para referência futura.

## 📁 Estrutura

- **Contextos**: ProgressoContext, SCORMProvider, DrawerContext
- **Páginas**: Home, Unidade1, Unidade2, Unidade3, TesteScorm
- **Layouts**: MainLayout
- **Dados**: curso.ts, modulo.json, unidade*.json

## 🔄 Como Reativar

Para reativar as funcionalidades antigas, descomente as importações no `App.tsx`:

```tsx
// Descomente estas linhas no App.tsx
import { ProgressoProvider } from "./context/ProgressoContext";
import { DrawerProvider } from "./context/DrawerContext";
import { SCORMProvider } from "./context/SCORMProvider";
import { MainLayout } from "./layouts";
import Home from "./pages/home/index";
// ... outras importações
```

## ⚠️ Nota

Os arquivos legacy foram mantidos intactos para preservar a funcionalidade original do projeto SCORM.
