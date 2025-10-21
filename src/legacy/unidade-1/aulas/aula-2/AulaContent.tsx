import {
  ContentSection,
  ContentTitle,
  ContentParagraph,
} from "@/components/content-section";
import ObjetivosEmbalagem from "@/pages/unidade-1/aulas/aula-2/components/objetivos-embalagem";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
  TableSource,
} from "@/components/ui/table";

export function AulaContent() {
  return (
    <ContentSection>
      <ContentTitle level={3}>O que é Embalagem?</ContentTitle>

      <ContentParagraph>
        Embalagem é um recipiente ou envoltório que tem como principal objetivo
        conter, proteger, conservar e identificar um produto durante o
        transporte, manuseio e armazenamento. Ela é o primeiro ponto de contato
        visual com o cliente, por isso também é uma ferramenta poderosa de
        marketing.
      </ContentParagraph>

      <ContentParagraph>
        Segundo Rago (2008), a embalagem tem, entre outras finalidades, o papel
        de aumentar a produtividade na cadeia de abastecimento e, em relação ao
        produto, contribuir para a minimização dos custos, garantir sua proteção
        em todas as etapas da cadeia e, em alguns casos, favorecer a exposição
        no ponto de venda.
      </ContentParagraph>

      <div className="my-10">
        <TableCaption>
          <strong>Tabela 1.</strong> Objetivos do sistema de embalagens
        </TableCaption>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Objetivos</TableHead>
              <TableHead>Descrição</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">
                Aumentar a produtividade operacional
              </TableCell>
              <TableCell>
                Melhorar a eficiência da cadeia de abastecimento.
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Reduzir custos</TableCell>
              <TableCell>
                Diminuir o custo da embalagem em relação ao produto.
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Garantir proteção</TableCell>
              <TableCell>
                Assegurar a proteção do produto em todas as etapas da cadeia de
                abastecimento.
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">
                Adequar-se aos processos logísticos
              </TableCell>
              <TableCell>
                Adaptar-se às etapas subsequentes da logística após a embalagem.
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">
                Manter identidade visual
              </TableCell>
              <TableCell>
                Preservar a identidade da empresa no produto.
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">
                Facilitar comunicação e controle
              </TableCell>
              <TableCell>
                Contribuir para a comunicação e o gerenciamento do estoque.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <TableSource>Fonte: Rago (2008)</TableSource>
      </div>

      <ContentParagraph>
        Observa-se que a função de um sistema de embalagem vai muito além da
        simples proteção do produto. A embalagem está diretamente relacionada à
        eficiência da cadeia de abastecimento, à redução de custos e à adequação
        aos processos logísticos. Além disso, ela desempenha um papel
        estratégico na manutenção da identidade visual da empresa e na
        comunicação com o mercado, tornando-se, portanto, um elemento
        fundamental tanto na gestão operacional quanto no posicionamento
        competitivo da organização.
      </ContentParagraph>

      <ObjetivosEmbalagem />
    </ContentSection>
  );
}
