import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Course } from '@/types/course'
import { normalizeCourse, type GenerationSummary } from '@/lib/blocks'
import { detectMarkers, type ReadMode } from '@/lib/markers'
import { upgradeCourse } from '@/lib/legacy-course'

export const maxDuration = 60

interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  model: string
}

/**
 * POST /api/generate-course-from-text
 * Gera um curso estruturado a partir de texto usando IA
 */
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult // Retorna erro 401 se não autenticado
  }

  try {
    const body = await req.json()
    const { text, mode } = body as { text: string; mode?: ReadMode }

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return createErrorResponse('Texto não fornecido ou inválido', 400)
    }

    const readMode: ReadMode = mode ?? detectMarkers(text).mode

    // Verificar se há API key configurada
    const geminiApiKey = process.env.GEMINI_API_KEY
    const openaiApiKey = process.env.OPENAI_API_KEY

    if (!geminiApiKey && !openaiApiKey) {
      return createErrorResponse(
        'API de IA não configurada. Configure GEMINI_API_KEY ou OPENAI_API_KEY nas variáveis de ambiente.',
        500
      )
    }

    // Usar Google Gemini se disponível, senão OpenAI
    let course: Course
    let tokenUsage: TokenUsage | undefined

    if (geminiApiKey) {
      const result = await generateWithGemini(text, geminiApiKey, readMode)
      course = result.course
      tokenUsage = result.tokenUsage
    } else if (openaiApiKey) {
      const result = await generateWithOpenAI(text, openaiApiKey, readMode)
      course = result.course
      tokenUsage = result.tokenUsage
    } else {
      throw new Error('Nenhuma API de IA disponível')
    }

    const { course: normalizedCourse, summary } = normalizeCourse(
      upgradeCourse(course as unknown as Record<string, unknown>) as unknown as Course
    )
    recordDiscards(summary)

    return createSuccessResponse({
      course: normalizedCourse,
      tokenUsage,
      summary,
      mode: readMode,
    })
  } catch (error) {
    console.error('Erro ao gerar curso:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Erro ao gerar curso com IA',
      500,
      error
    )
  }
}

function recordDiscards(summary: GenerationSummary) {
  if (summary.discarded.length === 0) return

  console.warn(
    `⚠️ ${summary.discarded.length} bloco(s) descartado(s) na normalização:`,
    summary.discarded.map((d) => `${d.unit} · ${d.type}: ${d.reason}`).join(' | ')
  )
}

/**
 * Monta o prompt compartilhado para Gemini e OpenAI.
 * Inclui instruções para reconhecer os marcadores de recursos e gerar
 * o JSON correto para cada um dos tipos de bloco suportados.
 */
