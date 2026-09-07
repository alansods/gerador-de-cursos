import type { CursoGerado } from '../../src/types/gerador-curso'

const bloco = (id: string, tipo: string, conteudo: string, extra: object = {}) =>
  ({ id, tipo, conteudo, ordem: 0, ...extra }) as never

export const cursoDeTeste = {
  id: 'curso-teste-scorm',
  titulo: 'Curso de Teste SCORM',
  descricao: 'Curso usado para validar o rastreio de progresso no LMS',
  cargaHoraria: '4h',
  modalidade: 'EAD',
  categoria: 'Teste',
  layout: 'classico',
  dataCriacao: new Date('2026-01-01'),
  dataModificacao: new Date('2026-01-01'),
  unidades: [
    {
      id: 'unidade-a',
      titulo: 'Unidade A',
      descricao: 'Primeira',
      ordem: 1,
      conteudo: [bloco('b1', 'titulo', 'Bem-vindo')],
    },
    {
      id: 'unidade-b',
      titulo: 'Unidade B',
      descricao: 'Segunda',
      ordem: 2,
      conteudo: [
        bloco('b2', 'paragrafo', 'Texto qualquer'),
        bloco('b3', 'quiz', '', {
          quizData: {
            questions: [
              {
                id: 'q1',
                pergunta: 'Quanto é 2 + 2?',
                opcoes: [
                  { id: 'o1', texto: '4', isCorrect: true, feedback: 'Isso!' },
                  { id: 'o2', texto: '5', isCorrect: false, feedback: 'Não' },
                ],
              },
            ],
          },
        }),
      ],
    },
    {
      id: 'unidade-c',
      titulo: 'Unidade C',
      descricao: 'Terceira',
      ordem: 3,
      conteudo: [bloco('b4', 'titulo', 'Fim')],
    },
  ],
} as unknown as CursoGerado
