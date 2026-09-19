export type SmallTalkKind = 'greeting' | 'wellbeing' | 'thanks' | 'goodbye'

const PHRASES: Record<SmallTalkKind, string[]> = {
  greeting: [
    'oi',
    'oie',
    'ola',
    'opa',
    'hey',
    'e ai',
    'eai',
    'bom dia',
    'boa tarde',
    'boa noite',
    'oi tutor',
    'ola tutor',
  ],
  wellbeing: [
    'tudo bem',
    'tudo bom',
    'tudo certo',
    'como vai',
    'como vai voce',
    'como voce esta',
    'como vc esta',
    'como esta',
    'beleza',
    'blz',
    'td bem',
  ],
  thanks: [
    'obrigado',
    'obrigada',
    'muito obrigado',
    'muito obrigada',
    'obg',
    'valeu',
    'vlw',
    'brigado',
    'brigada',
    'agradeco',
  ],
  goodbye: ['tchau', 'ate mais', 'ate logo', 'ate a proxima', 'falou', 'fui'],
}

const FILLERS = new Set(['e', 'ai', 'tutor', 'pra', 'voce', 'vc', 'ne', 'entao'])

const REPLIES: Record<SmallTalkKind, string> = {
  greeting: 'Olá! Sou o tutor deste curso. Pode me perguntar sobre o conteúdo das aulas.',
  wellbeing:
    'Tudo certo por aqui, obrigado! Posso ajudar com alguma dúvida sobre o conteúdo do curso?',
  thanks: 'Por nada! Se surgir outra dúvida sobre o curso, é só perguntar.',
  goodbye: 'Até mais! Bons estudos.',
}

const PRIORITY: SmallTalkKind[] = ['thanks', 'goodbye', 'wellbeing', 'greeting']

function normalize(message: string): string {
  return message
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const MATCHERS = (Object.keys(PHRASES) as SmallTalkKind[]).flatMap((kind) =>
  PHRASES[kind].map((phrase) => ({ kind, words: phrase.split(' ') }))
)
MATCHERS.sort((a, b) => b.words.length - a.words.length)

export function detectSmallTalk(message: string): SmallTalkKind | null {
  const words = normalize(message).split(' ').filter(Boolean)
  if (words.length === 0) return null

  const found = new Set<SmallTalkKind>()
  let index = 0

  while (index < words.length) {
    const match = MATCHERS.find(({ words: phrase }) =>
      phrase.every((word, offset) => words[index + offset] === word)
    )

    if (match) {
      found.add(match.kind)
      index += match.words.length
    } else if (FILLERS.has(words[index])) {
      index += 1
    } else {
      return null
    }
  }

  return PRIORITY.find((kind) => found.has(kind)) ?? null
}

export function smallTalkReply(kind: SmallTalkKind): string {
  return REPLIES[kind]
}
