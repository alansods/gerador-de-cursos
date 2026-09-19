import { prisma } from '@/lib/prisma'
import { generateTutorToken } from '@/lib/tutor/public-access'

export interface TutorPackageConfig {
  endpoint: string
  token: string
}

export function tutorApiOrigin(requestUrl: string): string {
  const configured = process.env.TUTOR_PUBLIC_API_URL?.trim()
  if (configured) return configured.replace(/\/+$/, '')

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  if (production) return `https://${production}`

  return new URL(requestUrl).origin
}

export async function tutorPackageConfig(
  courseId: string,
  origin: string
): Promise<TutorPackageConfig | null> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { tutorEnabled: true, tutorToken: true },
  })

  if (!course?.tutorEnabled) return null

  let token = course.tutorToken
  if (!token) {
    token = generateTutorToken()
    await prisma.course.update({ where: { id: courseId }, data: { tutorToken: token } })
  }

  return { endpoint: `${origin}/api/public/tutor/${courseId}`, token }
}
