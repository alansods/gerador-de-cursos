# Salvar do painel "Sobre o curso" acusa conflito falso (409)

## Contexto

Ao clicar em **Salvar** no painel "Sobre o curso" (`CourseSettingsDrawer`), o editor faz duas
gravações seguidas em `src/app/(app)/courses/[id]/edit/page.tsx`:

1. `updateCourse(id, { title, description, … })`, que grava com a versão atual e sobe a
   versão do curso;
2. `reorderUnits(units)`, que chama `saveUnits` no `CourseEditorContext`.

`saveUnits` usa o `currentCourse` capturado quando a tela foi desenhada, ainda com a
**versão antiga**. O servidor recusa a segunda gravação com `409` (guarda de concorrência
do `PUT /api/courses`), e o `useUpdateCourseMutation` trata o 409 como edição concorrente:
mostra **"Este curso foi alterado por outra pessoa. Recarregamos a versão mais recente —
refaça sua última mudança."** a cada Salvar, embora a primeira gravação tenha dado certo.
O autor é levado a achar que perdeu o que fez.

A segunda gravação nem tem o que salvar: o painel **não reordena unidades**. O `localUnits`
do drawer só recebe as unidades atuais e nunca é alterado (não há controle de ordem no
painel), então `reorderUnits` reenviava as mesmas unidades.

Foi achado durante a verificação da chave Tutor IA
(`docs/specs/2026-09-19-course-tutor-rag-block.md`); o fluxo já existia antes dela.

## Decisão

Remover a chamada a `reorderUnits` do `onSave` do painel: o Salvar passa a fazer uma única
gravação. Não muda a guarda de concorrência do servidor, o `CourseEditorContext` nem a
assinatura do `CourseSettingsDrawer`.

Sem teste automatizado: o `onSave` é inline na página do editor (mais de 4.000 linhas) e a
mudança é a remoção de uma chamada. A verificação é manual, no app.

## Checklist

- [x] **Uma gravação no Salvar**
  - Pronto quando: o `onSave` do painel não chama mais `reorderUnits`; salvar título,
    descrição e layout pelo painel faz um único `PUT /api/courses`, responde 200, não mostra
    o aviso de conflito e, ao recarregar, as mudanças estão lá; `pnpm test` verde e
    `pnpm build` limpo.

## Verificação feita

Build de produção ligado a um branch descartável do Neon (cópia da produção), via
Playwright: abrir o painel de um curso, trocar o título e salvar gerou um único
`PUT /api/courses` com 200, sem o aviso de conflito, e o título novo continuou lá depois de
recarregar. Antes da correção o mesmo Salvar gerava dois `PUT`, o segundo com 409.
