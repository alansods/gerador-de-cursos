import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  // OBRIGATÓRIO para SCORM: todos os assets usam paths relativos dentro do ZIP
  base: './',

  plugins: [react(), tailwindcss()],

  // A raiz do build é player/ (onde fica index.html)
  root: path.resolve(__dirname),

  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },

  resolve: {
    alias: {
      // Reutiliza components, types e hooks do editor sem copiar arquivos
      '@': path.resolve(__dirname, '../src'),
    },
  },

  define: {
    // Substitui referências a variáveis de ambiente Next.js em tempo de build
    // SCORMNavbar usa process.env.NEXT_PUBLIC_IS_SCORM_BUILD — sempre false no player
    // (o player sempre usa o modo onNavigate/SPA)
    'process.env.NEXT_PUBLIC_IS_SCORM_BUILD': JSON.stringify('false'),
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
})
