import jsPDF from 'jspdf'
import type {
  Block,
  AccordionItem,
  FlipcardItem,
  ListItem,
  QuizData,
  Unit,
  Course,
} from '@/types/course'
import { cardsFlipcard } from '@/lib/blocks'

type CourseSummary = Course

// ========================================================================
// 🎨 CENTRAL DE DESIGN (THEME v2 — layout "apostila")
// ========================================================================
const THEME = {
  colors: {
    primary: '#1B2B4B',
    primaryDark: '#12203A',
    accent: '#2E9BD6',
    text: '#3A3A3A',
    textMuted: '#8A8A8A',
    boxBg: '#EEF3F8',
    white: '#FFFFFF',
  },
  fonts: {
    bodySize: 10.5,
    h1: 22,
    h2: 16,
    h3: 13,
    caption: 8.5,
    header: 8,
  },
  layout: {
    margin: 25,
    lineHeight: 1.5,
    boxPadding: 6,
    headerY: 14,
    contentTop: 30,
  },
} as const

/** Converte cor hex (#rrggbb) em array RGB. Retorna null se inválida. */
function hexToRgb(hex: string): number[] | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!match) return null
  const value = parseInt(match[1], 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

// Constantes de layout (em mm)
const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const MARGIN = THEME.layout.margin
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2
const CONTENT_TOP = THEME.layout.contentTop
const PAGE_BREAK_Y = PAGE_HEIGHT - MARGIN

interface LoadedImage {
  dataUrl: string
  width: number
  height: number
}

/** Baixa uma imagem e converte para dataURL JPEG embutível no jsPDF. */
async function loadImage(url: string): Promise<LoadedImage | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    const bitmap = await createImageBitmap(blob)
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    return { dataUrl, width: bitmap.width, height: bitmap.height }
  } catch {
    return null
  }
}

/** Varre o curso e pré-carrega todas as imagens de blocos "imagem" em paralelo. */
async function preloadImages(course: CourseSummary): Promise<Map<string, LoadedImage | null>> {
  const map = new Map<string, LoadedImage | null>()
  const tasks: Promise<void>[] = []

  for (const unit of course.unidades || []) {
    for (const item of unit.conteudo || []) {
      if (item.tipo === 'imagem' && item.conteudo) {
        tasks.push(
          loadImage(item.conteudo).then((img) => {
            map.set(item.id, img)
          })
        )
      }
    }
  }

  await Promise.all(tasks)
  return map
}

/** Gera os pontos de um hexágono centrado em (cx, cy) com raio r. */
function hexagonPoints(cx: number, cy: number, r: number): [number, number][] {
  const pts: [number, number][] = []
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30)
    pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)])
  }
  return pts
}

function drawHexagon(doc: jsPDF, cx: number, cy: number, r: number) {
  const pts = hexagonPoints(cx, cy, r)
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[(i + 1) % pts.length]
    doc.line(x1, y1, x2, y2)
  }
}

/** Desenha uma grade de hexágonos em linha fina, usada como padrão decorativo da capa. */
function drawHexGrid(
  doc: jsPDF,
  originX: number,
  originY: number,
  radius: number,
  cols: number,
  rows: number
) {
  const hexWidth = radius * Math.sqrt(3)
  const hexHeight = radius * 1.5
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const offsetX = row % 2 === 0 ? 0 : hexWidth / 2
      const cx = originX + col * hexWidth + offsetX
      const cy = originY + row * hexHeight
      drawHexagon(doc, cx, cy, radius)
    }
  }
}

interface TocEntry {
  title: string
  page: number
}

interface AnswerKeyEntry {
  question: string
  answer: string
}

/**
 * Função principal para gerar o PDF
 */
