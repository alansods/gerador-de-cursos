import { ContentSection } from "@/components/content-section";
import { InfoBox } from "@/components/info-box";
import { EmbalagemFlipCard } from "./components/embalagem-flipcard";

export function AulaContent() {
  return (
    <ContentSection>
      <EmbalagemFlipCard />

      <InfoBox tipo="curiosidade" titulo="Inovações que a Gente Come">
        Você já imaginou comer a embalagem do seu produto? A ciência está
        desenvolvendo embalagens comestíveis e biodegradáveis, feitas a partir
        de materiais como amido, celulose e algas. Elas são projetadas para
        proteger os alimentos da umidade e do oxigênio e, depois do consumo,
        podem ser ingeridas ou simplesmente se decompor na natureza. Outra
        inovação é a impressão 3D de embalagens, que permite que empresas criem
        designs complexos e personalizados sob demanda, reduzindo o desperdício
        de materiais na produção e oferecendo soluções de embalagem únicas.
      </InfoBox>
    </ContentSection>
  );
}
