import { NextResponse } from 'next/server';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from 'docx';

/**
 * GET /api/sample-document
 * Gera e retorna um documento .docx de exemplo para testar a geração automática por IA.
 */
export async function GET() {
  const doc = new Document({
    sections: [
      {
        children: [
          // Título
          new Paragraph({
            text: 'CURSO: Introdução à Segurança do Trabalho',
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'DESCRIÇÃO: ', bold: true }),
              new TextRun(
                'Este curso apresenta os fundamentos da segurança do trabalho, abordando desde a legislação básica até a prática de identificação e controle de riscos no ambiente laboral. Voltado para trabalhadores e supervisores de todos os setores.'
              ),
            ],
          }),
          new Paragraph({
            children: [new TextRun({ text: 'CARGA HORÁRIA: 8 horas' })],
          }),
          new Paragraph({
            children: [new TextRun({ text: 'MODALIDADE: Online' })],
          }),
          new Paragraph({
            children: [new TextRun({ text: 'CATEGORIA: Segurança do Trabalho' })],
          }),
          new Paragraph({ text: '' }),

          // Unidade 1
          new Paragraph({
            text: 'UNIDADE 1: Legislação e Normas Regulamentadoras',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: 'A segurança do trabalho no Brasil é regulamentada por um conjunto de leis e normas que visam proteger o trabalhador de acidentes e doenças ocupacionais. A principal base legal é a Consolidação das Leis do Trabalho (CLT), que determina a obrigatoriedade de medidas de proteção à saúde e integridade física dos trabalhadores.',
          }),
          new Paragraph({
            text: 'As Normas Regulamentadoras (NRs) são instrumentos fundamentais nesse contexto. Criadas pelo Ministério do Trabalho e Emprego, estabelecem os requisitos técnicos e legais para garantir a segurança nos ambientes de trabalho. Atualmente existem 37 NRs em vigor, cada uma cobrindo uma área específica.',
          }),
          new Paragraph({
            children: [new TextRun({ text: 'Principais Normas Regulamentadoras:', bold: true })],
          }),
          new Paragraph({ text: '• NR-1: Disposições Gerais e Gerenciamento de Riscos Ocupacionais' }),
          new Paragraph({ text: '• NR-5: Comissão Interna de Prevenção de Acidentes (CIPA)' }),
          new Paragraph({ text: '• NR-6: Equipamentos de Proteção Individual (EPI)' }),
          new Paragraph({ text: '• NR-9: Avaliação e Controle das Exposições Ocupacionais a Agentes Físicos, Químicos e Biológicos' }),
          new Paragraph({ text: '• NR-10: Segurança em Instalações e Serviços em Eletricidade' }),
          new Paragraph({ text: '• NR-35: Trabalho em Altura' }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Atenção: ', bold: true }),
              new TextRun(
                'O descumprimento das Normas Regulamentadoras sujeita a empresa a multas administrativas e responsabilização civil e criminal em caso de acidente. Todo trabalhador tem o direito de recusar atividades que coloquem sua vida em risco.'
              ),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Sabia que ', bold: true }),
              new TextRun(
                'a NR-1, reformulada em 2019, introduziu o conceito de Gerenciamento de Riscos Ocupacionais (GRO) e o Programa de Gerenciamento de Riscos (PGR), substituindo o antigo PPRA? Essa mudança modernizou a abordagem preventiva nas empresas brasileiras.'
              ),
            ],
          }),
          new Paragraph({ text: '' }),

          // Unidade 2
          new Paragraph({
            text: 'UNIDADE 2: Identificação e Classificação de Riscos',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: 'A identificação de riscos é o primeiro passo para a prevenção de acidentes. Um risco ocupacional é qualquer condição ou situação que possa causar dano à saúde ou integridade física do trabalhador. A NR-1 classifica os riscos em cinco grandes categorias.',
          }),
          new Paragraph({
            children: [new TextRun({ text: 'Categorias de risco e exemplos práticos:', bold: true })],
          }),
          new Paragraph({ text: 'Categoria 1 — Riscos Físicos: Ruído excessivo em fábricas, vibração em operadores de máquinas, radiação ionizante em serviços de saúde, temperaturas extremas em siderúrgicas.' }),
          new Paragraph({ text: 'Categoria 2 — Riscos Químicos: Poeiras minerais em mineração, fumos metálicos em soldagem, vapores de solventes em pinturas industriais, gases tóxicos em laboratórios.' }),
          new Paragraph({ text: 'Categoria 3 — Riscos Biológicos: Vírus e bactérias em hospitais e laboratórios clínicos, fungos em agricultura, parasitas em trabalhos com animais.' }),
          new Paragraph({ text: 'Categoria 4 — Riscos Ergonômicos: Postura inadequada em escritórios, levantamento manual de cargas pesadas, repetitividade de movimentos em linhas de produção.' }),
          new Paragraph({ text: 'Categoria 5 — Riscos de Acidentes: Máquinas sem proteção, ferramentas inadequadas, arranjo físico deficiente, trabalho em altura sem equipamentos adequados.' }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [new TextRun({ text: 'Hierarquia de controle de riscos (ordem de prioridade):', bold: true })],
          }),
          new Paragraph({ text: '1. Eliminação do risco na fonte' }),
          new Paragraph({ text: '2. Substituição do agente perigoso por outro menos nocivo' }),
          new Paragraph({ text: '3. Controles de engenharia (enclausuramento, ventilação, proteção coletiva)' }),
          new Paragraph({ text: '4. Controles administrativos (procedimentos, treinamentos, rotação de funções)' }),
          new Paragraph({ text: '5. Equipamentos de Proteção Individual (EPI) — último recurso' }),
          new Paragraph({ text: '' }),

          // Unidade 3
          new Paragraph({
            text: 'UNIDADE 3: Equipamentos de Proteção Individual e Coletiva',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: 'Os Equipamentos de Proteção Individual (EPIs) são dispositivos ou produtos de uso individual destinados a proteger o trabalhador de riscos que ameacem sua segurança e saúde. Sua utilização é regulamentada pela NR-6.',
          }),
          new Paragraph({
            children: [new TextRun({ text: 'Responsabilidades do empregador:', bold: true })],
          }),
          new Paragraph({ text: 'O empregador deve fornecer gratuitamente o EPI adequado ao risco, em perfeito estado de conservação; treinar o trabalhador sobre o uso correto; fiscalizar o uso; e substituir imediatamente quando danificado ou extraviado.' }),
          new Paragraph({
            children: [new TextRun({ text: 'Responsabilidades do trabalhador:', bold: true })],
          }),
          new Paragraph({ text: 'O trabalhador deve usar o EPI apenas para a finalidade a que se destina; responsabilizar-se pela guarda e conservação; comunicar ao empregador qualquer alteração que o torne impróprio.' }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Importante: ', bold: true }),
              new TextRun(
                'O EPI só deve ser utilizado quando as medidas de proteção coletiva não forem tecnicamente viáveis ou não oferecerem proteção completa. O EPI é a última barreira de proteção, não a primeira.'
              ),
            ],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [new TextRun({ text: 'Principais EPIs por parte do corpo protegida:', bold: true })],
          }),
          new Paragraph({ text: '• Cabeça: capacete de segurança, capuz, touca' }),
          new Paragraph({ text: '• Olhos e face: óculos de segurança, protetor facial, máscara de solda' }),
          new Paragraph({ text: '• Audição: protetor auricular tipo concha, tipo plug (espuma)' }),
          new Paragraph({ text: '• Respiração: respirador purificador de ar, máscara autônoma' }),
          new Paragraph({ text: '• Tronco: vestimentas (macacão, avental), colete salva-vidas' }),
          new Paragraph({ text: '• Mãos e braços: luvas, mangotes, braçadeiras' }),
          new Paragraph({ text: '• Pés e pernas: calçado de segurança, perneira, meia' }),
          new Paragraph({ text: '• Quedas: cinto de segurança, trava-queda, mosquetão' }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Dica profissional: ', bold: true }),
              new TextRun(
                'Ao selecionar um EPI, verifique sempre o Certificado de Aprovação (CA) emitido pelo Ministério do Trabalho. EPIs sem CA não são aprovados para uso profissional e não oferecem garantia de proteção adequada.'
              ),
            ],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [new TextRun({ text: 'Questões para revisão:', bold: true })],
          }),
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [new TextRun('Pergunta: Qual é a principal responsabilidade do empregador em relação aos EPIs?')],
          }),
          new Paragraph({ text: 'Opção A: Cobrar do trabalhador o custo do equipamento' }),
          new Paragraph({ text: 'Opção B: Fornecer gratuitamente o EPI adequado ao risco e fiscalizar o uso' }),
          new Paragraph({ text: 'Opção C: Deixar a critério do trabalhador usar ou não o EPI' }),
          new Paragraph({ text: 'Opção D: Fornecer apenas os EPIs mais baratos disponíveis no mercado' }),
          new Paragraph({ text: 'Opção E: Comprar os EPIs uma única vez e nunca substituir' }),
          new Paragraph({ children: [new TextRun({ text: 'Resposta Correta: B', bold: true })] }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [new TextRun('Pergunta: Em qual posição na hierarquia de controle de riscos o EPI deve ser utilizado?')],
          }),
          new Paragraph({ text: 'Opção A: Primeira opção, pois é mais fácil de implementar' }),
          new Paragraph({ text: 'Opção B: Segunda opção, logo após a eliminação do risco' }),
          new Paragraph({ text: 'Opção C: Qualquer posição, conforme a conveniência da empresa' }),
          new Paragraph({ text: 'Opção D: Última opção, quando as demais medidas são inviáveis ou insuficientes' }),
          new Paragraph({ text: 'Opção E: EPI não faz parte da hierarquia de controle de riscos' }),
          new Paragraph({ children: [new TextRun({ text: 'Resposta Correta: D', bold: true })] }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': 'attachment; filename="exemplo-seguranca-trabalho.docx"',
    },
  });
}
