import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function GET() {
  try {
    const { rows } = await sql`SELECT * FROM cursos ORDER BY created_at DESC`
    return NextResponse.json({ cursos: rows })
  } catch (error) {
    console.error('Erro ao buscar cursos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar cursos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const curso = await request.json()
    
    await sql`
      INSERT INTO cursos (id, titulo, descricao, carga_horaria, modalidade, instrutor, categoria, duracao, nivel, idioma, versao_scorm, cor_tema, logo_url)
      VALUES (
        ${curso.id},
        ${curso.titulo},
        ${curso.descricao || null},
        ${curso.cargaHoraria || null},
        ${curso.modalidade || null},
        ${curso.instrutor || null},
        ${curso.categoria || null},
        ${curso.duracao || null},
        ${curso.nivel || null},
        ${curso.idioma || 'pt-BR'},
        ${curso.versaoSCORM || '1.2'},
        ${curso.corTema || null},
        ${curso.logoUrl || null}
      )
      ON CONFLICT (id) DO UPDATE SET
        titulo = EXCLUDED.titulo,
        descricao = EXCLUDED.descricao,
        carga_horaria = EXCLUDED.carga_horaria,
        modalidade = EXCLUDED.modalidade,
        instrutor = EXCLUDED.instrutor,
        categoria = EXCLUDED.categoria,
        duracao = EXCLUDED.duracao,
        nivel = EXCLUDED.nivel,
        idioma = EXCLUDED.idioma,
        versao_scorm = EXCLUDED.versao_scorm,
        cor_tema = EXCLUDED.cor_tema,
        logo_url = EXCLUDED.logo_url,
        updated_at = CURRENT_TIMESTAMP
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao salvar curso:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar curso' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do curso é obrigatório' },
        { status: 400 }
      )
    }

    await sql`DELETE FROM cursos WHERE id = ${id}`
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar curso:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar curso' },
      { status: 500 }
    )
  }
}
