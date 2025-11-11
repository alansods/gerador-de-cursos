import { exec } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import JSZip from 'jszip';
import type { CursoGerado, ConteudoUnidade } from '@/types/gerador-curso';

/**
 * Converte caminhos absolutos (/_next/..., /favicon.ico) para caminhos relativos
 * Isso é necessário para que os assets funcionem em LMS que colocam o conteúdo em subpastas
 *
 * @param html - Conteúdo HTML a ser processado
 * @param prefix - Prefixo relativo (../ para um nível acima, ../../ para dois níveis)
 * @returns HTML com caminhos relativos
 */
function convertAbsolutePathsToRelative(html: string, prefix: string): string {
  // Converter /_next/ para ../_next/ ou ../../_next/
  html = html.replace(/href="\/_next\//g, `href="${prefix}_next/`);
  html = html.replace(/src="\/_next\//g, `src="${prefix}_next/`);

  // Converter /favicon.ico para ../favicon.ico ou ../../favicon.ico
  html = html.replace(/href="\/favicon\.ico/g, `href="${prefix}favicon.ico`);

  // Converter outros assets com / inicial
  // Mas preservar URLs externas (http://, https://, //)
  html = html.replace(
    /(href|src)="\/(?!\/|http)/g,
    `$1="${prefix}`
  );

  return html;
}

/**
 * Detecta todas as URLs de imagens no curso (recursivamente)
 */
export function detectImageUrls(curso: CursoGerado): string[] {
  console.log('🔍 [SCORM Build] Detectando URLs de imagens no curso...');
  const imageUrls = new Set<string>();

  function processConteudo(conteudo: ConteudoUnidade) {
    // Imagem direta
    if (conteudo.tipo === 'imagem' && conteudo.conteudo) {
      const url = conteudo.conteudo;
      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        imageUrls.add(url);
        console.log(`   📷 [SCORM Build] Imagem encontrada: ${url}`);
      }
    }

    // Imagem em flipcard
    if (conteudo.tipo === 'flipcard' && conteudo.imagemFrente) {
      const url = conteudo.imagemFrente;
      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        imageUrls.add(url);
        console.log(`   📷 [SCORM Build] Imagem de flipcard encontrada: ${url}`);
      }
    }
  }

  // Processar todas as unidades e seus conteúdos
  curso.unidades?.forEach((unidade) => {
    console.log(`   📚 [SCORM Build] Processando unidade: ${unidade.titulo}`);
    unidade.conteudo?.forEach(processConteudo);
  });

  const urls = Array.from(imageUrls);
  console.log(`✅ [SCORM Build] Total de ${urls.length} imagens detectadas`);
  return urls;
}

/**
 * Baixa uma imagem de uma URL e salva localmente
 */
async function downloadImage(
  url: string,
  outputPath: string
): Promise<void> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Falha ao baixar imagem: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    
    // Criar diretório se não existir
    const dir = path.dirname(outputPath);
    await fs.mkdir(dir, { recursive: true });

    // Salvar arquivo
    await fs.writeFile(outputPath, buffer);
  } catch (error) {
    console.error(`Erro ao baixar imagem ${url}:`, error);
    throw error;
  }
}

/**
 * Baixa todas as imagens do curso e atualiza referências
 */
