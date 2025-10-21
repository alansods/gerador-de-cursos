import { ContentSection, ContentParagraph } from "@/components/content-section";
import { DragDropActivity } from "@/pages/unidade-1/aulas/aula-5/components/drag-drop-activity";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function AulaContent() {
  return (
    <ContentSection>
      <ContentParagraph>
        A unitização consiste em agrupar diversas unidades menores em uma única
        carga, utilizando recursos como paletes, lingas e contêineres. Esse
        processo torna o transporte mais rápido, seguro e eficiente, reduzindo a
        quantidade de manuseios individuais e facilitando a movimentação com
        equipamentos mecânicos.
      </ContentParagraph>

      <div className="my-6">
        <Accordion
          type="single"
          collapsible
          className="w-full max-w-4xl mx-auto rounded-xl border border-border bg-card overflow-hidden"
        >
          <AccordionItem value="item-1">
            <AccordionTrigger>Paletização</AccordionTrigger>
            <AccordionContent>
              <p>
                Uso de paletes para formar cargas unitizadas, permitindo
                empilhamento e movimentação mecanizada.
              </p>
              <p className="mt-2 font-medium text-blue-600">
                "Facilita transporte interno e armazenagem vertical"
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger>Linga</AccordionTrigger>
            <AccordionContent>
              <p>
                Cabos, cintas ou correntes que agrupam volumes para serem
                içados.
              </p>
              <p className="mt-2 font-medium text-blue-600">
                "Movimenta cargas volumosas com segurança"
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger>Contêiner</AccordionTrigger>
            <AccordionContent>
              <p>
                Grande caixa metálica padronizada que permite acondicionar
                mercadorias diversas em um único módulo.
              </p>
              <p className="mt-2 font-medium text-blue-600">
                "Reduz manuseios, garante proteção e agiliza operações
                multimodais"
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <DragDropActivity />
    </ContentSection>
  );
}
