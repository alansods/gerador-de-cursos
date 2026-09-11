import { extractYouTubeId } from '@/lib/youtube'
import { ConteudoUnidade } from '@/types/gerador-curso'

export function VideoBlock({ item }: { item: ConteudoUnidade }) {
  return (
    <div className="mb-4 w-full">
      {item.videoUrl && item.videoTitulo ? (
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {item.videoTitulo}
          </h4>
          <div className="aspect-video w-full rounded-lg overflow-hidden shadow-lg bg-gray-100 dark:bg-gray-800">
            {item.fonteVideo === 'arquivo' ? (
              // Sem autoplay: navegadores bloqueiam mídia automática dentro do iframe do LMS
              <video controls preload="metadata" className="w-full h-full" src={item.videoUrl}>
                Seu navegador não reproduz vídeo.
              </video>
            ) : (
              <iframe
                src={`https://www.youtube.com/embed/${extractYouTubeId(item.videoUrl)}`}
                title={item.videoTitulo}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </div>
      ) : (
        <div className="text-gray-500 dark:text-gray-400 text-sm italic p-4 border border-gray-300 dark:border-gray-700 rounded-lg">
          Vídeo incompleto ou sem dados
        </div>
      )}
    </div>
  )
}
