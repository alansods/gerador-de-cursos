import type { Course } from '../../src/types/course'

const lesson = (id: string, title: string, description: string) =>
  ({
    id,
    type: 'video',
    content: '',
    order: 0,
    videoSource: 'youtube',
    videoUrl: 'https://www.youtube.com/watch?v=abcdefghijk',
    videoTitle: title,
    videoDescription: description,
  }) as never

export const videoLessonsCourse = {
  id: 'curso-teste-aulas-em-video',
  title: 'Rails do zero',
  description: 'Curso usado para validar o layout Aulas em vídeo no LMS',
  workload: '4h',
  modality: 'EAD',
  category: 'Programação',
  layout: 'video-lessons',
  objectives: ['Criar um projeto Rails'],
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  units: [
    {
      id: 'primeiros-passos',
      title: 'Primeiros passos',
      description: 'Instalação e primeiro projeto.',
      order: 1,
      blocks: [
        lesson('pp-1', 'Instalando o Rails', 'Instalação do Ruby e do Rails.'),
        lesson('pp-2', 'Primeiro projeto', 'Criação do primeiro projeto.'),
      ],
    },
    {
      id: 'rotas',
      title: 'Rotas',
      description: 'Rotas REST.',
      order: 2,
      blocks: [lesson('ro-1', 'Rotas REST', 'Rotas no padrão REST.')],
    },
  ],
} as unknown as Course
