# Geração de curso por IA em segundo plano

## Contexto

Com o fix de `docs/specs/2026-09-16-course-generation-timeout.md` (medição, limites de
tempo e thinking limitado), a geração cabe no limite da função, mas continua síncrona:
o usuário espera cerca de 1 minuto numa tela de carregamento, e recarregar ou fechar a
aba durante a geração perde o resultado, porque o curso só é salvo quando a resposta
chega ao navegador.

Esta spec transforma a geração em um job em segundo plano: o usuário envia o documento,
volta para a lista e continua usando o app, e é avisado quando o curso fica pronto.

## Decisões

### Geração em uma chamada, sem dividir por unidades

Dividir o curso em chamadas por unidade foi descartado: cada chamada não vê o que as
outras geraram e há risco de conteúdo repetido. A versão sequencial (cada unidade
recebe o que já foi gerado) evita a repetição, mas não reduz o tempo total. Só volta a
ser discutida se um curso passar do `maxDuration` de 300 s.

### Job assíncrono

Segue o padrão da exportação SCORM (`/api/generate-scorm-v2`: job no banco + `after()`).
O `after()` roda na mesma execução da função e herda o `maxDuration = 300` da rota.

**Fluxo**

1. Na revisão do assistente, o rodapé avisa que a geração roda em segundo plano.
2. "Gerar curso" envia texto extraído e layout. A rota cria o curso e o job, agenda a
   geração com `after()` e responde `202` com `courseId` e `jobId`.
3. Enquanto a requisição está em andamento, o botão "Gerar curso" (e o "Voltar") fica
   desabilitado com spinner; a tela antiga de carregamento da criação não aparece.
   Com a resposta, o assistente mostra o banner "Gerando" e redireciona para `/courses`.
4. Ao terminar, a geração grava as unidades e os metadados no curso e marca o job como
   `COMPLETED` ou `FAILED`.

O `AbortController` do navegador em `src/app/(app)/courses/new/actions.ts` deixa de ser
necessário: a requisição só cria o job e responde na hora.

**Modelo de dados**

- O status de geração **não** usa `Course.status`, que é editorial e alimenta filtro,
  permissões de revisão e `STATUS_TRANSITIONS`.
- O curso é criado no envio, com status editorial `IN_PROGRESS`, título provisório igual
  ao nome do arquivo e `units` vazio.
- `Course.generationStatus` (`GENERATING` | `FAILED`, nulo quando concluído): campo
  próprio, separado do status editorial, que espelha o job. Existe para o bloqueio de
  permissões valer em todas as rotas que já carregam o curso, sem consultar o job em
  cada uma: `can()` (`src/lib/permissions.ts`) só permite `course:delete` enquanto ele não
  for nulo. Job e curso são atualizados na mesma transação.
- Nova tabela `CourseGenerationJob` (nomes de coluna em inglês com `@map` no mesmo padrão
  do schema):
  - `id`, `courseId` (cascade), `userId`
  - `status`: `GENERATING` | `COMPLETED` | `FAILED`
  - `sourceFileName`, `sourceText` — nome do arquivo para os avisos e texto extraído para
    "Tentar de novo" sem reenviar o arquivo
  - `layout`, `mode`
  - `error`, `model`, `promptTokens`, `completionTokens`
  - `startedAt`, `finishedAt`, `notifiedAt`
- Job travado: se a função for encerrada no limite, o job fica em `GENERATING` para
  sempre. Na leitura, job `GENERATING` com `startedAt` acima de `maxDuration` + margem é
  tratado e gravado como `FAILED` ("A geração excedeu o tempo limite").

**Lista de cursos**

- A linha de um curso com job `GENERATING` ou `FAILED` mostra o selo de geração na
  coluna Status, no lugar do selo editorial:
  - "Gerando…" (spinner, estilo `secondary`), com o nome do arquivo e a legenda "Gerando
    com IA · pode levar cerca de 1 minuto"; menu de ações desabilitado.
  - "Falhou" (estilo de `REJECTED`), com a mensagem de erro abaixo do título; menu só
    com "Tentar de novo" e "Excluir".