function buildPrompt(text: string, mode: ReadMode = 'auto'): string {
  const truncated =
    text.substring(0, 150000) + (text.length > 150000 ? '\n\n[... texto truncado ...]' : '')

  const sharedStructure = `## Estrutura geral do JSON

{
  "title": "string",
  "description": "string",
  "category": "string",
  "workload": "X horas",
  "modality": "Online",
  "bannerVideoUrl": "string (opcional)",
  "units": [ <array de Unidade> ]
}

- "bannerVideoUrl" é o vídeo de apresentação do curso, exibido no banner da página
  inicial — NÃO é um bloco de unidade, fica na raiz do JSON. Preencha apenas com o link
  que vier após "VÍDEO INTRODUTÓRIO:" no cabeçalho do texto. Sem esse rótulo, omita o
  campo: nunca invente uma URL nem reaproveite o link de um bloco de vídeo.

Cada Unidade:
{
  "title": "string",
  "description": "string",
  "content": [ <array de Bloco> ]
}

## Recursos disponíveis

### 1. heading
{ "title": "string", "type": "heading", "content": "Texto do título" }

### 2. subheading
{ "title": "string", "type": "subheading", "content": "Texto do subtítulo" }

### 3. paragraph
{ "title": "string", "type": "paragraph", "content": "<p>HTML</p>" }

### 4. list
{
  "title": "string",
  "type": "list",
  "content": "",
  "listType": "unordered" | "ordered" | "check",
  "listItems": [
    { "id": "li-1", "text": "Primeiro item" },
    { "id": "li-2", "text": "Segundo item" }
  ]
}
- Use "ordered" para passos numerados de um processo
- Use "check" para requisitos, critérios ou itens verificáveis
- Use "unordered" para listas simples de itens

### 5. learning-objectives
{
  "title": "string",
  "type": "learning-objectives",
  "content": "",
  "objectiveItems": [
    { "id": "obj-1", "text": "Identificar os componentes de um CLP" },
    { "id": "obj-2", "text": "Configurar entradas e saídas digitais" }
  ]
}

### 6. info-box
{
  "title": "string",
  "type": "info-box",
  "content": "<p>Conteúdo</p>",
  "infoBoxType": "warning" | "learn-more" | "info" | "fun-fact",
  "infoBoxTitle": "Título da caixa"
}

### 7. accordion
{
  "title": "string",
  "type": "accordion",
  "content": "",
  "items": [
    { "id": "item-1", "title": "Tópico 1", "content": "<p>Detalhes</p>" },
    { "id": "item-2", "title": "Tópico 2", "content": "<p>Detalhes</p>" }
  ]
}

### 8. flipcard — uma grade de cards; use de 2 a 4 cards por bloco
{
  "title": "string",
  "type": "flipcard",
  "content": "",
  "flipcardItems": [
    {
      "frontType": "title",
      "frontTitle": "Conceito ou pergunta na frente",
      "backContent": "<p>Explicação no verso</p>"
    }
  ]
}

### 9. quiz — OBRIGATÓRIO: exatamente 5 opções; apenas uma com "isCorrect": true
{
  "title": "string",
  "type": "quiz",
  "content": "",
  "quizData": {
    "questions": [
      {
        "id": "q-1",
        "question": "Pergunta?",
        "hint": "Dica opcional",
        "options": [
          { "id": "op-1", "text": "Opção A", "isCorrect": false, "feedback": "Explicação A" },
          { "id": "op-2", "text": "Opção B", "isCorrect": true,  "feedback": "Correto! Explicação B" },
          { "id": "op-3", "text": "Opção C", "isCorrect": false, "feedback": "Explicação C" },
          { "id": "op-4", "text": "Opção D", "isCorrect": false, "feedback": "Explicação D" },
          { "id": "op-5", "text": "Opção E", "isCorrect": false, "feedback": "Explicação E" }
        ]
      }
    ]
  }
}

### 10. image — apenas com URL presente no documento
{
  "title": "string",
  "type": "image",
  "content": "https://exemplo.com/painel.png",
  "caption": "Legenda da imagem",
  "source": "Crédito da imagem",
  "size": "small" | "medium" | "large"
}

### 11. video — apenas com URL presente no documento
{
  "title": "string",
  "type": "video",
  "content": "",
  "videoUrl": "https://www.youtube.com/watch?v=xxxxxxxxxxx",
  "videoTitle": "Título do vídeo",
  "videoSource": "youtube"
}

### 11b. interactive-video — apenas com URL de arquivo de vídeo presente no documento
{
  "title": "string",
  "type": "interactive-video",
  "content": "",
  "videoUrl": "https://exemplo.com/videos/aula.mp4",
  "videoTitle": "Título do vídeo",
  "videoSource": "file",
  "videoQuestions": [
    {
      "id": "pv-1",
      "time": "01:30",
      "question": "Pergunta?",
      "optionA": "Alternativa A",
      "optionB": "Alternativa B",
      "optionC": "Alternativa C",
      "correct": "B",
      "feedback": "Explicação mostrada depois da resposta"
    }
  ]
}

### 12. tabs
{
  "title": "string",
  "type": "tabs",
  "content": "",
  "tabItems": [
    { "id": "tab-1", "title": "Título da aba", "content": "<p>HTML</p>" }
  ]
}

### 13. timeline
{
  "title": "string",
  "type": "timeline",
  "content": "",
  "timelineOrientation": "vertical" | "horizontal",
  "timelineItems": [
    {
      "id": "timeline-1",
      "date": "1943",
      "title": "Título do evento",
      "description": "<p>HTML</p>"
    }
  ]
}

### 14. carousel — apenas com URLs presentes no documento
{
  "title": "string",
  "type": "carousel",
  "content": "",
  "carouselMode": "carousel" | "grid",
  "carouselItems": [
    {
      "id": "img-1",
      "url": "https://exemplo.com/foto.png",
      "caption": "Legenda",
      "source": "Crédito"
    }
  ]
}

### 15. divider — só quando o documento marcar explicitamente
{ "title": "string", "type": "divider", "content": "", "dividerStyle": "line" }

### 16. audio — apenas com URL presente no documento
{
  "title": "string",
  "type": "audio",
  "content": "",
  "audioUrl": "https://exemplo.com/narracao.mp3",
  "audioTitle": "Título do áudio",
  "transcript": "<p>Transcrição em HTML</p>"
}

### 17. pdf — apenas com URL presente no documento
{
  "title": "string",
  "type": "pdf",
  "content": "",
  "pdfUrl": "https://exemplo.com/ficha.pdf",
  "pdfTitle": "Título do documento",
  "allowPdfDownload": true
}

### 18. interactive-image — apenas com URL presente no documento
{
  "title": "string",
  "type": "interactive-image",
  "content": "",
  "baseImage": "https://exemplo.com/equipamento.png",
  "caption": "Legenda da imagem",
  "hotspots": [
    {
      "id": "hotspot-1",
      "x": 50,
      "y": 20,
      "title": "Nome da parte",
      "content": "<p>Explicação exibida ao clicar</p>"
    }
  ]
}

### 19. matching
{
  "title": "string",
  "type": "matching",
  "content": "",
  "matchingPairs": [
    { "id": "par-1", "left": "Termo fixo", "right": "Correspondente" }
  ]
}

### 20. categorization
{
  "title": "string",
  "type": "categorization",
  "content": "",
  "categories": [
    {
      "id": "cat-1",
      "name": "Nome da category",
      "items": [{ "id": "cat-1-item-1", "text": "Item que pertence a esta categoria" }]
    }
  ]
}

## Regras gerais

- NÃO use "blocks" — use sempre "content"
- IDs únicos simples: "item-1", "q-1", "op-1"
- HTML (em campos "content") apenas com: <p>, <strong>, <em>
- Para listas, use SEMPRE o campo "listItems" — NUNCA coloque listas em HTML no campo "content"
- Para objetivos de aprendizagem, use SEMPRE o campo "objectiveItems"
- Retorne APENAS o JSON válido, sem markdown, sem explicações

## IMPORTANTE: Uso estrito do conteúdo do documento

⚠️ **REGRA FUNDAMENTAL**: Você DEVE usar ESTRITAMENTE o conteúdo presente no documento fornecido.

- NÃO invente, crie ou adicione informações que não estejam no texto original
- NÃO adicione exemplos, casos práticos, curiosidades ou contextos extras por conta própria
- NÃO expanda conceitos além do que está escrito no documento
- NUNCA gere blocos "image" ou "video" sem uma URL que apareça literalmente no documento —
  na ausência de URL, o bloco simplesmente não existe
- Use apenas as informações, exemplos e dados que foram explicitamente fornecidos no texto
- Se o documento for curto ou superficial, o curso gerado também deve refletir isso
- Sua função é ESTRUTURAR e ORGANIZAR o conteúdo existente, não criar conteúdo novo`

  if (mode === 'markers') {
    return `Você é um especialista em design instrucional. Analise o texto abaixo e gere uma estrutura de curso em JSON respeitando os marcadores de recursos presentes no text.

${sharedStructure}

## Como converter os marcadores

- Bloco ACCORDION_INICIO...ACCORDION_FIM → type "accordion"
  - "Título do Item N:" → items[N].title
  - "Conteúdo do Item N:" → items[N].content (em HTML)
- Bloco QUIZ_INICIO...QUIZ_FIM → type "quiz"
  - "Pergunta:" → quizData.questions[].question
  - "Opção A/B/C/D/E:" → options[] (identifique a correta pelo contexto)
  - "Resposta Correta:" → marque o isCorrect correspondente
- Bloco FLIPCARD_INICIO...FLIPCARD_FIM → type "flipcard" (UM único bloco com todos os cards)
  - "Frente do Card N:" ou "Título do Card N:" → flipcardItems[N-1].frontTitle
  - "Verso do Card N:" → flipcardItems[N-1].backContent (em HTML)
  - "Imagem do Card N:" → flipcardItems[N-1].frontImage
  - "Tipo de Frente do Card N:" → flipcardItems[N-1].frontType (title | image | image-title; use "title" se ausente)
  - Se os rótulos vierem sem numeração ("Frente:" / "Verso:"), gere um único card
- Bloco OBJETIVOS_INICIO...OBJETIVOS_FIM → type "learning-objectives"
  - Cada linha "Objetivo:" → objectiveItems[].text
- Bloco INFOBOX_INICIO...INFOBOX_FIM → type "info-box"
  - "Tipo:" → infoBoxType (warning | learn-more | info | fun-fact; use "info" se ausente)
  - "Título:" → infoBoxTitle
  - "Conteúdo:" → content (em HTML)
- Bloco LISTA_INICIO...LISTA_FIM → type "list"
  - "Tipo:" → listType (ordered | unordered | check; use "unordered" se ausente)
  - Cada linha "Item:" → listItems[].text
- Bloco IMAGEM_INICIO...IMAGEM_FIM → type "image"
  - "URL:" → content; "Legenda:" → caption; "Fonte:" → source; "Tamanho:" → size
- Bloco VIDEO_INICIO...VIDEO_FIM → type "video"
  - "URL:" → videoUrl; "Título:" → videoTitle
  - "videoSource": "file" se a URL terminar em .mp4 ou .webm; caso contrário "youtube"
- Bloco VIDEOINTERATIVO_INICIO...VIDEOINTERATIVO_FIM → type "interactive-video" (UM único bloco com todas as perguntas)
  - "URL:" → videoUrl (arquivo .mp4/.webm ou link do YouTube); "Título:" → videoTitle
  - "videoSource": "file" se a URL terminar em .mp4 ou .webm; caso contrário "youtube"
  - "Tempo da Pergunta N:" → videoQuestions[N-1].time (mantenha o formato mm:ss como está escrito)
  - "Pergunta N:" → videoQuestions[N-1].question
  - "Opção A/B/C/D/E da Pergunta N:" → videoQuestions[N-1].optionA/optionB/optionC/optionD/optionE
  - "Resposta Correta da Pergunta N:" → videoQuestions[N-1].correct (a letra, em maiúscula)
  - "Feedback da Pergunta N:" → videoQuestions[N-1].feedback
  - Mínimo de 2 alternativas por pergunta; NUNCA invente um tempo que não esteja no documento
- Bloco TABS_INICIO...TABS_FIM → type "tabs"
  - "Título da Aba N:" → tabItems[N].title
  - "Conteúdo da Aba N:" → tabItems[N].content (em HTML)
- Bloco TIMELINE_INICIO...TIMELINE_FIM → type "timeline"
  - "Orientação:" → timelineOrientation (vertical | horizontal; use "vertical" se ausente)
  - "Data:" → timelineItems[].date
  - "Título do Evento:" → timelineItems[].title
  - "Descrição do Evento:" → timelineItems[].description (em HTML)
- Bloco CARROSSEL_INICIO...CARROSSEL_FIM → type "carousel"
  - "Exibição:" → carouselMode (carousel | grid; use "carousel" se ausente)
  - "URL da Imagem N:" → carouselItems[N].url
  - "Legenda da Imagem N:" → carouselItems[N].caption
  - "Fonte da Imagem N:" → carouselItems[N].source
  - Nunca invente URL de imagem: sem URL, a imagem não entra
- Bloco SEPARADOR_INICIO...SEPARADOR_FIM → type "divider"
  - "Estilo:" → dividerStyle (line | space | line-icon; use "line" se ausente)
- Bloco AUDIO_INICIO...AUDIO_FIM → type "audio"
  - "URL:" → audioUrl; "Título:" → audioTitle
  - "Transcrição:" → transcript (em HTML)
  - Nunca invente URL de áudio: sem URL, o bloco não existe
- Bloco PDF_INICIO...PDF_FIM → type "pdf"
  - "URL:" → pdfUrl; "Título:" → pdfTitle
  - "Permitir Download:" → allowPdfDownload (sim/não → true/false; use true se ausente)
  - Nunca invente URL de PDF: sem URL, o bloco não existe
- Bloco HOTSPOT_INICIO...HOTSPOT_FIM → type "interactive-image"
  - "URL:" → baseImage; "Legenda:" → caption
  - "X do Ponto N:" → hotspots[N].x; "Y do Ponto N:" → hotspots[N].y (números de 0 a 100)
  - "Título do Ponto N:" → hotspots[N].title
  - "Conteúdo do Ponto N:" → hotspots[N].content (em HTML)
  - Nunca invente URL de imagem nem coordenadas: sem URL, o bloco não existe
- Bloco ASSOCIACAO_INICIO...ASSOCIACAO_FIM → type "matching"
  - "Item N:" → matchingPairs[N].left
  - "Correspondente N:" → matchingPairs[N].right
  - Descarte o par que não tiver os dois lados; são necessários no mínimo 2 pares
- Bloco CATEGORIZACAO_INICIO...CATEGORIZACAO_FIM → type "categorization"
  - "Categoria N:" → categories[N].name
  - "Item M da Categoria N:" → categories[N].items[M].text
  - São necessárias no mínimo 2 categories, cada uma com ao menos 1 item
- Conteúdo fora de marcadores → use title, subtitulo, paragrafo ou lista conforme adequado

## Texto para analisar

${truncated}`
  }

  return `Você é um especialista em design instrucional. Analise o texto abaixo e gere uma estrutura de curso em JSON, escolhendo automaticamente o recurso mais adequado para cada parte do conteúdo.

${sharedStructure}

## Diretrizes de escolha automática

- Título de seção explícito, diferente do título da unidade → heading
- Divisão interna de uma seção → subheading
- Texto introdutório ou explicativo → paragraph
- "Objetivos", "ao final desta unidade você será capaz de" → learning-objectives
- Lista de ingredientes, materiais, características → list (listType: "unordered")
- Passos numerados de um processo → list (listType: "ordered")
- Requisitos, critérios verificáveis → list (listType: "check")
- 3 ou mais tópicos relacionados com subconteúdo → accordion
- 2 a 5 alternativas comparáveis do mesmo assunto (perfis, abordagens, papéis) → tabs
- Fatos com date, evolução histórica, cronologia de etapas → timeline
- 2 a 4 termos técnicos com definição, ou perguntas retóricas com resposta → UM bloco flipcard com um card para cada; NUNCA gere vários blocos flipcard seguidos
- 4 ou mais pares "termo — definição" do mesmo assunto → matching
- Itens explicitamente agrupados em 2 ou mais conjuntos nomeados → categorization
- "Atenção:", "Importante:", aviso de segurança → info-box (infoBoxType: "warning")
- "Sabia que", curiosidade, fato interessante → info-box (infoBoxType: "fun-fact")
- URL de imagem no texto → image, com a legenda que estiver ao lado
- URL de YouTube ou Vimeo no texto → video
- URL de arquivo .mp3, .m4a ou .ogg no texto → audio
- URL de arquivo .pdf no texto → pdf
- Revisão ao final de cada unidade → quiz (1 a 3 perguntas baseadas no conteúdo real)
- Use ao menos 1 recurso interativo (accordion, tabs, quiz ou flipcard) por unidade
- NUNCA gere o bloco divider no modo automático
- NUNCA gere o bloco interactive-image no modo automático: as coordenadas dos pontos precisam vir do documento
- NUNCA gere o bloco interactive-video no modo automático: os tempos das perguntas precisam vir do documento, e você não assiste ao vídeo

## Texto para analisar

${truncated}`
}

