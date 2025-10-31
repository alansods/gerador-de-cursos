import { useEffect, useState } from 'react';
import { initDatabase } from '@/lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

/**
 * Componente que inicializa o banco de dados na primeira vez que o app carrega
 */
export function DatabaseInit() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const hasInitialized = localStorage.getItem('db-initialized');
      
      // Só inicializa uma vez
      if (!hasInitialized) {
        setStatus('loading');
        try {
          await initDatabase();
          localStorage.setItem('db-initialized', 'true');
          setStatus('success');
          
          // Esconder mensagem de sucesso após 3 segundos
          setTimeout(() => setStatus(null), 3000);
        } catch (err) {
          setStatus('error');
          setError(err instanceof Error ? err.message : 'Erro desconhecido');
        }
      }
    };

    init();
  }, []);

  if (!status) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      {status === 'loading' && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Inicializando banco de dados...
          </AlertDescription>
        </Alert>
      )}

      {status === 'success' && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">
            ✅ Banco de dados inicializado com sucesso!
          </AlertDescription>
        </Alert>
      )}

      {status === 'error' && (
        <Alert variant="destructive">
          <AlertDescription>
            ❌ Erro ao inicializar banco: {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

