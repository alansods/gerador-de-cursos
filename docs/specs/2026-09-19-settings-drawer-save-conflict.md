# Salvar do painel "Sobre o curso" perde a ordem das unidades (409)

## Contexto

Ao clicar em **Salvar** no painel "Sobre o curso" (`CourseSettingsDrawer`), o editor faz duas
gravações seguidas em `src/app/(app)/courses/[id]/edit/page.tsx`:

1. `updateCourse(id, { title, description, … })`, que grava com a versão atual e sobe a
   versão do curso;
2. `reorderUnits(units)`, que chama `saveUnits` no `CourseEditorContext`.

`saveUnits` usa o `currentCourse` capturado quando a tela foi desenhada, ainda com a
**versão antiga**. O servidor recusa a segunda gravação com `409` (guarda de concorrência
do `PUT /api/courses`) e a nova ordem das unidades feita no painel se perde. Os dados do
curso da primeira gravação ficam salvos.

Foi achado durante a verificação da chave Tutor IA
(`docs/specs/2026-09-19-course-tutor-rag-block.md`); o fluxo já existia antes dela.

## Decisão

Uma gravação só: o Salvar manda os dados do curso **e** as unidades no mesmo
`updateCourse`. A montagem desse pacote fica numa função pura
(`courseSettingsUpdate` em `src/lib/course-settings.ts`) para ter teste de regressão sem
renderizar a página do editor inteira.

Não muda a guarda de concorrência do servidor nem o `CourseEditorContext`.

## Checklist

- [ ] **Uma gravação no Salvar**
  - Pronto quando: o `onSave` do painel faz um único `updateCourse` com dados e unidades;
    `reorderUnits` não é mais chamado ali; teste de `courseSettingsUpdate` cobre os campos e
    as unidades na ordem recebida.
- [ ] **Verificação**
  - Pronto quando: reordenar unidades e mudar o título no painel, salvar e recarregar mostra
    as duas mudanças, sem `PUT /api/courses 409` no log; `pnpm test` verde e `pnpm build`
    limpo.