- Concluído, a linha volta ao normal com o selo "Novo".
- O filtro de Status **respeita o status editorial**: curso gerando ou com falha conta
  como "Em andamento".
- As permissões calculadas no servidor (`canEdit`, `canComment`, exportar, solicitar
  acesso) ficam falsas enquanto o job não estiver `COMPLETED`, e as rotas de curso
  recusam edição nesse estado. Não basta esconder o menu.
- A lista faz polling (`refetchInterval` em função) apenas enquanto houver curso gerando
  na página.

### Aviso global (banner)

Os avisos são um banner no topo da área de conteúdo, não toasts.

**Onde**

- Faixa na largura da **área de conteúdo**; a barra lateral não se move.
- Montado no shell de `src/components/AuthGuard.tsx`, para aparecer em **todas as
  páginas logadas**:
  - rotas com barra lateral: primeiro elemento dentro de `<main>`, antes de
    `{children}`, fixo no topo enquanto o conteúdo rola (`sticky top-16 lg:top-0`, abaixo da navbar
    móvel);
  - rotas sem barra lateral (`/edit`, que hoje retorna `children` direto): o mesmo banner
    fixo sobre a página (`fixed inset-x-0 top-0`), por cima da barra do editor.
- Continua dentro do `QueryProvider` (`src/app/(app)/layout.tsx`) e fora do pacote
  SCORM.

**Estados** (um banner por job; se houver mais de um, empilhados)

| Estado  | Tom                   | Texto                                                                                                      | Ação              |
| ------- | --------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------- |
| Gerando | informativo (spinner) | "Gerando o curso a partir de `<arquivo>`. Pode continuar usando o app, avisamos aqui quando ficar pronto." | —                 |
| Pronto  | sucesso               | "`<título>` está pronto."                                                                                  | "Abrir no editor" |
| Falhou  | erro                  | "Não foi possível gerar o curso a partir de `<arquivo>`: `<erro>`."                                        | "Tentar de novo"  |

Todos têm botão X para fechar.

**Comportamento**

- **Transição:** quando o job termina, o banner "Gerando" vira "Pronto" ou "Falhou" na
  mesma faixa. Fechar o "Gerando" **não impede** o aviso de conclusão de aparecer.
- **Fechar (X):** remove o banner da tela. O estado de fechado vive só na memória da
  página.
- **Recarregar:** some tudo que estava na tela.
  - "Gerando" **não** volta depois de recarregar. O selo "Gerando…" da lista continua
    mostrando o andamento.
  - "Pronto" e "Falhou" aparecem uma única vez, controlados por `notifiedAt`: o banner
    que já foi mostrado não volta ao recarregar; o de um job que terminou com a aba
    fechada aparece na primeira carga do app.
- **Origem de cada banner:**
  - "Gerando" vem do envio do assistente, guardado em estado da sessão (provider no
    shell), e não de consulta ao servidor, já que não deve reaparecer após recarregar.
  - "Pronto" e "Falhou" vêm da consulta aos jobs do usuário ainda não avisados: uma vez ao
    carregar o app e com polling (`refetchInterval` + `refetchIntervalInBackground:
false`) enquanto houver job `GENERATING`.
- **Marcação de `notifiedAt`:** update condicional (`notifiedAt IS NULL`). O banner de
  conclusão só aparece se a marcação afetou a linha, o que evita banner duplicado em
  duas abas ou dispositivos.
- Ao chegar um "Pronto" ou "Falhou", invalidar `queryKeys.courses.lists` para a linha da
  lista atualizar.

**Visual**

- Não há componente de alert em `src/components/ui`; criar
  `src/components/course/GenerationBanner.tsx`.
