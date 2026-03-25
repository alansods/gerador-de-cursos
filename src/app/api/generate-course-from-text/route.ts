import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CursoGerado } from '@/types/gerador-curso';

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
}

/**
 * POST /api/generate-course-from-text
 * Gera um curso estruturado a partir de texto usando IA
 */
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);

  if (authResult instanceof NextResponse) {
    return authResult; // Retorna erro 401 se não autenticado
  }

  try {
    const body = await req.json();
    const { text, mode = 'auto' } = body as { text: string; mode?: 'auto' | 'markers' };

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return createErrorResponse('Texto não fornecido ou inválido', 400);
    }

    // Verificar se há API key configurada
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!geminiApiKey && !openaiApiKey) {
      return createErrorResponse(
        'API de IA não configurada. Configure GEMINI_API_KEY ou OPENAI_API_KEY nas variáveis de ambiente.',
        500
      );
    }

    // Usar Google Gemini se disponível, senão OpenAI
    let course: CursoGerado;
    let tokenUsage: TokenUsage | undefined;

    if (geminiApiKey) {
      const result = await generateWithGemini(text, geminiApiKey, mode);
      course = result.course;
      tokenUsage = result.tokenUsage;
    } else if (openaiApiKey) {
      const result = await generateWithOpenAI(text, openaiApiKey, mode);
      course = result.course;
      tokenUsage = result.tokenUsage;
    } else {
      throw new Error('Nenhuma API de IA disponível');
    }

    return createSuccessResponse({ course, tokenUsage });
  } catch (error) {
    console.error('Erro ao gerar curso:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Erro ao gerar curso com IA',
      500,
      error
    );
  }
}

/**
 * Monta o prompt compartilhado para Gemini e OpenAI.
 * Inclui instruções para reconhecer os marcadores de recursos interativos
 * (ACCORDION_INICIO/FIM, QUIZ_INICIO/FIM, FLIPCARD_INICIO/FIM) e gerar
 * o JSON correto para cada tipo.
 */
function buildPrompt(text: string, mode: 'auto' | 'markers' = 'auto'): string {
  const truncated = text.substring(0, 12000) + (text.length > 12000 ? '\n\n[... texto truncado ...]' : '');

  const sharedStructure = `## Estrutura geral do JSON

{
  "titulo": "string",
  "descricao": "string",
  "categoria": "string",
  "cargaHoraria": "X horas",
  "modalidade": "Online",
  "unidades": [ <array de Unidade> ]
}

Cada Unidade:
{
  "titulo": "string",
  "descricao": "string",
  "conteudo": [ <array de ConteudoUnidade> ]
}

## Recursos disponíveis

### 1. paragrafo
{ "titulo": "string", "tipo": "paragrafo", "conteudo": "<p>HTML</p>" }

### 2. subtitulo
{ "titulo": "string", "tipo": "subtitulo", "conteudo": "Texto do subtítulo" }

### 3. lista
{ "titulo": "string", "tipo": "lista", "conteudo": "<ul><li>item</li></ul> ou <ol><li>passo</li></ol>" }

### 4. accordion
{
  "titulo": "string",
  "tipo": "accordion",
  "conteudo": "",
  "items": [
    { "id": "item-1", "titulo": "Tópico 1", "conteudo": "<p>Detalhes</p>" },
    { "id": "item-2", "titulo": "Tópico 2", "conteudo": "<p>Detalhes</p>" }
  ]
}

### 5. quiz — OBRIGATÓRIO: exatamente 5 opções; apenas uma com "isCorrect": true
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

### 6. flipcard
{
  "titulo": "string",
  "tipo": "flipcard",
  "conteudo": "",
  "tipoFrente": "titulo",
  "tituloFrente": "Conceito ou pergunta na frente",
  "conteudoVerso": "<p>Explicação no verso</p>"
}

### 7. info-box
{
  "titulo": "string",
  "tipo": "info-box",
  "conteudo": "<p>Conteúdo</p>",
  "tipoInfoBox": "atencao" | "saiba_mais" | "info" | "curiosidade",
  "tituloInfoBox": "Título da caixa"
}

## Regras gerais

- NÃO use "aulas" — use sempre "conteudo"
- IDs únicos simples: "item-1", "q-1", "op-1"
- HTML apenas com: <p>, <ul>, <ol>, <li>, <strong>, <em>
- Retorne APENAS o JSON válido, sem markdown, sem explicações

## IMPORTANTE: Uso estrito do conteúdo do documento

⚠️ **REGRA FUNDAMENTAL**: Você DEVE usar ESTRITAMENTE o conteúdo presente no documento fornecido.

- NÃO invente, crie ou adicione informações que não estejam no texto original
- NÃO adicione exemplos, casos práticos, curiosidades ou contextos extras por conta própria
- NÃO expanda conceitos além do que está escrito no documento
- Use apenas as informações, exemplos e dados que foram explicitamente fornecidos no texto
- Se o documento for curto ou superficial, o curso gerado também deve refletir isso
- Sua função é ESTRUTURAR e ORGANIZAR o conteúdo existente, não criar conteúdo novo`;

  if (mode === 'markers') {
    return `Você é um especialista em design instrucional. Analise o texto abaixo e gere uma estrutura de curso em JSON respeitando os marcadores de recursos interativos presentes no texto.

${sharedStructure}

## Como converter os marcadores

- Bloco ACCORDION_INICIO...ACCORDION_FIM → tipo "accordion"
  - "Título do Item N:" → items[N].titulo
  - "Conteúdo do Item N:" → items[N].conteudo (em HTML)
- Bloco QUIZ_INICIO...QUIZ_FIM → tipo "quiz"
  - "Pergunta:" → quizData.questions[].pergunta
  - "Opção A/B/C/D/E:" → opcoes[] (identifique a correta pelo contexto)
  - "Resposta Correta:" → marque o isCorrect correspondente
- Bloco FLIPCARD_INICIO...FLIPCARD_FIM → tipo "flipcard"
  - "Frente:" ou "Título:" → tituloFrente
  - "Verso:" → conteudoVerso (em HTML)
- Conteúdo fora de marcadores → use paragrafo, subtitulo ou lista conforme adequado

## Texto para analisar

${truncated}`;
  }

  // mode === 'auto'
  return `Você é um especialista em design instrucional. Analise o texto abaixo e gere uma estrutura de curso em JSON, escolhendo automaticamente o recurso mais adequado para cada parte do conteúdo.

${sharedStructure}

## Diretrizes de escolha automática

- Texto introdutório ou explicativo → paragrafo
- Lista de ingredientes, materiais, requisitos, características → lista
- Passos numerados de um processo → lista com <ol>
- 3 ou mais tópicos relacionados com subconteúdo → accordion
- Termo técnico + definição, pergunta retórica + resposta → flipcard
- "Atenção:", "Importante:", aviso de segurança → info-box (tipoInfoBox: "atencao")
- "Sabia que", curiosidade, fato interessante → info-box (tipoInfoBox: "curiosidade")
- Revisão ao final de cada unidade → quiz (1 a 3 perguntas baseadas no conteúdo real)
- Use ao menos 1 recurso interativo (accordion, quiz ou flipcard) por unidade

## Texto para analisar

${truncated}`;
}

