# Configuração do Curso

## 📁 Arquivos de Configuração

As informações do curso estão organizadas nos seguintes arquivos:

- `src/data/curso.json` - Informações gerais do curso
- `src/data/unidade1.json` - Conteúdo específico da primeira unidade

## 🎯 Como Alterar as Informações do Curso

### 1. **Informações Básicas** (`src/data/curso.json`)
```json
{
  "titulo": "Assistente de Operações Logísticas",
  "categoria": "Logística",
  "descricao": "Desenvolva competências para atuar na área de logística empresarial.",
  "cargaHoraria": "200 horas",
  "modalidade": "Qualificação",
  "instrutor": "Prof. Maria Silva",
  "progresso": 45,
  "modulos": [...]
}
```

### 2. **Adicionar/Editar Módulos** (`src/data/curso.json`)
```json
{
  "modulos": [
    {
      "id": 1,
      "titulo": "Fundamentos da Logística",
      "descricao": "Conceitos básicos e importância da logística nas empresas.",
      "status": "concluido",
      "duracao": "40 horas"
    },
    {
      "id": 2,
      "titulo": "Gestão de Estoque",
      "descricao": "Técnicas de controle e otimização de estoques.",
      "status": "em-andamento",
      "duracao": "50 horas"
    }
  ]
}
```

### 3. **Status dos Módulos**
- **`concluido`**: Módulo finalizado (ícone verde com check)
- **`em-andamento`**: Módulo atual (borda laranja, botão "Continuar")
- **`bloqueado`**: Módulo não disponível (ícone de cadeado, texto acinzentado)

## 🔄 Exemplo de Alteração

Para alterar o curso para "Assistente de Operações Logísticas":

```json
{
  "titulo": "Assistente de Operações Logísticas",
  "categoria": "Logística",
  "descricao": "Desenvolva competências para atuar na área de logística empresarial.",
  "cargaHoraria": "200 horas",
  "modalidade": "Qualificação",
  "instrutor": "Prof. Maria Silva",
  "progresso": 45,
  "modulos": [
    {
      "id": 1,
      "titulo": "Fundamentos da Logística",
      "descricao": "Conceitos básicos e importância da logística nas empresas.",
      "status": "concluido",
      "duracao": "40 horas"
    },
    {
      "id": 2,
      "titulo": "Gestão de Estoque",
      "descricao": "Técnicas de controle e otimização de estoques.",
      "status": "em-andamento",
      "duracao": "50 horas"
    }
  ]
}
```

## ✨ Vantagens

- **Centralizado**: Todas as informações em arquivos JSON organizados
- **Fácil manutenção**: Altere uma vez, atualiza em toda a aplicação
- **JSON simples**: Formato legível e fácil de editar
- **Reutilizável**: Pode ser usado em outras páginas/componentes
- **Flexível**: Fácil de adicionar novos campos ou módulos
- **Versionamento**: Mudanças são rastreáveis no Git

## 🎨 Personalização Visual

O layout se adapta automaticamente às configurações:
- **Progresso**: Barra de progresso reflete o valor configurado
- **Módulos**: Status e cores são aplicados automaticamente
- **Informações**: Título, descrição e dados são exibidos dinamicamente

## 📝 Próximos Passos

1. Edite os arquivos em `src/data/`:
   - `curso.json` para informações gerais
   - `unidade1.json` para conteúdo específico
2. Salve as alterações
3. A aplicação será atualizada automaticamente (HMR do Vite)
4. Para produção, execute `npm run build`
5. Para SCORM, execute `npm run package-scorm`