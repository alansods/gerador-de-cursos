/**
 * @jest-environment node
 */
import { assessmentText, blockText, courseSections, htmlToText } from '@/lib/tutor/course-text'
import { chunksHash, prepareChunks, reindexCourseContent } from '@/lib/tutor/knowledge'
import { prisma } from '@/lib/prisma'
import type { TutorProvider } from '@/lib/tutor/provider'
import type { Block, Unit } from '@/types/course'

const mockPrisma = prisma as unknown as {
  knowledgeSource: { findFirst: jest.Mock; create: jest.Mock; deleteMany: jest.Mock }
  $executeRaw: jest.Mock
  $queryRaw: jest.Mock
}

mockPrisma.knowledgeSource = { findFirst: jest.fn(), create: jest.fn(), deleteMany: jest.fn() }
mockPrisma.$executeRaw = jest.fn()
mockPrisma.$queryRaw = jest.fn()

function block(partial: Partial<Block>, order = 0): Block {
  return { id: `b${order}`, type: 'paragraph', content: '', order, ...partial } as Block
}

function unit(title: string, blocks: Block[], order = 0): Unit {
  return { id: `u${order}`, title, description: '', blocks, order }
}

function fakeProvider(): TutorProvider & { embedDocuments: jest.Mock } {
  return {
    embedDocuments: jest.fn(async (texts: string[]) => texts.map(() => [0.5])),
    embedQuery: jest.fn(),
    answer: jest.fn(),
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockPrisma.knowledgeSource.create.mockResolvedValue({ id: 'new-source' })
})

describe('htmlToText', () => {
  it('strips tags, decodes entities and keeps line breaks', () => {
    expect(htmlToText('<p>Uso de <strong>EPI</strong> &amp; EPC</p><p>Linha&nbsp;2</p>')).toBe(
      'Uso de EPI & EPC\nLinha 2'
    )
  })
})

describe('blockText', () => {
  it('reads the text of instructional blocks', () => {
    expect(
      blockText(
        block({
          type: 'accordion',
          items: [{ id: '1', title: 'Luvas', content: '<p>Protegem as mãos</p>' }],
        })
      )
    ).toBe('Luvas\nProtegem as mãos')
    expect(blockText(block({ type: 'audio', audioTitle: 'Aula', transcript: 'Transcrição' }))).toBe(
      'Aula\nTranscrição'
    )
  })

  it('leaves out graded activities so the tutor does not hand out answers', () => {
    expect(
      blockText(
        block({
          type: 'quiz',
          quizData: {
            questions: [
              {
                id: 'q',
                question: 'Qual EPI?',
                options: [{ id: 'o', text: 'Luva', isCorrect: true, feedback: '' }],
              },
            ],
          },
        })
      )
    ).toBe('')
    expect(
      blockText(
        block({
          type: 'true-false',
          trueFalseItems: [{ id: 't', statement: 'X', answer: 'true', explanation: 'Y' }],
        })
      )
    ).toBe('')
    expect(
      blockText(
        block({
          type: 'interactive-image',
          hotspotMode: 'find',
          hotspots: [{ id: 'h', x: 0, y: 0, title: 'Alvo', content: 'Resposta' }],
        })
      )
    ).toBe('')
  })

  it('keeps an interactive image in explore mode', () => {
    expect(
      blockText(
        block({
          type: 'interactive-image',
          hotspotMode: 'explore',
          hotspots: [{ id: 'h', x: 0, y: 0, title: 'Capacete', content: 'Protege a cabeça' }],
        })
      )
    ).toBe('Capacete\nProtege a cabeça')
  })
})

