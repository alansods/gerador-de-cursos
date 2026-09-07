# Plano — Redesign da página Novo Curso (wizard em 4 etapas)

**Escopo:** `/cursos/novo` (`src/app/cursos/novo/page.tsx`), o pipeline de geração por IA que
ela consome e a cobertura dos blocos de conteúdo.
**Referência visual aprovada:** https://claude.ai/code/artifact/64c5816e-0a94-47d3-98d3-4eefad56b304

---

## 1. Motivo

A página atual coloca todas as decisões e todos os campos na mesma tela, misturando três
sistemas de escolha visualmente diferentes (um `Tabs` para o método, cards para o layout,
botões coloridos para o modo da IA). Os problemas concretos:

| #   | Problema                                                                                                             | Onde está hoje                                 |
| --- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 1   | Método de criação escondido em `Tabs` pequeno, com peso visual menor que o seletor de layout                         | `page.tsx` ~392                                |
| 2   | Seletor de layout aparece **antes** de o usuário decidir como vai criar o curso                                      | `page.tsx` ~382                                |
| 3   | Dois CTAs concorrentes na aba IA ("Gerar Automaticamente" e "Gerar com Marcadores")                                  | `page.tsx` ~700+                               |
| 4   | `TokenMeter` expõe contagem de tokens — informação técnica que não ajuda a decidir nada                              | `TokenMeter.tsx`                               |
| 5   | O usuário precisa escolher o modo de leitura da IA sem ter como saber a resposta                                     | `handleGenerateWithAI(mode)`                   |
| 6   | Categoria e modalidade são texto livre, mas a listagem filtra por valores fixos → dados que nunca casam com o filtro | `page.tsx` ~470-510 vs `cursos/page.tsx:72-83` |
| 7   | Validação só no submit, com mensagem genérica e sem regras de formato                                                | `validate()`                                   |
| 8   | Arquivo único de 799 linhas concentrando UI, estado, fetch e validação                                               | `page.tsx`                                     |

Durante a investigação apareceram quatro problemas **fora da camada visual** que este trabalho
também precisa resolver, porque afetam diretamente o que o wizard promete ao usuário:

| #   | Achado                                                                                                                                             | Evidência                                                                     |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 9   | **A IA só sabe gerar 7 dos 11 tipos de bloco.** Ficam de fora `titulo`, `imagem`, `video` e `objetivos-aprendizagem`                               | `generate-course-from-text/route.ts:76-192` vs `types/gerador-curso.ts:33-44` |
| 10  | **Só 3 blocos têm marcador** (`accordion`, `quiz`, `flipcard`). Quem escreve o documento não tem como pedir os outros                              | `route.ts:193-213`                                                            |
| 11  | **A resposta da IA não é validada:** `JSON.parse(...) as CursoGerado` grava no banco o que vier, inclusive tipo inexistente ou quiz sem `quizData` | `route.ts:278` e `route.ts:373`                                               |
| 12  | **`/cursos/novo` não tem guard de permissão.** A página abre para qualquer um e só falha na API, depois de o usuário preencher tudo                | `permissions.ts:100-101`; nenhum guard em `page.tsx`                          |
| 13  | **`curso:criar` excluía o `CONVIDADO`, que já podia editar qualquer curso** — ele preenchia o formulário inteiro e só era barrado ao salvar        | `permissions.ts:101` vs `podeEditarCurso` (`permissions.ts:73`)               |

**Ganhos esperados:** uma decisão por vez, menos carga cognitiva, dados normalizados e
compatíveis com os filtros existentes, validação específica por campo, modo de leitura
resolvido automaticamente — e a geração por IA cobrindo **todos** os blocos que o editor oferece.

---

## 2. Descrição da solução

Wizard de 4 etapas dentro da área de conteúdo da página. **O drawer de navegação do app não
é alterado** — o redesign vive apenas dentro de `/cursos/novo`.

```
┌ Novo curso ─────────────────────────────────────────────────────┐
│ ① Método → ② Informações/Documento → ③ Layout → ④ Revisão      │  ← stepper horizontal
├─────────────────────────────────────────────────────────────────┤
│ Título da etapa + descrição                                     │
│ [ conteúdo da etapa ]                                           │
├─────────────────────────────────────────────────────────────────┤
│ Voltar                       aviso de validação      Continuar  │  ← rodapé do card
└─────────────────────────────────────────────────────────────────┘
```

