import jsPDF from 'jspdf';
import type { ConteudoUnidade, AccordionItem, ListaItem, QuizData, Unidade, CursoGerado } from '@/types/gerador-curso';

type Curso = CursoGerado; 

// ========================================================================
// 🎨 CENTRAL DE DESIGN (THEME)
// ========================================================================
const THEME = {
  colors: {
    primary: [37, 99, 235],    // blue-600
    text: [31, 41, 55],        // gray-800
    textMuted: [107, 114, 128],  // gray-500
    textLight: [255, 255, 255], // white
    background: [252, 253, 254], // Quase branco
    border: [229, 231, 235],   // gray-200
  },
  fonts: {
    h1: { size: 24, style: 'bold' },
    h2: { size: 18, style: 'bold' },
    h3: { size: 16, style: 'bold' },
    h4: { size: 14, style: 'bold' },
    body: { size: 11, style: 'normal' },
    bodyLg: { size: 12, style: 'normal' },
    caption: { size: 10, style: 'italic' },
    list: { size: 11, style: 'normal' },
  },
  layout: {
    margin: 20,
    footerHeight: 20,
    lineHeight: 1.5, // Multiplicador do tamanho da fonte
    boxPadding: 5,   // Padding interno para caixas
  }
};

// Constantes de layout (em mm)
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = THEME.layout.margin;
const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);
const FOOTER_HEIGHT = THEME.layout.footerHeight;
const PAGE_BREAK_Y = PAGE_HEIGHT - MARGIN - FOOTER_HEIGHT;

/**
 * Função principal para gerar o PDF
 */
