/**
 * @jest-environment node
 */
import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import JSZip from 'jszip'
import {
  buildIllustrationCredits,
  findLibraryItem,
  isLibraryIllustrationPath,
  libraryPackageFileName,
  readLicenseTexts,
  type IllustrationItem,
  type IllustrationManifest,
} from '@/lib/illustration-library'
import { detectMediaUrls, downloadAndUpdateImages } from '@/lib/scorm-build-service'
import { generateSCORMFromPlayerDist } from '@/lib/scorm-service'
import type { Course } from '@/types/course'

const item = (overrides: Partial<IllustrationItem>): IllustrationItem => ({
  id: 'culinary-ingredients-coconut',
  title: 'Coco',
  theme: 'culinary',
  category: 'ingredients',
  file: 'culinary/ingredients/coconut.svg',
  tags: ['coco'],
  width: 64,
  height: 64,
  set: 'original',
  license: 'original',
  author: 'Gerador de Cursos',
  ...overrides,
})

const apple = item({
  id: 'fruits-apple',
  title: 'Maçã',
  file: 'culinary/ingredients/apple.svg',
  set: 'fluent-emoji',
  license: 'MIT',
  author: 'Microsoft',
  source: 'https://github.com/microsoft/fluentui-emoji',
})

const manifest: IllustrationManifest = {
  version: 1,
  themes: [{ id: 'culinary', title: 'Culinária' }],
  categories: [{ id: 'ingredients', theme: 'culinary', title: 'Ingredientes' }],
  items: [item({}), apple],
}

const courseWith = (images: string[]): Course => ({
  id: 'curso-ilustrado',
  title: 'Curso',
  description: '',
  workload: '',
  modality: '',
  category: '',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  units: [
    {
      id: 'u1',
      title: 'U1',
      description: '',
      order: 0,
      blocks: [
        {
          id: 'b1',
          type: 'technical-sheet',
          content: '',
          order: 0,
          sheetMaterials: images.map((image, index) => ({
            id: `m${index}`,
            name: `Material ${index}`,
            quantity: '',
            image,
          })),
          sheetSteps: [{ id: 's1', text: 'Passo' }],
        },
      ],
    },
  ],
})

describe('library illustration paths', () => {
  it('accepts only svg files inside a theme and category folder', () => {
    expect(isLibraryIllustrationPath('/illustrations/culinary/ingredients/coconut.svg')).toBe(true)
    expect(isLibraryIllustrationPath('/illustrations/culinary/../../secret.svg')).toBe(false)
    expect(isLibraryIllustrationPath('/illustrations/culinary/coconut.svg')).toBe(false)
    expect(isLibraryIllustrationPath('/illustrations/culinary/ingredients/coconut.png')).toBe(false)
    expect(isLibraryIllustrationPath('https://x.com/illustrations/a/b/c.svg')).toBe(false)
    expect(isLibraryIllustrationPath(undefined)).toBe(false)
  })

  it('names the packaged file after theme, category and name', () => {
    expect(libraryPackageFileName('/illustrations/food-safety/scenes/hand-washing.svg')).toBe(
      'illustration-food-safety-scenes-hand-washing.svg'
    )
  })

  it('finds only items listed in the manifest', () => {
    expect(findLibraryItem(manifest, '/illustrations/culinary/ingredients/apple.svg')).toBe(apple)
    expect(
      findLibraryItem(manifest, '/illustrations/culinary/ingredients/pear.svg')
    ).toBeUndefined()
  })
})

describe('buildIllustrationCredits', () => {
  it('returns null when every illustration is original', () => {
    expect(buildIllustrationCredits([item({})])).toBeNull()
    expect(buildIllustrationCredits([])).toBeNull()
  })

  it('groups third-party items by set, once each, with the license text', () => {
    const credits = buildIllustrationCredits(
      [apple, item({}), apple, { ...apple, id: 'fruits-pear', title: 'Pera' }],
      { 'fluent-emoji': 'MIT License\nCopyright (c) Microsoft Corporation.' }
    )

    expect(credits).toContain('Acervo: fluent-emoji')
    expect(credits).toContain('Licença: MIT')
    expect(credits).toContain('Autor: Microsoft')
    expect(credits).toContain('Fonte: https://github.com/microsoft/fluentui-emoji')
    expect(credits).toContain('Ilustrações usadas: Maçã, Pera')
    expect(credits).toContain('Copyright (c) Microsoft Corporation.')
    expect(credits).not.toContain('Coco')
  })
})

