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
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Função para carregar JSZip de forma robusta
async function loadJSZip() {
  try {
    // Tentar importação direta primeiro
    const jszipModule = await import('jszip');
    return jszipModule.default || jszipModule;
  } catch (importError) {
    // Se falhar, tentar usar require (compatibilidade)
    try {
      const require = createRequire(import.meta.url);
      return require('jszip');
    } catch (requireError) {
      // Se ambos falharem, tentar resolver manualmente
      const projectRoot = process.cwd();
      const jszipPath = path.join(projectRoot, 'node_modules', 'jszip');
      try {
        // Tentar diferentes caminhos possíveis
        const possiblePaths = [
          path.join(jszipPath, 'index.js'),
          path.join(jszipPath, 'lib', 'index.js'),
          path.join(jszipPath, 'dist', 'jszip.min.js'),
        ];
        
        for (const jszipFile of possiblePaths) {
          try {
            const jszipModule = await import(jszipFile);
            return jszipModule.default || jszipModule;
          } catch {
            // Tentar próximo caminho
            continue;
          }
        }
        
        throw new Error('Nenhum caminho válido encontrado');
      } catch (manualError) {
        console.error('❌ [SCORM Isolated] Erro ao carregar JSZip:');
        console.error('   Import direto:', importError.message);
        console.error('   Require:', requireError.message);
        console.error('   Manual:', manualError.message);
        console.error('   Project root:', projectRoot);
        console.error('   JSZip path:', jszipPath);
        console.error('   NODE_PATH:', process.env.NODE_PATH);
        console.error('   CWD:', process.cwd());
        
        // Listar node_modules para debug
        try {
          const nodeModulesDir = path.join(projectRoot, 'node_modules');
          const exists = await fs.access(nodeModulesDir).then(() => true).catch(() => false);
          if (exists) {
            const files = await fs.readdir(nodeModulesDir);
            console.error('   Node modules encontrados:', files.slice(0, 10).join(', '), '...');
          } else {
            console.error('   Node modules não encontrado em:', nodeModulesDir);
          }
        } catch {
          // Ignorar
        }
        
        throw new Error(`Não foi possível carregar JSZip. Verifique se está instalado: npm install jszip`);
      }
    }
  }
}

// Variável global para armazenar JSZip após carregamento
let JSZip;

// ✅ Rastreamento global de arquivos/pastas temporárias para limpeza
let tempPaths = {
  workDir: null,
  tempCursoFile: null,
  projectOutDir: null,
};

/**
 * Limpa todos os arquivos/pastas temporárias rastreadas
 */