describe('assessmentText', () => {
  it('keeps the quiz question, options and author hint, but not which option is right', () => {
    const text = assessmentText(
      block({
        type: 'quiz',
        quizData: {
          questions: [
            {
              id: 'q',
              question: 'Qual equipamento protege as mãos?',
              hint: 'Pense no que se veste.',
              options: [
                { id: 'a', text: 'Luva', isCorrect: true, feedback: 'Correto, a luva protege.' },
                { id: 'b', text: 'Extintor', isCorrect: false, feedback: 'Extintor é EPC.' },
              ],
            },
          ],
        },
      })
    )

    expect(text).toContain('Qual equipamento protege as mãos?')
    expect(text).toContain('- Luva')
    expect(text).toContain('- Extintor')
    expect(text).toContain('Dica do autor: Pense no que se veste.')
    expect(text).not.toMatch(/Correto|correta|EPC|true/i)
  })

  it('keeps the interactive video question without the right letter or feedback', () => {
    const text = assessmentText(
      block({
        type: 'interactive-video',
        videoQuestions: [
          {
            id: 'v',
            time: '00:30',
            question: 'O que o operador esqueceu?',
            optionA: 'Capacete',
            optionB: 'Óculos',
            correct: 'B',
            feedback: 'Faltaram os óculos.',
          },
        ],
      })
    )

    expect(text).toContain('O que o operador esqueceu?')
    expect(text).toContain('- Capacete')
    expect(text).not.toMatch(/Faltaram|correct|\bB\b/)
  })

  it('keeps true-false statements without the verdict or explanation', () => {
    const text = assessmentText(
      block({
        type: 'true-false',
        trueFalseItems: [
          { id: 't', statement: 'Luva é EPC.', answer: 'false', explanation: 'Luva é EPI.' },
        ],
      })
    )

    expect(text).toContain('Luva é EPC.')
    expect(text).not.toMatch(/false|falsa\b|Luva é EPI/)
  })

  it('keeps the scenario situation and options without outcomes or consequences', () => {
    const text = assessmentText(
      block({
        type: 'scenario',
        scenarioSituation: 'Um colega está sem capacete.',
        scenarioOptions: [
          {
            id: 'a',
            text: 'Avisar o colega',
            outcome: 'correct',
            consequence: 'Acidente evitado.',
          },
          { id: 'b', text: 'Ignorar', outcome: 'incorrect', consequence: 'Ele se machuca.' },
        ],
      })
    )

    expect(text).toContain('Um colega está sem capacete.')
    expect(text).toContain('- Avisar o colega')
    expect(text).not.toMatch(/correct|evitado|machuca/)
  })

  it('lists sequence items alphabetically, never in the saved order', () => {
    const text = assessmentText(
      block({
        type: 'sequence',
        sequenceItems: [
          { id: '1', text: 'Vestir a luva' },
          { id: '2', text: 'Checar a luva' },
          { id: '3', text: 'Ajustar o punho' },
        ],
      })
    )

    expect(text).toContain('- Ajustar o punho\n- Checar a luva\n- Vestir a luva')
  })

  it('lists matching columns separately, each sorted, so the pairs are not given away', () => {
    const text = assessmentText(
      block({
        type: 'matching',
        matchingPairs: [
          { id: '1', left: 'Luva', right: 'Mãos' },
          { id: '2', left: 'Capacete', right: 'Cabeça' },
        ],
      })
    )

    expect(text).toContain('Coluna A:\n1. Capacete\n2. Luva')
    expect(text).toContain('Coluna B:\n1. Cabeça\n2. Mãos')
    expect(text).not.toMatch(/Luva.*Mãos|Capacete.*Cabeça/)
  })

  it('lists categories and items apart, without saying where each item goes', () => {
    const text = assessmentText(
      block({
        type: 'categorization',
        categories: [
          { id: 'c1', name: 'EPI', items: [{ id: 'i1', text: 'Luva' }] },
          { id: 'c2', name: 'EPC', items: [{ id: 'i2', text: 'Extintor' }] },
        ],
      })
    )

    expect(text).toBe('Categorias: EPC; EPI\nItens para classificar: Extintor; Luva')
  })

  it('blanks out the fill-in answers and leaves the distractors out', () => {
    const text = assessmentText(
      block({
        type: 'fill-blanks',
        fillBlanksText: 'A [luva] protege as [mãos].',
        fillBlanksDistractors: ['pés'],
      })
    )

    expect(text).toContain('A ____ protege as ____.')
    expect(text).not.toMatch(/luva|mãos|pés/)
  })

  it('keeps only the word search clues', () => {
    const text = assessmentText(
      block({
        type: 'word-search',
        wordSearchItems: [{ id: 'w', word: 'CAPACETE', clue: 'Protege a cabeça' }],
      })
    )

    expect(text).toContain('- Protege a cabeça')
    expect(text).not.toMatch(/CAPACETE/i)
  })

  it('indexes nothing from an interactive image in find mode', () => {
    expect(
      assessmentText(
        block({
          type: 'interactive-image',
          hotspotMode: 'find',
          hotspots: [{ id: 'h', x: 0, y: 0, title: 'Alvo', content: 'Resposta' }],
        })
      )
    ).toBe('')
  })

  it('returns nothing for instructional blocks', () => {
    expect(assessmentText(block({ content: 'Texto' }))).toBe('')
  })
})

