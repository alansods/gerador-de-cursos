import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Desabilitar trailing slashes para evitar redirecionamentos 308
  trailingSlash: false,
  
  // Configuração para exportação estática (usado para gerar SCORM)
  // Quando output: 'export' está ativo, o Next.js gera HTML estático
  // Isso é necessário apenas durante o build do SCORM, não em produção normal
  ...(process.env.NEXT_OUTPUT_EXPORT === 'true' ? {
    output: 'export' as const,
    // Nota: Não podemos usar assetPrefix: '.' porque next/font não suporta
    // Em vez disso, vamos processar os arquivos HTML após o build para converter
    // caminhos absolutos em relativos (feito em scorm-build-service.ts)
    // Excluir rotas de API do build estático
    // O Next.js não deve tentar processar rotas de API durante export estático
    distDir: '.next',
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
