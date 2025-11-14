#!/usr/bin/env node

/**
 * Script Isolado para Geração de SCORM (Versão Simplificada)
 * 
 * Este script executa o build SCORM usando o processo atual, mas de forma isolada.
 * A chave é que ele executa o build e depois limpa o .next/ corrompido,
 * forçando o servidor de desenvolvimento a reconstruir na próxima requisição.
 * 
 * Uso:
 *   node generate-scorm-isolated.mjs <curso-json-file> <output-zip-path>
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Verifica se o servidor de desenvolvimento está rodando
 */
async function checkDevServerRunning() {
  try {
    // Verificar se há um processo next dev rodando
    const { execSync } = await import('child_process');
    try {
      execSync('lsof -ti:3000', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  } catch {
    return false;
  }
}

async function main() {
  const cursoJsonFile = process.argv[2];
  const outputZipPath = process.argv[3];

  if (!cursoJsonFile || !outputZipPath) {
    console.error('❌ Uso: node generate-scorm-isolated.mjs <curso-json-file> <output-zip-path>');
    process.exit(1);
  }

  // Verificar se o arquivo do curso existe
  try {
    await fs.access(cursoJsonFile);
  } catch (error) {
    console.error(`❌ [SCORM Isolated] Arquivo do curso não encontrado: ${cursoJsonFile}`);
    process.exit(1);
  }

  // Verificar se o servidor de desenvolvimento está rodando
  const devServerRunning = await checkDevServerRunning();
  if (devServerRunning) {
    console.log('\nℹ️  Servidor de desenvolvimento detectado na porta 3000.');
    console.log('   O build SCORM fará backup de .next/ e restaurará após o build.');
    console.log('   O servidor deve continuar funcionando normalmente.\n');
  }

  try {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📦 [SCORM Isolated] Iniciando geração isolada de SCORM...');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📁 Curso JSON: ${cursoJsonFile}`);
    console.log(`📦 Output ZIP: ${outputZipPath}`);

    // 1. Ler dados do curso
    console.log('\n📖 [SCORM Isolated] Lendo dados do curso...');
    const cursoData = JSON.parse(await fs.readFile(cursoJsonFile, 'utf-8'));
    const cursoId = cursoData.id || 'temp';
    console.log(`✅ Curso: ${cursoData.titulo} (${cursoData.unidades?.length || 0} unidades)`);

    // 2. Salvar curso no local esperado pelo build
    const tempDir = path.join(process.cwd(), '.scorm-build');
    const tempCursoFile = path.join(tempDir, `curso-${cursoId}.json`);
    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(tempCursoFile, JSON.stringify(cursoData, null, 2));
    console.log(`✅ Curso salvo em: ${tempCursoFile}`);

    // 3. Executar build isolado (em subprocesso)
    console.log('\n🔨 [SCORM Isolated] Executando build isolado...');
    await executeIsolatedBuild(tempCursoFile);
    console.log('✅ Build concluído');

    // 4. Verificar se out/ foi criado
    console.log('\n🔍 [SCORM Isolated] Verificando build output...');
    const outDir = path.join(process.cwd(), 'out');
    const buildExists = await pathExists(outDir);
    if (!buildExists) {
      throw new Error('Build não foi criado. Diretório out/ não encontrado.');
    }
    console.log('✅ Build verificado');

    // 5. Criar ZIP SCORM
    console.log('\n📦 [SCORM Isolated] Criando pacote ZIP SCORM...');
    await createSCORMZip(outputZipPath, cursoData, cursoId);
    console.log('✅ ZIP SCORM criado');

    // 6. Limpar arquivo temporário do curso
    console.log('\n🧹 [SCORM Isolated] Limpando arquivo temporário...');
    await fs.unlink(tempCursoFile).catch(() => {});
    console.log('✅ Limpeza concluída');

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(`✅ [SCORM Isolated] SCORM gerado com sucesso: ${outputZipPath}`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('✅ O diretório .next/ foi restaurado do backup.');
    console.log('✅ O servidor de desenvolvimento deve continuar funcionando normalmente.');
    console.log('');
    console.log('ℹ️  NOTA: O diretório out/ foi criado e contém os arquivos estáticos.');
    console.log('   Você pode removê-lo se quiser: rm -rf out');
    console.log('═══════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n❌ [SCORM Isolated] ERRO:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Wrapper para capturar erros não tratados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ [SCORM Isolated] Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ [SCORM Isolated] Uncaught Exception:', error);
  process.exit(1);
});

/**
 * Verifica se um caminho existe
 */
async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Oculta pastas de API antes do build
 */
async function hideApiRoutes() {
  const appDir = path.join(process.cwd(), 'src', 'app');
  const hiddenDirs = [];

  try {
    const entries = await fs.readdir(appDir, { withFileTypes: true });
    const apiDirs = entries
      .filter(entry => entry.isDirectory() && entry.name.startsWith('api'))
      .map(entry => entry.name);

    if (apiDirs.length === 0) {
      console.log('   ℹ️ Nenhuma pasta de API encontrada');
      return hiddenDirs;
    }

    console.log(`   📦 Ocultando ${apiDirs.length} pasta(s) de API...`);

    for (const apiDirName of apiDirs) {
      const apiDir = path.join(appDir, apiDirName);
      const hiddenApiDir = path.join(process.cwd(), `.${apiDirName}-hidden-temp`);

      if (await pathExists(hiddenApiDir)) {
        await fs.rm(hiddenApiDir, { recursive: true, force: true });
      }

      await fs.rename(apiDir, hiddenApiDir);
      console.log(`   ✅ Pasta /${apiDirName} ocultada`);
      hiddenDirs.push(hiddenApiDir);
    }
  } catch (error) {
    console.error(`   ❌ Erro ao ocultar pastas de API:`, error);
  }

  return hiddenDirs;
}

/**
 * Restaura pastas de API após o build
 */
async function restoreApiRoutes(hiddenApiDirs) {
  if (!hiddenApiDirs || hiddenApiDirs.length === 0) return;

  const appDir = path.join(process.cwd(), 'src', 'app');

  for (const hiddenApiDir of hiddenApiDirs) {
    try {
      if (await pathExists(hiddenApiDir)) {
        const dirBaseName = path.basename(hiddenApiDir);
        const apiDirName = dirBaseName.replace(/^\./, '').replace(/-hidden-temp$/, '');
        const apiDir = path.join(appDir, apiDirName);

        if (await pathExists(apiDir)) {
          await fs.rm(apiDir, { recursive: true, force: true });
        }

        await fs.rename(hiddenApiDir, apiDir);
        console.log(`   ✅ Pasta /${apiDirName} restaurada`);
      }
    } catch (error) {
      console.error(`   ❌ Erro ao restaurar pasta:`, error);
    }
  }
}

/**
 * Oculta pastas problemáticas antes do build
 */
async function hideProblematicPages() {
  const hiddenDirs = [];
  const problematicPaths = [
    path.join(process.cwd(), 'src', 'app', 'cursos', '[id]'),
    path.join(process.cwd(), 'src', 'app', 'pdf-preview'),
  ];

  for (const problematicPath of problematicPaths) {
    try {
      if (await pathExists(problematicPath)) {
        const hiddenPath = path.join(process.cwd(), `.hidden-${path.basename(problematicPath)}-temp`);
        
        if (await pathExists(hiddenPath)) {
          await fs.rm(hiddenPath, { recursive: true, force: true });
        }

        await fs.rename(problematicPath, hiddenPath);
        console.log(`   ✅ Pasta ${path.basename(problematicPath)} ocultada`);
        hiddenDirs.push(hiddenPath);
      }
    } catch (error) {
      console.error(`   ❌ Erro ao ocultar pasta:`, error);
    }
  }

  return hiddenDirs;
}

/**
 * Restaura pastas problemáticas após o build
 */
async function restoreProblematicPages(hiddenDirs) {
  for (const hiddenDir of hiddenDirs) {
    try {
      if (await pathExists(hiddenDir)) {
        const dirName = path.basename(hiddenDir).replace('.hidden-', '').replace('-temp', '');
        let originalPath;

        if (dirName === '[id]') {
          originalPath = path.join(process.cwd(), 'src', 'app', 'cursos', dirName);
        } else if (dirName === 'pdf-preview') {
          originalPath = path.join(process.cwd(), 'src', 'app', dirName);
        } else {
          originalPath = path.join(process.cwd(), 'src', 'app', dirName);
        }

        if (await pathExists(originalPath)) {
          await fs.rm(originalPath, { recursive: true, force: true });
        }

        await fs.rename(hiddenDir, originalPath);
        console.log(`   ✅ Pasta ${dirName} restaurada`);
      }
    } catch (error) {
      console.error(`   ❌ Erro ao restaurar pasta:`, error);
    }
  }
}

/**
 * Faz backup do diretório .next/ antes do build
 */
async function backupNextDir() {
  const nextDir = path.join(process.cwd(), '.next');
  const backupDir = path.join(process.cwd(), '.next-backup-scorm');
  
  if (await pathExists(nextDir)) {
    console.log('   💾 Fazendo backup de .next/ antes do build...');
    // Remover backup anterior se existir
    if (await pathExists(backupDir)) {
      await fs.rm(backupDir, { recursive: true, force: true });
    }
    // Copiar .next/ para backup
    await fs.cp(nextDir, backupDir, { recursive: true });
    console.log('   ✅ Backup de .next/ criado');
    return backupDir;
  }
  return null;
}

/**
 * Restaura o backup do .next/ após o build
 */
async function restoreNextDir(backupDir) {
  if (!backupDir || !(await pathExists(backupDir))) {
    return;
  }

  const nextDir = path.join(process.cwd(), '.next');
  console.log('   🔄 Restaurando .next/ do backup...');

  // Remover .next/ atual (criado pelo build SCORM)
  if (await pathExists(nextDir)) {
    await fs.rm(nextDir, { recursive: true, force: true });
  }

  // Restaurar backup
  await fs.cp(backupDir, nextDir, { recursive: true });

  // Limpar cache do webpack para evitar erros
  const cacheDir = path.join(nextDir, 'cache', 'webpack');
  if (await pathExists(cacheDir)) {
    console.log('   🧹 Limpando cache do webpack...');
    await fs.rm(cacheDir, { recursive: true, force: true });
    console.log('   ✅ Cache do webpack limpo');
  }

  // Remover backup
  await fs.rm(backupDir, { recursive: true, force: true });
  console.log('   ✅ .next/ restaurado');

  // Aguardar alguns segundos para o Next.js processar as mudanças
  console.log('   ⏳ Aguardando Next.js reprocessar arquivos (3s)...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  console.log('   ✅ Servidor deve estar pronto novamente');
}

/**
 * Executa o build isolado em um subprocesso
 */
async function executeIsolatedBuild(cursoFile) {
  // Fazer backup do .next/ antes do build para não corromper o servidor
  const backupDir = await backupNextDir();
  
  // Ocultar pastas problemáticas antes do build
  console.log('   📦 Ocultando pastas problemáticas...');
  const hiddenApiDirs = await hideApiRoutes();
  const hiddenPagesDirs = await hideProblematicPages();

  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      NODE_ENV: 'production',
      NEXT_OUTPUT_EXPORT: 'true',
      SCORM_BUILD_CURSO_FILE: cursoFile,
    };

    console.log('   🔧 Variáveis de ambiente configuradas');
    console.log(`   📁 Diretório de trabalho: ${process.cwd()}`);
    console.log('   💾 Backup de .next/ foi criado - será restaurado após o build');

    // Executar build em subprocesso isolado
    console.log('   🔨 Executando next build...');
    console.log('   📍 Diretório atual:', process.cwd());
    console.log('   🔧 NODE_ENV:', env.NODE_ENV);
    console.log('   🔧 NEXT_OUTPUT_EXPORT:', env.NEXT_OUTPUT_EXPORT);
    
    const buildProcess = spawn('pnpm', ['next', 'build', '--no-lint'], {
      cwd: process.cwd(),
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false, // Não usar shell para evitar problemas com espaços
    });

    let buildStdout = '';
    let buildStderr = '';

    buildProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      buildStdout += output;
      console.log(`   [Build] ${output.trim()}`);
    });

    buildProcess.stderr?.on('data', (data) => {
      const output = data.toString();
      buildStderr += output;
      console.error(`   [Build Error] ${output.trim()}`);
    });

    buildProcess.on('close', async (code) => {
      // Restaurar .next/ do backup ANTES de restaurar pastas
      await restoreNextDir(backupDir);
      
      // Restaurar pastas após build (mesmo em caso de erro)
      console.log('   📦 Restaurando pastas...');
      await restoreApiRoutes(hiddenApiDirs).catch(err => {
        console.error(`   ⚠️ Erro ao restaurar API routes:`, err);
      });
      await restoreProblematicPages(hiddenPagesDirs).catch(err => {
        console.error(`   ⚠️ Erro ao restaurar páginas:`, err);
      });

      if (code === 0) {
        resolve();
      } else {
        const errorMsg = `Build falhou com código ${code}\n\nSTDOUT:\n${buildStdout}\n\nSTDERR:\n${buildStderr}`;
        console.error(`   ❌ [Build] ${errorMsg}`);
        reject(new Error(errorMsg));
      }
    });

    buildProcess.on('error', async (error) => {
      // Restaurar .next/ do backup em caso de erro
      await restoreNextDir(backupDir);
      
      // Restaurar pastas em caso de erro
      console.log('   📦 Restaurando pastas após erro...');
      await restoreApiRoutes(hiddenApiDirs).catch(() => {});
      await restoreProblematicPages(hiddenPagesDirs).catch(() => {});
      reject(error);
    });
  });
}

