#!/usr/bin/env node

/**
 * Script de Validação de Testes
 *
 * Verifica a estrutura dos arquivos de teste sem executá-los
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validando estrutura de testes...\n');

const testFiles = [
  'src/__tests__/api/auth.test.ts',
  'src/__tests__/api/cursos.test.ts',
  'src/__tests__/integration/login-flow.test.tsx',
  'src/__tests__/integration/cursos-page.test.tsx',
  'e2e/login.spec.ts',
  'e2e/cursos.spec.ts',
];

const configFiles = [
  'jest.config.js',
  'jest.setup.js',
  'playwright.config.ts',
];

let errors = 0;
let warnings = 0;

// Verificar existência dos arquivos
console.log('📁 Verificando arquivos de teste...\n');

[...testFiles, ...configFiles].forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - NÃO ENCONTRADO`);
    errors++;
  }
});

// Verificar conteúdo dos testes
console.log('\n🧪 Validando conteúdo dos testes...\n');

testFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (!fs.existsSync(fullPath)) return;

  const content = fs.readFileSync(fullPath, 'utf8');
  const checks = {
    hasDescribe: content.includes('describe('),
    hasTest: content.includes('test(') || content.includes('it('),
    hasExpect: content.includes('expect('),
    hasDuplicateCheck: content.includes('toHaveBeenCalledTimes(1)') ||
                       content.includes('.toHaveLength(1)') ||
                       content.includes('apiRequests.length'),
    hasComments: content.includes('/**') || content.includes('//'),
  };

  console.log(`  📄 ${file}:`);

  if (!checks.hasDescribe) {
    console.log(`    ⚠️  Sem blocos describe()`);
    warnings++;
  } else {
    console.log(`    ✅ Contém describe()`);
  }

  if (!checks.hasTest) {
    console.log(`    ❌ Sem casos de teste`);
    errors++;
  } else {
    const testCount = (content.match(/\b(test|it)\(/g) || []).length;
    console.log(`    ✅ ${testCount} casos de teste encontrados`);
  }

  if (!checks.hasExpect) {
    console.log(`    ⚠️  Sem assertions expect()`);
    warnings++;
  } else {
    const expectCount = (content.match(/expect\(/g) || []).length;
    console.log(`    ✅ ${expectCount} assertions encontradas`);
  }

  if (!checks.hasDuplicateCheck) {
    console.log(`    ⚠️  Sem verificação de requisições duplicadas`);
    warnings++;
  } else {
    console.log(`    ✅ Contém verificação de duplicação`);
  }

  if (!checks.hasComments) {
    console.log(`    ⚠️  Sem comentários/documentação`);
    warnings++;
  } else {
    console.log(`    ✅ Bem documentado`);
  }

  console.log('');
});

// Verificar configurações
console.log('⚙️  Validando arquivos de configuração...\n');

const jestConfig = path.join(__dirname, 'jest.config.js');
if (fs.existsSync(jestConfig)) {
  const content = fs.readFileSync(jestConfig, 'utf8');
  console.log('  📄 jest.config.js:');

  if (content.includes('setupFilesAfterEnv')) {
    console.log('    ✅ Setup configurado');
  } else {
    console.log('    ⚠️  Setup não configurado');
    warnings++;
  }

  if (content.includes('testEnvironment')) {
    console.log('    ✅ Ambiente de teste definido');
  } else {
    console.log('    ❌ Ambiente de teste não definido');
    errors++;
  }

  if (content.includes('moduleNameMapper')) {
    console.log('    ✅ Aliases configurados');
  } else {
    console.log('    ⚠️  Aliases não configurados');
    warnings++;
  }
}

const jestSetup = path.join(__dirname, 'jest.setup.js');
if (fs.existsSync(jestSetup)) {
  const content = fs.readFileSync(jestSetup, 'utf8');
  console.log('\n  📄 jest.setup.js:');

  if (content.includes('JWT_SECRET')) {
    console.log('    ✅ JWT_SECRET mockado');
  } else {
    console.log('    ❌ JWT_SECRET não mockado');
    errors++;
  }

  if (content.includes('@/lib/prisma')) {
    console.log('    ✅ Prisma mockado');
  } else {
    console.log('    ❌ Prisma não mockado');
    errors++;
  }

  if (content.includes('next/navigation')) {
    console.log('    ✅ Next Router mockado');
  } else {
    console.log('    ❌ Next Router não mockado');
    errors++;
  }
}

const playwrightConfig = path.join(__dirname, 'playwright.config.ts');
if (fs.existsSync(playwrightConfig)) {
  const content = fs.readFileSync(playwrightConfig, 'utf8');
  console.log('\n  📄 playwright.config.ts:');

  if (content.includes('testDir')) {
    console.log('    ✅ Diretório de testes configurado');
  } else {
    console.log('    ❌ Diretório de testes não configurado');
    errors++;
  }

  if (content.includes('baseURL')) {
    console.log('    ✅ Base URL configurada');
  } else {
    console.log('    ⚠️  Base URL não configurada');
    warnings++;
  }

  if (content.includes('projects')) {
    const projectsCount = (content.match(/name:/g) || []).length;
    console.log(`    ✅ ${projectsCount} projetos configurados`);
  } else {
    console.log('    ⚠️  Projetos não configurados');
    warnings++;
  }
}

// Verificar package.json
console.log('\n📦 Verificando scripts no package.json...\n');

const packageJson = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJson)) {
  const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
  const scripts = pkg.scripts || {};

  const requiredScripts = [
    'test',
    'test:watch',
    'test:coverage',
    'test:e2e',
    'test:e2e:ui',
  ];

  requiredScripts.forEach(script => {
    if (scripts[script]) {
      console.log(`  ✅ ${script}: ${scripts[script]}`);
    } else {
      console.log(`  ❌ ${script}: NÃO ENCONTRADO`);
      errors++;
    }
  });

  console.log('\n📚 Verificando dependências de teste...\n');

  const devDeps = pkg.devDependencies || {};
  const testDeps = [
    'jest',
    '@testing-library/react',
    '@testing-library/jest-dom',
    '@playwright/test',
  ];

  testDeps.forEach(dep => {
    if (devDeps[dep]) {
      console.log(`  ✅ ${dep}: ${devDeps[dep]}`);
    } else {
      console.log(`  ⚠️  ${dep}: NÃO INSTALADO`);
      warnings++;
    }
  });
}

// Verificar documentação
console.log('\n📖 Verificando documentação...\n');

const docs = [
  'TESTING.md',
  'QUICK_START_TESTING.md',
];

docs.forEach(doc => {
  const fullPath = path.join(__dirname, doc);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n').length;
    console.log(`  ✅ ${doc} (${lines} linhas)`);
  } else {
    console.log(`  ❌ ${doc} - NÃO ENCONTRADO`);
    errors++;
  }
});

// Resumo
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMO DA VALIDAÇÃO\n');

const totalTests = testFiles.reduce((sum, file) => {
  const fullPath = path.join(__dirname, file);
  if (!fs.existsSync(fullPath)) return sum;
  const content = fs.readFileSync(fullPath, 'utf8');
  return sum + (content.match(/\b(test|it)\(/g) || []).length;
}, 0);

console.log(`  Total de arquivos de teste: ${testFiles.length}`);
console.log(`  Total de casos de teste: ${totalTests}`);
console.log(`  Arquivos de configuração: ${configFiles.length}`);
console.log(`  Arquivos de documentação: ${docs.length}\n`);

if (errors === 0 && warnings === 0) {
  console.log('  ✅ TODOS OS TESTES VALIDADOS COM SUCESSO!\n');
  console.log('  Para executar os testes, primeiro instale as dependências:');
  console.log('  npm install\n');
} else {
  if (errors > 0) {
    console.log(`  ❌ ${errors} erro(s) encontrado(s)`);
  }
  if (warnings > 0) {
    console.log(`  ⚠️  ${warnings} aviso(s) encontrado(s)`);
  }
  console.log('');
}

console.log('='.repeat(60) + '\n');

process.exit(errors > 0 ? 1 : 0);
