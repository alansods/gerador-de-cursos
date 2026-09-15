import type { Block } from '@/types/course'
import { createEmptyBlock, type BlockType } from '@/lib/blocks'

export type ShowcaseEntryId = BlockType | 'find-in-image'

export interface BlockGuide {
  authorFills: string
  learnerDoes?: string
  grading?: string
  marker?: string
}

const HYGIENE_SCENE = '/illustrations/food-safety/scenes/kitchen-hygiene-errors.svg'
const SAMPLE_YOUTUBE_URL = 'https://www.youtube.com/watch?v=z3eKi8GKdBg'

function sample(id: ShowcaseEntryId, type: BlockType, fields: Partial<Block>): Block {
  return {
    ...createEmptyBlock(type),
    id: `showcase-${id}`,
    order: 0,
    ...fields,
  } as Block
}

const hygieneHotspots = [
  {
    id: 'hs-hair',
    x: 40,
    y: 15,
    title: 'Cabelo sem touca',
    content: 'O cabelo deve estar preso e totalmente coberto pela touca.',
  },
  {
    id: 'hs-earring',
    x: 32,
    y: 30,
    title: 'Brincos',
    content: 'Adornos acumulam sujeira e podem cair no alimento.',
  },
  {
    id: 'hs-singing',
    x: 61,
    y: 25,
    title: 'Cantando sobre a panela',
    content: 'Falar, cantar ou tossir sobre o alimento espalha gotículas de saliva.',
  },
  {
    id: 'hs-watch',
    x: 60,
    y: 65,
    title: 'Relógio no pulso',
    content: 'Relógio e pulseiras impedem a lavagem correta das mãos e dos punhos.',
  },
]