/**
 * Cria o pacote ZIP SCORM
 */
async function createSCORMZip(outputPath, curso, cursoId) {
  const zip = new JSZip();
  const outDir = path.join(process.cwd(), 'out');
  const publicImagesDir = path.join(process.cwd(), 'public', 'scorm-images', cursoId);

  // Importar funções do scorm-service (usando caminho relativo)
  const scormServicePath = path.join(process.cwd(), 'src', 'lib', 'scorm-service.ts');
  
  // Como estamos em Node.js puro, vamos usar require com compilação TypeScript
  // Ou melhor, vamos usar as funções diretamente do código compilado
  // Por enquanto, vamos usar uma abordagem diferente: importar via require após build
  
  // Para simplificar, vamos usar as funções inline ou importar de forma diferente
  // Vou criar as funções necessárias aqui mesmo ou importar do build
  
  // Por enquanto, vamos usar require dinâmico se o arquivo estiver compilado
  // Ou vamos usar as funções do scorm-service diretamente
  
  // Solução: vamos usar o mesmo código que está em scorm-service.ts
  // Mas como estamos em Node.js puro, vamos precisar compilar ou usar uma versão JS
  
  // Por enquanto, vamos usar uma abordagem mais simples: chamar a API route
  // Ou melhor, vamos importar as funções do módulo TypeScript compilado
  
  // Solução prática: vamos usar eval ou require com ts-node
  // Mas isso é complexo. Vamos usar uma abordagem diferente:
  // Vamos usar o mesmo código que está em scorm-build-service.ts
  
  // Na verdade, a melhor solução é usar o módulo já existente
  // Vamos importar usando require com o caminho do build ou usar tsx
  
  // Por enquanto, vamos criar as funções básicas aqui
  const manifestContent = generateManifestSimple(curso);
  zip.file('imsmanifest.xml', manifestContent);

  const wrapperContent = generateScormWrapperSimple();
  zip.file('scorm_api_wrapper.js', wrapperContent);

  // Copiar arquivos do build
  await copyBuildFilesToZip(zip, outDir, publicImagesDir, curso);

  // Gerar ZIP
  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  // Salvar arquivo
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, zipBuffer);
}