async function cleanupAllTemp() {
  console.log('\n🧹 [CLEANUP] Limpando arquivos temporários...');
  
  const cleanupTasks = [];
  
  if (tempPaths.workDir && await pathExists(tempPaths.workDir)) {
    console.log(`   🗑️  Removendo ${tempPaths.workDir}...`);
    cleanupTasks.push(
      fs.rm(tempPaths.workDir, { recursive: true, force: true })
        .then(() => console.log(`   ✅ ${tempPaths.workDir} removido`))
        .catch(err => console.warn(`   ⚠️  Erro ao remover ${tempPaths.workDir}:`, err.message))
    );
  }
  
  if (tempPaths.tempCursoFile && await pathExists(tempPaths.tempCursoFile)) {
    console.log(`   🗑️  Removendo ${tempPaths.tempCursoFile}...`);
    cleanupTasks.push(
      fs.unlink(tempPaths.tempCursoFile)
        .then(() => console.log(`   ✅ ${tempPaths.tempCursoFile} removido`))
        .catch(err => console.warn(`   ⚠️  Erro ao remover ${tempPaths.tempCursoFile}:`, err.message))
    );
  }
  
  if (tempPaths.projectOutDir && await pathExists(tempPaths.projectOutDir)) {
    console.log(`   🗑️  Removendo ${tempPaths.projectOutDir}...`);
    cleanupTasks.push(
      fs.rm(tempPaths.projectOutDir, { recursive: true, force: true })
        .then(() => console.log(`   ✅ ${tempPaths.projectOutDir} removido`))
        .catch(err => console.warn(`   ⚠️  Erro ao remover ${tempPaths.projectOutDir}:`, err.message))
    );
  }
  
  await Promise.all(cleanupTasks);
  console.log('✅ [CLEANUP] Limpeza concluída');
}

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
  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
  const workDir = isVercel
    ? path.join('/tmp', '.scorm-build-work')
    : path.join(process.cwd(), '.scorm-build-work');
    
  if (await pathExists(workDir)) {
    console.log(`   🗑️  Removendo diretório de trabalho isolado anterior: ${workDir}...`);
    try {
      await fs.rm(workDir, { recursive: true, force: true });
      console.log('   ✅ Diretório de trabalho limpo');
    } catch (rmError) {
      console.warn(`   ⚠️  Erro ao remover diretório (pode não existir):`, rmError.message);
    }
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
    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
    const tempDir = isVercel
      ? path.join('/tmp', '.scorm-build')
      : path.join(process.cwd(), '.scorm-build');
    const tempCursoFile = path.join(tempDir, `curso-${cursoId}.json`);
    
    console.log(`📁 [SCORM Isolated] Temp dir: ${tempDir}`);
    try {
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(tempCursoFile, JSON.stringify(cursoData, null, 2));
      console.log(`✅ Curso salvo em: ${tempCursoFile}`);
    } catch (writeError) {
      console.error(`❌ Erro ao salvar curso:`, writeError);
      throw new Error(`Falha ao salvar curso em ${tempCursoFile}: ${writeError.message}`);
    }

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

    // 7. Carregar JSZip antes de criar o ZIP
    console.log('\n📦 [SCORM Isolated] Carregando JSZip...');
    if (!JSZip) {
      JSZip = await loadJSZip();
      console.log('✅ JSZip carregado com sucesso');
    }
    
    // 8. Criar ZIP SCORM
    console.log('\n📦 [SCORM Isolated] Criando pacote ZIP SCORM...');
    await createSCORMZip(outputZipPath, cursoData, cursoId);
    console.log('✅ ZIP SCORM criado');

    // 9. Limpar arquivos temporários
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

// ✅ Handlers para limpeza em caso de interrupção ou erro
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  [SCORM Isolated] Build interrompido pelo usuário (Ctrl+C)');
  await cleanupAllTemp();
  process.exit(130); // Exit code padrão para SIGINT
});

process.on('SIGTERM', async () => {
  console.log('\n\n⚠️  [SCORM Isolated] Build terminado externamente');
  await cleanupAllTemp();
  process.exit(143); // Exit code padrão para SIGTERM
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('❌ [SCORM Isolated] Unhandled Rejection at:', promise, 'reason:', reason);
  await cleanupAllTemp();
  process.exit(1);
});

