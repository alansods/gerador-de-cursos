import { NextRequest, NextResponse, after } from 'next/server'
import { Course } from '@/types/course'
import { requireAuth, createErrorResponse } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateSCORMFromPlayerDist } from '@/lib/scorm-service'
import { downloadAndUpdateImages, cleanupTempFiles } from '@/lib/scorm-build-service'

// In-memory generation takes seconds, but image downloads need headroom
export const maxDuration = 60

/**
 * POST /api/generate-scorm-v2
 * Cria job no DB e inicia geração do pacote SCORM em background
 *
 * Retorna jobId para acompanhar progresso em página dedicada
 */
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const body = await req.json()
    const { course } = body

    if (!course || !course.id) {
      return createErrorResponse('Curso é obrigatório', 400)
    }

    const courseData = course as Course
    const courseId = courseData.id

    console.log(`📦 [API generate-scorm-v2] Starting generation for: ${courseData.title}`)
    console.log(`   📍 Course id: ${courseId}`)
    console.log(`   📍 Units: ${courseData.units?.length || 0}`)

    // Create the job row
    const job = await prisma.sCORMJob.create({
      data: {
        courseId,
        courseTitle: courseData.title,
        status: 'pending',
        progress: 'Job criado, aguardando início da geração...',
      },
    })

    console.log(`   ✅ Job created: ${job.id}`)

    // Run the generation after the response is sent (after() keeps it alive on Vercel)
    after(async () => {
      try {
        await executeBuildInBackground(job.id, courseData)
      } catch (error) {
        console.error(`❌ [Background Build] Job ${job.id} failed:`, error)
        await prisma.sCORMJob
          .update({
            where: { id: job.id },
            data: {
              status: 'failed',
              error: truncateError(error instanceof Error ? error.message : 'Erro desconhecido'),
              completedAt: new Date(),
            },
          })
          .catch(console.error)
      }
    })

    // Return the job id right away
    return NextResponse.json(
      {
        jobId: job.id,
        status: 'pending',
        message: 'Geração iniciada. Você será redirecionado para a página de progresso.',
      },
      { status: 202 }
    )
  } catch (error) {
    console.error('❌ [API generate-scorm-v2] Failed:', error)

    return createErrorResponse(
      `Erro ao iniciar geração SCORM: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      500,
      error
    )
  }
}

/**
 * Trunca mensagem de erro para evitar overflow no banco
 */
function truncateError(message: string, maxLength = 2000): string {
  if (message.length <= maxLength) return message
  return '...' + message.slice(-maxLength)
}

/**
 * Executa a geração do pacote SCORM em background (geração in-memory, sem next build)
 */
async function executeBuildInBackground(jobId: string, course: Course): Promise<void> {
  await prisma.sCORMJob.update({
    where: { id: jobId },
    data: { status: 'building', progress: 'Preparando geração do pacote SCORM...' },
  })

  try {
    console.log(`🔨 [Background Build] Job ${jobId}: starting the in-memory generation...`)

    // 1. Download the external images and rewrite the course references
    await prisma.sCORMJob.update({
      where: { id: jobId },
      data: { progress: '🖼️ Baixando imagens do curso...' },
    })

    let finalCourse = course
    try {
      const { course: courseWithImages } = await downloadAndUpdateImages(course, course.id)
      finalCourse = courseWithImages
      console.log(`   ✅ [Background Build] Job ${jobId}: images processed`)
    } catch (imgError) {
      // A failed image download never aborts the build — generate without them
      console.warn(
        `   ⚠️ [Background Build] Job ${jobId}: Erro ao baixar imagens, continuando sem elas:`,
        imgError
      )
    }

    // 2. Build the SCORM package in memory
    await prisma.sCORMJob.update({
      where: { id: jobId },
      data: { progress: '📦 Gerando pacote SCORM...' },
    })

    const zipBuffer = await generateSCORMFromPlayerDist(finalCourse, course.id)

    console.log(
      `✅ [Background Build] Job ${jobId}: Pacote gerado (${(zipBuffer.length / 1024).toFixed(2)} KB)`
    )

    // 3. Clean up the temporary image files
    await cleanupTempFiles(course.id).catch(() => {})

    // 4. Store the ZIP
    const zipArray = new Uint8Array(zipBuffer)

    await prisma.sCORMJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        progress: 'Pacote SCORM gerado com sucesso!',
        zipData: zipArray,
        completedAt: new Date(),
      },
    })

    console.log(`✅ [Background Build] Job ${jobId}: stored and ready for download`)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error(`❌ [Background Build] Job ${jobId}: fatal error:`, errorMessage)

    await cleanupTempFiles(course.id).catch(() => {})

    await prisma.sCORMJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        error: truncateError(errorMessage),
        completedAt: new Date(),
      },
    })

    throw error
  }
}
