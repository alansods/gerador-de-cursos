import React from 'react'
import type { CursoGerado } from '@/types/gerador-curso'
import { SCORMPlayer } from '@/components/scorm/SCORMPlayer'

interface AppProps {
  curso: CursoGerado | null
}

export default function App({ curso }: AppProps) {
  if (!curso) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-gray-700 text-lg font-medium mb-1">Nenhum curso carregado</p>
          <p className="text-gray-400 text-sm">
            Este player precisa ser exportado a partir de um curso.
          </p>
        </div>
      </div>
    )
  }

  return <SCORMPlayer curso={curso} />
}
