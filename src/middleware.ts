import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { can, mapJobTitleToRole, ROLES, type UserRole } from '@/lib/permissions'
import { matchesPrefix, routeRule } from '@/lib/protected-routes'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)

const PUBLIC_PATHS = [
  '/login',
  '/cadastro',
  '/landingpage',
  '/preview',
  '/pdf-preview',
  '/scorm-preview',
]

interface MiddlewareSession {
  id: string
  role: UserRole
}

async function readSession(req: NextRequest): Promise<MiddlewareSession | null> {
  const token = req.cookies.get('auth-token')?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const tokenRole = payload.role
    const role =
      typeof tokenRole === 'string' && ROLES.includes(tokenRole as UserRole)
        ? (tokenRole as UserRole)
        : mapJobTitleToRole(payload.cargo as string | undefined)

    return { id: payload.id as string, role }
  } catch {
    return null
  }
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isApi = pathname.startsWith('/api')

  const isPublic = PUBLIC_PATHS.some((route) => matchesPrefix(pathname, route))
  const rule = routeRule(pathname)

  if (!isPublic && rule) {
    const session = await readSession(req)

    if (!session) {
      return isApi
        ? NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
        : NextResponse.redirect(new URL('/login', req.url))
    }

    if (!can(session, rule.action)) {
      return isApi
        ? NextResponse.json(
            { success: false, error: 'Você não tem permissão para acessar este recurso' },
            { status: 403 }
          )
        : NextResponse.redirect(new URL('/home', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
}
