// src/lib/scorm-service.ts

import JSZip from 'jszip'
import fs from 'fs/promises'
import path from 'path'
// Course types shared with the app.
import { Course } from '@/types/course'
import { CREDITS_FILE_NAME } from '@/lib/illustration-library'

/**
 * Escapa caracteres especiais HTML/XML para uso seguro em texto
 */
function escapeHtml(str: string | undefined | null): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// =======================================================================
// 1. MANIFEST GENERATOR (imsmanifest.xml)
// =======================================================================
export function generateManifest(course: Course, files: string[]): string {
  const sanitizedTitle = course.title.replace(/[^a-zA-Z0-9_-]/g, '_')
  const fileList = files.map((f) => `      <file href="${escapeHtml(f)}"/>`).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2" 
          xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2" 
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
          identifier="MANIFEST-${sanitizedTitle}-${course.id}" 
          version="1.0"
          xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
                              http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="ORG-${sanitizedTitle}">
    <organization identifier="ORG-${sanitizedTitle}">
      <title>${escapeHtml(course.title)}</title>
      <item identifier="ITEM-${sanitizedTitle}" identifierref="RES-${sanitizedTitle}">
        <title>${escapeHtml(course.title)}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <!-- O recurso principal (SCO) é o index.html -->
    <resource identifier="RES-${sanitizedTitle}" type="webcontent" adlcp:scormtype="sco" href="index.html">
${fileList}
    </resource>
  </resources>
</manifest>`
}
// =======================================================================
// 2. MAIN ZIP GENERATION FUNCTION
// =======================================================================

/**
 * Gera o pacote SCORM a partir do build do Vite player (player/dist/).
 * Injeta o JSON do curso no index.html pré-buildado via string replace.
 * Compatível com Vercel: nenhum spawn, nenhum next build — apenas I/O de arquivos.
 */
export async function generateSCORMFromPlayerDist(
  course: Course,
  courseId?: string,
  credits?: string | null
): Promise<Buffer> {
  console.log(`📦 [SCORM Service] Generating from the Vite player for: ${course.title}`)

  const distDir = path.join(process.cwd(), 'player', 'dist')

  // Check that the player was built
  try {
    await fs.access(path.join(distDir, 'index.html'))
  } catch {
    throw new Error(
      'player/dist/index.html não encontrado. Execute "pnpm build:player" antes de exportar.'
    )
  }

  const zip = new JSZip()
  const zipFiles: string[] = []

  // 1. Copy every file from player/dist/ into the ZIP, recursively
  async function addDirectoryToZip(dir: string, zipPrefix: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      const zipPath = zipPrefix ? `${zipPrefix}/${entry.name}` : entry.name
      if (entry.isDirectory()) {
        await addDirectoryToZip(fullPath, zipPath)
      } else {
        const content = await fs.readFile(fullPath)
        zip.file(zipPath, content)
        zipFiles.push(zipPath)
      }
    }
  }

  await addDirectoryToZip(distDir, '')

  // 2. Inject the course data into index.html (overwrites the copied file)
  let indexHtml = await fs.readFile(path.join(distDir, 'index.html'), 'utf-8')
  const courseJson = JSON.stringify(course)
  indexHtml = indexHtml.replace('null /* COURSE_DATA_PLACEHOLDER */', courseJson)
  // Drop the crossorigin attribute Vite adds — many LMSes block assets
  // carrying it, by CORS policy
  indexHtml = indexHtml.replace(/ crossorigin/g, '')
  // Declare the UTF-8 charset (prevents mojibake inside the LMS)
  if (!indexHtml.includes('charset')) {
    indexHtml = indexHtml.replace('<head>', '<head>\n  <meta charset="UTF-8" />')
  }
  zip.file('index.html', Buffer.from(indexHtml, 'utf-8'))

  // 3. Bundle the locally downloaded images
  if (courseId) {
    const imagesDir = path.join(process.cwd(), 'public', 'scorm-images', courseId)
    try {
      const imageFiles = await fs.readdir(imagesDir)
      for (const file of imageFiles) {
        const filePath = path.join(imagesDir, file)
        const fileContent = await fs.readFile(filePath)
        zip.file(`images/${file}`, fileContent)
        zipFiles.push(`images/${file}`)
      }
      console.log(`   🖼️ [SCORM Service] ${imageFiles.length} image(s) bundled into the ZIP`)
    } catch {
      console.log(`   ℹ️ [SCORM Service] No local image to bundle`)
    }
  }

  if (credits) {
    zip.file(CREDITS_FILE_NAME, Buffer.from(credits, 'utf-8'))
    zipFiles.push(CREDITS_FILE_NAME)
  }

  // 4. Write imsmanifest.xml
  zip.file('imsmanifest.xml', generateManifest(course, zipFiles))

  console.log(`✅ [SCORM Service] Package (Vite player) generated for: ${course.title}`)

  return zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  })
}
