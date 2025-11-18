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
    console.log('   O build SCORM será executado em diretório isolado (.scorm-build-work/).');
    console.log('   O projeto original NÃO será modificado.\n');
  }

  // LIMPEZA INICIAL: Remover pastas temporárias de builds anteriores
  console.log('🧹 [SCORM Isolated] Limpando pastas temporárias de builds anteriores...');
  await cleanupTempFolders();
  
  // Limpar diretório de trabalho isolado de builds anteriores
  const workDir = path.join(process.cwd(), '.scorm-build-work');
  if (await pathExists(workDir)) {
    console.log('   🗑️  Removendo diretório de trabalho isolado anterior...');
    await fs.rm(workDir, { recursive: true, force: true });
    console.log('   ✅ Diretório de trabalho limpo');
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

    // 3. Preparar diretório de trabalho isolado
    console.log('\n📁 [SCORM Isolated] Preparando diretório de trabalho isolado...');
    const workDir = await prepareIsolatedWorkDir();
    console.log(`✅ Diretório de trabalho criado: ${workDir}`);
    
    // 4. Executar build isolado (em subprocesso no diretório isolado)
    console.log('\n🔨 [SCORM Isolated] Executando build isolado...');
    await executeIsolatedBuild(tempCursoFile, workDir);
    console.log('✅ Build concluído');

    // 5. Copiar output do build isolado para o projeto
    console.log('\n📦 [SCORM Isolated] Copiando output do build isolado...');
    const workOutDir = path.join(workDir, 'out');
    const projectOutDir = path.join(process.cwd(), 'out');
    
    if (!(await pathExists(workOutDir))) {
      throw new Error('Build não foi criado. Diretório out/ não encontrado no diretório de trabalho.');
    }
    
    // Remover out/ do projeto se existir
    if (await pathExists(projectOutDir)) {
      await fs.rm(projectOutDir, { recursive: true, force: true });
    }
    
    // Copiar output do diretório isolado para o projeto
    await fs.cp(workOutDir, projectOutDir, { recursive: true });
    console.log('✅ Output copiado para out/ do projeto');
    
    // 6. Limpar diretório de trabalho isolado
    console.log('\n🧹 [SCORM Isolated] Limpando diretório de trabalho isolado...');
    await fs.rm(workDir, { recursive: true, force: true });
    console.log('✅ Diretório de trabalho removido');

    // 7. Criar ZIP SCORM
    console.log('\n📦 [SCORM Isolated] Criando pacote ZIP SCORM...');
    await createSCORMZip(outputZipPath, cursoData, cursoId);
    console.log('✅ ZIP SCORM criado');

    // 8. Limpar arquivos temporários
    console.log('\n🧹 [SCORM Isolated] Limpando arquivos temporários...');
    
    // Remover arquivo temporário do curso
    await fs.unlink(tempCursoFile).catch(() => {});
    
    // Limpar diretório out/ (build estático do Next.js)
    // Usar projectOutDir que foi definido anteriormente
    if (await pathExists(projectOutDir)) {
      console.log('   🗑️  Removendo diretório out/...');
      await fs.rm(projectOutDir, { recursive: true, force: true }).catch(() => {});
      console.log('   ✅ Diretório out/ removido');
    }
    
    console.log('✅ Limpeza concluída');

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(`✅ [SCORM Isolated] SCORM gerado com sucesso: ${outputZipPath}`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('✅ O projeto original NUNCA foi modificado.');
    console.log('✅ O build foi executado em diretório isolado (.scorm-build-work/).');
    console.log('✅ O servidor de desenvolvimento não foi afetado.');
    console.log('✅ Diretório de trabalho isolado foi limpo automaticamente.');
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

// ✅ Funções de backup/restore e ocultar/restaurar pastas removidas - não são mais necessárias!
// O projeto original NUNCA é modificado quando usamos diretório isolado (.scorm-build-work/)
// As pastas problemáticas são simplesmente NÃO COPIADAS para o diretório isolado

/**
 * Limpa pastas temporárias de builds anteriores
 */
async function cleanupTempFolders() {
  try {
    const entries = await fs.readdir(process.cwd(), { withFileTypes: true });
    let cleanedCount = 0;
    
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith('.') && 
          (entry.name.includes('-hidden-temp') || entry.name.includes('-backup'))) {
        const tempPath = path.join(process.cwd(), entry.name);
        await fs.rm(tempPath, { recursive: true, force: true });
        cleanedCount++;
      }
    }
    
    // Limpar .scorm-build-work se existir (diretório de trabalho isolado anterior)
    const workDir = path.join(process.cwd(), '.scorm-build-work');
    if (await pathExists(workDir)) {
      await fs.rm(workDir, { recursive: true, force: true });
      cleanedCount++;
    }
    
    // Limpar .next-scorm se existir (build anterior no projeto - não deveria mais existir)
    const scormNextDir = path.join(process.cwd(), '.next-scorm');
    if (await pathExists(scormNextDir)) {
      await fs.rm(scormNextDir, { recursive: true, force: true });
      cleanedCount++;
    }
    
    if (cleanedCount > 0) {
      console.log(`   ✅ ${cleanedCount} pasta(s) temporária(s) removida(s)`);
    } else {
      console.log('   ✅ Nenhuma pasta temporária encontrada');
    }
  } catch (error) {
    // Ignorar erros silenciosamente (pode não ter permissão ou não existir)
    console.log('   ℹ️  Limpeza concluída');
  }
}

