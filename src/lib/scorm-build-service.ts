import { exec } from 'child_process'
import * as fs from 'fs/promises'
import * as path from 'path'
import JSZip from 'jszip'
import type { Course } from '@/types/course'
import { extractBlockMedia, rewriteBlockMedia } from './blocks'

/**
 * Converte caminhos absolutos (/_next/..., /favicon.ico) para caminhos relativos
 * Isso é necessário para que os assets funcionem em LMS que colocam o conteúdo em subpastas
 *
 * @param html - Conteúdo HTML a ser processado
 * @param prefix - Prefixo relativo (../ para um nível acima, ../../ para dois níveis)
 * @returns HTML com caminhos relativos
 */
function convertAbsolutePathsToRelative(html: string, prefix: string): string {
  // Rewrite /_next/ to ../_next/ or ../../_next/
  html = html.replace(/href="\/_next\//g, `href="${prefix}_next/`)
  html = html.replace(/src="\/_next\//g, `src="${prefix}_next/`)

  // Rewrite /favicon.ico to ../favicon.ico or ../../favicon.ico
  html = html.replace(/href="\/favicon\.ico/g, `href="${prefix}favicon.ico`)

  // Rewrite the remaining root-relative assets
  // while preserving external URLs (http://, https://, //)
  html = html.replace(/(href|src)="\/(?!\/|http)/g, `$1="${prefix}`)

  return html
}

/**
 * Detecta todas as URLs de imagens no curso (recursivamente)
 */
export function detectMediaUrls(course: Course): string[] {
  console.log('🔍 [SCORM Build] Detecting the course media...')
  const urls = new Set<string>()

  course.units?.forEach((unit) => {
    unit.blocks?.forEach((block) => {
      // Driven by BLOCK_CATALOG: a new block with media declares extractMedia
      // and gets bundled into the ZIP without touching this file.
      extractBlockMedia(block).forEach((url) => {
        if (url.startsWith('http://') || url.startsWith('https://')) urls.add(url)
      })
    })
  })

  const list = Array.from(urls)
  console.log(`✅ [SCORM Build] ${list.length} media file(s) detected`)
  return list
}

/**
 * Baixa uma imagem de uma URL e salva localmente
 */
async function downloadImage(url: string, outputPath: string): Promise<void> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Falha ao baixar imagem: ${response.statusText}`)
    }

    const buffer = Buffer.from(await response.arrayBuffer())

    // Create the directory when missing
    const dir = path.dirname(outputPath)
    await fs.mkdir(dir, { recursive: true })

    // Write the file
    await fs.writeFile(outputPath, buffer)
  } catch (error) {
    console.error(`Failed to download the image ${url}:`, error)
    throw error
  }
}

/**
 * Baixa todas as imagens do curso e atualiza referências
 */
export async function downloadAndUpdateImages(
  course: Course,
  courseId: string
): Promise<{ course: Course; imageMap: Map<string, string> }> {
  console.log('🖼️ [SCORM Build] Downloading the images...')
  const mediaUrls = detectMediaUrls(course)
  const imageMap = new Map<string, string>()
  const publicDir = path.join(process.cwd(), 'public', 'scorm-images', courseId)

  console.log(`📁 [SCORM Build] Creating the image directory: ${publicDir}`)
  // Create the directory when missing
  await fs.mkdir(publicDir, { recursive: true })

  // Download each image
  for (let i = 0; i < mediaUrls.length; i++) {
    const url = mediaUrls[i]
    console.log(`⬇️ [SCORM Build] Downloading image ${i + 1}/${mediaUrls.length}: ${url}`)

    try {
      const urlHash = Buffer.from(url).toString('base64').replace(/[/+=]/g, '').substring(0, 16)
      const extension = path.extname(new URL(url).pathname) || '.jpg'
      const filename = `midia-${i + 1}-${urlHash}${extension}`
      const outputPath = path.join(publicDir, filename)
      // Relative and without the course id: that is where generateSCORMFromPlayerDist writes in the ZIP.
      const publicPath = `images/${filename}`

      await downloadImage(url, outputPath)
      imageMap.set(url, publicPath)
      console.log(`✅ [SCORM Build] Image downloaded: ${url} -> ${publicPath}`)
    } catch (error) {
      console.error(`❌ [SCORM Build] Failed to download the image ${url}:`, error)
      // Carry on even when one image fails
    }
  }

  console.log(
    `✅ [SCORM Build] Download de imagens concluído. ${imageMap.size}/${mediaUrls.length} imagens baixadas com sucesso.`
  )

  // Rewrite the references inside the course
  console.log('🔄 [SCORM Build] Rewriting the image references in the course...')
  const updatedCourse = JSON.parse(JSON.stringify(course)) as Course

  // Driven by BLOCK_CATALOG: a new block with media declares rewriteMedia and gets
  // rewritten without touching this file.
  let updatedCount = 0
  updatedCourse.units?.forEach((unit) => {
    unit.blocks = unit.blocks?.map((block) => {
      const rewritten = rewriteBlockMedia(block, imageMap)
      if (rewritten !== block) updatedCount++
      return rewritten
    })
  })

  console.log(`✅ [SCORM Build] ${updatedCount} image reference(s) rewritten in the course`)
  return { course: updatedCourse, imageMap }
}

/**
 * Salva o curso em um arquivo temporário para ser usado durante o build
 */
async function saveCourseForBuild(course: Course, courseId: string): Promise<string> {
  const tempDir = path.join(process.cwd(), '.scorm-build')
  const tempFile = path.join(tempDir, `curso-${courseId}.json`)

  console.log(`💾 [SCORM Build] Writing the course to a temporary file: ${tempFile}`)
  // Create the directory when missing
  await fs.mkdir(tempDir, { recursive: true })

  // Write the course
  const courseJson = JSON.stringify(course, null, 2)
  await fs.writeFile(tempFile, courseJson, 'utf-8')
  console.log(`✅ [SCORM Build] Course written (${courseJson.length} bytes)`)

  return tempFile
}

/**
 * Remove o arquivo temporário do curso após o build
 */
async function removeCourseBuildFile(courseId: string): Promise<void> {
  try {
    const tempDir = path.join(process.cwd(), '.scorm-build')
    const tempFile = path.join(tempDir, `curso-${courseId}.json`)
    await fs.unlink(tempFile).catch(() => {})
  } catch (error) {
    // Ignore failures while removing the temporary file
  }
}

/**
 * Move temporariamente todas as pastas de API para FORA do diretório app durante o build estático
 * Isso garante que o Next.js não tente processar as rotas de API durante o build estático
 * Detecta automaticamente pastas como "api", "api 2", "api 3", etc.
 */
async function hideApiRoutes(): Promise<string[]> {
  const appDir = path.join(process.cwd(), 'src', 'app')
  const hiddenDirs: string[] = []

  try {
    // Read every directory under src/app
    const entries = await fs.readdir(appDir, { withFileTypes: true })

    // Keep only the directories starting with "api"
    const apiDirs = entries
      .filter((entry) => entry.isDirectory() && entry.name.startsWith('api'))
      .map((entry) => entry.name)

    if (apiDirs.length === 0) {
      console.log('ℹ️ [SCORM Build] No API folder found')
      return hiddenDirs
    }

    console.log(
      `📦 [SCORM Build] Encontradas ${apiDirs.length} pasta(s) de API: ${apiDirs.join(', ')}`
    )

    // Move every API folder out of src/app
    for (const apiDirName of apiDirs) {
      const apiDir = path.join(appDir, apiDirName)
      // Move it OUTSIDE src/app so Next.js cannot find it
      // Use a unique name derived from the original folder
      const hiddenApiDir = path.join(process.cwd(), `.${apiDirName}-hidden-temp`)

      console.log(`📦 [SCORM Build] Hiding the /${apiDirName} folder during the static build...`)
      console.log(`   📁 From: ${apiDir}`)
      console.log(`   📁 To: ${hiddenApiDir}`)

      // Drop a hidden folder left over from an earlier build
      if (await verifyPathExists(hiddenApiDir)) {
        console.log('   🧹 Removing the previous hidden folder...')
        await fs.rm(hiddenApiDir, { recursive: true, force: true })
      }

      await fs.rename(apiDir, hiddenApiDir)
      console.log(`✅ [SCORM Build] Folder /${apiDirName} hidden`)
      hiddenDirs.push(hiddenApiDir)
    }

    console.log(`✅ [SCORM Build] ${hiddenDirs.length} API folder(s) hidden`)
  } catch (error) {
    console.error('❌ [SCORM Build] Failed to hide the API folders:', error)
  }

  return hiddenDirs
}

/**
 * Restaura todas as pastas de API após o build estático
 */
async function restoreApiRoutes(hiddenApiDirs: string[]): Promise<void> {
  if (!hiddenApiDirs || hiddenApiDirs.length === 0) {
    console.log('ℹ️ [SCORM Build] No API folder to restore')
    return
  }

  const appDir = path.join(process.cwd(), 'src', 'app')

  for (const hiddenApiDir of hiddenApiDirs) {
    try {
      const exists = await verifyPathExists(hiddenApiDir)
      if (exists) {
        // Recover the original folder name from the hidden path
        // For example: .api-hidden-temp -> api, .api 2-hidden-temp -> api 2
        const dirBaseName = path.basename(hiddenApiDir)
        const apiDirName = dirBaseName.replace(/^\./, '').replace(/-hidden-temp$/, '')
        const apiDir = path.join(appDir, apiDirName)

        console.log(`📦 [SCORM Build] Restoring the /${apiDirName} folder after the build...`)

        // Drop the api folder when it already exists (error path)
        if (await verifyPathExists(apiDir)) {
          await fs.rm(apiDir, { recursive: true, force: true })
        }

        await fs.rename(hiddenApiDir, apiDir)
        console.log(`✅ [SCORM Build] Folder /${apiDirName} restored`)
      }
    } catch (error) {
      console.error(`❌ [SCORM Build] Failed to restore the folder ${hiddenApiDir}:`, error)
    }
  }

  console.log(`✅ [SCORM Build] ${hiddenApiDirs.length} API folder(s) restored`)
}

/**
 * Move temporariamente as pastas problemáticas para FORA do diretório app durante o build estático
 * Isso garante que o Next.js não tente processar páginas que não devem ser exportadas
 */
async function hideProblematicPages(): Promise<string[]> {
  const hiddenDirs: string[] = []
  const problematicPaths = [
    // Dynamic pages that must not be exported statically
    path.join(process.cwd(), 'src', 'app', 'cursos', '[id]'),
    // PDF preview page (not part of the SCORM package)
    path.join(process.cwd(), 'src', 'app', 'pdf-preview'),
  ]

  for (const problematicPath of problematicPaths) {
    try {
      const exists = await verifyPathExists(problematicPath)
      if (exists) {
        const hiddenPath = path.join(
          process.cwd(),
          `.hidden-${path.basename(problematicPath)}-temp`
        )
        console.log(
          `📦 [SCORM Build] Ocultando pasta problemática: ${path.basename(problematicPath)}`
        )
        console.log(`   📁 From: ${problematicPath}`)
        console.log(`   📁 To: ${hiddenPath}`)

        // Drop a hidden folder left over from an earlier build
        if (await verifyPathExists(hiddenPath)) {
          console.log('   🧹 Removing the previous hidden folder...')
          await fs.rm(hiddenPath, { recursive: true, force: true })
        }

        await fs.rename(problematicPath, hiddenPath)
        console.log(`✅ [SCORM Build] Folder ${path.basename(problematicPath)} hidden`)
        hiddenDirs.push(hiddenPath)
      }
    } catch (error) {
      console.error(`❌ [SCORM Build] Failed to hide the folder ${problematicPath}:`, error)
    }
  }

  return hiddenDirs
}

/**
 * Restaura as pastas problemáticas após o build estático
 */
async function restoreProblematicPages(hiddenDirs: string[]): Promise<void> {
  for (const hiddenDir of hiddenDirs) {
    try {
      const exists = await verifyPathExists(hiddenDir)
      if (exists) {
        // Recover the original folder name from the hidden name
        // .hidden-[id]-temp -> [id]
        // .hidden-pdf-preview-temp -> pdf-preview
        const dirName = path.basename(hiddenDir).replace('.hidden-', '').replace('-temp', '')

        // Work out the original path from the folder name
        let originalPath: string
        if (dirName === '[id]') {
          originalPath = path.join(process.cwd(), 'src', 'app', 'cursos', dirName)
        } else if (dirName === 'pdf-preview') {
          originalPath = path.join(process.cwd(), 'src', 'app', dirName)
        } else {
          // Fallback: try src/app
          originalPath = path.join(process.cwd(), 'src', 'app', dirName)
        }

        console.log(`📦 [SCORM Build] Restoring the folder: ${dirName}`)
        // Drop the original folder when it already exists (error path)
        if (await verifyPathExists(originalPath)) {
          await fs.rm(originalPath, { recursive: true, force: true })
        }
        await fs.rename(hiddenDir, originalPath)
        console.log(`✅ [SCORM Build] Folder ${dirName} restored`)
      }
    } catch (error) {
      console.error(`❌ [SCORM Build] Failed to restore the folder ${hiddenDir}:`, error)
    }
  }
}

/**
 * Executa o build do Next.js programaticamente
 */
export async function executeNextBuild(course: Course, courseId: string): Promise<void> {
  const buildTimeout = 10 * 60 * 1000 // 10 minutes

  console.log('📝 [SCORM Build] Writing the course to a temporary file...')
  // Write the course to a temporary file
  const tempFile = await saveCourseForBuild(course, courseId)
  console.log(`✅ [SCORM Build] Course written to: ${tempFile}`)

  // Hide every API folder during the static build
  const hiddenApiDirs = await hideApiRoutes()

  // Hide the problematic folders during the static build
  const hiddenPagesDirs = await hideProblematicPages()

  return new Promise((resolve, reject) => {
    console.log('🔨 [SCORM Build] Starting the Next.js build...')
    console.log(`📁 [SCORM Build] Working directory: ${process.cwd()}`)

    // Environment variables for the static build
    const { TURBOPACK, ...envWithoutTurbopack } = process.env
    const env: NodeJS.ProcessEnv = {
      ...envWithoutTurbopack,
      NODE_ENV: 'production' as const,
      NEXT_OUTPUT_EXPORT: 'true', // custom flag that turns the export on
      SCORM_BUILD_COURSE_FILE: tempFile, // temporary file holding the course
    }

    console.log('🔧 [SCORM Build] Environment variables set:')
    console.log(`   - NODE_ENV: ${env.NODE_ENV}`)
    console.log(`   - NEXT_OUTPUT_EXPORT: ${env.NEXT_OUTPUT_EXPORT}`)
    console.log(`   - SCORM_BUILD_COURSE_FILE: ${env.SCORM_BUILD_COURSE_FILE}`)

    // Run the static Next.js build
    const buildProcess = exec(
      'next build',
      {
        env,
        cwd: process.cwd(),
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      },
      async (error, stdout, stderr) => {
        console.log('📋 [SCORM Build] Build finished, processing the result...')

        // Restore the folders after the build
        await restoreApiRoutes(hiddenApiDirs)
        await restoreProblematicPages(hiddenPagesDirs)

        // Remove the temporary file after the build
        console.log('🧹 [SCORM Build] Removing the temporary course file...')
        await removeCourseBuildFile(courseId)

        if (error) {
          console.error('❌ [SCORM Build] Build failed:', error)
          console.error('📋 [SCORM Build] stderr:', stderr)
          console.error('📋 [SCORM Build] stdout:', stdout)
          // Restore the folders even on failure
          await restoreApiRoutes(hiddenApiDirs)
          await restoreProblematicPages(hiddenPagesDirs)
          reject(new Error(`Build falhou: ${error.message}`))
          return
        }

        console.log('✅ [SCORM Build] Build finished')
        console.log('📋 [SCORM Build] Build output:')
        console.log(stdout)
        if (stderr) {
          console.log('⚠️ [SCORM Build] Warnings:')
          console.log(stderr)
        }
        resolve()
      }
    )

    // Build logs
    buildProcess.stdout?.on('data', (data) => {
      console.log(`📦 [SCORM Build] ${data.toString().trim()}`)
    })

    buildProcess.stderr?.on('data', (data) => {
      console.log(`⚠️ [SCORM Build] ${data.toString().trim()}`)
    })

    // Timeout
    const timeout = setTimeout(() => {
      console.error('⏱️ [SCORM Build] Timed out after 10 minutes, killing the process...')
      buildProcess.kill()
      removeCourseBuildFile(courseId)
      // Restore the folders even on timeout
      restoreApiRoutes(hiddenApiDirs)
      restoreProblematicPages(hiddenPagesDirs)
      reject(new Error('Build timeout após 10 minutos'))
    }, buildTimeout)

    buildProcess.on('exit', (code, signal) => {
      clearTimeout(timeout)
      console.log(`🔄 [SCORM Build] Process exited with code: ${code}, signal: ${signal}`)
    })
  })
}

/**
 * Verifica se o diretório out/ foi criado
 */
export async function verifyBuildOutput(): Promise<boolean> {
  const outDir = path.join(process.cwd(), 'out')
  console.log(`🔍 [SCORM Build] Checking whether out/ exists: ${outDir}`)
  try {
    const stats = await fs.stat(outDir)
    const exists = stats.isDirectory()
    console.log(`✅ [SCORM Build] out/ ${exists ? 'exists' : 'does not exist'}`)
    return exists
  } catch (error) {
    console.log(`❌ [SCORM Build] out/ not found:`, error)
    return false
  }
}

/**
 * Copia arquivos do out/ para o ZIP SCORM
 */
export async function copyBuildFilesToZip(zip: JSZip, courseId: string): Promise<void> {
  console.log('📦 [SCORM Build] Copying the files into the ZIP...')
  const outDir = path.join(process.cwd(), 'out')
  const scormPreviewDir = path.join(outDir, 'scorm-preview')
  const publicImagesDir = path.join(process.cwd(), 'public', 'scorm-images', courseId)

  let filesAdded = 0

  // Recursive helper that adds files to the ZIP
  async function addDirectoryToZip(dirPath: string, zipPath: string): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      console.log(
        `   📁 [SCORM Build] Processando diretório: ${dirPath} (${entries.length} entradas)`
      )

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)
        const zipEntryPath = path.join(zipPath, entry.name).replace(/\\/g, '/')

        if (entry.isDirectory()) {
          await addDirectoryToZip(fullPath, zipEntryPath)
        } else {
          const content = await fs.readFile(fullPath)
          zip.file(zipEntryPath, content)
          filesAdded++
          if (filesAdded % 10 === 0) {
            console.log(`   📄 [SCORM Build] ${filesAdded} files added to the ZIP...`)
          }
        }
      }
    } catch (error) {
      console.error(`❌ [SCORM Build] Failed to copy the directory ${dirPath}:`, error)
    }
  }

  // Copy the main scorm-preview page
  // With output: 'export', Next.js emits pages as [name].html at the root
  console.log(`📂 [SCORM Build] Copying the main page scorm-preview.html...`)
  const scormPreviewHtmlFile = path.join(outDir, 'scorm-preview.html')
  if (await verifyPathExists(scormPreviewHtmlFile)) {
    let content = await fs.readFile(scormPreviewHtmlFile, 'utf-8')
    // Rewrite the absolute paths as relative ones
    content = convertAbsolutePathsToRelative(content, '../')
    zip.file('scorm-preview/index.html', content)
    filesAdded++
    console.log(
      `✅ [SCORM Build] scorm-preview.html copiado como scorm-preview/index.html (caminhos convertidos)`
    )
  } else {
    console.log(
      `⚠️ [SCORM Build] Arquivo scorm-preview.html não encontrado: ${scormPreviewHtmlFile}`
    )
  }

  // Copy the extra files from the scorm-preview directory, when present
  console.log(`📂 [SCORM Build] Copying the files from scorm-preview/...`)
  if (await verifyPathExists(scormPreviewDir)) {
    // Copy the unit HTML files, rewriting their paths
    const unitDir = path.join(scormPreviewDir, 'unidade')
    if (await verifyPathExists(unitDir)) {
      const unitFiles = await fs.readdir(unitDir)
      for (const file of unitFiles) {
        if (file.endsWith('.html')) {
          const filePath = path.join(unitDir, file)
          let content = await fs.readFile(filePath, 'utf-8')
          // Rewrite the absolute paths as relative ones (dois níveis acima: ../../)
          content = convertAbsolutePathsToRelative(content, '../../')
          zip.file(`scorm-preview/unidade/${file}`, content)
          filesAdded++
        }
      }
      console.log(`✅ [SCORM Build] Unit HTML files copied with rewritten paths`)
    }

    // Copy the remaining files (txt and friends) untouched
    const entries = await fs.readdir(scormPreviewDir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory() && !entry.name.endsWith('.html')) {
        const fullPath = path.join(scormPreviewDir, entry.name)
        const content = await fs.readFile(fullPath)
        zip.file(`scorm-preview/${entry.name}`, content)
        filesAdded++
      }
    }

    console.log(`✅ [SCORM Build] Files from scorm-preview copied`)
  } else {
    console.log(`ℹ️ [SCORM Build] scorm-preview/ does not exist (expected in a static build)`)
  }

  // Copy the static assets (_next/static)
  console.log(`📂 [SCORM Build] Copying the static assets (_next/static)...`)
  const nextStaticDir = path.join(outDir, '_next', 'static')
  if (await verifyPathExists(nextStaticDir)) {
    await addDirectoryToZip(nextStaticDir, '_next/static')
    console.log(`✅ [SCORM Build] Static assets copied`)
  } else {
    console.log(`⚠️ [SCORM Build] _next/static not found: ${nextStaticDir}`)
  }

  // Copy the downloaded images
  console.log(`📂 [SCORM Build] Copying the downloaded images...`)
  if (await verifyPathExists(publicImagesDir)) {
    await addDirectoryToZip(publicImagesDir, 'scorm-images')
    console.log(`✅ [SCORM Build] Images copied`)
  } else {
    console.log(`⚠️ [SCORM Build] Image directory not found: ${publicImagesDir}`)
  }

  // Copy the scorm-preview index.html (the preview home page)
  // With output: 'export', Next.js emits an index.html per route
  console.log(`📄 [SCORM Build] Copying index.html...`)
  const scormIndexPath = path.join(outDir, 'scorm-preview', 'index.html')
  if (await verifyPathExists(scormIndexPath)) {
    const content = await fs.readFile(scormIndexPath)
    zip.file('index.html', content)
    console.log(`✅ [SCORM Build] index.html copied from scorm-preview/index.html`)
  } else {
    // When it is missing, write a minimal redirecting index.html
    console.log(`⚠️ [SCORM Build] index.html not found, writing a redirect...`)
    const redirectHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=scorm-preview/index.html">
  <title>SCORM Course</title>
</head>
<body>
  <p>Redirecionando... <a href="scorm-preview/index.html">Clique aqui se não for redirecionado automaticamente</a></p>
</body>
</html>`
    zip.file('index.html', redirectHtml)
    console.log(`✅ [SCORM Build] Redirecting index.html written`)
  }

  console.log(
    `✅ [SCORM Build] Cópia de arquivos concluída. Total: ${filesAdded} arquivos adicionados ao ZIP`
  )
}

