# Blocos de conteúdo

Regras gerais dos blocos que aparecem no modal **Adicionar conteúdo** do editor de cursos: como
se organizam, o que conta como nota e como funcionam no Trilha. A referência de cada bloco fica
na página **Blocos** do app (veja [Referência por bloco](#referência-por-bloco)).

Fonte da verdade no código: [`BLOCK_CATALOG` em `src/lib/blocks.ts`](../src/lib/blocks.ts)
(rótulo, descrição, categoria, marcador, validação e mídia). Detalhes de implementação dos
blocos novos estão em
[`docs/specs/2026-09-14-trail-gamified-layout.md`](specs/2026-09-14-trail-gamified-layout.md).

## Visão geral

O modal separa os blocos em quatro abas. Todos funcionam nos três layouts (Clássico, Sidebar e
Trilha) e dentro do pacote SCORM, inclusive offline.

| Aba               | Blocos                                                                                                                                                      |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Texto e estrutura | Título, Subtítulo, Parágrafo, Lista, Objetivos, Caixa de destaque, Separador, Ficha técnica                                                                 |
| Mídia             | Imagem, Vídeo, Carrossel, Áudio, PDF                                                                                                                        |
| Interativos       | Accordion, Flipcard, Abas, Linha do tempo, Imagem interativa                                                                                                |
| Atividades        | Quiz, Verdadeiro ou falso, Completar lacunas, Caça-palavras, Associação, Categorização, Sequência, Cenário de decisão, Encontre na imagem, Vídeo interativo |

Regras que valem para todos:

- **Campos obrigatórios** têm `*` no formulário. O botão Salvar mostra o que falta (por exemplo,
  "Adicione pelo menos 2 opções").
- **Toque e teclado**: onde há arrastar na Associação e na Categorização, também dá para
  tocar na opção e depois no destino. O **Caça-palavras** é a exceção: no toque, a palavra
  se marca arrastando o dedo da primeira à última letra; no teclado, as setas movem o cursor
  e Enter marca o início e o fim.
- **Imagens do acervo**: todo campo de imagem tem o botão **Escolher do acervo**, ao lado do
  upload. Veja [Acervo de ilustrações](#acervo-de-ilustrações).
- **Upload**: o arquivo vai direto para o armazenamento, com o tamanho recomendado indicado
  abaixo de cada campo. Os limites ficam em `MEDIA_POLICY` (`src/lib/media.ts`).
- **Documento com marcadores**: cada bloco que tem marcador pode vir de um `.docx` com
  `MARCADOR_INICIO` e `MARCADOR_FIM`. O documento modelo, baixado na criação de curso com IA,
  demonstra todos.

## Nota, conclusão e Trilha

Os blocos da aba **Atividades** registram nota, inclusive o **Encontre na imagem**. A **Imagem
interativa** da aba Interativos não registra.

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

## Referência por bloco

O que o autor preenche, como o aluno usa, se vale nota e como escrever o marcador no documento
de cada bloco estão na página **Blocos** do app (`/blocks`, no menu lateral e no link **Ver
exemplos** do modal Adicionar conteúdo). Lá cada bloco aparece funcionando, com um exemplo que
dá para responder e reiniciar.

O texto e os exemplos ficam em
[`BLOCK_GUIDE` e `BLOCK_SAMPLES`, em `src/lib/block-showcase.ts`](../src/lib/block-showcase.ts).

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
Conteúdo". Ao criar ou mudar um bloco, atualize a entrada dele em `src/lib/block-showcase.ts`
e, se mudar uma regra geral, este documento.
