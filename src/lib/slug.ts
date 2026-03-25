import { prisma } from './prisma';
import type { Unidade } from '@/types/gerador-curso';

/**
 * Converte um título em slug URL-amigável.
 * Ex: "Introdução à Programação" → "introducao-a-programacao"
 */
export function slugify(text: string): string {
  return text
    .normalize('NFD')                        // decompõe acentos
    .replace(/[\u0300-\u036f]/g, '')         // remove diacríticos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')            // remove caracteres especiais
    .replace(/\s+/g, '-')                    // espaços → hífens
    .replace(/-+/g, '-')                     // múltiplos hífens → um
    .replace(/^-|-$/g, '');                  // remove hífens nas bordas
}

/**
 * Gera slugs de unidades baseados na ordem: unidade-1, unidade-2, etc.
 * Sempre regenera para garantir consistência com a posição atual.
 */
export function slugifyUnidades(unidades: any[]): any[] {
  return unidades.map((u, index) => ({
    ...u,
    slug: `unidade-${index + 1}`,
  }));
}

/**
 * Gera um slug único para o banco, adicionando sufixo numérico se necessário.
 * Ex: "meu-curso" → "meu-curso-2" se já existir
 */
export async function generateUniqueSlug(titulo: string, excludeId?: string): Promise<string> {
  const base = slugify(titulo);
  let candidate = base;
  let counter = 2;

  while (true) {
    const existing = await prisma.curso.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing || existing.id === excludeId) {
      return candidate;
    }

    candidate = `${base}-${counter}`;
    counter++;
  }
}
