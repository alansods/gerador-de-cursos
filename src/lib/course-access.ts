import { prisma } from '@/lib/prisma'
import type { Collaboration } from '@/lib/permissions'

/**
 * Colaboração do usuário no curso, ou null se não houver.
 * É o terceiro argumento de `podeEditarCurso`: sem ele, um CONTEUDISTA com
 * acesso concedido seria tratado como se não tivesse. Não há graus de acesso:
 * existir como colaborador já significa acesso total ao curso.
 */
export async function fetchCollaboration(courseId: string, userId: string): Promise<Collaboration> {
  const collaboration = await prisma.cursoColaborador.findUnique({
    where: { cursoId_userId: { cursoId: courseId, userId } },
    select: { id: true },
  })

  return collaboration ? { granted: true } : null
}

export async function fetchCourseWithCollaboration(courseId: string, userId: string) {
  const [course, collaboration] = await Promise.all([
    prisma.curso.findUnique({
      where: { id: courseId },
      include: { owner: { select: { id: true, nome: true, email: true } } },
    }),
    fetchCollaboration(courseId, userId),
  ])

  return { course, collaboration }
}
