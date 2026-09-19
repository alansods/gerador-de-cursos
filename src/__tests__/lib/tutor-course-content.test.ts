/**
 * @jest-environment node
 */
import { blockText, courseSections, htmlToText } from '@/lib/tutor/course-text'
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
