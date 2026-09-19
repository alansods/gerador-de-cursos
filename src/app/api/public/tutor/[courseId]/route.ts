import { NextRequest, NextResponse, after } from 'next/server'
import { prisma } from '@/lib/prisma'
import { askTutor, TUTOR_MAX_QUESTION_LENGTH } from '@/lib/tutor/ask'
import {
  consumeTutorQuota,
  isValidSessionId,
  purgeExpiredTutorUsage,
  tokensMatch,
} from '@/lib/tutor/public-access'
import { parseProgress } from '@/lib/tutor/learner-context'
import { upgradeUnits } from '@/lib/legacy-course'
import type { Unit } from '@/types/course'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
}

function reply(body: Record<string, unknown>, status: number, headers: Record<string, string> = {}) {
  return NextResponse.json(body, { status, headers: { ...CORS_HEADERS, ...headers } })
}

function refuse(error: string, status: number, headers?: Record<string, string>) {
  return reply({ success: false, error }, status, headers)
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const { courseId } = await params
    const body = await req.json().catch(() => ({}))
    const question = typeof body.question === 'string' ? body.question.trim() : ''

    if (!question || question.length > TUTOR_MAX_QUESTION_LENGTH) {
      return refuse(`Escreva uma pergunta de até ${TUTOR_MAX_QUESTION_LENGTH} caracteres`, 400)
    }

    if (!isValidSessionId(body.sessionId)) {
      return refuse('Sessão inválida', 400)
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { tutorEnabled: true, tutorToken: true, units: true },
    })

    const token = typeof body.token === 'string' ? body.token : null

    if (!course || !tokensMatch(course.tutorToken, token)) {
      return refuse('Acesso ao tutor não autorizado', 401)
    }

    if (!course.tutorEnabled) {
      return refuse('O tutor não está ativo neste curso', 403)
    }

    const quota = await consumeTutorQuota(courseId, body.sessionId)
    after(() => purgeExpiredTutorUsage().catch(() => undefined))

    if (!quota.allowed) {
      return refuse(
        quota.scope === 'session'
          ? 'Muitas perguntas seguidas. Aguarde um instante e tente de novo.'
          : 'O tutor atingiu o limite de perguntas de hoje neste curso.',
        429,
        { 'Retry-After': String(quota.retryAfterSeconds) }
      )
    }

    const units = upgradeUnits(course.units) as unknown as Unit[]
    const progress = parseProgress(body.progress, units.length)
    const answer = await askTutor(courseId, question, { units, progress })
    return reply({ success: true, answer: answer.answer, grounded: answer.grounded }, 200)
  } catch (error) {
    console.error('The public tutor failed to answer:', error)
    return refuse('O tutor está indisponível no momento', 503)
  }
}
