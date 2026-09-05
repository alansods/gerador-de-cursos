import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ConteudoUnidade } from '@/types/gerador-curso'

export function AccordionBlock({ item }: { item: ConteudoUnidade }) {
  return (
    <div className="mb-4">
      {item.items && item.items.length > 0 ? (
        <Accordion type="single" collapsible className="w-full">
          {item.items.map((accordionItem, idx) => (
            <AccordionItem key={accordionItem.id || idx} value={`item-${idx}`}>
              <AccordionTrigger className="text-left font-semibold">
                {accordionItem.titulo}
              </AccordionTrigger>
              <AccordionContent>
                <div
                  className="text-gray-700 dark:text-gray-300 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: accordionItem.conteudo,
                  }}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="text-gray-500 dark:text-gray-400 text-sm italic">Accordion vazio</div>
      )}
    </div>
  )
}
