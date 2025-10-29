// API Client para comunicação com backend

import type { CursoGerado } from '@/types/gerador-curso';

const API_BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:5001/api';

export interface CursoAPI {
  id: string;
  titulo: string;
  descricao?: string;
  cargaHoraria?: string;
  modalidade?: string;
  instrutor?: string;
  categoria?: string;
  duracao?: number;
  nivel?: string;
  idioma?: string;
  versaoSCORM?: string;
  corTema?: string;
  logoUrl?: string;
  modulos?: any[];
  unidades?: any[];
  dataCriacao?: Date;
  dataModificacao?: Date;
  created_at?: string;
  updated_at?: string;
}

/**
 * Converter CursoAPI (do banco) para CursoGerado (frontend)
 */
function convertApiToCurso(apiCurso: CursoAPI): CursoGerado {
  return {
    id: apiCurso.id,
    titulo: apiCurso.titulo,
    descricao: apiCurso.descricao || '',
    cargaHoraria: apiCurso.cargaHoraria || '',
    modalidade: apiCurso.modalidade || '',
    instrutor: apiCurso.instrutor || '',
    categoria: apiCurso.categoria || '',
    dataCriacao: apiCurso.created_at ? new Date(apiCurso.created_at) : new Date(),
    dataModificacao: apiCurso.updated_at ? new Date(apiCurso.updated_at) : new Date(),
    unidades: apiCurso.modulos || apiCurso.unidades || [],
  };
}

/**
 * Converter CursoGerado (frontend) para CursoAPI (banco)
 */
function convertCursoToApi(curso: CursoGerado): CursoAPI {
  return {
    id: curso.id,
    titulo: curso.titulo,
    descricao: curso.descricao,
    cargaHoraria: curso.cargaHoraria,
    modalidade: curso.modalidade,
    instrutor: curso.instrutor,
    categoria: curso.categoria,
    modulos: curso.unidades,
    unidades: curso.unidades,
  };
}

/**
 * Buscar todos os cursos do banco de dados
 */
export async function fetchCursos(): Promise<CursoGerado[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/courses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar cursos: ${response.statusText}`);
    }

    const data = await response.json();
    const cursos = data.cursos || [];
    return cursos.map((c: CursoAPI) => convertApiToCurso(c));
  } catch (error) {
    console.error('❌ [API] Erro ao buscar cursos:', error);
    // Em caso de erro, retornar array vazio e tentar usar localStorage como fallback
    const cursosSalvos = localStorage.getItem('gerador-cursos');
    if (cursosSalvos) {
      try {
        return JSON.parse(cursosSalvos);
      } catch {
        return [];
      }
    }
    return [];
  }
}

/**
 * Salvar ou atualizar um curso no banco de dados
 */
export async function saveCurso(curso: CursoGerado): Promise<void> {
  try {
    const cursoApi = convertCursoToApi(curso);
    const response = await fetch(`${API_BASE_URL}/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ curso: cursoApi }),
    });

    if (!response.ok) {
      throw new Error(`Erro ao salvar curso: ${response.statusText}`);
    }

    console.log('✅ [API] Curso salvo com sucesso:', curso.titulo);
  } catch (error) {
    console.error('❌ [API] Erro ao salvar curso:', error);
    // Fallback para localStorage
    const cursosSalvos = localStorage.getItem('gerador-cursos');
    const cursos = cursosSalvos ? JSON.parse(cursosSalvos) : [];
    const cursoExistente = cursos.findIndex((c: CursoGerado) => c.id === curso.id);
    
    if (cursoExistente >= 0) {
      cursos[cursoExistente] = curso;
    } else {
      cursos.push(curso);
    }
    
    localStorage.setItem('gerador-cursos', JSON.stringify(cursos));
    console.log('⚠️ [API] Curso salvo localmente como fallback');
  }
}

/**
 * Deletar um curso do banco de dados
 */
export async function deleteCurso(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/courses?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao deletar curso: ${response.statusText}`);
    }

    console.log('✅ [API] Curso deletado com sucesso:', id);
  } catch (error) {
    console.error('❌ [API] Erro ao deletar curso:', error);
    // Fallback para localStorage
    const cursosSalvos = localStorage.getItem('gerador-cursos');
    if (cursosSalvos) {
      const cursos = JSON.parse(cursosSalvos);
      const cursosFiltrados = cursos.filter((c: CursoAPI) => c.id !== id);
      localStorage.setItem('gerador-cursos', JSON.stringify(cursosFiltrados));
      console.log('⚠️ [API] Curso deletado localmente como fallback');
    }
  }
}

/**
 * Inicializar o banco de dados (criar tabelas)
 */
export async function initDatabase(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/init-db`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao inicializar banco: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ [API] Banco de dados inicializado:', data.message);
  } catch (error) {
    console.error('❌ [API] Erro ao inicializar banco:', error);
  }
}

