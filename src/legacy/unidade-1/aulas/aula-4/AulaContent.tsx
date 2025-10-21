import {
  ContentSection,
  ContentParagraph,
  ContentTitle,
} from "@/components/content-section";
import { InfoBox } from "@/components/info-box";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export function AulaContent() {
  return (
    <ContentSection>
      <ContentParagraph>
        A embalagem tem uma interrelação com diversos departamentos de uma
        empresa:
      </ContentParagraph>

      <div className="my-6">
        <Accordion
          type="single"
          collapsible
          className="w-full max-w-4xl mx-auto rounded-xl border border-border bg-card overflow-hidden"
        >
          <AccordionItem value="item-1">
            <AccordionTrigger>Marketing</AccordionTrigger>
            <AccordionContent>
              <p>
                É uma ferramenta de apresentação e promoção. "A embalagem
                comunica e atrai consumidores."
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger>Produção</AccordionTrigger>
            <AccordionContent>
              <p>
                Forma de garantir a qualidade e a proteção do produto. "Facilita
                manuseio e estocagem."
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger>Logística</AccordionTrigger>
            <AccordionContent>
              <p>
                Componente crucial para reduzir os custos na entrega e facilitar
                o manuseio, a estocagem, a separação e o transporte. "Garante
                eficiência no transporte e armazenagem."
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <ContentParagraph>
        A padronização das embalagens ocorre principalmente nas embalagens
        secundárias e terciárias, e o foco é na padronização das dimensões, e
        não do material.
      </ContentParagraph>

      <ContentParagraph>
        Essa característica influencia a capacidade do equipamento de
        movimentação e otimiza o espaço.
      </ContentParagraph>

      <ContentParagraph>
        A escolha do material é um processo que deve ser feito após uma análise
        detalhada, considerando o produto, a finalidade, a apresentação, o
        processo de embalagem e o custo.
      </ContentParagraph>

      <div className="my-8">
        <Carousel className="w-full max-w-xl mx-auto">
          <CarouselContent>
            <CarouselItem>
              <div className="flex flex-col items-center justify-center p-6">
                <img
                  src="/assets/images/unidade-1/madeira.png"
                  alt="Embalagem de madeira"
                  className="w-full h-[340px] object-cover rounded-lg mb-4"
                />
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Madeira</h3>
                  <p className="text-sm text-gray-600">
                    Resistente e robusta, ideal para paletes e caixas de grande
                    porte.
                  </p>
                </div>
              </div>
            </CarouselItem>
            <CarouselItem>
              <div className="flex flex-col items-center justify-center p-6">
                <img
                  src="/assets/images/unidade-1/papelao.png"
                  alt="Embalagem de papelão"
                  className="w-full h-[340px] object-cover rounded-lg mb-4"
                />
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Papelão</h3>
                  <p className="text-sm text-gray-600">
                    Material versátil, usado em caixas e embalagens secundárias.
                  </p>
                </div>
              </div>
            </CarouselItem>
            <CarouselItem>
              <div className="flex flex-col items-center justify-center p-6">
                <img
                  src="/assets/images/unidade-1/plastico.png"
                  alt="Embalagem de plástico"
                  className="w-full h-[340px] object-cover rounded-lg mb-4"
                />
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Plástico</h3>
                  <p className="text-sm text-gray-600">
                    Leve, flexível e resistente à umidade.
                  </p>
                </div>
              </div>
            </CarouselItem>
            <CarouselItem>
              <div className="flex flex-col items-center justify-center p-6">
                <img
                  src="/assets/images/unidade-1/metal.png"
                  alt="Embalagem de metal"
                  className="w-full h-[340px] object-cover rounded-lg mb-4"
                />
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Metal</h3>
                  <p className="text-sm text-gray-600">
                    Usado para enlatados e recipientes pressurizados.
                  </p>
                </div>
              </div>
            </CarouselItem>
            <CarouselItem>
              <div className="flex flex-col items-center justify-center p-6">
                <img
                  src="/assets/images/unidade-1/vidro.png"
                  alt="Embalagem de vidro"
                  className="w-full h-[340px] object-cover rounded-lg mb-4"
                />
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Vidro</h3>
                  <p className="text-sm text-gray-600">
                    Material inerte, ideal para alimentos e bebidas, por não
                    alterar o sabor ou aroma.
                  </p>
                </div>
              </div>
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>

      <ContentTitle level={3}>A Padronização</ContentTitle>

      <ContentParagraph>
        A padronização de embalagens e paletes é fundamental para a otimização
        de custos e espaço. Ela permite que as cargas sejam unitizadas de forma
        eficiente, facilitando a movimentação e o transporte em toda a cadeia
        logística.
      </ContentParagraph>

      <InfoBox
        tipo="saiba_mais"
        titulo="A Embalagem do Futuro e a Tecnologia"
        className="my-8"
      >
        A embalagem moderna vai além da proteção física, tornando-se uma
        ferramenta de interação com o consumidor e um ativo de sustentabilidade.
        As inovações de embalagens ativas e inteligentes são um exemplo. Elas
        monitoram a temperatura e a umidade do produto, ajustam a atmosfera
        interna ou até mudam de cor para indicar se o alimento ainda está
        fresco. Isso reduz drasticamente o desperdício, especialmente na
        indústria alimentícia. Além disso, a tecnologia de realidade aumentada
        permite que o consumidor, ao apontar a câmera do celular para a
        embalagem, visualize animações, receitas ou informações detalhadas sobre
        o produto, criando uma experiência de compra interativa e imersiva.
      </InfoBox>
    </ContentSection>
  );
}
