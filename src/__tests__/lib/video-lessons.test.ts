/**
 * @jest-environment node
 */
import * as fs from 'fs/promises'
import * as os from 'os'
import * as path from 'path'
import JSZip from 'jszip'
import { generateSCORMFromPlayerDist } from '@/lib/scorm-service'
import { MAX_VIDEO_DESCRIPTION_LENGTH, limitVideoDescription } from '@/lib/video-lessons'
import type { Course } from '@/types/course'

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