export async function downloadAndUpdateImages(
  curso: CursoGerado,
  cursoId: string
): Promise<{ curso: CursoGerado; imageMap: Map<string, string> }> {
  console.log('🖼️ [SCORM Build] Iniciando download de imagens...');
  const imageUrls = detectImageUrls(curso);
  const imageMap = new Map<string, string>();
  const publicDir = path.join(process.cwd(), 'public', 'scorm-images', cursoId);

  console.log(`📁 [SCORM Build] Criando diretório para imagens: ${publicDir}`);
  // Criar diretório se não existir
  await fs.mkdir(publicDir, { recursive: true });

  // Baixar cada imagem
  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    console.log(`⬇️ [SCORM Build] Baixando imagem ${i + 1}/${imageUrls.length}: ${url}`);
    
    try {
      const urlHash = Buffer.from(url).toString('base64').replace(/[/+=]/g, '').substring(0, 16);
      const extension = path.extname(new URL(url).pathname) || '.jpg';
      const filename = `image-${i + 1}-${urlHash}${extension}`;
      const outputPath = path.join(publicDir, filename);
      const publicPath = `/scorm-images/${cursoId}/${filename}`;

      await downloadImage(url, outputPath);
      imageMap.set(url, publicPath);
      console.log(`✅ [SCORM Build] Imagem baixada com sucesso: ${url} -> ${publicPath}`);
    } catch (error) {
      console.error(`❌ [SCORM Build] Erro ao baixar imagem ${url}:`, error);
      // Continuar mesmo se uma imagem falhar
    }
  }

  console.log(`✅ [SCORM Build] Download de imagens concluído. ${imageMap.size}/${imageUrls.length} imagens baixadas com sucesso.`);

  // Atualizar referências no curso
  console.log('🔄 [SCORM Build] Atualizando referências de imagens no curso...');
  const cursoAtualizado = JSON.parse(JSON.stringify(curso)) as CursoGerado;

  let updatedCount = 0;
  function updateConteudo(conteudo: ConteudoUnidade) {
    // Atualizar imagem direta
    if (conteudo.tipo === 'imagem' && conteudo.conteudo) {
      const newPath = imageMap.get(conteudo.conteudo);
      if (newPath) {
        conteudo.conteudo = newPath;
        updatedCount++;
        console.log(`   🔄 [SCORM Build] Referência atualizada: ${conteudo.conteudo} -> ${newPath}`);
      }
    }

    // Atualizar imagem em flipcard
    if (conteudo.tipo === 'flipcard' && conteudo.imagemFrente) {
      const newPath = imageMap.get(conteudo.imagemFrente);
      if (newPath) {
        conteudo.imagemFrente = newPath;
        updatedCount++;
        console.log(`   🔄 [SCORM Build] Referência de flipcard atualizada: ${conteudo.imagemFrente} -> ${newPath}`);
      }
    }
  }

  cursoAtualizado.unidades?.forEach((unidade) => {
    unidade.conteudo?.forEach(updateConteudo);
  });

  console.log(`✅ [SCORM Build] ${updatedCount} referências de imagens atualizadas no curso`);
  return { curso: cursoAtualizado, imageMap };
}

/**
 * Salva o curso em um arquivo temporário para ser usado durante o build
 */
async function saveCursoForBuild(
  curso: CursoGerado,
  cursoId: string
): Promise<string> {
  const tempDir = path.join(process.cwd(), '.scorm-build');
  const tempFile = path.join(tempDir, `curso-${cursoId}.json`);

  console.log(`💾 [SCORM Build] Salvando curso em arquivo temporário: ${tempFile}`);
  // Criar diretório se não existir
  await fs.mkdir(tempDir, { recursive: true });

  // Salvar curso
  const cursoJson = JSON.stringify(curso, null, 2);
  await fs.writeFile(tempFile, cursoJson, 'utf-8');
  console.log(`✅ [SCORM Build] Curso salvo com sucesso (${cursoJson.length} bytes)`);

  return tempFile;
}

/**
 * Remove o arquivo temporário do curso após o build
 */
async function removeCursoBuildFile(cursoId: string): Promise<void> {
  try {
    const tempDir = path.join(process.cwd(), '.scorm-build');
    const tempFile = path.join(tempDir, `curso-${cursoId}.json`);
    await fs.unlink(tempFile).catch(() => {});
  } catch (error) {
    // Ignorar erros ao remover arquivo temporário
  }
}

/**
 * Move temporariamente todas as pastas de API para FORA do diretório app durante o build estático
 * Isso garante que o Next.js não tente processar as rotas de API durante o build estático
 * Detecta automaticamente pastas como "api", "api 2", "api 3", etc.
 */
