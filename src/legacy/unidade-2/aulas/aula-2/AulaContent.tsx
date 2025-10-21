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
        A movimentação de materiais é um fator indispensável em qualquer
        empreendimento produtivo, comercial ou de prestação de serviços. Ela
        compreende todas as operações básicas envolvidas no deslocamento de
        qualquer tipo de material, desde a recepção até a expedição e
        distribuição do produto. O principal objetivo da movimentação é a
        redução de custos e o aumento da capacidade produtiva, além de melhorar
        as condições de trabalho e de atendimento. Para ser eficiente, ela deve
        seguir alguns princípios essenciais:
      </ContentParagraph>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="planejamento">
          <AccordionTrigger>Princípio do Planejamento</AccordionTrigger>
          <AccordionContent>
            É necessário determinar o melhor método do ponto de vista econômico
            para a movimentação de materiais, considerando-se as condições
            particulares de cada operação.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="ergonomia">
          <AccordionTrigger>Princípio da Ergonomia</AccordionTrigger>
          <AccordionContent>
            As limitações humanas devem ser observadas e precisam ser
            reconhecidas e respeitadas no projeto das tarefas e dos equipamentos
            de movimentação. Dessa maneira, garantem operações mais seguras e
            efetivas.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="seguranca">
          <AccordionTrigger>Princípio da Segurança</AccordionTrigger>
          <AccordionContent>
            A produtividade aumenta conforme as condições de trabalho tornem-se
            mais seguras.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="meio-ambiente">
          <AccordionTrigger>Princípio do Meio Ambiente</AccordionTrigger>
          <AccordionContent>
            Ao projetar e selecionar sistemas logísticos, é imprescindível
            considerar o impacto sobre o meio ambiente e o consumo de energia.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="automatizacao">
          <AccordionTrigger>Princípio da Automação</AccordionTrigger>
          <AccordionContent>
            As operações logísticas podem ser automatizadas, tornando-se viável,
            para melhorar a eficiência operacional, aumentar a capacidade de
            respostas, melhorar a consistência e a previsibilidade, diminuir os
            custos operacionais e eliminar a mão de obra repetitiva e
            potencialmente insegura.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </ContentSection>
  );
}