/**
 * Gera manifesto SCORM simples
 */
function generateManifestSimple(curso) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="curso_${curso.id}" version="1.0"
          xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
          xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
    <adlcp:location>index.html</adlcp:location>
    <lom>
      <general>
        <title><langstring>${curso.titulo}</langstring></title>
        <description><langstring>${curso.descricao || ''}</langstring></description>
      </general>
    </lom>
  </metadata>
  <organizations default="org_default">
    <organization identifier="org_default" structure="hierarchical">
      <title>${curso.titulo}</title>
      <!-- Página inicial do curso (primeiro item, mesmo nível que as unidades) -->
      <item identifier="item_index" identifierref="resource_index" isvisible="true">
        <title>Página Inicial</title>
      </item>
      <!-- Unidades do curso (mesmo nível que a página inicial) -->
      ${(curso.unidades || []).map((unidade, index) => `
      <item identifier="${unidade.id}" identifierref="resource_${unidade.id}" isvisible="true">
        <title>Unidade ${index + 1}: ${unidade.titulo}</title>
      </item>
      `).join('')}
    </organization>
  </organizations>
  <resources>
    <!-- Recurso principal: página inicial (deve ser SCO para ser o ponto de entrada) -->
    <resource identifier="resource_index" type="webcontent"
              adlcp:scormtype="sco" href="index.html">
      <file href="index.html"/>
      <file href="scorm_api_wrapper.js"/>
      <dependency identifierref="common_files"/>
    </resource>
    ${(curso.unidades || []).map(unidade => `
    <resource identifier="resource_${unidade.id}" type="webcontent"
              adlcp:scormtype="sco" href="scorm-preview/unidade/${unidade.id}.html">
      <file href="scorm-preview/unidade/${unidade.id}.html"/>
      <file href="scorm_api_wrapper.js"/>
      <dependency identifierref="common_files"/>
    </resource>
    `).join('')}
    <!-- Recursos comuns -->
    <resource identifier="common_files" type="webcontent" adlcp:scormtype="asset">
      <file href="scorm_api_wrapper.js"/>
    </resource>
  </resources>