async function hideApiRoutes(): Promise<string[]> {
  const appDir = path.join(process.cwd(), 'src', 'app');
  const hiddenDirs: string[] = [];

  try {
    // Ler todos os diretórios em src/app
    const entries = await fs.readdir(appDir, { withFileTypes: true });

    // Filtrar apenas diretórios que começam com "api"
    const apiDirs = entries
      .filter(entry => entry.isDirectory() && entry.name.startsWith('api'))
      .map(entry => entry.name);

    if (apiDirs.length === 0) {
      console.log('ℹ️ [SCORM Build] Nenhuma pasta de API encontrada');
      return hiddenDirs;
    }

    console.log(`📦 [SCORM Build] Encontradas ${apiDirs.length} pasta(s) de API: ${apiDirs.join(', ')}`);

    // Mover cada pasta de API para fora de src/app
    for (const apiDirName of apiDirs) {
      const apiDir = path.join(appDir, apiDirName);
      // Mover para FORA de src/app para garantir que o Next.js não encontre
      // Usar nome único baseado no nome da pasta original
      const hiddenApiDir = path.join(process.cwd(), `.${apiDirName}-hidden-temp`);

      console.log(`📦 [SCORM Build] Ocultando pasta /${apiDirName} durante build estático...`);
      console.log(`   📁 Movendo de: ${apiDir}`);
      console.log(`   📁 Para: ${hiddenApiDir}`);

      // Se já existe uma pasta oculta de um build anterior, remover primeiro
      if (await verifyPathExists(hiddenApiDir)) {
        console.log('   🧹 Removendo pasta oculta anterior...');
        await fs.rm(hiddenApiDir, { recursive: true, force: true });
      }

      await fs.rename(apiDir, hiddenApiDir);
      console.log(`✅ [SCORM Build] Pasta /${apiDirName} ocultada com sucesso`);
      hiddenDirs.push(hiddenApiDir);
    }

    console.log(`✅ [SCORM Build] ${hiddenDirs.length} pasta(s) de API ocultadas`);
  } catch (error) {
    console.error('❌ [SCORM Build] Erro ao ocultar pastas de API:', error);
  }

  return hiddenDirs;
}

/**
 * Restaura todas as pastas de API após o build estático
 */
async function restoreApiRoutes(hiddenApiDirs: string[]): Promise<void> {
  if (!hiddenApiDirs || hiddenApiDirs.length === 0) {
    console.log('ℹ️ [SCORM Build] Nenhuma pasta de API para restaurar');
    return;
  }

  const appDir = path.join(process.cwd(), 'src', 'app');

  for (const hiddenApiDir of hiddenApiDirs) {
    try {
      const exists = await verifyPathExists(hiddenApiDir);
      if (exists) {
        // Extrair o nome original da pasta do caminho oculto
        // Exemplo: .api-hidden-temp -> api, .api 2-hidden-temp -> api 2
        const dirBaseName = path.basename(hiddenApiDir);
        const apiDirName = dirBaseName.replace(/^\./, '').replace(/-hidden-temp$/, '');
        const apiDir = path.join(appDir, apiDirName);

        console.log(`📦 [SCORM Build] Restaurando pasta /${apiDirName} após build...`);

        // Se a pasta api já existe (caso de erro), remover primeiro
        if (await verifyPathExists(apiDir)) {
          await fs.rm(apiDir, { recursive: true, force: true });
        }

        await fs.rename(hiddenApiDir, apiDir);
        console.log(`✅ [SCORM Build] Pasta /${apiDirName} restaurada com sucesso`);
      }
    } catch (error) {
      console.error(`❌ [SCORM Build] Erro ao restaurar pasta ${hiddenApiDir}:`, error);
    }
  }

  console.log(`✅ [SCORM Build] ${hiddenApiDirs.length} pasta(s) de API restauradas`);
}

/**
 * Move temporariamente as pastas problemáticas para FORA do diretório app durante o build estático
 * Isso garante que o Next.js não tente processar páginas que não devem ser exportadas
 */
