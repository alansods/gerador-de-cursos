import { prisma } from '@/lib/prisma'
import type { Colaboracao } from '@/lib/permissions'

/**
 * Colaboração do usuário no curso, ou null se não houver.
 * É o terceiro argumento de `podeEditarCurso`: sem ele, um CONTEUDISTA com
 * acesso concedido seria tratado como se não tivesse. Não há graus de acesso:
 * existir como colaborador já significa acesso total ao curso.
 */
export async function buscarColaboracao(cursoId: string, userId: string): Promise<Colaboracao> {
  const colaboracao = await prisma.cursoColaborador.findUnique({
    where: { cursoId_userId: { cursoId, userId } },
    select: { id: true },
  })

  return colaboracao ? { concedida: true } : null
}

export async function buscarCursoComColaboracao(cursoId: string, userId: string) {
  const [curso, colaboracao] = await Promise.all([
    prisma.curso.findUnique({
      where: { id: cursoId },
      include: { owner: { select: { id: true, nome: true, email: true } } },
    }),
    buscarColaboracao(cursoId, userId),
  ])

  return { curso, colaboracao }
}
