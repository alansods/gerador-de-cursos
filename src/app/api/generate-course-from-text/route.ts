import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Configuração para Vercel
export const maxDuration = 60; // 60s para plano Pro (10s para Hobby)

// Schema esperado para o curso
interface CursoGenerado {
  titulo: string;
  descricao: string;
  categoria: string;
  cargaHoraria: string;
  modalidade: string;
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
    // Verificar API key PRIMEIRO (antes de qualquer coisa)
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim() === '') {
      console.error('[Generate Course] GEMINI_API_KEY não configurada!');
      return NextResponse.json(
        {
          error: 'API Key não configurada',
          message: 'Por favor, configure GEMINI_API_KEY no arquivo .env.local. Acesse: https://aistudio.google.com/app/apikey',
        },
        { status: 500 }
      );
    }

    const { text } = await req.json();

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Texto não fornecido ou inválido' },
        { status: 400 }
      );
    }

    console.log(`[Generate Course] Processando texto com ${text.length} caracteres...`);

    // Inicializar Google Gemini com a chave validada
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Usar gemini-2.5-pro (modelo mais capaz para tarefas complexas)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        responseMimeType: "application/json", // Solicita resposta em JSON
      }
    });

    // Prompt otimizado para Gemini 2.0
    const systemPrompt = `Você é um gerador de cursos profissional especializado em design instrucional. 
Analise o documento abaixo e crie um curso estruturado, extraindo os metadados e organizando o conteúdo em unidades de aprendizado.

**INSTRUÇÕES:**
1. Identifique os METADADOS do curso no início do documento (título, categoria, carga horária, modalidade)
2. Estruture o conteúdo em UNIDADES (módulos/capítulos) baseado nos títulos principais encontrados
3. Cada unidade DEVE ter:
   - titulo: Nome da unidade
   - descricao: OBRIGATÓRIA - O que o aluno aprenderá nesta unidade
   - conteudo: Array de elementos formatados
4. Cada elemento de conteúdo deve ter:
   - tipo: "titulo", "subtitulo", "paragrafo", "imagem", "accordion", "flipcard" ou "lista"
   - conteudo: O texto/URL do elemento
   - ordem: Número sequencial (0, 1, 2, ...)
5. **IMPORTANTE: NÃO inclua o título da unidade como primeiro item do conteúdo!** O título já está no campo "titulo" da unidade. Comece o conteúdo diretamente com o conteúdo real (parágrafos, subtítulos, etc.)
6. **INDICADORES ESPECIAIS - PROCESSAMENTO:**
   
   **ACCORDION_INICIO / ACCORDION_FIM:**
   - Quando encontrar esses marcadores, crie um elemento de conteúdo do tipo "accordion"
   - Entre os marcadores, identifique todos os itens no formato:
     **Título do Item X:** [título]
     **Conteúdo do Item X:** [conteúdo]
   - Crie a estrutura: tipo: "accordion", conteudo: "", items: [{ id: "item-1", titulo: "título", conteudo: "conteúdo" }, ...]
   
   **FLIPCARD_INICIO / FLIPCARD_FIM:**
   - Quando encontrar esses marcadores, crie um elemento de conteúdo do tipo "flipcard"
   - Entre os marcadores, identifique:
     **Tipo de Frente:** [imagem / imagem-titulo / titulo]
     **Imagem da Frente (se aplicável):** [URL ou descrição]
     **Título da Frente (se aplicável):** [texto]
     **Conteúdo do Verso:** [conteúdo completo]
   - Crie a estrutura: tipo: "flipcard", conteudo: "", tipoFrente: "...", imagemFrente: "...", tituloFrente: "...", conteudoVerso: "..."
   
   **LISTA_INICIO / LISTA_FIM:**
   - Quando encontrar esses marcadores, crie um elemento de conteúdo do tipo "lista"
   - Entre os marcadores, identifique:
     **Tipo de Lista:** [ordenada / nao-ordenada / check]
     **Item X:** [texto do item]
   - Crie a estrutura: tipo: "lista", conteudo: "", tipoLista: "...", itensLista: [{ id: "item-1", texto: "..." }, ...]
7. MANTENHA o conteúdo original do documento, apenas estruture-o
8. Crie pelo menos 3 unidades de aprendizado
9. Se encontrar referências a imagens (fora dos flipcards), crie elementos tipo "imagem"

**FORMATO DE SAÍDA OBRIGATÓRIO (JSON):**
{
  "titulo": "Título do Curso",
  "descricao": "Descrição completa do curso (o que será aprendido)",
  "categoria": "Categoria (ex: Programação, Design, Marketing, Segurança)",
  "cargaHoraria": "XX horas",
  "modalidade": "Online ou Presencial ou Híbrido",
  "unidades": [
    {
      "titulo": "Nome da Unidade",
      "descricao": "Descrição detalhada do que será aprendido nesta unidade",
      "conteudo": [
        { "tipo": "paragrafo", "conteudo": "Texto explicativo...", "ordem": 0 },
        { "tipo": "subtitulo", "conteudo": "Subtópico", "ordem": 1 },
        { 
          "tipo": "accordion", 
          "conteudo": "", 
          "items": [
            { "id": "item-1", "titulo": "Título do Item", "conteudo": "Conteúdo do item..." },
            { "id": "item-2", "titulo": "Outro Item", "conteudo": "Mais conteúdo..." }
          ],
          "ordem": 2
        },
        {
          "tipo": "flipcard",
          "conteudo": "",
          "tipoFrente": "titulo",
          "tituloFrente": "Título na Frente",
          "conteudoVerso": "Conteúdo completo do verso do card...",
          "ordem": 3
        },
        {
          "tipo": "lista",
          "conteudo": "",
          "tipoLista": "check",
          "itensLista": [
            { "id": "item-1", "texto": "Primeiro item da lista" },
            { "id": "item-2", "texto": "Segundo item da lista" }
          ],
          "ordem": 4
        }
      ]
    }
  ]
}

**CONTEÚDO DO DOCUMENTO:**
---
${text}
---`;

    const fullPrompt = systemPrompt;

    // Chamar a API do Google Gemini
    const startTime = Date.now();
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const responseContent = response.text();

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`[Generate Course] IA respondeu em ${duration}s`);

    if (!responseContent) {
      throw new Error('IA não retornou conteúdo');
    }

    let courseData: CursoGenerado;
    try {
      // Com responseMimeType: "application/json", a resposta já vem em JSON puro
      // Mas fazemos limpeza por segurança
      let cleanedResponse = responseContent.trim();
      
      // Remover wrappers de código se existirem
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      courseData = JSON.parse(cleanedResponse);
      
      console.log('[Generate Course] JSON parseado com sucesso');
    } catch (parseError) {
      console.error('[Generate Course] Erro ao parsear JSON:', parseError);
      console.error('[Generate Course] Resposta recebida:', responseContent.substring(0, 500));
      return NextResponse.json(
        {
          error: 'Erro ao processar resposta da IA',
          message: 'A IA retornou um formato inválido. Tente novamente.',
          details: parseError instanceof Error ? parseError.message : 'Erro desconhecido'
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

    // Validar e adicionar IDs únicos para cada unidade e conteúdo
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    
    for (let i = 0; i < courseData.unidades.length; i++) {
      const unidade = courseData.unidades[i];
      
      // Validar descrição
      if (!unidade.descricao || unidade.descricao.trim() === '') {
        unidade.descricao = 'Descrição não fornecida';
      }
      
      // Adicionar ID único para a unidade (timestamp + random + índice)
      (unidade as any).id = `unidade-${timestamp}-${randomSuffix}-${i}`;
      
      // Adicionar IDs únicos para cada item de conteúdo e remover duplicações
      if (unidade.conteudo && Array.isArray(unidade.conteudo)) {
        // Filtrar conteúdo que seja idêntico ao título da unidade (evitar duplicação)
        const tituloNormalizado = unidade.titulo.trim().toLowerCase();
        const conteudoFiltrado = unidade.conteudo.filter((item) => {
          // Não filtrar accordion e flipcard (eles não têm conteudo string)
          if (item.tipo === 'accordion' || item.tipo === 'flipcard') {
            return true;
          }
          const conteudoItem = item.conteudo?.trim().toLowerCase() || '';
          // Remover se for idêntico ao título da unidade
          return conteudoItem !== tituloNormalizado;
        });
        
        // Reatribuir o conteúdo filtrado
        unidade.conteudo = conteudoFiltrado;
        
        // Reordenar e adicionar IDs únicos
        for (let j = 0; j < unidade.conteudo.length; j++) {
          const item = unidade.conteudo[j];
          item.ordem = j; // Reordenar após filtro
          // ID único: timestamp + random + índice da unidade + índice do conteúdo
          (item as any).id = `conteudo-${timestamp}-${randomSuffix}-${i}-${j}`;
          
          // Para accordions, garantir IDs únicos nos itens
          if (item.tipo === 'accordion' && item.items && Array.isArray(item.items)) {
            item.items = item.items.map((accordionItem: any, idx: number) => ({
              ...accordionItem,
              id: accordionItem.id || `accordion-item-${timestamp}-${randomSuffix}-${i}-${j}-${idx}`,
            }));
          }
        }
      }
    }

    console.log(`[Generate Course] Curso gerado: ${courseData.titulo} com ${courseData.unidades.length} unidades`);

    return NextResponse.json({
      success: true,
      course: courseData,
      stats: {
        duration: `${duration}s`,
        unidades: courseData.unidades.length,
        model: 'gemini-2.0-flash-exp',
      },
    });
  } catch (error) {
    console.error('Erro no generate-course-from-text:', error);

    // Erro genérico
    return NextResponse.json(
      {
        error: 'Erro interno ao gerar curso',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