async function hideProblematicPages(): Promise<string[]> {
  const hiddenDirs: string[] = [];
  const problematicPaths = [
    // Páginas dinâmicas que não devem ser exportadas estaticamente
    path.join(process.cwd(), 'src', 'app', 'cursos', '[id]'),
    // Página de PDF preview (não faz parte do SCORM)
    path.join(process.cwd(), 'src', 'app', 'pdf-preview'),
  ];
  
  for (const problematicPath of problematicPaths) {
    try {
      const exists = await verifyPathExists(problematicPath);
      if (exists) {
        const hiddenPath = path.join(process.cwd(), `.hidden-${path.basename(problematicPath)}-temp`);
        console.log(`📦 [SCORM Build] Ocultando pasta problemática: ${path.basename(problematicPath)}`);
        console.log(`   📁 Movendo de: ${problematicPath}`);
        console.log(`   📁 Para: ${hiddenPath}`);
        
        // Se já existe uma pasta oculta de um build anterior, remover primeiro
        if (await verifyPathExists(hiddenPath)) {
          console.log('   🧹 Removendo pasta oculta anterior...');
          await fs.rm(hiddenPath, { recursive: true, force: true });
        }
        
        await fs.rename(problematicPath, hiddenPath);
        console.log(`✅ [SCORM Build] Pasta ${path.basename(problematicPath)} ocultada com sucesso`);
        hiddenDirs.push(hiddenPath);
      }
    } catch (error) {
      console.error(`❌ [SCORM Build] Erro ao ocultar pasta ${problematicPath}:`, error);
    }
  }
  
  return hiddenDirs;
}

/**
 * Restaura as pastas problemáticas após o build estático
 */
async function restoreProblematicPages(hiddenDirs: string[]): Promise<void> {
  for (const hiddenDir of hiddenDirs) {
    try {
      const exists = await verifyPathExists(hiddenDir);
      if (exists) {
        // Extrair o nome original da pasta do nome oculto
        // .hidden-[id]-temp -> [id]
        // .hidden-pdf-preview-temp -> pdf-preview
        const dirName = path.basename(hiddenDir).replace('.hidden-', '').replace('-temp', '');
        
        // Determinar o caminho original baseado no nome da pasta
        let originalPath: string;
        if (dirName === '[id]') {
          originalPath = path.join(process.cwd(), 'src', 'app', 'cursos', dirName);
        } else if (dirName === 'pdf-preview') {
          originalPath = path.join(process.cwd(), 'src', 'app', dirName);
        } else {
          // Fallback: tentar em src/app
          originalPath = path.join(process.cwd(), 'src', 'app', dirName);
        }
        
        console.log(`📦 [SCORM Build] Restaurando pasta: ${dirName}`);
        // Se a pasta original já existe (caso de erro), remover primeiro
        if (await verifyPathExists(originalPath)) {
          await fs.rm(originalPath, { recursive: true, force: true });
        }
        await fs.rename(hiddenDir, originalPath);
        console.log(`✅ [SCORM Build] Pasta ${dirName} restaurada com sucesso`);
      }
    } catch (error) {
      console.error(`❌ [SCORM Build] Erro ao restaurar pasta ${hiddenDir}:`, error);
    }
  }
}

/**
 * Executa o build do Next.js programaticamente
 */
