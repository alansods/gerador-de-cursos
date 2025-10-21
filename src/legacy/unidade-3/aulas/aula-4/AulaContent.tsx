import { ContentSection, ContentParagraph } from "@/components/content-section";

import { InfoBox } from "@/components/info-box";

export function AulaContent() {
  return (
    <ContentSection>
      <ContentParagraph>
        A movimentação de materiais é um transporte interno que lida com
        pequenas quantidades de produtos em curtas distâncias. Seu principal
        objetivo é o baixo custo e a rapidez. Por isso, pequenas ineficiências
        repetidas podem levar a grandes prejuízos, o que torna um bom
        gerenciamento essencial.
      </ContentParagraph>

      <ContentParagraph>
        Em resumo, a movimentação de materiais é uma operação que se ocupa do
        movimento de coisas, seja em estado sólido, líquido ou gasoso, ao longo
        de todo o ciclo de operações: desde o recebimento e estocagem até a
        distribuição. É um fator indispensável em qualquer empreendimento, e a
        conscientização sobre sua importância é o primeiro passo para uma
        operação logística mais eficaz e rentável.
      </ContentParagraph>

      <InfoBox
        titulo="Drones Entregadores e a 'Última Milha'"
        tipo="curiosidade"
      >
        A entrega de produtos por drones já não é um conceito de ficção
        científica, mas uma realidade em fase de testes e implementação em
        várias cidades do mundo. Empresas como a Amazon e a Wing (da Alphabet,
        holding do Google) estão desenvolvendo sistemas para entregas rápidas de
        encomendas leves, prometendo revolucionar a "última milha" da logística
        — a etapa final da entrega até a porta do cliente. Essa tecnologia tem o
        potencial de reduzir drasticamente o tempo de entrega, aliviar o
        congestionamento do trânsito e diminuir as emissões de carbono
        associadas aos veículos de entrega tradicionais.
      </InfoBox>
    </ContentSection>
  );
}
