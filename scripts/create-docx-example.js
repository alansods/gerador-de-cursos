/**
 * Script para criar o arquivo exemplo-curso-nextjs.docx
 * Execute: node scripts/create-docx-example.js
 */

const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');
const fs = require('fs');
const path = require('path');

// Conteúdo do curso de exemplo
const doc = new Document({
  sections: [
    {
      properties: {},
      children: [
        // METADADOS DO CURSO
        new Paragraph({
          text: 'METADADOS DO CURSO',
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Título: ', bold: true }),
            new TextRun('Introdução ao Next.js 14'),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Categoria: ', bold: true }),
            new TextRun('Programação'),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Carga Horária: ', bold: true }),
            new TextRun('20 horas'),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Modalidade: ', bold: true }),
            new TextRun('Online'),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Instrutor: ', bold: true }),
            new TextRun('João Silva'),
          ],
        }),
        new Paragraph({ text: '' }), // Linha vazia

        // DESCRIÇÃO DO CURSO
        new Paragraph({
          text: 'DESCRIÇÃO DO CURSO',
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          text: 'Este curso introduz os fundamentos do Next.js 14, o framework React para produção. Os alunos aprenderão sobre Server Components, App Router, otimização de imagens, e deploy na Vercel. Ao final, serão capazes de criar aplicações web modernas, performáticas e otimizadas para SEO.',
        }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: '---' }),
        new Paragraph({ text: '' }),

        // UNIDADE 1
        new Paragraph({
          text: 'UNIDADE 1: Fundamentos do Next.js',
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
          text: 'Descrição da Unidade',
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          text: 'Nesta unidade, você aprenderá os conceitos básicos do Next.js, incluindo instalação, estrutura de pastas e diferenças entre o App Router e Pages Router. Entenderá por que Next.js é uma escolha popular para aplicações React em produção.',
        }),
        new Paragraph({ text: '' }),

        new Paragraph({
          text: 'O que é Next.js?',
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          text: 'Next.js é um framework React criado pela Vercel que permite criar aplicações web full-stack com funcionalidades como Server-Side Rendering (SSR), Static Site Generation (SSG), e muito mais. Ele resolve muitos problemas comuns do desenvolvimento React, oferecendo uma experiência otimizada tanto para desenvolvedores quanto para usuários finais.',
        }),
        new Paragraph({
          text: 'O framework é usado por empresas como Netflix, TikTok, Nike e Twitch, demonstrando sua capacidade de escalar para milhões de usuários.',
        }),
        new Paragraph({ text: '' }),

        new Paragraph({
          text: 'Principais Características',
          heading: HeadingLevel.HEADING_3,
        }),
        new Paragraph({
          text: 'Next.js oferece diversas funcionalidades prontas para uso que aceleram o desenvolvimento:',
        }),
        new Paragraph({
          text: '• Renderização híbrida: Combine SSR, SSG e CSR conforme necessário',
        }),
        new Paragraph({
          text: '• Otimização automática: Imagens, fontes e código são otimizados automaticamente',
        }),
        new Paragraph({
          text: '• Roteamento baseado em arquivos: Sem necessidade de configuração manual de rotas',
        }),
        new Paragraph({
          text: '• API Routes: Crie APIs diretamente no seu projeto',
        }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: '---' }),
        new Paragraph({ text: '' }),

        // UNIDADE 2
        new Paragraph({
          text: 'UNIDADE 2: App Router e Roteamento',
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
          text: 'Descrição da Unidade',
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          text: 'Aprenda sobre o novo App Router do Next.js 14, incluindo layouts, páginas aninhadas, loading states e error handling. Domine a criação de rotas dinâmicas e entenda como o sistema de roteamento funciona internamente.',
        }),
        new Paragraph({ text: '' }),

        new Paragraph({
          text: 'Estrutura de Pastas do App Router',
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          text: 'O App Router utiliza a pasta app/ como raiz de todas as rotas. Cada pasta representa um segmento de rota e pode conter arquivos especiais que definem o comportamento da aplicação.',
        }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: '---' }),
        new Paragraph({ text: '' }),

        // UNIDADE 3
        new Paragraph({
          text: 'UNIDADE 3: Server Components e Data Fetching',
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
          text: 'Descrição da Unidade',
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          text: 'Entenda os Server Components do React e como buscar dados de forma eficiente no Next.js. Aprenda as diferenças entre Server e Client Components e quando usar cada um.',
        }),
        new Paragraph({ text: '' }),

        new Paragraph({
          text: 'React Server Components',
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          text: 'React Server Components (RSC) são uma nova funcionalidade que permite renderizar componentes no servidor, reduzindo o JavaScript enviado ao cliente e melhorando a performance.',
        }),
        new Paragraph({
          text: 'Por padrão, todos os componentes no App Router são Server Components, a menos que você adicione a diretiva "use client".',
        }),
      ],
    },
  ],
});

// Criar as pastas necessárias
const publicDir = path.join(__dirname, '..', 'public', 'roteiro');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Salvar o arquivo
Packer.toBuffer(doc).then((buffer) => {
  const filePath = path.join(publicDir, 'exemplo-curso-nextjs.docx');
  fs.writeFileSync(filePath, buffer);
  console.log('✅ Arquivo criado com sucesso:', filePath);
}).catch((error) => {
  console.error('❌ Erro ao criar arquivo:', error);
});

