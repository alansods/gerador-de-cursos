import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Esta rota não pode ser exportada estaticamente
export const dynamic = 'error';

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
      tipo: 'titulo' | 'subtitulo' | 'paragrafo' | 'imagem' | 'accordion' | 'flipcard' | 'lista';
      conteudo: string;
      ordem: number;
      items?: Array<{ id: string; titulo: string; conteudo: string }>;
      tipoFrente?: 'imagem' | 'imagem-titulo' | 'titulo';
      imagemFrente?: string;
      tituloFrente?: string;
      conteudoVerso?: string;
      alturaCard?: string;
      itensLista?: Array<{ id: string; texto: string }>;
      tipoLista?: 'ordenada' | 'nao-ordenada' | 'check';
      [key: string]: unknown; // Para permitir propriedades adicionais
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
   - tipo: "titulo", "subtitulo", "paragrafo", "imagem", "accordion", "flipcard", "lista", "quiz" ou "info-box"
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
   
   **QUIZ_INICIO / QUIZ_FIM:**
   - Quando encontrar esses marcadores, crie um elemento de conteúdo do tipo "quiz"
   - Entre os marcadores, identifique todas as perguntas no formato:
     **Pergunta X:** [texto da pergunta]
     **Dica (opcional):** [texto da dica ou vazio]
     **Opção A:** [texto da opção A]
     **Feedback Opção A:** [feedback quando o aluno escolher esta opção]
     **Opção B:** [texto da opção B]
     **Feedback Opção B:** [feedback quando o aluno escolher esta opção]
     **Opção C:** [texto da opção C]
     **Feedback Opção C:** [feedback quando o aluno escolher esta opção]
     **Opção D:** [texto da opção D]
     **Feedback Opção D:** [feedback quando o aluno escolher esta opção]
     **Opção E:** [texto da opção E]
     **Feedback Opção E:** [feedback quando o aluno escolher esta opção]
     **Resposta Correta:** [A / B / C / D / E]
   - IMPORTANTE: Cada pergunta deve ter EXATAMENTE 5 opções de resposta (A, B, C, D, E)
   - IMPORTANTE: Cada pergunta deve ter EXATAMENTE 1 resposta correta marcada (isCorrect: true para a opção correta, false para as outras)
   - IMPORTANTE: Todas as opções devem ter feedback preenchido
   - Crie a estrutura: tipo: "quiz", conteudo: "", quizData: { questions: [{ id: "question-1", pergunta: "...", dica: "...", opcoes: [{ id: "opcao-1", texto: "...", isCorrect: true/false, feedback: "..." }, ...] }, ...] }
   - Se houver múltiplas perguntas, crie todas dentro do mesmo elemento quiz com array questions
   
   **INFOBOX_INICIO / INFOBOX_FIM:**
   - Quando encontrar esses marcadores, crie um elemento de conteúdo do tipo "info-box"
   - Entre os marcadores, identifique:
     **Tipo do Info Box:** atencao / saiba_mais / info / curiosidade
     **Título (opcional):** [Título personalizado do Info Box. Se não fornecido, será usado o tipo como título]
     **Texto do Corpo:** [Conteúdo completo do Info Box. Este texto aparecerá dentro da caixa colorida e pode ser expandido/colapsado]
   - IMPORTANTE: O tipo do Info Box deve ser exatamente um dos valores: "atencao", "saiba_mais", "info" ou "curiosidade"
   - IMPORTANTE: O texto do corpo é obrigatório
   - Crie a estrutura: tipo: "info-box", conteudo: "[texto do corpo]", tipoInfoBox: "[tipo]", tituloInfoBox: "[título ou vazio]", ordem: X
   - Tipos disponíveis:
     - **atencao**: Caixa amarela com ícone de alerta, para avisos importantes
     - **saiba_mais**: Caixa azul com ícone de lâmpada, para informações complementares
     - **info**: Caixa cinza com ícone de informação, para informações gerais
     - **curiosidade**: Caixa roxa com ícone de estrelas, para curiosidades e dicas interessantes
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
        },
        {
          "tipo": "quiz",
          "conteudo": "",
          "quizData": {
            "questions": [
              {
                "id": "question-1",
                "pergunta": "Qual é a principal diferença entre X e Y?",
                "dica": "Pense sobre as características específicas de cada um",
                "opcoes": [
                  { "id": "opcao-1", "texto": "Opção A", "isCorrect": false, "feedback": "Incorreto. A opção A não é a resposta correta porque..." },
                  { "id": "opcao-2", "texto": "Opção B", "isCorrect": true, "feedback": "Correto! A opção B é a resposta correta porque..." },
                  { "id": "opcao-3", "texto": "Opção C", "isCorrect": false, "feedback": "Incorreto. A opção C não é a resposta correta porque..." },
                  { "id": "opcao-4", "texto": "Opção D", "isCorrect": false, "feedback": "Incorreto. A opção D não é a resposta correta porque..." },
                  { "id": "opcao-5", "texto": "Opção E", "isCorrect": false, "feedback": "Incorreto. A opção E não é a resposta correta porque..." }
                ]
              }
            ]
          },
          "ordem": 5
        },
        {
          "tipo": "info-box",
          "conteudo": "Conteúdo completo do Info Box que aparece dentro da caixa colorida e pode ser expandido/colapsado.",
          "tipoInfoBox": "atencao",
          "tituloInfoBox": "Título personalizado (opcional, pode ser vazio)",
          "ordem": 6
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
      (unidade as { id?: string }).id = `unidade-${timestamp}-${randomSuffix}-${i}`;
      
      // Adicionar IDs únicos para cada item de conteúdo e remover duplicações
      if (unidade.conteudo && Array.isArray(unidade.conteudo)) {
        // Filtrar conteúdo que seja idêntico ao título da unidade (evitar duplicação)
        const tituloNormalizado = unidade.titulo.trim().toLowerCase();
        const conteudoFiltrado = unidade.conteudo.filter((item) => {
          // Não filtrar accordion, flipcard e lista (eles não têm conteudo string obrigatório)
          if (item.tipo === 'accordion' || item.tipo === 'flipcard' || item.tipo === 'lista') {
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
          (item as { id?: string }).id = `conteudo-${timestamp}-${randomSuffix}-${i}-${j}`;
          
          // Para accordions, garantir IDs únicos nos itens
          if (item.tipo === 'accordion' && item.items && Array.isArray(item.items)) {
            item.items = item.items.map((accordionItem: { id?: string; titulo: string; conteudo: string }, idx: number) => ({
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

