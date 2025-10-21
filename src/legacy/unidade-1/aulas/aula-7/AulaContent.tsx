import {
  ContentSection,
  ContentParagraph,
  ContentTitle,
} from "@/components/content-section";

export function AulaContent() {
  return (
    <ContentSection>
      <ContentParagraph>
        O aumento do consumismo nos últimos 20 anos tem levado as empresas a
        repensar a produção, com 41% dos consumidores brasileiros dispostos a
        mudar seus hábitos para reduzir impactos ambientais. A logística moderna
        exige soluções de baixo impacto ambiental. As embalagens sustentáveis
        usam materiais recicláveis, biodegradáveis ou retornáveis. O ecodesign
        planeja a embalagem desde sua criação até o descarte, reduzindo resíduos
        e custos.
      </ContentParagraph>

      <ContentTitle>
        Conceito de Sustentabilidade Aplicada à Embalagem:
      </ContentTitle>

      <ContentParagraph>
        A embalagem sustentável é aquela que, além de atender às suas funções
        técnicas e sociais, é desenvolvida para minimizar impactos ambientais,
        promover o consumo consciente e possibilitar a valorização de resíduos.
      </ContentParagraph>

      <div className="mt-6 space-y-4 text-foreground">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-4 h-4 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p>Proteger o produto de forma eficiente.</p>
        </div>

        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
            <svg
              className="w-4 h-4 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
          </div>
          <p>
            Viabilizar a logística (transporte, distribuição, venda e consumo).
          </p>
        </div>

        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
            <svg
              className="w-4 h-4 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p>
            Atender a exigências técnicas, legais, sociais, culturais e
            econômicas.
          </p>
        </div>

        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
            <svg
              className="w-4 h-4 text-orange-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <p>Reduzir o uso de recursos naturais.</p>
        </div>

        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center">
            <svg
              className="w-4 h-4 text-teal-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <p>Promover a reutilização, reciclagem e valorização de resíduos.</p>
        </div>

        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
            <svg
              className="w-4 h-4 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
          </div>
          <p>
            Incorporar o ecodesign, integrando aspectos ambientais desde a etapa
            de projeto.
          </p>
        </div>
      </div>
    </ContentSection>
  );
}
