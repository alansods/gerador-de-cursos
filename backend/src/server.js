import express from 'express';
import cors from 'cors';
import { generateSCORMPackage } from './services/scormService.js';
import { generateAdvancedSCORMPackage } from './services/scormAdvancedService.js';

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
// --- INÍCIO DA CORREÇÃO ---
// Removendo a restrição de origem específica para permitir o desenvolvimento local
// A configuração anterior era: app.use(cors({ origin: 'http://localhost:3000', ... }));
app.use(cors()); // Permite todas as origens (ideal para desenvolvimento)
// --- FIM DA CORREÇÃO ---
app.use(express.json({ limit: '50mb' }));

// SCORM generation endpoint - ÚNICO endpoint necessário
app.post('/api/generate-scorm', async (req, res) => {
  try {
    const { curso } = req.body;
    
    if (!curso) {
      return res.status(400).json({ 
        error: 'Dados do curso são obrigatórios' 
      });
    }

    if (!curso.titulo || !curso.id) {
      return res.status(400).json({ 
        error: 'Título e ID do curso são obrigatórios' 
      });
    }

    console.log(`📦 [SCORM] Gerando pacote para: ${curso.titulo}`);
    
    // Generate SCORM package
    const scormBuffer = await generateSCORMPackage(curso);
    
    // Set headers for file download
    const filename = `${curso.titulo.replace(/[^a-zA-Z0-9]/g, "_")}_SCORM.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', scormBuffer.length);
    
    console.log(`✅ [SCORM] Pacote gerado: ${filename} (${scormBuffer.length} bytes)`);
    res.send(scormBuffer);
    
  } catch (error) {
    console.error('❌ [SCORM] Erro na geração:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor ao gerar SCORM',
      details: error.message 
    });
  }
});

// SCORM Advanced generation endpoint
app.post('/api/generate-scorm-advanced', async (req, res) => {
  try {
    const { curso } = req.body;
    
    if (!curso) {
      return res.status(400).json({ 
        error: 'Dados do curso são obrigatórios' 
      });
    }

    if (!curso.titulo || !curso.id) {
      return res.status(400).json({ 
        error: 'Título e ID do curso são obrigatórios' 
      });
    }

    console.log(`📦 [SCORM-ADVANCED] Iniciando geração avançada para curso: ${curso.titulo}`);
    
    const scormBuffer = await generateAdvancedSCORMPackage(curso);
    
    const filename = `${curso.titulo.replace(/[^a-zA-Z0-9]/g, "_")}_SCORM_Advanced.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', scormBuffer.length);
    
    console.log(`✅ [SCORM-ADVANCED] Pacote avançado gerado: ${filename} (${scormBuffer.length} bytes)`);
    res.send(scormBuffer);
    
  } catch (error) {
    console.error('❌ [SCORM-ADVANCED] Erro na geração avançada:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor ao gerar SCORM avançado',
      details: error.message 
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint não encontrado',
    message: 'Use POST /api/generate-scorm para gerar SCORM'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 [SERVER] Backend rodando na porta ${PORT}`);
  console.log(`📦 [SERVER] SCORM endpoint: http://localhost:${PORT}/api/generate-scorm`);
});

export default app;

