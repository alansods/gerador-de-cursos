import React from "react";
// Certifique-se de que os tipos estão corretos
import type { CursoGerado, ConteudoUnidade } from "@/types/gerador-curso";

interface PDFTemplateProps {
  curso: CursoGerado;
}

// Cor primária para consistência
const PRIMARY_COLOR = "#1d4ed8"; // Um azul mais escuro (Tailwind blue-700)
const TEXT_COLOR_BODY = "#374151"; // cinza-700
const TEXT_COLOR_HEADER = "#111827"; // cinza-900
const BORDER_COLOR = "#e5e7eb"; // cinza-200
const BACKGROUND_SUBTLE = "#f9fafb"; // cinza-50

export function PDFTemplate({ curso }: PDFTemplateProps) {
  const cleanHtml = (text: string): string => {
    return text
      .replace(/<br\s*\/?>/gi, "<br />")
      .replace(/<\/p>/gi, "</p>")
      .trim();
  };

  const renderConteudo = (item: ConteudoUnidade) => {
    if (item.tipo === "titulo") {
      return (
        <h3
          style={{
            fontSize: "28px",
            fontWeight: "700",
            color: TEXT_COLOR_HEADER,
            marginBottom: "16px",
            marginTop: "40px",
            borderBottom: `1px solid ${BORDER_COLOR}`,
            paddingBottom: "8px",
          }}
        >
          {item.conteudo}
        </h3>
      );
    }

    if (item.tipo === "subtitulo") {
      return (
        <h4
          style={{
            fontSize: "22px",
            fontWeight: "600",
            color: TEXT_COLOR_HEADER,
            marginBottom: "12px",
            marginTop: "32px",
          }}
        >
          {item.conteudo}
        </h4>
      );
    }

    if (item.tipo === "imagem") {
      return (
        <div
          style={{
            margin: "32px 0",
            backgroundColor: BACKGROUND_SUBTLE,
            border: `1px solid ${BORDER_COLOR}`,
            borderRadius: "8px",
            padding: "16px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              color: "#9ca3af",
              fontSize: "14px",
              fontStyle: "italic",
              marginBottom: "12px",
              padding: "40px 0",
            }}
          >
            [ Imagem: {item.legenda || "sem legenda"} ]
          </div>
          {item.legenda && (
            <p
              style={{
                fontSize: "14px",
                color: "#4b5563",
                fontStyle: "italic",
                marginTop: "8px",
              }}
            >
              {item.legenda}
            </p>
          )}
          {item.fonte && (
            <p
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginTop: "4px",
                fontWeight: "500",
              }}
            >
              Fonte: {item.fonte}
            </p>
          )}
        </div>
      );
    }

    if (item.tipo === "accordion" && item.items) {
      return (
        <div
          style={{
            margin: "24px 0",
            backgroundColor: BACKGROUND_SUBTLE,
            border: `1px solid ${BORDER_COLOR}`,
            borderRadius: "8px",
          }}
        >
          {item.items.map((accordionItem) => (
            <div
              key={accordionItem.id}
              style={{
                padding: "20px",
                borderBottom: `1px solid ${BORDER_COLOR}`,
              }}
            >
              <h5
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: PRIMARY_COLOR,
                  marginBottom: "12px",
                  marginTop: 0,
                }}
              >
                {accordionItem.titulo}
              </h5>
              <div
                style={{
                  color: TEXT_COLOR_BODY,
                  lineHeight: "1.7",
                  fontSize: "15px",
                }}
                dangerouslySetInnerHTML={{
                  __html: cleanHtml(accordionItem.conteudo),
                }}
              />
            </div>
          ))}
        </div>
      );
    }

    if (item.tipo === "flipcard") {
      // Em PDF, um flipcard não "vira", então mostramos ambos os lados.
      return (
        <div
          style={{
            margin: "24px 0",
            backgroundColor: BACKGROUND_SUBTLE,
            border: `1px solid ${BORDER_COLOR}`,
            borderRadius: "8px",
            padding: "24px",
          }}
        >
          {/* Frente */}
          <div style={{ marginBottom: "16px" }}>
            {item.tipoFrente === "titulo" && item.tituloFrente && (
              <h5
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: PRIMARY_COLOR,
                  margin: 0,
                }}
              >
                {item.tituloFrente}
              </h5>
            )}
            {(item.tipoFrente === "imagem-titulo" ||
              item.tipoFrente === "imagem") && (
              <>
                {item.tituloFrente && (
                  <h5
                    style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      color: PRIMARY_COLOR,
                      marginBottom: "8px",
                    }}
                  >
                    {item.tituloFrente}
                  </h5>
                )}
                <p
                  style={{
                    fontSize: "14px",
                    color: "#6b7280",
                    fontStyle: "italic",
                    margin: 0,
                  }}
                >
                  [Imagem da Frente]
                </p>
              </>
            )}
          </div>

          <hr
            style={{
              border: 0,
              borderTop: `1px dashed ${BORDER_COLOR}`,
              margin: "16px 0",
            }}
          />

          {/* Verso */}
          {item.conteudoVerso && (
            <div
              style={{
                color: TEXT_COLOR_BODY,
                lineHeight: "1.7",
                fontSize: "15px",
              }}
              dangerouslySetInnerHTML={{
                __html: cleanHtml(item.conteudoVerso),
              }}
            />
          )}
        </div>
      );
    }

    if (item.tipo === "lista" && item.itensLista) {
      const ListTag = item.tipoLista === "ordenada" ? "ol" : "ul";
      const listStyle: React.CSSProperties = {
        marginBottom: "20px",
        paddingLeft: "30px",
        color: TEXT_COLOR_BODY,
      };

      if (item.tipoLista === "ordenada") {
        listStyle.listStyleType = "decimal";
      } else if (item.tipoLista === "check") {
        listStyle.listStyleType = "none";
        listStyle.paddingLeft = "10px";
      } else {
        listStyle.listStyleType = "disc";
      }

      return (
        <ListTag style={listStyle}>
          {item.itensLista.map((listaItem) => (
            <li
              key={listaItem.id}
              style={{
                marginBottom: "10px",
                lineHeight: "1.7",
                paddingLeft: item.tipoLista === "check" ? "8px" : 0,
              }}
            >
              {item.tipoLista === "check" && (
                <span
                  style={{
                    color: "#16a34a",
                    fontWeight: "bold",
                    marginRight: "8px",
                  }}
                >
                  ✓
                </span>
              )}
              {listaItem.texto}
            </li>
          ))}
        </ListTag>
      );
    }

    if (item.tipo === "quiz" && item.quizData) {
      return (
        <div
          style={{
            margin: "32px 0",
            backgroundColor: BACKGROUND_SUBTLE,
            border: `1px solid ${BORDER_COLOR}`,
            borderRadius: "8px",
          }}
        >
          <h4
            style={{
              fontSize: "20px",
              fontWeight: "600",
              color: PRIMARY_COLOR,
              margin: 0,
              padding: "20px 24px",
              borderBottom: `1px solid ${BORDER_COLOR}`,
            }}
          >
            📝 Atividade: Quiz
          </h4>
          <div style={{ padding: "24px" }}>
            {item.quizData.questions?.map((question, qIdx) => (
              <div
                key={question.id}
                style={{
                  marginBottom: "24px",
                  paddingBottom: "24px",
                  borderBottom: `1px dashed #d1d5db`,
                }}
              >
                <h5
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: TEXT_COLOR_HEADER,
                    marginBottom: "12px",
                    marginTop: 0,
                  }}
                >
                  Pergunta {qIdx + 1}: {question.pergunta}
                </h5>
                {question.dica && (
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#4b5563",
                      fontStyle: "italic",
                      marginBottom: "16px",
                      background: "#fffbeb", // Amarelo leve para dica
                      padding: "12px",
                      borderRadius: "4px",
                    }}
                  >
                    💡 Dica: {question.dica}
                  </p>
                )}
                <div style={{ marginTop: "8px" }}>
                  {question.opcoes.map((opcao, oIdx) => {
                    const letter = String.fromCharCode(65 + oIdx);
                    return (
                      <p
                        key={opcao.id}
                        style={{
                          color: TEXT_COLOR_BODY,
                          marginBottom: "8px",
                          lineHeight: "1.6",
                          fontSize: "15px",
                        }}
                      >
                        <span style={{ fontWeight: "600", marginRight: "4px" }}>
                          {letter})
                        </span>
                        {opcao.texto}
                        {opcao.isCorrect && (
                          <span
                            style={{
                              marginLeft: "10px",
                              color: "#16a34a", // Verde mais escuro
                              fontWeight: "700",
                              fontSize: "14px",
                            }}
                          >
                            (Correta)
                          </span>
                        )}
                      </p>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Parágrafo padrão
    const alignStyle: React.CSSProperties = {
      textAlign:
        item.alinhamento === "centro"
          ? "center"
          : item.alinhamento === "direita"
          ? "right"
          : item.alinhamento === "justificado"
          ? "justify"
          : "left",
    };

    return (
      <div
        style={{
          color: item.corTexto || TEXT_COLOR_BODY,
          marginBottom: "20px",
          lineHeight: "1.7",
          fontSize: "16px",
          ...alignStyle,
        }}
        dangerouslySetInnerHTML={{ __html: cleanHtml(item.conteudo) }}
      />
    );
  };

  return (
    <div
      style={{
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
        backgroundColor: "#ffffff",
        color: TEXT_COLOR_BODY,
        margin: 0,
        padding: 0,
        boxSizing: "border-box",
      }}
    >
      {/* --- CAPA --- */}
      <div
        data-page="cover"
        style={{
          width: "210mm",
          height: "297mm",
          display: "flex",
          flexDirection: "row",
          boxSizing: "border-box",
        }}
      >
        {/* Barra Lateral Decorativa */}
        <div
          style={{
            width: "30%",
            height: "100%",
            backgroundColor: PRIMARY_COLOR,
            background: PRIMARY_COLOR, // Fallback
          }}
        />

        {/* Conteúdo da Capa */}
        <div
          style={{
            width: "70%",
            height: "100%",
            padding: "60px 50px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            boxSizing: "border-box",
          }}
        >
          <h1
            style={{
              fontSize: "48px",
              fontWeight: "700",
              color: TEXT_COLOR_HEADER,
              marginBottom: "24px",
              lineHeight: "1.2",
            }}
          >
            {curso.titulo}
          </h1>

          <p
            style={{
              fontSize: "16px",
              lineHeight: "1.7",
              color: "#4b5563", // cinza-600
              marginBottom: "40px",
              maxWidth: "500px",
            }}
          >
            {curso.descricao}
          </p>

          <div
            style={{
              width: "100px",
              height: "4px",
              background: PRIMARY_COLOR,
              marginBottom: "40px",
            }}
          />

          {/* Informações do Curso */}
          <div
            style={{
              fontSize: "14px",
              color: TEXT_COLOR_HEADER,
            }}
          >
            <div style={{ marginBottom: "12px" }}>
              <span style={{ fontWeight: "600", color: "#6b7280" }}>
                CATEGORIA:{" "}
              </span>
              <span style={{ fontWeight: "600" }}>{curso.categoria}</span>
            </div>
            <div style={{ marginBottom: "12px" }}>
              <span style={{ fontWeight: "600", color: "#6b7280" }}>
                CARGA HORÁRIA:{" "}
              </span>
              <span style={{ fontWeight: "600" }}>{curso.cargaHoraria}</span>
            </div>
            <div>
              <span style={{ fontWeight: "600", color: "#6b7280" }}>
                MODALIDADE:{" "}
              </span>
              <span style={{ fontWeight: "600" }}>{curso.modalidade}</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- ÍNDICE --- */}
      <div
        data-page="index"
        style={{
          width: "210mm",
          minHeight: "297mm",
          padding: "60px 50px",
          background: "white",
          boxSizing: "border-box",
        }}
      >
        <div style={{ marginBottom: "40px" }}>
          <h2
            style={{
              fontSize: "32px",
              fontWeight: "700",
              color: PRIMARY_COLOR,
              marginBottom: "16px",
              borderBottom: `2px solid ${PRIMARY_COLOR}`,
              paddingBottom: "16px",
              display: "inline-block",
            }}
          >
            Índice
          </h2>
        </div>

        <div style={{ marginTop: "30px" }}>
          {curso.unidades.map((unidade, index) => (
            <div
              key={unidade.id}
              style={{
                marginBottom: "25px",
                paddingBottom: "20px",
                borderBottom: `1px solid ${BORDER_COLOR}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  marginBottom: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    color: PRIMARY_COLOR,
                    marginRight: "12px",
                    minWidth: "25px",
                  }}
                >
                  {index + 1}.
                </span>
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: "600",
                    color: TEXT_COLOR_HEADER,
                    margin: 0,
                  }}
                >
                  {unidade.titulo}
                </h3>
              </div>
              {unidade.descricao && (
                <p
                  style={{
                    fontSize: "14px",
                    color: "#6b7280", // cinza-500
                    marginLeft: "37px", // Alinha com o título
                    marginTop: "4px",
                    lineHeight: "1.6",
                  }}
                >
                  {unidade.descricao}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* --- UNIDADES --- */}
      {curso.unidades.map((unidade, unidadeIndex) => (
        <div
          key={unidade.id}
          data-page="unit"
          style={{
            width: "210mm",
            minHeight: "297mm",
            background: "white",
            boxSizing: "border-box",
          }}
        >
          {/* Cabeçalho da unidade */}
          <div
            style={{
              padding: "40px 50px 30px 50px",
              borderBottom: `1px solid ${BORDER_COLOR}`,
            }}
          >
            <p
              style={{
                fontSize: "14px",
                margin: "0 0 8px 0",
                color: PRIMARY_COLOR,
                fontWeight: "600",
                textTransform: "uppercase",
              }}
            >
              Unidade {unidadeIndex + 1}
            </p>
            <h2
              style={{
                fontSize: "32px",
                fontWeight: "700",
                color: TEXT_COLOR_HEADER,
                margin: 0,
                lineHeight: "1.3",
              }}
            >
              {unidade.titulo}
            </h2>
          </div>

          {/* Conteúdo da unidade */}
          <div style={{ padding: "40px 50px" }}>
            {unidade.descricao && (
              <div
                style={{
                  background: BACKGROUND_SUBTLE,
                  padding: "20px",
                  borderRadius: "4px",
                  marginBottom: "32px",
                  borderLeft: `4px solid ${PRIMARY_COLOR}`, // Estilo de citação
                }}
              >
                <p
                  style={{
                    fontSize: "15px",
                    color: "#4b5563", // cinza-600
                    fontStyle: "italic",
                    margin: 0,
                    lineHeight: "1.7",
                  }}
                >
                  {unidade.descricao}
                </p>
              </div>
            )}

            {/* Conteúdo dinâmico */}
            <div>
              {unidade.conteudo
                .sort((a, b) => a.ordem - b.ordem)
                .map((item) => (
                  <div key={item.id}>{renderConteudo(item)}</div>
                ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