describe('library illustrations in the SCORM export', () => {
  let root: string
  let cwd: jest.SpyInstance

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'illustrations-'))
    const library = path.join(root, 'public', 'illustrations')
    await fs.mkdir(path.join(library, 'culinary', 'ingredients'), { recursive: true })
    await fs.mkdir(path.join(library, 'licenses'), { recursive: true })
    await fs.writeFile(path.join(library, 'manifest.json'), JSON.stringify(manifest))
    await fs.writeFile(path.join(library, 'culinary/ingredients/coconut.svg'), '<svg id="coco"/>')
    await fs.writeFile(path.join(library, 'culinary/ingredients/apple.svg'), '<svg id="apple"/>')
    await fs.writeFile(path.join(library, 'licenses', 'fluent-emoji.txt'), 'MIT License')
    await fs.mkdir(path.join(root, 'player', 'dist'), { recursive: true })
    await fs.writeFile(
      path.join(root, 'player', 'dist', 'index.html'),
      '<html><head></head><body><script>window.c = null /* COURSE_DATA_PLACEHOLDER */</script></body></html>'
    )
    cwd = jest.spyOn(process, 'cwd').mockReturnValue(root)
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(async () => {
    cwd.mockRestore()
    jest.restoreAllMocks()
    await fs.rm(root, { recursive: true, force: true })
  })

  it('detects library paths next to remote media', () => {
    expect(
      detectMediaUrls(
        courseWith([
          '/illustrations/culinary/ingredients/coconut.svg',
          'https://x.com/a.png',
          '/outra/pasta/a.svg',
        ])
      )
    ).toEqual(['/illustrations/culinary/ingredients/coconut.svg', 'https://x.com/a.png'])
  })

  it('copies library files without HTTP, rewrites the blocks and builds the credits', async () => {
    const fetchSpy = jest.fn()
    global.fetch = fetchSpy as unknown as typeof fetch
    const coconut = '/illustrations/culinary/ingredients/coconut.svg'
    const appleUrl = '/illustrations/culinary/ingredients/apple.svg'
    const unlisted = '/illustrations/culinary/ingredients/pear.svg'

    const { course, credits } = await downloadAndUpdateImages(
      courseWith([coconut, appleUrl, coconut, unlisted]),
      'curso-ilustrado'
    )

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(course.units[0].blocks[0].sheetMaterials?.map((material) => material.image)).toEqual([
      'images/illustration-culinary-ingredients-coconut.svg',
      'images/illustration-culinary-ingredients-apple.svg',
      'images/illustration-culinary-ingredients-coconut.svg',
      unlisted,
    ])
    expect(
      (await fs.readdir(path.join(root, 'public', 'scorm-images', 'curso-ilustrado'))).sort()
    ).toEqual([
      'illustration-culinary-ingredients-apple.svg',
      'illustration-culinary-ingredients-coconut.svg',
    ])
    expect(credits).toContain('Ilustrações usadas: Maçã')
    expect(credits).toContain('MIT License')

    const zip = await JSZip.loadAsync(
      await generateSCORMFromPlayerDist(course, 'curso-ilustrado', credits)
    )
    expect(
      await zip.file('images/illustration-culinary-ingredients-apple.svg')?.async('string')
    ).toBe('<svg id="apple"/>')
    expect(await zip.file('illustration-credits.txt')?.async('string')).toBe(credits)
    expect(await zip.file('imsmanifest.xml')?.async('string')).toContain(
      '<file href="illustration-credits.txt"/>'
    )
  })

  it('adds no credits file when only original illustrations are used', async () => {
    const { course, credits } = await downloadAndUpdateImages(
      courseWith(['/illustrations/culinary/ingredients/coconut.svg']),
      'curso-ilustrado'
    )

    expect(credits).toBeNull()
    const zip = await JSZip.loadAsync(
      await generateSCORMFromPlayerDist(course, 'curso-ilustrado', credits)
    )
    expect(zip.file('illustration-credits.txt')).toBeNull()
    expect(zip.file('images/illustration-culinary-ingredients-coconut.svg')).not.toBeNull()
  })

  it('reads license texts only for third-party sets that have one', async () => {
    expect(
      await readLicenseTexts(
        ['fluent-emoji', 'original', 'noto-emoji', '../x'],
        path.join(root, 'public', 'illustrations')
      )
    ).toEqual({ 'fluent-emoji': 'MIT License' })
  })
})
