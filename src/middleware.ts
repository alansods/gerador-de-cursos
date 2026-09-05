import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { can, mapCargoParaRole, ROLES, type RoleUsuario } from '@/lib/permissions'
import { casaPrefixo, regraDaRota } from '@/lib/rotas-protegidas'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)

const ROTAS_PUBLICAS = [
  '/login',
  '/cadastro',
  '/landingpage',
  '/preview',
  '/pdf-preview',
  '/scorm-preview',
]

interface SessaoMiddleware {
  id: string
  role: RoleUsuario
}

async function lerSessao(req: NextRequest): Promise<SessaoMiddleware | null> {
  const token = req.cookies.get('auth-token')?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const roleDoToken = payload.role
    const role =
      typeof roleDoToken === 'string' && ROLES.includes(roleDoToken as RoleUsuario)
        ? (roleDoToken as RoleUsuario)
        : mapCargoParaRole(payload.cargo as string | undefined)

    return { id: payload.id as string, role }
  } catch {
    return null
  }
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const ehApi = pathname.startsWith('/api')

  const ehPublica = ROTAS_PUBLICAS.some((rota) => casaPrefixo(pathname, rota))
  const regra = regraDaRota(pathname)

  if (!ehPublica && regra) {
    const sessao = await lerSessao(req)

    if (!sessao) {
      return ehApi
        ? NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
        : NextResponse.redirect(new URL('/login', req.url))
    }

    if (!can(sessao, regra.acao)) {
      return ehApi
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
