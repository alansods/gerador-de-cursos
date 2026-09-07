# Plano — Novos Blocos de Conteúdo (referência: ScormStack)

## Contexto

O catálogo de blocos do [ScormStack](https://www.scormstack.io/en/features/blocks/)
foi levantado para comparar com o nosso. Eles oferecem cerca de 25 tipos de bloco;
temos **11**: `titulo`, `subtitulo`, `paragrafo`, `imagem`, `video`, `lista`,
`objetivos-aprendizagem`, `info-box`, `accordion`, `flipcard`, `quiz`.

Desse comparativo foram selecionados **9 blocos novos**, distribuídos em três fases
por esforço e por dependência técnica. Antes deles, uma fase de preparação (0-A) que
elimina a duplicação de metadados que hoje torna cada bloco novo caro, e uma limpeza
opcional (0-B) que remove o gerador SCORM de fallback.

**Andamento:** 0-A, Fase 1 e Fase 2 implementadas (commit `c1691ce6`); 0-B pendente
(prioridade baixa); Fase 3 pendente.

### Blocos selecionados

| Bloco                        | `tipo`              | Marcador        | Fase |
| ---------------------------- | ------------------- | --------------- | ---- |
| Separador                    | `separador`         | `SEPARADOR`     | 1    |
| Abas                         | `tabs`              | `TABS`          | 1    |
| Linha do tempo               | `linha-do-tempo`    | `TIMELINE`      | 1    |
| Carrossel / galeria          | `carrossel`         | `CARROSSEL`     | 1    |
| Áudio                        | `audio`             | `AUDIO`         | 2    |
| Visualizador de PDF          | `pdf`               | `PDF`           | 2    |
| Imagem interativa (hotspots) | `imagem-interativa` | `HOTSPOT`       | 3    |
| Associação (matching)        | `associacao`        | `ASSOCIACAO`    | 3    |
| Categorização                | `categorizacao`     | `CATEGORIZACAO` | 3    |

### Fora de escopo

Existem no ScormStack e foram deliberadamente descartados nesta rodada: bloco de
capa (slide intro), botão de navegação, flow passo a passo, lista de recursos para
download, código customizado (HTML/JS), web simulation, click-on-image, medidor de
sucesso, reações e múltipla resposta no quiz.

---

## Arquitetura atual

### Caminho de renderização

Existe um caminho único e correto:

```
CoursePlayer
  → src/components/course/layouts/{classico,sidebar}
    → src/components/UnidadeConteudo.tsx
      → src/components/course/blocks/BlockRenderer.tsx
        → blockRegistry (registry.ts)
```

O app Vite em `player/` importa os **mesmos** componentes via alias `@ → ../src`
(`player/vite.config.ts`). Consequência prática: **um bloco novo passa a funcionar
no preview e no pacote SCORM ao mesmo tempo**, sem código adicional.

### Pontos com exaustividade garantida pelo compilador

Apenas dois, ambos `Record<TipoBloco, …>`:

- `CATALOGO_BLOCOS` em `src/lib/blocos.ts`
- `blockRegistry` em `src/components/course/blocks/registry.ts`

Acrescentar um tipo ao union em `src/types/gerador-curso.ts` quebra o build nesses
dois arquivos até serem preenchidos. Todo o resto é manual e falha em silêncio.

### Duplicação de metadados

| Local                                          | O que duplica                                                                                                                                       |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ContentBlockDrawer.tsx` (~48-84)              | `getBlockTitle` + `getBlockIcon` — segunda cópia do rótulo                                                                                          |
| `ContentBlockDrawer.tsx` (~122-201)            | valores padrão do bloco em **3 cópias divergentes**: `useState` inicial, `useEffect` de reabertura e `handleCancel` (que reseta só 6 dos 24 campos) |
| `ContentBlockDrawer.tsx` (~206-319)            | `validateForm()` reimplementa `CATALOGO_BLOCOS[…].validar`, que não é usado ali                                                                     |
| `app/cursos/[id]/editar/page.tsx` (~1958-2198) | 11 cards JSX copiados, ~20 linhas cada — terceira cópia de rótulo, ícone e descrição                                                                |
| `app/cursos/[id]/editar/page.tsx` (~165-197)   | `conteudoTemp` redeclara o union à mão, **faltando `objetivos-aprendizagem`**                                                                       |

O sintoma já é visível na interface: o mesmo bloco aparece como "Flipcard" ou
"Flashcards", "Accordion" ou "Sanfona", dependendo da tela.

---

## Fase 0-A — Catálogo data-driven

**Status: implementada.** Pré-requisito das demais fases. Sem ela, cada bloco novo exige tocar nove arquivos
manualmente, e o modal de adicionar conteúdo saltaria de 250 para cerca de 700 linhas
de JSX copiado.

### Estender `MetaBloco`

Em `src/lib/blocos.ts`:

```ts
export interface MetaBloco {
  tipo: TipoBloco
  rotulo: string
  rotuloPlural: string
  marcador: string | null
  geravelPorIA: boolean
  exigeMidiaDoDocumento: boolean
  validar: (bloco: ConteudoUnidade) => boolean

  icone: LucideIcon
  descricao: string
  categoria: CategoriaBloco
  padroes: Partial<ConteudoUnidade>
  extrairMidias?: (bloco: ConteudoUnidade) => string[]
  mensagemInvalido: string
}

export type CategoriaBloco = 'texto' | 'midia' | 'interativo' | 'avaliativo'
```

`padroes` guarda os valores iniciais do formulário. `extrairMidias` é explicado na
seção de decisões transversais. `mensagemInvalido` é o texto do toast que hoje está
espalhado pelos 11 casos de `validateForm()`.

### Consumidores

**`src/components/ContentBlockDrawer.tsx`**

- Apagar `getBlockTitle` e `getBlockIcon`; ler `CATALOGO_BLOCOS[tipo].rotulo` e `.icone`.
- Criar um único helper `criarBlocoVazio(tipo): ConteudoUnidade` derivado de
  `padroes`, e usá-lo nos três pontos que hoje divergem.
- Substituir `validateForm()` por `CATALOGO_BLOCOS[tipo].validar(bloco)` mais o toast
  com `mensagemInvalido`.
- Remover os `console.log` de debug (~linhas 115 e 121).

**`src/app/cursos/[id]/editar/page.tsx`**

- Trocar os 11 cards JSX por um `.map()` sobre `TIPOS_BLOCO`, agrupado por
  `categoria`, com um subcomponente `BlockTypeCard`.
- Corrigir `conteudoTemp` para usar `TipoBloco` em vez do union redeclarado.
- Remover o `console.log('🎬 Clicou em Vídeo!')` (~linha 2025).

### Resultado

Cerca de 230 linhas a menos. A partir daí, um bloco novo custa: 1 entrada no
catálogo + 1 componente + 1 linha no registry + 1 `case` no formulário do drawer —
com o TypeScript cobrando os dois `Record`.

### Checklist real de um bloco novo (revisado após a Fase 1)

Cobrado pelo compilador:

- [ ] union em `src/types/gerador-curso.ts` (+ interface do item, se houver lista)
- [ ] entrada em `CATALOGO_BLOCOS` (`src/lib/blocos.ts`)
- [ ] componente em `src/components/course/blocks/` + linha em `registry.ts`

Sem rede — esquecer não quebra o build:

- [ ] reexport em `blocks/index.ts`
- [ ] `case` no `renderForm()` do `ContentBlockDrawer.tsx`
- [ ] `corrigirBloco()` e `motivoInvalido()` em `blocos.ts`
- [ ] marcadores: `documento-exemplo.ts` (coberto por teste) e as **três** seções do
      prompt em `generate-course-from-text/route.ts` (não coberto)
- [ ] `extrairMidias` no catálogo, se o bloco tiver mídia (ver decisão 1)
- [ ] testes em `blocos.test.ts` e `content-block-drawer.test.tsx`

---

## Fase 0-B — Remover o fallback SCORM degradado

Prioridade baixa, independente das demais. Não corrige nada quebrado — é remoção de
código morto que só pode produzir um pacote pior que o principal.

### Hipótese levantada e descartada

Durante o planejamento suspeitou-se que `player/dist/` não estivesse sendo empacotado
na serverless function da Vercel. O raciocínio era: `generateSCORMFromPlayerDist`
(`src/lib/scorm-service.ts`) lê o diretório em runtime via
`path.join(process.cwd(), 'player', 'dist')`, o file tracing do Next.js não costuma
enxergar leitura dinâmica de arquivo, e o `outputFileTracingIncludes` foi removido do
`next.config.ts` no commit `41e201cf`. Se a hipótese valesse, todo export cairia no
fallback e entregaria curso degradado marcado como `completed`.

**A verificação refutou a hipótese.** Rodando `pnpm build` e inspecionando o arquivo
de tracing da rota:

```bash
python3 -c "
import json
d = json.load(open('.next/server/app/api/generate-scorm-v2/route.js.nft.json'))
print([x for x in d['files'] if 'player' in x])
"
# ['../../../../../player/dist/assets/index-*.css',
#  '../../../../../player/dist/assets/index-*.js',
#  '../../../../../player/dist/index.html']
```

Os três arquivos do player estão no tracing. O `node-file-trace` resolveu o
`path.join` sozinho. Portanto **`outputFileTracingIncludes` não é necessário** e não
deve ser reintroduzido — a exportação SCORM em produção usa o player Vite, como
esperado.

Fica registrado como verificação de regressão: se algum dia o caminho de leitura do
`player/dist` mudar (variável, `import.meta`, path calculado), o tracing pode deixar
de resolver. O comando acima é o teste.

### O que ainda faz sentido remover

O fallback continua sendo um problema de manutenção, ainda que não esteja ativo:

- `generateSCORMPackage`, `generateIndexHtml` e `renderConteudo` somam cerca de 600
  linhas de HTML por template string, com um segundo renderizador de blocos
  desatualizado. `lista`, `info-box` e `objetivos-aprendizagem` caem no `default:` e
  imprimem `(Conteúdo do tipo 'X' não renderizado no SCORM)`; `accordion`, `flipcard`
  e `quiz` viram caixas estáticas.
- Cada bloco novo teoricamente precisaria de uma versão degradada ali. Esta spec já
  decide que **não** terá — o que deixa o fallback ainda mais defasado a cada bloco.
- O `catch` em `src/app/api/generate-scorm-v2/route.ts` marca o job como `completed`
  mesmo tendo caído no caminho degradado. Se um dia o tracing falhar, o sintoma será
  silencioso.

Mudanças propostas:

1. Apagar `generateSCORMPackage`, `generateIndexHtml` e `renderConteudo` de
   `src/lib/scorm-service.ts`.
2. Remover o `try/catch` de fallback da rota; deixar o erro propagar.
3. Marcar o `SCORMJob` como **`failed`** com mensagem clara se `player/dist/` faltar,
   em vez de entregar pacote degradado como sucesso.

O ganho principal é o item 3: transformar uma falha silenciosa numa falha visível.

---

## Fase 1 — Blocos sem dependência nova

**Status: implementada.** Nenhum deles exigiu upload novo. As decisões abaixo divergem
do plano original e valem para as fases seguintes.

### Decisões tomadas durante a implementação

**Abas rolam na horizontal; não degradam para acordeão.** O plano previa renderizar um
acordeão em telas estreitas. Isso duplicaria o conteúdo no DOM, dobrando cada
`dangerouslySetInnerHTML` e confundindo leitores de tela. A lista de abas ficou com
`overflow-x-auto`. Verificado em 485px: as três abas cabem sem corte.

**`EditorDeItens` genérico no drawer.** Abas, linha do tempo e carrossel usam um único
componente que recebe a lista de campos (`{ chave, rotulo, obrigatorio, multilinha,
placeholder }`) em vez de repetir o formulário do accordion três vezes. Blocos futuros
com lista de itens devem usá-lo.

**`radix-ui` para as abas.** O pacote unificado já era dependência e traz navegação por
setas e roving tabindex. Nada foi instalado. `@radix-ui/react-tabs` **não** está no
projeto — use `import { Tabs } from 'radix-ui'`.

**Carrossel aceita URL colada, sem upload por item.** Upload múltiplo depende da
generalização de `/api/upload-file` da Fase 2. Antecipar pela metade criaria retrabalho.

**Duas validações distintas, não uma.** O plano dizia trocar o `validateForm()` do
drawer por `CATALOGO_BLOCOS[...].validar`. Estava errado: `validar` é **leniente** de
propósito (aceita accordion se _algum_ item estiver completo, imagem sem legenda) porque
filtra bloco vindo da IA; o formulário é **estrito**. Fundir afrouxaria a validação do
editor. Ficaram os dois campos: `validar` e `validarFormulario`.

**Padrões são fábricas, não objetos.** `padroes: () => ({ ... })` e `baseBloco()`
retornam estruturas novas a cada chamada. Com objeto literal compartilhado, todos os
blocos criados apontavam para o **mesmo** array `items`/`itensLista` — adicionar um item
num accordion o faria aparecer no accordion seguinte. Um teste pegou isso; ele continua
no repositório (`devolve coleções novas a cada chamada`).

### `separador`

Bloco puramente visual, sem conteúdo textual.

```ts
estiloSeparador?: 'linha' | 'espaco' | 'linha-icone'
iconeSeparador?: string
```

- Catálogo: `geravelPorIA: false` (para não poluir a saída da IA), `marcador: 'SEPARADOR'`
  (ainda reconhecido no `.docx`), `validar: () => true`.
- Componente: `SeparadorBlock.tsx`.
- Drawer: apenas o seletor de estilo.

### `tabs`

Irmão horizontal do `accordion`; mesma forma de dados.

```ts
export interface TabItem {
  id: string
  titulo: string
  conteudo: string
}
// em ConteudoUnidade
itensTabs?: TabItem[]
```

- `validar: (b) => !!b.itensTabs?.some((i) => temTexto(i.titulo) && temTexto(i.conteudo))`
- Componente: `TabsBlock.tsx`, sobre o `src/components/ui/tabs.tsx` já existente (Radix).
- Drawer: reaproveitar os handlers de lista de itens do `accordion`.
- Em telas estreitas, degradar para acordeão empilhado — abas horizontais não cabem no
  iframe de LMS em celular.

### `linha-do-tempo`

```ts
export interface TimelineItem {
  id: string
  data: string
  titulo: string
  descricao: string
  imagem?: string
}
// em ConteudoUnidade
itensTimeline?: TimelineItem[]
orientacaoTimeline?: 'vertical' | 'horizontal'
```

- `validar`: ao menos um item com `titulo` preenchido.
- Componente: `LinhaDoTempoBlock.tsx`.
- `extrairMidias`: as URLs de `imagem` dos itens.

### `carrossel`

```ts
export interface CarrosselItem {
  id: string
  url: string
  legenda?: string
  fonte?: string
}
// em ConteudoUnidade
itensCarrossel?: CarrosselItem[]
modoCarrossel?: 'carrossel' | 'grade'
```

- `exigeMidiaDoDocumento: true`, `validar`: ao menos um item com `url` válida.
- Componente: `CarrosselBlock.tsx`.
- Drawer: reaproveitar `handleUploadImage` do bloco `imagem`, em laço.
- `extrairMidias`: as URLs de todos os itens.
- Navegação por teclado (setas) e `aria-live` ao trocar de slide.

---

## Fase 2 — Blocos que exigem upload de arquivo novo

**Status: implementada.**

### Decisões tomadas durante a implementação

**O upload foi reescrito, não estendido.** A restrição de 4,5 MB confirmou-se pela
documentação do `@vercel/blob`, e o `MAX_SIZE_BYTES = 10 MB` da rota antiga era
inalcançável em produção. Os três pontos de upload de imagem foram migrados junto —
estavam todos no caminho quebrado. A prop `onUploadImage` do `ContentBlockDrawer` e a
função que a alimentava saíram, já que o drawer agora chama `enviarArquivo` direto.

**Autenticação assimétrica na rota, de propósito.** A confirmação do upload é uma
chamada servidor-a-servidor do Vercel Blob, **sem** o cookie do usuário. Aplicar
`requireAuth` nela faria todo upload falhar. Só o pedido de token exige autenticação
(`body.type !== 'blob.upload-completed'`); a autenticidade da confirmação vem da
assinatura que o `handleUpload` verifica. Não remova essa condicional.

**`handleUpload` vem de `@vercel/blob/client`,** não de `@vercel/blob` — o pacote v2
exporta ambos os lados do fluxo pelo subcaminho `/client`, inclusive o que roda no
servidor.

**`video` não declara `extrairMidias`, de propósito.** YouTube e Vimeo são páginas de
streaming, não arquivos para embutir. O teste que exige extrator para todo bloco com
`exigeMidiaDoDocumento` carrega essa exceção nomeada — é o único caso, e novos blocos
de mídia não devem entrar nessa lista sem motivo equivalente.

**Pendência conhecida:** a pasta dentro do ZIP continua se chamando `images/`, e a
temporária local `public/scorm-images/`, embora agora contenham também áudio e PDF. O
prefixo dos arquivos passou a ser `midia-`, e a função virou `detectMediaUrls`, mas
renomear as pastas mexe em cinco pontos de `scorm-service.ts` e `scorm-build-service.ts`
sem nenhum teste cobrindo a geração do ZIP. Fica para quando houver esse teste.

### Generalizar o upload

`src/app/api/upload-image/route.ts` aceita apenas `image/*` e limita a 10 MB.
Substituir por `/api/upload-file`, mantendo `requireAuth`, com a política de mídias
definida na seção "Política de mídias" abaixo.

Manter `/api/upload-image` como alias temporário para não quebrar o que já chama.

**Restrição de plataforma que muda a implementação.** A documentação do
`@vercel/blob` é explícita: upload via servidor é limitado pelo tamanho do corpo da
requisição, e em sites hospedados na Vercel esse teto é de **4,5 MB**. O
`MAX_SIZE_BYTES = 10 MB` atual é, portanto, inalcançável em produção — uma imagem
de 6 MB passa na validação do browser e é rejeitada com 413 pela plataforma antes
de chegar no handler. Local funciona, Vercel não; é o mesmo padrão do bug da Fase 0-B.

Decisão: arquivos acima de 4 MB **não** podem passar pela rota. Usar **client upload**
do `@vercel/blob` — o browser envia direto para o Blob e a rota só emite um token
assinado:

```ts
// src/app/api/upload-file/route.ts
import { handleUpload } from '@vercel/blob/client'

export async function POST(request: Request) {
  // requireAuth antes de qualquer coisa
  return NextResponse.json(
    await handleUpload({
      request,
      body: await request.json(),
      onBeforeGenerateToken: async (pathname, clientPayload) => ({
        allowedContentTypes: TIPOS_PERMITIDOS[categoria],
        maximumSizeInBytes: LIMITE_RIGIDO[categoria],
      }),
    })
  )
}
```

`allowedContentTypes` e `maximumSizeInBytes` ficam embutidos no token, ou seja, são
aplicados **pelo Blob**, não pelo cliente — a validação no browser vira só
conveniência de UX, não a barreira de segurança.

### Política de mídias

Cada limite tem duas camadas: o **limite rígido**, recusado no token do Blob, e o
**tamanho recomendado**, apenas um aviso no editor. Os rígidos são generosos para
não travar caso legítimo; os recomendados é que mantêm o pacote SCORM utilizável.

| Categoria      | Formatos aceitos  | Limite rígido | Recomendado                      |
| -------------- | ----------------- | ------------- | -------------------------------- |
| Imagem         | JPEG, PNG, WebP   | 8 MB          | ≤ 500 KB, largura ≤ 1920 px      |
| Imagem animada | GIF               | 8 MB          | ≤ 2 MB — preferir vídeo          |
| Áudio          | MP3, M4A/AAC, OGG | 25 MB         | ≤ 10 MB (~15 min a 96 kbps mono) |
| Documento      | PDF               | 20 MB         | ≤ 5 MB                           |
| Vídeo          | —                 | —             | sem upload, ver abaixo           |

MIME types correspondentes:

```ts
const TIPOS_PERMITIDOS = {
  imagem: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  audio: ['audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/ogg'],
  documento: ['application/pdf'],
}
```

#### Formatos deliberadamente excluídos

**SVG — remover da allowlist atual.** Hoje `image/svg+xml` é aceito
(`upload-image/route.ts`). Um SVG pode conter `<script>`, e dentro do pacote SCORM
ele é servido na mesma origem do player, no iframe do LMS: o script executa com
acesso ao DOM do curso e à API SCORM. Como o upload é feito por usuários com papéis
diversos, isso é um vetor de XSS real. Retirar; quem precisa de vetorial exporta PNG.
Se houver demanda concreta, reavaliar com sanitização por DOMPurify no upload.

**WAV — não aceitar.** É áudio não comprimido: cerca de 10 MB por minuto. Dez minutos
de narração passam de 100 MB e estouram sozinhos o teto de qualquer LMS. MP3 ou M4A
entregam o mesmo para voz com uma fração do tamanho.

**Vídeo — sem upload, apenas URL.** O bloco `video` continua aceitando só YouTube,
Vimeo ou URL direta. Embutir vídeo no ZIP é inviável: alguns minutos em qualidade
razoável já passam de 100 MB, e o pacote precisa ser baixado inteiro pelo aluno antes
da primeira aula abrir. Vídeo é o caso em que o streaming externo é a resposta certa.

#### Orçamento de peso do pacote

Como toda mídia é embutida no ZIP, o peso é cumulativo. O editor deve exibir o total
estimado e sinalizar:

| Faixa     | Sinal    | Significado                      |
| --------- | -------- | -------------------------------- |
| < 50 MB   | verde    | seguro em qualquer LMS           |
| 50–100 MB | amarelo  | alguns LMS recusam; upload lento |
| > 100 MB  | vermelho | recusa provável; revisar mídias  |

O cálculo reaproveita `extrairMidias` do catálogo: percorrer os blocos, somar o
`Content-Length` de cada mídia. Cachear por URL para não refazer requisição a cada
render.

#### Compressão no upload de imagem

Antes de enviar, reduzir a imagem no browser (canvas) para largura máxima de 1920 px
e reencodar em WebP com qualidade 82. Uma foto de celular de 4 MB costuma cair para
menos de 300 KB sem perda perceptível na tela. É a medida de maior impacto sobre o
peso final do pacote e evita que o autor precise se preocupar com isso.

### `audio`

```ts
audioUrl?: string
audioTitulo?: string
transcricao?: string
```

- `exigeMidiaDoDocumento: true`, `validar: (b) => ehUrl(b.audioUrl)`.
- Componente: `AudioBlock.tsx` — play/pause, seek, controle de velocidade e
  transcrição em `<details>` colapsável.
- **Nunca usar autoplay:** navegadores bloqueiam áudio automático em iframe sem
  interação prévia, e o SCORM roda dentro de um iframe do LMS.

### `pdf`

```ts
pdfUrl?: string
pdfTitulo?: string
permitirDownloadPdf?: boolean
```

- `exigeMidiaDoDocumento: true`, `validar: (b) => ehUrl(b.pdfUrl)`.
- Componente: `PdfBlock.tsx` usando `<iframe>` com o visualizador nativo do
  navegador — evita adicionar `pdf.js` ao bundle do player.
- Fallback visível com link de download quando o iframe é bloqueado pelo LMS.

---

## Fase 3 — Blocos interativos e avaliativos

### `imagem-interativa`

```ts
export interface HotspotItem {
  id: string
  x: number          // percentual 0-100, relativo à largura
  y: number          // percentual 0-100, relativo à altura
  titulo: string
  conteudo: string
}
// em ConteudoUnidade
imagemBase?: string
hotspots?: HotspotItem[]
```

Coordenadas em percentual, não em pixel — a imagem é responsiva e muda de tamanho
entre editor, preview e LMS.

- `validar`: `imagemBase` válida e ao menos um hotspot com `titulo`.
- Drawer: editor de coordenadas por clique sobre a miniatura da imagem, com lista
  lateral dos hotspots para edição de texto.
- Acessibilidade: cada hotspot é um `<button>` focável, alcançável por Tab, não uma
  `div` com `onClick`.

### `associacao` e `categorizacao`

Compartilham base técnica (arrastar e soltar com alternativa por teclado). Devem ser
implementados juntos.

```ts
export interface ParAssociacao {
  id: string
  esquerda: string
  direita: string
}
// em ConteudoUnidade
paresAssociacao?: ParAssociacao[]

export interface CategoriaItem {
  id: string
  nome: string
  itens: { id: string; texto: string }[]
}
// em ConteudoUnidade
categorias?: CategoriaItem[]
```

- `validar`: ao menos dois pares / duas categorias com ao menos um item cada.
- Componentes: `AssociacaoBlock.tsx` e `CategorizacaoBlock.tsx`, com um hook comum
  `useArrastarSoltar` que expõe também o modo por teclado.
- Ambos embaralham as opções a cada carregamento e mostram acertos ao confirmar.

**Acessibilidade é requisito, não opcional.** Além do arrastar com mouse, precisa
funcionar por teclado: selecionar o item, selecionar o destino, confirmar. Sem isso
o bloco é inutilizável para parte dos alunos e reprova em auditoria de acessibilidade.

---

## Decisões transversais

### 1. Mídia embutida no pacote SCORM

`detectImageUrls` em `src/lib/scorm-build-service.ts` só varre `tipo === 'imagem'` e
`flipcard.imagemFrente`. Qualquer bloco novo com mídia teria a URL remota
**preservada no ZIP**, quebrando o curso num LMS sem internet ou atrás de proxy.

Decisão: renomear para `detectMediaUrls` e dirigi-la pelo catálogo, chamando
`CATALOGO_BLOCOS[bloco.tipo].extrairMidias?.(bloco)`. Assim o bloco novo declara suas
mídias junto com o resto dos metadados e não há como esquecer. Ajustar também a
substituição de caminhos em `scorm-service.ts` (`/scorm-images/{cursoId}/` → `images/`),
que hoje assume que tudo é imagem — passa a ser `assets/`.

### 2. Progresso dos blocos avaliativos

`associacao` e `categorizacao` produzem `{ acertos, total }`, exatamente o formato já
aceito por `ProgressoScormContext` e por `EstadoProgresso.quizzes` em
`src/lib/scorm-progress.ts`.

Decisão: renomear apenas o hook React (`useRegistrarQuiz` → `useRegistrarAvaliacao`) e
**não** mexer no nome do campo `quizzes` nem no formato serializado.

O motivo é importante: o `suspend_data` é versionado (`VERSAO = 'v1'`) e
`decodeSuspendData` descarta estado de versão diferente. Renomear o campo obrigaria a
bumpar para `v2` e **zeraria o progresso de todos os alunos com curso em andamento**.

Atenção ao limite: `LIMITE_SUSPEND_DATA` é 4096 caracteres. Cada avaliação ocupa uma
entrada `"unidade-bloco:acertos/total"`. Com muitos blocos avaliativos, o
`encodeSuspendData` cai no modo reduzido e perde o detalhe por bloco, guardando só a
nota agregada. É comportamento existente e aceitável, mas deve ser testado com um
curso grande.

### 3. Geração por IA e pipeline de marcadores

Blocos de texto (`tabs`, `linha-do-tempo`, `associacao`, `categorizacao`) entram com
`geravelPorIA: true` e marcador próprio. `separador` fica `geravelPorIA: false`.
Blocos de mídia (`audio`, `carrossel`, `pdf`, `imagem-interativa`) seguem o padrão de
`imagem`/`video`: `exigeMidiaDoDocumento: true`.

Cada tipo novo precisa de tratamento em `corrigirBloco()` e `motivoInvalido()` em
`src/lib/blocos.ts`, e de casos em `src/__tests__/lib/blocos.test.ts`.

#### Descoberto na Fase 1: declarar o marcador não basta

Um teste existente quebrou e revelou dois arquivos fora do catálogo que **precisam ser
atualizados a cada bloco novo com marcador**. Sem eles o marcador existe no catálogo mas
nunca sai de um documento — o bloco fica inalcançável pelo fluxo de IA.

**`src/lib/documento-exemplo.ts`** — o .docx modelo que o autor baixa para ver os
marcadores suportados. O teste `src/__tests__/lib/documento-exemplo.test.ts` exige que
**todo** marcador de `BLOCOS_COM_MARCADOR` seja demonstrado ali, com abertura e
fechamento pareados. É uma trava útil: falha em vermelho se alguém esquecer.

**`src/app/api/generate-course-from-text/route.ts`** — prompt escrito à mão, com três
partes que precisam da entrada nova:

1. o esquema JSON por tipo de bloco (`### N. <tipo>`), que ensina o formato do campo;
2. a seção "Como converter os marcadores" do modo `markers`, mapeando cada rótulo do
   documento (`"Título da Aba N:"`) para o campo do bloco (`itensTabs[N].titulo`);
3. as "Diretrizes de escolha automática" do modo `auto`, dizendo em que situação o
   bloco é a escolha certa — e, quando for o caso, proibindo o bloco explicitamente
   (o `separador` nunca deve ser gerado no automático).

Nada disso tem verificação de tipo. É a segunda camada sem rede, ao lado do
`ContentBlockDrawer`.

#### Convenção de rótulos no documento

Para blocos com lista de itens, o padrão já estabelecido é `"<Campo> do/da <Item> N:"`,
numerado a partir de 1 — por exemplo `Título do Item 1:` (accordion),
`Título da Aba 1:` (tabs), `URL da Imagem 1:` (carrossel). Campos únicos do bloco vão
sem numeração: `Orientação:`, `Exibição:`, `Estilo:`.

### 4. Internacionalização

Rótulos e descrições saem do `CATALOGO_BLOCOS`, que é código, não JSON de tradução.
Para os blocos novos, usar chaves de `courses.json` (PT-BR e EN) resolvidas na
camada de UI, não strings literais no catálogo. Definir isso na Fase 0-A, quando
`rotulo` e `descricao` forem consolidados, para não criar dívida nova.

---

## Riscos

| Risco                                                                     | Mitigação                                                                             |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| ZIP estourando o limite de upload do LMS com áudio e PDF                  | Orçamento de peso no editor (verde/amarelo/vermelho); compressão automática de imagem |
| Upload acima de 4,5 MB falhando só em produção (limite de body da Vercel) | Client upload do `@vercel/blob`; limites aplicados no token, não no browser           |
| SVG com `<script>` executando dentro do iframe do LMS                     | Remover `image/svg+xml` da allowlist                                                  |
| `suspend_data` de 4 KB saturando com muitos blocos avaliativos            | Já há degradação para nota agregada; testar com curso grande                          |
| Arrastar e soltar inacessível por teclado                                 | Modo por teclado é requisito de aceite da Fase 3                                      |
| Autoplay de áudio bloqueado no iframe do LMS                              | Nunca usar autoplay                                                                   |
| Reintrodução do `outputFileTracingIncludes` quebrar o deploy              | Escopo restrito a `player/dist`; plano B com assets embutidos em módulo TS            |
| Abas horizontais quebrando em tela estreita                               | Degradar para acordeão empilhado                                                      |

---

## Verificação

1. `pnpm build` limpo — os dois `Record<TipoBloco, …>` garantem que nenhum bloco ficou
   sem catálogo ou sem componente.
2. `pnpm test` — estender `src/__tests__/lib/blocos.test.ts` (validação, `corrigirBloco`,
   marcadores) e `src/__tests__/components/content-block-drawer.test.tsx` (formulário:
   montar o bloco, salvar, remover item).
3. **Pacote SCORM**: exportar, descompactar e confirmar que nenhuma URL remota de mídia
   sobrou (`grep -r "blob.vercel-storage.com"` no ZIP extraído não deve achar nada).
4. **LMS real** (SCORM Cloud ou Moodle): interação, progresso e nota via
   `cmi.core.score.raw`; retomar a sessão e conferir o progresso restaurado.

### O que os testes não alcançam

Três pontos exigem verificação manual, e nenhum deles é reproduzível no ambiente de
desenvolvimento:

1. **Upload real acima de 4,5 MB, em produção.** É exatamente o cenário que falhava
   antes e que só se manifesta na Vercel.
2. **Exportação SCORM com áudio ou PDF**: descompactar o ZIP e confirmar que o arquivo
   foi embutido, e que nenhuma URL de `blob.vercel-storage.com` sobreviveu.
3. **O `<object>` do PDF renderizando.** O Chrome headless não tem plugin de PDF, então
   o screenshot sempre mostra o fallback — o que prova o fallback, não o caminho
   principal.

### Verificação visual sem navegador interativo

O MCP `chrome-devtools` **não funciona neste ambiente** e não vale insistir: desde o
Chrome 136 a flag `--remote-debugging-port` é ignorada quando se usa o perfil padrão
(proteção contra sites acessarem a sessão do usuário), e o MCP está fixado nesse perfil.
Reiniciar o Chrome com a flag não resolve — o `DevToolsActivePort` não é recriado.

O caminho que funciona usa o próprio player Vite, que renderiza um curso a partir de
`window.__COURSE_DATA__` **sem autenticação**, com os mesmos componentes do preview e do
SCORM:

1. `pnpm build:player`
2. copiar `player/dist/` para um diretório temporário;
3. substituir `null /* COURSE_DATA_PLACEHOLDER */` no `index.html` por um curso JSON
   sintético contendo os blocos a conferir;
4. injetar um script que clica no card da unidade — o player não tem rota por URL, a
   unidade é estado interno, e o card é uma `div` (a seta tem `pointer-events-none`), de
   modo que o clique precisa ser disparado no elemento de texto e subir por delegação;
5. servir com `python3 -m http.server` e capturar com
   `"…/Google Chrome" --headless --disable-gpu --virtual-time-budget=15000 --screenshot=…`,
   que **não** precisa de porta de debug.

Conferir sempre tema claro e escuro e uma largura estreita.

**Armadilha de leitura do screenshot:** `--window-size=390,2400` não produz viewport de
390px — na Fase 1 o layout foi calculado com 485px e o PNG gravado com 390, o que corta o
lado direito e **parece** transbordo. Antes de concluir que há overflow, meça:
`document.documentElement.scrollWidth` contra `clientWidth`. Se forem iguais, o corte é
artefato do canvas.
