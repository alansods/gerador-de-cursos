import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { CursoGerado } from '@/types/gerador-curso'
import { normalizarCursoGerado, type ResumoGeracao } from '@/lib/blocos'
import { detectarMarcadores, type ModoLeitura } from '@/lib/marcadores'

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
    const { text, mode } = body as { text: string; mode?: ModoLeitura }

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return createErrorResponse('Texto não fornecido ou inválido', 400)
    }

    const modoLeitura: ModoLeitura = mode ?? detectarMarcadores(text).modo

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
    let course: CursoGerado
    let tokenUsage: TokenUsage | undefined

    if (geminiApiKey) {
      const result = await generateWithGemini(text, geminiApiKey, modoLeitura)
      course = result.course
      tokenUsage = result.tokenUsage
    } else if (openaiApiKey) {
      const result = await generateWithOpenAI(text, openaiApiKey, modoLeitura)
      course = result.course
      tokenUsage = result.tokenUsage
    } else {
      throw new Error('Nenhuma API de IA disponível')
    }

    const { curso: cursoNormalizado, resumo } = normalizarCursoGerado(course)
    registrarDescartes(resumo)

    return createSuccessResponse({
      course: cursoNormalizado,
      tokenUsage,
      resumo,
      modo: modoLeitura,
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

function registrarDescartes(resumo: ResumoGeracao) {
  if (resumo.descartados.length === 0) return

  console.warn(
    `⚠️ ${resumo.descartados.length} bloco(s) descartado(s) na normalização:`,
    resumo.descartados.map((d) => `${d.unidade} · ${d.tipo}: ${d.motivo}`).join(' | ')
  )
}

/**
 * Monta o prompt compartilhado para Gemini e OpenAI.
 * Inclui instruções para reconhecer os marcadores de recursos e gerar
 * o JSON correto para cada um dos tipos de bloco suportados.
 */
function buildPrompt(text: string, mode: ModoLeitura = 'auto'): string {
  const truncated =
    text.substring(0, 150000) + (text.length > 150000 ? '\n\n[... texto truncado ...]' : '')

  const sharedStructure = `## Estrutura geral do JSON

{
  "titulo": "string",
  "descricao": "string",
  "categoria": "string",
  "cargaHoraria": "X horas",
  "modalidade": "Online",
  "bannerVideoUrl": "string (opcional)",
  "unidades": [ <array de Unidade> ]
}

- "bannerVideoUrl" é o vídeo de apresentação do curso, exibido no banner da página
  inicial — NÃO é um bloco de unidade, fica na raiz do JSON. Preencha apenas com o link
  que vier após "VÍDEO INTRODUTÓRIO:" no cabeçalho do texto. Sem esse rótulo, omita o
  campo: nunca invente uma URL nem reaproveite o link de um bloco de vídeo.

Cada Unidade:
{
  "titulo": "string",
  "descricao": "string",
  "conteudo": [ <array de ConteudoUnidade> ]
}

## Recursos disponíveis

### 1. titulo
{ "titulo": "string", "tipo": "titulo", "conteudo": "Texto do título" }

### 2. subtitulo
{ "titulo": "string", "tipo": "subtitulo", "conteudo": "Texto do subtítulo" }

### 3. paragrafo
{ "titulo": "string", "tipo": "paragrafo", "conteudo": "<p>HTML</p>" }

### 4. lista
{
  "titulo": "string",
  "tipo": "lista",
  "conteudo": "",
  "tipoLista": "nao-ordenada" | "ordenada" | "check",
  "itensLista": [
    { "id": "li-1", "texto": "Primeiro item" },
    { "id": "li-2", "texto": "Segundo item" }
  ]
}
- Use "ordenada" para passos numerados de um processo
- Use "check" para requisitos, critérios ou itens verificáveis
- Use "nao-ordenada" para listas simples de itens

### 5. objetivos-aprendizagem
{
  "titulo": "string",
  "tipo": "objetivos-aprendizagem",
  "conteudo": "",
  "itensObjetivos": [
    { "id": "obj-1", "texto": "Identificar os componentes de um CLP" },
    { "id": "obj-2", "texto": "Configurar entradas e saídas digitais" }
  ]
}

### 6. info-box
{
  "titulo": "string",
  "tipo": "info-box",
  "conteudo": "<p>Conteúdo</p>",
  "tipoInfoBox": "atencao" | "saiba_mais" | "info" | "curiosidade",
  "tituloInfoBox": "Título da caixa"
}

### 7. accordion
{
  "titulo": "string",
  "tipo": "accordion",
  "conteudo": "",
  "items": [
    { "id": "item-1", "titulo": "Tópico 1", "conteudo": "<p>Detalhes</p>" },
    { "id": "item-2", "titulo": "Tópico 2", "conteudo": "<p>Detalhes</p>" }
  ]
}

### 8. flipcard — uma grade de cards; use de 2 a 4 cards por bloco
{
  "titulo": "string",
  "tipo": "flipcard",
  "conteudo": "",
  "itensFlipcard": [
    {
      "tipoFrente": "titulo",
      "tituloFrente": "Conceito ou pergunta na frente",
      "conteudoVerso": "<p>Explicação no verso</p>"
    }
  ]
}

### 9. quiz — OBRIGATÓRIO: exatamente 5 opções; apenas uma com "isCorrect": true
{
  "titulo": "string",
  "tipo": "quiz",
  "conteudo": "",
  "quizData": {
    "questions": [
      {
        "id": "q-1",
        "pergunta": "Pergunta?",
        "dica": "Dica opcional",
        "opcoes": [
          { "id": "op-1", "texto": "Opção A", "isCorrect": false, "feedback": "Explicação A" },
          { "id": "op-2", "texto": "Opção B", "isCorrect": true,  "feedback": "Correto! Explicação B" },
          { "id": "op-3", "texto": "Opção C", "isCorrect": false, "feedback": "Explicação C" },
          { "id": "op-4", "texto": "Opção D", "isCorrect": false, "feedback": "Explicação D" },
          { "id": "op-5", "texto": "Opção E", "isCorrect": false, "feedback": "Explicação E" }
        ]
      }
    ]
  }
}

### 10. imagem — apenas com URL presente no documento
{
  "titulo": "string",
  "tipo": "imagem",
  "conteudo": "https://exemplo.com/painel.png",
  "legenda": "Legenda da imagem",
  "fonte": "Crédito da imagem",
  "tamanho": "pequena" | "media" | "grande"
}

### 11. video — apenas com URL presente no documento
{
  "titulo": "string",
  "tipo": "video",
  "conteudo": "",
  "videoUrl": "https://www.youtube.com/watch?v=xxxxxxxxxxx",
  "videoTitulo": "Título do vídeo",
  "fonteVideo": "youtube"
}

### 11b. video-interativo — apenas com URL de arquivo de vídeo presente no documento
{
  "titulo": "string",
  "tipo": "video-interativo",
  "conteudo": "",
  "videoUrl": "https://exemplo.com/videos/aula.mp4",
  "videoTitulo": "Título do vídeo",
  "fonteVideo": "arquivo",
  "perguntasVideo": [
    {
      "id": "pv-1",
      "tempo": "01:30",
      "pergunta": "Pergunta?",
      "opcaoA": "Alternativa A",
      "opcaoB": "Alternativa B",
      "opcaoC": "Alternativa C",
      "correta": "B",
      "feedback": "Explicação mostrada depois da resposta"
    }
  ]
}

### 12. tabs
{
  "titulo": "string",
  "tipo": "tabs",
  "conteudo": "",
  "itensTabs": [
    { "id": "tab-1", "titulo": "Título da aba", "conteudo": "<p>HTML</p>" }
  ]
}

### 13. linha-do-tempo
{
  "titulo": "string",
  "tipo": "linha-do-tempo",
  "conteudo": "",
  "orientacaoTimeline": "vertical" | "horizontal",
  "itensTimeline": [
    {
      "id": "evento-1",
      "data": "1943",
      "titulo": "Título do evento",
      "descricao": "<p>HTML</p>"
    }
  ]
}

### 14. carrossel — apenas com URLs presentes no documento
{
  "titulo": "string",
  "tipo": "carrossel",
  "conteudo": "",
  "modoCarrossel": "carrossel" | "grade",
  "itensCarrossel": [
    {
      "id": "img-1",
      "url": "https://exemplo.com/foto.png",
      "legenda": "Legenda",
      "fonte": "Crédito"
    }
  ]
}

### 15. separador — só quando o documento marcar explicitamente
{ "titulo": "string", "tipo": "separador", "conteudo": "", "estiloSeparador": "linha" }

### 16. audio — apenas com URL presente no documento
{
  "titulo": "string",
  "tipo": "audio",
  "conteudo": "",
  "audioUrl": "https://exemplo.com/narracao.mp3",
  "audioTitulo": "Título do áudio",
  "transcricao": "<p>Transcrição em HTML</p>"
}

### 17. pdf — apenas com URL presente no documento
{
  "titulo": "string",
  "tipo": "pdf",
  "conteudo": "",
  "pdfUrl": "https://exemplo.com/ficha.pdf",
  "pdfTitulo": "Título do documento",
  "permitirDownloadPdf": true
}

### 18. imagem-interativa — apenas com URL presente no documento
{
  "titulo": "string",
  "tipo": "imagem-interativa",
  "conteudo": "",
  "imagemBase": "https://exemplo.com/equipamento.png",
  "legenda": "Legenda da imagem",
  "hotspots": [
    {
      "id": "hotspot-1",
      "x": 50,
      "y": 20,
      "titulo": "Nome da parte",
      "conteudo": "<p>Explicação exibida ao clicar</p>"
    }
  ]
}

### 19. associacao
{
  "titulo": "string",
  "tipo": "associacao",
  "conteudo": "",
  "paresAssociacao": [
    { "id": "par-1", "esquerda": "Termo fixo", "direita": "Correspondente" }
  ]
}

### 20. categorizacao
{
  "titulo": "string",
  "tipo": "categorizacao",
  "conteudo": "",
  "categorias": [
    {
      "id": "cat-1",
      "nome": "Nome da categoria",
      "itens": [{ "id": "cat-1-item-1", "texto": "Item que pertence a esta categoria" }]
    }
  ]
}

## Regras gerais

- NÃO use "aulas" — use sempre "conteudo"
- IDs únicos simples: "item-1", "q-1", "op-1"
- HTML (em campos "conteudo") apenas com: <p>, <strong>, <em>
- Para listas, use SEMPRE o campo "itensLista" — NUNCA coloque listas em HTML no campo "conteudo"
- Para objetivos de aprendizagem, use SEMPRE o campo "itensObjetivos"
- Retorne APENAS o JSON válido, sem markdown, sem explicações

## IMPORTANTE: Uso estrito do conteúdo do documento

⚠️ **REGRA FUNDAMENTAL**: Você DEVE usar ESTRITAMENTE o conteúdo presente no documento fornecido.

- NÃO invente, crie ou adicione informações que não estejam no texto original
- NÃO adicione exemplos, casos práticos, curiosidades ou contextos extras por conta própria
- NÃO expanda conceitos além do que está escrito no documento
- NUNCA gere blocos "imagem" ou "video" sem uma URL que apareça literalmente no documento —
  na ausência de URL, o bloco simplesmente não existe
- Use apenas as informações, exemplos e dados que foram explicitamente fornecidos no texto
- Se o documento for curto ou superficial, o curso gerado também deve refletir isso
- Sua função é ESTRUTURAR e ORGANIZAR o conteúdo existente, não criar conteúdo novo`

  if (mode === 'markers') {
    return `Você é um especialista em design instrucional. Analise o texto abaixo e gere uma estrutura de curso em JSON respeitando os marcadores de recursos presentes no texto.

${sharedStructure}

## Como converter os marcadores

- Bloco ACCORDION_INICIO...ACCORDION_FIM → tipo "accordion"
  - "Título do Item N:" → items[N].titulo
  - "Conteúdo do Item N:" → items[N].conteudo (em HTML)
- Bloco QUIZ_INICIO...QUIZ_FIM → tipo "quiz"
  - "Pergunta:" → quizData.questions[].pergunta
  - "Opção A/B/C/D/E:" → opcoes[] (identifique a correta pelo contexto)
  - "Resposta Correta:" → marque o isCorrect correspondente
- Bloco FLIPCARD_INICIO...FLIPCARD_FIM → tipo "flipcard" (UM único bloco com todos os cards)
  - "Frente do Card N:" ou "Título do Card N:" → itensFlipcard[N-1].tituloFrente
  - "Verso do Card N:" → itensFlipcard[N-1].conteudoVerso (em HTML)
  - "Imagem do Card N:" → itensFlipcard[N-1].imagemFrente
  - "Tipo de Frente do Card N:" → itensFlipcard[N-1].tipoFrente (titulo | imagem | imagem-titulo; use "titulo" se ausente)
  - Se os rótulos vierem sem numeração ("Frente:" / "Verso:"), gere um único card
- Bloco OBJETIVOS_INICIO...OBJETIVOS_FIM → tipo "objetivos-aprendizagem"
  - Cada linha "Objetivo:" → itensObjetivos[].texto
- Bloco INFOBOX_INICIO...INFOBOX_FIM → tipo "info-box"
  - "Tipo:" → tipoInfoBox (atencao | saiba_mais | info | curiosidade; use "info" se ausente)
  - "Título:" → tituloInfoBox
  - "Conteúdo:" → conteudo (em HTML)
- Bloco LISTA_INICIO...LISTA_FIM → tipo "lista"
  - "Tipo:" → tipoLista (ordenada | nao-ordenada | check; use "nao-ordenada" se ausente)
  - Cada linha "Item:" → itensLista[].texto
- Bloco IMAGEM_INICIO...IMAGEM_FIM → tipo "imagem"
  - "URL:" → conteudo; "Legenda:" → legenda; "Fonte:" → fonte; "Tamanho:" → tamanho
- Bloco VIDEO_INICIO...VIDEO_FIM → tipo "video"
  - "URL:" → videoUrl; "Título:" → videoTitulo
  - "fonteVideo": "arquivo" se a URL terminar em .mp4 ou .webm; caso contrário "youtube"
- Bloco VIDEOINTERATIVO_INICIO...VIDEOINTERATIVO_FIM → tipo "video-interativo" (UM único bloco com todas as perguntas)
  - "URL:" → videoUrl (arquivo .mp4/.webm ou link do YouTube); "Título:" → videoTitulo
  - "fonteVideo": "arquivo" se a URL terminar em .mp4 ou .webm; caso contrário "youtube"
  - "Tempo da Pergunta N:" → perguntasVideo[N-1].tempo (mantenha o formato mm:ss como está escrito)
  - "Pergunta N:" → perguntasVideo[N-1].pergunta
  - "Opção A/B/C/D/E da Pergunta N:" → perguntasVideo[N-1].opcaoA/opcaoB/opcaoC/opcaoD/opcaoE
  - "Resposta Correta da Pergunta N:" → perguntasVideo[N-1].correta (a letra, em maiúscula)
  - "Feedback da Pergunta N:" → perguntasVideo[N-1].feedback
  - Mínimo de 2 alternativas por pergunta; NUNCA invente um tempo que não esteja no documento
- Bloco TABS_INICIO...TABS_FIM → tipo "tabs"
  - "Título da Aba N:" → itensTabs[N].titulo
  - "Conteúdo da Aba N:" → itensTabs[N].conteudo (em HTML)
- Bloco TIMELINE_INICIO...TIMELINE_FIM → tipo "linha-do-tempo"
  - "Orientação:" → orientacaoTimeline (vertical | horizontal; use "vertical" se ausente)
  - "Data:" → itensTimeline[].data
  - "Título do Evento:" → itensTimeline[].titulo
  - "Descrição do Evento:" → itensTimeline[].descricao (em HTML)
- Bloco CARROSSEL_INICIO...CARROSSEL_FIM → tipo "carrossel"
  - "Exibição:" → modoCarrossel (carrossel | grade; use "carrossel" se ausente)
  - "URL da Imagem N:" → itensCarrossel[N].url
  - "Legenda da Imagem N:" → itensCarrossel[N].legenda
  - "Fonte da Imagem N:" → itensCarrossel[N].fonte
  - Nunca invente URL de imagem: sem URL, a imagem não entra
- Bloco SEPARADOR_INICIO...SEPARADOR_FIM → tipo "separador"
  - "Estilo:" → estiloSeparador (linha | espaco | linha-icone; use "linha" se ausente)
- Bloco AUDIO_INICIO...AUDIO_FIM → tipo "audio"
  - "URL:" → audioUrl; "Título:" → audioTitulo
  - "Transcrição:" → transcricao (em HTML)
  - Nunca invente URL de áudio: sem URL, o bloco não existe
- Bloco PDF_INICIO...PDF_FIM → tipo "pdf"
  - "URL:" → pdfUrl; "Título:" → pdfTitulo
  - "Permitir Download:" → permitirDownloadPdf (sim/não → true/false; use true se ausente)
  - Nunca invente URL de PDF: sem URL, o bloco não existe
- Bloco HOTSPOT_INICIO...HOTSPOT_FIM → tipo "imagem-interativa"
  - "URL:" → imagemBase; "Legenda:" → legenda
  - "X do Ponto N:" → hotspots[N].x; "Y do Ponto N:" → hotspots[N].y (números de 0 a 100)
  - "Título do Ponto N:" → hotspots[N].titulo
  - "Conteúdo do Ponto N:" → hotspots[N].conteudo (em HTML)
  - Nunca invente URL de imagem nem coordenadas: sem URL, o bloco não existe
- Bloco ASSOCIACAO_INICIO...ASSOCIACAO_FIM → tipo "associacao"
  - "Item N:" → paresAssociacao[N].esquerda
  - "Correspondente N:" → paresAssociacao[N].direita
  - Descarte o par que não tiver os dois lados; são necessários no mínimo 2 pares
- Bloco CATEGORIZACAO_INICIO...CATEGORIZACAO_FIM → tipo "categorizacao"
  - "Categoria N:" → categorias[N].nome
  - "Item M da Categoria N:" → categorias[N].itens[M].texto
  - São necessárias no mínimo 2 categorias, cada uma com ao menos 1 item
- Conteúdo fora de marcadores → use titulo, subtitulo, paragrafo ou lista conforme adequado

## Texto para analisar

${truncated}`
  }

  return `Você é um especialista em design instrucional. Analise o texto abaixo e gere uma estrutura de curso em JSON, escolhendo automaticamente o recurso mais adequado para cada parte do conteúdo.

${sharedStructure}

## Diretrizes de escolha automática

- Título de seção explícito, diferente do título da unidade → titulo
- Divisão interna de uma seção → subtitulo
- Texto introdutório ou explicativo → paragrafo
- "Objetivos", "ao final desta unidade você será capaz de" → objetivos-aprendizagem
- Lista de ingredientes, materiais, características → lista (tipoLista: "nao-ordenada")
- Passos numerados de um processo → lista (tipoLista: "ordenada")
- Requisitos, critérios verificáveis → lista (tipoLista: "check")
- 3 ou mais tópicos relacionados com subconteúdo → accordion
- 2 a 5 alternativas comparáveis do mesmo assunto (perfis, abordagens, papéis) → tabs
- Fatos com data, evolução histórica, cronologia de etapas → linha-do-tempo
- 2 a 4 termos técnicos com definição, ou perguntas retóricas com resposta → UM bloco flipcard com um card para cada; NUNCA gere vários blocos flipcard seguidos
- 4 ou mais pares "termo — definição" do mesmo assunto → associacao
- Itens explicitamente agrupados em 2 ou mais conjuntos nomeados → categorizacao
- "Atenção:", "Importante:", aviso de segurança → info-box (tipoInfoBox: "atencao")
- "Sabia que", curiosidade, fato interessante → info-box (tipoInfoBox: "curiosidade")
- URL de imagem no texto → imagem, com a legenda que estiver ao lado
- URL de YouTube ou Vimeo no texto → video
- URL de arquivo .mp3, .m4a ou .ogg no texto → audio
- URL de arquivo .pdf no texto → pdf
- Revisão ao final de cada unidade → quiz (1 a 3 perguntas baseadas no conteúdo real)
- Use ao menos 1 recurso interativo (accordion, tabs, quiz ou flipcard) por unidade
- NUNCA gere o bloco separador no modo automático
- NUNCA gere o bloco imagem-interativa no modo automático: as coordenadas dos pontos precisam vir do documento
- NUNCA gere o bloco video-interativo no modo automático: os tempos das perguntas precisam vir do documento, e você não assiste ao vídeo

## Texto para analisar

${truncated}`
}

/**
 * Gera curso usando Google Gemini
 */
async function generateWithGemini(
  text: string,
  apiKey: string,
  mode: ModoLeitura = 'auto'
): Promise<{ course: CursoGerado; tokenUsage: TokenUsage }> {
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

      const courseData = JSON.parse(jsonText) as CursoGerado

      // Validar estrutura básica
      if (!courseData.titulo || !courseData.descricao) {
        throw new Error('Resposta da IA não contém título ou descrição válidos')
      }

      // Garantir que unidades seja um array
      if (!Array.isArray(courseData.unidades)) {
        courseData.unidades = []
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
  mode: ModoLeitura = 'auto'
): Promise<{ course: CursoGerado; tokenUsage: TokenUsage }> {
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

    const courseData = JSON.parse(jsonText) as CursoGerado

    // Validar estrutura básica
    if (!courseData.titulo || !courseData.descricao) {
      throw new Error('Resposta da IA não contém título ou descrição válidos')
    }

    // Garantir que unidades seja um array
    if (!Array.isArray(courseData.unidades)) {
      courseData.unidades = []
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
