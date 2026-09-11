import { InfoBox } from '@/components/InfoBox'
import { Block } from '@/types/course'

export function InfoBoxBlock({ item }: { item: Block }) {
  return (
    <div className="mb-4 w-full">
      {item.tipoInfoBox ? (
        <InfoBox type={item.tipoInfoBox} title={item.tituloInfoBox} className="w-full">
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