**Etapa 1 — Método.** Dois cards grandes (Criação manual / Gerar por IA) com miniatura
ilustrada e dois bullets de quando usar cada um. Define o conteúdo da etapa 2.

**Etapa 2a — Informações (manual).** Título, Categoria (pílulas com a lista fixa),
Descrição (com contador), Carga horária (numérico com sufixo "horas") e Modalidade
(segmented control). Validação por campo no blur e no Continuar.

**Etapa 2b — Documento (IA).** Área de upload; enquanto não há arquivo, uma faixa azul
oferece **Baixar Exemplo**. Depois do upload: card do arquivo com opção Trocar e o progresso da
leitura. **Não há escolha de modo de leitura nem exibição da detecção de marcadores.**

**Etapa 3 — Layout.** Clássico e Sidebar com miniatura wireframe de cada um (em vez do ícone
genérico atual), nome e quando usar. Já vem com `classico` pré-selecionado — é um Continuar.

**Etapa 4 — Revisão.** Resumo em linhas (Método, Curso/Documento, Layout, Descrição) com
botão "Editar" que volta para a etapa correspondente. O CTA vira "Criar curso" / "Gerar curso".

**Estados finais.** Tela de progresso com spinner, barra e checklist de tarefas (rótulos
diferentes para manual e IA), seguida da tela de sucesso — que passa a mostrar **o que foi
gerado** ("6 unidades · 24 blocos · 5 quizzes, 3 accordions"), informação que hoje o usuário
só descobre abrindo o editor. Esse é o único ponto em que a contagem por tipo aparece: depois
de o curso existir, como resumo do resultado — não como detalhe do processo.

### Detecção automática de marcadores (substitui a escolha de modo)

- Ao extrair o texto, contamos **pares completos** de marcadores (`X_INICIO` … `X_FIM`).
- **≥ 1 par completo** → `mode: 'markers'`
- **0 pares** → `mode: 'auto'`
- A decisão é **invisível para o usuário**: nada de faixa de detecção nem contagem de marcadores
  na tela. Depois do upload, o card do arquivo mostra apenas "lendo o documento…" e, ao terminar,
  "pronto para gerar".

Exigir o par fechado evita cair em `markers` por uma palavra solta no texto.

### O que sai da página

`Tabs`, `TokenMeter` (e o arquivo `src/components/TokenMeter.tsx`, sem outros importadores),
o box informativo longo, o botão "Exemplo de Teste (IA Auto)" (perde sentido com a detecção
automática) e os dois botões de geração.

### O que continua igual

Contrato de dados (`CursoGerado`), `criarCurso` do contexto, as rotas `/api/extract-document`,
`/api/generate-course-from-text`, `/api/cursos` (que já registra a atividade `curso_criado`),
`/api/sample-document`, o registry de layouts e o drawer de navegação.

---

## 3. Cobertura completa dos blocos de conteúdo

O editor oferece **11 tipos de bloco**. No diagnóstico, a geração por IA cobria 7 e o modo com
marcadores cobria 3. A tabela abaixo registra esse ponto de partida e a ação de cada tipo —
todas concluídas nas Fases 1 e 2:

