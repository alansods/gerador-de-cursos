# Blocos de conteúdo

Referência dos blocos que aparecem no modal **Adicionar conteúdo** do editor de cursos: para que
serve cada um, o que o autor preenche, como o aluno usa e o que conta como nota.

Fonte da verdade no código: [`BLOCK_CATALOG` em `src/lib/blocks.ts`](../src/lib/blocks.ts)
(rótulo, descrição, categoria, marcador, validação e mídia). Detalhes de implementação dos
blocos novos estão em
[`docs/specs/2026-09-14-trail-gamified-layout.md`](specs/2026-09-14-trail-gamified-layout.md).

## Visão geral

O modal separa os blocos em quatro abas. Todos funcionam nos três layouts (Clássico, Sidebar e
Trilha) e dentro do pacote SCORM, inclusive offline.

| Aba               | Blocos                                                                                                                                       |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Texto e estrutura | Título, Subtítulo, Parágrafo, Lista, Objetivos, Caixa de destaque, Separador, Ficha técnica                                                  |
| Mídia             | Imagem, Vídeo, Carrossel, Áudio, PDF                                                                                                         |
| Interativos       | Accordion, Flipcard, Abas, Linha do tempo, Imagem interativa                                                                                 |
| Atividades        | Quiz, Verdadeiro ou falso, Completar lacunas, Associação, Categorização, Sequência, Cenário de decisão, Encontre na imagem, Vídeo interativo |

Regras que valem para todos:

- **Campos obrigatórios** têm `*` no formulário. O botão Salvar mostra o que falta (por exemplo,
  "Adicione pelo menos 2 opções").
- **Toque e teclado**: nenhuma atividade exige arrastar. Onde há arrastar (Associação e
  Categorização), também dá para tocar na opção e depois no destino.
