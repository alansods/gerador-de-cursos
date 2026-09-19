import { detectSmallTalk, smallTalkReply } from '@/lib/tutor/small-talk'

describe('detectSmallTalk', () => {
  it.each([
    ['Olá', 'greeting'],
    ['oi!!', 'greeting'],
    ['Bom dia, tutor', 'greeting'],
    ['E aí?', 'greeting'],
    ['tudo bem?', 'wellbeing'],
    ['Oi, tudo bem?', 'wellbeing'],
    ['olá, como você está?', 'wellbeing'],
    ['Obrigado!', 'thanks'],
    ['valeu, tchau', 'thanks'],
    ['muito obrigada', 'thanks'],
    ['Até mais', 'goodbye'],
    ['TCHAU', 'goodbye'],
  ])('recognizes "%s" as %s', (message, kind) => {
    expect(detectSmallTalk(message)).toBe(kind)
  })

  it.each([
    'oi, o que é EPI?',
    'olá, quantas unidades tem o curso?',
    'obrigado, mas e a ergonomia?',
    'qual é meu progresso?',
    'bom',
    '',
    '   ',
  ])('leaves "%s" to the normal flow', (message) => {
    expect(detectSmallTalk(message)).toBeNull()
  })

  it('has a reply for every kind, inviting a question about the course', () => {
    expect(smallTalkReply('greeting')).toMatch(/curso/)
    expect(smallTalkReply('wellbeing')).toMatch(/curso/)
    expect(smallTalkReply('thanks')).toMatch(/curso/)
    expect(smallTalkReply('goodbye')).toMatch(/Até mais/)
  })
})
