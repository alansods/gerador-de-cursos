import { useState } from "react";

interface FlipCardProps {
  titulo: string;
  imagem: string;
  texto: string;
}

function FlipCard({ titulo, imagem, texto }: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="flip-card cursor-pointer mt-6 mb-12"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div
        className={`flip-card-inner ${isFlipped ? "flip-card-flipped" : ""}`}
      >
        {/* Frente do card */}
        <div className="flip-card-front">
          <div className="relative h-full rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300 overflow-hidden">
            <img
              src={imagem}
              alt={titulo}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                <svg
                  className="w-5 h-5 text-white"
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
            </div>
            <div className="absolute bottom-0 left-0 right-0">
              <div className="bg-white rounded-b-2xl p-3">
                <h3 className="text-base font-bold text-gray-800 text-center">
                  {titulo}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Verso do card */}
        <div className="flip-card-back">
          <div className="relative h-full bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300 border border-blue-200 overflow-hidden">
            <div className="absolute top-4 right-4">
              <div className="bg-blue-200/50 backdrop-blur-sm rounded-full p-2">
                <svg
                  className="w-5 h-5 text-blue-600"
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
            </div>
            <div className="flex items-center justify-center h-full p-6">
              <p className="text-sm text-gray-800 text-center leading-relaxed font-medium">
                {texto}
              </p>
            </div>
            <div className="absolute bottom-0 left-0 right-0">
              <div className="bg-blue-100 rounded-b-2xl p-3">
                <h3 className="text-base font-bold text-blue-800 text-center">
                  {titulo}
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EmbalagemFlipCard() {
  const embalagens = [
    {
      titulo: "Embalagem Reciclável",
      imagem: "/assets/images/unidade-1/reciclavel.png",
      texto:
        "Pode ser coletada e transformada em novos materiais, o que reduz o lixo em aterros sanitários e preserva recursos naturais. Exemplos incluem papel, papelão e latas de alumínio.",
    },
    {
      titulo: "Embalagem Biodegradável",
      imagem: "/assets/images/unidade-1/biodegradavel.png",
      texto:
        "Projetada para se decompor naturalmente em pouco tempo sem deixar resíduos nocivos. É feita de materiais orgânicos, como papel e celulose.",
    },
    {
      titulo: "Embalagem Renovável",
      imagem: "/assets/images/unidade-1/renovavel.png",
      texto:
        "Produzida a partir de fontes naturais de rápida regeneração (como madeira de florestas certificadas), o que diminui a dependência de recursos não renováveis.",
    },
  ];

  return (
    <div className="mb-8">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Tipos de Embalagens Sustentáveis
        </h2>
        <p className="text-gray-600 text-sm">
          Clique nos cards para descobrir mais informações sobre cada tipo de
          embalagem
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {embalagens.map((embalagem, index) => (
          <FlipCard
            key={index}
            titulo={embalagem.titulo}
            imagem={embalagem.imagem}
            texto={embalagem.texto}
          />
        ))}
      </div>
    </div>
  );
}
