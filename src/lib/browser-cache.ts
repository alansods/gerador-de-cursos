/**
 * Utilitários para gerenciar cache do navegador e dados corrompidos
 */

export interface CacheStats {
  cookies: number;
  localStorage: number;
  sessionStorage: number;
  cacheStorage: boolean;
}

/**
 * Obtém estatísticas do cache do navegador
 */
export async function getCacheStats(): Promise<CacheStats> {
  const stats: CacheStats = {
    cookies: 0,
    localStorage: 0,
    sessionStorage: 0,
    cacheStorage: false,
  };

  if (typeof window === 'undefined') {
    return stats;
  }

  // Contar cookies
  stats.cookies = document.cookie.split(';').filter(c => c.trim()).length;

  // Contar itens no localStorage
  try {
    stats.localStorage = localStorage.length;
  } catch (e) {
    console.warn('Erro ao acessar localStorage:', e);
  }

  // Contar itens no sessionStorage
  try {
    stats.sessionStorage = sessionStorage.length;
  } catch (e) {
    console.warn('Erro ao acessar sessionStorage:', e);
  }

  // Verificar se há cache storage
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      stats.cacheStorage = cacheNames.length > 0;
    }
  } catch (e) {
    console.warn('Erro ao acessar cache storage:', e);
  }

  return stats;
}

/**
 * Limpa todos os dados do navegador relacionados à aplicação
 */
export async function clearBrowserCache(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  console.log('[BrowserCache] 🧹 Iniciando limpeza de cache...');

  // Limpar localStorage
  try {
    const itemsCleared = localStorage.length;
    localStorage.clear();
    console.log(`[BrowserCache] ✅ localStorage limpo (${itemsCleared} itens)`);
  } catch (e) {
    console.warn('[BrowserCache] ⚠️ Erro ao limpar localStorage:', e);
  }

  // Limpar sessionStorage
  try {
    const itemsCleared = sessionStorage.length;
    sessionStorage.clear();
    console.log(`[BrowserCache] ✅ sessionStorage limpo (${itemsCleared} itens)`);
  } catch (e) {
    console.warn('[BrowserCache] ⚠️ Erro ao limpar sessionStorage:', e);
  }

  // Limpar cookies (apenas os que podemos acessar via JavaScript)
  try {
    const cookies = document.cookie.split(';');
    let cookiesCleared = 0;

    for (const cookie of cookies) {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();

      if (name) {
        // Tentar limpar cookie em diferentes paths
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
        cookiesCleared++;
      }
    }

    console.log(`[BrowserCache] ✅ Cookies limpos (${cookiesCleared} tentativas)`);
  } catch (e) {
    console.warn('[BrowserCache] ⚠️ Erro ao limpar cookies:', e);
  }

  // Limpar Cache Storage
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log(`[BrowserCache] ✅ Cache Storage limpo (${cacheNames.length} caches)`);
    }
  } catch (e) {
    console.warn('[BrowserCache] ⚠️ Erro ao limpar cache storage:', e);
  }

  console.log('[BrowserCache] 🎉 Limpeza de cache concluída!');
}

/**
 * Detecta possíveis problemas com dados corrompidos
 */
export async function detectCorruptedData(): Promise<{
  hasIssues: boolean;
  issues: string[];
}> {
  const issues: string[] = [];

  if (typeof window === 'undefined') {
    return { hasIssues: false, issues };
  }

  // Verificar cookies malformados
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      if (cookie.includes('undefined') || cookie.includes('null')) {
        issues.push(`Cookie com valor inválido detectado: ${cookie.substring(0, 50)}`);
      }
    }
  } catch (e) {
    issues.push('Erro ao verificar cookies');
  }

  // Verificar localStorage
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value === 'undefined' || value === 'null') {
          issues.push(`localStorage item inválido: ${key}`);
        }
      }
    }
  } catch (e) {
    issues.push('Erro ao verificar localStorage');
  }

  // Verificar sessionStorage
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        const value = sessionStorage.getItem(key);
        if (value === 'undefined' || value === 'null') {
          issues.push(`sessionStorage item inválido: ${key}`);
        }
      }
    }
  } catch (e) {
    issues.push('Erro ao verificar sessionStorage');
  }

  return {
    hasIssues: issues.length > 0,
    issues,
  };
}

/**
 * Hook de diagnóstico - retorna informações sobre o estado do cache
 */
export async function runDiagnostics(): Promise<{
  stats: CacheStats;
  corruption: { hasIssues: boolean; issues: string[] };
}> {
  console.log('[BrowserCache] 🔍 Executando diagnóstico...');

  const stats = await getCacheStats();
  const corruption = await detectCorruptedData();

  console.log('[BrowserCache] 📊 Estatísticas:', stats);
  console.log('[BrowserCache] 🐛 Problemas detectados:', corruption);

  return { stats, corruption };
}