</manifest>`;
}

/**
 * Gera SCORM API wrapper simples
 */
function generateScormWrapperSimple() {
  return `
// SCORM 1.2 API Wrapper
var API = null;

function findAPI(win) {
  while (win.API == null && win.parent != null && win.parent != win) {
    win = win.parent;
  }
  return win.API;
}

function getAPI() {
  if (API == null) {
    API = findAPI(window);
  }
  return API;
}

function initSCORM() {
  console.log('[SCORM-WRAPPER] initSCORM chamado');
  var api = getAPI();
  if (api != null) {
    console.log('[SCORM-WRAPPER] API encontrada, inicializando...');
    try {
      var initResult = api.LMSInitialize("");
      console.log('[SCORM-WRAPPER] LMSInitialize resultado:', initResult);
      if (initResult === 'true' || initResult === true) {
        api.LMSSetValue("cmi.core.lesson_status", "incomplete");
        console.log('[SCORM-WRAPPER] ✅ SCORM inicializado com sucesso');
      } else {
        console.warn('[SCORM-WRAPPER] ⚠️ LMSInitialize retornou:', initResult);
      }
    } catch (error) {
      console.error('[SCORM-WRAPPER] ❌ Erro ao inicializar SCORM:', error);
    }
  } else {
    console.warn('[SCORM-WRAPPER] ⚠️ API não encontrada');
  }
}

