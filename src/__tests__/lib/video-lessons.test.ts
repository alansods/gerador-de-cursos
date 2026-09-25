/**
 * @jest-environment node
 */
import * as fs from 'fs/promises'
import * as os from 'os'
import * as path from 'path'
import JSZip from 'jszip'
import { generateSCORMFromPlayerDist } from '@/lib/scorm-service'
import {
  MAX_VIDEO_DESCRIPTION_LENGTH,
  deriveLessons,
  lessonsMissingVideo,
  missingVideoExportError,
  limitVideoDescription,
  videoLessonsCompletionRule,
} from '@/lib/video-lessons'
import { calculateProgress, completeStep, createEmptyState } from '@/lib/scorm-progress'
import type { Block, Course, Unit } from '@/types/course'

const video = (videoTitle = '', videoUrl = 'https://youtu.be/abc123def45') =>
  ({ id: videoTitle, type: 'video', videoTitle, videoUrl }) as Block

const moduleOf = (title: string, blocks: Block[]) => ({ id: title, title, blocks }) as Unit

describe('deriveLessons', () => {
  it('turns every video block into a lesson, in block order', () => {
    const lessons = deriveLessons(moduleOf('Módulo', [video('Aula A'), video('Aula B')]))

    expect(lessons.map((l) => [l.title, l.blockIndex])).toEqual([
      ['Aula A', 0],
      ['Aula B', 1],
    ])
  })

  it('names an untitled lesson after the module and its position', () => {
    const lessons = deriveLessons(moduleOf('Fundamentos', [video('Aula A'), video('  ')]))

    expect(lessons[1].title).toBe('Fundamentos — Aula 2')
  })

  it('ignores blocks that are not videos and returns nothing for an empty module', () => {
    const stray = { id: 'p', type: 'paragraph', content: 'x' } as Block

    expect(deriveLessons(moduleOf('M', [stray, video('Aula')]))).toHaveLength(1)
    expect(deriveLessons(moduleOf('M', []))).toEqual([])
  })
})

describe('videoLessonsCompletionRule', () => {
  const course = {
    units: [
      moduleOf('M1', [video('A'), video('B')]),
      moduleOf('M2', []),
      moduleOf('M3', [video('C')]),
    ],
  }
  const rule = videoLessonsCompletionRule(course)

  it('counts one step per lesson in each module', () => {
    expect(rule).toEqual({ kind: 'steps', stepCounts: [2, 0, 1] })
  })

  it('completes the course when every lesson is marked, even with an empty module', () => {
    let state = createEmptyState(3)
    state = completeStep(state, 0, 0)
    state = completeStep(state, 0, 1)
    expect(calculateProgress(state, rule).completed).toBe(false)

    state = completeStep(state, 2, 0)
    expect(calculateProgress(state, rule)).toMatchObject({ completed: true, percentage: 100 })
  })
})

describe('lessonsMissingVideo', () => {
  it('lists the lessons whose video was not added yet', () => {
    const course = {
      units: [moduleOf('M1', [video('A'), video('B', '')]), moduleOf('M2', [video('C', '   ')])],
    }

    expect(lessonsMissingVideo(course)).toEqual([
      { unitIndex: 0, lessonIndex: 1, unitTitle: 'M1', lessonTitle: 'B' },
      { unitIndex: 1, lessonIndex: 0, unitTitle: 'M2', lessonTitle: 'C' },
    ])
  })
})

describe('limitVideoDescription', () => {
  it('keeps a description within the limit and cuts a longer one', () => {
    expect(limitVideoDescription('Aula sobre records')).toEqual({
      videoDescription: 'Aula sobre records',
    })
    expect(limitVideoDescription('a'.repeat(3000)).videoDescription).toHaveLength(
      MAX_VIDEO_DESCRIPTION_LENGTH
    )
  })

  it('adds nothing when the block has no description', () => {
    expect(limitVideoDescription(undefined)).toEqual({})
    expect(limitVideoDescription(42)).toEqual({})
  })
})

describe('video lessons data in the exported package', () => {
  let root: string

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'video-lessons-package-'))
    await fs.mkdir(path.join(root, 'player', 'dist'), { recursive: true })
    await fs.writeFile(
      path.join(root, 'player', 'dist', 'index.html'),
      '<html><head></head><body><script>window.c = null /* COURSE_DATA_PLACEHOLDER */;</script></body></html>'
    )
    jest.spyOn(process, 'cwd').mockReturnValue(root)
    jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(async () => {
    jest.restoreAllMocks()
    await fs.rm(root, { recursive: true, force: true })
  })

  it('carries the course objectives and each lesson description to the player', async () => {
    const course = {
      id: 'curso-1',
      title: 'Curso',
      description: '',
      workload: '1h',
      modality: 'Online',
      category: 'Tecnologia',
      layout: 'video-lessons',
      objectives: ['Criar uma API'],
      units: [
        {
          id: 'u1',
          title: 'Módulo 1',
          description: '',
          order: 0,
          blocks: [
            {
              id: 'b1',
              type: 'video',
              order: 0,
              videoSource: 'youtube',
              videoUrl: 'https://www.youtube.com/watch?v=abc123def45',
              videoTitle: 'Aula 1',
              videoDescription: 'O que é o .NET',
            },
          ],
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Course

    const zip = await JSZip.loadAsync(await generateSCORMFromPlayerDist(course, 'curso-1', null))
    const html = (await zip.file('index.html')?.async('string')) ?? ''

    expect(html).toContain('"objectives":["Criar uma API"]')
    expect(html).toContain('"videoDescription":"O que é o .NET"')
  })
})

describe('missingVideoExportError', () => {
  const course = (layout: string, blocks: Block[]) => ({
    layout,
    units: [moduleOf('M1', [video('Olá, .NET')]), moduleOf('M2', blocks)],
  })

  it('refuses the export and names every pending lesson', () => {
    expect(missingVideoExportError(course('video-lessons', [video('A'), video('B', '')]))).toBe(
      'Adicione o vídeo das aulas pendentes antes de exportar: Módulo 2 · Aula 2 (B)'
    )
  })

  it('lets the export through when every lesson has a video or in other layouts', () => {
    expect(missingVideoExportError(course('video-lessons', [video('A')]))).toBeNull()
    expect(missingVideoExportError(course('classic', [video('B', '')]))).toBeNull()
  })
})
