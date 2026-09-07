import { Download, FileText } from 'lucide-react'
import { ConteudoUnidade } from '@/types/gerador-curso'

export function PdfBlock({ item }: { item: ConteudoUnidade }) {
  if (!item.pdfUrl) {
    return <div className="text-gray-500 dark:text-gray-400 text-sm italic mb-4">PDF vazio</div>
  }

  const titulo = item.pdfTitulo || 'Documento'

  return (
    <div className="mb-4 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--block-accent,#2563eb)/10 text-(--block-accent,#2563eb)">
          <FileText className="h-4 w-4" />
        </span>
        <p className="flex-1 font-medium text-gray-900 dark:text-gray-100">{titulo}</p>
        {item.permitirDownloadPdf !== false && (
          <a
            href={item.pdfUrl}
            download
            className="flex shrink-0 items-center gap-1.5 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Download className="h-3.5 w-3.5" />
            Baixar
          </a>
        )}
      </div>

      <object data={item.pdfUrl} type="application/pdf" className="h-[600px] w-full">
        {/* Muitos LMS bloqueiam PDF embutido; o link abaixo é o caminho garantido */}
        <div className="p-6 text-center">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Não foi possível exibir o PDF aqui.
          </p>
          <a
            href={item.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm font-medium text-(--block-accent,#2563eb) underline"
          >
            Abrir {titulo} em nova aba
          </a>
        </div>
      </object>
    </div>
  )
}