- **Imagens do acervo**: todo campo de imagem tem o botão **Escolher do acervo**, ao lado do
  upload. Veja [Acervo de ilustrações](#acervo-de-ilustrações).
- **Upload**: o arquivo vai direto para o armazenamento, com o tamanho recomendado indicado
  abaixo de cada campo. Os limites ficam em `MEDIA_POLICY` (`src/lib/media.ts`).
- **Documento com marcadores**: cada bloco que tem marcador pode vir de um `.docx` com
  `MARCADOR_INICIO` e `MARCADOR_FIM`. O documento modelo, baixado na criação de curso com IA,
  demonstra todos.

## Nota, conclusão e Trilha

Os blocos da aba **Atividades** registram nota. O card **Encontre na imagem** dessa aba cria a
imagem interativa no modo **Encontrar**, o único modo dela que registra nota.

- **Vale nota ou fixação**: esses blocos têm no formulário a caixa **Vale nota**, marcada por
  padrão. Desmarcada, a atividade vira **exercício de fixação**: o aluno responde e vê se acertou
  como sempre, mas ela não entra na nota do LMS, não dá XP, não conta para as estrelas e nunca
  trava uma etapa do Trilha. No editor, o card mostra o selo **Vale nota** ou **Fixação**; no
  curso, as atividades que valem nota mostram o selo **Vale nota** e as de fixação ficam sem
  selo. No documento, a linha opcional `Avaliativa: não` (ou `nao`) dentro do marcador cria a
  atividade como fixação; sem a linha, ela vale nota. Na geração automática, sem marcadores,
  toda atividade vale nota.
- **Nota no LMS** (`cmi.core.score.raw`): soma dos acertos sobre o total das atividades que
  valem nota, sempre pela **última tentativa**. Se o autor muda uma atividade para fixação depois
  que alunos responderam, ela deixa de contar.
- **Conclusão no LMS**: no Clássico e no Sidebar, quando o aluno visita todas as unidades. No
  Trilha, quando conclui todas as etapas.
- **No layout Trilha**, cada bloco **Título** abre uma etapa. A etapa só pode ser concluída depois
  que todas as atividades avaliadas dela forem respondidas (certo ou errado). A gamificação usa:

| Evento                                              | XP  |
| --------------------------------------------------- | --- |
| Atividade avaliada com 100% na primeira tentativa   | 20  |
| Atividade avaliada respondida, sem 100% de primeira | 10  |
| Etapa concluída                                     | 10  |

- **Estrelas por unidade** usam só a primeira tentativa: 90% ou mais de acertos de primeira dá 3
  estrelas, 60% ou mais dá 2, abaixo disso 1. Unidade sem atividade avaliada ganha 3.
- Blocos das outras abas e atividades de fixação não dão nota, não dão XP e nunca travam uma
  etapa. O aviso do editor "etapa sem atividade avaliada" também ignora as de fixação.

---

## Texto e estrutura

### Título

Cabeçalho de seção. No layout Trilha, **cada Título começa uma etapa** da missão; os blocos antes
do primeiro Título formam a etapa 1.

- **Preenche**: o texto do título.
- **Documento**: sem marcador; a IA cria Títulos a partir das seções do texto.

### Subtítulo

Cabeçalho de subseção, menor que o Título. Não abre etapa no Trilha.

- **Preenche**: o texto do subtítulo.

### Parágrafo

Texto corrido com formatação (negrito, itálico, links, listas simples).

- **Preenche**: o conteúdo no editor de texto. Opcional: cor do texto e alinhamento (esquerda,
  centro, direita, justificado).
- **Largura**: pode ocupar a linha inteira ou meia largura, lado a lado com o bloco seguinte.
- **Documento**: texto fora de marcadores vira parágrafo.

### Lista

Itens ou passos.

- **Preenche**: pelo menos um item com texto e o tipo: **Não ordenada** (marcadores),
  **Ordenada** (numerada) ou **Com check** (ícone de verificação).
- **Documento**: `LISTA` com `Tipo:` (por exemplo `ordenada` ou `nao-ordenada`) e um `Item:` por
  linha.

### Objetivos

Objetivos de aprendizagem da unidade, em destaque.

- **Preenche**: pelo menos um objetivo com texto.
- **Documento**: `OBJETIVOS` com um `Objetivo:` por linha.

### Caixa de destaque

Card com ícone e cor para chamar atenção. Tem quatro tipos:

| Tipo            | Quando usar                                           |
| --------------- | ----------------------------------------------------- |
| **Informação**  | complemento neutro ao conteúdo                        |
| **Atenção**     | risco, erro comum, regra que não pode ser descumprida |
| **Saiba mais**  | aprofundamento opcional, referência, norma            |
| **Curiosidade** | fato interessante que ajuda a lembrar                 |

- **Preenche**: o tipo, o conteúdo e um título opcional. Com título, a caixa abre e fecha ao
  clicar.
- **Documento**: `INFOBOX` com `Tipo:` (`atencao`, `saiba_mais`, `curiosidade`; sem tipo vira
  Informação), `Título:` e `Conteúdo:`.

### Separador

Divisória entre seções.

- **Preenche**: o estilo: **Linha**, **Linha com ícone** ou **Apenas espaço**.
- **Documento**: `SEPARADOR` com `Estilo:`. A IA não cria separadores sozinha.

### Ficha técnica

Materiais com quantidade e imagem, seguidos dos passos. Serve para receita, montagem, preparo de
equipamento, procedimento de inspeção.

- **Preenche**: pelo menos 1 material com nome e 1 passo com texto. Opcionais: um resumo de uma
  linha (rendimento, tempo, nível), a quantidade e a imagem de cada material.
- **Aluno vê**: o resumo em destaque, os materiais em grade de cartões (imagem, nome e quantidade;
  um ícone genérico quando falta imagem) e os passos numerados.
- **Documento**: `FICHATECNICA` com `Resumo:`, `Material N:`, `Quantidade do Material N:`,
  `Imagem do Material N:` e `Passo N:`.
- **IA**: usa a ficha no lugar de duas listas quando o texto traz materiais com quantidades e os
  passos que os usam.

---

## Mídia

### Imagem

Foto ou ilustração com legenda e fonte.

- **Preenche**: a imagem (upload, URL ou **Escolher do acervo**), o tamanho (**Pequena**,
  **Média** ou **Grande**), a legenda e a fonte.
- **Largura**: inteira ou meia largura.
- **Documento**: `IMAGEM` com `URL:`, `Legenda:`, `Fonte:` e `Tamanho:`. Precisa de URL presente
  no documento.

### Vídeo

Vídeo do YouTube ou arquivo enviado.

- **Preenche**: o link do YouTube ou o arquivo, e um título.
- **Pacote SCORM**: arquivo enviado vai dentro do ZIP; vídeo do YouTube continua precisando de
  internet.
- **Documento**: `VIDEO` com `URL:` e `Título:`.

### Carrossel

Galeria de imagens.

- **Preenche**: pelo menos uma imagem, cada uma com URL, legenda e fonte. A exibição pode ser
  **Carrossel** (uma por vez, com setas) ou **Grade** (todas lado a lado).
- **Documento**: `CARROSSEL` com `Exibição:`, `URL da Imagem N:`, `Legenda da Imagem N:` e
  `Fonte da Imagem N:`.

### Áudio

Narração ou podcast, com transcrição opcional.

- **Preenche**: o arquivo ou a URL e um título. Opcional: a transcrição, que o aluno pode abrir.
- **Documento**: `AUDIO` com `URL:`, `Título:` e `Transcrição:`.

### PDF

Documento para leitura dentro do curso.

- **Preenche**: o arquivo ou a URL e um título. Opcional: permitir ou não o download.
- **Documento**: `PDF` com `URL:`, `Título:` e `Permitir Download:` (`sim` ou `não`).

---

## Interativos

Nenhum destes dá nota. Servem para explorar o conteúdo.

### Accordion

Itens que abrem e fecham, bons para perguntas frequentes ou tópicos com detalhe.

- **Preenche**: pelo menos um item, cada um com título e conteúdo.
- **Documento**: `ACCORDION` com `Título do Item N:` e `Conteúdo do Item N:`.

### Flipcard

Cartões de revisão que viram ao clicar: frente com a pergunta ou o termo, verso com a resposta.

- **Preenche**: pelo menos um cartão. A frente pode ser **Apenas título centralizado**,
  **Apenas imagem** ou **Imagem com título no rodapé**; o verso tem o conteúdo. Opcional: a altura
  dos cartões.
- **Documento**: `FLIPCARD` com `Frente do Card N:` e `Verso do Card N:`.

### Abas

Conteúdo dividido em abas, bom para comparar alternativas do mesmo assunto.

- **Preenche**: pelo menos uma aba, cada uma com título e conteúdo.
- **Documento**: `TABS` com `Título da Aba N:` e `Conteúdo da Aba N:`.

### Linha do tempo

Eventos em ordem cronológica.

- **Preenche**: pelo menos um evento com título; data e descrição opcionais. Orientação
  **Vertical** ou **Horizontal**.
- **Documento**: `TIMELINE` com `Orientação:`, `Data:`, `Título do Evento:` e
  `Descrição do Evento:`.

### Imagem interativa

Imagem com pontos clicáveis. O card **Imagem interativa** fica em Interativos e abre no modo
Explorar. Tem dois modos:

- **Explorar** (padrão): os pontos aparecem na imagem; o aluno clica para ler o título e o
  conteúdo de cada um. Não dá nota.
- **Encontrar** (é o que o card **Encontre na imagem**, na aba Atividades, já abre selecionado):
  os pontos ficam escondidos e o aluno procura cada um na imagem (bom para
  "encontre os erros"). No teclado, as setas movem uma mira e Enter marca. Um clique fora de
  qualquer ponto conta como erro. Quando acha todos, registra a nota; é "de primeira" com até 2
  cliques errados. **Neste modo, o bloco é avaliado** e ganha a caixa **Vale nota** (veja
  [Nota, conclusão e Trilha](#nota-conclusão-e-trilha)).
- **Preenche**: a imagem de fundo, o tamanho e pelo menos um ponto com título (a posição é
  arrastada na imagem; o conteúdo é opcional).
- **Documento**: `HOTSPOT` com `URL:`, `Legenda:`, `Modo:` (`explorar` ou `encontrar`),
  `X do Ponto N:`, `Y do Ponto N:` (em %), `Título do Ponto N:` e `Conteúdo do Ponto N:`.

---

## Atividades

Todos registram nota por tentativa. O aluno pode refazer; a nota do LMS fica com a última
tentativa e as estrelas do Trilha com a primeira. Cada um pode ser marcado como exercício de
fixação, desmarcando **Vale nota**, e aceita `Avaliativa: não` no marcador.

### Quiz

Pergunta de múltipla escolha com feedback.

- **Preenche**: pelo menos uma pergunta, cada uma com 5 alternativas (A a E), a correta e um
  feedback por alternativa.
- **Documento**: `QUIZ` com `Pergunta:`, `Opção A:` a `Opção E:` e `Resposta Correta:`, repetidos
  para cada pergunta.

### Verdadeiro ou falso

Afirmações para julgar.

- **Preenche**: pelo menos 2 afirmações, cada uma com a resposta (verdadeira ou falsa) e uma
  explicação opcional.
- **Aluno faz**: responde uma afirmação por vez, vê a resposta certa e a explicação, e no fim a
  lista com acertos e erros.
- **Documento**: `VERDADEIROFALSO` com `Afirmação N:`, `Resposta N:` e `Explicação N:`.

### Completar lacunas

Texto com lacunas para completar com palavras de um banco.

- **Preenche**: o texto com cada resposta entre colchetes, como `Lave as mãos por [20] segundos`.
  Opcional: palavras distratoras (erradas, mas plausíveis), separadas por vírgula. O formulário
  mostra a lista de lacunas encontradas.
- **Aluno faz**: toca numa palavra para colocá-la na lacuna destacada; toca numa lacuna
  preenchida para devolver a palavra. Maiúsculas e espaços não contam como erro.
- **Documento**: `LACUNAS` com `Texto:` e `Distratores:`.

### Associação

Relacionar cada item à sua correspondência.

- **Preenche**: os pares, com os dois lados preenchidos. Opcional: uma imagem no item fixo (por
  exemplo, a foto da ferramenta e o nome como correspondência).
- **Aluno faz**: arrasta cada opção até o item, ou toca na opção e depois no item.
- **Documento**: `ASSOCIACAO` com `Item N:`, `Correspondente N:` e `Imagem do Item N:`.

### Categorização

Agrupar itens em categorias.

- **Preenche**: pelo menos 2 categorias com nome, cada uma com pelo menos um item.
- **Aluno faz**: arrasta cada item para a categoria, ou toca no item e depois na categoria.
- **Documento**: `CATEGORIZACAO` com `Categoria N:` e `Item M da Categoria N:`.

### Sequência

Colocar os passos na ordem certa.

- **Preenche**: pelo menos 3 passos, **já na ordem correta** (o editor tem setas para reordenar).
  O player embaralha e nunca começa na ordem certa.
- **Aluno faz**: move cada passo com as setas para cima e para baixo e clica em "Verificar
  ordem". A nota é quantos passos ficaram na posição certa.
- **Documento**: `SEQUENCIA` com `Passo N:`.

### Cenário de decisão

Uma situação com personagem, escolhas e a consequência de cada uma.

- **Preenche**: a situação e pelo menos 2 opções, com pelo menos uma correta. Opcionais: nome e
  imagem do personagem, e a consequência de cada opção.
- **Aluno faz**: lê a fala do personagem, escolhe o que faz e vê a consequência. Se errar, pode
  tentar de novo (nova tentativa).
- **Documento**: `CENARIO` com `Personagem:`, `Imagem do Personagem:`, `Situação:`,
  `Opção N:`, `Consequência N:` e `Resposta Correta:`.

### Encontre na imagem

Card que cria a [Imagem interativa](#imagem-interativa) já no modo **Encontrar**: o aluno procura
pontos escondidos numa imagem. Os campos, o marcador `HOTSPOT` (com `Modo: encontrar`) e a
pontuação são os da imagem interativa.

### Vídeo interativo

Vídeo que pausa em momentos marcados para fazer perguntas.

- **Preenche**: o vídeo (arquivo ou YouTube), um título e pelo menos uma pergunta com tempo
  (`mm:ss`) e alternativas.
- **Documento**: `VIDEOINTERATIVO` com `URL:`, `Título:`, `Tempo da Pergunta N:`,
  `Pergunta N:` e `Opção A da Pergunta N:` em diante.

---

## Acervo de ilustrações

Os campos de imagem têm o botão **Escolher do acervo**, que abre uma biblioteca de ilustrações em
SVG com busca por nome ou palavra-chave e filtros por tema, categoria e acervo.

- **Temas**: Culinária, Segurança dos alimentos, Segurança do trabalho, Indústria e manutenção,
  Saúde e Escritório e gestão.
- **Acervos**: `original` (desenhos próprios do projeto) e `fluent-emoji` (Microsoft, licença MIT).
- **No curso**: ilustrações do acervo aparecem sobre um cartão creme, nos temas claro e escuro.
- **No pacote SCORM**: a ilustração vai dentro do ZIP e funciona sem internet. Quando o curso usa
  ilustração de terceiros, o ZIP leva `illustration-credits.txt` com os créditos e a licença.
- **Adicionar ilustrações**: arquivo SVG em `public/illustrations/<tema>/<categoria>/` e uma
  entrada em `public/illustrations/manifest.json`. O teste
  `src/__tests__/lib/illustration-manifest.test.ts` confere a consistência.

## Para desenvolvedores

Como criar um tipo de bloco novo está no `CLAUDE.md`, seção "Como Criar um Novo Tipo de
Conteúdo". Ao criar ou mudar um bloco, atualize este documento.