/**
 * Verifica se um caminho existe
 */
async function verifyPathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Limpa arquivos temporários (imagens baixadas, diretório out/)
 */
export async function cleanupTempFiles(courseId: string): Promise<void> {
  console.log('🧹 [SCORM Build] Cleaning up the temporary files...')
  try {
    // Remove the downloaded images
    const publicImagesDir = path.join(process.cwd(), 'public', 'scorm-images', courseId)
    if (await verifyPathExists(publicImagesDir)) {
      console.log(`   🗑️ [SCORM Build] Removing the images from: ${publicImagesDir}`)
      await fs.rm(publicImagesDir, { recursive: true, force: true })
      console.log(`✅ [SCORM Build] Images removed`)
    } else {
      console.log(`ℹ️ [SCORM Build] No image directory, nothing to clean`)
    }

    // Remove the temporary course file
    const tempDir = path.join(process.cwd(), '.scorm-build')
    const tempFile = path.join(tempDir, `curso-${courseId}.json`)
    if (await verifyPathExists(tempFile)) {
      console.log(`   🗑️ [SCORM Build] Removing the temporary course file: ${tempFile}`)
      await fs.unlink(tempFile).catch(() => {})
      console.log(`✅ [SCORM Build] Temporary file removed`)
    }

    // Cleaning out/ is optional — keeping it helps debugging
    // const outDir = path.join(process.cwd(), 'out');
    // if (await verifyPathExists(outDir)) {
    //   await fs.rm(outDir, { recursive: true, force: true });
    //   console.log(`🧹 Limpeza: diretório out/ removido`);
    // }

    console.log(`✅ [SCORM Build] Cleanup finished`)
  } catch (error) {
    console.error('❌ [SCORM Build] Failed to clean the temporary files:', error)
    // A failed cleanup never fails the build
  }
}
