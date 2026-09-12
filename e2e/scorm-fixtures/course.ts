import type { Course } from '../../src/types/course'

const block = (id: string, type: string, content: string, extra: object = {}) =>
  ({ id, type, content, order: 0, ...extra }) as never

export const testCourse = {
  id: 'curso-teste-scorm',
  title: 'Curso de Teste SCORM',
  description: 'Curso usado para validar o rastreio de progresso no LMS',
  workload: '4h',
  modality: 'EAD',
  category: 'Teste',
  layout: 'classic',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  units: [
    {
      id: 'unidade-a',
      title: 'Unidade A',
      description: 'Primeira',
      order: 1,
      blocks: [block('b1', 'heading', 'Bem-vindo')],
    },
    {
      id: 'unidade-b',
      title: 'Unidade B',
      description: 'Segunda',
      order: 2,
      blocks: [
        block('b2', 'paragraph', 'Texto qualquer'),
        block('b3', 'quiz', '', {
          quizData: {
            questions: [
              {
                id: 'q1',
                question: 'Quanto é 2 + 2?',
                options: [
                  { id: 'o1', text: '4', isCorrect: true, feedback: 'Isso!' },
                  { id: 'o2', text: '5', isCorrect: false, feedback: 'Não' },
                ],
              },
            ],
          },
        }),
      ],
    },
    {
      id: 'unidade-c',
      title: 'Unidade C',
      description: 'Terceira',
      order: 3,
      blocks: [block('b4', 'heading', 'Fim')],
    },
  ],
} as unknown as Course
