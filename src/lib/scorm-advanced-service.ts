import JSZip from 'jszip'
import { v4 as uuidv4 } from 'uuid'
import type { CursoGerado, Unidade } from '@/types/gerador-curso'
import puppeteer from 'puppeteer'

export async function generateAdvancedSCORMPackage(curso: CursoGerado): Promise<Buffer> {
  const zip = new JSZip()
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  
  // --- MANTER ISSO ---
  // 1. Gerar Manifesto (Perfeito)
  const manifest = createManifest(curso)
  zip.file('imsmanifest.xml', manifest)
  
  // 2. Gerar JS Essencial (Perfeito)
  zip.file('scorm-api.js', createScormAPIJS())
  zip.file('interacoes.js', createInteractionsJS())
  // --------------------
  
  // --- NOVA LÓGICA COM PUPPETEER ---
  console.log('[SCORM] Iniciando Puppeteer para captura...')
  const browser = await puppeteer.launch({ 
    headless: true, 
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'] 
  })
  const page = await browser.newPage()
  
  // Configurar viewport para melhor renderização
  await page.setViewport({ width: 1920, height: 1080 })
  
  // Interceptar e bloquear recursos desnecessários para acelerar
  await page.setRequestInterception(true)
  page.on('request', (req) => {
    const resourceType = req.resourceType()
    // Permitir apenas recursos essenciais (documento, stylesheet, script, imagem, font)
    if (['document', 'stylesheet', 'script', 'image', 'font'].includes(resourceType)) {
      req.continue()
    } else {
      req.abort()
    }
  })
  
  // 3. Capturar a Página Principal do Curso
  try {
    const homeUrl = `${baseUrl}/cursos/${curso.id}/preview`
    console.log(`[SCORM] Capturando página principal: ${homeUrl}`)
    await page.goto(homeUrl, { waitUntil: 'networkidle0', timeout: 60000 })
    
    // Aguardar que todos os componentes estejam renderizados
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Aguardar que o conteúdo esteja visível
    try {
      await page.waitForSelector('main', { timeout: 10000 })
    } catch {
      console.warn('[SCORM] Timeout aguardando main, continuando...')
    }
    
    // Capturar o HTML completo renderizado e depois extrair apenas o preview
    // Primeiro, capturar todos os estilos CSS compilados do Tailwind
    const initialStyles = await page.evaluate(async () => {
      const styles: string[] = []
      
      // Capturar estilos de todos os <style> tags (incluindo Tailwind compilado pelo Next.js)
      Array.from(document.querySelectorAll('style')).forEach(style => {
        if (style.textContent && style.textContent.trim()) {
          // Incluir todos os estilos, mesmo do Next.js (eles contêm o Tailwind compilado)
          styles.push(style.textContent)
        }
      })
      
      return styles.join('\n\n')
    })
    
    let allStyles: string = initialStyles
    
    // Tentar baixar e incluir CSS compilado do Next.js
    try {
      const cssLinks = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
          .map(link => link.getAttribute('href'))
          .filter(href => href && href.includes('_next/static') && href.includes('.css'))
      })
      
      // Baixar cada arquivo CSS e incluir no HTML
      for (const cssHref of cssLinks) {
        if (cssHref && cssHref.startsWith('/')) {
          try {
            const fullUrl = `${baseUrl}${cssHref}`
            const response = await page.goto(fullUrl, { waitUntil: 'networkidle0', timeout: 10000 })
            if (response) {
              const cssContent = await response.text()
              if (cssContent) {
                allStyles = allStyles + '\n\n/* CSS from ' + cssHref + ' */\n' + cssContent
                console.log(`[SCORM] CSS capturado: ${cssHref} (${cssContent.length} caracteres)`)
              }
            }
          } catch {
            console.warn(`[SCORM] Não foi possível baixar CSS ${cssHref}`)
          }
        }
      }
    } catch {
      console.warn('[SCORM] Erro ao capturar CSS externo')
    }
    
    console.log(`[SCORM] Estilos capturados: ${allStyles.length} caracteres`)
    
    // Capturar apenas o conteúdo do preview (navbar + main content)
    let htmlContent = await page.evaluate(() => {
      // Encontrar o elemento raiz do preview (a div min-h-screen)
      const previewRoot = document.querySelector('div.min-h-screen.bg-gray-50') || 
                         document.querySelector('body > div') ||
                         document.body
      
      if (!previewRoot) {
        return null
      }
      
      // Capturar a navbar do preview (apenas a navbar do preview, não outras)
      const navbar = previewRoot.querySelector('nav.fixed.top-0') || 
                    previewRoot.querySelector('nav')
      const navbarHTML = navbar ? navbar.outerHTML : ''
      
      // Capturar o conteúdo principal (apenas o main)
      const mainContent = previewRoot.querySelector('main') || 
                         previewRoot.querySelector('[class*="main"]')
      const mainHTML = mainContent ? mainContent.outerHTML : ''
      
      // Verificar se há conteúdo
      if (!navbarHTML && !mainHTML) {
        return null
      }
      
      // Construir HTML limpo apenas com o preview
      return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${document.title || 'Curso'}</title>
</head>
<body class="bg-gray-50">
  ${navbarHTML}
  ${mainHTML}
</body>
</html>`
    })
    
    // Se não conseguiu capturar, tentar fallback mais completo
    if (!htmlContent || !htmlContent.includes('<main') && !htmlContent.includes('<nav')) {
      console.warn('[SCORM] Fallback: capturando HTML completo para extrair conteúdo')
      htmlContent = await page.evaluate(() => {
        // Tentar encontrar o conteúdo mesmo no HTML completo
        const body = document.body
        const navbar = body.querySelector('nav.fixed.top-0') || body.querySelector('nav')
        const main = body.querySelector('main')
        
        if (navbar || main) {
          return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${document.title || 'Curso'}</title>
</head>
<body class="bg-gray-50">
  ${navbar ? navbar.outerHTML : ''}
  ${main ? main.outerHTML : ''}
</body>
</html>`
        }
        
        // Último recurso: HTML completo
        return document.documentElement.outerHTML
      })
    }
    
    // Verificar se o HTML tem conteúdo
    if (!htmlContent || htmlContent.length < 100) {
      console.warn('[SCORM] HTML capturado parece estar vazio ou muito pequeno')
      console.warn('[SCORM] Tamanho do HTML:', htmlContent?.length || 0)
    } else {
      console.log('[SCORM] HTML capturado:', htmlContent.length, 'caracteres')
      // Verificar se tem conteúdo visível
      if (htmlContent.includes('<main') || htmlContent.includes('<nav')) {
        console.log('[SCORM] HTML contém conteúdo (main ou nav)')
      } else {
        console.warn('[SCORM] HTML não contém <main> ou <nav>')
      }
    }
    
    // Limpa e adapta o HTML
    const adaptedHtml = adaptHTMLForSCORM(htmlContent, 'index.html', curso, -1, allStyles, baseUrl)
    
    // Verificar HTML adaptado
    if (adaptedHtml.includes('<main') || adaptedHtml.includes('<nav')) {
      console.log('[SCORM] HTML adaptado contém conteúdo')
    } else {
      console.warn('[SCORM] AVISO: HTML adaptado não contém <main> ou <nav>')
    }
    
    zip.file('index.html', adaptedHtml)
    console.log('[SCORM] Página principal capturada com sucesso')
    
  } catch (e) {
    console.error(`[SCORM] Erro ao capturar página principal:`, e)
    await browser.close()
    const errorMessage = e instanceof Error ? e.message : String(e)
    throw new Error(`Erro ao renderizar página principal do curso via Puppeteer: ${errorMessage}`)
  }
  
  // 4. Capturar CADA Unidade
  const unidades = curso.unidades || []
  for (let i = 0; i < unidades.length; i++) {
    const unidade = unidades[i]
    const unitFileName = `unidade-${i + 1}.html`
    const unitUrl = `${baseUrl}/cursos/${curso.id}/preview/unidade/${unidade.id}`
    
    try {
      console.log(`[SCORM] Capturando unidade ${i + 1}/${unidades.length}: ${unitUrl}`)
      await page.goto(unitUrl, { waitUntil: 'networkidle0', timeout: 60000 })
      
      // Aguardar que todos os componentes estejam renderizados
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Aguardar que o conteúdo da unidade esteja visível
      try {
        await page.waitForSelector('main', { timeout: 10000 })
        await page.waitForSelector('[class*="UnidadeConteudo"], [class*="card"], [class*="Card"]', { timeout: 10000 })
      } catch {
        console.warn(`[SCORM] Timeout aguardando conteúdo da unidade ${i + 1}, continuando...`)
      }
      
      // Capturar todos os estilos CSS compilados do Tailwind primeiro
      const initialStyles = await page.evaluate(async () => {
        const styles: string[] = []
        
        // Capturar estilos de todos os <style> tags (incluindo Tailwind compilado pelo Next.js)
        Array.from(document.querySelectorAll('style')).forEach(style => {
          if (style.textContent && style.textContent.trim()) {
            // Incluir todos os estilos, mesmo do Next.js (eles contêm o Tailwind compilado)
            styles.push(style.textContent)
          }
        })
        
        return styles.join('\n\n')
      })
      
      let allStyles: string = initialStyles
      
      // Tentar baixar e incluir CSS compilado do Next.js
      try {
        const cssLinks = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
            .map(link => link.getAttribute('href'))
            .filter(href => href && href.includes('_next/static') && href.includes('.css'))
        })
        
        // Baixar cada arquivo CSS e incluir no HTML
        for (const cssHref of cssLinks) {
          if (cssHref && cssHref.startsWith('/')) {
            try {
              const fullUrl = `${baseUrl}${cssHref}`
              const response = await page.goto(fullUrl, { waitUntil: 'networkidle0', timeout: 10000 })
              if (response) {
                const cssContent = await response.text()
                if (cssContent) {
                  allStyles = allStyles + '\n\n/* CSS from ' + cssHref + ' */\n' + cssContent
                  console.log(`[SCORM] CSS capturado para unidade ${i + 1}: ${cssHref} (${cssContent.length} caracteres)`)
                }
              }
          } catch {
            console.warn(`[SCORM] Não foi possível baixar CSS ${cssHref} para unidade ${i + 1}`)
          }
          }
        }
      } catch {
        console.warn(`[SCORM] Erro ao capturar CSS externo para unidade ${i + 1}`)
      }
      
      console.log(`[SCORM] Estilos capturados para unidade ${i + 1}: ${allStyles.length} caracteres`)
      
      // Capturar apenas o conteúdo do preview (navbar + main content)
      let htmlContent = await page.evaluate(() => {
        // Encontrar o elemento raiz do preview
        const previewRoot = document.querySelector('div.min-h-screen.bg-gray-50') || 
                           document.querySelector('body > div') ||
                           document.body
        
        if (!previewRoot) {
          return null
        }
        
        // Capturar a navbar do preview (apenas a navbar do preview)
        const navbar = previewRoot.querySelector('nav.fixed.top-0') || 
                      previewRoot.querySelector('nav')
        const navbarHTML = navbar ? navbar.outerHTML : ''
        
        // Capturar o conteúdo principal (apenas o main)
        const mainContent = previewRoot.querySelector('main') || 
                           previewRoot.querySelector('[class*="main"]')
        const mainHTML = mainContent ? mainContent.outerHTML : ''
        
        // Verificar se há conteúdo
        if (!navbarHTML && !mainHTML) {
          return null
        }
        
        // Construir HTML limpo apenas com o preview
        return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${document.title || 'Unidade'}</title>
</head>
<body class="bg-gray-50">
  ${navbarHTML}
  ${mainHTML}
</body>
</html>`
      })
      
      // Se não conseguiu capturar, tentar fallback mais completo
      if (!htmlContent || (!htmlContent.includes('<main') && !htmlContent.includes('<nav'))) {
        console.warn(`[SCORM] Fallback: capturando HTML completo da unidade ${i + 1}`)
        htmlContent = await page.evaluate(() => {
          // Tentar encontrar o conteúdo mesmo no HTML completo
          const body = document.body
          const navbar = body.querySelector('nav.fixed.top-0') || body.querySelector('nav')
          const main = body.querySelector('main')
          
          if (navbar || main) {
            return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${document.title || 'Unidade'}</title>
</head>
<body class="bg-gray-50">
  ${navbar ? navbar.outerHTML : ''}
  ${main ? main.outerHTML : ''}
</body>
</html>`
          }
          
          // Último recurso: HTML completo
          return document.documentElement.outerHTML
        })
      }
      
      // Verificar se o HTML tem conteúdo
      if (!htmlContent || htmlContent.length < 100) {
        console.warn(`[SCORM] HTML da unidade ${i + 1} parece estar vazio ou muito pequeno`)
        console.warn(`[SCORM] Tamanho do HTML:`, htmlContent?.length || 0)
      } else {
        console.log(`[SCORM] HTML da unidade ${i + 1} capturado:`, htmlContent.length, 'caracteres')
        // Verificar se tem conteúdo visível
        if (htmlContent.includes('<main') || htmlContent.includes('<nav')) {
          console.log(`[SCORM] HTML da unidade ${i + 1} contém conteúdo (main ou nav)`)
        } else {
          console.warn(`[SCORM] HTML da unidade ${i + 1} não contém <main> ou <nav>`)
        }
      }
      
      // Limpa e adapta o HTML
      const adaptedHtml = adaptHTMLForSCORM(htmlContent, unitFileName, curso, i, allStyles, baseUrl)
      
      // Verificar HTML adaptado
      if (adaptedHtml.includes('<main') || adaptedHtml.includes('<nav')) {
        console.log(`[SCORM] HTML adaptado da unidade ${i + 1} contém conteúdo`)
      } else {
        console.warn(`[SCORM] AVISO: HTML adaptado da unidade ${i + 1} não contém <main> ou <nav>`)
      }
      
      zip.file(unitFileName, adaptedHtml)
      console.log(`[SCORM] Unidade ${i + 1} capturada com sucesso`)
      
    } catch (e) {
      console.error(`[SCORM] Erro ao capturar unidade ${unidade.id}:`, e)
      // Se muitas unidades falharem, pode ser um problema maior
      // Mas continuamos para tentar capturar as outras
      // Se todas falharem, o erro será lançado no final
    }
  }
  
  // 5. Fechar Puppeteer
  await browser.close()
  console.log('[SCORM] Captura concluída. Gerando ZIP.')
  
  // Verificar se pelo menos alguns arquivos foram capturados
  const filesInZip = Object.keys(zip.files).length
  if (filesInZip < 3) { // Pelo menos manifest + 2 JS + 1 HTML
    throw new Error(`Poucos arquivos capturados (${filesInZip}). Pode haver um problema com o servidor ou as páginas de preview.`)
  }
  
  // 6. Gerar ZIP
  try {
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
    console.log(`[SCORM] ZIP gerado com sucesso. Total de arquivos: ${filesInZip}`)
    return zipBuffer
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e)
    throw new Error(`Erro ao gerar arquivo ZIP: ${errorMessage}`)
  }
}

