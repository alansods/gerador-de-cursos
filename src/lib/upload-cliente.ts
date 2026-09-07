'use client'

import { upload } from '@vercel/blob/client'
import { POLITICA_MIDIAS, validarArquivo, type CategoriaMidia } from './midias'

export interface ResultadoUpload {
  url: string
  aviso: string | null
}

/**
 * Envia o arquivo direto do browser para o Vercel Blob. A rota só emite um token
 * assinado — o corpo do arquivo nunca passa pela função serverless, que na Vercel
 * rejeita requisições acima de 4,5 MB.
 */
export async function enviarArquivo(
  arquivo: File,
  categoria: CategoriaMidia
): Promise<ResultadoUpload> {
  const { erro, aviso } = validarArquivo(arquivo, categoria)
  if (erro) throw new Error(erro)

  const politica = POLITICA_MIDIAS[categoria]
  const nome = arquivo.name.replace(/[^\w.-]+/g, '-').slice(-80)

  const blob = await upload(`cursos/${politica.categoria}/${nome}`, arquivo, {
    access: 'public',
    handleUploadUrl: '/api/upload-file',
    clientPayload: categoria,
    contentType: arquivo.type,
  })

  return { url: blob.url, aviso }
}
