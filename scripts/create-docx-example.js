/**
 * Script para criar o arquivo exemplo-curso-pizza.docx
 * Execute: node scripts/create-docx-example.js
 */

const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');
const fs = require('fs');
const path = require('path');

// Conteúdo do curso de exemplo - Pizza de Carne de Sol
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
            new TextRun('Fabricação de Pizza Artesanal de Carne de Sol'),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Categoria: ', bold: true }),
            new TextRun('Gastronomia'),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Carga Horária: ', bold: true }),
            new TextRun('16 horas'),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Modalidade: ', bold: true }),
            new TextRun('Presencial'),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Instrutor: ', bold: true }),
            new TextRun('Chef Maria Santos'),
          ],
        }),
        new Paragraph({ text: '' }), // Linha vazia

        // DESCRIÇÃO DO CURSO
        new Paragraph({
          text: 'DESCRIÇÃO DO CURSO',
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          text: 'Aprenda a preparar pizzas artesanais com o tradicional sabor nordestino da carne de sol. Este curso aborda desde a preparação da massa até a montagem final, incluindo técnicas de dessalgue, preparo da carne de sol e harmonização de ingredientes. Ideal para pizzaiolos, empreendedores gastronômicos e entusiastas da culinária regional brasileira.',
        }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: '---' }),
        new Paragraph({ text: '' }),

        // UNIDADE 1
        new Paragraph({
          text: 'UNIDADE 1: Preparação da Massa de Pizza Artesanal',
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
          text: 'Descrição da Unidade',
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          text: 'Nesta unidade, você aprenderá a preparar a massa de pizza artesanal perfeita, com foco em técnicas de fermentação, hidratação adequada e manejo da massa. Conhecerá os ingredientes essenciais e suas funções no desenvolvimento do sabor e textura.',
        }),
        new Paragraph({ text: '' }),

        new Paragraph({
          text: 'Ingredientes para a Massa',
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          text: 'A massa de pizza artesanal requer ingredientes de qualidade e proporções precisas. Para 4 pizzas médias (aproximadamente 300g cada), você precisará de:',
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          text: '• 500g de farinha de trigo tipo 00 (ou farinha de trigo especial para pizza)',
        }),
        new Paragraph({
          text: '• 325ml de água filtrada em temperatura ambiente (65% de hidratação)',
        }),
        new Paragraph({
          text: '• 10g de sal refinado (2% do peso da farinha)',
        }),
        new Paragraph({
          text: '• 3g de fermento biológico seco instantâneo (0,6% do peso da farinha)',
        }),
        new Paragraph({
          text: '• 15ml de azeite de oliva extra virgem',
        }),
        new Paragraph({ text: '' }),

        new Paragraph({
          text: 'Técnica de Preparação',
          heading: HeadingLevel.HEADING_3,
        }),
        new Paragraph({
          text: 'Misture a farinha com o fermento em uma tigela grande. Adicione gradualmente a água, mexendo com as mãos até formar uma massa úmida. Adicione o sal e continue sovando por 10 minutos até a massa ficar lisa e elástica. Incorpore o azeite nos últimos 2 minutos.',
        }),
        new Paragraph({
          text: 'Divida a massa em 4 porções iguais (aproximadamente 210g cada) e faça bolinhas. Coloque em um recipiente untado com azeite, cubra com filme plástico e deixe fermentar em temperatura ambiente por 2 horas, ou na geladeira por 24-48 horas para melhor desenvolvimento de sabor.',
        }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: '---' }),
        new Paragraph({ text: '' }),

        // UNIDADE 2
        new Paragraph({
          text: 'UNIDADE 2: Preparo da Carne de Sol',
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
          text: 'Descrição da Unidade',
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          text: 'Aprenda as técnicas corretas para dessalgar, cozinhar e desfiar a carne de sol, garantindo textura macia e sabor equilibrado. Esta etapa é fundamental para o sucesso da pizza e requer atenção aos detalhes de tempo e temperatura.',
        }),
        new Paragraph({ text: '' }),

        new Paragraph({
          text: 'Processo de Dessalgue',
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          text: 'A carne de sol possui alto teor de sal, sendo essencial o processo de dessalgue antes do preparo. Para 500g de carne de sol:',
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          text: '1. Corte a carne em pedaços médios de aproximadamente 200g',
        }),
        new Paragraph({
          text: '2. Coloque em uma tigela com água filtrada, cobrindo completamente a carne',
        }),
        new Paragraph({
          text: '3. Leve à geladeira por no mínimo 12 horas, trocando a água a cada 4 horas',
        }),
        new Paragraph({
          text: '4. Após o período, prove um pequeno pedaço para avaliar o sal',
        }),
        new Paragraph({
          text: '5. Se ainda estiver muito salgada, repita o processo por mais 4-6 horas',
        }),
        new Paragraph({ text: '' }),

        new Paragraph({
          text: 'Cozimento e Preparo Final',
          heading: HeadingLevel.HEADING_3,
        }),
        new Paragraph({
          text: 'Após dessalgar, cozinhe a carne de sol em panela de pressão com água fresca por aproximadamente 40 minutos após iniciar a pressão. A carne deve ficar macia e fácil de desfiar. Escorra completamente e, quando esfriar o suficiente para manusear, desfie em tiras finas usando as mãos ou dois garfos.',
        }),
        new Paragraph({
          text: 'Em uma frigideira quente com um fio de azeite, refogue a carne desfiada com cebola picada, alho e pimenta do reino a gosto. Este refogado rápido adiciona sabor e textura crocante à carne. Reserve em temperatura ambiente até o momento de montar as pizzas.',
        }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: '---' }),
        new Paragraph({ text: '' }),

        // UNIDADE 3
        new Paragraph({
          text: 'UNIDADE 3: Montagem e Assamento da Pizza',
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
          text: 'Descrição da Unidade',
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          text: 'Domine a arte de abrir a massa, distribuir os ingredientes de forma equilibrada e assar a pizza em alta temperatura. Aprenda a criar a combinação perfeita de sabores e texturas que fazem da pizza de carne de sol um sucesso.',
        }),
        new Paragraph({ text: '' }),

        new Paragraph({
          text: 'Abertura da Massa',
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          text: 'Retire a massa da geladeira 1 hora antes de usar para que atinja temperatura ambiente. Polvilhe farinha em uma superfície lisa e coloque a bolinha de massa. Com as pontas dos dedos, pressione suavemente do centro para as bordas, deixando aproximadamente 2cm de borda sem pressionar.',
        }),
        new Paragraph({
          text: 'Continue abrindo a massa com movimentos circulares até atingir cerca de 30cm de diâmetro. Evite usar o rolo, pois pode tirar o ar da massa. A borda deve ficar levemente mais alta que o centro.',
        }),
        new Paragraph({ text: '' }),

        new Paragraph({
          text: 'Montagem dos Ingredientes',
          heading: HeadingLevel.HEADING_3,
        }),
        new Paragraph({
          text: 'Sobre a massa aberta, espalhe primeiro uma fina camada de molho de tomate temperado (cerca de 80g). Distribua 150g de muçarela ralada por toda a superfície. Adicione a carne de sol refogada (aproximadamente 100g) de forma uniforme.',
        }),
        new Paragraph({
          text: 'Finalize com rodelas finas de cebola roxa, tomate cereja cortado ao meio e azeitonas pretas fatiadas. Regue com um fio de azeite extra virgem e polvilhe orégano.',
        }),
        new Paragraph({ text: '' }),

        new Paragraph({
          text: 'Assamento',
          heading: HeadingLevel.HEADING_3,
        }),
        new Paragraph({
          text: 'Pré-aqueça o forno na temperatura máxima (idealmente 280-300°C) por pelo menos 30 minutos com a pedra de pizza ou assadeira dentro. Transfira cuidadosamente a pizza montada para a pedra quente usando uma pá de pizza.',
        }),
        new Paragraph({
          text: 'Asse por 8-12 minutos, dependendo do seu forno, até que a borda fique dourada e a base crocante. Retire do forno, adicione folhas frescas de rúcula por cima e finalize com lascas de queijo parmesão. Sirva imediatamente.',
        }),
        new Paragraph({ text: '' }),

        new Paragraph({
          text: 'Dicas Profissionais',
          heading: HeadingLevel.HEADING_3,
        }),
        new Paragraph({
          text: '• Use pedra refratária para um resultado profissional',
        }),
        new Paragraph({
          text: '• Não exagere nos ingredientes - menos é mais',
        }),
        new Paragraph({
          text: '• Sirva a pizza quente, logo após sair do forno',
        }),
        new Paragraph({
          text: '• Harmonize com uma cerveja gelada ou caipirinha de limão',
        }),
        new Paragraph({ text: '' }),

        // EXEMPLO DE ACCORDION
        new Paragraph({
          text: '💡 INDICADORES ESPECIAIS - Exemplo de ACCORDION',
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          text: 'Para criar conteúdo expansível/colapsável (accordion), use os marcadores abaixo:',
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: 'ACCORDION_INICIO', bold: true }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Título do Item 1: ', bold: true }),
            new TextRun('Erros Comuns ao Preparar a Massa'),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Conteúdo do Item 1: ', bold: true }),
            new TextRun('Usar água muito quente mata o fermento. Sempre use água em temperatura ambiente ou levemente morna. Sovar demais também pode deixar a massa dura. O ideal é sovar por 8-12 minutos até a massa ficar lisa e elástica, não mais do que isso.'),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Título do Item 2: ', bold: true }),
            new TextRun('Temperaturas Ideais de Assamento'),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Conteúdo do Item 2: ', bold: true }),
            new TextRun('A temperatura ideal para assar pizza artesanal é entre 280-300°C. Fornos domésticos geralmente atingem no máximo 250°C. Neste caso, aumente o tempo de assamento para 12-15 minutos e use a função grill nos últimos 2 minutos para dourar a borda.'),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Título do Item 3: ', bold: true }),
            new TextRun('Como Armazenar Pizza Assada'),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Conteúdo do Item 3: ', bold: true }),
            new TextRun('Pizza deve ser consumida imediatamente após o assamento para melhor sabor. Se precisar armazenar, congele crua antes de assar. Massa já assada pode ser congelada por até 1 mês e reaquecida em forno pré-aquecido por 5-7 minutos.'),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'ACCORDION_FIM', bold: true }),
          ],
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          text: '📝 OBSERVAÇÃO: A IA irá transformar o conteúdo entre ACCORDION_INICIO e ACCORDION_FIM em um accordion interativo com os itens criados.',
        }),
        new Paragraph({ text: '' }),

        // EXEMPLO DE FLIPCARD
        new Paragraph({
          text: '💡 INDICADORES ESPECIAIS - Exemplo de FLIPCARD',
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          text: 'Para criar cards interativos que podem ser girados (flip cards), use os marcadores abaixo:',
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: 'FLIPCARD_INICIO', bold: true }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Tipo de Frente: ', bold: true }),
            new TextRun('titulo'),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Título da Frente: ', bold: true }),
            new TextRun('Proporção Hidratação'),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Conteúdo do Verso: ', bold: true }),
            new TextRun('A hidratação é o percentual de água em relação à farinha. Para pizza artesanal, recomenda-se 60-65% de hidratação. Isso significa: para 500g de farinha, use 300-325ml de água. Massas mais hidratadas (65%+) são mais fáceis de trabalhar e resultam em textura mais aerada, mas requerem mais prática para manusear. Massas menos hidratadas (60%) são mais fáceis de controlar, ideais para iniciantes.',
          ),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'FLIPCARD_FIM', bold: true }),
          ],
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          text: '📝 OBSERVAÇÃO: A IA irá transformar o conteúdo entre FLIPCARD_INICIO e FLIPCARD_FIM em um card interativo. Tipos disponíveis: "titulo" (apenas título na frente), "imagem" (imagem na frente), "imagem-titulo" (imagem + título na frente).',
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          text: 'Exemplo de FlipCard com imagem e título:',
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: 'FLIPCARD_INICIO', bold: true }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Tipo de Frente: ', bold: true }),
            new TextRun('imagem-titulo'),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Imagem da Frente: ', bold: true }),
            new TextRun('https://swiftbr.vteximg.com.br/arquivos/ids/208740-636-636/618283-pizza-artesanal-calabresa_inn.jpg?v=638870725352100000'),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Título da Frente: ', bold: true }),
            new TextRun('Pizza Artesanal Pronta'),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Conteúdo do Verso: ', bold: true }),
            new TextRun('Uma pizza artesanal bem feita apresenta: borda alta e dourada (resultado da fermentação adequada), base crocante mas não dura, distribuição uniforme dos ingredientes, e queijo derretido sem queimar. O segredo está na temperatura alta do forno (280-300°C) e no tempo de assamento curto (8-12 minutos), que preserva a umidade dos ingredientes enquanto cria a textura crocante desejada.',
          ),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'FLIPCARD_FIM', bold: true }),
          ],
        }),
        new Paragraph({ text: '' }),

        // EXEMPLO DE LISTA
        new Paragraph({
          text: '💡 INDICADORES ESPECIAIS - Exemplo de LISTA',
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          text: 'Para criar listas ordenadas ou não ordenadas, use os marcadores abaixo:',
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: 'LISTA_INICIO', bold: true }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Tipo de Lista: ', bold: true }),
            new TextRun('nao-ordenada'),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Item 1: ', bold: true }),
            new TextRun('500g de farinha de trigo tipo 00'),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Item 2: ', bold: true }),
            new TextRun('325ml de água filtrada em temperatura ambiente'),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Item 3: ', bold: true }),
            new TextRun('10g de sal refinado'),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Item 4: ', bold: true }),
            new TextRun('3g de fermento biológico seco instantâneo'),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'LISTA_FIM', bold: true }),
          ],
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          text: '📝 OBSERVAÇÃO: A IA irá transformar o conteúdo entre LISTA_INICIO e LISTA_FIM em uma lista interativa. Tipos disponíveis: "nao-ordenada" (com bullets), "ordenada" (numerada) ou "check" (com ícone de check). Use "Item X:" para cada item da lista.',
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          text: 'Exemplo de Lista Ordenada:',
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: 'LISTA_INICIO', bold: true }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Tipo de Lista: ', bold: true }),
            new TextRun('ordenada'),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Item 1: ', bold: true }),
            new TextRun('Corte a carne em pedaços médios de aproximadamente 200g'),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Item 2: ', bold: true }),
            new TextRun('Coloque em uma tigela com água filtrada, cobrindo completamente a carne'),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Item 3: ', bold: true }),
            new TextRun('Leve à geladeira por no mínimo 12 horas, trocando a água a cada 4 horas'),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'LISTA_FIM', bold: true }),
          ],
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          text: 'Exemplo de Lista com Ícone de Check:',
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: 'LISTA_INICIO', bold: true }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Tipo de Lista: ', bold: true }),
            new TextRun('check'),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Item 1: ', bold: true }),
            new TextRun('Farinha de trigo tipo 00 verificada e peneirada'),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Item 2: ', bold: true }),
            new TextRun('Água em temperatura ambiente preparada'),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Item 3: ', bold: true }),
            new TextRun('Sal e fermento medidos e separados'),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'LISTA_FIM', bold: true }),
          ],
        }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: '---' }),
        new Paragraph({ text: '' }),

        // INSTRUÇÕES FINAIS
        new Paragraph({
          text: '📋 INSTRUÇÕES PARA USO DOS INDICADORES',
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
          text: '• Use ACCORDION_INICIO e ACCORDION_FIM para criar conteúdo expansível',
        }),
        new Paragraph({
          text: '• Dentro do accordion, use "Título do Item X:" e "Conteúdo do Item X:" para cada item',
        }),
        new Paragraph({
          text: '• Use FLIPCARD_INICIO e FLIPCARD_FIM para criar cards interativos',
        }),
        new Paragraph({
          text: '• Especifique o Tipo de Frente: "titulo", "imagem" ou "imagem-titulo"',
        }),
        new Paragraph({
          text: '• Use LISTA_INICIO e LISTA_FIM para criar listas ordenadas, não ordenadas ou com ícone de check',
        }),
        new Paragraph({
          text: '• Especifique o Tipo de Lista: "ordenada" (numerada), "nao-ordenada" (bullets) ou "check" (com ícone de check)',
        }),
        new Paragraph({
          text: '• Para imagens, use URLs ou [IMAGEM: descrição] para placeholders',
        }),
        new Paragraph({
          text: '• A IA processará esses marcadores e criará os componentes interativos automaticamente',
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
  const filePath = path.join(publicDir, 'exemplo-curso.docx');
  fs.writeFileSync(filePath, buffer);
  console.log('✅ Arquivo criado com sucesso:', filePath);
  console.log('📄 Curso: Fabricação de Pizza Artesanal de Carne de Sol');
}).catch((error) => {
  console.error('❌ Erro ao criar arquivo:', error);
});
