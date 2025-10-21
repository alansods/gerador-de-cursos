import { ContentParagraph, ContentSection } from "@/components/content-section";
import { DragDropActivity } from "./components/drag-drop-activity";

export function AulaContent() {
  return (
    <ContentSection>
      <ContentParagraph>
        A empresa LogiFoods precisa escolher a embalagem ideal para transportar
        100 potes de geleia de vidro para outro estado. A empresa busca a melhor
        opção que garanta a segurança, o menor custo e a praticidade.
      </ContentParagraph>

      <div className="mt-8">
        <DragDropActivity />
      </div>
    </ContentSection>
  );
}
