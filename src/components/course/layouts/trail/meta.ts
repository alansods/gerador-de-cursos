import type { LayoutMeta } from '../types'

export const trailMeta: LayoutMeta = {
  id: 'trail',
  name: 'Trilha',
  description:
    'Mapa de missões com XP, níveis, estrelas e medalhas: cada unidade vira uma missão dividida em etapas.',
  blockTheme: {
    accent: '#c24e22',
    accentSoft: '#ffe3d3',
    accentInk: '#b3461d',
    accentDark: '#f47a4c',
    accentSoftDark: '#4a2a22',
    accentInkDark: '#ffb08a',
    surface: {
      radius: '20px',
      borderWidth: '2.5px',
      borderColor: '#2b2140',
      borderColorDark: '#0b0812',
      shadow: '0 5px 0 #2b2140',
      shadowDark: '0 5px 0 #0b0812',
      background: '#fffdf7',
      backgroundDark: '#241c33',
    },
  },
}
