import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth';
import { CursoGerado } from '@/types/gerador-curso';
import { logActivity } from '@/lib/activity-logger';

/**
 * GET /api/cursos
 * Lista cursos com paginação e filtros
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const modality = searchParams.get('modality') || '';

    // Construir filtros
    const where: any = {};

    if (search) {
      where.OR = [
        { titulo: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.categoria = category;
    }

    if (modality) {
      where.modalidade = modality;
    }

    // Contar total de cursos
    const total = await prisma.curso.count({ where });

    // Buscar cursos com paginação
    const cursos = await prisma.curso.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { dataCriacao: 'desc' },
    });

    // Converter para formato CursoGerado com normalização de unidades
    const cursosFormatados: CursoGerado[] = cursos.map((curso) => {
      // Normalizar unidades: garantir IDs e estrutura correta
      const unidadesOriginais = (curso.unidades as any) || [];
      const unidadesNormalizadas = unidadesOriginais.map((unidade: any, index: number) => {
        const unidadeId = unidade.id || `unidade-${curso.id}-${index}`;
        let conteudoOriginal = unidade.conteudo || unidade.aulas || [];
        const conteudoNormalizado = conteudoOriginal.map((item: any, itemIndex: number) => ({
          ...item,
          id: item.id || `conteudo-${curso.id}-${index}-${itemIndex}`,
          ordem: item.ordem ?? itemIndex,
          tipo: item.tipo || 'paragrafo',
        }));

        return {
          ...unidade,
          id: unidadeId,
          ordem: unidade.ordem ?? index,
          conteudo: conteudoNormalizado,
        };
      });

      return {
        id: curso.id,
        titulo: curso.titulo,
        descricao: curso.descricao,
        cargaHoraria: curso.cargaHoraria,
        modalidade: curso.modalidade,
        categoria: curso.categoria,
        unidades: unidadesNormalizadas,
        dataCriacao: curso.dataCriacao,
        dataModificacao: curso.dataModificacao,
      };
    });

    return createSuccessResponse({
      cursos: cursosFormatados,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Erro ao listar cursos:', error);
    return createErrorResponse('Erro ao listar cursos', 500, error);
  }
}

/**
 * POST /api/cursos
 * Cria um novo curso
 */
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);

  if (authResult instanceof NextResponse) {
    return authResult; // Retorna erro 401 se não autenticado
  }

  try {
    const body = await req.json();
    const { titulo, descricao, cargaHoraria, modalidade, categoria, unidades } = body;

    // Validar campos obrigatórios
    if (!titulo || !descricao || !cargaHoraria || !modalidade || !categoria) {
      return createErrorResponse('Missing required fields', 400);
    }

    // Normalizar unidades: garantir IDs e estrutura correta
    const unidadesNormalizadas = (unidades || []).map((unidade: any, index: number) => {
      // Gerar ID se não existir
      const unidadeId = unidade.id || `unidade-${Date.now()}-${index}`;
      
      // Normalizar conteúdo: pode vir como 'aulas' (da IA) ou 'conteudo'
      let conteudoOriginal = unidade.conteudo || unidade.aulas || [];
      
      // Garantir que cada conteúdo tenha ID
      const conteudoNormalizado = conteudoOriginal.map((item: any, itemIndex: number) => ({
        ...item,
        id: item.id || `conteudo-${Date.now()}-${index}-${itemIndex}`,
        ordem: item.ordem ?? itemIndex,
        // Normalizar tipo se vier de 'aulas' da IA
        tipo: item.tipo || 'paragrafo',
      }));

      return {
        ...unidade,
        id: unidadeId,
        ordem: unidade.ordem ?? index,
        conteudo: conteudoNormalizado,
        // Remover 'aulas' se existir (foi movido para 'conteudo')
        aulas: undefined,
      };
    });

    // Criar curso
    const curso = await prisma.curso.create({
      data: {
        titulo,
        descricao,
        cargaHoraria,
        modalidade,
        categoria,
        unidades: unidadesNormalizadas,
      },
    });

    // Registrar atividade
    await logActivity({
      tipo: 'curso_criado',
      titulo: 'Novo curso criado',
      descricao: titulo,
      entityId: curso.id,
      entityType: 'curso',
      userId: authResult.user.id,
    });

    // Converter para formato CursoGerado
    const cursoFormatado: CursoGerado = {
      id: curso.id,
      titulo: curso.titulo,
      descricao: curso.descricao,
      cargaHoraria: curso.cargaHoraria,
      modalidade: curso.modalidade,
      categoria: curso.categoria,
      unidades: (curso.unidades as any) || [],
      dataCriacao: curso.dataCriacao,
      dataModificacao: curso.dataModificacao,
    };

    return createSuccessResponse({ curso: cursoFormatado }, 201);
  } catch (error) {
    console.error('Erro ao criar curso:', error);
    return createErrorResponse('Erro ao criar curso', 500, error);
  }
}

