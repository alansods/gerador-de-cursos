import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    console.log('📦 [Init DB] Criando tabelas...');

    // Criar tabela de cursos
    await sql`
      CREATE TABLE IF NOT EXISTS cursos (
        id TEXT PRIMARY KEY,
        titulo TEXT NOT NULL,
        descricao TEXT,
        carga_horaria TEXT,
        modalidade TEXT,
        instrutor TEXT,
        categoria TEXT,
        duracao INTEGER,
        nivel TEXT,
        idioma TEXT DEFAULT 'pt-BR',
        versao_scorm TEXT DEFAULT '1.2',
        cor_tema TEXT,
        logo_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Criar tabela de módulos
    await sql`
      CREATE TABLE IF NOT EXISTS modulos (
        id TEXT PRIMARY KEY,
        curso_id TEXT NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
        titulo TEXT NOT NULL,
        descricao TEXT,
        ordem INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Criar tabela de aulas
    await sql`
      CREATE TABLE IF NOT EXISTS aulas (
        id TEXT PRIMARY KEY,
        modulo_id TEXT NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
        curso_id TEXT NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
        titulo TEXT NOT NULL,
        tipo TEXT NOT NULL,
        conteudo JSONB NOT NULL,
        ordem INTEGER NOT NULL,
        duracao_estimada INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Criar índices
    await sql`CREATE INDEX IF NOT EXISTS idx_modulos_curso_id ON modulos(curso_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_modulos_ordem ON modulos(curso_id, ordem)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_aulas_modulo_id ON aulas(modulo_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_aulas_curso_id ON aulas(curso_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_aulas_ordem ON aulas(modulo_id, ordem)`;

    console.log('✅ [Init DB] Tabelas criadas com sucesso!');

    res.status(200).json({
      message: 'Banco de dados inicializado com sucesso',
      tables: ['cursos', 'modulos', 'aulas'],
    });
  } catch (error) {
    console.error('❌ [Init DB] Erro ao criar tabelas:', error);
    res.status(500).json({
      error: 'Erro ao inicializar banco de dados',
      details: error.message,
    });
  }
}