/**
 * Gera curso usando Google Gemini
 */
async function generateWithGemini(
  text: string,
  apiKey: string,
  mode: ReadMode = 'auto'
): Promise<{ course: Course; tokenUsage: TokenUsage }> {
  const genAI = new GoogleGenerativeAI(apiKey)

  const prompt = buildPrompt(text, mode)

  // Tentar diferentes modelos em ordem de preferência (nomes atualizados 2025+)
  // Referência: https://ai.google.dev/models/gemini
  const modelNames = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash-latest']
  let lastError: Error | null = null

  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName })
      console.log(`🔄 Tentando modelo: ${modelName}`)

      const result = await model.generateContent(prompt)
      const response = result.response
      const generatedText = response.text()

      console.log(`✅ Modelo ${modelName} funcionou!`)

      // Extrair JSON da resposta (pode vir com markdown code blocks)
      let jsonText = generatedText.trim()

      // Remover markdown code blocks se existirem
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '')
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '')
      }

      const courseData = JSON.parse(jsonText) as Course

      // Validar estrutura básica
      if (!courseData.title || !courseData.description) {
        throw new Error('Resposta da IA não contém título ou descrição válidos')
      }

      // Garantir que unidades seja um array
      if (!Array.isArray(courseData.units)) {
        courseData.units = []
      }

      const tokenUsage: TokenUsage = {
        promptTokens: response.usageMetadata?.promptTokenCount ?? 0,
        completionTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
        totalTokens: response.usageMetadata?.totalTokenCount ?? 0,
        model: modelName,
      }

      return { course: courseData, tokenUsage }
    } catch (error) {
      console.error(`❌ Erro com modelo ${modelName}:`, error)
      lastError = error instanceof Error ? error : new Error(String(error))

      // Continuar para próximo modelo em caso de erro de modelo não encontrado ou quota excedida
      const isRetryable =
        error instanceof Error &&
        (error.message.includes('not found') ||
          error.message.includes('404') ||
          error.message.includes('429') ||
          error.message.includes('quota') ||
          error.message.includes('Too Many Requests') ||
          error.message.includes('RESOURCE_EXHAUSTED'))
      if (!isRetryable) {
        throw error
      }

      // Continuar para o próximo modelo
      continue
    }
  }

  // Se chegou aqui, nenhum modelo funcionou
  throw new Error(
    `Nenhum modelo Gemini disponível. Tentei: ${modelNames.join(', ')}. Último erro: ${lastError?.message || 'Desconhecido'}`
  )
}

