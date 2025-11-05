// Caminho do Ficheiro: src/app/api/generate-scorm/route.ts

import { NextResponse } from 'next/server';
import { generateSCORMPackage } from '@/lib/scorm-service'; // Importa o nosso serviço
import { CursoGerado } from '@/types/gerador-curso'; // Importa o tipo

// Não precisamos do Prisma nem do 'cookies' aqui

export async function POST(req: Request) {
  try {
    // 1. Obter o objeto 'curso' completo do body
    const body = await req.json();
    const { curso } = body; // Recebe o objeto 'curso'

    if (!curso || !curso.id) {
      return NextResponse.json({ success: false, error: 'Objeto "curso" é obrigatório' }, { status: 400 });
    }

    // 2. O objeto 'curso' já vem pronto do frontend (do Context API)
    // Não é necessário buscar no Prisma.
    const cursoData: CursoGerado = curso;

    // 3. Gerar o pacote SCORM (chama nosso serviço)
    const zipBuffer = await generateSCORMPackage(cursoData);

    // 4. Retornar o arquivo .zip
    const filename = `${curso.titulo.replace(/[^a-zA-Z0-9]/g, "_")}_SCORM.zip`;
    
    return new NextResponse(zipBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error("❌ [API generate-scorm] Erro:", error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ success: false, error: 'Erro interno do servidor', details: errorMessage }, { status: 500 });
  }
}
