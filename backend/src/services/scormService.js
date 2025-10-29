import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export const generateSCORMPackage = async (curso) => {
  try {
    console.log(`📦 [SCORM] Gerando pacote para: ${curso.titulo}`);
    
    // 1. Salvar dados do curso em arquivo temporário
    const tempFile = path.join('/tmp', 'temp-curso.json');
    fs.writeFileSync(tempFile, JSON.stringify(curso, null, 2));
    
    console.log(`💾 [SCORM] Dados salvos em: ${tempFile}`);
    
    // 2. Executar comando original package-scorm
    console.log('🔧 [SCORM] Executando comando package-scorm...');
    const { stdout, stderr } = await execAsync(`npm run package-scorm -- "${tempFile}"`, {
      cwd: process.cwd()
    });
    
    if (stderr) {
      console.log('⚠️ [SCORM] Warnings:', stderr);
    }
    
    console.log('📋 [SCORM] Output:', stdout);
    
    // 3. Ler arquivo ZIP gerado
    const zipPath = path.join('/tmp', `${curso.titulo.replace(/[^a-zA-Z0-9]/g, "_")}_SCORM.zip`);
    
    if (!fs.existsSync(zipPath)) {
      throw new Error(`Arquivo ZIP não foi gerado: ${zipPath}`);
    }
    
    const zipBuffer = fs.readFileSync(zipPath);
    
    // 4. Limpar arquivos temporários
    fs.unlinkSync(tempFile);
    fs.unlinkSync(zipPath);
    
    console.log(`✅ [SCORM] Pacote gerado com sucesso (${zipBuffer.length} bytes)`);
    return zipBuffer;
    
  } catch (error) {
    console.error('❌ [SCORM] Erro ao executar comando package-scorm:', error);
    throw new Error(`Falha na geração do pacote SCORM: ${error.message}`);
  }
};