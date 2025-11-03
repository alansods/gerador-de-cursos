import jsPDF from 'jspdf';
import type { ConteudoUnidade, AccordionItem, ListaItem, QuizData } from '@/types/gerador-curso';

interface Curso {
  titulo: string;
  descricao: string;
  categoria: string;
  cargaHoraria: string;
  modalidade: string;
  unidades?: Unidade[];
}

interface Unidade {
  id: string;
  titulo: string;
  descricao: string;
  conteudo: ConteudoUnidade[];
}

export async function generateCoursePDF(curso: Curso, filename?: string): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  const footerHeight = 15;
  let yPosition = margin;

  // Função para adicionar rodapé em uma página
  const addFooter = (pageNumber: number, totalPages: number) => {
    doc.setPage(pageNumber);
    
    // Linha separadora
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, pageHeight - footerHeight, pageWidth - margin, pageHeight - footerHeight);
    
    // Número da página
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Página ${pageNumber} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  };

  // Função para adicionar nova página se necessário
  const checkPageBreak = (requiredSpace: number = 20) => {
    if (yPosition + requiredSpace > pageHeight - footerHeight - margin) {
      const currentPage = doc.getCurrentPageInfo().pageNumber;
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Função para adicionar texto com quebra de linha
  const addText = (text: string, fontSize: number, fontStyle: 'normal' | 'bold' | 'italic' = 'normal', align: 'left' | 'center' | 'right' = 'left', color: number[] = [0, 0, 0]) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    doc.setTextColor(color[0], color[1], color[2]);
    
    const lines = doc.splitTextToSize(text, contentWidth);
    
    lines.forEach((line: string) => {
      checkPageBreak();
      
      let xPosition = margin;
      if (align === 'center') {
        xPosition = pageWidth / 2;
      } else if (align === 'right') {
        xPosition = pageWidth - margin;
      }
      
      doc.text(line, xPosition, yPosition, { align });
      yPosition += fontSize * 0.5;
    });
    
    yPosition += 3;
  };

  // Função para limpar HTML
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

  // =============== CAPA MODERNA ===============
  // Gradiente de fundo (simulação com retângulos)
  doc.setFillColor(37, 99, 235); // Blue-600
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Elementos decorativos (usando ellipse para círculos)
  doc.setFillColor(59, 130, 246); // Blue-500
  doc.ellipse(pageWidth * 0.8, 40, 30, 30, 'F');
  doc.ellipse(pageWidth * 0.15, pageHeight - 50, 40, 40, 'F');
  
  // Título do curso (com destaque)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(curso.titulo || 'Curso', contentWidth);
  let titleY = 60;
  titleLines.forEach((line: string) => {
    doc.text(line, pageWidth / 2, titleY, { align: 'center' });
    titleY += 12;
  });

  // Linha decorativa
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(2);
  doc.line(pageWidth * 0.2, titleY + 5, pageWidth * 0.8, titleY + 5);
  yPosition = titleY + 15;

  // Descrição (branca)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  const descLines = doc.splitTextToSize(curso.descricao || '', contentWidth * 0.8);
  descLines.forEach((line: string) => {
    doc.text(line, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 7;
  });

  // Card de informações
  yPosition += 20;
  const cardHeight = 45;
  const cardY = yPosition;
  
  // Fundo branco
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, cardY, contentWidth, cardHeight, 'F');
  
  // Borda do card
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.rect(margin, cardY, contentWidth, cardHeight);
  
  // Informações dentro do card
  doc.setTextColor(37, 99, 235);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  let infoY = cardY + 10;
  
  const infos = [
    { label: 'Categoria', value: curso.categoria || 'N/A' },
    { label: 'Carga Horária', value: curso.cargaHoraria || 'N/A' },
    { label: 'Modalidade', value: curso.modalidade || 'N/A' },
  ];
  
  infos.forEach((info, index) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text(`${info.label}:`, margin + 10, infoY + (index * 12));
    
    doc.setFontSize(11);
    doc.setTextColor(37, 99, 235);
    doc.text(info.value, margin + 45, infoY + (index * 12));
  });

  // Capa não tem rodapé/paginação

  // =============== ÍNDICE ===============
  doc.addPage();
  yPosition = margin;
  
  // Título do índice com estilo
  doc.setFillColor(249, 250, 251); // gray-50
  doc.rect(0, 0, pageWidth, 30, 'F');
  
  doc.setTextColor(37, 99, 235);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Índice', margin, 20);
  
  // Linha decorativa
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(2);
  doc.line(margin, 22, margin + 40, 22);
  
  yPosition = 35;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  const unidades = curso.unidades || [];
  
  unidades.forEach((unidade, index) => {
    checkPageBreak(20);
    
    // Número da unidade (apenas número, sem círculo)
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(String(index + 1) + '.', margin, yPosition);
    
    // Título da unidade
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(unidade.titulo, margin + 8, yPosition);
    
    yPosition += 8;
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const descPreview = unidade.descricao?.substring(0, 90) + (unidade.descricao && unidade.descricao.length > 90 ? '...' : '');
    doc.text(descPreview || '', margin + 15, yPosition);
    yPosition += 12;
  });

  // Índice não tem rodapé ainda, será adicionado depois quando soubermos o total de páginas

  // =============== UNIDADES ===============
  unidades.forEach((unidade, unidadeIndex) => {
    doc.addPage();
    yPosition = margin;
    
    // Cabeçalho da unidade com estilo moderno
    doc.setFillColor(37, 99, 235); // blue-600
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    // Elemento decorativo
    doc.setFillColor(59, 130, 246);
    doc.ellipse(pageWidth * 0.9, 22, 15, 15, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Unidade ${unidadeIndex + 1}`, margin, 15);
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const unitTitleLines = doc.splitTextToSize(unidade.titulo, contentWidth);
    let unitTitleY = 28;
    unitTitleLines.forEach((line: string) => {
      doc.text(line, margin, unitTitleY);
      unitTitleY += 8;
    });
    
    yPosition = 55;
    doc.setTextColor(0, 0, 0);
    
      // Descrição da unidade
    if (unidade.descricao) {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, yPosition, contentWidth, 20, 'F');
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      
      const descLines = doc.splitTextToSize(unidade.descricao, contentWidth - 10);
      let descY = yPosition + 8;
      descLines.forEach((line: string) => {
        checkPageBreak();
        doc.text(line, margin + 5, descY);
        descY += 6;
      });
      
      yPosition = descY + 5;
    }
    
    // Linha separadora
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;
    
    // Conteúdo da unidade
    unidade.conteudo.forEach((item) => {
      checkPageBreak(20);
      
      if (item.tipo === 'titulo') {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 41, 55); // gray-800
        
        const lines = doc.splitTextToSize(item.conteudo, contentWidth);
        lines.forEach((line: string) => {
          checkPageBreak();
          doc.text(line, margin, yPosition);
          yPosition += 9;
        });
        yPosition += 3;
        
      } else if (item.tipo === 'subtitulo') {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(55, 65, 81); // gray-700
        
        const lines = doc.splitTextToSize(item.conteudo, contentWidth);
        lines.forEach((line: string) => {
          checkPageBreak();
          doc.text(line, margin, yPosition);
          yPosition += 8;
        });
        yPosition += 2;
        
      } else if (item.tipo === 'imagem') {
        if (item.fonte) {
          doc.setFontSize(8);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(107, 114, 128);
          doc.text(`Fonte: ${item.fonte}`, margin, yPosition);
          yPosition += 5;
        }
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`[Imagem: ${item.legenda || 'sem legenda'}]`, margin, yPosition);
        yPosition += 5;
        
        if (item.legenda) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'italic');
          doc.text(item.legenda, margin, yPosition);
          yPosition += 5;
        }
        yPosition += 5;
        
      } else if (item.tipo === 'accordion' && item.items) {
        // Accordion como texto normal
        item.items.forEach((accordionItem: AccordionItem, idx: number) => {
          checkPageBreak(15);
          
          // Título do item como subtítulo
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(31, 41, 55);
          doc.text(`${accordionItem.titulo}`, margin, yPosition);
          yPosition += 7;
          
          // Conteúdo do item como parágrafo normal
          doc.setFontSize(11);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(55, 65, 81);
          const contentLines = doc.splitTextToSize(cleanHtml(accordionItem.conteudo), contentWidth);
          contentLines.forEach((line: string) => {
            checkPageBreak();
            doc.text(line, margin, yPosition);
            yPosition += 5.5;
          });
          yPosition += 3;
        });
        
      } else if (item.tipo === 'flipcard') {
        // Flipcard como texto normal
        checkPageBreak(20);
        
        // Frente
        if (item.tipoFrente === 'titulo' && item.tituloFrente) {
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(31, 41, 55);
          doc.text(item.tituloFrente, margin, yPosition);
          yPosition += 7;
        } else if (item.tipoFrente === 'imagem-titulo' || item.tipoFrente === 'imagem') {
          if (item.tituloFrente) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(31, 41, 55);
            doc.text(item.tituloFrente, margin, yPosition);
            yPosition += 7;
          }
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 100, 100);
          doc.text('[Imagem]', margin, yPosition);
          yPosition += 6;
        }
        
        // Verso
        if (item.conteudoVerso) {
          doc.setFontSize(11);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(55, 65, 81);
          const versoLines = doc.splitTextToSize(cleanHtml(item.conteudoVerso), contentWidth);
          versoLines.forEach((line: string) => {
            checkPageBreak();
            doc.text(line, margin, yPosition);
            yPosition += 5.5;
          });
          yPosition += 3;
        }
        
      } else if (item.tipo === 'lista' && item.itensLista) {
        // Lista normal como em qualquer documento
        item.itensLista.forEach((listaItem: ListaItem, idx: number) => {
          checkPageBreak(10);
          
          doc.setFontSize(11);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(55, 65, 81);
          
          let prefix = '';
          if (item.tipoLista === 'ordenada') {
            prefix = `${idx + 1}. `;
          } else {
            prefix = '• ';
          }
          
          const textLines = doc.splitTextToSize(listaItem.texto, contentWidth - 8);
          textLines.forEach((line: string, lineIdx: number) => {
            checkPageBreak();
            const prefixToUse = lineIdx === 0 ? prefix : '   ';
            doc.text(prefixToUse + line, margin, yPosition);
            yPosition += 5.5;
          });
          
          yPosition += 1;
        });
        
      } else if (item.tipo === 'quiz' && item.quizData) {
        // Quiz como texto normal
        item.quizData.questions?.forEach((question, qIdx: number) => {
          checkPageBreak(25);
          
          // Pergunta
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(31, 41, 55);
          doc.text(`Pergunta ${qIdx + 1}: ${question.pergunta}`, margin, yPosition);
          yPosition += 8;
          
          // Dica (se houver)
          if (question.dica) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(100, 100, 100);
            doc.text(`Dica: ${question.dica}`, margin, yPosition);
            yPosition += 6;
          }
          
          // Opções como texto normal
          question.opcoes.forEach((opcao, oIdx: number) => {
            checkPageBreak(8);
            
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(55, 65, 81);
            const letter = String.fromCharCode(65 + oIdx); // A, B, C, D, E
            
            doc.text(`${letter}) ${opcao.texto}`, margin + 5, yPosition);
            yPosition += 6;
          });
          
          yPosition += 5;
        });
        
      } else {
        // Parágrafo
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(55, 65, 81);
        
        const cleanText = cleanHtml(item.conteudo);
        const lines = doc.splitTextToSize(cleanText, contentWidth);
        lines.forEach((line: string) => {
          checkPageBreak();
          doc.text(line, margin, yPosition);
          yPosition += 5.5;
        });
        yPosition += 3;
      }
    });
  });

  // Adicionar rodapé em todas as páginas (exceto a capa)
  // Página 1 = capa, então começamos do índice (página 2)
  const totalPages = doc.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    addFooter(i, totalPages - 1); // Total menos a capa
  }

  // Salvar o PDF
  let fileName: string;
  if (filename) {
    fileName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  } else {
    fileName = `${curso.titulo.replace(/[^a-z0-9]/gi, '_')}.pdf`;
  }
  doc.save(fileName);
}
