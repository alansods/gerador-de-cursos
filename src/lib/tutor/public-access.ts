import { randomBytes, timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/prisma'

export const TUTOR_TOKEN_HEADER = 'x-tutor-token'

const MINUTE_MS = 60 * 1000
const DAY_MS = 24 * 60 * MINUTE_MS

function positiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export function sessionLimitPerMinute(): number {
  return positiveNumber(process.env.TUTOR_SESSION_LIMIT_PER_MINUTE, 6)
}

export function courseDailyLimit(): number {
  return positiveNumber(process.env.TUTOR_COURSE_DAILY_LIMIT, 500)
}

export function generateTutorToken(): string {
  return randomBytes(24).toString('base64url')
}

export function tokensMatch(expected: string | null | undefined, received: string | null): boolean {
  if (!expected || !received) return false

  const a = Buffer.from(expected)
  const b = Buffer.from(received)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function isValidSessionId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{8,64}$/.test(value)
}

async function increment(key: string, windowMs: number, now: Date): Promise<number> {
  const expiresAt = new Date(now.getTime() + windowMs)
  const [row] = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO tutor_usage (key, count, expires_at)
    VALUES (${key}, 1, ${expiresAt})
    ON CONFLICT (key) DO UPDATE SET count = tutor_usage.count + 1
    RETURNING count`
  return Number(row.count)
}

export type QuotaResult =
  | { allowed: true }
  | { allowed: false; scope: 'session' | 'course'; retryAfterSeconds: number }

export async function consumeTutorQuota(
  courseId: string,
  sessionId: string,
  now = new Date()
): Promise<QuotaResult> {
  const minute = Math.floor(now.getTime() / MINUTE_MS)
  const day = Math.floor(now.getTime() / DAY_MS)

  const sessionCount = await increment(`session:${courseId}:${sessionId}:${minute}`, MINUTE_MS, now)
  if (sessionCount > sessionLimitPerMinute()) {
    const retryAfterSeconds = Math.ceil(((minute + 1) * MINUTE_MS - now.getTime()) / 1000)
    return { allowed: false, scope: 'session', retryAfterSeconds }
  }

  const courseCount = await increment(`course:${courseId}:${day}`, DAY_MS, now)
  if (courseCount > courseDailyLimit()) {
    const retryAfterSeconds = Math.ceil(((day + 1) * DAY_MS - now.getTime()) / 1000)
    return { allowed: false, scope: 'course', retryAfterSeconds }
  }

  return { allowed: true }
}

export async function purgeExpiredTutorUsage(now = new Date()): Promise<void> {
  await prisma.tutorUsage.deleteMany({ where: { expiresAt: { lt: now } } })
}