/**
 * Gera curso usando Google Gemini
 */
async function generateWithGemini(text: string, apiKey: string, mode: 'auto' | 'markers' = 'auto'): Promise<{ course: CursoGerado; tokenUsage: TokenUsage }> {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const prompt = buildPrompt(text, mode);

  // Tentar diferentes modelos em ordem de preferência (nomes atualizados 2025+)
  // Referência: https://ai.google.dev/models/gemini
  const modelNames = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash-latest'];
  let lastError: Error | null = null;
  
  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      console.log(`🔄 Tentando modelo: ${modelName}`);
      
      const result = await model.generateContent(prompt);
      const response = result.response;
      const generatedText = response.text();

      console.log(`✅ Modelo ${modelName} funcionou!`);

      // Extrair JSON da resposta (pode vir com markdown code blocks)
      let jsonText = generatedText.trim();

      // Remover markdown code blocks se existirem
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }

      const courseData = JSON.parse(jsonText) as CursoGerado;

      // Validar estrutura básica
      if (!courseData.titulo || !courseData.descricao) {
        throw new Error('Resposta da IA não contém título ou descrição válidos');
      }

      // Garantir que unidades seja um array
      if (!Array.isArray(courseData.unidades)) {
        courseData.unidades = [];
      }

      const tokenUsage: TokenUsage = {
        promptTokens: response.usageMetadata?.promptTokenCount ?? 0,
        completionTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
        totalTokens: response.usageMetadata?.totalTokenCount ?? 0,
        model: modelName,
      };

      return { course: courseData, tokenUsage };
    } catch (error) {
      console.error(`❌ Erro com modelo ${modelName}:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Continuar para próximo modelo em caso de erro de modelo não encontrado ou quota excedida
      const isRetryable = error instanceof Error && (
        error.message.includes('not found') ||
        error.message.includes('404') ||
        error.message.includes('429') ||
        error.message.includes('quota') ||
        error.message.includes('Too Many Requests') ||
        error.message.includes('RESOURCE_EXHAUSTED')
      );
      if (!isRetryable) {
        throw error;
      }
      
      // Continuar para o próximo modelo
      continue;
    }
  }
  
  // Se chegou aqui, nenhum modelo funcionou
  throw new Error(`Nenhum modelo Gemini disponível. Tentei: ${modelNames.join(', ')}. Último erro: ${lastError?.message || 'Desconhecido'}`);
}

/**
 * Gera curso usando OpenAI
 */
async function generateWithOpenAI(text: string, apiKey: string, mode: 'auto' | 'markers' = 'auto'): Promise<{ course: CursoGerado; tokenUsage: TokenUsage }> {
  const { default: OpenAI } = await import('openai');
  const openai = new OpenAI({ apiKey });

  const prompt = buildPrompt(text, mode);

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em criação de cursos online. Retorne sempre JSON válido.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const generatedText = completion.choices[0]?.message?.content;

    if (!generatedText) {
      throw new Error('Resposta vazia da API OpenAI');
    }

    // Extrair JSON da resposta
    let jsonText = generatedText.trim();
    
    // Remover markdown code blocks se existirem
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    const courseData = JSON.parse(jsonText) as CursoGerado;

    // Validar estrutura básica
    if (!courseData.titulo || !courseData.descricao) {
      throw new Error('Resposta da IA não contém título ou descrição válidos');
    }

    // Garantir que unidades seja um array
    if (!Array.isArray(courseData.unidades)) {
      courseData.unidades = [];
    }

    const tokenUsage: TokenUsage = {
      promptTokens: completion.usage?.prompt_tokens ?? 0,
      completionTokens: completion.usage?.completion_tokens ?? 0,
      totalTokens: completion.usage?.total_tokens ?? 0,
      model: completion.model,
    };

    return { course: courseData, tokenUsage };
  } catch (error) {
    console.error('Erro ao gerar com OpenAI:', error);
    throw new Error(`Erro ao processar resposta da IA: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}
