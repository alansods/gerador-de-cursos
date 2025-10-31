import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Configuração para Vercel
export const maxDuration = 60; // 60s para plano Pro (10s para Hobby)

// Inicializar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Schema esperado para o curso
interface CursoGenerado {
  titulo: string;
  descricao: string;
  categoria: string;
  cargaHoraria: string;
  modalidade: string;
  instrutor: string;
  unidades: Array<{
    titulo: string;
    descricao: string;
    conteudo: Array<{
      tipo: 'titulo' | 'subtitulo' | 'paragrafo' | 'imagem';
      conteudo: string;
      ordem: number;
    }>;
  }>;
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Texto não fornecido ou inválido' },
        { status: 400 }
      );
    }

    // Verificar se a API key está configurada
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: 'API Key não configurada',
          message: 'Por favor, configure OPENAI_API_KEY no arquivo .env.local',
        },
        { status: 500 }
      );
    }

    console.log(`[Generate Course] Processando texto com ${text.length} caracteres...`);

    // Prompt para a IA
    const systemPrompt = `Você é um especialista em design instrucional e criação de cursos online. 
Sua tarefa é analisar o conteúdo fornecido e criar um curso estruturado seguindo EXATAMENTE o formato JSON especificado.

IMPORTANTE: O documento pode estar em qualquer formato. Identifique os metadados do curso (título, categoria, etc.) no início do texto, e depois estruture as unidades baseado nos títulos e seções encontrados.

REGRAS OBRIGATÓRIAS:
1. Extraia os metadados do curso (título, descrição, categoria, etc.) do início do documento
2. Identifique e crie pelo menos 3 unidades de aprendizado
3. Cada unidade DEVE ter: titulo, descricao (obrigatória) e conteudo
4. O conteúdo deve ser dividido em elementos com tipo: "titulo", "subtitulo", "paragrafo" ou "imagem"
5. Cada elemento de conteúdo deve ter: tipo, conteudo e ordem (numérica sequencial)
6. Mantenha o conteúdo original, apenas estruture-o adequadamente
7. Se encontrar menções a imagens (como [IMAGEM:...] ou ![...](url)), crie elementos tipo "imagem" com a URL ou descrição

FORMATO DE RESPOSTA (JSON):
{
  "titulo": "Título do Curso",
  "descricao": "Descrição completa do curso",
  "categoria": "Categoria (ex: Programação, Design, Marketing)",
  "cargaHoraria": "XX horas",
  "modalidade": "Online/Presencial/Híbrido",
  "instrutor": "Nome do Instrutor",
  "unidades": [
    {
      "titulo": "Nome da Unidade 1",
      "descricao": "Descrição da unidade (OBRIGATÓRIA - o que o aluno aprenderá)",
      "conteudo": [
        {
          "tipo": "titulo",
          "conteudo": "Título Principal",
          "ordem": 0
        },
        {
          "tipo": "paragrafo",
          "conteudo": "Texto do parágrafo...",
          "ordem": 1
        },
        {
          "tipo": "subtitulo",
          "conteudo": "Subtítulo",
          "ordem": 2
        }
      ]
    }
  ]
}

Retorne APENAS o JSON, sem texto adicional antes ou depois.`;

    const userPrompt = `Analise o seguinte conteúdo e crie um curso estruturado:

${text}`;

    // Chamar a API da OpenAI
    const startTime = Date.now();
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-16k', // Ou gpt-4-turbo para melhor qualidade
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 8000, // Limite para resposta rápida
      response_format: { type: 'json_object' }, // Força resposta em JSON
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`[Generate Course] IA respondeu em ${duration}s`);

    // Extrair e parsear resposta
    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error('IA não retornou conteúdo');
    }

    let courseData: CursoGenerado;
    try {
      courseData = JSON.parse(responseContent);
    } catch (parseError) {
      console.error('Erro ao parsear resposta da IA:', responseContent);
      return NextResponse.json(
        {
          error: 'Erro ao processar resposta da IA',
          message: 'A IA retornou um formato inválido. Tente novamente.',
        },
        { status: 500 }
      );
    }

    // Validações básicas
    if (!courseData.titulo || !courseData.unidades || courseData.unidades.length === 0) {
      return NextResponse.json(
        {
          error: 'Curso inválido gerado',
          message: 'O curso gerado não possui título ou unidades. Verifique o formato do documento.',
        },
        { status: 500 }
      );
    }

    // Validar que todas as unidades têm descrição
    for (const unidade of courseData.unidades) {
      if (!unidade.descricao || unidade.descricao.trim() === '') {
        unidade.descricao = 'Descrição não fornecida';
      }
    }

    console.log(`[Generate Course] Curso gerado: ${courseData.titulo} com ${courseData.unidades.length} unidades`);

    return NextResponse.json({
      success: true,
      course: courseData,
      stats: {
        duration: `${duration}s`,
        unidades: courseData.unidades.length,
        model: completion.model,
        tokensUsed: completion.usage?.total_tokens || 0,
      },
    });
  } catch (error) {
    console.error('Erro no generate-course-from-text:', error);

    // Erros específicos da OpenAI
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        {
          error: 'Erro na API da OpenAI',
          message: error.message,
          type: error.type,
          code: error.code,
        },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Erro interno ao gerar curso',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

