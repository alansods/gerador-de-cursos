import { ContentSection, ContentParagraph } from "@/components/content-section";

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
        As embalagens podem ser classificadas de diversas maneiras, de acordo
        com sua função, finalidade, movimentação e utilidade. Pela função, a
        classificação se dá em níveis.
      </ContentParagraph>

      <div className="my-6">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>Embalagem Primária</AccordionTrigger>
            <AccordionContent>
              <p>
                É o invólucro direto do produto, em contato com ele.
                <br />
                <strong>Exemplo:</strong> A lata de um refrigerante, o frasco de
                um xampu.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger>Embalagem Secundária</AccordionTrigger>
            <AccordionContent>
              <p>
                É o invólucro que agrupa várias embalagens primárias.
                <br />
                <strong>Exemplo:</strong> O fardo de plástico que agrupa seis
                latas de refrigerante.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger>Embalagem Terciária</AccordionTrigger>
            <AccordionContent>
              <p>
                Destinada a agrupar embalagens secundárias para facilitar o
                transporte.
                <br />
                <strong>Exemplo:</strong> A caixa de papelão que contém vários
                fardos de refrigerante.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger>
              Embalagem Quaternária (Unitização)
            </AccordionTrigger>
            <AccordionContent>
              <p>
                Também conhecida como unitização de carga. É a embalagem que
                agrupa as embalagens terciárias para otimizar o transporte e
                armazenamento.
                <br />
                <strong>Exemplo:</strong> O palete que agrupa caixas de papelão.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5">
            <AccordionTrigger>
              Embalagem de Quinto Nível (Conteinerização)
            </AccordionTrigger>
            <AccordionContent>
              <p>
                É a embalagem de maior porte. O contêiner agrupa as embalagens
                quaternárias para o transporte em grandes distâncias.
                <br />
                <strong>Exemplo:</strong> O contêiner usado em navios e trens.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <ContentParagraph>
        Além da função, as embalagens podem ser categorizadas por finalidade,
        como a de <strong>consumo</strong>, a <strong>expositora</strong> (para
        autovenda) e a de
        <strong>distribuição física</strong>, que deve suportar as condições
        físicas encontradas no transporte.
      </ContentParagraph>

      <ContentParagraph>
        Pela movimentação, são classificadas como <strong>manual</strong> (para
        até 30kg) ou
        <strong>mecanizada</strong> (para grandes volumes e pesos acima de
        30kg). Já pela utilidade, podem ser <strong>retornáveis</strong> (que
        voltam à origem para reutilização, como caixas plásticas) ou{" "}
        <strong>não retornáveis</strong>, usadas em um único ciclo de
        distribuição.
      </ContentParagraph>
    </ContentSection>
  );
}