| Bloco                    | Editor | Prompt `auto` | Marcador | Ação                                                                                              |
| ------------------------ | :----: | :-----------: | :------: | ------------------------------------------------------------------------------------------------- |
| `titulo`                 |   ✅   |      ❌       |    ❌    | Incluir no prompt: só quando o documento tiver título de seção explícito                          |
| `subtitulo`              |   ✅   |      ✅       |    ❌    | Nenhuma                                                                                           |
| `paragrafo`              |   ✅   |      ✅       |    ❌    | Nenhuma                                                                                           |
| `lista`                  |   ✅   |      ✅       |    ❌    | Criar `LISTA_INICIO/FIM` (com `Tipo:` ordenada/nao-ordenada/check)                                |
| `objetivos-aprendizagem` |   ✅   |      ❌       |    ❌    | Incluir no prompt (gatilhos: "objetivos", "ao final você será capaz de") + `OBJETIVOS_INICIO/FIM` |
| `info-box`               |   ✅   |      ✅       |    ❌    | Criar `INFOBOX_INICIO/FIM` (com `Tipo:` atencao/saiba_mais/info/curiosidade)                      |
| `accordion`              |   ✅   |      ✅       |    ✅    | Nenhuma                                                                                           |
| `flipcard`               |   ✅   |      ✅       |    ✅    | Nenhuma                                                                                           |
| `quiz`                   |   ✅   |      ✅       |    ✅    | Nenhuma                                                                                           |
| `imagem`                 |   ✅   |      ❌       |    ❌    | Criar `IMAGEM_INICIO/FIM`; no `auto`, gerar **apenas** se houver URL de imagem no texto           |
| `video`                  |   ✅   |      ❌       |    ❌    | Criar `VIDEO_INICIO/FIM`; no `auto`, detectar URL de YouTube/Vimeo no texto                       |

**Regra de ouro para `imagem` e `video`:** a IA nunca inventa mídia. Sem URL no documento, o
bloco não é gerado — nada de placeholder quebrado dentro do curso.

> **Estado atual:** os 11 tipos estão no prompt `auto`, os 8 marcadores estão no prompt
> `markers`, e o teste `documento-exemplo.test.ts` falha se o exemplo deixar de demonstrar
> qualquer marcador.

### 3.1 Sintaxe dos novos marcadores

Mesma gramática dos existentes (bloco delimitado, campos `Rótulo: valor`), para o documento
continuar legível no Word:

```
OBJETIVOS_INICIO
Objetivo: Identificar os componentes de um CLP
Objetivo: Configurar entradas e saídas digitais
OBJETIVOS_FIM

INFOBOX_INICIO
Tipo: atencao
Título: Antes de energizar o painel
Conteúdo: Confirme o bloqueio da chave geral.
INFOBOX_FIM

LISTA_INICIO
Tipo: check
Item: Multímetro
Item: Chave de fenda isolada
LISTA_FIM

IMAGEM_INICIO
URL: https://exemplo.com/painel.png
Legenda: Painel de comando montado
Fonte: Acervo SENAI
Tamanho: media
IMAGEM_FIM

VIDEO_INICIO
URL: https://www.youtube.com/watch?v=xxxxxxxx
Título: Montagem passo a passo
VIDEO_FIM
```

Os três marcadores atuais permanecem inalterados — documentos antigos continuam funcionando.

### 3.2 Catálogo único de blocos (`src/lib/blocos.ts`)

Hoje a definição de cada bloco está espalhada por cinco arquivos (tipos, `BlockTypeSelector`,
`ContentBlockDrawer`, `UnidadeConteudo`, prompt da IA) — é por isso que o checklist do
`CLAUDE.md` para criar um bloco novo tem 13 passos. O plano cria um catálogo com o mínimo
necessário para o pipeline de IA:

```ts
export const CATALOGO_BLOCOS = {
  quiz: {
    marcador: 'QUIZ',
    geravelPorIA: true,
    camposObrigatorios: ['quizData'],
    validar: (b) =>
      b.quizData?.questions?.length > 0 &&
      b.quizData.questions.every(
        (q) => q.opcoes?.length === 5 && q.opcoes.filter((o) => o.isCorrect).length === 1
      ),
  },
  // … um registro por tipo
}
```

Serve ao prompt (gera a documentação dos tipos), à detecção de marcadores e ao normalizador
abaixo. A adoção pelo `BlockTypeSelector`/`ContentBlockDrawer` fica como trabalho futuro
(seção 10) para não inchar este PR.

### 3.3 Normalização da resposta da IA

`normalizarCursoGerado(json)` roda no servidor, antes de devolver o curso, e:

- descarta blocos com `tipo` fora do catálogo (hoje iriam direto para o banco);
- descarta blocos que não passam no `validar` do próprio tipo (quiz sem 5 opções, accordion sem
  itens, flipcard sem verso, lista sem `itensLista`, info-box com `tipoInfoBox` inválido,
  imagem/vídeo sem URL válida);