describe('courseSections', () => {
  it('labels sections by unit and heading, in order', () => {
    const sections = courseSections([
      unit(
        'Segurança',
        [
          block({ type: 'heading', content: 'EPI' }, 1),
          block({ content: '<p>Equipamento individual.</p>' }, 2),
          block({ type: 'heading', content: 'EPC' }, 3),
          block({ content: 'Equipamento coletivo.' }, 4),
        ],
        1
      ),
      unit('Introdução', [block({ content: 'Boas-vindas.' })], 0),
    ])

    expect(sections).toEqual([
      { label: 'Unidade 1 — Introdução', text: 'Boas-vindas.' },
      { label: 'Unidade 2 — Segurança › EPI', text: 'EPI\n\nEquipamento individual.' },
      { label: 'Unidade 2 — Segurança › EPC', text: 'EPC\n\nEquipamento coletivo.' },
    ])
  })
})

describe('courseSections with activities', () => {
  it('puts each activity in its own section, labeled as an activity of its unit', () => {
    const sections = courseSections([
      unit('Segurança', [
        block({ type: 'heading', content: 'EPI' }, 1),
        block({ content: 'Luva protege as mãos.' }, 2),
        block(
          {
            type: 'true-false',
            trueFalseItems: [
              { id: 't', statement: 'Luva é EPC.', answer: 'false', explanation: '' },
            ],
          },
          3
        ),
        block({ content: 'Capacete protege a cabeça.' }, 4),
      ]),
    ])

    expect(sections).toEqual([
      { label: 'Unidade 1 — Segurança › EPI', text: 'EPI\n\nLuva protege as mãos.' },
      {
        label: 'Unidade 1 — Segurança › Atividade avaliativa: Verdadeiro ou falso',
        text: 'Afirmações para julgar como verdadeiras ou falsas:\n- Luva é EPC.',
      },
      { label: 'Unidade 1 — Segurança › EPI', text: 'Capacete protege a cabeça.' },
    ])
  })
})

describe('reindexCourseContent', () => {
  const units = [unit('Segurança', [block({ content: 'EPI protege o trabalhador.' })])]

  it('does nothing when the course text did not change', async () => {
    const hash = chunksHash(prepareChunks(courseSections(units)))
    mockPrisma.knowledgeSource.findFirst.mockResolvedValue({ id: 's1', contentHash: hash })
    const provider = fakeProvider()

    expect(await reindexCourseContent('c1', units, provider)).toBe('unchanged')
    expect(provider.embedDocuments).not.toHaveBeenCalled()
    expect(mockPrisma.$executeRaw).not.toHaveBeenCalled()
  })

  it('removes the course source when the course has no text left', async () => {
    mockPrisma.knowledgeSource.findFirst.mockResolvedValue({ id: 's1', contentHash: 'x' })

    expect(await reindexCourseContent('c1', [unit('', [])], fakeProvider())).toBe('removed')
    expect(mockPrisma.knowledgeSource.deleteMany).toHaveBeenCalledWith({
      where: { courseId: 'c1', kind: 'COURSE' },
    })
  })

  it('embeds only the chunks that changed and replaces the previous course source', async () => {
    const [unchanged] = prepareChunks(courseSections(units))
    mockPrisma.knowledgeSource.findFirst.mockResolvedValue({ id: 's1', contentHash: 'old' })
    mockPrisma.$queryRaw.mockResolvedValue([{ ...unchanged, embedding: '[0.9]' }])
    const provider = fakeProvider()

    const edited = [
      unit('Segurança', [
        block({ content: 'EPI protege o trabalhador.' }),
        block({ type: 'heading', content: 'Novo tópico' }, 1),
        block({ content: 'Texto novo.' }, 2),
      ]),
    ]

    expect(await reindexCourseContent('c1', edited, provider)).toBe('indexed')
    expect(provider.embedDocuments).toHaveBeenCalledWith([
      'Unidade 1 — Segurança › Novo tópico\n\nNovo tópico\n\nTexto novo.',
    ])
    expect(mockPrisma.knowledgeSource.deleteMany).toHaveBeenCalledWith({
      where: { courseId: 'c1', kind: 'COURSE' },
    })
    expect(mockPrisma.knowledgeSource.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ courseId: 'c1', kind: 'COURSE' }),
    })
  })
})