export const BLOCK_SAMPLES: Record<ShowcaseEntryId, Block> = {
  heading: sample('heading', 'heading', { content: 'Higiene pessoal na cozinha' }),
  subheading: sample('subheading', 'subheading', { content: 'Por que lavar as mãos?' }),
  paragraph: sample('paragraph', 'paragraph', {
    textColor: '',
    content:
      '<p>As mãos do manipulador são o principal veículo de contaminação dos alimentos. Uma lavagem <strong>correta e frequente</strong> elimina a maior parte dos micro-organismos que causam doenças.</p>',
  }),
  list: sample('list', 'list', {
    listType: 'check',
    listItems: [
      { id: 'li-1', text: 'Cabelos presos e cobertos por touca' },
      { id: 'li-2', text: 'Unhas curtas, limpas e sem esmalte' },
      { id: 'li-3', text: 'Sem brincos, anéis, relógio ou pulseiras' },
    ],
  }),
  'learning-objectives': sample('learning-objectives', 'learning-objectives', {
    objectiveItems: [
      {
        id: 'ob-1',
        text: 'Identificar os hábitos de higiene exigidos do manipulador de alimentos',
      },
      { id: 'ob-2', text: 'Executar as etapas da lavagem correta das mãos' },
    ],
  }),
  'info-box': sample('info-box', 'info-box', {
    infoBoxType: 'warning',
    infoBoxTitle: 'Luvas não substituem a lavagem',
    content:
      '<p>Luvas descartáveis contaminam como as mãos. Lave as mãos antes de calçá-las e troque as luvas sempre que mudar de tarefa.</p>',
  }),
  divider: sample('divider', 'divider', { dividerStyle: 'line-icon' }),
  'technical-sheet': sample('technical-sheet', 'technical-sheet', {
    sheetSummary: 'Higienização de hortaliças · 20 minutos',
    sheetMaterials: [
      {
        id: 'ma-1',
        name: 'Tigela',
        quantity: '1 unidade',
        image: '/illustrations/culinary/utensils/bowl.svg',
      },
      {
        id: 'ma-2',
        name: 'Água potável',
        quantity: '1 litro',
        image: '/illustrations/culinary/ingredients/water.svg',
      },
      {
        id: 'ma-3',
        name: 'Peneira',
        quantity: '1 unidade',
        image: '/illustrations/culinary/utensils/sieve.svg',
      },
    ],
    sheetSteps: [
      { id: 'st-1', text: 'Retire as folhas e partes estragadas.' },
      { id: 'st-2', text: 'Lave em água corrente, folha por folha.' },
      { id: 'st-3', text: 'Deixe de molho na solução clorada por 15 minutos.' },
      { id: 'st-4', text: 'Enxágue e escorra na peneira.' },
    ],
  }),
  image: sample('image', 'image', {
    content: '/illustrations/food-safety/scenes/handwashing-scrub.svg',
    size: 'medium',
    caption: 'Esfregue as mãos por pelo menos 20 segundos',
    source: 'Acervo de ilustrações',
  }),
  video: sample('video', 'video', {
    videoSource: 'youtube',
    videoUrl: SAMPLE_YOUTUBE_URL,
    videoTitle: 'Introdução à segurança do trabalho',
  }),
  carousel: sample('carousel', 'carousel', {
    carouselMode: 'carousel',
    carouselItems: [
      {
        id: 'ca-1',
        url: '/illustrations/food-safety/scenes/handwashing-wet-hands.svg',
        caption: '1. Molhe as mãos',
        source: 'Acervo de ilustrações',
      },
      {
        id: 'ca-2',
        url: '/illustrations/food-safety/scenes/handwashing-soap.svg',
        caption: '2. Aplique sabonete',
        source: 'Acervo de ilustrações',
      },
      {
        id: 'ca-3',
        url: '/illustrations/food-safety/scenes/handwashing-scrub.svg',
        caption: '3. Esfregue por 20 segundos',
        source: 'Acervo de ilustrações',
      },
      {
        id: 'ca-4',
        url: '/illustrations/food-safety/scenes/handwashing-rinse.svg',
        caption: '4. Enxágue',
        source: 'Acervo de ilustrações',
      },
    ],
  }),
  audio: sample('audio', 'audio', {
    audioUrl: '/showcase/handwashing.m4a',
    audioTitle: 'Como lavar as mãos',
    transcript:
      '<p>Lavar as mãos é a primeira barreira contra a contaminação dos alimentos. Molhe as mãos, aplique sabonete e esfregue por pelo menos vinte segundos, sem esquecer entre os dedos e as unhas. Enxágue, seque com papel toalha e aplique álcool setenta por cento.</p>',
  }),
  pdf: sample('pdf', 'pdf', {
    pdfUrl: '/showcase/kitchen-hygiene-checklist.pdf',
    pdfTitle: 'Checklist de higiene na cozinha',
    allowPdfDownload: true,
  }),
  accordion: sample('accordion', 'accordion', {
    items: [
      {
        id: 'ac-1',
        title: 'Quando lavar as mãos?',
        content:
          '<p>Ao chegar, após ir ao banheiro, depois de tocar em lixo ou alimento cru e ao trocar de tarefa.</p>',
      },
      {
        id: 'ac-2',
        title: 'Posso usar só álcool em gel?',
        content: '<p>Não. O álcool complementa a lavagem com água e sabonete, não a substitui.</p>',
      },
    ],
  }),
  flipcard: sample('flipcard', 'flipcard', {
    cardHeight: '240px',
    flipcardItems: [
      {
        id: 'fc-1',
        frontType: 'title',
        frontTitle: 'Contaminação cruzada',
        backContent: 'Passagem de micro-organismos de um alimento ou superfície para outro.',
      },
      {
        id: 'fc-2',
        frontType: 'image-title',
        frontImage: '/illustrations/workplace-safety/ppe/gloves.svg',
        frontTitle: 'Luvas',
        backContent: 'Trocar sempre que mudar de tarefa ou quando rasgarem.',
      },
    ],
  }),
  tabs: sample('tabs', 'tabs', {
    tabItems: [
      {
        id: 'ta-1',
        title: 'Lavagem simples',
        content: '<p>Água e sabonete comum. Remove a sujeira e parte dos micro-organismos.</p>',
      },
      {
        id: 'ta-2',
        title: 'Antissepsia',
        content:
          '<p>Depois da lavagem, aplica-se álcool 70% ou antisséptico para eliminar o que restou.</p>',
      },
    ],
  }),
  timeline: sample('timeline', 'timeline', {
    timelineOrientation: 'vertical',
    timelineItems: [
      {
        id: 'tl-1',
        date: '1847',
        title: 'Semmelweis e a lavagem das mãos',
        description: 'A lavagem das mãos reduz drasticamente as infecções em uma maternidade.',
      },
      {
        id: 'tl-2',
        date: '2004',
        title: 'RDC 216 da Anvisa',
        description: 'Regulamento de boas práticas para serviços de alimentação no Brasil.',
      },
    ],
  }),
  'interactive-image': sample('interactive-image', 'interactive-image', {
    baseImage: HYGIENE_SCENE,
    size: 'large',
    hotspotMode: 'explore',
    caption: 'Clique nos pontos para ver cada problema',
    hotspots: hygieneHotspots,
  }),
  quiz: sample('quiz', 'quiz', {
    quizData: {
      questions: [
        {
          id: 'qz-1',
          question: 'Por quanto tempo, no mínimo, devemos esfregar as mãos durante a lavagem?',
          hint: 'É mais do que parece: dá para cantar "Parabéns pra você" duas vezes.',
          options: [
            { id: 'qz-1a', text: '5 segundos', isCorrect: false, feedback: 'Pouco tempo.' },
            { id: 'qz-1b', text: '20 segundos', isCorrect: true, feedback: 'Isso mesmo!' },
            {
              id: 'qz-1c',
              text: '2 minutos',
              isCorrect: false,
              feedback: 'Não é preciso tanto tempo.',
            },
          ],
        },
      ],
    },
  }),
  'true-false': sample('true-false', 'true-false', {
    trueFalseItems: [
      {
        id: 'tf-1',
        statement: 'Usar luvas dispensa a lavagem das mãos.',
        answer: 'false',
        explanation: 'As mãos devem ser lavadas antes de calçar as luvas.',
      },
      {
        id: 'tf-2',
        statement: 'Unhas com esmalte podem contaminar o alimento.',
        answer: 'true',
        explanation: 'O esmalte descasca e acumula sujeira.',
      },
    ],
  }),
  'fill-blanks': sample('fill-blanks', 'fill-blanks', {
    fillBlanksText:
      'Esfregue as mãos por pelo menos [20] segundos e seque com [papel toalha] descartável.',
    fillBlanksDistractors: ['5', 'pano de prato'],
  }),
  matching: sample('matching', 'matching', {
    matchingPairs: [
      {
        id: 'mt-1',
        left: 'Touca',
        right: 'Protege o alimento dos cabelos',
        leftImage: '/illustrations/workplace-safety/ppe/helmet.svg',
      },
      {
        id: 'mt-2',
        left: 'Luvas',
        right: 'Barreira no contato com alimento pronto',
        leftImage: '/illustrations/workplace-safety/ppe/gloves.svg',
      },
      {
        id: 'mt-3',
        left: 'Avental',
        right: 'Protege o uniforme da sujeira',
        leftImage: '/illustrations/workplace-safety/ppe/lab-coat.svg',
      },
    ],
  }),
  categorization: sample('categorization', 'categorization', {
    categories: [
      {
        id: 'cg-1',
        name: 'Permitido',
        items: [
          { id: 'cg-1a', text: 'Touca' },
          { id: 'cg-1b', text: 'Uniforme limpo' },
        ],
      },
      {
        id: 'cg-2',
        name: 'Proibido',
        items: [
          { id: 'cg-2a', text: 'Brincos' },
          { id: 'cg-2b', text: 'Relógio' },
          { id: 'cg-2c', text: 'Unhas com esmalte' },
        ],
      },
    ],
  }),
  sequence: sample('sequence', 'sequence', {
    sequenceItems: [
      { id: 'sq-1', text: 'Molhar as mãos' },
      { id: 'sq-2', text: 'Aplicar sabonete' },
      { id: 'sq-3', text: 'Esfregar por 20 segundos' },
      { id: 'sq-4', text: 'Enxaguar' },
      { id: 'sq-5', text: 'Secar com papel toalha' },
    ],
  }),
  scenario: sample('scenario', 'scenario', {
    scenarioCharacter: 'Ana, auxiliar de cozinha',
    scenarioAvatar: '/illustrations/food-safety/scenes/handwashing-soap.svg',
    scenarioSituation:
      'Acabei de tirar o lixo e preciso voltar a montar os pratos. O pedido está atrasado. O que eu faço?',
    scenarioOptions: [
      {
        id: 'sc-1',
        text: 'Lavo as mãos antes de voltar à bancada.',
        outcome: 'correct',
        consequence: 'Leva menos de um minuto e evita contaminar os pratos.',
      },
      {
        id: 'sc-2',
        text: 'Passo álcool em gel e volto logo.',
        outcome: 'incorrect',
        consequence: 'O álcool não remove a sujeira do lixo: é preciso lavar com água e sabonete.',
      },
      {
        id: 'sc-3',
        text: 'Calço luvas por cima e continuo.',
        outcome: 'incorrect',
        consequence: 'As luvas ficam contaminadas ao serem calçadas com as mãos sujas.',
      },
    ],
  }),
  'find-in-image': sample('find-in-image', 'interactive-image', {
    baseImage: HYGIENE_SCENE,
    size: 'large',
    hotspotMode: 'find',
    caption: 'Encontre os 4 erros de higiene',
    hotspots: hygieneHotspots,
  }),
  'interactive-video': sample('interactive-video', 'interactive-video', {
    videoSource: 'youtube',
    videoUrl: SAMPLE_YOUTUBE_URL,
    videoTitle: 'Introdução à segurança do trabalho',
    videoQuestions: [
      {
        id: 'iv-1',
        time: '00:15',
        question: 'Qual é o objetivo principal da segurança do trabalho?',
        optionA: 'Aumentar a produção a qualquer custo',
        optionB: 'Prevenir acidentes e doenças ocupacionais',
        optionC: 'Reduzir o número de funcionários',
        correct: 'B',
        feedback: 'A segurança do trabalho existe para proteger a saúde do trabalhador.',
      },
    ],
  }),
}