function adaptHTMLForSCORM(html: string, currentFile: string, curso: CursoGerado, unitIndex: number, additionalStyles?: string, baseUrl?: string): string {
  let adaptedHtml = html
  
  // 1. Extrair e preservar estilos antes de remover scripts
  const styleMatch = adaptedHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/gi)
  let allStyles = ''
  if (styleMatch) {
    allStyles = styleMatch.map(s => s.replace(/<\/?style[^>]*>/gi, '')).join('\n')
  }
  
  // Adicionar estilos adicionais se fornecidos
  if (additionalStyles) {
    allStyles += '\n' + additionalStyles
  }
  
  // 2. Remover TODOS os scripts (Next.js, React, etc.) - MUITO AGRESSIVO
  // Remover scripts externos (incluindo todos os scripts com src)
  adaptedHtml = adaptedHtml.replace(/<script[^>]*src=["'][^"]*["'][^>]*>[\s\S]*?<\/script>/gi, '')
  adaptedHtml = adaptedHtml.replace(/<script[^>]*src=[''][^']*[''][^>]*>[\s\S]*?<\/script>/gi, '')
  adaptedHtml = adaptedHtml.replace(/<script[^>]*src=["'][^"]*["'][^>]*\/>/gi, '')
  adaptedHtml = adaptedHtml.replace(/<script[^>]*src=[''][^']*[''][^>]*\/>/gi, '')
  
  // Remover scripts inline (incluindo __NEXT_DATA__, React, Next.js, etc.)
  adaptedHtml = adaptedHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  
  // Remover todos os links de preload/stylesheet/font do Next.js
  adaptedHtml = adaptedHtml.replace(/<link[^>]*rel=["'](preload|stylesheet|preconnect|dns-prefetch)["'][^>]*href=["'][^"]*\/_next[^"]*["'][^>]*>/gi, '')
  adaptedHtml = adaptedHtml.replace(/<link[^>]*rel=[''](preload|stylesheet|preconnect|dns-prefetch)[''][^>]*href=[''][^']*\/_next[^']*[''][^>]*>/gi, '')
  adaptedHtml = adaptedHtml.replace(/<link[^>]*href=["'][^"]*\/_next[^"]*["'][^>]*>/gi, '')
  adaptedHtml = adaptedHtml.replace(/<link[^>]*href=[''][^']*\/_next[^']*[''][^>]*>/gi, '')
  
  // Remover meta tags do Next.js e outras meta tags desnecessárias
  adaptedHtml = adaptedHtml.replace(/<meta[^>]*name=["']next-head["'][^>]*>/gi, '')
  adaptedHtml = adaptedHtml.replace(/<meta[^>]*property=["']og:[^"]*["'][^>]*>/gi, '')
  adaptedHtml = adaptedHtml.replace(/<meta[^>]*name=["']twitter:[^"]*["'][^>]*>/gi, '')
  
  // Remover todos os atributos data-next-*, data-react-*, etc.
  adaptedHtml = adaptedHtml.replace(/\sdata-next-[^=]*="[^"]*"/gi, '')
  adaptedHtml = adaptedHtml.replace(/\sdata-next-[^=]*='[^']*'/gi, '')
  adaptedHtml = adaptedHtml.replace(/\sdata-react-[^=]*="[^"]*"/gi, '')
  adaptedHtml = adaptedHtml.replace(/\sdata-react-[^=]*='[^']*'/gi, '')
  
  // Remover comentários do Next.js e React
  adaptedHtml = adaptedHtml.replace(/<!--[\s\S]*?next[\s\S]*?-->/gi, '')
  adaptedHtml = adaptedHtml.replace(/<!--[\s\S]*?react[\s\S]*?-->/gi, '')
  
  // Remover divs e elementos do Next.js que não são necessários
  // Remover __next divs (estrutura do Next.js)
  adaptedHtml = adaptedHtml.replace(/<div[^>]*id=["']__next["'][^>]*>[\s\S]*?<\/div>/gi, '')
  adaptedHtml = adaptedHtml.replace(/<div[^>]*id=['']__next[''][^>]*>[\s\S]*?<\/div>/gi, '')
  
  // Remover noscript tags do Next.js
  adaptedHtml = adaptedHtml.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
  
  // 3. Corrigir links de navegação (O "Truque" das Rotas)
  // Transforma links do Next.js em links de arquivos locais
  
  const unidades = curso.unidades || []
  const cursoId = curso.id
  
  // Corrigir links do menu lateral e botões de navegação
  unidades.forEach((unidade, index) => {
    const nextLink = `/cursos/${cursoId}/preview/unidade/${unidade.id}`
    const scormLink = `unidade-${index + 1}.html`
    
    // Substituir href com diferentes formatos
    adaptedHtml = adaptedHtml.replace(new RegExp(`href="${nextLink.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g'), `href="${scormLink}"`)
    adaptedHtml = adaptedHtml.replace(new RegExp(`href='${nextLink.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`, 'g'), `href='${scormLink}'`)
    
    // Substituir em URLs completas (com baseUrl se fornecido)
    if (baseUrl) {
      adaptedHtml = adaptedHtml.replace(new RegExp(`href="${baseUrl}${nextLink.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g'), `href="${scormLink}"`)
      adaptedHtml = adaptedHtml.replace(new RegExp(`href='${baseUrl}${nextLink.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`, 'g'), `href='${scormLink}'`)
    }
    
    // Substituir em onclick ou outros atributos
    adaptedHtml = adaptedHtml.replace(new RegExp(nextLink.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), scormLink)
  })
  
  // Corrigir link da "Página Inicial"
  const homeLink = `/cursos/${cursoId}/preview`
  adaptedHtml = adaptedHtml.replace(new RegExp(`href="${homeLink.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g'), `href="index.html"`)
  adaptedHtml = adaptedHtml.replace(new RegExp(`href='${homeLink.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`, 'g'), `href='index.html'`)
  
  // Corrigir links de navegação entre unidades (botões Anterior/Próximo)
  if (unitIndex >= 0 && unitIndex < unidades.length) {
    if (unitIndex > 0) {
      const prevUnidade = unidades[unitIndex - 1]
      const prevLink = `/cursos/${cursoId}/preview/unidade/${prevUnidade.id}`
      const scormPrevLink = `unidade-${unitIndex}.html`
      
      // Substituir links de unidade anterior
      adaptedHtml = adaptedHtml.replace(new RegExp(`href="${prevLink.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g'), `href="${scormPrevLink}"`)
      adaptedHtml = adaptedHtml.replace(new RegExp(`href='${prevLink.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`, 'g'), `href='${scormPrevLink}'`)
      
      // Substituir em texto do botão
      adaptedHtml = adaptedHtml.replace(/href="[^"]*"[^>]*>[\s\S]*?Unidade Anterior[\s\S]*?<\/a>/gi, (match) => {
        return match.replace(/href="[^"]*"/, `href="${scormPrevLink}"`)
      })
    }
    
    if (unitIndex < unidades.length - 1) {
      const nextUnidade = unidades[unitIndex + 1]
      const nextLink = `/cursos/${cursoId}/preview/unidade/${nextUnidade.id}`
      const scormNextLink = `unidade-${unitIndex + 2}.html`
      
      // Substituir links de próxima unidade
      adaptedHtml = adaptedHtml.replace(new RegExp(`href="${nextLink.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g'), `href="${scormNextLink}"`)
      adaptedHtml = adaptedHtml.replace(new RegExp(`href='${nextLink.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`, 'g'), `href='${scormNextLink}'`)
      
      // Substituir em texto do botão
      adaptedHtml = adaptedHtml.replace(/href="[^"]*"[^>]*>[\s\S]*?Próxima Unidade[\s\S]*?<\/a>/gi, (match) => {
        return match.replace(/href="[^"]*"/, `href="${scormNextLink}"`)
      })
    }
  }
  
  // 4. Remover elementos que dependem do Next.js
  // Remover atributos de dados do Next.js
  adaptedHtml = adaptedHtml.replace(/\sdata-next-[^=]*="[^"]*"/gi, '')
  adaptedHtml = adaptedHtml.replace(/\sdata-next-[^=]*='[^']*'/gi, '')
  
  // Remover meta tags do Next.js
  adaptedHtml = adaptedHtml.replace(/<meta[^>]*name=["']next-head["'][^>]*>/gi, '')
  
  // 5. Remover links para recursos externos que não funcionarão no SCORM
  // Manter apenas links relativos e inline styles
  adaptedHtml = adaptedHtml.replace(/<link[^>]*rel=["']stylesheet["'][^>]*href=["'][^"]*\/_next[^"]*["'][^>]*>/gi, '')
  
  // 6. Garantir que estilos sejam preservados no head
  // Incluir apenas estilos capturados (CSS compilado do Next.js/Tailwind)
  // NÃO incluir Tailwind CDN - os estilos já estão compilados em allStyles
  
  // Incluir estilos capturados se existirem
  const styleTag = allStyles ? `<style id="scorm-preserved-styles">\n${allStyles}\n</style>` : ''
  
  // Inserir estilos preservados no head
  if (adaptedHtml.includes('</head>')) {
    // Inserir antes do fechamento do head
    adaptedHtml = adaptedHtml.replace('</head>', `${styleTag}\n</head>`)
  } else if (adaptedHtml.includes('<body>')) {
    // Se não tiver head, criar um
    if (!adaptedHtml.includes('<head>')) {
      const titleMatch = adaptedHtml.match(/<title>([\s\S]*?)<\/title>/i)
      const title = titleMatch ? titleMatch[1] : 'Curso'
      adaptedHtml = adaptedHtml.replace('<body>', `<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title>${styleTag}\n</head>\n<body>`)
    } else {
      adaptedHtml = adaptedHtml.replace('<body>', `${styleTag}\n<body>`)
    }
  } else {
    // Se não tiver nem head nem body, adicionar tudo
    adaptedHtml = `<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Curso</title>${styleTag}\n</head>\n${adaptedHtml}`
  }
  
  // 7. Garantir que SVG icons (lucide-react) estejam inline
  // Os SVGs já devem estar no HTML capturado, mas vamos garantir que não sejam removidos
  
  // 8. Corrigir onclick handlers que podem tentar usar router
  adaptedHtml = adaptedHtml.replace(/onClick=["'][^"']*router\.push[^"']*["']/gi, '')
  adaptedHtml = adaptedHtml.replace(/onclick=["'][^"']*router\.push[^"']*["']/gi, '')
  
  // 9. Garantir que imagens com URLs externas sejam preservadas (já estão no HTML)
  // Não fazer nada, apenas manter as URLs originais
  
  // 10. Injetar nossos scripts SCORM
  const scriptsToInject = `
    <script src="scorm-api.js"></script>
    <script src="interacoes.js" defer></script>
    <script>
      (function() {
        'use strict';
        
        // Desabilitar qualquer tentativa de usar router do Next.js
        if (typeof window !== 'undefined') {
          window.next = undefined;
          if (window.__NEXT_DATA__) {
            delete window.__NEXT_DATA__;
          }
          // Remover event listeners do Next.js se existirem
          if (window.__NEXT_ROUTER_BASEPATH) {
            delete window.__NEXT_ROUTER_BASEPATH;
          }
        }
        
        // Aguardar DOM carregar
        function initSCORM() {
          // Inicializa a API SCORM
          if (window.SCORMAP && window.SCORMAP.init()) {
            // Define como incompleto (o aluno está vendo)
            window.SCORMAP.setStatus('incomplete');
            // Salva a localização atual
            window.SCORMAP.setLocation('${currentFile}');
            window.SCORMAP.save();
          }
          
          // Interceptar cliques em links para garantir que funcionem
          document.addEventListener('click', function(e) {
            var link = e.target.closest('a');
            if (link && link.href) {
              // Links já foram corrigidos pelo adaptHTMLForSCORM
              // Apenas garantir que não haja erro
              try {
                // Se o link aponta para um arquivo local, deixar funcionar normalmente
                if (link.href.includes('.html') || link.href.includes('index.html')) {
                  // Permitir navegação normal
                }
              } catch (err) {
                console.warn('[SCORM] Erro ao processar link:', err);
              }
            }
            
            // Botão de Sair
            var logoutButton = e.target.closest('button[aria-label="Sair"]') || 
                              e.target.closest('button')?.querySelector('svg')?.closest('button');
            if (logoutButton) {
              var svg = logoutButton.querySelector('svg');
              // Verificar se é o botão de logout (pode ter ícone de log-out)
              if (svg && (svg.getAttribute('lucide') === 'log-out' || 
                         svg.innerHTML.includes('log-out') ||
                         logoutButton.textContent.includes('Sair'))) {
                if (window.SCORMAP && window.SCORMAP.isInitialized) {
                  window.SCORMAP.setStatus('completed');
                  window.SCORMAP.save();
                  window.SCORMAP.finish();
                  // Tenta fechar a janela
                  if (window.parent !== window) {
                    window.close();
                  }
                }
              }
            }
          });
          
          // Botão Finalizar Curso (se existir)
          window.finalizarCurso = function() {
            if (window.SCORMAP && window.SCORMAP.isInitialized) {
              window.SCORMAP.setStatus('completed');
              window.SCORMAP.save();
              window.SCORMAP.finish();
              alert('Curso finalizado com sucesso!');
            } else {
              alert('Curso finalizado! (modo standalone)');
            }
          };
        }
        
        // Inicializar quando DOM estiver pronto
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', initSCORM);
        } else {
          initSCORM();
        }
      })();
    </script>
  `
  
  // Injetar antes do fechamento do body
  if (adaptedHtml.includes('</body>')) {
    adaptedHtml = adaptedHtml.replace('</body>', `${scriptsToInject}\n</body>`)
  } else {
    // Se não tiver body, adicionar
    adaptedHtml = adaptedHtml + scriptsToInject
  }
  
  return adaptedHtml
}

function createManifest(curso: CursoGerado): string {
  const identifier = uuidv4()
  const title = curso.titulo || 'Curso SCORM'
  const unidades = curso.unidades || []
  
  // Criar item para a página principal (index.html) - DEVE SER O PRIMEIRO
  const homeItem = `      <item identifier="item-index" identifierref="res-index">
        <title>${escapeXml(title)} (Início)</title>
      </item>`
  
  // Criar items para cada unidade
  const unitItems = unidades.map((unidade: Unidade, index: number) => {
    const itemId = `item-${index + 1}`
    const resId = `res-${index + 1}`
    return `      <item identifier="${itemId}" identifierref="${resId}">
        <title>${escapeXml(unidade.titulo || `Unidade ${index + 1}`)}</title>
      </item>`
  }).join('\n')
  
  // Criar recursos compartilhados
  const sharedResources = `
    <resource identifier="res-shared-js" type="webcontent" adlcp:scormtype="asset">
      <file href="scorm-api.js"/>
      <file href="interacoes.js"/>
    </resource>`
  
  // Criar recursos para cada unidade
  const unitResources = unidades.map((unidade: Unidade, index: number) => {
    const resId = `res-${index + 1}`
    const fileName = `unidade-${index + 1}.html`
    return `    <resource identifier="${resId}" type="webcontent" adlcp:scormtype="sco" href="${fileName}">
      <file href="${fileName}"/>
      <dependency identifierref="res-shared-js"/>
    </resource>`
  }).join('\n')
  
  // Recurso para index.html
  const indexResource = `
    <resource identifier="res-index" type="webcontent" adlcp:scormtype="sco" href="index.html">
      <file href="index.html"/>
      <dependency identifierref="res-shared-js"/>
    </resource>`
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${identifier}" version="1.0" xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2" xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 http://www.imsproject.org/xsd/imscp_rootv1p1p2.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 http://www.adlnet.org/xsd/adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
    <lom xmlns="http://www.imsglobal.org/xsd/imsmd_rootv1p2p1">
      <general>
        <identifier>
          <catalog>URI</catalog>
          <entry>${identifier}</entry>
        </identifier>
        <title>
          <string language="pt-BR">${escapeXml(title)}</string>
        </title>
        <description>
          <string language="pt-BR">${escapeXml(curso.descricao || 'Curso SCORM')}</string>
        </description>
        <language>pt-BR</language>
      </general>
      <lifecycle>
        <version>
          <string>1.0</string>
        </version>
      </lifecycle>
      <technical>
        <format>text/html</format>
        <location>index.html</location>
      </technical>
    </lom>
  </metadata>
  <organizations default="org1">
    <organization identifier="org1">
      <title>${escapeXml(title)}</title>
${homeItem}
${unitItems}
    </organization>
  </organizations>
  <resources>${sharedResources}
${indexResource}
${unitResources}
  </resources>
</manifest>`
}

function createScormAPIJS(): string {
  return `// SCORM 1.2 API Wrapper
window.SCORMAP = {
    API: null,
    isInitialized: false,
    version: '1.2',
    
    init: function() {
        console.log('[SCORM] Iniciando busca pela API...');
        this.API = this.findAPI(window);
        
        if (this.API == null) {
            console.warn('[SCORM] API não encontrada - modo standalone');
            return false;
        }
        
        console.log('[SCORM] API encontrada! Versão: ' + this.version);
        
        try {
            var result = this.API.LMSInitialize('');
            
            if (result === 'true' || result === true) {
                this.isInitialized = true;
                console.log('[SCORM] Inicialização bem-sucedida!');
                return true;
            } else {
                console.error('[SCORM] Falha na inicialização: ' + result);
                var errorCode = this.getLastError();
                var errorString = this.getErrorString(errorCode);
                console.error('[SCORM] Erro ' + errorCode + ': ' + errorString);
                return false;
            }
        } catch (error) {
            console.error('[SCORM] Exceção durante inicialização: ' + error);
            return false;
        }
    },
    
    findAPI: function(win) {
        var findAttempts = 0;
        var findAttemptLimit = 500;
        
        console.log('[SCORM] Procurando API na janela atual...');
        
        // Primeiro, verifica a janela atual
        if (win.API) {
            console.log('[SCORM] API (SCORM 1.2) encontrada na janela atual');
            return win.API;
        }
        
        // Procura nas janelas pai
        console.log('[SCORM] API não encontrada na janela atual, procurando nas janelas pai...');
        while (win.parent != null && win.parent != win && findAttempts < findAttemptLimit) {
            findAttempts++;
            win = win.parent;
            
            if (win.API) {
                console.log('[SCORM] API (SCORM 1.2) encontrada após ' + findAttempts + ' tentativas');
                return win.API;
            }
        }
        
        // Procura no opener (caso seja popup)
        if (window.opener) {
            console.log('[SCORM] Procurando na janela opener...');
            if (window.opener.API) {
                console.log('[SCORM] API (SCORM 1.2) encontrada no opener');
                return window.opener.API;
            }
        }
        
        console.warn('[SCORM] API não encontrada após ' + findAttempts + ' tentativas');
        return null;
    },
    
    setValue: function(element, value) {
        if (!this.isInitialized) return false;
        
        try {
            var result = this.API.LMSSetValue(element, value);
            
            if (result === 'true' || result === true) {
                console.log('[SCORM] Definido ' + element + ' = ' + value);
                return true;
            } else {
                console.warn('[SCORM] Falha ao definir ' + element + ': ' + result);
                var errorCode = this.getLastError();
                console.error('[SCORM] Código de erro: ' + errorCode);
                return false;
            }
        } catch (error) {
            console.error('[SCORM] Exceção ao definir ' + element + ': ' + error);
            return false;
        }
    },
    
    getValue: function(element) {
        if (!this.isInitialized) return '';
        
        try {
            var result = this.API.LMSGetValue(element);
            
            if (result !== null && result !== undefined && result !== '') {
                console.log('[SCORM] Obtido ' + element + ' = ' + result);
            }
            
            return result;
        } catch (error) {
            console.error('[SCORM] Exceção ao obter ' + element + ': ' + error);
            return '';
        }
    },
    
    getLastError: function() {
        if (!this.API) return '0';
        
        try {
            return this.API.LMSGetLastError();
        } catch (error) {
            console.error('[SCORM] Erro ao obter último erro: ' + error);
            return '0';
        }
    },
    
    getErrorString: function(errorCode) {
        if (!this.API) return 'API não disponível';
        
        try {
            return this.API.LMSGetErrorString(errorCode);
        } catch (error) {
            console.error('[SCORM] Erro ao obter descrição do erro: ' + error);
            return 'Descrição não disponível';
        }
    },
    
    getDiagnostic: function(errorCode) {
        if (!this.API) return '';
        
        try {
            return this.API.LMSGetDiagnostic(errorCode);
        } catch (error) {
            console.error('[SCORM] Erro ao obter diagnóstico: ' + error);
            return '';
        }
    },
    
    setStatus: function(status) {
        // SCORM 1.2: cmi.core.lesson_status (passed, completed, failed, incomplete, browsed, not attempted)
        return this.setValue('cmi.core.lesson_status', status);
    },
    
    setLocation: function(location) {
        return this.setValue('cmi.core.lesson_location', location);
    },
    
    getResumeLocation: function() {
        return this.getValue('cmi.core.lesson_location');
    },
    
    save: function() {
        if (!this.isInitialized) return false;
        
        try {
            var result = this.API.LMSCommit('');
            
            if (result === 'true' || result === true) {
                console.log('[SCORM] Dados salvos com sucesso');
                return true;
            } else {
                console.warn('[SCORM] Falha ao salvar dados: ' + result);
                var errorCode = this.getLastError();
                console.error('[SCORM] Código de erro: ' + errorCode);
                return false;
            }
        } catch (error) {
            console.error('[SCORM] Exceção ao salvar dados: ' + error);
            return false;
        }
    },
    
    finish: function() {
        if (!this.isInitialized) return false;
        
        try {
            var result = this.API.LMSFinish('');
            
            if (result === 'true' || result === true) {
                this.isInitialized = false;
                console.log('[SCORM] Sessão finalizada com sucesso');
                return true;
            } else {
                console.warn('[SCORM] Falha ao finalizar sessão: ' + result);
                var errorCode = this.getLastError();
                console.error('[SCORM] Código de erro: ' + errorCode);
                return false;
            }
        } catch (error) {
            console.error('[SCORM] Exceção ao finalizar sessão: ' + error);
            return false;
        }
    }
};`
}

function createInteractionsJS(): string {
  return `// JavaScript para interatividade dos componentes - Versão Robusta
(function() {
    'use strict';
    
    // Simular useLMS hook - Buscar nome do aluno do SCORM
    function initLMS() {
        var learnerName = 'Convidado';
        var isConnected = false;
        
        try {
            if (window.SCORMAP && window.SCORMAP.isInitialized) {
                isConnected = true;
                var name = window.SCORMAP.getValue('cmi.core.student_name');
                if (name && name !== '' && name !== 'undefined' && name !== 'null') {
                    learnerName = name;
                }
            }
        } catch (e) {
            console.warn('[LMS] Erro ao buscar nome do aluno:', e);
        }
        
        // Atualizar nome do aluno na navbar se existir
        var userElements = document.querySelectorAll('[data-learner-name], .learner-name');
        userElements.forEach(function(el) {
            if (el.textContent) {
                el.textContent = learnerName;
            }
        });
        
        return { learnerName: learnerName, isConnected: isConnected };
    }
    
    function init() {
        console.log('[Interactions] Iniciando re-animação de componentes...');
        
        // 1. Lógica do Menu Lateral (Sheet) - Baseado em Radix UI
        try {
            const sheetTrigger = document.querySelector('button[aria-label="Abrir menu"], button[aria-label*="menu"]');
            const sheetOverlay = document.querySelector('[data-radix-sheet-overlay]');
            const sheetContent = document.querySelector('[data-radix-sheet-content]');
            
            const openSheet = () => {
                if (sheetOverlay) sheetOverlay.setAttribute('data-state', 'open');
                if (sheetContent) sheetContent.setAttribute('data-state', 'open');
            };
            
            const closeSheet = () => {
                if (sheetOverlay) sheetOverlay.setAttribute('data-state', 'closed');
                if (sheetContent) sheetContent.setAttribute('data-state', 'closed');
            };
            
            if (sheetTrigger && sheetOverlay && sheetContent) {
                // Estado inicial (capturado pelo Puppeteer)
                const initialState = sheetContent.getAttribute('data-state') || 'closed';
                if (initialState === 'closed') closeSheet();
                else openSheet();
                
                sheetTrigger.addEventListener('click', openSheet);
                sheetOverlay.addEventListener('click', closeSheet);
                
                if (sheetContent) {
                    sheetContent.querySelectorAll('a').forEach(link => {
                        link.addEventListener('click', closeSheet);
                    });
                }
                
                console.log('[Interactions] Menu lateral (Sheet) re-animado.');
            }
        } catch (e) {
            console.warn('[Interactions] Erro ao re-animar Sheet:', e);
        }
        
        // 2. Lógica do Flip Card - Simples e robusto
        try {
            document.querySelectorAll('.flip-card, .flip-card-wrapper').forEach(function(card) {
                const flipCard = card.classList.contains('flip-card') ? card : card.querySelector('.flip-card');
                if (flipCard) {
                    flipCard.addEventListener('click', function(e) {
                        e.stopPropagation();
                        this.classList.toggle('flipped');
                    });
                }
            });
            console.log('[Interactions] FlipCards re-animados.');
        } catch (e) {
            console.warn('[Interactions] Erro ao re-animar FlipCards:', e);
        }
        
        // 3. Lógica do Accordion & InfoBox - Baseado em Radix UI data-state
        try {
            // Accordions Radix UI - manipula apenas data-state
            document.querySelectorAll('[data-radix-accordion-item]').forEach(function(item) {
                const trigger = item.querySelector('[data-radix-accordion-trigger]');
                
                if (trigger) {
                    trigger.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        const currentState = item.getAttribute('data-state');
                        const newState = currentState === 'open' ? 'closed' : 'open';
                        item.setAttribute('data-state', newState);
                        
                        // Rotacionar chevron se existir
                        const chevron = trigger.querySelector('svg');
                        if (chevron) {
                            chevron.style.transform = newState === 'open' ? 'rotate(180deg)' : 'rotate(0deg)';
                        }
                    });
                }
            });
            
            // Accordions simples (sem Radix) - baseado em aria-expanded
            document.querySelectorAll('[role="region"][aria-labelledby]').forEach(function(region) {
                const triggerId = region.getAttribute('aria-labelledby');
                if (triggerId) {
                    const trigger = document.getElementById(triggerId);
                    if (trigger && trigger.tagName === 'BUTTON') {
                        trigger.addEventListener('click', function(e) {
                            e.preventDefault();
                            const isExpanded = region.getAttribute('aria-expanded') === 'true';
                            region.setAttribute('aria-expanded', !isExpanded);
                        });
                    }
                }
            });
            
            console.log('[Interactions] Accordions/InfoBox re-animados.');
        } catch (e) {
            console.warn('[Interactions] Erro ao re-animar Accordions:', e);
        }
        
        // 4. Lógica do Quiz - Simples, apenas feedback visual
        try {
            // Quizzes baseados em estrutura comum do QuizConteudo
            document.querySelectorAll('[class*="quiz"], [class*="Quiz"]').forEach(function(quizContainer) {
                // Encontrar opções clicáveis (cards com cursor-pointer)
                const options = quizContainer.querySelectorAll('.card[class*="cursor-pointer"], [role="button"][class*="option"]');
                
                options.forEach(function(option) {
                    option.addEventListener('click', function(e) {
                        e.stopPropagation();
                        
                        // Verificar se já foi respondido
                        if (quizContainer.classList.contains('answered')) return;
                        quizContainer.classList.add('answered');
                        
                        // Desabilitar todas as opções
                        options.forEach(function(opt) {
                            opt.style.pointerEvents = 'none';
                            opt.style.cursor = 'not-allowed';
                            if (opt !== option) opt.style.opacity = '0.6';
                        });
                        
                        // Verificar se é correta (pode estar em data attribute ou classe)
                        const isCorrect = option.dataset.isCorrect === 'true' || 
                                        option.classList.contains('correct') ||
                                        option.querySelector('[class*="CheckCircle"], [class*="green"]');
                        
                        // Adicionar feedback visual
                        if (isCorrect) {
                            option.classList.add('ring-2', 'ring-green-500', 'bg-green-50');
                        } else {
                            option.classList.add('ring-2', 'ring-red-500', 'bg-red-50');
                            
                            // Marcar resposta correta se existir
                            options.forEach(function(opt) {
                                if (opt.dataset.isCorrect === 'true' || opt.classList.contains('correct')) {
                                    opt.classList.add('ring-2', 'ring-green-500', 'bg-green-50');
                                }
                            });
                        }
                        
                        // Mostrar feedback se existir
                        const feedback = option.querySelector('[data-feedback], [class*="feedback"]');
                        if (feedback) {
                            feedback.style.display = 'block';
                        }
                    });
                });
            });
            
            console.log('[Interactions] Quizzes re-animados.');
        } catch (e) {
            console.warn('[Interactions] Erro ao re-animar Quizzes:', e);
        }
        
        // Inicializar LMS (nome do aluno)
        initLMS();
        
        console.log('[Interactions] Componentes inicializados.');
    }
    
    // Inicializar quando DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Função global para finalizar curso
    window.finalizarCurso = function() {
        if (window.SCORMAP && window.SCORMAP.isInitialized) {
            window.SCORMAP.setStatus('completed');
            window.SCORMAP.save();
            window.SCORMAP.finish();
            alert('Curso finalizado com sucesso!');
        } else {
            alert('Curso finalizado! (modo standalone)');
        }
    };
})();`
}

// Funções auxiliares

function escapeXml(text: string): string {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
