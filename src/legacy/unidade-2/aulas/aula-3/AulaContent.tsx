import {
  ContentSection,
  ContentTitle,
  ContentParagraph,
} from "@/components/content-section";

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
        A escolha do equipamento certo é vital para a eficiência da
        movimentação.
      </ContentParagraph>

      <ContentTitle level={5} className="text-blue-600">
        Equipamentos de Transporte:
      </ContentTitle>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="paleteiras-transporte">
          <AccordionTrigger>Paleteiras</AccordionTrigger>
          <AccordionContent>
            Manuais ou elétricas, usadas para mover paletes em curtas
            distâncias.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="transportadores-esteira">
          <AccordionTrigger>Transportadores de Esteira</AccordionTrigger>
          <AccordionContent>
            Sistemas automatizados para mover produtos em linhas de produção.
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <ContentTitle level={5} className="text-blue-600 mt-8">
        Equipamentos de Elevação:
      </ContentTitle>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="empilhadeiras">
          <AccordionTrigger>Empilhadeiras</AccordionTrigger>
          <AccordionContent>
            Essenciais para mover e empilhar paletes em grandes alturas.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="talhas-pontes-rolantes">
          <AccordionTrigger>Talhas e Pontes Rolantes</AccordionTrigger>
          <AccordionContent>
            Usadas para levantar e mover cargas pesadas em ambientes fixos, como
            fábricas.
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <ContentTitle level={5} className="text-blue-600 mt-8">
        Outros Equipamentos:
      </ContentTitle>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="guindastes-elevadores">
          <AccordionTrigger>Guindastes e Elevadores</AccordionTrigger>
          <AccordionContent>
            Usados para movimentar cargas verticalmente em grandes distâncias.
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <ContentParagraph className="mt-6">
        Na hora de selecionar o equipamento ideal, é preciso analisar diversos
        critérios. O equipamento deve ser apropriado para o sistema de manuseio,
        otimizar o fluxo de materiais e ser prático e simples. Outros pontos
        importantes são a segurança, a flexibilidade, o baixo peso morto e a
        capacidade de movimentar cargas unitizadas. A análise econômica deve
        considerar o custo do ciclo de vida completo do equipamento, e não
        apenas o custo inicial.
      </ContentParagraph>
    </ContentSection>
  );
}
