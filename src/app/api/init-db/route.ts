import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Criar tabela de cursos
    await sql`
      CREATE TABLE IF NOT EXISTS cursos (
        id TEXT PRIMARY KEY,
        titulo TEXT NOT NULL,
        descricao TEXT NOT NULL,
        carga_horaria TEXT NOT NULL,
        instrutor TEXT NOT NULL,
        modalidade TEXT NOT NULL,
        categoria TEXT NOT NULL,
        unidades JSONB DEFAULT '[]',
        data_criacao TIMESTAMP DEFAULT NOW(),
        data_modificacao TIMESTAMP DEFAULT NOW()
      );
    `;

    // Criar índices para melhor performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_cursos_titulo ON cursos(titulo);
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_cursos_categoria ON cursos(categoria);
    `;

    return NextResponse.json({ 
      success: true, 
      message: 'Database initialized successfully' 
    });
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