export async function executeNextBuild(
  curso: CursoGerado,
  cursoId: string
): Promise<void> {
  const buildTimeout = 10 * 60 * 1000; // 10 minutos

  console.log('📝 [SCORM Build] Salvando curso em arquivo temporário...');
  // Salvar curso em arquivo temporário
  const tempFile = await saveCursoForBuild(curso, cursoId);
  console.log(`✅ [SCORM Build] Curso salvo em: ${tempFile}`);

  // Ocultar todas as pastas de API durante o build estático
  const hiddenApiDirs = await hideApiRoutes();

  // Ocultar pastas problemáticas durante o build estático
  const hiddenPagesDirs = await hideProblematicPages();

  return new Promise((resolve, reject) => {
    console.log('🔨 [SCORM Build] Iniciando build do Next.js...');
    console.log(`📁 [SCORM Build] Diretório de trabalho: ${process.cwd()}`);
    
    // Configurar variáveis de ambiente para build estático
    const { TURBOPACK, ...envWithoutTurbopack } = process.env;
    const env: NodeJS.ProcessEnv = {
      ...envWithoutTurbopack,
      NODE_ENV: 'production' as const,
      NEXT_OUTPUT_EXPORT: 'true', // Flag customizada para ativar export
      SCORM_BUILD_CURSO_FILE: tempFile, // Arquivo temporário com curso
    };

    console.log('🔧 [SCORM Build] Variáveis de ambiente configuradas:');
    console.log(`   - NODE_ENV: ${env.NODE_ENV}`);
    console.log(`   - NEXT_OUTPUT_EXPORT: ${env.NEXT_OUTPUT_EXPORT}`);
    console.log(`   - SCORM_BUILD_CURSO_FILE: ${env.SCORM_BUILD_CURSO_FILE}`);

    // Executar build estático do Next.js
    const buildProcess = exec(
      'next build',
      { 
        env,
        cwd: process.cwd(),
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      },
      async (error, stdout, stderr) => {
        console.log('📋 [SCORM Build] Build finalizado, processando resultado...');

        // Restaurar pastas após build
        await restoreApiRoutes(hiddenApiDirs);
        await restoreProblematicPages(hiddenPagesDirs);

        // Remover arquivo temporário após build
        console.log('🧹 [SCORM Build] Removendo arquivo temporário do curso...');
        await removeCursoBuildFile(cursoId);

        if (error) {
          console.error('❌ [SCORM Build] Erro no build:', error);
          console.error('📋 [SCORM Build] stderr:', stderr);
          console.error('📋 [SCORM Build] stdout:', stdout);
          // Garantir que as pastas sejam restauradas mesmo em caso de erro
          await restoreApiRoutes(hiddenApiDirs);
          await restoreProblematicPages(hiddenPagesDirs);
          reject(new Error(`Build falhou: ${error.message}`));
          return;
        }

        console.log('✅ [SCORM Build] Build concluído com sucesso');
        console.log('📋 [SCORM Build] Output do build:');
        console.log(stdout);
        if (stderr) {
          console.log('⚠️ [SCORM Build] Warnings:');
          console.log(stderr);
        }
        resolve();
      }
    );

    // Logs durante o build
    buildProcess.stdout?.on('data', (data) => {
      console.log(`📦 [SCORM Build] ${data.toString().trim()}`);
    });

    buildProcess.stderr?.on('data', (data) => {
      console.log(`⚠️ [SCORM Build] ${data.toString().trim()}`);
    });

    // Timeout
    const timeout = setTimeout(() => {
      console.error('⏱️ [SCORM Build] Timeout após 10 minutos, encerrando processo...');
      buildProcess.kill();
      removeCursoBuildFile(cursoId);
      // Garantir que as pastas sejam restauradas mesmo em caso de timeout
      restoreApiRoutes(hiddenApiDirs);
      restoreProblematicPages(hiddenPagesDirs);
      reject(new Error('Build timeout após 10 minutos'));
    }, buildTimeout);

    buildProcess.on('exit', (code, signal) => {
      clearTimeout(timeout);
      console.log(`🔄 [SCORM Build] Processo finalizado com código: ${code}, sinal: ${signal}`);
    });
  });
}

/**
 * Verifica se o diretório out/ foi criado
 */
export async function verifyBuildOutput(): Promise<boolean> {
  const outDir = path.join(process.cwd(), 'out');
  console.log(`🔍 [SCORM Build] Verificando se diretório out/ existe: ${outDir}`);
  try {
    const stats = await fs.stat(outDir);
    const exists = stats.isDirectory();
    console.log(`✅ [SCORM Build] Diretório out/ ${exists ? 'existe' : 'não existe'}`);
    return exists;
  } catch (error) {
    console.log(`❌ [SCORM Build] Diretório out/ não encontrado:`, error);
    return false;
  }
}