/**
 * Gera curso usando OpenAI
 */
async function generateWithOpenAI(
  text: string,
  apiKey: string,
  mode: ReadMode = 'auto'
): Promise<{ course: Course; tokenUsage: TokenUsage }> {
  const { default: OpenAI } = await import('openai')
  const openai = new OpenAI({ apiKey })

  const prompt = buildPrompt(text, mode)

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'Você é um especialista em criação de cursos online. Retorne sempre JSON válido.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    })

    const generatedText = completion.choices[0]?.message?.content

    if (!generatedText) {
      throw new Error('Resposta vazia da API OpenAI')
    }

    // Extrair JSON da resposta
    let jsonText = generatedText.trim()

    // Remover markdown code blocks se existirem
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '')
    }

    const courseData = JSON.parse(jsonText) as Course

    // Validar estrutura básica
    if (!courseData.title || !courseData.description) {
      throw new Error('Resposta da IA não contém título ou descrição válidos')
    }

    // Garantir que unidades seja um array
    if (!Array.isArray(courseData.units)) {
      courseData.units = []
    }

    const tokenUsage: TokenUsage = {
      promptTokens: completion.usage?.prompt_tokens ?? 0,
      completionTokens: completion.usage?.completion_tokens ?? 0,
      totalTokens: completion.usage?.total_tokens ?? 0,
      model: completion.model,
    }

    return { course: courseData, tokenUsage }
  } catch (error) {
    console.error('Erro ao gerar com OpenAI:', error)
    throw new Error(
      `Erro ao processar resposta da IA: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    )
  }
}