function finishSCORM() {
  var api = getAPI();
  if (api != null) {
    api.LMSSetValue("cmi.core.lesson_status", "completed");
    api.LMSFinish("");
  }
}

window.addEventListener('load', initSCORM);
window.addEventListener('beforeunload', finishSCORM);
`;
}

/**
 * Copia arquivos do build para o ZIP
 */
async function copyBuildFilesToZip(zip, outDir, publicImagesDir, curso) {
  // Função auxiliar para verificar se um arquivo é relacionado a PDF
  function isPDFRelated(fileName) {
    const lower = fileName.toLowerCase();
    return lower.includes('pdf') || 
           lower.includes('pdftemplate') ||
           lower.includes('generatepdf') ||
           lower.includes('pdf-preview');
  }

  async function addDirectoryToZip(dirPath, zipPath) {
    if (!(await pathExists(dirPath))) return;

    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const zipEntryPath = path.join(zipPath, entry.name).replace(/\\/g, '/');

      // Pular arquivos relacionados a PDF
      if (isPDFRelated(entry.name)) {
        console.log(`   ⏭️  Pulando arquivo relacionado a PDF: ${entry.name}`);
        continue;
      }

      if (entry.isDirectory()) {
        await addDirectoryToZip(fullPath, zipEntryPath);
      } else {
        const content = await fs.readFile(fullPath);
        zip.file(zipEntryPath, content);
      }
    }
  }

  // Converter caminhos absolutos para relativos
  function convertPaths(html, prefix) {
    return html
      .replace(/href="\/_next\//g, `href="${prefix}_next/`)
      .replace(/src="\/_next\//g, `src="${prefix}_next/`)
      .replace(/href="\/favicon\.ico/g, `href="${prefix}favicon.ico`);
  }

  // Copiar APENAS arquivos do scorm-preview (nada de PDF)
  console.log('   📦 Copiando arquivos do preview SCORM...');
  
  // Função para injetar dados do curso no HTML
  function injectCursoData(html, cursoData) {
    const cursoDataScript = `
  <script>
    // Dados do curso injetados durante o build SCORM
    window.__SCORM_CURSO_DATA__ = ${JSON.stringify(cursoData)};
    console.log('[SCORM] Dados do curso carregados:', window.__SCORM_CURSO_DATA__);
  </script>`;

    // Injetar antes do </head> para garantir que esteja disponível quando o componente montar
    return html.replace('</head>', `${cursoDataScript}\n</head>`);
  }

  // Copiar scorm-preview.html como index
  const scormPreviewHtml = path.join(outDir, 'scorm-preview.html');
  if (await pathExists(scormPreviewHtml)) {
    let content = await fs.readFile(scormPreviewHtml, 'utf-8');
    // Remover qualquer referência a PDF do HTML
    content = content.replace(/pdf-preview/gi, '');
    content = content.replace(/generatePDF/gi, '');
    content = convertPaths(content, '../');
    // Injetar dados do curso
    content = injectCursoData(content, curso);
    zip.file('scorm-preview/index.html', content);
    console.log('   ✅ scorm-preview.html copiado com dados do curso injetados');
  }

  // Copiar arquivos HTML das unidades (apenas scorm-preview)
  const unidadeDir = path.join(outDir, 'scorm-preview', 'unidade');
  if (await pathExists(unidadeDir)) {
    const files = await fs.readdir(unidadeDir);
    let unitFilesCount = 0;
    for (const file of files) {
      if (file.endsWith('.html') && !file.includes('pdf')) {
        let content = await fs.readFile(path.join(unidadeDir, file), 'utf-8');
        // Remover qualquer referência a PDF do HTML
        content = content.replace(/pdf-preview/gi, '');
        content = content.replace(/generatePDF/gi, '');
        content = convertPaths(content, '../../');
        // Garantir que o script SCORM wrapper está incluído
        if (!content.includes('scorm_api_wrapper.js')) {
          content = content.replace('</head>', `
  <script src="../../scorm_api_wrapper.js"></script>
</head>`);
        }
        // Injetar dados do curso
        content = injectCursoData(content, curso);
        zip.file(`scorm-preview/unidade/${file}`, content);
        unitFilesCount++;
      }
    }
    console.log(`   ✅ ${unitFilesCount} arquivo(s) HTML de unidades copiado(s) com dados do curso injetados`);
  }

  // Copiar _next/static (apenas arquivos necessários para scorm-preview)
  // Filtrar para evitar incluir código de PDF ou outras páginas não relacionadas
  const nextStaticDir = path.join(outDir, '_next', 'static');
  if (await pathExists(nextStaticDir)) {
    console.log('   📦 Copiando assets estáticos (filtrando apenas scorm-preview)...');
    
    // Função para copiar apenas chunks relacionados ao scorm-preview
    async function addFilteredStaticFiles(dirPath, zipPath) {
      if (!(await pathExists(dirPath))) return;

      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const zipEntryPath = path.join(zipPath, entry.name).replace(/\\/g, '/');

        if (entry.isDirectory()) {
          // Copiar diretórios de chunks, css, media, etc.
          await addFilteredStaticFiles(fullPath, zipEntryPath);
        } else {
          // Filtrar arquivos: incluir apenas se não for relacionado a PDF
          const fileName = entry.name.toLowerCase();
          const shouldExclude = 
            fileName.includes('pdf') || 
            fileName.includes('pdf-preview') ||
            fileName.includes('pdftemplate') ||
            fileName.includes('generatepdf');
          
          if (!shouldExclude) {
            const content = await fs.readFile(fullPath);
            zip.file(zipEntryPath, content);
          } else {
            console.log(`   ⏭️  Pulando arquivo relacionado a PDF: ${entry.name}`);
          }
        }
      }
    }
    
    await addFilteredStaticFiles(nextStaticDir, '_next/static');
    console.log('   ✅ Assets estáticos copiados (filtrados)');
  }

  // Copiar imagens (apenas imagens do curso, nada de PDF)
  if (await pathExists(publicImagesDir)) {
    console.log('   📦 Copiando imagens do curso...');
    await addDirectoryToZip(publicImagesDir, 'scorm-images');
    console.log('   ✅ Imagens copiadas');
  }

  // Verificar se há arquivos PDF no out/ que não deveriam estar lá
  console.log('   🔍 Verificando se há arquivos PDF no build...');
  const pdfPreviewDir = path.join(outDir, 'pdf-preview');
  if (await pathExists(pdfPreviewDir)) {
    console.log('   ⚠️  ATENÇÃO: Diretório pdf-preview encontrado em out/ (não deveria estar aqui)');
    console.log('   ⚠️  Este diretório será IGNORADO no ZIP SCORM');
  }

  // Criar index.html principal (página inicial do curso)
  // Este será o ponto de entrada do SCORM - DEVE estar na raiz
  console.log('   📄 Criando index.html principal (ponto de entrada do SCORM)...');
  
  // Primeiro, tentar usar scorm-preview.html (gerado pelo Next.js)
  const scormPreviewHtmlPath = path.join(outDir, 'scorm-preview.html');
  const scormPreviewIndexPath = path.join(outDir, 'scorm-preview', 'index.html');
  
  let indexContent = null;
  
  if (await pathExists(scormPreviewHtmlPath)) {
    console.log('   📄 Usando scorm-preview.html como base...');
    indexContent = await fs.readFile(scormPreviewHtmlPath, 'utf-8');
  } else if (await pathExists(scormPreviewIndexPath)) {
    console.log('   📄 Usando scorm-preview/index.html como base...');
    indexContent = await fs.readFile(scormPreviewIndexPath, 'utf-8');
  }
  
  if (indexContent) {
    // Remover referências a PDF
    indexContent = indexContent.replace(/pdf-preview/gi, '');
    indexContent = indexContent.replace(/generatePDF/gi, '');
    // Converter caminhos absolutos para relativos (raiz)
    indexContent = convertPaths(indexContent, '');
    // Garantir que o script SCORM wrapper está incluído
    if (!indexContent.includes('scorm_api_wrapper.js')) {
      indexContent = indexContent.replace('</head>', `
  <script src="scorm_api_wrapper.js"></script>
</head>`);
    }
    zip.file('index.html', indexContent);
    console.log('   ✅ index.html principal criado na raiz (página inicial do curso)');
  } else {
    // Fallback: criar redirecionamento se não encontrar o arquivo
    console.log('   ⚠️  Arquivos do preview não encontrados, criando redirecionamento...');
    const redirectHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=scorm-preview/index.html">
  <title>SCORM Course</title>
  <script src="scorm_api_wrapper.js"></script>
</head>
<body>
  <p>Redirecionando... <a href="scorm-preview/index.html">Clique aqui</a></p>
</body>
</html>`;
    zip.file('index.html', redirectHtml);
  }
  
  console.log('   ✅ Arquivos do preview SCORM copiados (PDF excluído)');
}

// Executar
main().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

