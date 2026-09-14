import type { Course } from '../../src/types/course'

const block = (id: string, type: string, content: string, extra: object = {}) =>
  ({ id, type, content, order: 0, ...extra }) as never

export const trailCourse = {
  id: 'curso-teste-trilha',
  title: 'Doces Regionais',
  description: 'Curso usado para validar o layout Trilha no LMS',
  workload: '8h',
  modality: 'EAD',
  category: 'Culinária nordestina',
  layout: 'trail',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  units: [
    {
      id: 'boas-vindas',
      title: 'Boas-vindas',
      description: 'Apresentação do curso',
      order: 1,
      badgeName: 'Primeira colherada',
      badgeIcon: 'chef-hat',
      blocks: [
        block(
          'bv-1',
          'paragraph',
          'A região Nordeste é conhecida pela cultura e por uma gastronomia de sabores característicos. Aqui você vai conhecer doces que fazem parte dessa culinária.'
        ),
        block('bv-2', 'list', '', {
          listType: 'check',
          listItems: [
            { id: 'o1', text: 'Aplicar as boas práticas na manipulação de alimentos.' },
            { id: 'o2', text: 'Executar as receitas apresentadas.' },
          ],
        }),
      ],
    },
    {
      id: 'boas-praticas',
      title: 'Boas práticas (BPF)',
      description: 'Higiene e contaminação',
      order: 2,
      badgeName: 'Mãos limpas',
      badgeIcon: 'sparkles',
      blocks: [
        block('bp-1', 'heading', 'O que são as BPF'),
        block(
          'bp-2',
          'paragraph',
          'As Boas Práticas de Fabricação são procedimentos obrigatórios para garantir a qualidade dos alimentos, da produção primária à comercialização.'
        ),
        block('bp-3', 'quiz', '', {
          quizData: {
            questions: [
              {
                id: 'q1',
                question: 'Em quais fases do processo as BPF devem ser aplicadas?',
                options: [
                  {
                    id: 'q1-a',
                    text: 'Só durante o preparo',
                    isCorrect: false,
                    feedback: 'A embalagem e a venda também contam.',
                  },
                  {
                    id: 'q1-b',
                    text: 'Da produção primária à comercialização',
                    isCorrect: true,
                    feedback: 'Isso! Em todas as fases.',
                  },
                ],
              },
            ],
          },
        }),
        block('bp-4', 'heading', 'Tipos de contaminação'),
        block('bp-5', 'paragraph', 'A contaminação pode ser química, física ou biológica.'),
        block('bp-6', 'categorization', '', {
          categories: [
            { id: 'c-q', name: 'Química', items: [{ id: 'c-q-1', text: 'Agrotóxico' }] },
            { id: 'c-f', name: 'Física', items: [{ id: 'c-f-1', text: 'Prego' }] },
            { id: 'c-b', name: 'Biológica', items: [{ id: 'c-b-1', text: 'Bactéria' }] },
          ],
        }),
      ],
    },
    {
      id: 'utensilios',
      title: 'Conhecendo os utensílios',
      description: 'Ferramentas da produção',
      order: 3,
      blocks: [
        block('ut-1', 'heading', 'Pra que serve?'),
        block('ut-2', 'matching', '', {
          matchingPairs: [
            { id: 'ut-p1', left: 'Balança', right: 'Deixa a receita padronizada' },
            { id: 'ut-p2', left: 'Peneira', right: 'Separa o bagaço' },
          ],
        }),
      ],
    },
  ],
} as unknown as Course
