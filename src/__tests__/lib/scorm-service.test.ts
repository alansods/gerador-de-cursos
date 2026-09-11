import { generateManifest, generateSCORMFromPlayerDist } from '@/lib/scorm-service'
import type { Course } from '@/types/course'

const course: Course = {
  id: 'curso-1',
  titulo: 'Segurança do Trabalho',
  descricao: '',
  cargaHoraria: '8 horas',
  modalidade: 'Online',
  categoria: 'Gestão',
  unidades: [],
}

describe('generateManifest', () => {
  it('lista exatamente os arquivos que foram para o ZIP', () => {
    const manifesto = generateManifest(course, ['index.html', 'assets/app.js'])

    expect(manifesto).toContain('<file href="index.html"/>')
    expect(manifesto).toContain('<file href="assets/app.js"/>')
    expect(manifesto).not.toContain('scorm_api_wrapper.js')
  })

  it('escapa o título do curso no XML', () => {
    const manifesto = generateManifest({ ...course, titulo: 'NR-6 & EPI' }, ['index.html'])

    expect(manifesto).toContain('<title>NR-6 &amp; EPI</title>')
  })
})

describe('generateSCORMFromPlayerDist', () => {
  it('falha com mensagem acionável quando o player não foi buildado', async () => {
    const cwd = jest.spyOn(process, 'cwd').mockReturnValue('/tmp/sem-player-dist')

    await expect(generateSCORMFromPlayerDist(course)).rejects.toThrow(
      'player/dist/index.html não encontrado'
    )

    cwd.mockRestore()
  })
})
