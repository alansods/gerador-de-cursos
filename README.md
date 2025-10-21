# 🎓 Gerador de Cursos

Um sistema completo para criação e exportação de cursos em formato SCORM, desenvolvido em React e TypeScript.

## ✨ Funcionalidades

- **Criação de Cursos**: Interface intuitiva para criar cursos com informações básicas
- **Editor de Conteúdo**: Adicione unidades e conteúdo com drag-and-drop
- **Preview em Tempo Real**: Visualize o curso antes de exportar
- **Exportação SCORM**: Gere pacotes SCORM completos e válidos
- **Interface Responsiva**: Design moderno e adaptável

## 🚀 Tecnologias

- **React 19** - Framework principal
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Vite** - Build tool
- **@dnd-kit** - Drag and drop
- **JSZip** - Geração de pacotes ZIP

## 📦 Instalação

```bash
# Instalar dependências
pnpm install

# Executar em desenvolvimento
pnpm dev

# Build para produção
pnpm build
```

## 🎯 Como Usar

1. **Criar Curso**: Clique em "Criar Novo Curso" e preencha as informações básicas
2. **Adicionar Conteúdo**: Crie unidades e adicione parágrafos e subtítulos
3. **Organizar**: Use drag-and-drop para reordenar o conteúdo
4. **Preview**: Visualize como ficará o curso final
5. **Exportar**: Gere o pacote SCORM para importar em LMS

## 📋 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
├── context/            # Context API para estado global
├── pages/              # Páginas da aplicação
│   ├── gerador-home/   # Lista de cursos
│   ├── gerador-novo/   # Criação de curso
│   └── gerador-editar/ # Editor de conteúdo
├── types/              # Definições TypeScript
└── utils/              # Funções utilitárias
```

## 🔧 Scripts Disponíveis

- `pnpm dev` - Servidor de desenvolvimento
- `pnpm build` - Build para produção
- `pnpm build:scorm` - Build otimizado para SCORM
- `pnpm preview` - Preview do build
- `pnpm lint` - Verificação de código

## 📄 Licença

Este projeto é privado e desenvolvido para uso interno.

---

**Desenvolvido com ❤️ para facilitar a criação de cursos online**