/**
 * Copia arquivos do out/ para o ZIP SCORM
 */
export async function copyBuildFilesToZip(
  zip: JSZip,
  cursoId: string
): Promise<void> {
  console.log('📦 [SCORM Build] Iniciando cópia de arquivos para ZIP...');
  const outDir = path.join(process.cwd(), 'out');
  const scormPreviewDir = path.join(outDir, 'scorm-preview');
  const publicImagesDir = path.join(process.cwd(), 'public', 'scorm-images', cursoId);

  let filesAdded = 0;

  // Função recursiva para adicionar arquivos ao ZIP
  async function addDirectoryToZip(
    dirPath: string,
    zipPath: string
  ): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      console.log(`   📁 [SCORM Build] Processando diretório: ${dirPath} (${entries.length} entradas)`);

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const zipEntryPath = path.join(zipPath, entry.name).replace(/\\/g, '/');

        if (entry.isDirectory()) {
          await addDirectoryToZip(fullPath, zipEntryPath);
        } else {
          const content = await fs.readFile(fullPath);
          zip.file(zipEntryPath, content);
          filesAdded++;
          if (filesAdded % 10 === 0) {
            console.log(`   📄 [SCORM Build] ${filesAdded} arquivos adicionados ao ZIP...`);
          }
        }
      }
    } catch (error) {
      console.error(`❌ [SCORM Build] Erro ao copiar diretório ${dirPath}:`, error);
    }
  }

  // Copiar página principal do scorm-preview
  // O Next.js com output: 'export' gera páginas como [nome].html na raiz
  console.log(`📂 [SCORM Build] Copiando página principal scorm-preview.html...`);
  const scormPreviewHtmlFile = path.join(outDir, 'scorm-preview.html');
  if (await verifyPathExists(scormPreviewHtmlFile)) {
    let content = await fs.readFile(scormPreviewHtmlFile, 'utf-8');
    // Converter caminhos absolutos para relativos
    content = convertAbsolutePathsToRelative(content, '../');
    zip.file('scorm-preview/index.html', content);
    filesAdded++;
    console.log(`✅ [SCORM Build] scorm-preview.html copiado como scorm-preview/index.html (caminhos convertidos)`);
  } else {
    console.log(`⚠️ [SCORM Build] Arquivo scorm-preview.html não encontrado: ${scormPreviewHtmlFile}`);
  }

  // Copiar arquivos adicionais do diretório scorm-preview (se existir)
  console.log(`📂 [SCORM Build] Copiando arquivos do diretório scorm-preview/...`);
  if (await verifyPathExists(scormPreviewDir)) {
    // Copiar arquivos HTML das unidades com conversão de caminhos
    const unidadeDir = path.join(scormPreviewDir, 'unidade');
    if (await verifyPathExists(unidadeDir)) {
      const unidadeFiles = await fs.readdir(unidadeDir);
      for (const file of unidadeFiles) {
        if (file.endsWith('.html')) {
          const filePath = path.join(unidadeDir, file);
          let content = await fs.readFile(filePath, 'utf-8');
          // Converter caminhos absolutos para relativos (dois níveis acima: ../../)
          content = convertAbsolutePathsToRelative(content, '../../');
          zip.file(`scorm-preview/unidade/${file}`, content);
          filesAdded++;
        }
      }
      console.log(`✅ [SCORM Build] Arquivos HTML das unidades copiados com caminhos convertidos`);
    }

    // Copiar outros arquivos (txt, etc) sem conversão
    const entries = await fs.readdir(scormPreviewDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() && !entry.name.endsWith('.html')) {
        const fullPath = path.join(scormPreviewDir, entry.name);
        const content = await fs.readFile(fullPath);
        zip.file(`scorm-preview/${entry.name}`, content);
        filesAdded++;
      }
    }

    console.log(`✅ [SCORM Build] Arquivos do diretório scorm-preview copiados`);
  } else {
    console.log(`ℹ️ [SCORM Build] Diretório scorm-preview/ não existe (normal para build estático)`);
  }

  // Copiar assets estáticos (_next/static)
  console.log(`📂 [SCORM Build] Copiando assets estáticos (_next/static)...`);
  const nextStaticDir = path.join(outDir, '_next', 'static');
  if (await verifyPathExists(nextStaticDir)) {
    await addDirectoryToZip(nextStaticDir, '_next/static');
    console.log(`✅ [SCORM Build] Assets estáticos copiados`);
  } else {
    console.log(`⚠️ [SCORM Build] Diretório _next/static não encontrado: ${nextStaticDir}`);
  }

  // Copiar imagens baixadas
  console.log(`📂 [SCORM Build] Copiando imagens baixadas...`);
  if (await verifyPathExists(publicImagesDir)) {
    await addDirectoryToZip(publicImagesDir, 'scorm-images');
    console.log(`✅ [SCORM Build] Imagens copiadas`);
  } else {
    console.log(`⚠️ [SCORM Build] Diretório de imagens não encontrado: ${publicImagesDir}`);
  }

  // Copiar index.html do scorm-preview (página inicial do preview)
  // O Next.js com output: 'export' gera index.html em cada rota
  console.log(`📄 [SCORM Build] Copiando index.html...`);
  const scormIndexPath = path.join(outDir, 'scorm-preview', 'index.html');
  if (await verifyPathExists(scormIndexPath)) {
    const content = await fs.readFile(scormIndexPath);
    zip.file('index.html', content);
    console.log(`✅ [SCORM Build] index.html copiado de scorm-preview/index.html`);
  } else {
    // Se não existir, criar um index.html básico que redireciona
    console.log(`⚠️ [SCORM Build] index.html não encontrado, criando redirecionamento...`);
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
</html>`;
    zip.file('index.html', redirectHtml);
    console.log(`✅ [SCORM Build] index.html de redirecionamento criado`);
  }

  console.log(`✅ [SCORM Build] Cópia de arquivos concluída. Total: ${filesAdded} arquivos adicionados ao ZIP`);
}

/**
 * Verifica se um caminho existe
 */
async function verifyPathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Limpa arquivos temporários (imagens baixadas, diretório out/)
 */
export async function cleanupTempFiles(cursoId: string): Promise<void> {
  console.log('🧹 [SCORM Build] Iniciando limpeza de arquivos temporários...');
  try {
    // Limpar imagens baixadas
    const publicImagesDir = path.join(process.cwd(), 'public', 'scorm-images', cursoId);
    if (await verifyPathExists(publicImagesDir)) {
      console.log(`   🗑️ [SCORM Build] Removendo imagens de: ${publicImagesDir}`);
      await fs.rm(publicImagesDir, { recursive: true, force: true });
      console.log(`✅ [SCORM Build] Imagens removidas com sucesso`);
    } else {
      console.log(`ℹ️ [SCORM Build] Diretório de imagens não existe, nada para limpar`);
    }

    // Limpar arquivo temporário do curso
    const tempDir = path.join(process.cwd(), '.scorm-build');
    const tempFile = path.join(tempDir, `curso-${cursoId}.json`);
    if (await verifyPathExists(tempFile)) {
      console.log(`   🗑️ [SCORM Build] Removendo arquivo temporário do curso: ${tempFile}`);
      await fs.unlink(tempFile).catch(() => {});
      console.log(`✅ [SCORM Build] Arquivo temporário removido`);
    }

    // Limpar diretório out/ (opcional - pode querer manter para debug)
    // const outDir = path.join(process.cwd(), 'out');
    // if (await verifyPathExists(outDir)) {
    //   await fs.rm(outDir, { recursive: true, force: true });
    //   console.log(`🧹 Limpeza: diretório out/ removido`);
    // }
    
    console.log(`✅ [SCORM Build] Limpeza concluída`);
  } catch (error) {
    console.error('❌ [SCORM Build] Erro ao limpar arquivos temporários:', error);
    // Não falhar se a limpeza falhar
  }
}

