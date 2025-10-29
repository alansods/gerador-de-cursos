export interface CursoInfo {
  id: string;
  titulo: string;
  descricao: string;
  cargaHoraria: string;
  modalidade: string;
  instrutor: string;
  categoria: string;
  unidades: any[];
}

export const cursoInfo: CursoInfo = {
  id: '1',
  titulo: 'Curso de Exemplo',
  descricao: 'Descrição do curso de exemplo',
  cargaHoraria: '40 horas',
  modalidade: 'Online',
  instrutor: 'Instrutor Exemplo',
  categoria: 'Tecnologia',
  unidades: []
};