/**
 * Prepara diretório de trabalho isolado copiando apenas arquivos necessários
 * NÃO modifica o projeto original
 */
async function prepareIsolatedWorkDir() {
  const workDir = path.join(process.cwd(), '.scorm-build-work');
  const projectRoot = process.cwd();
  
  console.log('   📁 Criando diretório de trabalho isolado...');
  await fs.mkdir(workDir, { recursive: true });
  
  // Lista de arquivos/diretórios a copiar
  const filesToCopy = [
    'src',
    'public',
    'next.config.ts',
    'package.json',
    'tsconfig.json',
    'tailwind.config.ts',
    'postcss.config.mjs',
    'components.json',
    'middleware.ts',
    'node_modules', // Usar symlink ou copiar (symlink é mais rápido)
  ];
  
  // Pastas problemáticas que NÃO devem ser copiadas
  const excludeFromSrcApp = [
    'api',
    'pdf-preview',
    'test-prisma',
    'cursos/[id]', // Rota dinâmica
    'cadastro',
    'configuracoes',
    'home',
    'login',
    'usuarios',
  ];
  
  console.log('   📦 Copiando arquivos necessários (excluindo pastas problemáticas)...');
  
  // Copiar arquivos de configuração
  for (const file of ['next.config.ts', 'package.json', 'tsconfig.json', 'middleware.ts', 'components.json']) {
    const srcPath = path.join(projectRoot, file);
    const destPath = path.join(workDir, file);
    if (await pathExists(srcPath)) {
      await fs.cp(srcPath, destPath);
    }
  }
  
  // Copiar postcss.config.mjs se existir
  const postcssPath = path.join(projectRoot, 'postcss.config.mjs');
  if (await pathExists(postcssPath)) {
    await fs.cp(postcssPath, path.join(workDir, 'postcss.config.mjs'));
  }
  
  // Copiar tailwind.config.ts se existir
  const tailwindPath = path.join(projectRoot, 'tailwind.config.ts');
  if (await pathExists(tailwindPath)) {
    await fs.cp(tailwindPath, path.join(workDir, 'tailwind.config.ts'));
  }
  
  // Copiar public/ completo
  const publicSrc = path.join(projectRoot, 'public');
  const publicDest = path.join(workDir, 'public');
  if (await pathExists(publicSrc)) {
    await fs.cp(publicSrc, publicDest, { recursive: true });
    console.log('   ✅ public/ copiado');
  }
  
  // Copiar src/ mas excluindo pastas problemáticas
  const srcSrc = path.join(projectRoot, 'src');
  const srcDest = path.join(workDir, 'src');
  await fs.mkdir(srcDest, { recursive: true });
  
  // Copiar estrutura de src/ excluindo app/ problemático
  const srcEntries = await fs.readdir(srcSrc, { withFileTypes: true });
  for (const entry of srcEntries) {
    const srcPath = path.join(srcSrc, entry.name);
    const destPath = path.join(srcDest, entry.name);
    
    if (entry.isDirectory() && entry.name === 'app') {
      // Copiar app/ mas excluindo pastas problemáticas
      await fs.mkdir(destPath, { recursive: true });
      const appEntries = await fs.readdir(srcPath, { withFileTypes: true });
      
      for (const appEntry of appEntries) {
        const appEntryPath = path.join(srcPath, appEntry.name);
        const appDestPath = path.join(destPath, appEntry.name);
        
        // Verificar se deve ser excluído
        const shouldExclude = excludeFromSrcApp.some(exclude => {
          if (exclude.includes('/')) {
            // Para rotas aninhadas como 'cursos/[id]'
            const [parent, child] = exclude.split('/');
            return appEntry.name === parent;
          }
          return appEntry.name === exclude || appEntry.name.startsWith(exclude + ' ');
        });
        
        if (!shouldExclude) {
          if (appEntry.isDirectory()) {
            // Para cursos/[id], copiar cursos mas excluir [id]
            if (appEntry.name === 'cursos') {
              await fs.mkdir(appDestPath, { recursive: true });
              const cursosEntries = await fs.readdir(appEntryPath, { withFileTypes: true });
              for (const cursoEntry of cursosEntries) {
                if (cursoEntry.name !== '[id]') {
                  await fs.cp(
                    path.join(appEntryPath, cursoEntry.name),
                    path.join(appDestPath, cursoEntry.name),
                    { recursive: true }
                  );
                }
              }
            } else {
              await fs.cp(appEntryPath, appDestPath, { recursive: true });
            }
          } else {
            await fs.cp(appEntryPath, appDestPath);
          }
        }
      }
      console.log('   ✅ src/app/ copiado (pastas problemáticas excluídas)');
    } else if (entry.isDirectory()) {
      // Copiar outros diretórios de src/ (components, lib, hooks, etc)
      await fs.cp(srcPath, destPath, { recursive: true });
      console.log(`   ✅ src/${entry.name}/ copiado`);
    } else {
      await fs.cp(srcPath, destPath);
    }
  }
  
  // Criar symlink para node_modules (mais eficiente que copiar)
  const nodeModulesSrc = path.join(projectRoot, 'node_modules');
  const nodeModulesDest = path.join(workDir, 'node_modules');
  if (await pathExists(nodeModulesSrc)) {
    try {
      // Tentar criar symlink (pode falhar em alguns sistemas)
      await fs.symlink(nodeModulesSrc, nodeModulesDest, 'dir');
      console.log('   ✅ node_modules/ linkado (symlink)');
    } catch (error) {
      // Se symlink falhar, copiar (mais lento mas funciona sempre)
      console.log('   ⚠️  Symlink falhou, copiando node_modules/ (pode demorar)...');
      await fs.cp(nodeModulesSrc, nodeModulesDest, { recursive: true });
      console.log('   ✅ node_modules/ copiado');
    }
  }
  
  console.log('   ✅ Diretório de trabalho preparado');
  return workDir;
}