- Faixa com altura mínima de 64 px (`min-h-16`, `py-4`), texto `text-sm` que vira
  `text-base` a partir de `sm`, ícones de 20 px. Fundo sólido, sem transparência e sem
  sombra: a separação da página é só uma linha na base (`border-b`).
- Cores por estado, ajustadas na revisão visual para seguir os tons já usados no projeto:

  | Estado  | Fundo e texto                                                          | Linha                | Ação                                           |
  | ------- | ---------------------------------------------------------------------- | -------------------- | ---------------------------------------------- |
  | Gerando | `bg-secondary text-secondary-foreground` (item ativo da barra lateral) | `border-border`      | —                                              |
  | Pronto  | `bg-emerald-100 text-emerald-800` (selo "Aprovado")                    | `border-emerald-200` | "Abrir no editor": `bg-emerald-700 text-white` |
  | Falhou  | `bg-destructive text-destructive-foreground`                           | `border-red-600`     | "Tentar de novo": `bg-white text-destructive`  |

  No modo escuro, "Pronto" usa `bg-emerald-950 text-emerald-300` com linha
  `border-emerald-900`; os demais seguem os tokens do tema.

- `role="status"` para "Gerando" e "Pronto", `role="alert"` para "Falhou".

## Protótipo aprovado

Protótipo clicável do fluxo (lista, aviso em outra página, recarregar, fechar a aba e
falha): https://claude.ai/artifact/R2JBGXZrhCDYSgFuEcBMye

Depois da aprovação, os avisos mudaram de toast para o banner descrito acima. O
protótipo não foi atualizado com essa mudança.

## Escopo

- `prisma/schema.prisma` + migration — `CourseGenerationJob` e `Course.generationStatus`.
- `src/lib/ai-course-generator.ts` — prompt e chamadas ao Gemini/OpenAI, movidos da rota
  para serem reaproveitados pelo job.
- `src/lib/course-generation-jobs.ts` — criar, executar, tentar de novo, expirar job
  travado e marcar `notifiedAt`.
- `src/app/api/generate-course-from-text/route.ts` — cria curso e job, agenda a geração
  com `after()`.
- `src/app/api/course-generation-jobs/` — `GET` (ativos e não avisados),
  `[id]/notify` e `[id]/retry` (este com `maxDuration = 300`).
- `src/app/(app)/courses/new/actions.ts` e `page.tsx` — sem `AbortController`;
  redireciona para `/courses` e registra o banner "Gerando".
- `src/components/course/new/NewCourseWizard.tsx` — aviso no rodapé da revisão; a fase
  `criando` deixa de ser usada pela IA.
- `src/app/(app)/courses/actions.ts` e `src/app/api/courses/*` — job mais recente de cada
  curso na listagem; permissões e bloqueio de edição enquanto gera.
- `src/app/(app)/courses/page.tsx` — selos, legenda, menu reduzido, polling.
- `src/hooks/queries/` + `src/lib/query-keys.ts` — queries e mutations dos jobs de
  geração.
- `src/components/course/GenerationBanner.tsx` + provider do estado dos banners da
  sessão + `src/components/AuthGuard.tsx` (montagem nas rotas com e sem barra lateral).
- Testes:
  - rota de geração: job criado, sucesso, falha, job travado;
  - marcação condicional de `notifiedAt`;
  - banner: aparece ao enviar; vira "Pronto" mesmo depois de fechar o "Gerando"; X
    remove; não volta depois de recarregar; job concluído com a aba fechada mostra o
    banner uma única vez; aparece também na rota `/edit`;
  - lista: selos e menu reduzido;
  - assistente redirecionando;
  - fluxo completo em `e2e/courses.spec.ts`.

## Fora do escopo

- Geração dividida por unidades.
- Lista de modelos de fallback (`gemini-2.0-flash`, `gemini-1.5-flash-latest`
  descontinuados) e fallback para OpenAI.
- Notificação fora do app (e-mail, push).