- preenche `id` e `ordem` ausentes e converte lista em HTML dentro de `conteudo` para `itensLista`;
- retorna, junto do curso, um resumo `{ unidades, blocos, porTipo, descartados }` — usado na
  tela de sucesso e no log do servidor.

---

## 4. Requisitos

### 4.1 Funcionais

- **RF1** — Navegação: Continuar avança se a etapa for válida; Voltar retorna; clicar numa
  etapa já concluída no stepper volta para ela. Etapas futuras não são clicáveis.
- **RF2** — Etapa 1 obrigatória: sem método escolhido não avança.
- **RF3** — Criação manual grava os mesmos campos de hoje (`titulo`, `categoria`, `descricao`,
  `cargaHoraria`, `modalidade`) mais `layout` e `unidades: []`.
- **RF4** — Carga horária é digitada como número e persistida como `"<n> horas"`, mantendo o
  formato que a listagem e a exportação já consomem.
- **RF5** — Categoria e Modalidade passam a ser escolha de uma lista fixa compartilhada com os
  filtros de `/cursos`.
- **RF6** — Upload aceita `.docx`/`.doc` até 10 MB, com as mensagens de tamanho já existentes
  (erro > 10 MB, aviso > 5 MB).
- **RF7** — A detecção de marcadores roda em segundo plano e define o `mode` enviado à API. Não
  existe seletor de modo nem exibição do resultado da detecção — o usuário só vê o progresso da
  leitura do arquivo.
- **RF8** — Etapa 4 mostra o resumo com atalho "Editar" por bloco.
- **RF9** — Durante a criação, a tela mostra progresso e etapa corrente; ao concluir, mostra o
  resumo do que foi gerado e redireciona para `/cursos` (mantendo o comportamento atual de ~1,5 s).
- **RF10** — Falha na extração ou na geração volta o wizard para a etapa 2 com a mensagem da API,
  sem perder o que já foi preenchido.
- **RF11** — A IA gera os 11 tipos de bloco conforme a seção 3, respeitando a regra de mídia.
- **RF12** — Todo curso gerado passa pela normalização antes de ser salvo.
- **RF13** — A página exige a permissão `curso:criar`, verificada no servidor antes de renderizar,
  em vez de deixar o usuário preencher tudo e falhar no final. `CONVIDADO` **pode** criar curso
  (coerente com o acesso de edição que já possui); `REVISOR` continua sem essa permissão.
- **RF14** — O rascunho do wizard sobrevive a um reload acidental (`sessionStorage`), e sair da
  página com dados preenchidos ou geração em andamento pede confirmação.

### 4.2 Validação por campo

| Campo         | Regras                               | Mensagem                                                                                                                                                 |
| ------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Título        | obrigatório; 5–120 caracteres        | "Informe o título do curso" / "O título deve ter pelo menos 5 caracteres" / "O título deve ter no máximo 120 caracteres"                                 |
| Categoria     | seleção obrigatória                  | "Selecione uma categoria"                                                                                                                                |
| Descrição     | obrigatória; 30–600 caracteres       | "Descreva o objetivo do curso" / "A descrição deve ter pelo menos 30 caracteres" / "A descrição excede o limite de 600 caracteres"                       |
| Carga horária | obrigatória; só dígitos; 1–999       | "Informe a carga horária" / "Use apenas números, sem letras ou símbolos" / "A carga horária deve ser maior que zero" / "Carga horária máxima: 999 horas" |
| Modalidade    | sempre definida (default `Online`)   | —                                                                                                                                                        |
| Documento     | obrigatório; `.docx`/`.doc`; ≤ 10 MB | "Envie um documento .docx ou .doc de até 10 MB" + mensagens de tamanho existentes                                                                        |