export async function generateCoursePDF(curso: Curso, filename?: string): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let currentPage = 1;

  // ========================================================================
  // FUNÇÕES HELPER DE RENDERIZAÇÃO
  // ========================================================================

  /** Adiciona rodapé com número da página */
  const addFooter = (page: number, total: number) => {
    doc.setPage(page);
    doc.setFont(THEME.fonts.caption.style);
    doc.setFontSize(THEME.fonts.caption.size - 1);
    doc.setTextColor(THEME.colors.textMuted[0], THEME.colors.textMuted[1], THEME.colors.textMuted[2]);
    
    // Linha
    doc.setDrawColor(THEME.colors.border[0], THEME.colors.border[1], THEME.colors.border[2]);
    doc.line(MARGIN, PAGE_HEIGHT - FOOTER_HEIGHT, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - FOOTER_HEIGHT);
    
    // Texto
    doc.text(
      `Página ${page} de ${total}`,
      PAGE_WIDTH / 2,
      PAGE_HEIGHT - (FOOTER_HEIGHT / 2),
      { align: 'center', baseline: 'middle' }
    );
  };

  /** Verifica se precisa de uma nova página e a adiciona se necessário */
  const checkPageBreak = (y: number, requiredSpace: number = 20): number => {
    if (y + requiredSpace > PAGE_BREAK_Y) {
      doc.addPage();
      currentPage++;
      return MARGIN; // Retorna a nova posição Y
    }
    return y; // Retorna a posição Y atual
  };

  /** Adiciona um espaço vertical */
  const addSpace = (y: number, space: number = 5): number => {
    return checkPageBreak(y, space) + space;
  };
  
  /** Adiciona uma linha separadora */
  const addSeparator = (y: number): number => {
    let newY = checkPageBreak(y, 10);
    newY = addSpace(newY, 5);
    doc.setDrawColor(THEME.colors.border[0], THEME.colors.border[1], THEME.colors.border[2]);
    doc.line(MARGIN, newY, PAGE_WIDTH - MARGIN, newY);
    return addSpace(newY, 5);
  };

  /**
   * A "workhorse" function. Renders text with wrapping, styling, and page breaks.
   * Retorna a nova posição Y após o texto ser adicionado.
   */
  const renderText = (
    text: string,
    y: number,
    options: {
      fontSize?: number;
      fontStyle?: 'normal' | 'bold' | 'italic';
      color?: number[];
      align?: 'left' | 'center' | 'right' | 'justify';
      x?: number;
      maxWidth?: number;
      isHtml?: boolean;
    } = {}
  ): number => {
    // Padrões
    const fontSize = options.fontSize || THEME.fonts.body.size;
    const fontStyle = options.fontStyle || THEME.fonts.body.style;
    const color = options.color || THEME.colors.text; // Garante que a cor padrão seja TEXT
    const align = options.align || 'left';
    const x = options.x || MARGIN;
    const maxWidth = options.maxWidth || CONTENT_WIDTH - (x - MARGIN);
    
    const cleanText = options.isHtml ? cleanHtml(text) : text;
    
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    doc.setTextColor(color[0], color[1], color[2]);

    const lines = doc.splitTextToSize(cleanText, maxWidth);
    const lineHeight = fontSize * THEME.layout.lineHeight * 0.352778; // Converte pt->mm
    
    let currentY = y;
    
    lines.forEach((line: string) => {
      currentY = checkPageBreak(currentY, lineHeight); // Verifica para cada linha
      
      let xPos = x;
      if (align === 'center') {
        xPos = x + maxWidth / 2;
      } else if (align === 'right') {
        xPos = x + maxWidth;
      }

      doc.text(line, xPos, currentY, { align, baseline: 'top' });
      currentY += lineHeight;
    });

    return currentY;
  };
  
  /** Desenha uma caixa de fundo para destacar conteúdo */
  const renderBox = (
    y: number,
    renderContentCallback: (y: number) => number, // Callback que desenha o conteúdo
    padding: number = THEME.layout.boxPadding
  ): number => {
    let newY = checkPageBreak(y, 20); // Checa espaço para a caixa
    
    const startY = newY;
    
    // Renderiza o conteúdo "falsamente" para medir a altura
    let contentEndY = renderContentCallback(startY + padding);
    const boxHeight = (contentEndY - startY);

    // Checa se a caixa inteira cabe
    if (startY + boxHeight + padding * 2 > PAGE_BREAK_Y) { // Adicionado padding * 2 na checagem
      newY = checkPageBreak(startY, boxHeight + padding * 2); // Força quebra de página
    }
    
    // Desenha a caixa de fundo
    doc.setFillColor(THEME.colors.background[0], THEME.colors.background[1], THEME.colors.background[2]);
    doc.rect(MARGIN, newY, CONTENT_WIDTH, boxHeight + padding * 2, 'F'); // Adicionado padding * 2 na altura do retângulo
    
    // Redesenha o conteúdo na posição correta da caixa
    contentEndY = renderContentCallback(newY + padding);

    return contentEndY + padding; // Retorna Y após o conteúdo + padding inferior
  };

  /** Limpa tags HTML básicas para texto plano */
  const cleanHtml = (text: string): string => {
    return text
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  };

  // ========================================================================
  // FUNÇÕES DE RENDERIZAÇÃO DE PÁGINA
  // ========================================================================

  /** Renderiza a Página de Capa (Layout Dividido) */
  const renderCoverPage = () => {
    // Barra lateral azul
    doc.setFillColor(THEME.colors.primary[0], THEME.colors.primary[1], THEME.colors.primary[2]);
    const sidebarWidth = 70; // 70mm
    doc.rect(0, 0, sidebarWidth, PAGE_HEIGHT, 'F');

    // Área de conteúdo branca
    let y = 60;
    const contentMarginLeft = sidebarWidth + 15;
    const contentCoverWidth = PAGE_WIDTH - contentMarginLeft - MARGIN;

    // Título
    y = renderText(curso.titulo || 'Curso', y, {
      ...THEME.fonts.h1,
      fontSize: 32, // Maior na capa
      fontStyle: 'bold', // <<< MUDANÇA AQUI (Garantindo o negrito)
      color: THEME.colors.text,
      x: contentMarginLeft,
      maxWidth: contentCoverWidth,
    });

    // Descrição
    y = addSpace(y, 8);
    y = renderText(curso.descricao || '', y, {
      ...THEME.fonts.bodyLg,
      color: THEME.colors.textMuted,
      x: contentMarginLeft,
      maxWidth: contentCoverWidth,
    });
    
    // Linha
    y = addSpace(y, 10);
    doc.setDrawColor(THEME.colors.primary[0], THEME.colors.primary[1], THEME.colors.primary[2]);
    doc.setLineWidth(1);
    doc.line(contentMarginLeft, y, contentMarginLeft + (contentCoverWidth * 0.5), y);
    y = addSpace(y, 10);

    // Infos (em caixa)
    const renderInfosContent = (yPos: number) => {
      let infoY = yPos;
      const infos = [
        { label: 'Categoria', value: curso.categoria || 'N/A' },
        { label: 'Carga Horária', value: curso.cargaHoraria || 'N/A' },
        { label: 'Modalidade', value: curso.modalidade || 'N/A' },
      ];
      
      infos.forEach((info) => {
        let tempY = renderText(`${info.label}:`, infoY, {
          ...THEME.fonts.body,
          fontStyle: 'bold',
          color: THEME.colors.textMuted,
          x: contentMarginLeft + THEME.layout.boxPadding
        });
        
        renderText(info.value, infoY, {
          ...THEME.fonts.body,
          fontStyle: 'bold',
          color: THEME.colors.primary,
          x: contentMarginLeft + 35 + THEME.layout.boxPadding
        });
        infoY = tempY; // Avança para a próxima linha
      });
      return infoY;
    }
    
    // Renderiza as infos dentro de uma caixa
    renderBox(
      y, 
      (yPos) => renderInfosContent(yPos), 
      THEME.layout.boxPadding
    );
  };

  /** Renderiza a Página de Índice */
  const renderIndexPage = (unidades: Unidade[] = []) => {
    doc.addPage();
    currentPage++;
    let y = MARGIN;

    // Título "Índice"
    y = renderText('Índice', y, { ...THEME.fonts.h1, color: THEME.colors.primary });
    y = addSeparator(y);
    y = addSpace(y, 10);

    unidades.forEach((unidade, index) => {
      y = checkPageBreak(y, 20); // Checa espaço para cada item

      // Título da Unidade
      const titleY = renderText(`${index + 1}. ${unidade.titulo}`, y, {
        ...THEME.fonts.h3,
        fontSize: 14,
        color: THEME.colors.text,
      });

      // Descrição (preview)
      const descPreview = unidade.descricao?.substring(0, 120) + (unidade.descricao && unidade.descricao.length > 120 ? '...' : '');
      const descY = renderText(descPreview || '', titleY, {
        ...THEME.fonts.caption,
        color: THEME.colors.textMuted,
        x: MARGIN + 8, // Leve indentação
        maxWidth: CONTENT_WIDTH - 8,
      });
      
      y = addSpace(descY, 8);
    });
  };

  /** Renderiza todas as páginas de unidades e seus conteúdos */
  const renderUnitPages = (unidades: Unidade[] = []) => {
    unidades.forEach((unidade, unidadeIndex) => {
      doc.addPage();
      currentPage++;
      let y = 0; // Y começa no 0 para o cabeçalho

      // Cabeçalho da Unidade
      doc.setFillColor(THEME.colors.primary[0], THEME.colors.primary[1], THEME.colors.primary[2]);
      const headerHeight = 45; // <<< MUDANÇA AQUI (aumentado de 40 para 45)
      doc.rect(0, 0, PAGE_WIDTH, headerHeight, 'F');
      
      y = 15;
      renderText(`Unidade ${unidadeIndex + 1}`, y, {
        ...THEME.fonts.body,
        color: THEME.colors.textLight,
        x: MARGIN
      });
      
      y = renderText(unidade.titulo, 23, { // <<< MUDANÇA AQUI (y de 22 para 23)
        ...THEME.fonts.h2,
        fontSize: 22, // <<< MUDANÇA AQUI (aumentado de 18 para 22)
        color: THEME.colors.textLight,
        x: MARGIN,
        maxWidth: CONTENT_WIDTH
      });

      // Início do conteúdo
      y = headerHeight + 10; // <<< MUDANÇA AQUI (de 50 para 55, para alinhar com headerHeight)

      // Descrição da Unidade (em uma caixa)
      if (unidade.descricao) {
        y = renderBox(
          y,
          (yPos) => renderText(unidade.descricao, yPos, {
            ...THEME.fonts.body,
            fontStyle: 'italic',
            color: THEME.colors.textMuted,
          }),
          8 // Mais padding
        );
        y = addSpace(y, 5);
      }
      
      y = addSeparator(y);

      // Renderiza o conteúdo da unidade
      unidade.conteudo
        .sort((a, b) => a.ordem - b.ordem) // Garante a ordem
        .forEach((item) => {
          y = renderContentItem(item, y);
          y = addSpace(y, 5); // Espaço padrão entre elementos
        });
    });
  };

  /**
   * Função "roteadora" que renderiza um item de conteúdo específico
   * e retorna a nova posição Y.
   */
  const renderContentItem = (item: ConteudoUnidade, y: number): number => {
    switch (item.tipo) {
      case 'titulo':
        return renderText(item.conteudo, y, { ...THEME.fonts.h3, color: THEME.colors.text });

      case 'subtitulo':
        return renderText(item.conteudo, y, { ...THEME.fonts.h4, color: THEME.colors.text });

      case 'imagem':
        return renderImageBox(item, y);

      case 'accordion':
        return renderAccordionBox(item.items || [], y);

      case 'flipcard':
        return renderFlipcardBox(item, y);

      case 'lista':
        return renderList(item.itensLista || [], item.tipoLista, y);

      case 'quiz':
        return renderQuizBox(item.quizData, y);

      default: // Parágrafo
        return renderText(item.conteudo, y, {
          ...THEME.fonts.body,
          align: item.alinhamento || 'left',
          color: item.corTexto ? item.corTexto.split(',').map(Number) : THEME.colors.text, 
          isHtml: true,
        });
    }
  };

  // ========================================================================
  // FUNÇÕES DE RENDERIZAÇÃO DE CONTEÚDO (Item Específico)
  // ========================================================================

  const renderImageBox = (item: ConteudoUnidade, y: number): number => {
    return renderBox(y, (yPos) => {
      let boxY = yPos;
      if (item.fonte) {
        boxY = renderText(`Fonte: ${item.fonte}`, boxY, {
          ...THEME.fonts.caption,
          color: THEME.colors.textMuted
        });
      }
      
      boxY = renderText(`[ Imagem: ${item.legenda || 'sem legenda'} ]`, boxY, {
        ...THEME.fonts.body,
        fontStyle: 'italic',
        align: 'center',
        color: THEME.colors.textMuted
      });
      
      if (item.legenda) {
        boxY = renderText(item.legenda, boxY, {
          ...THEME.fonts.caption,
          align: 'center',
          color: THEME.colors.textMuted
        });
      }
      return boxY;
    });
  };

  const renderList = (items: ListaItem[], type: string = 'nao-ordenada', y: number): number => {
    let currentY = y;
    const itemIndent = MARGIN + 5;
    const itemMaxWidth = CONTENT_WIDTH - 5;

    items.forEach((item, index) => {
      const prefix = type === 'ordenada' ? `${index + 1}. ` : '• ';
      
      currentY = checkPageBreak(currentY, 10);
      
      // Renderiza o prefixo
      renderText(prefix, currentY, {
        ...THEME.fonts.list,
        fontStyle: 'bold',
        color: THEME.colors.primary,
        x: MARGIN,
      });

      // Renderiza o texto
      currentY = renderText(item.texto, currentY, {
        ...THEME.fonts.list,
        color: THEME.colors.text,
        x: itemIndent,
        maxWidth: itemMaxWidth,
      });
      currentY = addSpace(currentY, 2); // Espaço entre itens
    });
    return currentY;
  };
  
  const renderAccordionBox = (items: AccordionItem[], y: number): number => {
    return renderBox(y, (yPos) => {
      let boxY = yPos;
      items.forEach((item, index) => {
        if (index > 0) {
          boxY = addSpace(boxY, 3);
        }
        // Título
        boxY = renderText(item.titulo, boxY, {
          ...THEME.fonts.body,
          fontStyle: 'bold',
          color: THEME.colors.primary,
        });
        // Conteúdo
        boxY = renderText(item.conteudo, boxY, {
          ...THEME.fonts.body,
          color: THEME.colors.text,
          isHtml: true,
        });
      });
      return boxY;
    });
  };
  
  const renderFlipcardBox = (item: ConteudoUnidade, y: number): number => {
     return renderBox(y, (yPos) => {
      let boxY = yPos;
      
      // Frente
      let frenteTitle = item.tituloFrente || '';
      if (item.tipoFrente?.includes('imagem')) {
        frenteTitle += ' [Imagem]';
      }
      
      boxY = renderText(frenteTitle, boxY, {
        ...THEME.fonts.body,
        fontStyle: 'bold',
        color: THEME.colors.primary,
      });
      
      boxY = addSpace(boxY, 3);

      // Verso
      boxY = renderText(item.conteudoVerso || '', boxY, {
        ...THEME.fonts.body,
        color: THEME.colors.text,
        isHtml: true,
      });
      return boxY;
    });
  };

  const renderQuizBox = (quiz: QuizData, y: number): number => {
    return renderBox(y, (yPos) => {
      let boxY = yPos;

      boxY = renderText("📝 Atividade: Quiz", boxY, {
        ...THEME.fonts.h4,
        color: THEME.colors.primary
      });
      boxY = addSpace(boxY, 5);

      quiz.questions?.forEach((question, qIdx) => {
        boxY = checkPageBreak(boxY, 25);
        
        // Pergunta
        boxY = renderText(`Pergunta ${qIdx + 1}: ${question.pergunta}`, boxY, {
          ...THEME.fonts.bodyLg,
          fontStyle: 'bold',
          color: THEME.colors.text,
        });
        boxY = addSpace(boxY, 3);
        
        // Dica
        if (question.dica) {
          boxY = renderText(`💡 Dica: ${question.dica}`, boxY, {
            ...THEME.fonts.caption,
            color: THEME.colors.textMuted
          });
          boxY = addSpace(boxY, 3);
        }

        // Opções
        question.opcoes.forEach((opcao, oIdx) => {
          const letter = String.fromCharCode(65 + oIdx);
          const optionText = `${letter}) ${opcao.texto}`;
          
          boxY = renderText(optionText, boxY, {
            ...THEME.fonts.body,
            color: THEME.colors.text,
            x: MARGIN + 5, // Indentação
            maxWidth: CONTENT_WIDTH - 10
          });
        });
        boxY = addSpace(boxY, 8); // Espaço entre perguntas
      });
      return boxY;
    });
  };

  // ========================================================================
  // INÍCIO DA EXECUÇÃO
  // ========================================================================

  const unidades = curso.unidades || [];

  // 1. Renderizar Capa
  renderCoverPage();

  // 2. Renderizar Índice
  if (unidades.length > 0) {
    renderIndexPage(unidades);
  }

  // 3. Renderizar Páginas de Unidade
  if (unidades.length > 0) {
    renderUnitPages(unidades);
  }

  // 4. Adicionar Rodapés
  const totalPages = doc.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) { // Começa do 2 (pós-capa)
    addFooter(i, totalPages - 1); // Total de páginas é -1 (sem contar capa)
  }

  // 5. Salvar o PDF
  let fileName: string;
  if (filename) {
    fileName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  } else {
    fileName = `${(curso.titulo || 'curso').replace(/[^a-z0-9]/gi, '_')}.pdf`;
  }
  doc.save(fileName);
}2024