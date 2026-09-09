# Padronização do espaçamento entre label e campo

## Contexto

A auditoria começou por um sintoma no drawer "Sobre o curso": a distância entre o
rótulo e o campo parecia mudar de um campo para outro. A investigação separou duas
causas independentes.

**1. O que se via no drawer não era espaçamento.** Os seis campos já usavam
`space-y-2` (8px). O que mudava era o anel de foco do `Input`, que usava o estilo
shadcn antigo — `focus-visible:ring-2` com `ring-offset-2`, ou seja, 4px de anel
projetados _para fora_ da borda, comendo metade do respiro do label no campo focado.
O `Textarea` já tinha migrado para o estilo novo (anel de 3px na própria borda,
sem offset), então os dois divergiam também no foco, não só no espaçamento.

**2. A inconsistência real estava no resto da aplicação.** Cerca de 125 campos com
cinco padrões convivendo: `space-y-2` (8px), `mb-2 block` (8px por margem),
`mb-1` (4px), `mb-3` (12px), `mt-1.5` (6px nas telas de auth) e `gap-1` (4px nos
filtros). Pior: 23 casos combinavam `mb-*` no label **dentro** de um wrapper
`space-y-*`, somando os dois e produzindo gaps de 20 a 28px. Além disso a maioria
dos `<label>` não tinha `htmlFor`, então não estava associada a campo nenhum —
clicar no rótulo não focava o input, e leitores de tela não o anunciavam.

A distância adotada como correta é a de 8px, que o autor apontou no campo
"Vídeo introdutório".

## Decisões

**Um componente, não uma varredura de classes.** Normalizar as classes resolveria o
sintoma e deixaria a porta aberta para a regressão. `FormField`
(`src/components/ui/form-field.tsx`) passa a ser o único lugar onde a distância
label↔campo é definida.

**O componente nasceu do `CampoComErro`**, que já existia em
`src/components/course/novo/` e já tinha o padrão certo (`useId`, render prop que
injeta `id`/`aria-invalid`/`aria-describedby`, `flex flex-col gap-2`). Ele foi
promovido a `ui/`, ganhou `opcional`, `descricao`, `compacto` e `htmlFor`, passou a
aceitar `ReactNode` como label e children simples além de render prop. O arquivo
antigo foi removido e seus cinco usos em `StepInformacoes.tsx` migrados.

**`htmlFor` só é emitido quando há alvo real.** Quando `children` é render prop, o
label aponta para o `id` gerado; quando é um nó simples sem `htmlFor` explícito, o
label sai sem `htmlFor` em vez de apontar para um id inexistente.

**Cabeçalho de grupo não é label.** Vários `<label>` rotulavam uma _lista_ com um
botão "Adicionar" ao lado (`flex items-center justify-between`), não um campo.
Esses viraram `<span>` — envolvê-los no componente quebraria o layout em linha, já
que `FormField` é `flex-col`.

## O que foi feito

### A. Anel de foco (`ui/input.tsx`, `ui/select.tsx`)

`Input` e `SelectTrigger` adotaram o estilo já usado pelo `Textarea`:
`focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50`,
sem `ring-offset`. Ganharam também o bloco `aria-invalid:*` — antes o
`aria-invalid` do campo "Vídeo introdutório" não produzia efeito visual nenhum.
`h-10`, `text-sm` e `bg-card` foram mantidos de propósito: mexer neles mudaria o
layout de todas as telas.

### B. `FormField` (`ui/form-field.tsx`)

Wrapper sempre `flex flex-col gap-2`. Erro, texto auxiliar e conteúdo extra são
irmãos dentro do mesmo gap. `compacto` reduz o label para `text-xs` mas **mantém os
8px** — era exatamente aí que nasciam os `mb-1`.

### C. Migração (~90 campos)

`CourseSettingsDrawer`, `ContentBlockDrawer` (incluindo os helpers locais
`CampoArquivo` e `EditorDeItens`, que sozinhos cobrem a maior parte dos campos de
bloco), `cursos/[id]/editar`, `usuarios`, `login`, `cadastro`, `cursos` (filtros) e
`ExportModal`.

Efeitos colaterais desejados: cores hardcoded `gray-700`/`gray-600` deram lugar a
`text-foreground`/`text-muted-foreground`, e os erros das telas de auth passaram
pelas props `erro`/`mostrarErro` em vez de `<p>` solto com `mt-1.5`.

Ficaram de fora, corretamente: os `<label>` que envolvem uma área de drop de arquivo
e os que rotulam checkbox/radio — nenhum dos dois é rótulo de campo acima de input.

### D. Regressão travada

`src/__tests__/components/label-field-spacing.test.ts` varre `src/app` e
`src/components` e falha se algum `<label>` voltar a declarar `mb-*` ou cor
`text-gray-*` junto de `font-medium`, e se o gap de 8px sair do componente.

## Verificação

`pnpm build` limpo, `pnpm test` verde (300 testes, 24 suítes). `pnpm test:e2e`
continua falhando por specs defasados, como antes da mudança.
