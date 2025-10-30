'use client'

import React, { useEffect, useState } from 'react'

export const DatabaseInit: React.FC = () => {
  const [status, setStatus] = useState('Inicializando banco de dados...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initDb = async () => {
      try {
        const response = await fetch('/api/init-db', { method: 'POST' })
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Erro ao inicializar o banco de dados')
        }
        setStatus('Banco de dados inicializado com sucesso!')
      } catch (err: any) {
        console.error('Erro ao inicializar DB:', err)
        setError(err.message)
        setStatus('Falha ao inicializar o banco de dados.')
      }
    }
    initDb()
  }, [])

  if (error) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg z-50">
        <strong className="font-bold">Erro no DB:</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    )
  }

  if (status !== 'Banco de dados inicializado com sucesso!') {
    return (
      <div className="fixed bottom-4 right-4 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded shadow-lg z-50">
        <strong className="font-bold">DB Status:</strong>
        <span className="block sm:inline"> {status}</span>
      </div>
    )
  }

  return null
}
