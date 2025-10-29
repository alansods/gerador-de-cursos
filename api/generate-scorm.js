// Este arquivo é o "adaptador" para a Vercel.
// Ele importa a lógica real do seu backend.

// O caminho correto para o seu serviço
import { generateSCORMPackage } from '../backend/src/services/scormService.js';

// Handler serverless da Vercel
export default async function handler(req, res) {
  // 1. Configurar CORS manualmente para a Vercel
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // Ou seu domínio: 'https://gerador-de-cursos.vercel.app'
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 2. Tratar a requisição OPTIONS (pré-flight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 3. Tratar a requisição POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 4. Obter o body
  const { curso } = req.body;

  // 5. Validar
  if (!curso || !curso.titulo || !curso.id) {
    return res.status(400).json({ error: 'Dados do curso são obrigatórios' });
  }

  // 6. Executar a lógica de serviço
  try {
    console.log(`📦 [Vercel Function] Iniciando geração para: ${curso.titulo}`);
    const scormBuffer = await generateSCORMPackage(curso);

    // 7. Retornar o ZIP
    const filename = `${curso.titulo.replace(/[^a-zA-Z0-9]/g, '_')}_SCORM.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', scormBuffer.length);
    res.send(scormBuffer);
  
  } catch (error) {
    console.error('❌ [Vercel Function] Erro na geração:', error);
    res.status(500).json({
      error: 'Erro interno do servidor ao gerar SCORM',
      details: error.message,
    });
  }
}
