import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // GET - Listar todos os cursos
    if (req.method === 'GET') {
      const { rows } = await sql`
        SELECT 
          c.*,
          COUNT(DISTINCT m.id) as total_modulos,
          COUNT(DISTINCT a.id) as total_aulas
        FROM cursos c
        LEFT JOIN modulos m ON c.id = m.curso_id
        LEFT JOIN aulas a ON c.id = a.curso_id
        GROUP BY c.id
        ORDER BY c.updated_at DESC
      `;

      // Para cada curso, buscar módulos e aulas
      const cursosCompletos = await Promise.all(
        rows.map(async (curso) => {
          // Buscar módulos do curso
          const { rows: modulos } = await sql`
            SELECT * FROM modulos 
            WHERE curso_id = ${curso.id}
            ORDER BY ordem
          `;

          // Para cada módulo, buscar suas aulas
          const modulosComAulas = await Promise.all(
            modulos.map(async (modulo) => {
              const { rows: aulas } = await sql`
                SELECT * FROM aulas 
                WHERE modulo_id = ${modulo.id}
                ORDER BY ordem
              `;
              return { ...modulo, aulas };
            })
          );

          return {
            ...curso,
            modulos: modulosComAulas,
          };
        })
      );

      return res.status(200).json({ cursos: cursosCompletos });
    }

    // POST - Criar novo curso
    if (req.method === 'POST') {
      const { curso } = req.body;

      if (!curso || !curso.id || !curso.titulo) {
        return res.status(400).json({ error: 'Dados do curso são obrigatórios' });
      }

      // Inserir curso (aceita tanto modulos quanto unidades)
      const unidades = curso.modulos || curso.unidades || [];
      
      await sql`
        INSERT INTO cursos (id, titulo, descricao, duracao, nivel, idioma, versao_scorm, cor_tema, logo_url)
        VALUES (
          ${curso.id},
          ${curso.titulo},
          ${curso.descricao || null},
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
          duracao = EXCLUDED.duracao,
          nivel = EXCLUDED.nivel,
          idioma = EXCLUDED.idioma,
          versao_scorm = EXCLUDED.versao_scorm,
          cor_tema = EXCLUDED.cor_tema,
          logo_url = EXCLUDED.logo_url,
          updated_at = CURRENT_TIMESTAMP
      `;

      // Deletar módulos e aulas existentes (para recriar)
      await sql`DELETE FROM modulos WHERE curso_id = ${curso.id}`;

      // Inserir módulos e aulas
      if (unidades && unidades.length > 0) {
        for (let i = 0; i < unidades.length; i++) {
          const modulo = unidades[i];

          // Inserir módulo
          await sql`
            INSERT INTO modulos (id, curso_id, titulo, descricao, ordem)
            VALUES (
              ${modulo.id},
              ${curso.id},
              ${modulo.titulo},
              ${modulo.descricao || null},
              ${i}
            )
          `;

          // Inserir aulas do módulo
          if (modulo.aulas && modulo.aulas.length > 0) {
            for (let j = 0; j < modulo.aulas.length; j++) {
              const aula = modulo.aulas[j];

              await sql`
                INSERT INTO aulas (id, modulo_id, curso_id, titulo, tipo, conteudo, ordem, duracao_estimada)
                VALUES (
                  ${aula.id},
                  ${modulo.id},
                  ${curso.id},
                  ${aula.titulo},
                  ${aula.tipo},
                  ${JSON.stringify(aula)},
                  ${j},
                  ${aula.duracaoEstimada || null}
                )
              `;
            }
          }
        }
      }

      return res.status(201).json({ message: 'Curso salvo com sucesso', curso });
    }

    // DELETE - Deletar curso
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'ID do curso é obrigatório' });
      }

      await sql`DELETE FROM cursos WHERE id = ${id}`;

      return res.status(200).json({ message: 'Curso deletado com sucesso' });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('❌ [Courses API] Erro:', error);
    res.status(500).json({
      error: 'Erro ao processar requisição',
      details: error.message,
    });
  }
}

