import { prisma } from '@/lib/prisma'
import type { PapelColaborador } from '@/lib/permissions'

/**
 * Colaboração do usuário no curso, ou null se não houver.
 * É o terceiro argumento de `podeEditarCurso`: sem ele, um CONTEUDISTA com
 * acesso concedido seria tratado como se não tivesse.
 */
export async function buscarColaboracao(
  cursoId: string,
  userId: string
): Promise<{ papel: PapelColaborador } | null> {
  const colaboracao = await prisma.cursoColaborador.findUnique({
    where: { cursoId_userId: { cursoId, userId } },
    select: { papel: true },
  })

  return colaboracao ? { papel: colaboracao.papel } : null
}

export async function buscarCursoComColaboracao(cursoId: string, userId: string) {
  const [curso, colaboracao] = await Promise.all([
    prisma.curso.findUnique({
      where: { id: cursoId },
      include: { owner: { select: { id: true, nome: true, usuario: true } } },
    }),
    buscarColaboracao(cursoId, userId),
  ])

  return { curso, colaboracao }
}
