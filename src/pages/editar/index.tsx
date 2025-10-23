import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGeradorCurso } from "@/context/GeradorCursoContext";
import { usePreview } from "@/hooks/usePreview";
import { useSCORM } from "@/hooks/useSCORM";
import toast, { Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  Eye,
  Edit,
  Trash2,
  Type,
  Heading3,
  Heading2,
  BookOpen,
  Layers,
  ArrowUp,
  ArrowDown,
  Image,
  Download,
  BookmarkPlus,
  Clock,
  User,
  GraduationCap,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MenuConteudo } from "@/components/MenuConteudo";
import { WelcomeMessage } from "@/components/WelcomeMessage";

export default function GeradorEditar() {
  console.log('📄 [GeradorEditar] Página de edição carregada');
  
  const {
    state,
    adicionarUnidade,
    editarUnidade,
    deletarUnidade,
    reordenarUnidades,
    adicionarConteudo,
    editarConteudo,
    deletarConteudo,
    editarCurso,
    selecionarCurso,
  } = useGeradorCurso();
  const { openPreview } = usePreview();
  const { generateSCORMPackage } = useSCORM();
  const navigate = useNavigate();

  const { id } = useParams<{ id: string }>();
  const [novaUnidade, setNovaUnidade] = useState("");
  const [editandoUnidade, setEditandoUnidade] = useState<string | null>(null);
  const [tituloEditado, setTituloEditado] = useState(
    state.cursoAtual?.titulo || ""
  );
  const [descricaoEditada, setDescricaoEditada] = useState(
    state.cursoAtual?.descricao || ""
  );
  const [editandoConteudo, setEditandoConteudo] = useState<{
    unidadeId: string;
    conteudoId: string;
    tipo: "paragrafo" | "subtitulo" | "titulo" | "imagem";
    conteudo: string;
    tamanho?: "pequena" | "media" | "grande";
    legenda?: string;
    fonte?: string;
    corTexto?: string;
    alinhamento?: "esquerda" | "centro" | "direita" | "justificado";
    colunas?: 6 | 12;
  } | null>(null);
  const [conteudoTemp, setConteudoTemp] = useState({
    tipo: "paragrafo" as "paragrafo" | "subtitulo" | "titulo" | "imagem",
    conteudo: "",
    unidadeId: "",
    tamanho: "media" as "pequena" | "media" | "grande",
    legenda: "",
    fonte: "",
    corTexto: "#000000",
    alinhamento: "esquerda" as
      | "esquerda"
      | "centro"
      | "direita"
      | "justificado",
    colunas: 12 as 6 | 12,
  });
  const [adicionarUnidadeModal, setAdicionarUnidadeModal] = useState(false);
  const [editarUnidadeModal, setEditarUnidadeModal] = useState(false);
  const [unidadeParaEditar, setUnidadeParaEditar] = useState<string | null>(
    null
  );
  const [tituloUnidadeEditando, setTituloUnidadeEditando] = useState("");
  const [confirmarDeletarUnidade, setConfirmarDeletarUnidade] = useState(false);
  const [unidadeParaDeletar, setUnidadeParaDeletar] = useState<string | null>(
    null
  );
  const [conteudoParaDeletar, setConteudoParaDeletar] = useState<{
    unidadeId: string;
    conteudoId: string;
  } | null>(null);
  const [confirmarDeletarConteudo, setConfirmarDeletarConteudo] =
    useState(false);
  const [closingAdicionarUnidade, setClosingAdicionarUnidade] = useState(false);
  const [closingEditarUnidade, setClosingEditarUnidade] = useState(false);
  const [closingConfirmarDeletar, setClosingConfirmarDeletar] = useState(false);
  const [closingConfirmarDeletarConteudo, setClosingConfirmarDeletarConteudo] =
    useState(false);
  const [closingEditarConteudo, setClosingEditarConteudo] = useState(false);
  const [closingAdicionarConteudo, setClosingAdicionarConteudo] =
    useState(false);
  const [editarCursoModal, setEditarCursoModal] = useState(false);
  const [closingEditarCurso, setClosingEditarCurso] = useState(false);
  const [mostrandoMenuFlutuante, setMostrandoMenuFlutuante] = useState(false);

  // Estados para edição do curso
  const [cargaHorariaEditada, setCargaHorariaEditada] = useState("");
  const [instrutorEditado, setInstrutorEditado] = useState("");
  const [modalidadeEditada, setModalidadeEditada] = useState("");
  const [categoriaEditada, setCategoriaEditada] = useState("");

  useEffect(() => {
    if (id) {
      selecionarCurso(id);
    }
  }, [id]);

  // Inicializar valores quando o modal de edição abrir
  useEffect(() => {
    if (editarCursoModal && state.cursoAtual) {
      setTituloEditado(state.cursoAtual.titulo);
      setDescricaoEditada(state.cursoAtual.descricao);
      setCargaHorariaEditada(state.cursoAtual.cargaHoraria);
      setInstrutorEditado(state.cursoAtual.instrutor);
      setModalidadeEditada(state.cursoAtual.modalidade);
      setCategoriaEditada(state.cursoAtual.categoria);
    }
  }, [editarCursoModal, state.cursoAtual]);

  // Expor função SCORM globalmente para o preview
  useEffect(() => {
    (window as any).handleGerarSCORM = () =>
      generateSCORMPackage(state.cursoAtual!);

    return () => {
      delete (window as any).handleGerarSCORM;
    };
  }, [state.cursoAtual, generateSCORMPackage]);

  // Fechar menu flutuante quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mostrandoMenuFlutuante) {
        const target = event.target as HTMLElement;
        if (!target.closest(".floating-menu-container")) {
          setMostrandoMenuFlutuante(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mostrandoMenuFlutuante]);
  const handleVoltar = () => {
    navigate("/cursos");
  };

  const closeAdicionarUnidadeModal = () => {
    setClosingAdicionarUnidade(true);
    setTimeout(() => {
      setAdicionarUnidadeModal(false);
      setClosingAdicionarUnidade(false);
      setNovaUnidade("");
    }, 200);
  };

  const openEditarUnidadeModal = (unidadeId: string) => {
    const unidade = state.cursoAtual?.unidades?.find((u) => u.id === unidadeId);
    if (unidade) {
      setUnidadeParaEditar(unidadeId);
      setTituloUnidadeEditando(unidade.titulo);
      setEditarUnidadeModal(true);
    }
  };

  const closeEditarUnidadeModal = () => {
    setClosingEditarUnidade(true);
    setTimeout(() => {
      setEditarUnidadeModal(false);
      setClosingEditarUnidade(false);
      setUnidadeParaEditar(null);
      setTituloUnidadeEditando("");
    }, 200);
  };

  const closeConfirmarDeletarUnidadeModal = () => {
    setClosingConfirmarDeletar(true);
    setTimeout(() => {
      setConfirmarDeletarUnidade(false);
      setClosingConfirmarDeletar(false);
      setUnidadeParaDeletar(null);
    }, 200);
  };

  const closeConfirmarDeletarConteudoModal = () => {
    setClosingConfirmarDeletarConteudo(true);
    setTimeout(() => {
      setConfirmarDeletarConteudo(false);
      setClosingConfirmarDeletarConteudo(false);
      setConteudoParaDeletar(null);
    }, 200);
  };

  const closeEditarConteudoModal = () => {
    setClosingEditarConteudo(true);
    setTimeout(() => {
      setEditandoConteudo(null);
      setClosingEditarConteudo(false);
    }, 200);
  };

  const closeAdicionarConteudoModal = () => {
    setClosingAdicionarConteudo(true);
    setTimeout(() => {
      setConteudoTemp({
        tipo: "paragrafo",
        conteudo: "",
        unidadeId: "",
        tamanho: "media",
        legenda: "",
        fonte: "",
        corTexto: "#000000",
        alinhamento: "esquerda",
        colunas: 12,
      });
      setClosingAdicionarConteudo(false);
    }, 200);
  };

  const closeEditarCursoModal = () => {
    setClosingEditarCurso(true);
    setTimeout(() => {
      setEditarCursoModal(false);
      setClosingEditarCurso(false);
    }, 200);
  };

  const handleSalvarEdicaoCurso = () => {
    if (state.cursoAtual) {
      editarCurso(state.cursoAtual.id, {
        titulo: tituloEditado,
        descricao: descricaoEditada,
        cargaHoraria: cargaHorariaEditada,
        instrutor: instrutorEditado,
        modalidade: modalidadeEditada,
        categoria: categoriaEditada,
      });
    }
  };

  const handleAdicionarUnidade = () => {
    if (novaUnidade.trim()) {
      adicionarUnidade({ titulo: novaUnidade.trim(), conteudo: [] });
      setNovaUnidade("");
      setAdicionarUnidadeModal(false);
      toast.success("Unidade adicionada com sucesso!");
    }
  };

  const handleEditarUnidade = (unidadeId: string, novoTitulo: string) => {
    editarUnidade(unidadeId, { titulo: novoTitulo });
    setEditandoUnidade(null);
  };

  const handleSalvarEdicaoUnidade = () => {
    if (unidadeParaEditar && tituloUnidadeEditando.trim()) {
      editarUnidade(unidadeParaEditar, {
        titulo: tituloUnidadeEditando.trim(),
      });
      closeEditarUnidadeModal();
    }
  };

  const handleDeletarUnidade = (unidadeId: string) => {
    setUnidadeParaDeletar(unidadeId);
    setConfirmarDeletarUnidade(true);
  };

  const handleSalvarConteudo = () => {
    if (conteudoTemp.conteudo.trim()) {
      // Validação para imagens
      if (conteudoTemp.tipo === "imagem") {
        if (
          !conteudoTemp.tamanho ||
          !conteudoTemp.legenda ||
          !conteudoTemp.fonte
        ) {
          alert(
            "Por favor, preencha todos os campos obrigatórios para a imagem."
          );
          return;
        }
      }

      adicionarConteudo(conteudoTemp.unidadeId, {
        tipo: conteudoTemp.tipo,
        conteudo: conteudoTemp.conteudo,
        tamanho: conteudoTemp.tamanho,
        legenda: conteudoTemp.legenda,
        fonte: conteudoTemp.fonte,
        corTexto: conteudoTemp.corTexto,
        alinhamento: conteudoTemp.alinhamento,
        colunas: conteudoTemp.colunas,
      });
      setConteudoTemp({
        tipo: "paragrafo",
        conteudo: "",
        unidadeId: "",
        tamanho: "media",
        legenda: "",
        fonte: "",
        corTexto: "#000000",
        alinhamento: "esquerda",
        colunas: 12,
      });
      toast.success("Alterações salvas");
    }
  };

  const handleEditarConteudo = (
    unidadeId: string,
    conteudoId: string,
    tipo: "paragrafo" | "subtitulo" | "titulo" | "imagem",
    conteudo: string,
    tamanho?: "pequena" | "media" | "grande",
    legenda?: string,
    fonte?: string,
    corTexto?: string,
    alinhamento?: "esquerda" | "centro" | "direita" | "justificado",
    colunas?: 6 | 12
  ) => {
    editarConteudo(unidadeId, conteudoId, {
      tipo,
      conteudo,
      tamanho,
      legenda,
      fonte,
      corTexto,
      alinhamento,
      colunas,
    });
    setEditandoConteudo(null);
    toast.success("Alterações salvas");
  };

  const handleDeletarConteudo = (unidadeId: string, conteudoId: string) => {
    setConteudoParaDeletar({ unidadeId, conteudoId });
    setConfirmarDeletarConteudo(true);
  };

  const handleSelecionarTipoConteudo = (
    tipo: "titulo" | "subtitulo" | "paragrafo" | "imagem",
    unidadeId?: string
  ) => {
    if (unidadeId) {
      // Se unidadeId foi fornecido, adicionar diretamente
      setConteudoTemp({
        tipo: tipo,
        conteudo: "",
        unidadeId: unidadeId,
        tamanho: "media",
        legenda: "",
        fonte: "",
        corTexto: "#000000",
        alinhamento: "esquerda",
        colunas: 12,
      });
    } else {
      // Se não, abrir modal de seleção
      // Tipo de conteúdo selecionado
      // Modal de seleção removido - agora adiciona diretamente
      setMostrandoMenuFlutuante(false);
    }
  };

  const handleMoverUnidadeAcima = (index: number) => {
    if (index > 0) {
      const unidades = [...(state.cursoAtual?.unidades || [])];
      [unidades[index - 1], unidades[index]] = [
        unidades[index],
        unidades[index - 1],
      ];
      unidades.forEach((u, i) => (u.ordem = i));
      reordenarUnidades(unidades);
    }
  };

  const handleMoverUnidadeAbaixo = (index: number) => {
    const unidades = state.cursoAtual?.unidades || [];
    if (index < unidades.length - 1) {
      const newUnidades = [...unidades];
      [newUnidades[index], newUnidades[index + 1]] = [
        newUnidades[index + 1],
        newUnidades[index],
      ];
      newUnidades.forEach((u, i) => (u.ordem = i));
      reordenarUnidades(newUnidades);
    }
  };

  const handleMoverConteudoAcima = (unidadeId: string, index: number) => {
    const unidade = (state.cursoAtual?.unidades || []).find(
      (u) => u.id === unidadeId
    );
    if (unidade && index > 0) {
      const novoConteudo = [...unidade.conteudo];
      [novoConteudo[index - 1], novoConteudo[index]] = [
        novoConteudo[index],
        novoConteudo[index - 1],
      ];
      novoConteudo.forEach((c, i) => (c.ordem = i));
      editarUnidade(unidadeId, { conteudo: novoConteudo });
    }
  };

  const handleMoverConteudoAbaixo = (unidadeId: string, index: number) => {
    const unidade = (state.cursoAtual?.unidades || []).find(
      (u) => u.id === unidadeId
    );
    if (unidade && index < unidade.conteudo.length - 1) {
      const novoConteudo = [...unidade.conteudo];
      [novoConteudo[index], novoConteudo[index + 1]] = [
        novoConteudo[index + 1],
        novoConteudo[index],
      ];
      novoConteudo.forEach((c, i) => (c.ordem = i));
      editarUnidade(unidadeId, { conteudo: novoConteudo });
    }
  };

  // Função SCORM removida - usando useSCORM hook

  const handlePreview = () => {
    if (state.cursoAtual) {
      openPreview(state.cursoAtual);
    }
  };

  if (!state.cursoAtual) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          /* Preservar cores do rich text editor */
          .conteudo-paragrafo span[style*="color"] {
            color: inherit !important;
          }
          
          .conteudo-paragrafo * {
            color: inherit !important;
          }
          
          .conteudo-paragrafo {
            color: inherit !important;
          }
          
          /* Garantir que as cores inline sejam preservadas */
          .conteudo-paragrafo [style*="color"] {
            color: inherit !important;
          }
          
          /* Remover qualquer override do Tailwind */
          .conteudo-paragrafo * {
            color: inherit !important;
          }
        `,
        }}
      />
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={handleVoltar}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>

            <div className="flex space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={handlePreview}>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Preview</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button
                onClick={() => generateSCORMPackage(state.cursoAtual!)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar SCORM
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Mensagem de Boas-vindas */}
        <WelcomeMessage />
        
        {/* Card de Informações do Curso */}
        <Card className="mb-8 shadow-xl border-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-3xl font-bold mb-3 flex items-center gap-3">
                  <BookOpen className="h-8 w-8" />
                  {state.cursoAtual.titulo}
                </CardTitle>
                <p className="text-blue-100 text-lg leading-relaxed">
                  {state.cursoAtual.descricao}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditarCursoModal(true)}
                        className="p-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Editar curso</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
                <Clock className="h-5 w-5 text-blue-200" />
                <div>
                  <p className="text-sm text-blue-200">Carga Horária</p>
                  <p className="font-semibold">
                    {state.cursoAtual.cargaHoraria}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
                <User className="h-5 w-5 text-blue-200" />
                <div>
                  <p className="text-sm text-blue-200">Instrutor</p>
                  <p className="font-semibold">{state.cursoAtual.instrutor}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
                <GraduationCap className="h-5 w-5 text-blue-200" />
                <div>
                  <p className="text-sm text-blue-200">Modalidade</p>
                  <p className="font-semibold">{state.cursoAtual.modalidade}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-white/20 text-white border-white/30"
              >
                {state.cursoAtual.categoria}
              </Badge>
              <Badge
                variant="secondary"
                className="bg-white/20 text-white border-white/30"
              >
                {state.cursoAtual.unidades?.length || 0} Unidades
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Adicionar Nova Unidade */}
        {/* Lista de Unidades */}
        <div className="space-y-8">
          {(state.cursoAtual.unidades || []).map((unidade, unidadeIndex) => (
            <Card
              key={unidade.id}
              className="group shadow-lg border-0 bg-white/80 backdrop-blur-sm"
            >
              <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Layers className="h-6 w-6 text-blue-600" />
                    {editandoUnidade === unidade.id ? (
                      <Input
                        defaultValue={unidade.titulo}
                        onBlur={(e) =>
                          handleEditarUnidade(unidade.id, e.target.value)
                        }
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleEditarUnidade(
                              unidade.id,
                              e.currentTarget.value
                            );
                          }
                        }}
                        className="text-2xl font-bold text-gray-900"
                        autoFocus
                      />
                    ) : (
                      <h3 className="text-2xl font-bold text-gray-900">
                        {unidade.titulo}
                      </h3>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleMoverUnidadeAcima(unidadeIndex)
                              }
                              disabled={unidadeIndex === 0}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Subir unidade</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleMoverUnidadeAbaixo(unidadeIndex)
                              }
                              disabled={
                                unidadeIndex ===
                                (state.cursoAtual?.unidades || []).length - 1
                              }
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Descer unidade</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditarUnidadeModal(unidade.id)}
                              className="p-2"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar unidade</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeletarUnidade(unidade.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Deletar unidade</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                {/* Lista de Conteúdo */}
                {unidade.conteudo.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Nenhum conteúdo adicionado.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    {unidade.conteudo.map((item, itemIndex) => (
                      <div
                        key={item.id}
                        className={`group ${
                          item.colunas === 6
                            ? "md:col-span-6"
                            : "md:col-span-12"
                        }`}
                      >
                        <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0 mt-1">
                            {item.tipo === "titulo" ? (
                              <Heading2 className="h-4 w-4 text-purple-600" />
                            ) : item.tipo === "subtitulo" ? (
                              <Heading3 className="h-4 w-4 text-blue-600" />
                            ) : item.tipo === "imagem" ? (
                              <Image className="h-4 w-4 text-green-600" />
                            ) : (
                              <Type className="h-4 w-4 text-gray-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            {item.tipo === "titulo" ? (
                              <h3 className="font-bold text-lg text-gray-900">
                                {item.conteudo}
                              </h3>
                            ) : item.tipo === "subtitulo" ? (
                              <h4 className="font-semibold text-gray-900">
                                {item.conteudo}
                              </h4>
                            ) : item.tipo === "imagem" ? (
                              <div className="space-y-2">
                                {item.fonte && (
                                  <p className="text-xs text-gray-500">
                                    Fonte: {item.fonte}
                                  </p>
                                )}
                                <img
                                  src={item.conteudo}
                                  alt={item.legenda || "Imagem"}
                                  className={`h-auto object-contain border border-gray-200 rounded-md ${
                                    item.tamanho === "pequena"
                                      ? "max-w-xs"
                                      : item.tamanho === "media"
                                      ? "max-w-md"
                                      : "max-w-full"
                                  }`}
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                                {item.legenda && (
                                  <p className="text-sm text-gray-600 italic">
                                    {item.legenda}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div
                                className={`conteudo-paragrafo ${
                                  item.alinhamento === "centro"
                                    ? "text-center"
                                    : item.alinhamento === "direita"
                                    ? "text-right"
                                    : item.alinhamento === "justificado"
                                    ? "text-justify"
                                    : "text-left"
                                }`}
                                dangerouslySetInnerHTML={{
                                  __html: item.conteudo,
                                }}
                                style={{
                                  color: "inherit",
                                }}
                              />
                            )}
                          </div>
                          <div>
                            <MenuConteudo
                              unidade={unidade}
                              item={item}
                              itemIndex={itemIndex}
                              handleMoverConteudoAcima={
                                handleMoverConteudoAcima
                              }
                              handleMoverConteudoAbaixo={
                                handleMoverConteudoAbaixo
                              }
                              handleDeletarConteudo={handleDeletarConteudo}
                              editarConteudo={editarConteudo}
                              setEditandoConteudo={setEditandoConteudo}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Botão para adicionar conteúdo */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleSelecionarTipoConteudo("titulo", unidade.id)
                      }
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Heading2 className="h-4 w-4 mr-2" />
                      Título
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleSelecionarTipoConteudo("subtitulo", unidade.id)
                      }
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Heading3 className="h-4 w-4 mr-2" />
                      Subtítulo
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleSelecionarTipoConteudo("paragrafo", unidade.id)
                      }
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Type className="h-4 w-4 mr-2" />
                      Parágrafo
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleSelecionarTipoConteudo("imagem", unidade.id)
                      }
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Image className="h-4 w-4 mr-2" />
                      Imagem
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Botão para adicionar nova unidade */}
        {(state.cursoAtual.unidades || []).length > 0 && (
          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              onClick={() => setAdicionarUnidadeModal(true)}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Nova Unidade
            </Button>
          </div>
        )}

        {(state.cursoAtual.unidades || []).length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <BookmarkPlus className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhuma unidade criada
              </h3>
              <p className="text-gray-600 mb-8">
                Comece adicionando a primeira unidade do seu curso
              </p>
              <Button
                onClick={() => setAdicionarUnidadeModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Unidade
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal para editar curso */}
      {editarCursoModal && (
        <div
          className={`fixed inset-0 bg-black flex items-center justify-center p-4 z-50 ${
            closingEditarCurso
              ? "animate-out fade-out duration-200"
              : "animate-in fade-in duration-200"
          } ${closingEditarCurso ? "bg-opacity-0" : "bg-opacity-50"}`}
          onClick={closeEditarCursoModal}
        >
          <Card
            className={`w-full max-w-2xl ${
              closingEditarCurso
                ? "animate-out zoom-out-95 duration-200"
                : "animate-in zoom-in-95 duration-200"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-600" />
                Editar Curso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Título do Curso
                </label>
                <Input
                  value={tituloEditado}
                  onChange={(e) => setTituloEditado(e.target.value)}
                  placeholder="Título do curso"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Descrição do Curso
                </label>
                <textarea
                  value={descricaoEditada}
                  onChange={(e) => setDescricaoEditada(e.target.value)}
                  placeholder="Descrição do curso"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Carga Horária
                  </label>
                  <Input
                    value={cargaHorariaEditada}
                    onChange={(e) => setCargaHorariaEditada(e.target.value)}
                    placeholder="Ex: 40 horas"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Instrutor
                  </label>
                  <Input
                    value={instrutorEditado}
                    onChange={(e) => setInstrutorEditado(e.target.value)}
                    placeholder="Nome do instrutor"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Modalidade
                  </label>
                  <Input
                    value={modalidadeEditada}
                    onChange={(e) => setModalidadeEditada(e.target.value)}
                    placeholder="Ex: EAD, Presencial"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Categoria
                </label>
                <Input
                  value={categoriaEditada}
                  onChange={(e) => setCategoriaEditada(e.target.value)}
                  placeholder="Ex: Programação, Design, Marketing"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={closeEditarCursoModal}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    handleSalvarEdicaoCurso();
                    closeEditarCursoModal();
                  }}
                  disabled={
                    !tituloEditado.trim() ||
                    !descricaoEditada.trim() ||
                    !cargaHorariaEditada.trim() ||
                    !instrutorEditado.trim() ||
                    !modalidadeEditada.trim() ||
                    !categoriaEditada.trim()
                  }
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal para editar conteúdo */}
      {editandoConteudo && (
        <div
          className={`fixed inset-0 bg-black flex items-center justify-center p-4 z-50 ${
            closingEditarConteudo
              ? "animate-out fade-out duration-200"
              : "animate-in fade-in duration-200"
          } ${closingEditarConteudo ? "bg-opacity-0" : "bg-opacity-50"}`}
          onClick={closeEditarConteudoModal}
        >
          <Card
            className={`w-full max-w-2xl ${
              closingEditarConteudo
                ? "animate-out zoom-out-95 duration-200"
                : "animate-in zoom-in-95 duration-200"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-600" />
                Editar{" "}
                {editandoConteudo.tipo === "titulo" ? (
                  <>
                    <Heading2 className="h-4 w-4 text-blue-600" />
                    Título
                  </>
                ) : editandoConteudo.tipo === "subtitulo" ? (
                  <>
                    <Heading3 className="h-4 w-4 text-blue-600" />
                    Subtítulo
                  </>
                ) : editandoConteudo.tipo === "imagem" ? (
                  <>
                    <Image className="h-4 w-4 text-blue-600" />
                    Imagem
                  </>
                ) : (
                  <>
                    <Type className="h-4 w-4 text-blue-600" />
                    Parágrafo
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editandoConteudo.tipo === "imagem" ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL da Imagem *
                    </label>
                    <Input
                      value={editandoConteudo.conteudo}
                      onChange={(e) =>
                        setEditandoConteudo({
                          ...editandoConteudo,
                          conteudo: e.target.value,
                        })
                      }
                      placeholder="Cole a URL da imagem..."
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tamanho da Imagem *
                    </label>
                    <select
                      value={editandoConteudo.tamanho || ""}
                      onChange={(e) =>
                        setEditandoConteudo({
                          ...editandoConteudo,
                          tamanho: e.target.value as
                            | "pequena"
                            | "media"
                            | "grande",
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Selecione o tamanho</option>
                      <option value="pequena">Pequena (25%)</option>
                      <option value="media">Média (50%)</option>
                      <option value="grande">Grande (100%)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Legenda *
                    </label>
                    <Input
                      value={editandoConteudo.legenda || ""}
                      onChange={(e) =>
                        setEditandoConteudo({
                          ...editandoConteudo,
                          legenda: e.target.value,
                        })
                      }
                      placeholder="Digite a legenda da imagem..."
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fonte *
                    </label>
                    <Input
                      value={editandoConteudo.fonte || ""}
                      onChange={(e) =>
                        setEditandoConteudo({
                          ...editandoConteudo,
                          fonte: e.target.value,
                        })
                      }
                      placeholder="Digite a fonte da imagem..."
                      className="w-full"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  {editandoConteudo.tipo === "paragrafo" ? (
                    <textarea
                      value={editandoConteudo.conteudo}
                      onChange={(e) =>
                        setEditandoConteudo({
                          ...editandoConteudo,
                          conteudo: e.target.value,
                        })
                      }
                      placeholder="Digite o parágrafo..."
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={8}
                    />
                  ) : (
                    <Input
                      value={editandoConteudo.conteudo}
                      onChange={(e) =>
                        setEditandoConteudo({
                          ...editandoConteudo,
                          conteudo: e.target.value,
                        })
                      }
                      placeholder={`Digite o ${
                        editandoConteudo.tipo === "titulo"
                          ? "título"
                          : "subtítulo"
                      }...`}
                      className="w-full"
                    />
                  )}

                  {editandoConteudo.tipo === "paragrafo" && (
                    <div className="mt-4">
                      {/* Colunas */}
                      <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <TooltipProvider>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-700">
                              Colunas:
                            </span>
                            <div className="flex gap-1">
                              {[
                                {
                                  value: 1,
                                  icon: (
                                    <div className="flex gap-1">
                                      <div className="w-3 h-3 bg-blue-600 rounded"></div>
                                    </div>
                                  ),
                                  tooltip: "1 coluna (largura total)",
                                },
                                {
                                  value: 2,
                                  icon: (
                                    <div className="flex gap-1">
                                      <div className="w-2 h-3 bg-blue-600 rounded"></div>
                                      <div className="w-2 h-3 bg-blue-600 rounded"></div>
                                    </div>
                                  ),
                                  tooltip: "2 colunas (1/2 da largura)",
                                },
                              ].map(({ value, icon, tooltip }) => (
                                <Tooltip key={value}>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditandoConteudo({
                                          ...editandoConteudo,
                                          colunas: value === 1 ? 12 : 6,
                                        })
                                      }
                                      className={`p-2 rounded border transition-all ${
                                        (editandoConteudo.colunas === 12 &&
                                          value === 1) ||
                                        (editandoConteudo.colunas === 6 &&
                                          value === 2)
                                          ? "bg-blue-100 border-blue-300 text-blue-700"
                                          : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                                      }`}
                                    >
                                      {icon}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{tooltip}</p>
                                  </TooltipContent>
                                </Tooltip>
                              ))}
                            </div>
                          </div>
                        </TooltipProvider>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={closeEditarConteudoModal}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    handleEditarConteudo(
                      editandoConteudo.unidadeId,
                      editandoConteudo.conteudoId,
                      editandoConteudo.tipo,
                      editandoConteudo.conteudo,
                      editandoConteudo.tamanho,
                      editandoConteudo.legenda,
                      editandoConteudo.fonte,
                      editandoConteudo.corTexto,
                      editandoConteudo.alinhamento,
                      editandoConteudo.colunas
                    );
                    closeEditarConteudoModal();
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={
                    !editandoConteudo.conteudo.trim() ||
                    (editandoConteudo.tipo === "imagem" &&
                      (!editandoConteudo.tamanho ||
                        !editandoConteudo.legenda ||
                        !editandoConteudo.fonte))
                  }
                >
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal para adicionar conteúdo */}
      {conteudoTemp.unidadeId && (
        <div
          className={`fixed inset-0 bg-black flex items-center justify-center p-4 z-50 ${
            closingAdicionarConteudo
              ? "animate-out fade-out duration-200"
              : "animate-in fade-in duration-200"
          } ${closingAdicionarConteudo ? "bg-opacity-0" : "bg-opacity-50"}`}
          onClick={closeAdicionarConteudoModal}
        >
          <Card
            className={`w-full max-w-2xl ${
              closingAdicionarConteudo
                ? "animate-out zoom-out-95 duration-200"
                : "animate-in zoom-in-95 duration-200"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {conteudoTemp.tipo === "titulo" ? (
                  <>
                    <Heading2 className="h-5 w-5 text-blue-600" />
                    Adicionar Título
                  </>
                ) : conteudoTemp.tipo === "subtitulo" ? (
                  <>
                    <Heading3 className="h-5 w-5 text-blue-600" />
                    Adicionar Subtítulo
                  </>
                ) : conteudoTemp.tipo === "imagem" ? (
                  <>
                    <Image className="h-5 w-5 text-blue-600" />
                    Adicionar Imagem
                  </>
                ) : (
                  <>
                    <Type className="h-5 w-5 text-blue-600" />
                    Adicionar Parágrafo
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {conteudoTemp.tipo === "imagem" ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL da Imagem *
                    </label>
                    <Input
                      value={conteudoTemp.conteudo}
                      onChange={(e) =>
                        setConteudoTemp({
                          ...conteudoTemp,
                          conteudo: e.target.value,
                        })
                      }
                      placeholder="Cole a URL da imagem..."
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tamanho da Imagem *
                    </label>
                    <select
                      value={conteudoTemp.tamanho || ""}
                      onChange={(e) =>
                        setConteudoTemp({
                          ...conteudoTemp,
                          tamanho: e.target.value as
                            | "pequena"
                            | "media"
                            | "grande",
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Selecione o tamanho</option>
                      <option value="pequena">Pequena (25%)</option>
                      <option value="media">Média (50%)</option>
                      <option value="grande">Grande (100%)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Legenda *
                    </label>
                    <Input
                      value={conteudoTemp.legenda || ""}
                      onChange={(e) =>
                        setConteudoTemp({
                          ...conteudoTemp,
                          legenda: e.target.value,
                        })
                      }
                      placeholder="Digite a legenda da imagem..."
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fonte *
                    </label>
                    <Input
                      value={conteudoTemp.fonte || ""}
                      onChange={(e) =>
                        setConteudoTemp({
                          ...conteudoTemp,
                          fonte: e.target.value,
                        })
                      }
                      placeholder="Digite a fonte da imagem..."
                      className="w-full"
                    />
                  </div>

                  <div className="mt-4">
                    {/* Colunas */}
                    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <TooltipProvider>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-700">
                            Colunas:
                          </span>
                          <div className="flex gap-1">
                            {[
                              {
                                value: 1,
                                icon: (
                                  <div className="flex gap-1">
                                    <div className="w-3 h-3 bg-blue-600 rounded"></div>
                                  </div>
                                ),
                                tooltip: "1 coluna (largura total)",
                              },
                              {
                                value: 2,
                                icon: (
                                  <div className="flex gap-1">
                                    <div className="w-2 h-3 bg-blue-600 rounded"></div>
                                    <div className="w-2 h-3 bg-blue-600 rounded"></div>
                                  </div>
                                ),
                                tooltip: "2 colunas (1/2 da largura)",
                              },
                            ].map(({ value, icon, tooltip }) => (
                              <Tooltip key={value}>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setConteudoTemp({
                                        ...conteudoTemp,
                                        colunas: value === 1 ? 12 : 6,
                                      })
                                    }
                                    className={`p-2 rounded border transition-all ${
                                      (conteudoTemp.colunas === 12 &&
                                        value === 1) ||
                                      (conteudoTemp.colunas === 6 &&
                                        value === 2)
                                        ? "bg-blue-100 border-blue-300 text-blue-700"
                                        : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                                    }`}
                                  >
                                    {icon}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>{tooltip}</TooltipContent>
                              </Tooltip>
                            ))}
                          </div>
                        </div>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  {conteudoTemp.tipo === "paragrafo" ? (
                    <textarea
                      value={conteudoTemp.conteudo}
                      onChange={(e) =>
                        setConteudoTemp({
                          ...conteudoTemp,
                          conteudo: e.target.value,
                        })
                      }
                      placeholder="Digite o parágrafo..."
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={8}
                    />
                  ) : (
                    <Input
                      value={conteudoTemp.conteudo}
                      onChange={(e) =>
                        setConteudoTemp({
                          ...conteudoTemp,
                          conteudo: e.target.value,
                        })
                      }
                      placeholder={`Digite o ${
                        conteudoTemp.tipo === "titulo" ? "título" : "subtítulo"
                      }...`}
                      className="w-full"
                    />
                  )}

                  {conteudoTemp.tipo === "paragrafo" && (
                    <div className="mt-4">
                      {/* Colunas */}
                      <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <TooltipProvider>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-700">
                              Colunas:
                            </span>
                            <div className="flex gap-1">
                              {[
                                {
                                  value: 1,
                                  icon: (
                                    <div className="flex gap-1">
                                      <div className="w-3 h-3 bg-blue-600 rounded"></div>
                                    </div>
                                  ),
                                  tooltip: "1 coluna (largura total)",
                                },
                                {
                                  value: 2,
                                  icon: (
                                    <div className="flex gap-1">
                                      <div className="w-2 h-3 bg-blue-600 rounded"></div>
                                      <div className="w-2 h-3 bg-blue-600 rounded"></div>
                                    </div>
                                  ),
                                  tooltip: "2 colunas (1/2 da largura)",
                                },
                              ].map(({ value, icon, tooltip }) => (
                                <Tooltip key={value}>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setConteudoTemp({
                                          ...conteudoTemp,
                                          colunas: value === 1 ? 12 : 6,
                                        })
                                      }
                                      className={`p-2 rounded border transition-all ${
                                        (conteudoTemp.colunas === 12 &&
                                          value === 1) ||
                                        (conteudoTemp.colunas === 6 &&
                                          value === 2)
                                          ? "bg-blue-100 border-blue-300 text-blue-700"
                                          : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                                      }`}
                                    >
                                      {icon}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{tooltip}</p>
                                  </TooltipContent>
                                </Tooltip>
                              ))}
                            </div>
                          </div>
                        </TooltipProvider>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={closeAdicionarConteudoModal}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    handleSalvarConteudo();
                    closeAdicionarConteudoModal();
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={
                    !conteudoTemp.conteudo.trim() ||
                    (conteudoTemp.tipo === "imagem" &&
                      (!conteudoTemp.tamanho ||
                        !conteudoTemp.legenda ||
                        !conteudoTemp.fonte))
                  }
                >
                  Adicionar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal para adicionar unidade */}
      {adicionarUnidadeModal && (
        <div
          className={`fixed inset-0 bg-black flex items-center justify-center p-4 z-50 ${
            closingAdicionarUnidade
              ? "animate-out fade-out duration-200"
              : "animate-in fade-in duration-200"
          } ${closingAdicionarUnidade ? "bg-opacity-0" : "bg-opacity-50"}`}
          onClick={closeAdicionarUnidadeModal}
        >
          <Card
            className={`w-full max-w-2xl ${
              closingAdicionarUnidade
                ? "animate-out zoom-out-95 duration-200"
                : "animate-in zoom-in-95 duration-200"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-600" />
                Adicionar Nova Unidade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                value={novaUnidade}
                onChange={(e) => setNovaUnidade(e.target.value)}
                placeholder="Título da unidade"
                onKeyPress={(e) =>
                  e.key === "Enter" && handleAdicionarUnidade()
                }
              />

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={closeAdicionarUnidadeModal}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    handleAdicionarUnidade();
                    closeAdicionarUnidadeModal();
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={!novaUnidade.trim()}
                >
                  Adicionar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal para editar unidade */}
      {editarUnidadeModal && unidadeParaEditar && (
        <div
          className={`fixed inset-0 bg-black flex items-center justify-center p-4 z-50 ${
            closingEditarUnidade
              ? "animate-out fade-out duration-200"
              : "animate-in fade-in duration-200"
          } ${closingEditarUnidade ? "bg-opacity-0" : "bg-opacity-50"}`}
          onClick={closeEditarUnidadeModal}
        >
          <Card
            className={`w-full max-w-2xl ${
              closingEditarUnidade
                ? "animate-out zoom-out-95 duration-200"
                : "animate-in zoom-in-95 duration-200"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-600" />
                Editar Unidade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título da Unidade *
                </label>
                <Input
                  value={tituloUnidadeEditando}
                  onChange={(e) => setTituloUnidadeEditando(e.target.value)}
                  placeholder="Digite o título da unidade..."
                  className="w-full"
                  onKeyPress={(e) =>
                    e.key === "Enter" && handleSalvarEdicaoUnidade()
                  }
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={closeEditarUnidadeModal}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSalvarEdicaoUnidade}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={!tituloUnidadeEditando.trim()}
                >
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de confirmação para deletar unidade */}
      {confirmarDeletarUnidade && unidadeParaDeletar && (
        <div
          className={`fixed inset-0 bg-black flex items-center justify-center p-4 z-50 ${
            closingConfirmarDeletar
              ? "animate-out fade-out duration-200"
              : "animate-in fade-in duration-200"
          } ${closingConfirmarDeletar ? "bg-opacity-0" : "bg-opacity-50"}`}
          onClick={closeConfirmarDeletarUnidadeModal}
        >
          <Card
            className={`w-full max-w-md ${
              closingConfirmarDeletar
                ? "animate-out zoom-out-95 duration-200"
                : "animate-in zoom-in-95 duration-200"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-600" />
                Confirmar Exclusão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Tem certeza que deseja deletar esse elemento?</p>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={closeConfirmarDeletarUnidadeModal}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    deletarUnidade(unidadeParaDeletar);
                    closeConfirmarDeletarUnidadeModal();
                  }}
                >
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de confirmação para deletar conteúdo */}
      {confirmarDeletarConteudo && conteudoParaDeletar && (
        <div
          className={`fixed inset-0 bg-black flex items-center justify-center p-4 z-50 ${
            closingConfirmarDeletarConteudo
              ? "animate-out fade-out duration-200"
              : "animate-in fade-in duration-200"
          } ${
            closingConfirmarDeletarConteudo ? "bg-opacity-0" : "bg-opacity-50"
          }`}
          onClick={closeConfirmarDeletarConteudoModal}
        >
          <Card
            className={`w-full max-w-md ${
              closingConfirmarDeletarConteudo
                ? "animate-out zoom-out-95 duration-200"
                : "animate-in zoom-in-95 duration-200"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-600" />
                Confirmar Exclusão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Tem certeza que deseja deletar esse elemento?</p>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={closeConfirmarDeletarConteudoModal}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    deletarConteudo(
                      conteudoParaDeletar.unidadeId,
                      conteudoParaDeletar.conteudoId
                    );
                    closeConfirmarDeletarConteudoModal();
                  }}
                >
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#363636",
            color: "#fff",
          },
        }}
      />
    </div>
  );
}