const GRADING_ACTIVITY =
  'Vale nota por padrão. Desmarcando "Vale nota", vira exercício de fixação: o aluno vê se acertou, mas não entra na nota do LMS, não dá XP e não trava etapa do Trilha.'

export const BLOCK_GUIDE: Record<ShowcaseEntryId, BlockGuide> = {
  heading: {
    authorFills: 'O texto do título.',
    learnerDoes:
      'Vê o cabeçalho da seção. No layout Trilha, cada Título começa uma etapa da missão; os blocos antes do primeiro Título formam a etapa 1.',
    marker: 'Sem marcador: a IA cria Títulos a partir das seções do texto.',
  },
  subheading: {
    authorFills: 'O texto do subtítulo.',
    learnerDoes: 'Vê um cabeçalho de subseção, menor que o Título. Não abre etapa no Trilha.',
  },
  paragraph: {
    authorFills:
      'O conteúdo no editor de texto, com negrito, itálico, links e listas simples. Opcional: cor do texto e alinhamento. Pode ocupar a linha inteira ou meia largura.',
    marker: 'Texto fora de marcadores vira parágrafo.',
  },
  list: {
    authorFills:
      'Pelo menos um item com texto e o tipo: Não ordenada (marcadores), Ordenada (numerada) ou Com check.',
    marker: 'LISTA com "Tipo:" (por exemplo ordenada ou nao-ordenada) e um "Item:" por linha.',
  },
  'learning-objectives': {
    authorFills: 'Pelo menos um objetivo com texto.',
    marker: 'OBJETIVOS com um "Objetivo:" por linha.',
  },
  'info-box': {
    authorFills:
      'O tipo (Informação, Atenção, Saiba mais ou Curiosidade), o conteúdo e um título opcional. Com título, a caixa abre e fecha ao clicar.',
    learnerDoes:
      'Informação é complemento neutro; Atenção sinaliza risco ou regra; Saiba mais traz aprofundamento; Curiosidade ajuda a lembrar.',
    marker:
      'INFOBOX com "Tipo:" (atencao, saiba_mais, curiosidade; sem tipo vira Informação), "Título:" e "Conteúdo:".',
  },
  divider: {
    authorFills: 'O estilo: Linha, Linha com ícone ou Apenas espaço.',
    marker: 'SEPARADOR com "Estilo:". A IA não cria separadores sozinha.',
  },
  'technical-sheet': {
    authorFills:
      'Pelo menos 1 material com nome e 1 passo com texto. Opcionais: um resumo de uma linha (rendimento, tempo, nível), a quantidade e a imagem de cada material.',
    learnerDoes:
      'Vê o resumo em destaque, os materiais em grade de cartões e os passos numerados. Serve para receita, montagem, preparo de equipamento ou inspeção.',
    marker:
      'FICHATECNICA com "Resumo:", "Material N:", "Quantidade do Material N:", "Imagem do Material N:" e "Passo N:".',
  },
  image: {
    authorFills:
      'A imagem (upload, URL ou Escolher do acervo), o tamanho (Pequena, Média ou Grande), a legenda e a fonte. Pode ocupar meia largura.',
    marker: 'IMAGEM com "URL:", "Legenda:", "Fonte:" e "Tamanho:". Precisa de URL no documento.',
  },
  video: {
    authorFills: 'O link do YouTube ou o arquivo de vídeo, e um título.',
    learnerDoes:
      'Assiste ao vídeo. No pacote SCORM, o arquivo enviado vai dentro do ZIP; vídeo do YouTube continua precisando de internet.',
    marker: 'VIDEO com "URL:" e "Título:".',
  },
  carousel: {
    authorFills:
      'Pelo menos uma imagem, cada uma com URL, legenda e fonte. A exibição pode ser Carrossel (uma por vez, com setas) ou Grade (todas lado a lado).',
    marker:
      'CARROSSEL com "Exibição:", "URL da Imagem N:", "Legenda da Imagem N:" e "Fonte da Imagem N:".',
  },
  audio: {
    authorFills: 'O arquivo ou a URL e um título. Opcional: a transcrição.',
    learnerDoes: 'Ouve o áudio e pode abrir a transcrição.',
    marker: 'AUDIO com "URL:", "Título:" e "Transcrição:".',
  },
  pdf: {
    authorFills: 'O arquivo ou a URL e um título. Opcional: permitir ou não o download.',
    learnerDoes: 'Lê o documento dentro do curso e, se permitido, baixa o arquivo.',
    marker: 'PDF com "URL:", "Título:" e "Permitir Download:" (sim ou não).',
  },
  accordion: {
    authorFills: 'Pelo menos um item, cada um com título e conteúdo.',
    learnerDoes: 'Abre e fecha cada item. Bom para perguntas frequentes ou tópicos com detalhe.',
    grading: 'Não dá nota.',
    marker: 'ACCORDION com "Título do Item N:" e "Conteúdo do Item N:".',
  },
  flipcard: {
    authorFills:
      'Pelo menos um cartão. A frente pode ser Apenas título, Apenas imagem ou Imagem com título no rodapé; o verso tem o conteúdo. Opcional: a altura dos cartões.',
    learnerDoes: 'Clica no cartão para virar e ver a resposta.',
    grading: 'Não dá nota.',
    marker: 'FLIPCARD com "Frente do Card N:" e "Verso do Card N:".',
  },
  tabs: {
    authorFills: 'Pelo menos uma aba, cada uma com título e conteúdo.',
    learnerDoes: 'Troca de aba para comparar alternativas do mesmo assunto.',
    grading: 'Não dá nota.',
    marker: 'TABS com "Título da Aba N:" e "Conteúdo da Aba N:".',
  },
  timeline: {
    authorFills:
      'Pelo menos um evento com título; data e descrição opcionais. Orientação Vertical ou Horizontal.',
    learnerDoes: 'Percorre os eventos em ordem cronológica.',
    grading: 'Não dá nota.',
    marker: 'TIMELINE com "Orientação:", "Data:", "Título do Evento:" e "Descrição do Evento:".',
  },
  'interactive-image': {
    authorFills:
      'A imagem de fundo, o tamanho e pelo menos um ponto com título. A posição do ponto é arrastada na imagem; o conteúdo é opcional.',
    learnerDoes: 'Vê os pontos na imagem e clica em cada um para ler o título e o conteúdo.',
    grading: 'Não dá nota. Para pontos escondidos que valem nota, use Encontre na imagem.',
    marker:
      'HOTSPOT com "URL:", "Legenda:", "X do Ponto N:", "Y do Ponto N:" (em %), "Título do Ponto N:" e "Conteúdo do Ponto N:".',
  },
  quiz: {
    authorFills:
      'Pelo menos uma pergunta, cada uma com enunciado, dica opcional e de 3 a 5 alternativas com texto e feedback. Uma delas é marcada como correta.',
    learnerDoes: 'Escolhe uma alternativa, confirma e vê o feedback; a dica aparece se pedir.',
    grading: GRADING_ACTIVITY,
    marker:
      'QUIZ com "Pergunta:", de "Opção A:" até "Opção C:", "Opção D:" ou "Opção E:", e "Resposta Correta:". Pergunta com menos de 3 opções é descartada.',
  },
  'true-false': {
    authorFills:
      'Pelo menos 2 afirmações, cada uma com a resposta (verdadeira ou falsa) e uma explicação opcional.',
    learnerDoes:
      'Responde uma afirmação por vez, vê a resposta certa e a explicação e, no fim, a lista com acertos e erros.',
    grading: GRADING_ACTIVITY,
    marker: 'VERDADEIROFALSO com "Afirmação N:", "Resposta N:" e "Explicação N:".',
  },
  'fill-blanks': {
    authorFills:
      'O texto com cada resposta entre colchetes, como "Lave as mãos por [20] segundos". Opcional: palavras distratoras separadas por vírgula.',
    learnerDoes:
      'Toca numa palavra para colocá-la na lacuna destacada; toca numa lacuna preenchida para devolver a palavra. Maiúsculas e espaços não contam como erro.',
    grading: GRADING_ACTIVITY,
    marker: 'LACUNAS com "Texto:" e "Distratores:".',
  },
  matching: {
    authorFills:
      'Os pares, com os dois lados preenchidos. Opcional: uma imagem no item fixo, como a foto da ferramenta.',
    learnerDoes: 'Arrasta cada opção até o item, ou toca na opção e depois no item.',
    grading: GRADING_ACTIVITY,
    marker: 'ASSOCIACAO com "Item N:", "Correspondente N:" e "Imagem do Item N:".',
  },
  categorization: {
    authorFills: 'Pelo menos 2 categorias com nome, cada uma com pelo menos um item.',
    learnerDoes: 'Arrasta cada item para a categoria, ou toca no item e depois na categoria.',
    grading: GRADING_ACTIVITY,
    marker: 'CATEGORIZACAO com "Categoria N:" e "Item M da Categoria N:".',
  },
  sequence: {
    authorFills:
      'Pelo menos 3 passos, já na ordem correta. O player embaralha e nunca começa na ordem certa.',
    learnerDoes:
      'Move cada passo com as setas e clica em "Verificar ordem". A nota é quantos passos ficaram na posição certa.',
    grading: GRADING_ACTIVITY,
    marker: 'SEQUENCIA com "Passo N:".',
  },
  scenario: {
    authorFills:
      'A situação e pelo menos 2 opções, com pelo menos uma correta. Opcionais: nome e imagem do personagem e a consequência de cada opção.',
    learnerDoes:
      'Lê a fala do personagem, escolhe o que faz e vê a consequência. Se errar, pode tentar de novo.',
    grading: GRADING_ACTIVITY,
    marker:
      'CENARIO com "Personagem:", "Imagem do Personagem:", "Situação:", "Opção N:", "Consequência N:" e "Resposta Correta:".',
  },
  'find-in-image': {
    authorFills:
      'Os mesmos campos da Imagem interativa: imagem de fundo, tamanho e pontos com título. Os pontos ficam escondidos para o aluno.',
    learnerDoes:
      'Toca onde acha que está cada ponto; no teclado, as setas movem uma mira e Enter marca. Clique fora de qualquer ponto conta como erro. É "de primeira" com até 2 cliques errados.',
    grading: GRADING_ACTIVITY,
    marker: 'HOTSPOT com "Modo: encontrar" e os demais campos da imagem interativa.',
  },
  'interactive-video': {
    authorFills:
      'O vídeo (arquivo ou YouTube), um título e pelo menos uma pergunta com tempo (mm:ss) e alternativas.',
    learnerDoes: 'Assiste ao vídeo, que pausa nos tempos marcados para responder às perguntas.',
    grading: GRADING_ACTIVITY,
    marker:
      'VIDEOINTERATIVO com "URL:", "Título:", "Tempo da Pergunta N:", "Pergunta N:" e "Opção A da Pergunta N:" em diante.',
  },
}
