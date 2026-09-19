/**
 * @jest-environment node
 */
import * as fs from 'fs/promises'
import * as os from 'os'
import * as path from 'path'
import JSZip from 'jszip'
import { generateSCORMFromPlayerDist } from '@/lib/scorm-service'
import { tutorApiOrigin, tutorPackageConfig } from '@/lib/tutor/package-config'
import { prisma } from '@/lib/prisma'
import type { Course } from '@/types/course'

const mockPrisma = prisma as unknown as {
  course: { findUnique: jest.Mock; update: jest.Mock }
}

const course = {
  id: 'curso-1',
  title: 'Curso',
  description: '',
  workload: '1h',
  modality: 'Online',
  category: 'Tecnologia',
  units: [],
  createdAt: new Date(),
  updatedAt: new Date(),
} as Course

describe('tutorPackageConfig', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns nothing when the tutor is off, so the package carries no tutor config', async () => {
    mockPrisma.course.findUnique.mockResolvedValue({ tutorEnabled: false, tutorToken: 'tok' })

    await expect(tutorPackageConfig('curso-1', 'https://app.senai.br')).resolves.toBeNull()
  })

  it('points the package at the public route with the course token', async () => {
    mockPrisma.course.findUnique.mockResolvedValue({ tutorEnabled: true, tutorToken: 'tok-1' })

    await expect(tutorPackageConfig('curso-1', 'https://app.senai.br')).resolves.toEqual({
      endpoint: 'https://app.senai.br/api/public/tutor/curso-1',
      token: 'tok-1',
    })
    expect(mockPrisma.course.update).not.toHaveBeenCalled()
  })

  it('creates the token for a course enabled before tokens existed', async () => {
    mockPrisma.course.findUnique.mockResolvedValue({ tutorEnabled: true, tutorToken: null })

    const config = await tutorPackageConfig('curso-1', 'https://app.senai.br')

    expect(config?.token).toMatch(/^[A-Za-z0-9_-]{32}$/)
    expect(mockPrisma.course.update).toHaveBeenCalledWith({
      where: { id: 'curso-1' },
      data: { tutorToken: config?.token },
    })
  })
})

describe('tutorApiOrigin', () => {
  const env = { ...process.env }
  afterEach(() => {
    process.env = { ...env }
  })

  it('prefers the configured URL, then the Vercel production URL, then the request origin', () => {
    delete process.env.TUTOR_PUBLIC_API_URL
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL
    expect(tutorApiOrigin('http://localhost:3000/api/generate-scorm-v2')).toBe(
      'http://localhost:3000'
    )

    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'cursos.senai.br'
    expect(tutorApiOrigin('http://localhost:3000/x')).toBe('https://cursos.senai.br')

    process.env.TUTOR_PUBLIC_API_URL = 'https://tutor.senai.br/'
    expect(tutorApiOrigin('http://localhost:3000/x')).toBe('https://tutor.senai.br')
  })
})

describe('tutor config in the exported package', () => {
  let root: string

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'tutor-package-'))
    await fs.mkdir(path.join(root, 'player', 'dist'), { recursive: true })
    await fs.writeFile(
      path.join(root, 'player', 'dist', 'index.html'),
      '<html><head></head><body><script>window.c = null /* COURSE_DATA_PLACEHOLDER */;window.t = null /* TUTOR_CONFIG_PLACEHOLDER */;</script></body></html>'
    )
    jest.spyOn(process, 'cwd').mockReturnValue(root)
    jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(async () => {
    jest.restoreAllMocks()
    await fs.rm(root, { recursive: true, force: true })
  })

  async function indexHtml(config: Parameters<typeof generateSCORMFromPlayerDist>[3]) {
    const zip = await JSZip.loadAsync(
      await generateSCORMFromPlayerDist(course, 'curso-1', null, config)
    )
    return (await zip.file('index.html')?.async('string')) ?? ''
  }

  it('injects the endpoint and token when the tutor is on', async () => {
    const html = await indexHtml({
      endpoint: 'https://app.senai.br/api/public/tutor/curso-1',
      token: 'tok-1',
    })

    expect(html).toContain(
      'window.t = {"endpoint":"https://app.senai.br/api/public/tutor/curso-1","token":"tok-1"}'
    )
  })

  it('leaves the tutor config empty when the tutor is off', async () => {
    const html = await indexHtml(null)

    expect(html).toContain('window.t = null;')
    expect(html).not.toContain('TUTOR_CONFIG_PLACEHOLDER')
  })
})
