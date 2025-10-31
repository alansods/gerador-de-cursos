import jsPDF from 'jspdf';

interface Curso {
  titulo: string;
  descricao: string;
  categoria: string;
  cargaHoraria: string;
  modalidade: string;
  instrutor: string;
  unidades?: Unidade[];
}

interface Unidade {
  id: string;
  titulo: string;
  descricao: string;
  conteudo: ConteudoUnidade[];
}

interface ConteudoUnidade {
  tipo: 'titulo' | 'subtitulo' | 'paragrafo' | 'imagem';
  conteudo: string;
  legenda?: string;
  fonte?: string;
}

export async function generateCoursePDF(curso: Curso): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  // Função para adicionar nova página se necessário
  const checkPageBreak = (requiredSpace: number = 20) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Função para adicionar texto com quebra de linha
  const addText = (text: string, fontSize: number, fontStyle: 'normal' | 'bold' = 'normal', align: 'left' | 'center' | 'right' = 'left') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    
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
    
    yPosition += 5;
  };

  // =============== CAPA ===============
  // Gradiente simulado com retângulos
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(0, 0, pageWidth, 80, 'F');
  
  doc.setFillColor(147, 51, 234); // purple-600
  doc.rect(0, 80, pageWidth, 40, 'F');

  // Título do curso
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  yPosition = 50;
  addText(curso.titulo || 'Curso', 28, 'bold', 'center');

  // Descrição
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  yPosition = 70;
  addText(curso.descricao || '', 14, 'normal', 'center');

  // Informações do curso
  doc.setTextColor(0, 0, 0);
  yPosition = 140;
  
  doc.setFillColor(249, 250, 251); // gray-50
  doc.rect(margin, yPosition, contentWidth, 60, 'F');
  
  yPosition += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  
  const infos = [
    `Categoria: ${curso.categoria || 'N/A'}`,
    `Carga Horária: ${curso.cargaHoraria || 'N/A'}`,
    `Modalidade: ${curso.modalidade || 'N/A'}`,
    `Instrutor: ${curso.instrutor || 'N/A'}`,
  ];
  
  infos.forEach((info) => {
    yPosition += 10;
    doc.text(info, margin + 5, yPosition);
  });

  // =============== ÍNDICE ===============
  doc.addPage();
  yPosition = margin;
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Índice', margin, yPosition);
  yPosition += 15;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  const unidades = curso.unidades || [];
  const unidadePages: { [key: string]: number } = {};
  
  // Calcular páginas aproximadas para cada unidade (será ajustado depois)
  unidades.forEach((unidade, index) => {
    checkPageBreak(15);
    
    doc.setTextColor(37, 99, 235);
    doc.setFont('helvetica', 'bold');
    const unidadeTitulo = `${index + 1}. ${unidade.titulo}`;
    doc.textWithLink(unidadeTitulo, margin + 5, yPosition, {
      pageNumber: 3 + index, // Aproximado, será ajustado
    });
    
    yPosition += 8;
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const descPreview = unidade.descricao?.substring(0, 80) + (unidade.descricao?.length > 80 ? '...' : '');
    doc.text(descPreview || '', margin + 10, yPosition);
    yPosition += 10;
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
  });

  // =============== UNIDADES ===============
  unidades.forEach((unidade, unidadeIndex) => {
    doc.addPage();
    yPosition = margin;
    
    // Armazenar número da página para links
    unidadePages[unidade.id] = doc.getCurrentPageInfo().pageNumber;
    
    // Cabeçalho da unidade
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Unidade ${unidadeIndex + 1}`, margin, 15);
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(unidade.titulo, margin, 28);
    
    yPosition = 50;
    doc.setTextColor(0, 0, 0);
    
    // Descrição da unidade
    if (unidade.descricao) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      
      const descLines = doc.splitTextToSize(unidade.descricao, contentWidth);
      descLines.forEach((line: string) => {
        checkPageBreak();
        doc.text(line, margin, yPosition);
        yPosition += 6;
      });
      
      yPosition += 5;
    }
    
    // Linha separadora
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;
    
    doc.setTextColor(0, 0, 0);
    
    // Conteúdo da unidade
    unidade.conteudo.forEach((item) => {
      checkPageBreak(15);
      
      if (item.tipo === 'titulo') {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 41, 55); // gray-800
        
        const lines = doc.splitTextToSize(item.conteudo, contentWidth);
        lines.forEach((line: string) => {
          checkPageBreak();
          doc.text(line, margin, yPosition);
          yPosition += 8;
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
          yPosition += 7;
        });
        yPosition += 2;
        
      } else if (item.tipo === 'imagem') {
        // Informações da imagem
        if (item.fonte) {
          doc.setFontSize(8);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(107, 114, 128);
          doc.text(`Fonte: ${item.fonte}`, margin, yPosition);
          yPosition += 5;
        }
        
        // Nota: Imagens externas não podem ser facilmente incluídas em jsPDF sem conversão
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
        
      } else {
        // Parágrafo
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(55, 65, 81);
        
        // Remove HTML tags básicas
        let cleanText = item.conteudo
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<\/p>/gi, '\n\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .trim();
        
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

  // Adicionar rodapé em todas as páginas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Salvar o PDF
  const fileName = `${curso.titulo.replace(/[^a-z0-9]/gi, '_')}.pdf`;
  doc.save(fileName);
}

