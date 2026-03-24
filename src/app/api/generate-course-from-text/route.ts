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
    const { text } = body;

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
      const result = await generateWithGemini(text, geminiApiKey);
      course = result.course;
      tokenUsage = result.tokenUsage;
    } else if (openaiApiKey) {
      const result = await generateWithOpenAI(text, openaiApiKey);
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
 * Gera curso usando Google Gemini
 */
async function generateWithGemini(text: string, apiKey: string): Promise<{ course: CursoGerado; tokenUsage: TokenUsage }> {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const prompt = `Você é um especialista em criação de cursos online. Analise o seguinte texto e crie uma estrutura de curso completa em formato JSON.

O JSON deve seguir exatamente este formato:
{
  "titulo": "Título do Curso",
  "descricao": "Descrição detalhada do curso",
  "categoria": "Categoria do curso (ex: Tecnologia, Marketing, Design)",
  "cargaHoraria": "X horas",
  "modalidade": "Online",
  "unidades": [
    {
      "titulo": "Título da Unidade",
      "descricao": "Descrição da unidade",
      "conteudo": [
        {
          "titulo": "Título do Conteúdo",
          "conteudo": "Conteúdo detalhado em formato HTML com parágrafos, listas, etc.",
          "tipo": "paragrafo"
        }
      ]
    }
  ]
}

IMPORTANTE:
- Cada unidade deve ter um array "conteudo" (NÃO "aulas")
- Cada item de conteúdo deve ter: titulo, conteudo (HTML), tipo ("paragrafo", "titulo", "lista", etc.)
- Gere conteúdo rico e detalhado em HTML para cada item

Texto para analisar:
${text.substring(0, 10000)} ${text.length > 10000 ? '\n\n[... texto truncado ...]' : ''}

Retorne APENAS o JSON válido, sem markdown, sem explicações adicionais.`;

  // Tentar diferentes modelos em ordem de preferência (nomes atualizados 2025+)
  // Referência: https://ai.google.dev/models/gemini
  const modelNames = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash-latest'];
  let lastError: Error | null = null;
  
  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      console.log(`🔄 Tentando modelo: ${modelName}`);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
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
async function generateWithOpenAI(text: string, apiKey: string): Promise<{ course: CursoGerado; tokenUsage: TokenUsage }> {
  const { default: OpenAI } = await import('openai');
  const openai = new OpenAI({ apiKey });

  const prompt = `Você é um especialista em criação de cursos online. Analise o seguinte texto e crie uma estrutura de curso completa em formato JSON.

O JSON deve seguir exatamente este formato:
{
  "titulo": "Título do Curso",
  "descricao": "Descrição detalhada do curso",
  "categoria": "Categoria do curso (ex: Tecnologia, Marketing, Design)",
  "cargaHoraria": "X horas",
  "modalidade": "Online",
  "unidades": [
    {
      "titulo": "Título da Unidade",
      "descricao": "Descrição da unidade",
      "conteudo": [
        {
          "titulo": "Título do Conteúdo",
          "conteudo": "Conteúdo detalhado em formato HTML com parágrafos, listas, etc.",
          "tipo": "paragrafo"
        }
      ]
    }
  ]
}

IMPORTANTE:
- Cada unidade deve ter um array "conteudo" (NÃO "aulas")
- Cada item de conteúdo deve ter: titulo, conteudo (HTML), tipo ("paragrafo", "titulo", "lista", etc.)
- Gere conteúdo rico e detalhado em HTML para cada item

Texto para analisar:
${text.substring(0, 10000)} ${text.length > 10000 ? '\n\n[... texto truncado ...]' : ''}

Retorne APENAS o JSON válido, sem markdown, sem explicações adicionais.`;

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