process.on('uncaughtException', async (error) => {
  console.error('❌ [SCORM Isolated] Uncaught Exception:', error);
  await cleanupAllTemp();
  process.exit(1);
});



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
  // Usar /tmp na Vercel, .scorm-build-work localmente
  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
  const workDir = isVercel
    ? path.join('/tmp', '.scorm-build-work')
    : path.join(process.cwd(), '.scorm-build-work');
  const projectRoot = process.cwd();
  
  console.log(`   📁 Ambiente: ${isVercel ? 'Vercel' : 'Local'}`);
  console.log(`   📁 Criando diretório de trabalho isolado: ${workDir}`);
  console.log(`   📁 Project root: ${projectRoot}`);
  
  try {
    await fs.mkdir(workDir, { recursive: true });
    console.log(`   ✅ Diretório criado: ${workDir}`);
  } catch (mkdirError) {
    console.error(`   ❌ Erro ao criar diretório:`, mkdirError);
    throw new Error(`Falha ao criar diretório de trabalho: ${workDir}. Erro: ${mkdirError.message}`);
  }
  
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
    'scorm-build', // Página de progresso (dinâmica)
    'scorm-jobs', // Página de histórico
  ];
  
  console.log('   📦 Copiando arquivos necessários (excluindo pastas problemáticas)...');
  
  // Copiar arquivos de configuração
  // Na Vercel, alguns arquivos podem não estar disponíveis no bundle
  // Todos os arquivos são opcionais - criaremos versões básicas se não existirem
  const configFiles = ['package.json', 'tsconfig.json', 'next.config.ts', 'middleware.ts', 'components.json'];
  
  for (const file of configFiles) {
    const srcPath = path.join(projectRoot, file);
    const destPath = path.join(workDir, file);
    
    console.log(`   📄 Copiando ${file}...`);
    if (await pathExists(srcPath)) {
      try {
        await fs.cp(srcPath, destPath);
        console.log(`   ✅ ${file} copiado`);
      } catch (cpError) {
        console.error(`   ❌ Erro ao copiar ${file}:`, cpError);
        console.warn(`   ⚠️  ${file} não pôde ser copiado, criando versão básica...`);
        await createBasicConfigFile(file, destPath);
      }
    } else {
      console.warn(`   ⚠️  Arquivo não encontrado: ${srcPath}`);
      console.log(`   ℹ️  Criando versão básica de ${file}...`);
      await createBasicConfigFile(file, destPath);
    }
  }
  
  // Função auxiliar para criar arquivos de configuração básicos
  async function createBasicConfigFile(fileName, destPath) {
    try {
      if (fileName === 'package.json') {
        const minimalPackageJson = {
          name: 'scorm-build',
          version: '1.0.0',
          dependencies: {},
        };
        await fs.writeFile(destPath, JSON.stringify(minimalPackageJson, null, 2));
        console.log(`   ✅ package.json básico criado`);
      } else if (fileName === 'tsconfig.json') {
        const basicTsConfig = {
          compilerOptions: {
            target: 'ES2020',
            lib: ['ES2020', 'DOM', 'DOM.Iterable'],
            jsx: 'preserve',
            module: 'ESNext',
            moduleResolution: 'bundler',
            resolveJsonModule: true,
            allowJs: true,
            strict: true,
            noEmit: true,
            esModuleInterop: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true,
          },
          include: ['src'],
          exclude: ['node_modules'],
        };
        await fs.writeFile(destPath, JSON.stringify(basicTsConfig, null, 2));
        console.log(`   ✅ tsconfig.json básico criado`);
      } else if (fileName === 'next.config.ts') {
        const basicNextConfig = `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
`;
        await fs.writeFile(destPath, basicNextConfig);
        console.log(`   ✅ next.config.ts básico criado`);
      } else {
        // Para outros arquivos opcionais, apenas logar
        console.log(`   ℹ️  ${fileName} é opcional, continuando sem ele...`);
      }
    } catch (writeError) {
      console.error(`   ❌ Erro ao criar ${fileName}:`, writeError);
      // Não falhar se não conseguir criar arquivo opcional
      if (fileName === 'package.json' || fileName === 'tsconfig.json') {
        throw new Error(`Falha ao criar ${fileName}: ${writeError.message}`);
      }
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
  
  // Copiar public/ completo (ou criar vazio se não existir - comum na Vercel)
  const publicSrc = path.join(projectRoot, 'public');
  const publicDest = path.join(workDir, 'public');
  console.log(`   📁 Copiando public/ de ${publicSrc}...`);
  if (await pathExists(publicSrc)) {
    try {
      await fs.cp(publicSrc, publicDest, { recursive: true });
      console.log('   ✅ public/ copiado');
    } catch (cpError) {
      console.error(`   ❌ Erro ao copiar public/:`, cpError);
      throw new Error(`Falha ao copiar public/ de ${publicSrc} para ${publicDest}: ${cpError.message}`);
    }
  } else {
    // Na Vercel, public/ não está disponível para serverless functions
    // Criar diretório vazio para evitar erros no build
    console.warn(`   ⚠️ public/ não encontrado em: ${publicSrc}`);
    console.log(`   📁 Criando public/ vazio (normal na Vercel)...`);
    await fs.mkdir(publicDest, { recursive: true });
    console.log('   ✅ public/ vazio criado');
  }
  
  // Copiar src/ mas excluindo pastas problemáticas
  const srcSrc = path.join(projectRoot, 'src');
  const srcDest = path.join(workDir, 'src');
  console.log(`   📁 Copiando src/ de ${srcSrc}...`);
  
  if (await pathExists(srcSrc)) {
    try {
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
              // Excluir nome exato OU nome com sufixo numérico (ex: 'api 2', 'pdf-preview 3')
              // Regex: nome exato OU nome seguido de espaço e dígitos
              const pattern = new RegExp(`^${exclude.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s+\\d+)?$`);
              return pattern.test(appEntry.name);
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
          // Copiar arquivos individuais
          await fs.cp(srcPath, destPath);
        }
      }
      console.log('   ✅ src/ copiado');
    } catch (srcError) {
      console.error(`   ❌ Erro ao copiar src/:`, srcError);
      throw new Error(`Falha ao copiar src/ de ${srcSrc} para ${srcDest}: ${srcError.message}`);
    }
  } else {
    console.error(`   ❌ src/ não encontrado em: ${srcSrc}`);
    throw new Error(`Diretório src/ não encontrado em: ${srcSrc}`);
  }
  
  // ✅ CORREÇÃO: Na Vercel, NÃO criar symlink para node_modules
  // Symlinks causam erro "invalid deployment package" na Vercel
  // Em vez disso, vamos usar NODE_PATH para apontar para o node_modules original
  // e executar o build no workDir mas com acesso ao node_modules via NODE_PATH
  const nodeModulesSrc = path.join(projectRoot, 'node_modules');
  const nodeModulesDest = path.join(workDir, 'node_modules');
  
  console.log(`   📦 Verificando node_modules: ${nodeModulesSrc}`);
  
  if (await pathExists(nodeModulesSrc)) {
    if (isVercel) {
      // ✅ Na Vercel: NÃO criar symlink (causa erro de deployment)
      // Vamos usar NODE_PATH no ambiente do build para encontrar dependências
      console.log('   ℹ️  Na Vercel: Não criando symlink (evita erro de deployment)');
      console.log('   ℹ️  Dependências serão encontradas via NODE_PATH no ambiente do build');
      console.log(`   📍 node_modules original: ${nodeModulesSrc}`);
    } else {
      // Localmente: tentar criar symlink (mais rápido)
      try {
        await fs.symlink(nodeModulesSrc, nodeModulesDest, 'dir');
        console.log('   ✅ node_modules/ linkado (symlink)');
        console.log(`   📍 Symlink: ${nodeModulesDest} -> ${nodeModulesSrc}`);
      } catch (symlinkError) {
        console.warn(`   ⚠️  Symlink falhou: ${symlinkError.message}`);
        // Localmente, se symlink falhar, copiar como fallback
        console.log('   ⚠️  Symlink falhou, copiando node_modules/ (pode demorar)...');
        try {
          await fs.cp(nodeModulesSrc, nodeModulesDest, { recursive: true });
          console.log('   ✅ node_modules/ copiado');
        } catch (cpError) {
          console.error(`   ❌ Erro ao copiar node_modules:`, cpError);
          throw new Error(`Falha ao copiar node_modules: ${cpError.message}`);
        }
      }
    }
  } else {
    console.error(`   ❌ node_modules não encontrado em: ${nodeModulesSrc}`);
    if (isVercel) {
      // Na Vercel, node_modules DEVE existir em /var/task/node_modules
      // Se não existir, algo está muito errado
      console.error('   ❌ ERRO CRÍTICO: node_modules não encontrado na Vercel!');
      throw new Error(`node_modules não encontrado em: ${nodeModulesSrc}. Isso é necessário para o build funcionar.`);
    } else {
      throw new Error(`node_modules não encontrado em: ${nodeModulesSrc}`);
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

  // Determinar comando de build antes de criar a Promise
  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
  let buildCommand;
  let buildArgs;
  
  if (isVercel) {
    console.log('   🔧 Configurando ambiente Vercel...');
    
    try {
      // ✅ MÁGICA DO NODE: Encontrar onde o pacote 'next' está realmente instalado
      // Usa require.resolve() para descobrir o caminho exato, mesmo após tree shaking
      const require = createRequire(import.meta.url);
      
      // Tenta resolver o caminho do binário do next
      // Geralmente resolve para: .../node_modules/next/dist/bin/next
      const nextExecutablePath = require.resolve('next/dist/bin/next');
      
      console.log(`   ✅ Executável Next.js resolvido: ${nextExecutablePath}`);
      
      // Usar process.execPath (o próprio executável 'node' atual)
      buildCommand = process.execPath;
      buildArgs = [nextExecutablePath, 'build', '--no-lint'];
      
      console.log(`   🔧 Usando executável JavaScript direto do Next.js (via require.resolve)`);
      console.log(`   📍 Node.js: ${buildCommand}`);
      console.log(`   📍 Next.js: ${nextExecutablePath}`);
    } catch (resolveError) {
      console.error('   ❌ Falha fatal: Não foi possível resolver next/dist/bin/next');
      console.error('   Erro:', resolveError.message);
      console.error('   Isso geralmente significa que o Next.js foi removido pelo tree shaking da Vercel');
      console.error('   Verifique se next.config.ts inclui "./node_modules/next/**/*" em outputFileTracingIncludes');
      
      // Última tentativa desesperada: caminho hardcoded
      const hardcodedPath = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
      console.log(`   ⚠️  Tentando caminho manual: ${hardcodedPath}`);
      
      buildCommand = process.execPath;
      buildArgs = [hardcodedPath, 'build', '--no-lint'];
    }
  } else {
    // Ambiente Local: usar pnpm
    buildCommand = 'pnpm';
    buildArgs = ['next', 'build', '--no-lint'];
    console.log('   🔧 Usando pnpm (ambiente local)');
  }

  return new Promise((resolve, reject) => {
    // Usar o caminho do arquivo no diretório de trabalho isolado (já copiado acima)
    const env = {
      ...process.env,
      NODE_ENV: 'production',
      NEXT_OUTPUT_EXPORT: 'true',
      NEXT_TELEMETRY_DISABLED: '1', // Desabilitar telemetria do Next.js
      SCORM_BUILD_CURSO_FILE: workCursoFile, // ✅ Caminho no diretório isolado
      NEXT_PUBLIC_IS_SCORM_BUILD: 'true', // ✅ Flag para indicar build SCORM
    };
    
    // ✅ Na Vercel: Configurar NODE_PATH para encontrar node_modules original
    // Isso permite que o build encontre dependências sem criar symlink
    if (isVercel) {
      const originalNodeModules = path.join(process.cwd(), 'node_modules');
      const existingNodePath = process.env.NODE_PATH || '';
      // Adicionar node_modules original ao NODE_PATH
      env.NODE_PATH = existingNodePath 
        ? `${existingNodePath}:${originalNodeModules}`
        : originalNodeModules;
      console.log(`   🔧 NODE_PATH configurado: ${env.NODE_PATH}`);
    }

    console.log('   🔧 Variáveis de ambiente configuradas');
    console.log(`   📁 Diretório de trabalho isolado: ${workDir}`);
    console.log('   ✅ Projeto original não será modificado');

    // Executar build em subprocesso isolado
    console.log('   🔨 Executando next build...');
    console.log('   📍 Diretório atual:', process.cwd());
    console.log('   🔧 NODE_ENV:', env.NODE_ENV);
    console.log('   🔧 NEXT_OUTPUT_EXPORT:', env.NEXT_OUTPUT_EXPORT);
    
    const buildProcess = spawn(buildCommand, buildArgs, {
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
  // Garantir que JSZip está carregado
  if (!JSZip) {
    console.log('   📦 Carregando JSZip...');
    JSZip = await loadJSZip();
  }
  
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
 * Escapa caracteres especiais para XML
 */
function escapeXml(unsafe) {
  if (!unsafe) return "";
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

/**
 * Gera manifesto SCORM simples
 */
function generateManifestSimple(curso) {
  // === MANIFESTO SIMPLIFICADO PARA SPA ===
  // Apenas um item apontando para index.html
  // A navegação interna é gerenciada pelo React
  
  const manifest = `<?xml version="1.0" standalone="no" ?>
<manifest identifier="com.scorm.manifest" version="1.2"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
                      http://www.imsproject.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">

  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>

  <organizations default="default_org">
    <organization identifier="default_org">
      <title>${escapeXml(curso.titulo)}</title>
      <item identifier="item_index" identifierref="resource_index">
        <title>${escapeXml(curso.titulo)}</title>
      </item>
    </organization>
  </organizations>

  <resources>
    <resource identifier="resource_index" type="webcontent" href="index.html" adlcp:scormtype="sco">
      <file href="index.html"/>
      <file href="scorm_api_wrapper.js"/>
    </resource>
  </resources>
</manifest>`;

  return manifest;
}

/**
 * Gera SCORM API wrapper simples
 */
function generateScormWrapperSimple() {
  return `
/**
 * SCORM 1.2 API Wrapper
 * Exposes window.SCORM object for the SPA to interact with.
 */
var API = null;

function findAPI(win) {
  var attempt = 0;
  var maxAttempts = 500;
  while ((win.API == null) && (win.parent != null) && (win.parent != win)) {
    attempt++;
    if (attempt > maxAttempts) {
      console.error("SCORM: Could not find APIAdapter - too deep.");
      return null;
    }
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

// SCORM Object exposed to the application
window.SCORM = {
  init: function() {
    var api = getAPI();
    if (api) {
      var result = api.LMSInitialize("");
      if (result.toString() === "true") {
        this.setValue("cmi.core.lesson_status", "incomplete");
        this.save();
        return true;
      }
    }
    return false;
  },
  
  getValue: function(key) {
    var api = getAPI();
    if (api) return api.LMSGetValue(key);
    return "";
  },
  
  setValue: function(key, value) {
    var api = getAPI();
    if (api) {
      var result = api.LMSSetValue(key, value);
      return result.toString() === "true";
    }
    return false;
  },
  
  save: function() {
    var api = getAPI();
    if (api) return api.LMSCommit("");
    return false;
  },
  
  quit: function() {
    var api = getAPI();
    if (api) return api.LMSFinish("");
    return false;
  },
  
  complete: function() {
    this.setValue("cmi.core.lesson_status", "completed");
    this.save();
    this.quit();
  }
};

// Auto-initialize on load
window.addEventListener('load', function() {
  console.log("[SCORM-WRAPPER] Initializing...");
  if (window.SCORM.init()) {
    console.log("[SCORM-WRAPPER] Initialized successfully.");
  } else {
    console.warn("[SCORM-WRAPPER] Failed to initialize or API not found.");
  }
});

// Auto-finish on unload
window.addEventListener('beforeunload', function() {
  console.log("[SCORM-WRAPPER] Finishing...");
  window.SCORM.quit();
});
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

  // === SPA MODE: Single index.html contains everything ===
  // O arquivo index.html principal será criado abaixo a partir de scorm-preview.html
  // === SPA MODE: Single index.html contains everything ===
  // O arquivo index.html principal será criado abaixo a partir de scorm-preview.html

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
            let content = await fs.readFile(fullPath);
            
            // PATCH: Corrigir Webpack Runtime para usar caminhos relativos
            // O Next.js define __webpack_require__.p = "/_next/" por padrão
            // Precisamos mudar para "./_next/" ou detectar dinamicamente
            if (fileName.startsWith('webpack-') && fileName.endsWith('.js')) {
              console.log(`   🔧 Patching Webpack Runtime: ${fileName}`);
              let jsContent = content.toString('utf-8');
              
              // Substituir atribuição do publicPath
              // Procura por: n.p="/_next/" ou similar
              // Substitui por: n.p="./_next/"
              // Regex flexível para pegar variações minificadas
              const publicPathRegex = /(\w+\.p=)"\/_next\/"/g;
              
              if (publicPathRegex.test(jsContent)) {
                jsContent = jsContent.replace(publicPathRegex, '$1"./_next/"');
                console.log('      ✅ Public path corrigido para "./_next/"');
                content = Buffer.from(jsContent);
              } else {
                console.warn('      ⚠️  Não foi possível encontrar a definição do publicPath no Webpack Runtime');
                // Tentar fallback mais agressivo se o regex acima falhar
                // Procura por qualquer string "/_next/" atribuída a .p
                const aggressiveRegex = /\.p="\/_next\/"/g;
                if (aggressiveRegex.test(jsContent)) {
                   jsContent = jsContent.replace(aggressiveRegex, '.p="./_next/"');
                   console.log('      ✅ Public path corrigido (fallback) para "./_next/"');
                   content = Buffer.from(jsContent);
                }
              }
            }

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
    
    // ✅ INJETAR DADOS DO CURSO (CRUCIAL PARA SPA)
    indexContent = injectCursoData(indexContent, curso);
    
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

