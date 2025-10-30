import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function POST(request: NextRequest) {
  try {
    // Criar tabela de cursos
    await sql`
      CREATE TABLE IF NOT EXISTS cursos (
          id VARCHAR(255) PRIMARY KEY,
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
      );
    `

    return NextResponse.json({ 
      success: true, 
      message: 'Banco de dados inicializado com sucesso!' 
    })
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao inicializar banco de dados' 
      },
      { status: 500 }
    )
  }
}
