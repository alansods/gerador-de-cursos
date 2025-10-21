import { ContentSection, ContentParagraph } from "@/components/content-section";
import { DragDropActivity } from "./components/drag-drop-activity";

export function AulaContent() {
  return (
    <ContentSection>
      <ContentParagraph>
        Arraste o nome do equipamento para a imagem correspondente.
      </ContentParagraph>

      <DragDropActivity />
    </ContentSection>
  );
}
