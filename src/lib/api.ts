/**
 * Inicializa o banco de dados
 * Chama a API route /api/init-db
 */
export async function initDatabase() {
  const response = await fetch('/api/init-db', {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao inicializar banco de dados');
  }

  return response.json();
}