export async function generateCoursePDF(course: CourseSummary, filename?: string): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  // ========================================================================
  // FONTES CUSTOMIZADAS (Open Sans) — carregadas sob demanda
  // ========================================================================
  const { OPEN_SANS_REGULAR_B64, OPEN_SANS_BOLD_B64, OPEN_SANS_ITALIC_B64, OPEN_SANS_LIGHT_B64 } =
    await import('./pdf-fonts')

  doc.addFileToVFS('OpenSans-Regular.ttf', OPEN_SANS_REGULAR_B64)
  doc.addFont('OpenSans-Regular.ttf', 'OpenSans', 'normal')
  doc.addFileToVFS('OpenSans-Bold.ttf', OPEN_SANS_BOLD_B64)
  doc.addFont('OpenSans-Bold.ttf', 'OpenSans', 'bold')
  doc.addFileToVFS('OpenSans-Italic.ttf', OPEN_SANS_ITALIC_B64)
  doc.addFont('OpenSans-Italic.ttf', 'OpenSans', 'italic')
  doc.addFileToVFS('OpenSans-Light.ttf', OPEN_SANS_LIGHT_B64)
  doc.addFont('OpenSans-Light.ttf', 'OpenSans', 'light')

  // Pré-carrega imagens dos blocos "imagem" antes de montar o documento
  const loadedImages = await preloadImages(course)
  let figureCounter = 0
  let quizAnswerKey: AnswerKeyEntry[] = []
  /** Quando true, os helpers de renderização apenas calculam posições/alturas,
   *  sem desenhar tinta real nem quebrar páginas — usado pela passada de
   *  medição do renderBoxV2 para evitar duplicar conteúdo no PDF final. */
  let measuring = false

  // ========================================================================
  // FUNÇÕES HELPER DE RENDERIZAÇÃO
  // ========================================================================

  /** Verifica se precisa de uma nova página e a adiciona se necessário */
  const checkPageBreak = (y: number, requiredSpace: number = 20): number => {
    if (measuring) return y
    if (y + requiredSpace > PAGE_BREAK_Y) {
      doc.addPage()
      return CONTENT_TOP
    }
    return y
  }

  /** Adiciona um espaço vertical */
  const addSpace = (y: number, space: number = 5): number => {
    return checkPageBreak(y, space) + space
  }

  /** Adiciona uma linha separadora */
  const addSeparator = (y: number): number => {
    let newY = checkPageBreak(y, 10)
    newY = addSpace(newY, 5)
    doc.setDrawColor(THEME.colors.boxBg)
    doc.line(MARGIN, newY, PAGE_WIDTH - MARGIN, newY)
    return addSpace(newY, 5)
  }

  /**
   * A "workhorse" function. Renders text with wrapping, styling, and page breaks.
   * Retorna a nova posição Y após o texto ser adicionado.
   */
  const renderText = (
    text: string,
    y: number,
    options: {
      fontSize?: number
      fontStyle?: 'normal' | 'bold' | 'italic' | 'light'
      color?: string
      align?: 'left' | 'center' | 'right' | 'justify'
      x?: number
      maxWidth?: number
      isHtml?: boolean
    } = {}
  ): number => {
    const fontSize = options.fontSize || THEME.fonts.bodySize
    const fontStyle = options.fontStyle || 'normal'
    const color = options.color || THEME.colors.text
    const align = options.align || 'left'
    const x = options.x || MARGIN
    const maxWidth = options.maxWidth || CONTENT_WIDTH - (x - MARGIN)

    const cleanText = options.isHtml ? cleanHtml(text) : text
    if (!cleanText) return y

    doc.setFontSize(fontSize)
    doc.setFont('OpenSans', fontStyle)
    doc.setTextColor(color)

    const lines: string[] = doc.splitTextToSize(cleanText, maxWidth)
    const lineHeight = fontSize * THEME.layout.lineHeight * 0.352778 // pt -> mm

    let currentY = y

    lines.forEach((line, idx) => {
      currentY = checkPageBreak(currentY, lineHeight)
      const isLastLine = idx === lines.length - 1

      if (!measuring) {
        if (align === 'justify' && !isLastLine) {
          doc.text(line, x, currentY, { maxWidth, align: 'justify', baseline: 'top' })
        } else {
          let xPos = x
          let effectiveAlign: 'left' | 'center' | 'right' = 'left'
          if (align === 'center') {
            xPos = x + maxWidth / 2
            effectiveAlign = 'center'
          } else if (align === 'right') {
            xPos = x + maxWidth
            effectiveAlign = 'right'
          }
          doc.text(line, xPos, currentY, { align: effectiveAlign, baseline: 'top' })
        }
      }
      currentY += lineHeight
    })

    return currentY
  }

  /** Caixa de destaque v2: fundo claro + filete lateral em accent, com título opcional */
  const renderBoxV2 = (
    y: number,
    renderContentCallback: (y: number) => number,
    padding: number = THEME.layout.boxPadding,
    title?: string
  ): number => {
    let newY = checkPageBreak(y, 20)
    const startY = newY
    const titleSpace = title ? 8 : 0

    measuring = true
    let contentEndY = renderContentCallback(startY + padding + titleSpace)
    measuring = false
    const boxHeight = contentEndY - startY

    if (startY + boxHeight + padding * 2 > PAGE_BREAK_Y) {
      newY = checkPageBreak(startY, boxHeight + padding * 2)
    }

    const totalHeight = boxHeight + padding * 2
    doc.setFillColor(THEME.colors.boxBg)
    doc.rect(MARGIN, newY, CONTENT_WIDTH, totalHeight, 'F')
    doc.setFillColor(THEME.colors.accent)
    doc.rect(MARGIN, newY, 1.5, totalHeight, 'F')

    let innerY = newY + padding
    if (title) {
      innerY = renderText(title, innerY, {
        fontSize: THEME.fonts.h3,
        fontStyle: 'bold',
        color: THEME.colors.primary,
        x: MARGIN + padding,
        maxWidth: CONTENT_WIDTH - padding * 2,
      })
      innerY += 2
    }

    contentEndY = renderContentCallback(innerY)
    return contentEndY + padding
  }

  /** Limpa tags HTML básicas para texto plano */
  const cleanHtml = (text: string): string => {
    return (text || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim()
  }

  // ========================================================================
  // CAPA
  // ========================================================================
  const renderCoverPage = () => {
    doc.setFillColor(THEME.colors.primary)
    doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F')

    doc.setDrawColor(THEME.colors.primaryDark)
    doc.setLineWidth(0.3)
    drawHexGrid(doc, PAGE_WIDTH - 85, -15, 9, 6, 9)

    let y = 110
    const title = course.titulo || 'Curso'
    const titleSize = title.length > 40 ? 26 : 32
    y = renderText(title, y, {
      fontSize: titleSize,
      fontStyle: 'bold',
      color: THEME.colors.white,
      maxWidth: CONTENT_WIDTH,
    })

    if (course.descricao) {
      y = addSpace(y, 6)
      renderText(course.descricao, y, {
        fontSize: 13,
        fontStyle: 'light',
        color: THEME.colors.white,
        maxWidth: CONTENT_WIDTH,
      })
    }

    const footerY = PAGE_HEIGHT - 30
    doc.setDrawColor(THEME.colors.accent)
    doc.setLineWidth(0.5)
    doc.line(MARGIN, footerY, PAGE_WIDTH - MARGIN, footerY)

    const metaParts = [course.categoria, course.cargaHoraria, course.modalidade].filter(Boolean)
    renderText(metaParts.join('   ·   '), footerY + 6, {
      fontSize: 10,
      color: THEME.colors.accent,
      maxWidth: CONTENT_WIDTH,
    })
  }

  // ========================================================================
  // ROSTO + FICHA TÉCNICA
  // ========================================================================
  const renderTitlePage = () => {
    doc.addPage()
    const y = PAGE_HEIGHT / 2 - 20
    renderText(course.titulo || 'Curso', y, {
      fontSize: THEME.fonts.h1,
      fontStyle: 'light',
      color: THEME.colors.primary,
      align: 'center',
      maxWidth: CONTENT_WIDTH,
    })
  }

  const renderCreditsPage = () => {
    doc.addPage()
    let y: number = MARGIN
    y = renderText('Ficha Técnica', y, {
      fontSize: THEME.fonts.h2,
      fontStyle: 'bold',
      color: THEME.colors.primary,
    })
    y = addSpace(y, 8)

    const infos = [
      { label: 'Categoria', value: course.categoria },
      { label: 'Carga Horária', value: course.cargaHoraria },
      { label: 'Modalidade', value: course.modalidade },
      {
        label: 'Data de Criação',
        value: course.dataCriacao ? new Date(course.dataCriacao).toLocaleDateString('pt-BR') : '',
      },
    ].filter((info) => info.value)

    infos.forEach((info) => {
      y = renderText(`${info.label}: ${info.value}`, y, {
        fontSize: THEME.fonts.bodySize,
        color: THEME.colors.textMuted,
      })
      y = addSpace(y, 3)
    })
  }

  // ========================================================================
  // SUMÁRIO (duas passadas)
  // ========================================================================
  let tocPageNumber = 0

  const reserveTocPage = (unitsCount: number) => {
    doc.addPage()
    tocPageNumber = doc.getNumberOfPages()
    const reservedPages = unitsCount > 20 ? 2 : 1
    for (let i = 1; i < reservedPages; i++) {
      doc.addPage()
    }
  }

  const fillTocPage = (entries: TocEntry[]) => {
    doc.setPage(tocPageNumber)
    let y: number = MARGIN
    y = renderText('Sumário', y, {
      fontSize: THEME.fonts.h1,
      fontStyle: 'bold',
      color: THEME.colors.primary,
    })
    y = addSpace(y, 10)

    if (entries.length === 0) {
      renderText('Nenhuma unidade disponível.', y, {
        fontSize: THEME.fonts.bodySize,
        color: THEME.colors.textMuted,
      })
      return
    }

    entries.forEach((entry, idx) => {
      if (y + 9 > PAGE_BREAK_Y) {
        doc.setPage(doc.getCurrentPageInfo().pageNumber + 1)
        y = MARGIN
      }

      const numberLabel = `${idx + 1}.`
      doc.setFont('OpenSans', 'bold')
      doc.setFontSize(THEME.fonts.bodySize)
      doc.setTextColor(THEME.colors.accent)
      doc.text(numberLabel, MARGIN, y, { baseline: 'top' })
      const numberWidth = doc.getTextWidth(`${numberLabel}  `)

      const titleX = MARGIN + numberWidth
      const pageLabel = `${entry.page}`
      doc.setFont('OpenSans', 'normal')
      const pageLabelWidth = doc.getTextWidth(pageLabel)
      const dotsEndX = PAGE_WIDTH - MARGIN - pageLabelWidth - 3

      doc.setTextColor(THEME.colors.primary)
      const maxTitleWidth = dotsEndX - titleX - 5
      const title = doc.splitTextToSize(entry.title, maxTitleWidth)[0]
      doc.text(title, titleX, y, { baseline: 'top' })
      const titleWidth = doc.getTextWidth(title)

      const dotsStartX = titleX + titleWidth + 2
      const dotWidth = doc.getTextWidth('.')
      let dots = ''
      if (dotsEndX > dotsStartX) {
        const count = Math.floor((dotsEndX - dotsStartX) / dotWidth)
        dots = '.'.repeat(Math.max(count, 0))
      }
      doc.setTextColor(THEME.colors.textMuted)
      doc.text(dots, dotsStartX, y, { baseline: 'top' })

      doc.setTextColor(THEME.colors.primary)
      doc.text(pageLabel, PAGE_WIDTH - MARGIN, y, { align: 'right', baseline: 'top' })

      y += 9
    })
  }

  // ========================================================================
  // CABEÇALHO CORRIDO
  // ========================================================================
  const addRunningHeader = (page: number, label: string) => {
    doc.setPage(page)
    doc.setFont('OpenSans', 'bold')
    doc.setFontSize(THEME.fonts.header)
    doc.setTextColor(THEME.colors.primary)
    doc.text(label, PAGE_WIDTH - MARGIN, THEME.layout.headerY, { align: 'right', baseline: 'top' })
  }

  // ========================================================================
  // ABERTURA DE UNIDADE
  // ========================================================================
  const renderUnitOpener = (unit: Unit, index: number): number => {
    doc.addPage()
    const openerPage = doc.getNumberOfPages()

    doc.setFillColor(THEME.colors.primary)
    doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F')

    doc.setDrawColor(THEME.colors.primaryDark)
    doc.setLineWidth(0.3)
    drawHexGrid(doc, PAGE_WIDTH - 85, -15, 9, 6, 9)

    let y = 50

    y = renderText(`UNIDADE ${index + 1}`, y, {
      fontSize: 11,
      fontStyle: 'bold',
      color: THEME.colors.accent,
    })
    y = addSpace(y, 4)

    y = renderText(unit.titulo, y, {
      fontSize: THEME.fonts.h1,
      fontStyle: 'bold',
      color: THEME.colors.white,
      maxWidth: CONTENT_WIDTH,
    })
    y = addSpace(y, 10)

    if (unit.descricao) {
      renderText(unit.descricao, y, {
        fontSize: 12,
        fontStyle: 'light',
        color: THEME.colors.white,
        maxWidth: CONTENT_WIDTH,
      })
    }

    doc.setDrawColor(THEME.colors.accent)
    doc.setLineWidth(0.8)
    doc.line(MARGIN, PAGE_HEIGHT - 40, MARGIN + 30, PAGE_HEIGHT - 40)

    return openerPage
  }

  // ========================================================================
  // ROTEADOR DE BLOCOS DE CONTEÚDO
  // ========================================================================
  const renderContentItem = (item: Block, y: number): number => {
    switch (item.tipo) {
      case 'titulo':
        return renderText(item.conteudo, y, {
          fontSize: THEME.fonts.h2,
          fontStyle: 'bold',
          color: THEME.colors.primary,
        })

      case 'subtitulo':
        return renderText(item.conteudo, y, {
          fontSize: THEME.fonts.h3,
          fontStyle: 'bold',
          color: THEME.colors.primary,
        })

      case 'imagem':
        return renderImageBox(item, y)

      case 'accordion':
        return renderAccordionBox(item.items || [], y)

      case 'flipcard':
        return renderFlipcards(item, y)

      case 'lista':
        return renderList(item.itensLista || [], item.tipoLista, y)

      case 'quiz':
        if (!item.quizData) {
          return renderText('Quiz sem dados configurados', y, {
            fontSize: THEME.fonts.bodySize,
            color: THEME.colors.textMuted,
          })
        }
        return renderQuizBox(item.quizData, y)

      case 'info-box': {
        const labels: Record<string, string> = {
          atencao: 'Atenção',
          saiba_mais: 'Saiba Mais',
          info: 'Informação',
          curiosidade: 'Curiosidade',
        }
        const title = item.tituloInfoBox || labels[item.tipoInfoBox || 'info'] || 'Saiba Mais'
        return renderBoxV2(
          y,
          (yPos) =>
            renderText(item.conteudo, yPos, {
              fontSize: THEME.fonts.bodySize,
              color: THEME.colors.text,
              x: MARGIN + THEME.layout.boxPadding,
              maxWidth: CONTENT_WIDTH - THEME.layout.boxPadding * 2,
              isHtml: true,
            }),
          THEME.layout.boxPadding,
          title
        )
      }

      case 'video':
        return renderBoxV2(
          y,
          (yPos) => {
            let boxY = renderText(item.videoTitulo || 'Vídeo', yPos, {
              fontSize: THEME.fonts.bodySize,
              fontStyle: 'bold',
              color: THEME.colors.primary,
              x: MARGIN + THEME.layout.boxPadding,
              maxWidth: CONTENT_WIDTH - THEME.layout.boxPadding * 2,
            })
            if (item.videoUrl) {
              boxY = addSpace(boxY, 2)
              if (!measuring) {
                doc.setFont('OpenSans', 'normal')
                doc.setFontSize(THEME.fonts.caption)
                doc.setTextColor(THEME.colors.accent)
                doc.textWithLink(item.videoUrl, MARGIN + THEME.layout.boxPadding, boxY, {
                  url: item.videoUrl,
                })
              }
              boxY += 5
            }
            return boxY
          },
          THEME.layout.boxPadding,
          'Vídeo disponível online'
        )

      case 'objetivos-aprendizagem':
        return renderBoxV2(
          y,
          (yPos) => {
            let boxY = yPos
            ;(item.itensObjetivos || []).forEach((objective, idx) => {
              boxY = checkPageBreak(boxY, 8)
              renderText(String(idx + 1).padStart(2, '0'), boxY, {
                fontSize: THEME.fonts.bodySize,
                fontStyle: 'bold',
                color: THEME.colors.accent,
                x: MARGIN + THEME.layout.boxPadding,
              })
              boxY = renderText(objective.texto, boxY, {
                fontSize: THEME.fonts.bodySize,
                color: THEME.colors.text,
                x: MARGIN + THEME.layout.boxPadding + 12,
                maxWidth: CONTENT_WIDTH - THEME.layout.boxPadding * 2 - 12,
                isHtml: true,
              })
              boxY = addSpace(boxY, 2)
            })
            return boxY
          },
          THEME.layout.boxPadding,
          'Objetivos de aprendizagem'
        )

      default: {
        const alignMap: Record<string, 'left' | 'center' | 'right' | 'justify'> = {
          esquerda: 'left',
          centro: 'center',
          direita: 'right',
          justificado: 'justify',
        }
        const customColor = item.corTexto && hexToRgb(item.corTexto) ? item.corTexto : undefined
        return renderText(item.conteudo, y, {
          fontSize: THEME.fonts.bodySize,
          align: item.alinhamento ? alignMap[item.alinhamento] || 'justify' : 'justify',
          color: customColor || THEME.colors.text,
          isHtml: true,
        })
      }
    }
  }

  // ========================================================================
  // BLOCOS ESPECÍFICOS
  // ========================================================================

  const renderImageBox = (item: Block, y: number): number => {
    const loaded = loadedImages.get(item.id)

    if (!loaded) {
      return renderBoxV2(y, (yPos) => {
        let boxY = yPos
        boxY = renderText(`[ Imagem: ${item.legenda || 'sem legenda'} ]`, boxY, {
          fontSize: THEME.fonts.bodySize,
          fontStyle: 'italic',
          align: 'center',
          color: THEME.colors.textMuted,
        })
        if (item.fonte) {
          boxY = renderText(`Fonte: ${item.fonte}`, boxY, {
            fontSize: THEME.fonts.caption,
            align: 'center',
            color: THEME.colors.textMuted,
          })
        }
        return boxY
      })
    }

    figureCounter++
    const widthRatio = item.tamanho === 'pequena' ? 0.5 : item.tamanho === 'media' ? 0.7 : 0.85
    let drawW = CONTENT_WIDTH * widthRatio
    let drawH = loaded.height * (drawW / loaded.width)

    const maxUsableH = PAGE_BREAK_Y - CONTENT_TOP
    if (drawH > maxUsableH) {
      drawH = maxUsableH
      drawW = loaded.width * (drawH / loaded.height)
    }

    const captionSpace = 16
    let newY = checkPageBreak(y, drawH + captionSpace)
    const x = MARGIN + (CONTENT_WIDTH - drawW) / 2

    doc.addImage(loaded.dataUrl, 'JPEG', x, newY, drawW, drawH)
    newY += drawH + 3

    if (item.legenda) {
      newY = renderText(`Figura ${figureCounter} – ${item.legenda}`, newY, {
        fontSize: THEME.fonts.caption,
        align: 'center',
        color: THEME.colors.textMuted,
      })
    }
    if (item.fonte) {
      newY = renderText(`Fonte: ${item.fonte}`, newY, {
        fontSize: THEME.fonts.caption,
        align: 'center',
        color: THEME.colors.textMuted,
      })
    }

    return newY
  }

  const renderList = (items: ListItem[], type: string = 'nao-ordenada', y: number): number => {
    let currentY = y
    const indent = 8

    items.forEach((item, index) => {
      currentY = checkPageBreak(currentY, 10)

      if (type === 'ordenada') {
        renderText(`${index + 1}.`, currentY, {
          fontSize: THEME.fonts.bodySize,
          fontStyle: 'bold',
          color: THEME.colors.accent,
          x: MARGIN,
        })
      } else {
        doc.setFillColor(THEME.colors.accent)
        doc.rect(MARGIN, currentY + 1.3, 1.8, 1.8, 'F')
      }

      currentY = renderText(item.texto, currentY, {
        fontSize: THEME.fonts.bodySize,
        color: THEME.colors.text,
        x: MARGIN + indent,
        maxWidth: CONTENT_WIDTH - indent,
        isHtml: true,
      })
      currentY = addSpace(currentY, 2)
    })

    return currentY
  }

  const renderAccordionBox = (items: AccordionItem[], y: number): number => {
    return renderBoxV2(y, (yPos) => {
      let boxY = yPos
      items.forEach((item, index) => {
        if (index > 0) {
          boxY = addSpace(boxY, 3)
        }
        boxY = renderText(item.titulo, boxY, {
          fontSize: THEME.fonts.h3,
          fontStyle: 'bold',
          color: THEME.colors.primary,
          x: MARGIN + THEME.layout.boxPadding,
          maxWidth: CONTENT_WIDTH - THEME.layout.boxPadding * 2,
        })
        boxY = addSpace(boxY, 2)
        boxY = renderText(item.conteudo, boxY, {
          fontSize: THEME.fonts.bodySize,
          color: THEME.colors.text,
          x: MARGIN + THEME.layout.boxPadding,
          maxWidth: CONTENT_WIDTH - THEME.layout.boxPadding * 2,
          isHtml: true,
        })
        boxY = addSpace(boxY, 4)
      })
      return boxY
    })
  }

  const renderFlipcards = (item: Block, y: number): number => {
    const cards = cardsFlipcard(item)
    if (cards.length === 0) return y
    return cards.reduce((currentY, card) => renderFlipcardBox(card, currentY), y)
  }

  const renderFlipcardBox = (card: FlipcardItem, y: number): number => {
    const frontText = card.tituloFrente || ''
    const backText = card.conteudoVerso || ''
    const shortEnough = frontText.split(/\s+/).length < 40 && backText.split(/\s+/).length < 40

    return renderBoxV2(y, (yPos) => {
      const padding = THEME.layout.boxPadding

      if (shortEnough) {
        const gap = 6
        const colWidth = (CONTENT_WIDTH - padding * 2 - gap) / 2
        const leftX = MARGIN + padding
        const rightX = leftX + colWidth + gap

        let leftY = renderText('FRENTE', yPos, {
          fontSize: THEME.fonts.caption,
          fontStyle: 'bold',
          color: THEME.colors.accent,
          x: leftX,
        })
        leftY = renderText(frontText, leftY, {
          fontSize: THEME.fonts.bodySize,
          color: THEME.colors.text,
          x: leftX,
          maxWidth: colWidth,
          isHtml: true,
        })

        let rightY = renderText('VERSO', yPos, {
          fontSize: THEME.fonts.caption,
          fontStyle: 'bold',
          color: THEME.colors.accent,
          x: rightX,
        })
        rightY = renderText(backText, rightY, {
          fontSize: THEME.fonts.bodySize,
          color: THEME.colors.text,
          x: rightX,
          maxWidth: colWidth,
          isHtml: true,
        })

        return Math.max(leftY, rightY)
      }

      let boxY = yPos
      boxY = renderText('FRENTE', boxY, {
        fontSize: THEME.fonts.caption,
        fontStyle: 'bold',
        color: THEME.colors.accent,
        x: MARGIN + padding,
      })
      boxY = renderText(frontText, boxY, {
        fontSize: THEME.fonts.bodySize,
        color: THEME.colors.text,
        x: MARGIN + padding,
        maxWidth: CONTENT_WIDTH - padding * 2,
        isHtml: true,
      })
      boxY = addSpace(boxY, 4)
      boxY = renderText('VERSO', boxY, {
        fontSize: THEME.fonts.caption,
        fontStyle: 'bold',
        color: THEME.colors.accent,
        x: MARGIN + padding,
      })
      boxY = renderText(backText, boxY, {
        fontSize: THEME.fonts.bodySize,
        color: THEME.colors.text,
        x: MARGIN + padding,
        maxWidth: CONTENT_WIDTH - padding * 2,
        isHtml: true,
      })
      return boxY
    })
  }

  const renderQuizBox = (quiz: QuizData, y: number): number => {
    return renderBoxV2(
      y,
      (yPos) => {
        let boxY = yPos
        quiz.questions?.forEach((question, qIdx) => {
          boxY = checkPageBreak(boxY, 25)

          boxY = renderText(`${qIdx + 1}. ${question.pergunta}`, boxY, {
            fontSize: THEME.fonts.h3,
            fontStyle: 'bold',
            color: THEME.colors.primary,
          })
          boxY = addSpace(boxY, 2)

          question.opcoes.forEach((option, oIdx) => {
            const letter = String.fromCharCode(65 + oIdx)
            boxY = checkPageBreak(boxY, 8)
            renderText(`${letter})`, boxY, {
              fontSize: THEME.fonts.bodySize,
              fontStyle: 'bold',
              color: THEME.colors.accent,
              x: MARGIN + 4,
            })
            boxY = renderText(option.texto, boxY, {
              fontSize: THEME.fonts.bodySize,
              color: THEME.colors.text,
              x: MARGIN + 12,
              maxWidth: CONTENT_WIDTH - 12,
            })
          })

          if (question.dica) {
            boxY = addSpace(boxY, 1)
            boxY = renderText(`Dica: ${question.dica}`, boxY, {
              fontSize: THEME.fonts.caption,
              fontStyle: 'italic',
              color: THEME.colors.textMuted,
            })
          }

          if (!measuring) {
            const correctIdx = question.opcoes.findIndex((o) => o.isCorrect)
            quizAnswerKey.push({
              question: `Questão ${qIdx + 1}`,
              answer: correctIdx >= 0 ? String.fromCharCode(65 + correctIdx) : '-',
            })
          }

          boxY = addSpace(boxY, 6)
        })
        return boxY
      },
      THEME.layout.boxPadding,
      'Atividade: Quiz'
    )
  }

  const renderAnswerKey = (items: AnswerKeyEntry[], y: number): number => {
    let newY = addSeparator(y)
    newY = renderText('Gabarito', newY, {
      fontSize: THEME.fonts.h3,
      fontStyle: 'bold',
      color: THEME.colors.primary,
    })
    newY = addSpace(newY, 3)
    items.forEach((g) => {
      newY = renderText(`${g.question} — alternativa ${g.answer}`, newY, {
        fontSize: THEME.fonts.caption,
        color: THEME.colors.textMuted,
      })
    })
    return newY
  }

  // ========================================================================
  // INÍCIO DA EXECUÇÃO
  // ========================================================================

  const units = course.unidades || []

  renderCoverPage()
  renderTitlePage()
  renderCreditsPage()
  reserveTocPage(units.length)

  const tocEntries: TocEntry[] = []

  units.forEach((unit, index) => {
    quizAnswerKey = []
    const openerPage = renderUnitOpener(unit, index)
    tocEntries.push({ title: unit.titulo, page: openerPage })

    doc.addPage()
    let y: number = CONTENT_TOP

    ;(unit.conteudo || [])
      .slice()
      .sort((a, b) => a.ordem - b.ordem)
      .forEach((item) => {
        y = renderContentItem(item, y)
        y = addSpace(y, 5)
      })

    if (quizAnswerKey.length > 0) {
      renderAnswerKey(quizAnswerKey, y)
    }
  })

  fillTocPage(tocEntries)

  const totalPages = doc.getNumberOfPages()
  const openerPages = new Set(tocEntries.map((entry) => entry.page))
  const firstContentPage = tocEntries[0]?.page ?? totalPages + 1
  for (let p = firstContentPage; p <= totalPages; p++) {
    if (openerPages.has(p)) continue // página de abertura já tem seu próprio rótulo de unidade
    let unitIdx = 0
    for (let i = 0; i < tocEntries.length; i++) {
      if (tocEntries[i].page <= p) unitIdx = i
    }
    addRunningHeader(p, `UNIDADE ${unitIdx + 1}   ${p}`)
  }

  let fileName: string
  if (filename) {
    fileName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`
  } else {
    fileName = `${(course.titulo || 'curso').replace(/[^a-z0-9]/gi, '_')}.pdf`
  }
  doc.save(fileName)
}
