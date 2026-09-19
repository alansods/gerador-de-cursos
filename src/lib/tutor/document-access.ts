import { prisma } from '@/lib/prisma'
import { deletePrivateDocument } from '@/lib/tutor/document-storage'

export async function findCourseDocument(courseId: string, sourceId: string) {
  const source = await prisma.knowledgeSource.findUnique({
    where: { id: sourceId },
    select: { courseId: true, kind: true, name: true, filePathname: true, contentType: true },
  })

  if (!source || source.courseId !== courseId || !source.filePathname) {
    return null
  }

  return { ...source, filePathname: source.filePathname }
}

export async function courseDocumentPathnames(courseIds: string[]): Promise<string[]> {
  const sources = await prisma.knowledgeSource.findMany({
    where: { courseId: { in: courseIds }, filePathname: { not: null } },
    select: { filePathname: true },
  })

  return sources.flatMap((source) => (source.filePathname ? [source.filePathname] : []))
}

export async function deleteStoredDocuments(pathnames: string[]): Promise<void> {
  if (pathnames.length === 0) return

  await deletePrivateDocument(pathnames).catch((error) =>
    console.error('Failed to delete the tutor documents of deleted courses:', error)
  )
}
