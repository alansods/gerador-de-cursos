import { ContentSection, ContentParagraph } from "@/components/content-section";
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
        A conteinerização é um princípio de acondicionamento que agrupa volumes
        individuais em contêineres, desenvolvendo uma unidade de carga para o
        sistema. É o processo de transporte de mercadorias em contêineres
        padronizados. Esse sistema revolucionou a logística mundial ao reduzir
        manuseios, padronizar cargas e integrar diferentes modais de transporte.
        Com os contêineres, é possível movimentar grandes volumes de forma
        rápida, segura e econômica.
      </ContentParagraph>

      <div className="my-8">
        <Carousel className="w-full max-w-xl mx-auto">
          <CarouselContent>
            <CarouselItem>
              <div className="flex flex-col items-center justify-center p-6">
                <img
                  src="/assets/images/unidade-1/maritimo.png"
                  alt="Transporte marítimo"
                  className="w-full h-[340px] object-cover rounded-lg mb-4"
                />
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Marítimo</h3>
                  <p className="text-sm text-gray-600">
                    Utilizados em transporte internacional, grandes volumes,
                    longas distâncias.
                  </p>
                </div>
              </div>
            </CarouselItem>
            <CarouselItem>
              <div className="flex flex-col items-center justify-center p-6">
                <img
                  src="/assets/images/unidade-1/ferroviario.png"
                  alt="Transporte ferroviário"
                  className="w-full h-[340px] object-cover rounded-lg mb-4"
                />
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Ferroviário</h3>
                  <p className="text-sm text-gray-600">
                    Utilizados na integração porto–interior, grandes distâncias
                    continentais.
                  </p>
                </div>
              </div>
            </CarouselItem>
            <CarouselItem>
              <div className="flex flex-col items-center justify-center p-6">
                <img
                  src="/assets/images/unidade-1/rodoviario.png"
                  alt="Transporte rodoviário"
                  className="w-full h-[340px] object-cover rounded-lg mb-4"
                />
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Rodoviário</h3>
                  <p className="text-sm text-gray-600">
                    Pela flexibilidade, na distribuição regional.
                  </p>
                </div>
              </div>
            </CarouselItem>
            <CarouselItem>
              <div className="flex flex-col items-center justify-center p-6">
                <img
                  src="/assets/images/unidade-1/aereo.png"
                  alt="Transporte aéreo"
                  className="w-full h-[340px] object-cover rounded-lg mb-4"
                />
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Aéreo</h3>
                  <p className="text-sm text-gray-600">
                    Pela agilidade, no transporte de alto valor agregado ou
                    perecíveis.
                  </p>
                </div>
              </div>
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </ContentSection>
  );
}