/**
 * PUT /api/cursos
 * Atualiza um curso existente
 */
export async function PUT(req: NextRequest) {
  const authResult = await requireAuth(req);

  if (authResult instanceof NextResponse) {
    return authResult; // Retorna erro 401 se não autenticado
  }

  try {
    const body = await req.json();
    const { id, titulo, descricao, cargaHoraria, modalidade, categoria, unidades } = body;

    if (!id) {
      return createErrorResponse('ID do curso é obrigatório', 400);
    }

    // Verificar se o curso existe
    const cursoExistente = await prisma.curso.findUnique({
      where: { id },
    });

    if (!cursoExistente) {
      return createErrorResponse('Curso não encontrado', 404);
    }

    // Normalizar unidades se fornecidas
    let unidadesNormalizadas = undefined;
    if (unidades !== undefined) {
      unidadesNormalizadas = unidades.map((unidade: any, index: number) => {
        // Gerar ID se não existir
        const unidadeId = unidade.id || `unidade-${Date.now()}-${index}`;
        
        // Normalizar conteúdo
        let conteudoOriginal = unidade.conteudo || unidade.aulas || [];
        const conteudoNormalizado = conteudoOriginal.map((item: any, itemIndex: number) => ({
          ...item,
          id: item.id || `conteudo-${Date.now()}-${index}-${itemIndex}`,
          ordem: item.ordem ?? itemIndex,
          tipo: item.tipo || 'paragrafo',
        }));

        return {
          ...unidade,
          id: unidadeId,
          ordem: unidade.ordem ?? index,
          conteudo: conteudoNormalizado,
          aulas: undefined,
        };
      });
    }

    // Atualizar curso
    const curso = await prisma.curso.update({
      where: { id },
      data: {
        ...(titulo && { titulo }),
        ...(descricao && { descricao }),
        ...(cargaHoraria && { cargaHoraria }),
        ...(modalidade && { modalidade }),
        ...(categoria && { categoria }),
        ...(unidadesNormalizadas !== undefined && { unidades: unidadesNormalizadas }),
      },
    });

    // Registrar atividade
    await logActivity({
      tipo: 'curso_editado',
      titulo: 'Curso editado',
      descricao: curso.titulo,
      entityId: curso.id,
      entityType: 'curso',
      userId: authResult.user.id,
    });

    // Converter para formato CursoGerado
    const cursoFormatado: CursoGerado = {
      id: curso.id,
      titulo: curso.titulo,
      descricao: curso.descricao,
      cargaHoraria: curso.cargaHoraria,
      modalidade: curso.modalidade,
      categoria: curso.categoria,
      unidades: (curso.unidades as any) || [],
      dataCriacao: curso.dataCriacao,
      dataModificacao: curso.dataModificacao,
    };

    return createSuccessResponse({ curso: cursoFormatado });
  } catch (error) {
    console.error('Erro ao atualizar curso:', error);
    return createErrorResponse('Erro ao atualizar curso', 500, error);
  }
}

/**
 * DELETE /api/cursos
 * Deleta um curso
 */
export async function DELETE(req: NextRequest) {
  const authResult = await requireAuth(req);

  if (authResult instanceof NextResponse) {
    return authResult; // Retorna erro 401 se não autenticado
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return createErrorResponse('ID do curso é obrigatório', 400);
    }

    // Verificar se o curso existe
    const cursoExistente = await prisma.curso.findUnique({
      where: { id },
    });

    if (!cursoExistente) {
      return createErrorResponse('Curso não encontrado', 404);
    }

    // Deletar curso
    await prisma.curso.delete({
      where: { id },
    });

    // Registrar atividade
    await logActivity({
      tipo: 'curso_deletado',
      titulo: 'Curso deletado',
      descricao: cursoExistente.titulo,
      entityId: id,
      entityType: 'curso',
      userId: authResult.user.id,
    });

    return createSuccessResponse({ message: 'Curso deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar curso:', error);
    return createErrorResponse('Erro ao deletar curso', 500, error);
  }
}