Comportamento: o erro aparece no **blur** do campo ou ao clicar em **Continuar**; some assim que
o valor fica válido. O botão Continuar permanece habilitado e aponta o que falta ("Corrija os
campos destacados para continuar") em vez de ficar cinza sem explicação. O contador da descrição
fica vermelho ao ultrapassar 600.

### 4.3 Não funcionais

- **RNF1 — Dark mode:** usar os tokens do tema (`bg-card`, `border-border`, `text-foreground`,
  `text-muted-foreground`, `bg-primary`, `bg-highlight`) em vez das cores hardcoded do mockup.
- **RNF2 — Responsivo:** em telas < 768 px o stepper vira compacto ("Etapa 2 de 4" + barra), os
  cards empilham e o rodapé do card fica fixo na base da viewport.
- **RNF3 — Acessibilidade:** cards de método e layout como `role="radiogroup"`/`radio` navegáveis
  por teclado; stepper como `<ol>` com `aria-current="step"`; inputs com `aria-invalid` e
  `aria-describedby`; foco movido para o primeiro campo inválido ao tentar avançar.
- **RNF4 — Tamanho de arquivo:** `page.tsx` deve terminar com menos de ~120 linhas.
- **RNF5 — Compatibilidade:** cursos existentes com `cargaHoraria`/`categoria` em formato livre
  continuam abrindo e editando normalmente; nada de migração de dados. Documentos com os três
  marcadores antigos continuam válidos.
- **RNF6 — Timeout:** o fetch de geração usa `AbortController` (55 s, abaixo do limite de 60 s do
  plano Pro citado no `CLAUDE.md`) e as rotas declaram `maxDuration`. Estouro vira mensagem
  específica ("O documento é grande demais para uma geração única — divida em partes"), não erro genérico.
- **RNF7 — i18n:** textos em pt-BR direto no componente, seguindo o estado atual da página.

---

## 5. Arquivos

```
src/
├─ app/cursos/novo/page.tsx                    ALTERADO  (799 → 155 linhas; monta o wizard)
├─ app/cursos/novo/layout.tsx                  NOVO  guard de `curso:criar` no servidor
├─ app/cursos/novo/acoes.ts                    NOVO  chamadas de API, timeout e download do exemplo
├─ app/api/extract-document/route.ts           ALTERADO  (devolve { text, marcadores })
├─ app/api/generate-course-from-text/route.ts  ALTERADO  (mode opcional, prompt com 11 tipos,
│                                                          novos marcadores, normalização, maxDuration)
├─ app/api/sample-document/route.ts            ALTERADO  (exemplo com TODOS os marcadores)
├─ app/cursos/page.tsx                          ALTERADO  (importa as constantes)
├─ lib/
│  ├─ permissions.ts                            ALTERADO  `curso:criar` inclui CONVIDADO
│  ├─ validacao-curso.ts                        NOVO  regras da seção 4.2, puras e testáveis
│  ├─ blocos.ts                                 NOVO  catálogo + normalizarCursoGerado()
│  ├─ marcadores.ts                             NOVO  detectarMarcadores(texto) → contagem por tipo
│  ├─ documento-exemplo.ts                      NOVO  texto do exemplo, fonte única do .docx
│  └─ constants.ts                              ALTERADO  CATEGORIAS_CURSO, MODALIDADES_CURSO
├─ components/course/novo/
│  ├─ NovoCursoWizard.tsx                       NOVO  casca: stepper + card + rodapé
│  ├─ StepIndicator.tsx                         NOVO
│  ├─ StepMetodo.tsx                            NOVO
│  ├─ StepInformacoes.tsx                       NOVO
│  ├─ StepDocumento.tsx                         NOVO
│  ├─ StepLayout.tsx                            NOVO
│  ├─ StepRevisao.tsx                           NOVO
│  ├─ CriandoCurso.tsx                          NOVO  progresso + checklist
│  ├─ CursoCriado.tsx                           NOVO  sucesso + resumo do que foi gerado
│  ├─ CampoComErro.tsx                          NOVO  label + controle + mensagem (aria-*)
│  ├─ useGrupoRadio.ts                          NOVO  roving tabindex + setas nos radiogroups
│  ├─ CardEscolha.tsx                           NOVO  card selecionável de método e layout
│  ├─ MiniaturaLayout.tsx                       NOVO  wireframe do layout, usado nos dois pontos
│  └─ useNovoCursoWizard.ts                     NOVO  estado, validação, fetches, rascunho
├─ components/course/LayoutSelector.tsx         ALTERADO  miniaturas wireframe
└─ components/TokenMeter.tsx                    REMOVIDO  (sem outros importadores)

public/roteiro/*.docx                           ÓRFÃOS  o exemplo passa a ser gerado pela rota
src/__tests__/lib/marcadores.test.ts            NOVO
src/__tests__/lib/blocos.test.ts                NOVO
src/__tests__/lib/documento-exemplo.test.ts     NOVO
src/__tests__/lib/validacao-curso.test.ts       NOVO
src/__tests__/components/useNovoCursoWizard.test.tsx  NOVO
src/__tests__/components/StepMetodo.test.tsx    NOVO  teclado e foco
src/__tests__/integration/novo-curso-page.test.tsx    NOVO  fluxo completo com fetch mockado
e2e/novo-curso.spec.ts                          NOVO
```

---

## 6. Checklist de etapas

### Fase 0 — Preparação

- [ ] Criar branch `feat/novo-curso-wizard` a partir de `main`
- [ ] Rodar `pnpm test` e `pnpm build` na base limpa para ter o baseline verde
- [ ] Confirmar que `TokenMeter` não tem outros importadores (`grep -rn "TokenMeter" src`)

### Fase 1 — Catálogo de blocos e normalização (base para a IA) ✅

- [x] Criar `src/lib/blocos.ts` com um registro por tipo (marcador, `geravelPorIA`, campos obrigatórios, `validar`)
- [x] Implementar `normalizarCursoGerado(json)` com as regras da seção 3.3, devolvendo o resumo
- [x] Testes de normalização com fixtures: tipo desconhecido, quiz com 4 opções, quiz com 2 corretas,
      accordion vazio, flipcard sem verso, lista em HTML, imagem sem URL
- [x] Teste que trava catálogo e `blockRegistry` na mesma lista de tipos
- [x] Aplicar a normalização no handler do POST (um ponto só, depois de Gemini/OpenAI)

### Fase 2 — Marcadores e prompt completos ✅

- [x] Criar `src/lib/marcadores.ts` com `detectarMarcadores(texto)` → `{ encontrados, total, porTipo, modo }`
      e `descreverMarcadores()`, contando pares `INICIO`/`FIM` de todos os tipos do catálogo
- [x] Estender o prompt `markers` com `OBJETIVOS`, `INFOBOX`, `LISTA`, `IMAGEM`, `VIDEO`
- [x] Estender o prompt `auto` com `titulo`, `objetivos-aprendizagem`, `imagem` e `video`,
      incluindo a regra "nunca inventar mídia"
- [x] `/api/extract-document`: incluir `marcadores` na resposta
- [x] `/api/generate-course-from-text`: derivar `mode` quando não vier no body (servidor como
      fonte de verdade; `mode` explícito continua aceito) e declarar `maxDuration = 60`
- [x] Documento de exemplo com todos os marcadores, gerado a partir de `lib/documento-exemplo.ts`,
      com teste que falha se algum marcador deixar de ser demonstrado
- [x] Ajuste mínimo na página atual: "Baixar Exemplo" aponta para a rota e o segundo botão sai
- [~] Gerar um curso a partir do novo exemplo e conferir os 11 tipos no preview —
  **movido para a Fase 8**, junto das demais validações manuais

### Fase 3 — Fundação do wizard ✅

- [x] Extrair `CATEGORIAS_CURSO`, `MODALIDADES_CURSO` e `MODALIDADE_PADRAO` para `src/lib/constants.ts`
- [x] Apontar os filtros de `src/app/cursos/page.tsx` para as constantes (mantendo os "Todas …")
- [x] Criar `useNovoCursoWizard.ts`: `etapa`, `metodo`, `layout`, campos, `arquivo`, `marcadores`,
      `fase` (`form | criando | concluido`), `progresso`, `resumo`, `tocados`, `enviado`
- [x] Implementar as validações da seção 4.2 em `src/lib/validacao-curso.ts` (funções puras)
- [x] Implementar `avancar()`, `voltar()`, `irPara(etapa)` conforme RF1
- [x] Persistir e restaurar o rascunho em `sessionStorage` + `beforeunload` (RF14)

### Fase 4 — Componentes de etapa ✅

- [x] `StepIndicator` (concluída/ativa/futura, clique só em concluídas, versão compacta mobile)
- [x] `CampoComErro` (label, controle, mensagem, `aria-invalid`, `aria-describedby`)
- [x] `CardEscolha` reutilizado pelas etapas de método e layout (`role="radio"`)
- [x] `StepMetodo` com os dois cards e miniaturas ilustradas
- [x] `StepInformacoes` (título, pílulas de categoria, descrição com contador, carga numérica, modalidade segmented)
- [x] `StepDocumento` (dropzone, faixa do exemplo antes do upload, card do arquivo com o progresso da leitura)
- [x] `StepLayout` + `MiniaturaLayout` reaproveitada no `LayoutSelector` do drawer de edição
- [x] `StepRevisao` com os atalhos "Editar"
- [x] `CriandoCurso` (spinner, barra, checklist por método) e `CursoCriado` (com o resumo do RF9)
- [x] `NovoCursoWizard` montando casca + rodapé (Voltar, aviso, CTA dinâmico)
- [x] Escrito já com os tokens do tema, adiantando parte do RNF1 previsto para a Fase 6

### Fase 5 — Integração da página ✅

- [x] Guard de `curso:criar` via `src/app/cursos/novo/layout.tsx` + `exigirPermissao`, no servidor
      (mesmo padrão de `/usuarios`), em vez de tela de acesso negado no cliente
- [x] `curso:criar` passa a incluir `CONVIDADO`, alinhando com o acesso de edição que ele já tinha
- [x] Reescrever `page.tsx` para montar `PageTransition` + header + `NovoCursoWizard` (799 → 155 linhas)
- [x] Fluxo manual → `criarCurso({ ...form, cargaHoraria: "<n> horas", layout, unidades: [] })`
- [x] Fluxo IA → extract (ao selecionar o arquivo) → generate → `criarCurso({ ...course, layout })`
- [x] Preservar tratamento de erro (mensagem da API, toast, retorno à etapa 2) e o timeout do RNF6
      (`AbortController` de 55 s com mensagem própria)
- [x] Redirecionamento para `/cursos` após a tela de sucesso
- [x] Remover `TokenMeter.tsx` e os estados de token
- [x] Corrigir o tipo de `criarCurso` para `Promise<string>` — já devolvia o id, mas estava como `void`
- [x] `pnpm build` verde

### Fase 6 — Tema, responsivo e acessibilidade ✅

- [x] Tokens do tema em toda a UI nova; cores fixas restantes (verde/âmbar de status) com par `dark:`
- [x] Stepper compacto + cards empilhados + rodapé `sticky` na base em < 768 px
- [x] `role="radiogroup"` com roving tabindex e setas/Home/End (`useGrupoRadio`) em método,
      layout, categoria e modalidade
- [x] Foco no primeiro campo inválido ao tentar avançar
- [x] Fluxo navegável por teclado, coberto por teste automatizado
- [~] Conferência visual em navegador real (light/dark, 375 px) — **Fase 8**

### Fase 7 — Testes ✅ (unitários e integração; e2e escrito, execução na Fase 8)

- [x] `src/__tests__/lib/marcadores.test.ts`: com pares, sem pares, marcador aberto sem fechar, tipos mistos, contagem
- [x] `src/__tests__/lib/blocos.test.ts`: fixtures da Fase 1 verdes
- [x] `src/__tests__/lib/documento-exemplo.test.ts`: exemplo cobre todos os marcadores
- [x] `src/__tests__/lib/validacao-curso.test.ts`: cada regra da tabela 4.2, incluindo os limites
- [x] `src/__tests__/components/useNovoCursoWizard.test.tsx`: navegação, validação por etapa e rascunho
- [x] `src/__tests__/components/StepMetodo.test.tsx`: radiogroup, setas, foco no primeiro erro
- [x] `src/__tests__/integration/novo-curso-page.test.tsx`: as 4 etapas, criação manual, detecção de
      marcadores, geração por IA com resumo e retorno à etapa 2 em caso de falha
- [x] `e2e/novo-curso.spec.ts` escrito: fluxo manual, validação, detecção no documento de exemplo,
      guard de permissão e rascunho após reload
- [x] `pnpm test` verde (180 testes)
- [ ] `pnpm test:e2e` — precisa de servidor, banco e credenciais (`E2E_EMAIL`/`E2E_SENHA`): **Fase 8**

### Fase 8 — Limpeza e verificação

- [ ] `pnpm lint` sem novos avisos e `pnpm build` verde
- [ ] Conferir `/cursos/[id]/editar` e o `CourseSettingsDrawer` com o `LayoutSelector` alterado
- [ ] Criar um curso manual e um por IA localmente e exportar SCORM de ambos
- [ ] Abrir o curso gerado pelo novo exemplo e validar os 11 blocos no preview e no pacote SCORM
      (precisa de `GEMINI_API_KEY` ou `OPENAI_API_KEY` no ambiente)
- [ ] Revisar o diff em busca de código morto (estados de token, handlers antigos)

---

## 7. Critérios de conclusão

1. As 4 etapas navegam nos dois sentidos e o stepper reflete o estado real.
2. Todas as regras da tabela 4.2 disparam a mensagem correta, no blur e no Continuar.
3. Documento com marcadores gera com `mode: 'markers'`; sem marcadores, com `mode: 'auto'` —
   verificável no payload, sem nenhuma escolha do usuário.
4. **Os 11 tipos de bloco são geráveis pela IA** e todos aparecem no curso criado a partir do
   documento de exemplo atualizado.
5. Resposta da IA com tipo inválido ou bloco incompleto é descartada pela normalização, e o
   descarte aparece no log do servidor.
6. Curso criado pelos dois métodos aparece em `/cursos`, abre no editor e exporta SCORM.
7. `cargaHoraria` gravada como `"<n> horas"`; `categoria` e `modalidade` batendo com os filtros.
8. `CONVIDADO` cria curso do início ao fim; `REVISOR` não abre o formulário.
9. Página correta em light e dark, utilizável em 375 px, navegável por teclado.
10. `pnpm test`, `pnpm test:e2e`, `pnpm lint` e `pnpm build` verdes.
11. `page.tsx` abaixo de ~120 linhas; `TokenMeter.tsx` removido.

---

## 8. Riscos e mitigação

| Risco                                                                      | Mitigação                                                                                                                                            |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Detecção classificar errado um documento                                   | Exigir par `INICIO`/`FIM` completo; a faixa mostra o resultado e a contagem antes de gerar                                                           |
| Prompt maior (11 tipos) piorar a qualidade da geração ou estourar contexto | Documentar os tipos de forma compacta a partir do catálogo; medir com o documento de exemplo antes e depois; manter o truncamento em 150k caracteres |
| Normalização descartar bloco válido por regra estrita demais               | Começar descartando só o que quebra o editor; logar cada descarte com o motivo para calibrar                                                         |
| Mudar `LayoutSelector` quebrar o `CourseSettingsDrawer`                    | Alterar só a apresentação, mantendo a interface `{ value, onChange }`; testar os dois pontos                                                         |
| Carga horária numérica quebrar cursos antigos                              | Só a escrita muda; a leitura continua tratando `cargaHoraria` como string                                                                            |
| Perda de comportamento ao desmontar as 799 linhas                          | Fases 1-2 são backend e independentes; o fluxo antigo segue funcionando até a troca na Fase 5                                                        |
| Wizard aumentar o número de cliques para quem cria muito curso             | Etapas 1 e 3 são de um clique, com default sensato; reavaliar depois com métrica de tempo até criar                                                  |

---

## 9. Fora de escopo

Drawer de navegação, editor de curso, exportação SCORM, tela de listagem (exceto a extração das
constantes), permissões/roles além do guard da página, e a migração da página para `next-intl`.

## 10. Trabalho futuro (registrado, não incluído)

- Decidir o destino de `public/roteiro/exemplo-curso.docx` e `exemplo-curso-pizza.docx`, que
  ficaram sem nenhum importador depois que o exemplo passou a ser gerado pela rota.

- Fazer `BlockTypeSelector`, `ContentBlockDrawer` e `UnidadeConteudo` consumirem o
  `CATALOGO_BLOCOS`, reduzindo o checklist de 13 passos do `CLAUDE.md` para um registro só.
- Migrar a página para `next-intl` (namespace `courses`).
- Geração em partes para documentos que estouram o limite de tempo de uma requisição.
- Métricas do funil: taxa de conclusão por etapa e tempo até criar o curso.