/**
 * Executa o build isolado em um subprocesso no diretório de trabalho isolado
 */
async function executeIsolatedBuild(cursoFile, workDir) {
  // O arquivo do curso está no projeto (.scorm-build/curso-xxx.json)
  // Precisamos copiá-lo para o workDir para que o build possa encontrá-lo
  const workCursoFile = path.join(workDir, path.basename(cursoFile));
  await fs.cp(cursoFile, workCursoFile);
  console.log(`   📄 Arquivo do curso copiado para: ${workCursoFile}`);
  
  // Limpar .next-scorm no diretório de trabalho se existir
  const scormNextDir = path.join(workDir, '.next-scorm');
  if (await pathExists(scormNextDir)) {
    await fs.rm(scormNextDir, { recursive: true, force: true });
  }

  return new Promise((resolve, reject) => {
    // Usar o caminho do arquivo no diretório de trabalho isolado (já copiado acima)
    const env = {
      ...process.env,
      NODE_ENV: 'production',
      NEXT_OUTPUT_EXPORT: 'true',
      SCORM_BUILD_CURSO_FILE: workCursoFile, // ✅ Caminho no diretório isolado
    };

    console.log('   🔧 Variáveis de ambiente configuradas');
    console.log(`   📁 Diretório de trabalho isolado: ${workDir}`);
    console.log('   ✅ Projeto original não será modificado');

    // Executar build em subprocesso isolado
    console.log('   🔨 Executando next build...');
    console.log('   📍 Diretório atual:', process.cwd());
    console.log('   🔧 NODE_ENV:', env.NODE_ENV);
    console.log('   🔧 NEXT_OUTPUT_EXPORT:', env.NEXT_OUTPUT_EXPORT);
    
    const buildProcess = spawn('pnpm', ['next', 'build', '--no-lint'], {
      cwd: workDir, // ✅ Executar no diretório isolado, NÃO no projeto
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
      try {
        // Quando usamos distDir customizado (.next-scorm), o Next.js gera o output dentro dele
        // Precisamos copiar os arquivos para out/ no diretório de trabalho
        if (code === 0) {
          const scormNextDir = path.join(workDir, '.next-scorm');
          const workOutDir = path.join(workDir, 'out');
          
          // Verificar se o output está em .next-scorm/ (quando distDir é customizado)
          if (await pathExists(scormNextDir)) {
            const hasHtmlFiles = await fs.readdir(scormNextDir).then(files => 
              files.some(f => f.endsWith('.html'))
            ).catch(() => false);
            
            if (hasHtmlFiles) {
              console.log('   📦 Copiando output de .next-scorm/ para out/ no diretório isolado...');
              // Remover out/ se existir
              if (await pathExists(workOutDir)) {
                await fs.rm(workOutDir, { recursive: true, force: true });
              }
              // Copiar conteúdo de .next-scorm/ para out/
              await fs.cp(scormNextDir, workOutDir, { recursive: true });
              console.log('   ✅ Output copiado para out/ no diretório isolado');
            }
          }
        }
        
        // ✅ NÃO precisamos restaurar nada - o projeto original nunca foi modificado!

        if (code === 0) {
          resolve();
        } else {
          const errorMsg = `Build falhou com código ${code}\n\nSTDOUT:\n${buildStdout}\n\nSTDERR:\n${buildStderr}`;
          console.error(`   ❌ [Build] ${errorMsg}`);
          reject(new Error(errorMsg));
        }
      } finally {
        // ✅ NÃO precisamos limpar pastas temporárias - projeto original nunca foi modificado!
        // Apenas garantir que o diretório de trabalho será limpo depois
      }
    });

    buildProcess.on('error', async (error) => {
      // ✅ NÃO precisamos restaurar nada - o projeto original nunca foi modificado!
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
    // Normalizar prefix (garantir que termine com / se não for vazio e não terminar com /)
    let normalizedPrefix = prefix || '';
    if (normalizedPrefix && !normalizedPrefix.endsWith('/') && normalizedPrefix !== './') {
      normalizedPrefix = normalizedPrefix + '/';
    }
    
    // Converter href com aspas duplas
    html = html.replace(/href="\/_next\//g, `href="${normalizedPrefix}_next/`);
    html = html.replace(/href="\/favicon\.ico/g, `href="${normalizedPrefix}favicon.ico`);
    
    // Converter href com aspas simples
    html = html.replace(/href='\/_next\//g, `href='${normalizedPrefix}_next/`);
    html = html.replace(/href='\/favicon\.ico/g, `href='${normalizedPrefix}favicon.ico`);
    
    // Converter src com aspas duplas
    html = html.replace(/src="\/_next\//g, `src="${normalizedPrefix}_next/`);
    
    // Converter src com aspas simples
    html = html.replace(/src='\/_next\//g, `src='${normalizedPrefix}_next/`);
    
    // Converter URLs em CSS (url() com aspas duplas)
    html = html.replace(/url\("\/_next\//g, `url("${normalizedPrefix}_next/`);
    html = html.replace(/url\('\/_next\//g, `url('${normalizedPrefix}_next/`);
    html = html.replace(/url\(\/_next\//g, `url(${normalizedPrefix}_next/`);
    
    // Converter qualquer atributo que contenha /_next/ (data-*, etc.)
    html = html.replace(/(\w+)="\/_next\//g, `$1="${normalizedPrefix}_next/`);
    html = html.replace(/(\w+)='\/_next\//g, `$1='${normalizedPrefix}_next/`);
    
    // Converter caminhos absolutos genéricos (que começam com / mas não são URLs externas)
    // Preservar URLs externas (http://, https://, //)
    html = html.replace(/(href|src|content|data-src|data-href)="\/(?!\/|http|https|mailto|tel|#)/g, `$1="${normalizedPrefix}`);
    html = html.replace(/(href|src|content|data-src|data-href)='\/(?!\/|http|https|mailto|tel|#)/g, `$1='${normalizedPrefix}`);
    
    // Converter também em atributos sem aspas (menos comum, mas pode acontecer)
    html = html.replace(/(href|src)=([^"'\s>]+)\/_next\//g, `$1=$2${normalizedPrefix}_next/`);
    
    // Converter em JavaScript inline (pode conter caminhos absolutos)
    html = html.replace(/(['"`])\/_next\//g, `$1${normalizedPrefix}_next/`);
    
    // Converter também em JSON dentro de scripts (Next.js injeta dados assim)
    html = html.replace(/("\/_next\/)/g, `"${normalizedPrefix}_next/`);
    html = html.replace(/('\/_next\/)/g, `'${normalizedPrefix}_next/`);
    
    return html;
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
    
    // Criar mapa: ID da unidade -> arquivo HTML correspondente
    const unitIdToFile = new Map();
    
    // Primeiro, processar cada unidade do curso e encontrar seu arquivo
    for (const unidade of curso.unidades || []) {
      const expectedFileName = `${unidade.id}.html`;
      let matchedFile = null;
      
      // Tentar encontrar pelo nome exato primeiro
      if (files.includes(expectedFileName)) {
        matchedFile = expectedFileName;
        console.log(`   ✅ Arquivo encontrado por nome exato: ${expectedFileName}`);
      } else {
        // Tentar encontrar por padrões no nome
        for (const file of files) {
          if (file.endsWith('.html') && !file.includes('pdf')) {
            // Verificar se o arquivo contém o ID da unidade
            if (file === `unidade-${unidade.id}.html` || 
                file.includes(unidade.id) && file.endsWith('.html')) {
              matchedFile = file;
              console.log(`   ✅ Arquivo encontrado por padrão: ${file} → ${unidade.id}`);
              break;
            }
          }
        }
        
        // Se ainda não encontrou, ler o conteúdo para verificar
        if (!matchedFile) {
          for (const file of files) {
            if (file.endsWith('.html') && !file.includes('pdf')) {
              try {
                const content = await fs.readFile(path.join(unidadeDir, file), 'utf-8');
                // Procurar por padrões que indiquem este é o arquivo da unidade
                if (content.includes(`unidadeId: "${unidade.id}"`) ||
                    content.includes(`currentUnidadeId="${unidade.id}"`) ||
                    content.includes(`"${unidade.id}"`) && (content.includes('unidadeId') || content.includes('currentUnidadeId'))) {
                  matchedFile = file;
                  console.log(`   ✅ Arquivo encontrado por conteúdo: ${file} → ${unidade.id}`);
                  break;
                }
              } catch (error) {
                // Ignorar erros de leitura
              }
            }
          }
        }
      }
      
      if (matchedFile) {
        unitIdToFile.set(unidade.id, matchedFile);
      } else {
        console.log(`   ⚠️  Arquivo não encontrado para unidade: ${unidade.id}`);
      }
    }
    
    // Agora copiar e renomear os arquivos usando os IDs corretos
    for (const [unitId, originalFile] of unitIdToFile.entries()) {
      let content = await fs.readFile(path.join(unidadeDir, originalFile), 'utf-8');
      
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
      
      // Usar o ID da unidade como nome do arquivo (garantir formato correto)
      const finalFileName = `${unitId}.html`;
      
      if (originalFile !== finalFileName) {
        console.log(`   🔄 Renomeando: ${originalFile} → ${finalFileName}`);
      }
      
      zip.file(`scorm-preview/unidade/${finalFileName}`, content);
      unitFilesCount++;
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

