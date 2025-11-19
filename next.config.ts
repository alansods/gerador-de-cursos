import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Desabilitar trailing slashes para evitar redirecionamentos 308
  trailingSlash: false,

  // Ignorar erros de ESLint durante o build
  // O TypeScript já valida os tipos, então isso é seguro
  eslint: {
    // Durante o build de produção, ignora os erros de lint
    // Mas ainda roda o linting localmente com npm run lint
    ignoreDuringBuilds: true,
  },

  // Forçar inclusão de arquivos necessários para a função serverless /api/generate-scorm-v2
  // Na Vercel, arquivos não usados são removidos do bundle para otimizar tamanho
  // Isso garante que public/, generate-scorm-isolated.mjs e arquivos de config sejam incluídos
  // Nota: outputFileTracingIncludes foi movido de experimental para o nível raiz no Next.js 15
  outputFileTracingIncludes: {
    '/api/generate-scorm-v2': [
      './public/**/*',                    // Toda a pasta public (templates, assets, etc)
      './generate-scorm-isolated.mjs',    // Script isolado de geração SCORM
      './package.json',                   // Para ler dependências e versões
      './tsconfig.json',                  // Configuração TypeScript (se necessário)
      './next.config.ts',                 // Configuração Next.js (se necessário)
      './src/**/*',                       // Código fonte necessário para o build SCORM
      // ✅ CRÍTICO: Forçar inclusão do binário e dependências do Next.js
      // Sem isso, a Vercel remove o Next.js via tree shaking (API routes não precisam fazer build)
      // IMPORTANTE: Não incluir node_modules completo para evitar problemas com symlinks
      // Em vez disso, incluir apenas os arquivos essenciais do Next.js
      './node_modules/next/dist/bin/next', // Binário do Next.js (arquivo específico, não pasta inteira)
      './node_modules/next/dist/**/*',     // Distribuição do Next.js (sem symlinks)
      './node_modules/@next/**/*',         // Pacotes internos do Next.js
      './node_modules/react/index.js',     // React (arquivo principal)
      './node_modules/react-dom/index.js', // React DOM (arquivo principal)
    ],
  },
  
  // Configuração para exportação estática (usado para gerar SCORM)
  // Quando output: 'export' está ativo, o Next.js gera HTML estático
  // Isso é necessário apenas durante o build do SCORM, não em produção normal
  // ✅ O build SCORM usa .next-scorm/ isolado para não interferir no servidor de desenvolvimento
  ...(process.env.NEXT_OUTPUT_EXPORT === 'true' ? {
    output: 'export' as const,
    // Nota: Não podemos usar assetPrefix: '.' porque next/font não suporta
    // Em vez disso, vamos processar os arquivos HTML após o build para converter
    // caminhos absolutos em relativos (feito em scorm-build-service.ts)
    // Excluir rotas de API do build estático
    // O Next.js não deve tentar processar rotas de API durante export estático
    distDir: '.next-scorm', // ✅ Diretório isolado para build SCORM (não interfere no dev server)
  } : {}),
  
  // Desabilitar otimização de imagens para exportação estática
  images: {
    unoptimized: true,
  },
  
  // Configurações de API
  // Nota: headers não funcionam com output: 'export', mas são necessários para produção normal
  // Por isso só aplicamos quando não estiver em modo de export
  ...(process.env.NEXT_OUTPUT_EXPORT !== 'true' ? {
    async headers() {
      return [
        {
          // Aplicar headers CORS para todas as rotas de API
          source: '/api/:path*',
          headers: [
            { key: 'Access-Control-Allow-Credentials', value: 'true' },
            { key: 'Access-Control-Allow-Origin', value: '*' },
            { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
            { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
          ],
        },
      ];
    },
  } : {}),
};

export default nextConfig;
