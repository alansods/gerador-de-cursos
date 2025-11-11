'use client';

// Esta página não deve ser exportada estaticamente (página de teste)
export const dynamic = 'error';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Comment {
  id: number;
  text: string;
  createdAt: string;
}

export default function TestPrismaPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchComments() {
    try {
      setError(null);
      const res = await fetch('/api/comments');
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch comments');
      }
      
      setComments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
      console.error('Error fetching comments:', err);
    }
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    
    if (!text.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create comment');
      }
      
      setText('');
      await fetchComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create comment');
      console.error('Error creating comment:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchComments();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">
              Teste Prisma + Neon
            </CardTitle>
            <p className="text-gray-600 text-center mt-2">
              Sistema de comentários usando Prisma ORM
            </p>
          </CardHeader>
          <CardContent>
            {/* Formulário */}
            <form onSubmit={submitComment} className="mb-8">
              <div className="flex gap-2">
                <Input
                  type="text"
                  name="text"
                  placeholder="Escreva um comentário..."
                  className="flex-1"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={loading}
                />
                <Button
                  type="submit"
                  disabled={loading || !text.trim()}
                  className="min-w-[100px]"
                >
                  {loading ? 'Enviando...' : 'Enviar'}
                </Button>
              </div>
            </form>

            {/* Mensagem de erro */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
                <p className="font-semibold">Erro:</p>
                <p className="text-sm">{error}</p>
                {error.includes('DATABASE_URL') && (
                  <p className="text-xs mt-2">
                    Configure a variável DATABASE_URL no arquivo .env.local
                  </p>
                )}
              </div>
            )}

            {/* Lista de comentários */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Comentários ({comments.length})
              </h3>
              
              {comments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Nenhum comentário ainda. Seja o primeiro!
                </p>
              ) : (
                <ul className="space-y-2">
                  {comments.map((comment) => (
                    <li
                      key={comment.id}
                      className="border-b border-gray-200 pb-3 last:border-0"
                    >
                      <p className="text-gray-900">{comment.text}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(comment.createdAt).toLocaleString('pt-BR')}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Info adicional */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <h4 className="font-semibold text-blue-900 mb-2">
                  📝 Como configurar:
                </h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Crie um banco no Neon: <a href="https://neon.tech" target="_blank" rel="noopener noreferrer" className="underline">neon.tech</a></li>
                  <li>Copie a connection string</li>
                  <li>Adicione DATABASE_URL no .env.local</li>
                  <li>Execute: <code className="bg-blue-100 px-1 rounded">npx prisma migrate dev</code></li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

