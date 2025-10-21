import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Para SCORM: usar caminhos relativos
  // Para Vercel: usar caminhos absolutos
  const isSCORM = process.env.BUILD_SCORM === 'true'
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    base: isSCORM ? './' : '/', // Condicional para SCORM vs Vercel
    publicDir: 'public',
    build: {
      outDir: 'build',
      sourcemap: isSCORM ? false : true, // Desabilitar sourcemap para SCORM
      minify: 'terser',
      rollupOptions: {
        output: {
          // Para SCORM, garantir nomes de arquivos consistentes
          entryFileNames: isSCORM ? 'static/js/[name].[hash].js' : 'static/js/[name].[hash].js',
          chunkFileNames: isSCORM ? 'static/js/[name].[hash].chunk.js' : 'static/js/[name].[hash].chunk.js',
          assetFileNames: isSCORM ? 'static/[ext]/[name].[hash].[ext]' : 'static/[ext]/[name].[hash].[ext]',
          manualChunks: isSCORM ? {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['@radix-ui/react-accordion', '@radix-ui/react-dialog', '@radix-ui/react-tabs']
          } : undefined
        }
      },
      // Otimizações específicas para SCORM
      ...(isSCORM && {
        target: 'es2015', // Compatibilidade com LMS mais antigos
        cssCodeSplit: false, // Unificar CSS em um arquivo
        assetsInlineLimit: 0, // Não inline assets para SCORM
      })
    },
    server: {
      port: 3000,
      open: true,
      historyApiFallback: true,
    },
    // Configurações específicas para desenvolvimento
    define: {
      __SCORM_MODE__: isSCORM,
    },
  }
})
