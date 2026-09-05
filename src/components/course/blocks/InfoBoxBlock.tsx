import { InfoBox } from '@/components/InfoBox'
import { ConteudoUnidade } from '@/types/gerador-curso'

export function InfoBoxBlock({ item }: { item: ConteudoUnidade }) {
  return (
    <div className="mb-4 w-full">
      {item.tipoInfoBox ? (
        <InfoBox tipo={item.tipoInfoBox} titulo={item.tituloInfoBox} className="w-full">
          <div
            dangerouslySetInnerHTML={{
              __html: item.conteudo || '',
            }}
          />
        </InfoBox>
      ) : (
        <div className="text-gray-500 dark:text-gray-400 text-sm italic p-4 border border-gray-300 dark:border-gray-700 rounded-lg">
          Info Box incompleto ou sem dados
        </div>
      )}
    </div>
  )
}
