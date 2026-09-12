import { generateManifest, generateSCORMFromPlayerDist } from '@/lib/scorm-service'
import type { Course } from '@/types/course'

const course: Course = {
  id: 'curso-1',
  title: 'Segurança do Trabalho',
  description: '',
  workload: '8 horas',
  modality: 'Online',
  category: 'Gestão',
  units: [],
}

describe('generateManifest', () => {
  it('lists exactly the files that went into the ZIP', () => {
    const manifesto = generateManifest(course, ['index.html', 'assets/app.js'])

    expect(manifesto).toContain('<file href="index.html"/>')
    expect(manifesto).toContain('<file href="assets/app.js"/>')
    expect(manifesto).not.toContain('scorm_api_wrapper.js')
  })

  it('escapes the course title in the XML', () => {
    const manifesto = generateManifest({ ...course, title: 'NR-6 & EPI' }, ['index.html'])

    expect(manifesto).toContain('<title>NR-6 &amp; EPI</title>')
  })
})

describe('generateSCORMFromPlayerDist', () => {
  it('fails with an actionable message when the player was not built', async () => {
    const cwd = jest.spyOn(process, 'cwd').mockReturnValue('/tmp/sem-player-dist')

    await expect(generateSCORMFromPlayerDist(course)).rejects.toThrow(
      'player/dist/index.html não encontrado'
    )

    cwd.mockRestore()
  })
})
