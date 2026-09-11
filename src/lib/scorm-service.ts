// Caminho do Ficheiro: src/lib/scorm-service.ts

import JSZip from 'jszip'
import fs from 'fs/promises'
import path from 'path'
// Importe os seus tipos TypeScript. Ajuste o caminho se estiver incorreto.
import { Course } from '@/types/course'

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
// 1. GERADOR DO MANIFESTO (imsmanifest.xml)
// =======================================================================
export function generateManifest(course: Course, files: string[]): string {
  const sanitizedTitle = course.titulo.replace(/[^a-zA-Z0-9_-]/g, '_')
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
      <title>${escapeHtml(course.titulo)}</title>
      <item identifier="ITEM-${sanitizedTitle}" identifierref="RES-${sanitizedTitle}">
        <title>${escapeHtml(course.titulo)}</title>
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
// 2. FUNÇÃO PRINCIPAL DE GERAÇÃO DO ZIP
// =======================================================================

/**
 * Gera o pacote SCORM a partir do build do Vite player (player/dist/).
 * Injeta o JSON do curso no index.html pré-buildado via string replace.
 * Compatível com Vercel: nenhum spawn, nenhum next build — apenas I/O de arquivos.
 */
export async function generateSCORMFromPlayerDist(
  course: Course,
  courseId?: string
): Promise<Buffer> {
  console.log(`📦 [SCORM Service] Iniciando geração via Vite player para: ${course.titulo}`)

  const distDir = path.join(process.cwd(), 'player', 'dist')

  // Verificar se o player foi buildado
  try {
    await fs.access(path.join(distDir, 'index.html'))
  } catch {
    throw new Error(
      'player/dist/index.html não encontrado. Execute "pnpm build:player" antes de exportar.'
    )
  }

  const zip = new JSZip()
  const zipFiles: string[] = []

  // 1. Copiar todos os arquivos de player/dist/ para o ZIP recursivamente
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

  // 2. Injetar course data no index.html (sobrescreve o arquivo copiado)
  let indexHtml = await fs.readFile(path.join(distDir, 'index.html'), 'utf-8')
  const courseJson = JSON.stringify(course)
  indexHtml = indexHtml.replace('null /* COURSE_DATA_PLACEHOLDER */', courseJson)
  // Remover atributo crossorigin que o Vite adiciona — muitos LMSes bloqueiam
  // carregamento de assets com esse atributo por política de CORS
  indexHtml = indexHtml.replace(/ crossorigin/g, '')
  // Garantir que o charset UTF-8 está declarado (evita mojibake no LMS)
  if (!indexHtml.includes('charset')) {
    indexHtml = indexHtml.replace('<head>', '<head>\n  <meta charset="UTF-8" />')
  }
  zip.file('index.html', Buffer.from(indexHtml, 'utf-8'))

  // 3. Embutir imagens baixadas localmente
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
      console.log(`   🖼️ [SCORM Service] ${imageFiles.length} imagem(ns) embutida(s) no ZIP`)
    } catch {
      console.log(`   ℹ️ [SCORM Service] Nenhuma imagem local encontrada para embutir`)
    }
  }

  // 4. Gerar imsmanifest.xml
  zip.file('imsmanifest.xml', generateManifest(course, zipFiles))

  console.log(`✅ [SCORM Service] Pacote (Vite player) gerado com sucesso para: ${course.titulo}`)

  return zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  })
}
