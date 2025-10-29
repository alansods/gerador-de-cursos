import { generateAdvancedSCORMPackage } from '../backend/src/services/scormAdvancedService.js';

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
}
