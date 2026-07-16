'use client'

// Esta página não deve ser exportada estaticamente (usa context e hooks client-side)
// O Next.js deve ignorar esta página durante build estático
export const dynamic = 'error'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useGeradorCurso } from '@/context/GeradorCursoContext'
import { usePreview } from '@/hooks/usePreview'
import { useTheme } from '@/hooks/useTheme'
import { usePDF } from '@/hooks/usePDF'
import { useSCORM } from '@/hooks/useSCORM'
import { ExportModal } from '@/components/ExportModal'
import { RichTextEditor } from '@/components/RichTextEditor'
import { PageTransition } from '@/components/PageTransition'
import { EditableCard } from '@/components/EditableCard'
import { TooltipButton } from '@/components/TooltipButton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
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
  Image,
  Download,
  BookmarkPlus,
  Clock,
  GraduationCap,
  Upload,
  Loader2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  List,
  HelpCircle,
  AlertTriangle,
  Moon,
  Sun,
  Settings,
} from 'lucide-react'
import { CourseSettingsDrawer } from '@/components/CourseSettingsDrawer'
import { ContentBlockDrawer } from '@/components/ContentBlockDrawer'
import { UnidadesDropdown } from '@/components/UnidadesDropdown'
import { ManageUnitsModal } from '@/components/ManageUnitsModal'
import { SortableConteudoWrapper } from '@/components/SortableConteudoWrapper'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { QuizConteudo } from '@/components/QuizConteudo'
import { InfoBox } from '@/components/info-box'
import { QuizData, QuizQuestion, Unidade, ConteudoUnidade } from '@/types/gerador-curso'

export default function EditarCursoPage() {
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
  } = useGeradorCurso()
  const { openPreview } = usePreview()
  const { isDarkMode, toggleDarkMode } = useTheme()
  const { generatePDF, isGenerating: isGeneratingPDF } = usePDF()
  const { generateSCORM, isGeneratingSCORM } = useSCORM()
  const router = useRouter()
  const params = useParams()

  const [novaUnidade, setNovaUnidade] = useState('')
  const [novaUnidadeDescricao, setNovaUnidadeDescricao] = useState('')
  const [tituloEditado, setTituloEditado] = useState('')
  const [descricaoEditada, setDescricaoEditada] = useState('')
  const [descricaoUnidadeEditando, setDescricaoUnidadeEditando] = useState('')
  const [editandoConteudo, setEditandoConteudo] = useState<{
    unidadeId: string
    conteudoId: string
    tipo:
      | 'paragrafo'
      | 'subtitulo'
      | 'titulo'
      | 'imagem'
      | 'video'
      | 'accordion'
      | 'flipcard'
      | 'lista'
      | 'quiz'
      | 'info-box'
    conteudo: string
    tamanho?: 'pequena' | 'media' | 'grande'
    legenda?: string
    fonte?: string
    corTexto?: string
    alinhamento?: 'esquerda' | 'centro' | 'direita' | 'justificado'
    colunas?: 6 | 12
    items?: Array<{ id: string; titulo: string; conteudo: string }>
    tipoFrente?: 'imagem' | 'imagem-titulo' | 'titulo'
    imagemFrente?: string
    tituloFrente?: string
    conteudoVerso?: string
    alturaCard?: string
    itensLista?: Array<{ id: string; texto: string }>
    tipoLista?: 'ordenada' | 'nao-ordenada' | 'check'
    quizData?: QuizData
    tipoInfoBox?: 'atencao' | 'saiba_mais' | 'info' | 'curiosidade'
    tituloInfoBox?: string
    videoUrl?: string
    videoTitulo?: string
  } | null>(null)
  const [conteudoTemp, setConteudoTemp] = useState({
    tipo: 'paragrafo' as
      | 'paragrafo'
      | 'subtitulo'
      | 'titulo'
      | 'imagem'
      | 'video'
      | 'accordion'
      | 'flipcard'
      | 'lista'
      | 'quiz'
      | 'info-box',
    conteudo: '',
    unidadeId: '',
    tamanho: 'media' as 'pequena' | 'media' | 'grande',
    legenda: '',
    fonte: '',
    corTexto: '#000000',
    alinhamento: 'esquerda' as 'esquerda' | 'centro' | 'direita' | 'justificado',
    colunas: 12 as 6 | 12,
    items: [] as Array<{ id: string; titulo: string; conteudo: string }>,
    tipoFrente: 'titulo' as 'imagem' | 'imagem-titulo' | 'titulo',
    imagemFrente: '',
    tituloFrente: '',
    conteudoVerso: '',
    alturaCard: '300px',
    itensLista: [] as Array<{ id: string; texto: string }>,
    tipoLista: 'nao-ordenada' as 'ordenada' | 'nao-ordenada' | 'check',
    quizData: undefined as QuizData | undefined,
    tipoInfoBox: 'info' as 'atencao' | 'saiba_mais' | 'info' | 'curiosidade',
    tituloInfoBox: '',
    videoUrl: '',
    videoTitulo: '',
  })
  const [adicionarUnidadeModal, setAdicionarUnidadeModal] = useState(false)
  const [editarUnidadeModal, setEditarUnidadeModal] = useState(false)
  const [unidadeParaEditar, setUnidadeParaEditar] = useState<string | null>(null)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [tituloUnidadeEditando, setTituloUnidadeEditando] = useState('')
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [isFetchingCurso, setIsFetchingCurso] = useState(false)
  const insertAtIndex = useRef<{ unidadeId: string; index: number } | null>(null)
  const pendingInsert = useRef<{ unidadeId: string; targetIndex: number } | null>(null)
  const [isSavingConteudo, setIsSavingConteudo] = useState(false)
  const [isDeletingConteudo, setIsDeletingConteudo] = useState(false)
  const shouldCloseModal = useRef(false)
  const shouldCloseDeleteModal = useRef(false)
  const [conteudoParaDeletar, setConteudoParaDeletar] = useState<{
    unidadeId: string
    conteudoId: string
  } | null>(null)
  const [confirmarDeletarConteudo, setConfirmarDeletarConteudo] = useState(false)
  const [editarCursoModal, setEditarCursoModal] = useState(false)
  const [modalAdicionarConteudo, setModalAdicionarConteudo] = useState(false)

  const [cargaHorariaEditada, setCargaHorariaEditada] = useState('')
  const [modalidadeEditada, setModalidadeEditada] = useState('')
  const [categoriaEditada, setCategoriaEditada] = useState('')
  const [unidadeAtivaIndex, setUnidadeAtivaIndex] = useState(0)
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false)
  const [manageUnitsModalOpen, setManageUnitsModalOpen] = useState(false)

  const [contentDrawerOpen, setContentDrawerOpen] = useState(false)
  const [contentDrawerMode, setContentDrawerMode] = useState<'add' | 'edit'>('add')
  const [contentDrawerBlockData, setContentDrawerBlockData] =
    useState<Partial<ConteudoUnidade> | null>(null)
  const [contentDrawerUnidadeId, setContentDrawerUnidadeId] = useState<string>('')

  const cursoId = params.id as string

  // Selecionar o curso ao carregar a página (busca do servidor se necessário)
  useEffect(() => {
    if (cursoId && !state.loading) {
      // Verificar se o curso não está selecionado ainda
      if (
        !state.cursoAtual ||
        (state.cursoAtual.id !== cursoId && state.cursoAtual.slug !== cursoId)
      ) {
        setIsFetchingCurso(true)
        selecionarCurso(cursoId) // Busca do servidor se não estiver no cache
      } else {
        // Curso já está selecionado
        setIsFetchingCurso(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursoId, state.loading, state.cursoAtual?.id]) // Remove selecionarCurso para evitar loop infinito

  // Atualizar isFetchingCurso quando o curso for carregado
  useEffect(() => {
    if (state.cursoAtual?.id === cursoId || state.cursoAtual?.slug === cursoId) {
      setIsFetchingCurso(false)
    }
  }, [state.cursoAtual, cursoId])

  // Atualizar preview da imagem ao editar conteúdo
  useEffect(() => {
    if (editandoConteudo?.tipo === 'imagem' && editandoConteudo.conteudo) {
      if (editandoConteudo.conteudo.startsWith('http')) {
        setImagePreviewUrl(editandoConteudo.conteudo)
      } else {
        setImagePreviewUrl(null)
      }
    } else if (!editandoConteudo) {
      setImagePreviewUrl(null)
    }
  }, [editandoConteudo])

  // Atualizar preview da imagem ao adicionar conteúdo
  useEffect(() => {
    if (conteudoTemp.tipo === 'imagem' && conteudoTemp.conteudo) {
      if (conteudoTemp.conteudo.startsWith('http')) {
        setImagePreviewUrl(conteudoTemp.conteudo)
      }
    } else if (conteudoTemp.tipo !== 'imagem') {
      setImagePreviewUrl(null)
    }
  }, [conteudoTemp.tipo, conteudoTemp.conteudo])

  useEffect(() => {
    if (editarCursoModal && state.cursoAtual) {
      setTituloEditado(state.cursoAtual.titulo)
      setDescricaoEditada(state.cursoAtual.descricao)
      setCargaHorariaEditada(state.cursoAtual.cargaHoraria)
      setModalidadeEditada(state.cursoAtual.modalidade)
      setCategoriaEditada(state.cursoAtual.categoria)
    }
  }, [editarCursoModal, state.cursoAtual])

  // Rolar para o topo ao mudar de unidade
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [unidadeAtivaIndex])

  // Reordenar item recém-adicionado para a posição correta após o state atualizar
  useEffect(() => {
    if (pendingInsert.current) {
      const { unidadeId, targetIndex } = pendingInsert.current
      const unidade = state.cursoAtual?.unidades?.find((u) => u.id === unidadeId)
      if (unidade) {
        const c = [...(unidade.conteudo || [])]
        console.log('🔍 useEffect reordenamento - c.length:', c.length, 'targetIndex:', targetIndex)
        console.log(
          '🔍 Array ANTES do arrayMove:',
          c.map((item, i) => `[${i}] ${item.tipo} ordem:${item.ordem}`)
        )

        if (c.length > 0 && targetIndex < c.length) {
          pendingInsert.current = null
          const reord = arrayMove(c, c.length - 1, targetIndex)
          reord.forEach((item, i) => (item.ordem = i))

          console.log(
            '🔍 Array DEPOIS do arrayMove:',
            reord.map((item, i) => `[${i}] ${item.tipo} ordem:${item.ordem}`)
          )
          editarUnidade(unidadeId, { conteudo: reord })
          return
        }
      }
    }
    if (shouldCloseModal.current) {
      shouldCloseModal.current = false
      setIsSavingConteudo(false)
      toast.success('Conteúdo adicionado')
      setConteudoTemp({
        tipo: 'paragrafo',
        conteudo: '',
        unidadeId: '',
        tamanho: 'media',
        legenda: '',
        fonte: '',
        corTexto: '#000000',
        alinhamento: 'esquerda',
        colunas: 12,
        items: [],
        tipoFrente: 'titulo',
        imagemFrente: '',
        tituloFrente: '',
        conteudoVerso: '',
        alturaCard: '300px',
        itensLista: [],
        videoUrl: '',
        videoTitulo: '',
        tipoLista: 'nao-ordenada',
        quizData: undefined,
        tipoInfoBox: 'info',
        tituloInfoBox: '',
      })
    }
    if (shouldCloseDeleteModal.current) {
      shouldCloseDeleteModal.current = false
      setIsDeletingConteudo(false)
      toast.error('Conteúdo excluído')
      setConfirmarDeletarConteudo(false)
      setConteudoParaDeletar(null)
    }
  }, [state.cursoAtual?.unidades, editarUnidade])

  const handleVoltar = () => router.push('/cursos')

  const closeAdicionarUnidadeModal = () => {
    setAdicionarUnidadeModal(false)
    setNovaUnidade('')
    setNovaUnidadeDescricao('')
  }

  const openEditarUnidadeModal = (unidadeId: string) => {
    const unidade = state.cursoAtual?.unidades?.find((u) => u.id === unidadeId)
    if (unidade) {
      setUnidadeParaEditar(unidadeId)
      setTituloUnidadeEditando(unidade.titulo)
      setDescricaoUnidadeEditando(unidade.descricao)
      setEditarUnidadeModal(true)
    }
  }

  const closeEditarUnidadeModal = () => {
    setEditarUnidadeModal(false)
    setUnidadeParaEditar(null)
    setTituloUnidadeEditando('')
    setDescricaoUnidadeEditando('')
  }

  const closeConfirmarDeletarConteudoModal = () => {
    setConfirmarDeletarConteudo(false)
    setConteudoParaDeletar(null)
  }

  const closeEditarConteudoModal = () => {
    setEditandoConteudo(null)
  }

  const closeAdicionarConteudoModal = () => {
    setConteudoTemp({
      tipo: 'paragrafo',
      conteudo: '',
      unidadeId: '',
      tamanho: 'media',
      legenda: '',
      fonte: '',
      corTexto: '#000000',
      alinhamento: 'esquerda',
      colunas: 12,
      items: [],
      tipoFrente: 'titulo',
      imagemFrente: '',
      tituloFrente: '',
      conteudoVerso: '',
      alturaCard: '300px',
      itensLista: [],
      videoUrl: '',
      videoTitulo: '',
      tipoLista: 'nao-ordenada',
      quizData: undefined,
      tipoInfoBox: 'info',
      tituloInfoBox: '',
    })
  }

  const closeEditarCursoModal = () => {
    setEditarCursoModal(false)
  }

  const handleSalvarEdicaoCurso = async () => {
    if (state.cursoAtual) {
      try {
        await editarCurso(state.cursoAtual.id, {
          titulo: tituloEditado,
          descricao: descricaoEditada,
          cargaHoraria: cargaHorariaEditada,
          modalidade: modalidadeEditada,
          categoria: categoriaEditada,
        })
      } catch (error) {
        console.error('Erro ao salvar edição do curso:', error)
      }
    }
  }

  const handleAdicionarUnidade = () => {
    if (novaUnidade.trim() && novaUnidadeDescricao.trim()) {
      adicionarUnidade({
        titulo: novaUnidade.trim(),
        descricao: novaUnidadeDescricao.trim(),
        conteudo: [],
      })
      toast.success('Unidade adicionada')
      setNovaUnidade('')
      setNovaUnidadeDescricao('')
      setAdicionarUnidadeModal(false)
    }
  }

  const handleSalvarEdicaoUnidade = () => {
    if (unidadeParaEditar && tituloUnidadeEditando.trim() && descricaoUnidadeEditando.trim()) {
      editarUnidade(unidadeParaEditar, {
        titulo: tituloUnidadeEditando.trim(),
        descricao: descricaoUnidadeEditando.trim(),
      })
      toast.success('Unidade atualizada')
      closeEditarUnidadeModal()
    }
  }

  const handleUploadImage = async (
    file: File,
    forEdit: boolean = false,
    forFlipcard: boolean = false
  ) => {
    if (!file) return

    // Validar tipo
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ]
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo inválido. Use JPG, PNG, GIF, WEBP ou SVG.')
      return
    }

    // Validar tamanho (10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Máximo: 10MB')
      return
    }

    setIsUploadingImage(true)
    setImagePreviewUrl(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao fazer upload')
      }

      // Atualizar URL da imagem no estado correto
      if (forFlipcard) {
        // Para flipcard, atualizar imagemFrente
        if (forEdit && editandoConteudo) {
          setEditandoConteudo({
            ...editandoConteudo,
            imagemFrente: data.url,
          })
        } else {
          setConteudoTemp({
            ...conteudoTemp,
            imagemFrente: data.url,
          })
        }
      } else if (forEdit && editandoConteudo) {
        setEditandoConteudo({
          ...editandoConteudo,
          conteudo: data.url,
        })
      } else {
        setConteudoTemp({
          ...conteudoTemp,
          conteudo: data.url,
        })
      }

      // Mostrar preview
      setImagePreviewUrl(data.url)

      toast.success('Imagem enviada')
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      toast.error('Erro ao enviar imagem')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleOpenAddContentDrawer = (unidadeId: string, index: number) => {
    insertAtIndex.current = { unidadeId, index }
    setModalAdicionarConteudo(true)
  }

  const handleSelectBlockType = (tipo: ConteudoUnidade['tipo'], unidadeId: string) => {
    console.log('🔍 handleSelectBlockType - tipo:', tipo, 'unidadeId:', unidadeId)
    setModalAdicionarConteudo(false)
    setContentDrawerUnidadeId(unidadeId)
    setContentDrawerMode('add')
    setContentDrawerBlockData({ tipo })
    console.log('🔍 Abrindo ContentDrawer com tipo:', tipo)
    setContentDrawerOpen(true)
  }

  const handleOpenEditContentDrawer = (unidadeId: string, conteudo: ConteudoUnidade) => {
    setContentDrawerUnidadeId(unidadeId)
    setContentDrawerMode('edit')
    setContentDrawerBlockData(conteudo)
    setContentDrawerOpen(true)
  }

  const handleSaveContentFromDrawer = async (data: Omit<ConteudoUnidade, 'id' | 'ordem'>) => {
    console.log('🔍 handleSaveContentFromDrawer - mode:', contentDrawerMode, 'data:', data)
    console.log('🔍 insertAtIndex.current:', insertAtIndex.current)

    if (contentDrawerMode === 'add') {
      if (insertAtIndex.current) {
        const { unidadeId, index } = insertAtIndex.current
        console.log('🔍 Adicionando conteúdo - unidadeId:', unidadeId, 'index:', index)

        const unidade = state.cursoAtual?.unidades?.find((u) => u.id === unidadeId)
        const conteudoLength = unidade?.conteudo?.length || 0
        console.log('🔍 Tamanho atual do conteúdo:', conteudoLength)

        adicionarConteudo(unidadeId, data)

        if (index < conteudoLength) {
          console.log('🔍 Precisa reordenar - index:', index, '< conteudoLength:', conteudoLength)
          pendingInsert.current = { unidadeId, targetIndex: index }
        } else {
          console.log('🔍 NÃO precisa reordenar - adicionar no final')
        }
      }
      toast.success('Conteúdo adicionado')
    } else {
      if (contentDrawerBlockData?.id) {
        editarConteudo(contentDrawerUnidadeId, contentDrawerBlockData.id, data)
        toast.success('Conteúdo atualizado')
      }
    }
    setContentDrawerOpen(false)
  }

  const handleCancelContentDrawer = () => {
    setContentDrawerOpen(false)
    setContentDrawerBlockData(null)
    setContentDrawerUnidadeId('')
    insertAtIndex.current = null
  }

  const handleUploadImageForDrawer = async (file: File): Promise<string> => {
    if (!file) throw new Error('Arquivo não fornecido')

    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ]
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Tipo de arquivo inválido. Use JPG, PNG, GIF, WEBP ou SVG.')
    }

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      throw new Error('Arquivo muito grande. Máximo: 10MB')
    }

    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Erro ao fazer upload')
    }

    return data.url
  }

  const handleSalvarConteudo = () => {
    if (conteudoTemp.tipo === 'accordion') {
      // Validar accordion
      if (!conteudoTemp.items || conteudoTemp.items.length === 0) {
        alert('Adicione pelo menos um item ao accordion.')
        return
      }
      // Verificar se todos os itens têm título e conteúdo
      const itensInvalidos = conteudoTemp.items.some(
        (item) => !item.titulo.trim() || !item.conteudo.trim()
      )
      if (itensInvalidos) {
        alert('Todos os itens do accordion devem ter título e conteúdo preenchidos.')
        return
      }
    } else if (conteudoTemp.tipo === 'flipcard') {
      // Validar flipcard
      if (!conteudoTemp.tipoFrente) {
        alert('Selecione o tipo de frente do flipcard.')
        return
      }
      if (conteudoTemp.tipoFrente === 'imagem' && !conteudoTemp.imagemFrente?.trim()) {
        alert('Adicione uma imagem para a frente do flipcard.')
        return
      }
      if (
        conteudoTemp.tipoFrente === 'imagem-titulo' &&
        (!conteudoTemp.imagemFrente?.trim() || !conteudoTemp.tituloFrente?.trim())
      ) {
        alert('Adicione uma imagem e um título para a frente do flipcard.')
        return
      }
      if (conteudoTemp.tipoFrente === 'titulo' && !conteudoTemp.tituloFrente?.trim()) {
        alert('Adicione um título para a frente do flipcard.')
        return
      }
      if (!conteudoTemp.conteudoVerso?.trim()) {
        alert('Adicione o conteúdo do verso do flipcard.')
        return
      }
    } else if (conteudoTemp.tipo === 'lista') {
      // Validar lista
      if (!conteudoTemp.itensLista || conteudoTemp.itensLista.length === 0) {
        alert('Adicione pelo menos um item à lista.')
        return
      }
      if (conteudoTemp.itensLista.some((item) => !item.texto.trim())) {
        alert('Todos os itens da lista devem ter texto preenchido.')
        return
      }
    } else if (conteudoTemp.tipo === 'quiz') {
      // Validar quiz
      if (
        !conteudoTemp.quizData ||
        !conteudoTemp.quizData.questions ||
        conteudoTemp.quizData.questions.length === 0
      ) {
        alert('O quiz deve ter pelo menos uma pergunta.')
        return
      }

      // Validar cada pergunta
      for (const question of conteudoTemp.quizData.questions) {
        if (!question.pergunta.trim()) {
          alert('Todas as perguntas devem ter um texto preenchido.')
          return
        }
        if (!question.opcoes || question.opcoes.length !== 5) {
          alert('Cada pergunta deve ter exatamente 5 opções de resposta.')
          return
        }
        if (question.opcoes.some((opcao) => !opcao.texto.trim())) {
          alert('Todas as opções de resposta devem ter texto preenchido.')
          return
        }
        if (question.opcoes.every((opcao) => !opcao.isCorrect)) {
          alert('Cada pergunta deve ter exatamente uma resposta correta marcada.')
          return
        }
        const correctCount = question.opcoes.filter((opcao) => opcao.isCorrect).length
        if (correctCount !== 1) {
          alert('Cada pergunta deve ter exatamente uma resposta correta.')
          return
        }
        if (question.opcoes.some((opcao) => !opcao.feedback.trim())) {
          alert('Todas as opções de resposta devem ter um feedback preenchido.')
          return
        }
      }
    } else if (conteudoTemp.tipo === 'info-box') {
      // Validar info-box
      if (!conteudoTemp.tipoInfoBox) {
        alert('Selecione o tipo do Info Box.')
        return
      }
      if (!conteudoTemp.conteudo.trim()) {
        alert('O texto do corpo do Info Box é obrigatório.')
        return
      }
    } else if (conteudoTemp.tipo === 'imagem') {
      if (!conteudoTemp.tamanho || !conteudoTemp.legenda || !conteudoTemp.fonte) {
        alert('Por favor, preencha todos os campos obrigatórios para a imagem.')
        return
      }
    } else {
      if (!conteudoTemp.conteudo.trim()) {
        return
      }
    }

    adicionarConteudo(conteudoTemp.unidadeId, {
      tipo: conteudoTemp.tipo,
      conteudo: conteudoTemp.conteudo || '',
      tamanho: conteudoTemp.tamanho,
      legenda: conteudoTemp.legenda,
      fonte: conteudoTemp.fonte,
      corTexto: conteudoTemp.corTexto,
      alinhamento: conteudoTemp.alinhamento,
      colunas: conteudoTemp.colunas,
      items: conteudoTemp.items,
      tipoFrente: conteudoTemp.tipoFrente,
      imagemFrente: conteudoTemp.imagemFrente,
      tituloFrente: conteudoTemp.tituloFrente,
      conteudoVerso: conteudoTemp.conteudoVerso,
      alturaCard: conteudoTemp.alturaCard,
      itensLista: conteudoTemp.itensLista,
      tipoLista: conteudoTemp.tipoLista,
      quizData: conteudoTemp.quizData,
      tipoInfoBox: conteudoTemp.tipoInfoBox,
      tituloInfoBox: conteudoTemp.tituloInfoBox,
    })
    // Se foi solicitada inserção em posição específica, registrar para reordenar após state atualizar
    if (insertAtIndex.current && insertAtIndex.current.unidadeId === conteudoTemp.unidadeId) {
      pendingInsert.current = {
        unidadeId: conteudoTemp.unidadeId,
        targetIndex: insertAtIndex.current.index + 1,
      }
      insertAtIndex.current = null
    }
  }

  const handleEditarConteudo = (
    unidadeId: string,
    conteudoId: string,
    tipo:
      | 'paragrafo'
      | 'subtitulo'
      | 'titulo'
      | 'imagem'
      | 'accordion'
      | 'flipcard'
      | 'lista'
      | 'quiz'
      | 'info-box',
    conteudo: string,
    tamanho?: 'pequena' | 'media' | 'grande',
    legenda?: string,
    fonte?: string,
    corTexto?: string,
    alinhamento?: 'esquerda' | 'centro' | 'direita' | 'justificado',
    colunas?: 6 | 12,
    items?: Array<{ id: string; titulo: string; conteudo: string }>,
    tipoFrente?: 'imagem' | 'imagem-titulo' | 'titulo',
    imagemFrente?: string,
    tituloFrente?: string,
    conteudoVerso?: string,
    alturaCard?: string,
    itensLista?: Array<{ id: string; texto: string }>,
    tipoLista?: 'ordenada' | 'nao-ordenada' | 'check',
    quizData?: QuizData,
    tipoInfoBox?: 'atencao' | 'saiba_mais' | 'info' | 'curiosidade',
    tituloInfoBox?: string
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
      items,
      tipoFrente,
      imagemFrente,
      tituloFrente,
      conteudoVerso,
      alturaCard,
      itensLista,
      tipoLista,
      quizData,
      tipoInfoBox,
      tituloInfoBox,
    })
    toast.success('Conteúdo atualizado')
    setEditandoConteudo(null)
  }

  // Funções para gerenciar itens do accordion
  const handleAdicionarItemAccordion = () => {
    const novoItem = {
      id: `accordion-item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      titulo: '',
      conteudo: '',
    }
    setConteudoTemp({
      ...conteudoTemp,
      items: [...(conteudoTemp.items || []), novoItem],
    })
  }

  const handleRemoverItemAccordion = (itemId: string) => {
    setConteudoTemp({
      ...conteudoTemp,
      items: conteudoTemp.items?.filter((item) => item.id !== itemId) || [],
    })
  }

  const handleAtualizarItemAccordion = (
    itemId: string,
    campo: 'titulo' | 'conteudo',
    valor: string
  ) => {
    setConteudoTemp({
      ...conteudoTemp,
      items:
        conteudoTemp.items?.map((item) =>
          item.id === itemId ? { ...item, [campo]: valor } : item
        ) || [],
    })
  }

  // Funções para gerenciar itens da lista
  const handleAdicionarItemLista = () => {
    const novoItem = {
      id: `lista-item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      texto: '',
    }
    setConteudoTemp({
      ...conteudoTemp,
      itensLista: [...(conteudoTemp.itensLista || []), novoItem],
    })
  }

  const handleRemoverItemLista = (itemId: string) => {
    setConteudoTemp({
      ...conteudoTemp,
      itensLista: conteudoTemp.itensLista?.filter((item) => item.id !== itemId) || [],
    })
  }

  const handleAtualizarItemLista = (itemId: string, valor: string) => {
    setConteudoTemp({
      ...conteudoTemp,
      itensLista:
        conteudoTemp.itensLista?.map((item) =>
          item.id === itemId ? { ...item, texto: valor } : item
        ) || [],
    })
  }

  // Funções para gerenciar quiz
  const handleAdicionarPerguntaQuiz = () => {
    if (!conteudoTemp.quizData) return
    const novaPergunta: QuizQuestion = {
      id: `question-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      pergunta: '',
      dica: '',
      opcoes: Array.from({ length: 5 }, (_, i) => ({
        id: `opcao-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 9)}`,
        texto: '',
        isCorrect: i === 0,
        feedback: '',
      })),
    }
    setConteudoTemp({
      ...conteudoTemp,
      quizData: {
        ...conteudoTemp.quizData,
        questions: [...conteudoTemp.quizData.questions, novaPergunta],
      },
    })
  }

  const handleRemoverPerguntaQuiz = (questionId: string) => {
    if (!conteudoTemp.quizData || conteudoTemp.quizData.questions.length <= 1) {
      alert('O quiz deve ter pelo menos uma pergunta.')
      return
    }
    setConteudoTemp({
      ...conteudoTemp,
      quizData: {
        ...conteudoTemp.quizData,
        questions: conteudoTemp.quizData.questions.filter((q) => q.id !== questionId),
      },
    })
  }

  const handleAtualizarPerguntaQuiz = (
    questionId: string,
    campo: 'pergunta' | 'dica',
    valor: string
  ) => {
    if (!conteudoTemp.quizData) return
    setConteudoTemp({
      ...conteudoTemp,
      quizData: {
        ...conteudoTemp.quizData,
        questions: conteudoTemp.quizData.questions.map((q) =>
          q.id === questionId ? { ...q, [campo]: valor } : q
        ),
      },
    })
  }

  const handleAtualizarOpcaoQuiz = (
    questionId: string,
    opcaoId: string,
    campo: 'texto' | 'feedback',
    valor: string
  ) => {
    if (!conteudoTemp.quizData) return
    setConteudoTemp({
      ...conteudoTemp,
      quizData: {
        ...conteudoTemp.quizData,
        questions: conteudoTemp.quizData.questions.map((q) =>
          q.id === questionId
            ? {
                ...q,
                opcoes: q.opcoes.map((opcao) =>
                  opcao.id === opcaoId ? { ...opcao, [campo]: valor } : opcao
                ),
              }
            : q
        ),
      },
    })
  }

  const handleMarcarRespostaCorreta = (questionId: string, opcaoId: string) => {
    if (!conteudoTemp.quizData) return
    setConteudoTemp({
      ...conteudoTemp,
      quizData: {
        ...conteudoTemp.quizData,
        questions: conteudoTemp.quizData.questions.map((q) =>
          q.id === questionId
            ? {
                ...q,
                opcoes: q.opcoes.map((opcao) => ({
                  ...opcao,
                  isCorrect: opcao.id === opcaoId,
                })),
              }
            : q
        ),
      },
    })
  }

  const handleDeletarConteudo = (unidadeId: string, conteudoId: string) => {
    setConteudoParaDeletar({ unidadeId, conteudoId })
    setConfirmarDeletarConteudo(true)
  }

  const handleSelecionarTipoConteudo = (
    tipo:
      | 'titulo'
      | 'subtitulo'
      | 'paragrafo'
      | 'imagem'
      | 'accordion'
      | 'flipcard'
      | 'lista'
      | 'quiz'
      | 'info-box',
    unidadeId?: string,
    colunas: 6 | 12 = 12
  ) => {
    if (unidadeId) {
      // Inicializar quizData com uma pergunta vazia se for quiz
      const quizDataInitial: QuizData | undefined =
        tipo === 'quiz'
          ? {
              questions: [
                {
                  id: `question-${Date.now()}`,
                  pergunta: '',
                  dica: '',
                  opcoes: Array.from({ length: 5 }, (_, i) => ({
                    id: `opcao-${Date.now()}-${i}`,
                    texto: '',
                    isCorrect: i === 0, // primeira opção como correta por padrão
                    feedback: '',
                  })),
                },
              ],
            }
          : undefined

      setConteudoTemp({
        tipo: tipo,
        conteudo: '',
        unidadeId: unidadeId,
        tamanho: 'media',
        legenda: '',
        fonte: '',
        corTexto: '#000000',
        alinhamento: 'esquerda',
        colunas: colunas,
        items: tipo === 'accordion' ? [] : [],
        tipoFrente: tipo === 'flipcard' ? 'titulo' : 'titulo',
        imagemFrente: tipo === 'flipcard' ? '' : '',
        tituloFrente: tipo === 'flipcard' ? '' : '',
        conteudoVerso: tipo === 'flipcard' ? '' : '',
        alturaCard: tipo === 'flipcard' ? '300px' : '300px',
        itensLista: tipo === 'lista' ? [] : [],
        tipoLista: tipo === 'lista' ? 'nao-ordenada' : 'nao-ordenada',
        quizData: quizDataInitial,
        tipoInfoBox: tipo === 'info-box' ? 'info' : 'info',
        tituloInfoBox: tipo === 'info-box' ? '' : '',
      })
    }
  }

  // handleMoverUnidadeAcima e handleMoverUnidadeAbaixo removidos — reordenação via drag-and-drop na sidebar

  const handlePreview = () => {
    if (state.cursoAtual) {
      openPreview(state.cursoAtual)
    }
  }

  const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleDragEndConteudo = (event: DragEndEvent, unidadeId: string) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const unidade = state.cursoAtual?.unidades?.find((u) => u.id === unidadeId)
    if (!unidade) return
    const conteudo = [...(unidade.conteudo || [])]
    const oldIndex = conteudo.findIndex((c) => c.id === active.id)
    const newIndex = conteudo.findIndex((c) => c.id === over.id)
    const novoConteudo = arrayMove(conteudo, oldIndex, newIndex)
    novoConteudo.forEach((c, i) => (c.ordem = i))
    editarUnidade(unidadeId, { conteudo: novoConteudo })
  }

  // Verificar se está carregando ou se o curso não foi encontrado
  if (state.loading || isFetchingCurso || !state.cursoAtual) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA] dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando curso...</p>
        </div>
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col bg-[#F5F7FA] dark:bg-gray-950">
        {/* Header */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-[#e5e7eb] dark:border-gray-800 sticky top-0 z-50">
          <div className="px-6 py-3">
            <div className="flex items-center justify-between gap-4">
              {/* Esquerda */}
              <div className="flex items-center gap-3">
                <TooltipButton icon={ArrowLeft} tooltip="Voltar" onClick={handleVoltar} />
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {state.cursoAtual.titulo}
                </h1>
              </div>

              {/* Centro - Dropdown de Unidades */}
              <div className="flex-1 flex justify-center">
                <UnidadesDropdown
                  unidades={state.cursoAtual.unidades}
                  unidadeAtivaIndex={unidadeAtivaIndex}
                  onSelectUnidade={setUnidadeAtivaIndex}
                  onOpenManageModal={() => setManageUnitsModalOpen(true)}
                />
              </div>

              {/* Direita */}
              <div className="flex space-x-2">
                <TooltipButton
                  icon={Settings}
                  tooltip="Configurações do curso"
                  onClick={() => setSettingsDrawerOpen(true)}
                />
                <TooltipButton
                  icon={isDarkMode ? Sun : Moon}
                  tooltip={isDarkMode ? 'Modo claro' : 'Modo escuro'}
                  onClick={toggleDarkMode}
                />
                <TooltipButton icon={Eye} tooltip="Preview" onClick={handlePreview} />
                <Button
                  onClick={() => setExportModalOpen(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Painel de Conteúdo - Largura Total */}
        <div className="flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Conteúdo Principal */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="max-w-[760px] mx-auto">
                {/* Card de Informações do Curso */}
                <Card className="hidden mb-8 border-0 shadow-xl overflow-hidden bg-linear-to-br from-blue-600 via-blue-700 to-purple-600 dark:from-blue-800 dark:via-purple-800 dark:to-purple-900 text-white">
                  <CardHeader className="pb-6 pt-8 px-8">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                            <BookOpen className="h-8 w-8 text-white" />
                          </div>
                          <CardTitle className="text-3xl md:text-4xl font-bold leading-tight">
                            {state.cursoAtual.titulo}
                          </CardTitle>
                        </div>
                        <p className="text-blue-50 text-lg leading-relaxed max-w-4xl">
                          {state.cursoAtual.descricao}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <TooltipButton
                          icon={Edit}
                          tooltip="Editar informações do curso"
                          onClick={() => setEditarCursoModal(true)}
                          variant="outline"
                          iconClassName="h-5 w-5"
                          className="p-3 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 hover:border-white/40 shadow-md transition-all"
                        />
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="px-8 pb-8 pt-0">
                    {/* Informações em Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg hover:bg-white/15 transition-all">
                        <div className="p-3 bg-white/20 rounded-lg">
                          <Clock className="h-6 w-6 text-blue-100" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-200 mb-1">Carga Horária</p>
                          <p className="text-xl font-bold text-white">
                            {state.cursoAtual.cargaHoraria}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg hover:bg-white/15 transition-all">
                        <div className="p-3 bg-white/20 rounded-lg">
                          <GraduationCap className="h-6 w-6 text-blue-100" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-200 mb-1">Modalidade</p>
                          <p className="text-xl font-bold text-white">
                            {state.cursoAtual.modalidade}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge
                        variant="secondary"
                        className="bg-white/20 backdrop-blur-sm text-white border-white/30 px-4 py-2 text-sm font-semibold shadow-md hover:bg-white/25 transition-all"
                      >
                        <Layers className="h-4 w-4 mr-2" />
                        {state.cursoAtual.unidades?.length || 0}{' '}
                        {state.cursoAtual.unidades?.length === 1 ? 'Unidade' : 'Unidades'}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="bg-white/20 backdrop-blur-sm text-white border-white/30 px-4 py-2 text-sm font-semibold shadow-md hover:bg-white/25 transition-all"
                      >
                        {state.cursoAtual.categoria}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Lista de Unidades */}
                <div className="space-y-8">
                  {(state.cursoAtual.unidades || []).map((unidade, unidadeIndex) => {
                    const safeIndex = Math.min(
                      unidadeAtivaIndex,
                      (state.cursoAtual?.unidades || []).length - 1
                    )
                    if (unidadeIndex !== safeIndex) return null
                    return (
                      <div key={unidade.id || `unidade-${unidadeIndex}`}>
                        <EditableCard
                          actions={
                            <TooltipButton
                              icon={Edit}
                              tooltip="Editar unidade"
                              onClick={() => openEditarUnidadeModal(unidade.id)}
                              size="md"
                              asButton={false}
                              className="h-8 w-8 p-0 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            />
                          }
                        >
                          <div>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '12px',
                                fontWeight: '500',
                                color: '#0047BB',
                                background: 'rgba(0, 71, 187, 0.1)',
                                padding: '4px 10px',
                                borderRadius: '999px',
                                marginBottom: '14px',
                              }}
                            >
                              <Layers style={{ width: '12px', height: '12px' }} />
                              Unidade {unidadeIndex + 1}
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                              {unidade.titulo}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                              {unidade.descricao}
                            </p>
                          </div>
                        </EditableCard>

                        <div>
                          {/* Lista de Conteúdo */}
                          {(unidade.conteudo || []).length === 0 ? (
                            <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-blue-300 bg-linear-to-br from-blue-50 via-white to-purple-50 py-12 px-6">
                              {/* Decorative elements */}
                              <div className="absolute top-0 left-0 w-full h-full opacity-5">
                                <div className="absolute top-4 left-4 w-32 h-32 bg-blue-500 rounded-full blur-3xl"></div>
                                <div className="absolute bottom-4 right-4 w-40 h-40 bg-purple-500 rounded-full blur-3xl"></div>
                              </div>

                              <div className="relative text-center space-y-4">
                                {/* Icon */}
                                <div className="flex justify-center">
                                  <div className="p-4 bg-linear-to-br from-blue-500 to-purple-600 rounded-full shadow-lg">
                                    <Plus className="h-8 w-8 text-white" />
                                  </div>
                                </div>

                                {/* Title and Description */}
                                <div className="space-y-2">
                                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                    Comece a criar seu conteúdo!
                                  </h3>
                                  <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                                    Esta unidade ainda está vazia. Use os botões abaixo para
                                    adicionar títulos, parágrafos, imagens e muito mais.
                                  </p>
                                </div>

                                {/* Hint */}
                                <div className="flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-medium pt-2">
                                  <Type className="h-4 w-4" />
                                  <span>Escolha um tipo de conteúdo para começar</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <DndContext
                              sensors={dndSensors}
                              collisionDetection={closestCenter}
                              onDragEnd={(e) => handleDragEndConteudo(e, unidade.id)}
                            >
                              <SortableContext
                                items={(unidade.conteudo || [])
                                  .sort((a, b) => a.ordem - b.ordem)
                                  .map((c) => c.id)}
                                strategy={verticalListSortingStrategy}
                              >
                                <div className="grid grid-cols-12 gap-1">
                                  {(() => {
                                    const conteudos = (unidade.conteudo || []).sort(
                                      (a, b) => a.ordem - b.ordem
                                    )

                                    console.log(
                                      `🔍 Unidade ${unidade.titulo} - Total de conteúdos:`,
                                      conteudos.length
                                    )
                                    conteudos.forEach((c, i) => {
                                      console.log(
                                        `  [${i}] ${c.tipo} - ordem: ${c.ordem} - id: ${c.id}`,
                                        c.videoTitulo || c.conteudo?.substring(0, 30)
                                      )
                                    })

                                    // Agrupar itens em linhas
                                    type RowInfo = {
                                      startIndex: number
                                      endIndex: number
                                      totalCols: number
                                    }
                                    const rows: RowInfo[] = []
                                    let rStart = 0,
                                      rSum = 0
                                    conteudos.forEach((it, i) => {
                                      const cols = it.colunas || 12
                                      if (i > 0 && rSum + cols > 12) {
                                        rows.push({
                                          startIndex: rStart,
                                          endIndex: i - 1,
                                          totalCols: rSum,
                                        })
                                        rStart = i
                                        rSum = cols
                                      } else {
                                        rSum += cols
                                      }
                                    })
                                    if (conteudos.length > 0)
                                      rows.push({
                                        startIndex: rStart,
                                        endIndex: conteudos.length - 1,
                                        totalCols: rSum,
                                      })

                                    console.log('🟣 ROWS calculadas:', rows)
                                    rows.forEach((r, i) => {
                                      console.log(
                                        `  Row ${i}: startIndex=${r.startIndex}, endIndex=${r.endIndex}, totalCols=${r.totalCols}`
                                      )
                                    })

                                    const insertDropdown = (
                                      afterIndex: number,
                                      colSpanClass: string,
                                      key: string
                                    ) => (
                                      <div
                                        key={key}
                                        className={`group/div relative ${colSpanClass}`}
                                      >
                                        <div className="relative flex items-center justify-center opacity-0 group-hover/div:opacity-100 transition-opacity">
                                          {/* Linha horizontal */}
                                          <div className="absolute inset-x-0 h-px bg-blue-600 dark:bg-blue-500"></div>

                                          {/* Botão circular */}
                                          <TooltipButton
                                            icon={Plus}
                                            tooltip="Inserir conteúdo aqui"
                                            onClick={(e) => {
                                              e?.stopPropagation()
                                              console.log(
                                                '🔵 CLIQUE no botão inserir - afterIndex:',
                                                afterIndex
                                              )
                                              handleOpenAddContentDrawer(unidade.id, afterIndex)
                                            }}
                                            asButton={false}
                                            size="sm"
                                            tooltipSide="top"
                                            tooltipClassName="text-xs"
                                            className="relative z-10 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-lg transition-all hover:scale-110"
                                          />
                                        </div>
                                      </div>
                                    )

                                    const emptySlot = (afterIndex: number, emptyCols: number) => {
                                      const colClass =
                                        emptyCols === 6 ? 'md:col-span-6' : 'col-span-12'
                                      return (
                                        <div
                                          key={`empty-${afterIndex}`}
                                          className={`${colClass} group/empty`}
                                        >
                                          <button
                                            className="w-full h-full min-h-[60px] rounded-lg border-2 border-dashed border-transparent flex items-center justify-center text-gray-400 dark:text-gray-500 opacity-0 group-hover/empty:opacity-100 group-hover/empty:border-gray-300 dark:group-hover/empty:border-gray-600 hover:border-blue-400! dark:hover:border-blue-500! hover:text-blue-500! dark:hover:text-blue-400! hover:bg-blue-50! dark:hover:bg-blue-950/20! transition-all"
                                            onClick={() => {
                                              handleOpenAddContentDrawer(unidade.id, afterIndex)
                                            }}
                                          >
                                            <Plus className="h-4 w-4" />
                                          </button>
                                        </div>
                                      )
                                    }

                                    return rows.map((row, rowIndex) => (
                                      <React.Fragment key={`row-${rowIndex}`}>
                                        {rowIndex === 0 &&
                                          insertDropdown(-1, 'col-span-12', 'divider-first')}
                                        {rowIndex > 0 &&
                                          insertDropdown(
                                            row.startIndex,
                                            'col-span-12',
                                            `divider-${rowIndex}`
                                          )}
                                        {conteudos
                                          .slice(row.startIndex, row.endIndex + 1)
                                          .map((item, itemIndex) => {
                                            console.log(
                                              `🔍 Renderizando conteúdo [${row.startIndex + itemIndex}]:`,
                                              item.tipo,
                                              item.id,
                                              item.videoTitulo || item.conteudo?.substring(0, 50)
                                            )
                                            return (
                                              <SortableConteudoWrapper
                                                key={item.id}
                                                id={item.id}
                                                colunas={item.colunas}
                                              >
                                                {(dragHandle) => (
                                                  <EditableCard
                                                    flex
                                                    label={
                                                      item.tipo === 'titulo'
                                                        ? 'Título'
                                                        : item.tipo === 'subtitulo'
                                                          ? 'Subtítulo'
                                                          : item.tipo === 'paragrafo'
                                                            ? 'Texto'
                                                            : item.tipo === 'imagem'
                                                              ? 'Imagem'
                                                              : item.tipo === 'video'
                                                                ? 'Vídeo'
                                                                : item.tipo === 'accordion'
                                                                  ? 'Accordion'
                                                                  : item.tipo === 'flipcard'
                                                                    ? 'FlipCard'
                                                                    : item.tipo === 'lista'
                                                                      ? 'Lista'
                                                                      : item.tipo === 'quiz'
                                                                        ? 'Quiz'
                                                                        : item.tipo === 'info-box'
                                                                          ? 'Info Box'
                                                                          : 'Conteúdo'
                                                    }
                                                    actions={
                                                      <>
                                                        {dragHandle}
                                                        <TooltipButton
                                                          icon={Edit}
                                                          tooltip="Editar"
                                                          onClick={() =>
                                                            handleOpenEditContentDrawer(
                                                              unidade.id,
                                                              item
                                                            )
                                                          }
                                                          asButton={false}
                                                          size="sm"
                                                          className="p-1.5 rounded text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                        />
                                                        <TooltipButton
                                                          icon={Trash2}
                                                          tooltip="Deletar"
                                                          onClick={() =>
                                                            handleDeletarConteudo(
                                                              unidade.id,
                                                              item.id
                                                            )
                                                          }
                                                          asButton={false}
                                                          size="sm"
                                                          className="p-1.5 rounded text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                        />
                                                      </>
                                                    }
                                                  >
                                                    <div className="flex-1 mt-1">
                                                      {item.tipo === 'titulo' ? (
                                                        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                                                          {item.conteudo}
                                                        </h3>
                                                      ) : item.tipo === 'subtitulo' ? (
                                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                                          {item.conteudo}
                                                        </h4>
                                                      ) : item.tipo === 'flipcard' ? (
                                                        <div className="border border-[#e5e7eb] dark:border-gray-700 rounded-lg p-4 bg-linear-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 text-center min-h-[72px] flex flex-col items-center justify-center gap-2">
                                                          {item.imagemFrente && (
                                                            <>
                                                              {/* eslint-disable-next-line @next/next/no-img-element */}
                                                              <img
                                                                src={item.imagemFrente}
                                                                alt=""
                                                                className="max-h-14 mx-auto object-contain rounded"
                                                                onError={(e) => {
                                                                  e.currentTarget.style.display =
                                                                    'none'
                                                                }}
                                                              />
                                                            </>
                                                          )}
                                                          {item.tituloFrente ? (
                                                            <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                                                              {item.tituloFrente}
                                                            </p>
                                                          ) : (
                                                            <p className="text-xs text-gray-400 italic">
                                                              Sem conteúdo na frente
                                                            </p>
                                                          )}
                                                        </div>
                                                      ) : item.tipo === 'accordion' ? (
                                                        <div className="border border-[#e5e7eb] dark:border-gray-700 rounded-lg overflow-hidden">
                                                          {(item.items || []).length === 0 ? (
                                                            <p className="text-xs text-gray-400 italic p-3">
                                                              Nenhum item
                                                            </p>
                                                          ) : (
                                                            (item.items || []).map((acc, idx) => (
                                                              <div
                                                                key={acc.id || idx}
                                                                className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-[#e5e7eb] dark:border-gray-700 last:border-b-0"
                                                              >
                                                                <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                                                  {acc.titulo}
                                                                </span>
                                                                <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0 ml-2" />
                                                              </div>
                                                            ))
                                                          )}
                                                        </div>
                                                      ) : item.tipo === 'imagem' ? (
                                                        <div className="space-y-2">
                                                          {item.fonte && (
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                                              Fonte: {item.fonte}
                                                            </p>
                                                          )}
                                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                                          <img
                                                            src={item.conteudo}
                                                            alt={item.legenda || 'Imagem'}
                                                            className={`h-auto object-contain border border-[#e5e7eb] dark:border-gray-700 rounded-md mx-auto ${item.tamanho === 'pequena' ? 'max-w-xs' : item.tamanho === 'media' ? 'max-w-md' : 'max-w-full'}`}
                                                            onError={(e) => {
                                                              e.currentTarget.style.display = 'none'
                                                            }}
                                                          />
                                                          {item.legenda && (
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 italic text-center">
                                                              {item.legenda}
                                                            </p>
                                                          )}
                                                        </div>
                                                      ) : item.tipo === 'video' ? (
                                                        <div className="space-y-2">
                                                          {item.videoTitulo && (
                                                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                              {item.videoTitulo}
                                                            </p>
                                                          )}
                                                          <div className="aspect-video w-full rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border border-[#e5e7eb] dark:border-gray-700">
                                                            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-sm">
                                                              🎬 Vídeo:{' '}
                                                              {item.videoUrl
                                                                ? new URL(item.videoUrl).hostname
                                                                : 'YouTube'}
                                                            </div>
                                                          </div>
                                                          {item.videoUrl && (
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                              {item.videoUrl}
                                                            </p>
                                                          )}
                                                        </div>
                                                      ) : item.tipo === 'lista' ? (
                                                        <div className="space-y-1">
                                                          {(item.itensLista || []).length === 0 ? (
                                                            <p className="text-xs text-gray-400 italic">
                                                              Nenhum item
                                                            </p>
                                                          ) : (
                                                            (item.itensLista || []).map(
                                                              (listaItem, idx) => (
                                                                <div
                                                                  key={listaItem.id || idx}
                                                                  className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                                                                >
                                                                  <span className="shrink-0 mt-0.5">
                                                                    {item.tipoLista ===
                                                                    'ordenada' ? (
                                                                      <span className="flex items-center justify-center w-4 h-4 bg-purple-500 text-white rounded-full text-xs font-semibold">
                                                                        {idx + 1}
                                                                      </span>
                                                                    ) : item.tipoLista ===
                                                                      'check' ? (
                                                                      <span className="flex items-center justify-center w-4 h-4 bg-green-500 text-white rounded">
                                                                        <svg
                                                                          className="w-2.5 h-2.5"
                                                                          fill="none"
                                                                          stroke="currentColor"
                                                                          viewBox="0 0 24 24"
                                                                        >
                                                                          <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={3}
                                                                            d="M5 13l4 4L19 7"
                                                                          />
                                                                        </svg>
                                                                      </span>
                                                                    ) : (
                                                                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 block" />
                                                                    )}
                                                                  </span>
                                                                  <span className="line-clamp-1">
                                                                    {listaItem.texto}
                                                                  </span>
                                                                </div>
                                                              )
                                                            )
                                                          )}
                                                        </div>
                                                      ) : item.tipo === 'quiz' ? (
                                                        item.quizData ? (
                                                          <QuizConteudo
                                                            quizData={item.quizData}
                                                            isEdicao={true}
                                                          />
                                                        ) : (
                                                          <p className="text-xs text-gray-400 italic">
                                                            Sem perguntas
                                                          </p>
                                                        )
                                                      ) : item.tipo === 'info-box' ? (
                                                        item.tipoInfoBox ? (
                                                          <InfoBox
                                                            tipo={item.tipoInfoBox}
                                                            titulo={item.tituloInfoBox}
                                                          >
                                                            <div
                                                              dangerouslySetInnerHTML={{
                                                                __html: item.conteudo || '',
                                                              }}
                                                            />
                                                          </InfoBox>
                                                        ) : null
                                                      ) : (
                                                        <div
                                                          className={`conteudo-paragrafo text-gray-700 dark:text-gray-300 ${item.alinhamento === 'centro' ? 'text-center' : item.alinhamento === 'direita' ? 'text-right' : item.alinhamento === 'justificado' ? 'text-justify' : 'text-left'}`}
                                                          dangerouslySetInnerHTML={{
                                                            __html: item.conteudo,
                                                          }}
                                                        />
                                                      )}
                                                    </div>
                                                  </EditableCard>
                                                )}
                                              </SortableConteudoWrapper>
                                            )
                                          })}
                                        {row.totalCols < 12 &&
                                          emptySlot(row.endIndex, 12 - row.totalCols)}
                                      </React.Fragment>
                                    ))
                                  })()}
                                </div>
                              </SortableContext>
                            </DndContext>
                          )}

                          {/* Botão Adicionar Conteúdo */}
                          <div className="mt-8">
                            <button
                              onClick={() => {
                                const ultimoIndex = (unidade.conteudo || []).length
                                handleOpenAddContentDrawer(unidade.id, ultimoIndex)
                              }}
                              className="w-full px-6 py-4 bg-white dark:bg-gray-800 border-2 border-dashed border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all flex items-center justify-center gap-2 font-semibold text-sm"
                            >
                              <Plus className="h-5 w-5" />
                              <span>Adicionar conteúdo</span>
                            </button>
                          </div>

                          {/* Botões inline removidos — adicionados na barra fixa abaixo */}
                          <div className="hidden">
                            <div className="grid grid-cols-1 gap-3">
                              <Button
                                onClick={() => handleSelecionarTipoConteudo('titulo', unidade.id)}
                              >
                                Título
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSelecionarTipoConteudo('imagem', unidade.id)}
                                className="h-auto py-4 px-3 flex flex-col items-center gap-2 bg-white dark:bg-gray-900 hover:bg-green-50 dark:hover:bg-green-900/30 hover:border-green-400 dark:hover:border-green-500 hover:shadow-md transition-all border-2 border-green-200 dark:border-green-800 group"
                              >
                                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-800 transition-colors">
                                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                                  <Image className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                  Imagem
                                </span>
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleSelecionarTipoConteudo('accordion', unidade.id)
                                }
                                className="h-auto py-4 px-3 flex flex-col items-center gap-2 bg-white dark:bg-gray-900 hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-md transition-all border-2 border-orange-200 dark:border-orange-800 group"
                              >
                                <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg group-hover:bg-orange-200 dark:group-hover:bg-orange-800 transition-colors">
                                  <ChevronDown className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                </div>
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                  Accordion
                                </span>
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSelecionarTipoConteudo('flipcard', unidade.id)}
                                className="h-auto py-4 px-3 flex flex-col items-center gap-2 bg-white dark:bg-gray-900 hover:bg-pink-50 dark:hover:bg-pink-900/30 hover:border-pink-400 dark:hover:border-pink-500 hover:shadow-md transition-all border-2 border-pink-200 dark:border-pink-800 group"
                              >
                                <div className="p-2 bg-pink-100 dark:bg-pink-900/50 rounded-lg group-hover:bg-pink-200 dark:group-hover:bg-pink-800 transition-colors">
                                  <RotateCcw className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                                </div>
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                  FlipCard
                                </span>
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSelecionarTipoConteudo('lista', unidade.id)}
                                className="h-auto py-4 px-3 flex flex-col items-center gap-2 bg-white dark:bg-gray-900 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-md transition-all border-2 border-purple-200 dark:border-purple-800 group"
                              >
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
                                  <List className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                  Lista
                                </span>
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSelecionarTipoConteudo('quiz', unidade.id)}
                                className="h-auto py-4 px-3 flex flex-col items-center gap-2 bg-white dark:bg-gray-900 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all border-2 border-indigo-200 dark:border-indigo-800 group"
                              >
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800 transition-colors">
                                  <HelpCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                  Quiz
                                </span>
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSelecionarTipoConteudo('info-box', unidade.id)}
                                className="h-auto py-4 px-3 flex flex-col items-center gap-2 bg-white dark:bg-gray-900 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 hover:border-yellow-400 dark:hover:border-yellow-500 hover:shadow-md transition-all border-2 border-yellow-200 dark:border-yellow-800 group"
                              >
                                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg group-hover:bg-yellow-200 dark:group-hover:bg-yellow-800 transition-colors">
                                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                                </div>
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                  Info Box
                                </span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Navegação entre unidades */}
                {(state.cursoAtual.unidades || []).length > 0 && (
                  <div className="mt-12 mb-8">
                    {/* Divisor */}
                    <div className="mb-6">
                      <div className="h-px bg-gray-200 dark:bg-gray-700"></div>
                    </div>

                    {/* Botões de navegação */}
                    <div className="flex items-center justify-between">
                      {/* Botão Anterior */}
                      <button
                        onClick={() => setUnidadeAtivaIndex(unidadeAtivaIndex - 1)}
                        disabled={unidadeAtivaIndex === 0}
                        className="group flex items-center justify-center gap-1 px-8 py-2.5 rounded-lg bg-blue-600 dark:bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-600 dark:disabled:hover:bg-blue-600"
                      >
                        <ChevronLeft className="h-5 w-5 shrink-0" />
                        <span className="text-sm font-medium">Anterior</span>
                      </button>

                      {/* Botão Próxima */}
                      <button
                        onClick={() => setUnidadeAtivaIndex(unidadeAtivaIndex + 1)}
                        disabled={unidadeAtivaIndex >= (state.cursoAtual.unidades || []).length - 1}
                        className="group flex items-center justify-center gap-1 px-8 py-2.5 rounded-lg bg-blue-600 dark:bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-600 dark:disabled:hover:bg-blue-600"
                      >
                        <span className="text-sm font-medium">Próxima</span>
                        <ChevronRight className="h-5 w-5 shrink-0" />
                      </button>
                    </div>
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
            </div>
          </div>
        </div>

        {/* Modal para adicionar conteúdo */}
        <Dialog open={modalAdicionarConteudo} onOpenChange={setModalAdicionarConteudo}>
          <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Adicionar conteúdo</DialogTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Escolha o tipo de conteúdo que você quer incluir na unidade.
              </p>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              {/* Título */}
              <button
                onClick={() => {
                  if (insertAtIndex.current) {
                    handleSelectBlockType('titulo', insertAtIndex.current.unidadeId)
                  }
                }}
                className="flex flex-col items-start p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                  <Heading2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
                  Título
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-left">
                  Cabeçalho de seção
                </p>
              </button>

              {/* Texto */}
              <button
                onClick={() => {
                  if (insertAtIndex.current) {
                    handleSelectBlockType('paragrafo', insertAtIndex.current.unidadeId)
                  }
                }}
                className="flex flex-col items-start p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                  <Type className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
                  Texto
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-left">
                  Parágrafo de conteúdo
                </p>
              </button>

              {/* Imagem */}
              <button
                onClick={() => {
                  if (insertAtIndex.current) {
                    handleSelectBlockType('imagem', insertAtIndex.current.unidadeId)
                  }
                }}
                className="flex flex-col items-start p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
                  Imagem
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-left">
                  Foto com legenda
                </p>
              </button>

              {/* Vídeo */}
              <button
                onClick={() => {
                  console.log('🎬 Clicou em Vídeo!')
                  if (insertAtIndex.current) {
                    handleSelectBlockType('video', insertAtIndex.current.unidadeId)
                  }
                }}
                className="flex flex-col items-start p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                  <svg
                    className="h-5 w-5 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
                  Vídeo
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-left">
                  Vídeo do YouTube
                </p>
              </button>

              {/* Lista */}
              <button
                onClick={() => {
                  if (insertAtIndex.current) {
                    handleSelectBlockType('lista', insertAtIndex.current.unidadeId)
                  }
                }}
                className="flex flex-col items-start p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                  <List className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
                  Lista
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-left">
                  Itens ou passos
                </p>
              </button>

              {/* Destaque (Info Box) */}
              <button
                onClick={() => {
                  if (insertAtIndex.current) {
                    handleSelectBlockType('info-box', insertAtIndex.current.unidadeId)
                  }
                }}
                className="flex flex-col items-start p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                  <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
                  Destaque
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-left">Dica ou aviso</p>
              </button>

              {/* Flashcards (FlipCard) */}
              <button
                onClick={() => {
                  if (insertAtIndex.current) {
                    handleSelectBlockType('flipcard', insertAtIndex.current.unidadeId)
                  }
                }}
                className="flex flex-col items-start p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                  <RotateCcw className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
                  Flashcards
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-left">
                  Cartões de revisão
                </p>
              </button>

              {/* Sanfona (Accordion) */}
              <button
                onClick={() => {
                  if (insertAtIndex.current) {
                    handleSelectBlockType('accordion', insertAtIndex.current.unidadeId)
                  }
                }}
                className="flex flex-col items-start p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                  <ChevronDown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
                  Sanfona
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-left">
                  Perguntas expansíveis
                </p>
              </button>

              {/* Quiz */}
              <button
                onClick={() => {
                  if (insertAtIndex.current) {
                    handleSelectBlockType('quiz', insertAtIndex.current.unidadeId)
                  }
                }}
                className="flex flex-col items-start p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                  <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
                  Quiz
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-left">
                  Pergunta com resposta
                </p>
              </button>

              {/* Subtítulo */}
              <button
                onClick={() => {
                  if (insertAtIndex.current) {
                    handleSelectBlockType('subtitulo', insertAtIndex.current.unidadeId)
                  }
                }}
                className="flex flex-col items-start p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                  <Heading3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
                  Subtítulo
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-left">Subcabeçalho</p>
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal para editar curso */}
        <Dialog open={editarCursoModal} onOpenChange={() => setEditarCursoModal(false)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-600" />
                Editar Curso
              </DialogTitle>
              <DialogDescription>Atualize as informações do curso</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Título do Curso <span className="text-red-500">*</span>
                </label>
                <Input
                  value={tituloEditado}
                  onChange={(e) => setTituloEditado(e.target.value)}
                  placeholder="Título do curso"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Descrição do Curso <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={descricaoEditada}
                  onChange={(e) => setDescricaoEditada(e.target.value)}
                  placeholder="Descrição do curso"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={6}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Carga Horária <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={cargaHorariaEditada}
                    onChange={(e) => setCargaHorariaEditada(e.target.value)}
                    placeholder="Ex: 40 horas"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Modalidade <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={modalidadeEditada}
                    onChange={(e) => setModalidadeEditada(e.target.value)}
                    placeholder="Ex: EAD, Presencial"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Categoria <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={categoriaEditada}
                    onChange={(e) => setCategoriaEditada(e.target.value)}
                    placeholder="Ex: Programação, Design, Marketing"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeEditarCursoModal}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  handleSalvarEdicaoCurso()
                  closeEditarCursoModal()
                }}
                disabled={
                  !tituloEditado.trim() ||
                  !descricaoEditada.trim() ||
                  !cargaHorariaEditada.trim() ||
                  !modalidadeEditada.trim() ||
                  !categoriaEditada.trim()
                }
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal para adicionar conteúdo */}
        <Dialog open={!!conteudoTemp.unidadeId} onOpenChange={closeAdicionarConteudoModal}>
          <DialogContent
            className={`${conteudoTemp.tipo === 'quiz' ? 'sm:max-w-4xl max-h-[90vh]' : 'sm:max-w-2xl'}`}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {conteudoTemp.tipo === 'titulo' ? (
                  <>
                    <Heading2 className="h-5 w-5 text-blue-600" />
                    Adicionar Título
                  </>
                ) : conteudoTemp.tipo === 'subtitulo' ? (
                  <>
                    <Heading3 className="h-5 w-5 text-blue-600" />
                    Adicionar Subtítulo
                  </>
                ) : conteudoTemp.tipo === 'imagem' ? (
                  <>
                    {/* eslint-disable-next-line jsx-a11y/alt-text */}
                    <Image className="h-5 w-5 text-blue-600" />
                    Adicionar Imagem
                  </>
                ) : conteudoTemp.tipo === 'accordion' ? (
                  <>
                    <ChevronDown className="h-5 w-5 text-blue-600" />
                    Adicionar Accordion
                  </>
                ) : conteudoTemp.tipo === 'flipcard' ? (
                  <>
                    <RotateCcw className="h-5 w-5 text-blue-600" />
                    Adicionar FlipCard
                  </>
                ) : conteudoTemp.tipo === 'lista' ? (
                  <>
                    <List className="h-5 w-5 text-blue-600" />
                    Adicionar Lista
                  </>
                ) : conteudoTemp.tipo === 'quiz' ? (
                  <>
                    <HelpCircle className="h-5 w-5 text-blue-600" />
                    Adicionar Quiz
                  </>
                ) : conteudoTemp.tipo === 'info-box' ? (
                  <>
                    <AlertTriangle className="h-5 w-5 text-blue-600" />
                    Adicionar Info Box
                  </>
                ) : (
                  <>
                    <Type className="h-5 w-5 text-blue-600" />
                    Adicionar Parágrafo
                  </>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {conteudoTemp.tipo === 'imagem' ? (
                <div className="space-y-4">
                  {/* Upload ou URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Imagem <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-3">
                      {/* Upload de Arquivo */}
                      <div>
                        <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors bg-gray-50 dark:bg-gray-800">
                          {isUploadingImage ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Enviando...
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <Upload className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Clique para fazer upload
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                ou arraste a imagem aqui
                              </span>
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                JPG, PNG, GIF, WEBP, SVG (máx. 10MB)
                              </span>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                handleUploadImage(file)
                              }
                            }}
                            disabled={isUploadingImage}
                          />
                        </label>
                      </div>

                      {/* Divisor */}
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">
                            ou
                          </span>
                        </div>
                      </div>

                      {/* Input de URL */}
                      <div>
                        <Input
                          value={conteudoTemp.conteudo}
                          onChange={(e) => {
                            setConteudoTemp({
                              ...conteudoTemp,
                              conteudo: e.target.value,
                            })
                            // Atualizar preview se for URL válida
                            if (e.target.value.startsWith('http')) {
                              setImagePreviewUrl(e.target.value)
                            } else {
                              setImagePreviewUrl(null)
                            }
                          }}
                          placeholder="Cole a URL da imagem..."
                        />
                      </div>

                      {/* Preview da Imagem */}
                      {(imagePreviewUrl || conteudoTemp.conteudo) && (
                        <div className="mt-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imagePreviewUrl || conteudoTemp.conteudo}
                            alt="Preview"
                            className="h-auto rounded-lg border border-gray-300 dark:border-gray-600 max-h-40 object-contain bg-gray-50 dark:bg-gray-800 mx-auto"
                            onError={() => setImagePreviewUrl(null)}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tamanho da Imagem <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={conteudoTemp.tamanho || ''}
                      onChange={(e) =>
                        setConteudoTemp({
                          ...conteudoTemp,
                          tamanho: e.target.value as 'pequena' | 'media' | 'grande',
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Selecione o tamanho</option>
                      <option value="pequena">Pequena (25%)</option>
                      <option value="media">Média (50%)</option>
                      <option value="grande">Grande (100%)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Legenda <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={conteudoTemp.legenda || ''}
                      onChange={(e) =>
                        setConteudoTemp({
                          ...conteudoTemp,
                          legenda: e.target.value,
                        })
                      }
                      placeholder="Digite a legenda da imagem..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fonte <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={conteudoTemp.fonte || ''}
                      onChange={(e) =>
                        setConteudoTemp({
                          ...conteudoTemp,
                          fonte: e.target.value,
                        })
                      }
                      placeholder="Digite a fonte da imagem..."
                    />
                  </div>
                </div>
              ) : conteudoTemp.tipo === 'accordion' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      Itens do Accordion <span className="text-red-500">*</span>
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAdicionarItemAccordion}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Item
                    </Button>
                  </div>

                  {conteudoTemp.items && conteudoTemp.items.length > 0 ? (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {conteudoTemp.items.map((item, index) => (
                        <Card key={item.id} className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-gray-700">
                              Item {index + 1}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoverItemAccordion(item.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Título <span className="text-red-500">*</span>
                              </label>
                              <Input
                                value={item.titulo}
                                onChange={(e) =>
                                  handleAtualizarItemAccordion(item.id, 'titulo', e.target.value)
                                }
                                placeholder="Título do item..."
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Conteúdo <span className="text-red-500">*</span>
                              </label>
                              <textarea
                                value={item.conteudo}
                                onChange={(e) =>
                                  handleAtualizarItemAccordion(item.id, 'conteudo', e.target.value)
                                }
                                placeholder="Conteúdo do item..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                                rows={3}
                              />
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 text-sm border-2 border-dashed border-gray-300 rounded-lg">
                      <p>Nenhum item adicionado ainda.</p>
                      <p className="text-xs mt-1">
                        Clique em &quot;Adicionar Item&quot; para começar.
                      </p>
                    </div>
                  )}
                </div>
              ) : conteudoTemp.tipo === 'flipcard' ? (
                <div className="space-y-4">
                  {/* Tipo de Frente */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Frente <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={conteudoTemp.tipoFrente || 'titulo'}
                      onChange={(e) =>
                        setConteudoTemp({
                          ...conteudoTemp,
                          tipoFrente: e.target.value as 'imagem' | 'imagem-titulo' | 'titulo',
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="imagem">Apenas Imagem</option>
                      <option value="imagem-titulo">Imagem com Título no Rodapé</option>
                      <option value="titulo">Apenas Título Centralizado</option>
                    </select>
                  </div>

                  {/* Imagem (se necessário) */}
                  {(conteudoTemp.tipoFrente === 'imagem' ||
                    conteudoTemp.tipoFrente === 'imagem-titulo') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Imagem da Frente <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-3">
                        {/* Upload de Arquivo */}
                        <div>
                          <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors bg-gray-50">
                            {isUploadingImage ? (
                              <div className="flex flex-col items-center gap-2">
                                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                                <span className="text-sm text-gray-600">Enviando...</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2">
                                <Upload className="h-6 w-6 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  Clique para fazer upload
                                </span>
                                <span className="text-xs text-gray-500">
                                  ou arraste a imagem aqui
                                </span>
                                <span className="text-xs text-gray-400">
                                  JPG, PNG, GIF, WEBP, SVG (máx. 10MB)
                                </span>
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  handleUploadImage(file, false, true)
                                }
                              }}
                              disabled={isUploadingImage}
                            />
                          </label>
                        </div>

                        {/* Divisor */}
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="bg-white px-2 text-gray-500">ou</span>
                          </div>
                        </div>

                        {/* Input de URL */}
                        <Input
                          value={conteudoTemp.imagemFrente || ''}
                          onChange={(e) =>
                            setConteudoTemp({
                              ...conteudoTemp,
                              imagemFrente: e.target.value,
                            })
                          }
                          placeholder="Cole a URL da imagem..."
                        />

                        {/* Preview da Imagem */}
                        {(imagePreviewUrl || conteudoTemp.imagemFrente) && (
                          <div className="mt-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imagePreviewUrl || conteudoTemp.imagemFrente}
                              alt="Preview"
                              className="h-auto rounded-lg border border-gray-300 max-h-40 object-contain bg-gray-50 mx-auto"
                              onError={() => setImagePreviewUrl(null)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Título (se necessário) */}
                  {(conteudoTemp.tipoFrente === 'imagem-titulo' ||
                    conteudoTemp.tipoFrente === 'titulo') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Título da Frente <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={conteudoTemp.tituloFrente || ''}
                        onChange={(e) =>
                          setConteudoTemp({
                            ...conteudoTemp,
                            tituloFrente: e.target.value,
                          })
                        }
                        placeholder="Digite o título da frente do card..."
                      />
                    </div>
                  )}

                  {/* Conteúdo do Verso */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Conteúdo do Verso <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={conteudoTemp.conteudoVerso || ''}
                      onChange={(e) =>
                        setConteudoTemp({
                          ...conteudoTemp,
                          conteudoVerso: e.target.value,
                        })
                      }
                      placeholder="Digite o conteúdo do verso do card..."
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={8}
                    />
                  </div>

                  {/* Altura do Card */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Altura do Card (opcional)
                    </label>
                    <Input
                      value={conteudoTemp.alturaCard || '300px'}
                      onChange={(e) =>
                        setConteudoTemp({
                          ...conteudoTemp,
                          alturaCard: e.target.value,
                        })
                      }
                      placeholder="Ex: 300px, 400px, 50vh"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use valores como &quot;300px&quot;, &quot;400px&quot; ou &quot;50vh&quot;
                      (viewport height)
                    </p>
                  </div>
                </div>
              ) : conteudoTemp.tipo === 'lista' ? (
                <div className="space-y-4">
                  {/* Tipo de Lista */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Lista <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={conteudoTemp.tipoLista || 'nao-ordenada'}
                      onChange={(e) =>
                        setConteudoTemp({
                          ...conteudoTemp,
                          tipoLista: e.target.value as 'ordenada' | 'nao-ordenada' | 'check',
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="nao-ordenada">Não Ordenada (Bullets)</option>
                      <option value="ordenada">Ordenada (Numerada)</option>
                      <option value="check">Com Ícone de Check</option>
                    </select>
                  </div>

                  {/* Itens da Lista */}
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      Itens da Lista <span className="text-red-500">*</span>
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAdicionarItemLista}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Item
                    </Button>
                  </div>

                  {conteudoTemp.itensLista && conteudoTemp.itensLista.length > 0 ? (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {conteudoTemp.itensLista.map((item, index) => (
                        <Card key={item.id} className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-gray-700">
                              Item {index + 1}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoverItemLista(item.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Texto do Item <span className="text-red-500">*</span>
                            </label>
                            <Input
                              value={item.texto}
                              onChange={(e) => handleAtualizarItemLista(item.id, e.target.value)}
                              placeholder="Digite o texto do item..."
                              className="text-sm"
                            />
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 text-sm border-2 border-dashed border-gray-300 rounded-lg">
                      <p>Nenhum item adicionado ainda.</p>
                      <p className="text-xs mt-1">
                        Clique em &quot;Adicionar Item&quot; para começar.
                      </p>
                    </div>
                  )}
                </div>
              ) : conteudoTemp.tipo === 'quiz' ? (
                <div className="space-y-6">
                  {/* Botão Adicionar Pergunta */}
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      Perguntas do Quiz <span className="text-red-500">*</span>
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAdicionarPerguntaQuiz}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Pergunta
                    </Button>
                  </div>

                  {/* Lista de Perguntas */}
                  {conteudoTemp.quizData?.questions &&
                  conteudoTemp.quizData.questions.length > 0 ? (
                    <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                      {conteudoTemp.quizData.questions.map((question, questionIndex) => (
                        <Card
                          key={question.id}
                          className="p-6 border-2 border-blue-200 bg-blue-50/30"
                        >
                          {/* Cabeçalho da Pergunta */}
                          <div className="flex items-center justify-between mb-4 pb-4 border-b border-blue-300">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                                {questionIndex + 1}
                              </div>
                              <span className="text-sm font-semibold text-gray-700">
                                Pergunta {questionIndex + 1}
                              </span>
                            </div>
                            {conteudoTemp.quizData &&
                              conteudoTemp.quizData.questions.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoverPerguntaQuiz(question.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                          </div>

                          <div className="space-y-6">
                            {/* Texto da Pergunta */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Pergunta <span className="text-red-500">*</span>
                              </label>
                              <textarea
                                value={question.pergunta}
                                onChange={(e) =>
                                  handleAtualizarPerguntaQuiz(
                                    question.id,
                                    'pergunta',
                                    e.target.value
                                  )
                                }
                                placeholder="Digite a pergunta do quiz..."
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-400"
                                rows={3}
                              />
                            </div>

                            {/* Dica (opcional) */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Dica{' '}
                                <span className="text-gray-400 dark:text-gray-500 text-xs">
                                  (opcional)
                                </span>
                              </label>
                              <textarea
                                value={question.dica || ''}
                                onChange={(e) =>
                                  handleAtualizarPerguntaQuiz(question.id, 'dica', e.target.value)
                                }
                                placeholder="Digite uma dica para o aluno..."
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-400"
                                rows={2}
                              />
                            </div>

                            {/* Opções de Resposta */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-3">
                                Opções de Resposta <span className="text-red-500">*</span>
                                <span className="text-xs text-gray-500 font-normal ml-2">
                                  (Marque exatamente uma resposta correta)
                                </span>
                              </label>
                              <div className="space-y-4">
                                {question.opcoes.map((opcao, index) => (
                                  <Card
                                    key={opcao.id}
                                    className={`p-4 border-2 ${
                                      opcao.isCorrect
                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/30 dark:border-green-600'
                                        : 'border-gray-200 dark:border-gray-700'
                                    }`}
                                  >
                                    <div className="flex items-start gap-4">
                                      {/* Label da Opção */}
                                      <div className="shrink-0">
                                        <div
                                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                                            opcao.isCorrect
                                              ? 'bg-green-500 text-white'
                                              : 'bg-blue-500 text-white'
                                          }`}
                                        >
                                          {String.fromCharCode(65 + index)}
                                        </div>
                                      </div>

                                      {/* Conteúdo da Opção */}
                                      <div className="flex-1 space-y-3">
                                        {/* Texto da Opção */}
                                        <div>
                                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                            Texto da Opção <span className="text-red-500">*</span>
                                          </label>
                                          <Input
                                            value={opcao.texto}
                                            onChange={(e) =>
                                              handleAtualizarOpcaoQuiz(
                                                question.id,
                                                opcao.id,
                                                'texto',
                                                e.target.value
                                              )
                                            }
                                            placeholder={`Digite o texto da opção ${String.fromCharCode(65 + index)}...`}
                                            className="text-sm"
                                          />
                                        </div>

                                        {/* Feedback da Opção */}
                                        <div>
                                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                            Feedback <span className="text-red-500">*</span>
                                          </label>
                                          <textarea
                                            value={opcao.feedback}
                                            onChange={(e) =>
                                              handleAtualizarOpcaoQuiz(
                                                question.id,
                                                opcao.id,
                                                'feedback',
                                                e.target.value
                                              )
                                            }
                                            placeholder="Digite o feedback que aparecerá quando o aluno escolher esta opção..."
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-400"
                                            rows={2}
                                          />
                                        </div>

                                        {/* Radio para Marcar como Correta */}
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="radio"
                                            name={`correct-${question.id}`}
                                            checked={opcao.isCorrect}
                                            onChange={() =>
                                              handleMarcarRespostaCorreta(question.id, opcao.id)
                                            }
                                            className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                                            id={`correct-${question.id}-${opcao.id}`}
                                          />
                                          <label
                                            htmlFor={`correct-${question.id}-${opcao.id}`}
                                            className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                                          >
                                            Marcar como resposta correta
                                          </label>
                                        </div>
                                      </div>
                                    </div>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 text-sm border-2 border-dashed border-gray-300 rounded-lg">
                      <p>Nenhuma pergunta adicionada ainda.</p>
                      <p className="text-xs mt-1">
                        Clique em &quot;Adicionar Pergunta&quot; para começar.
                      </p>
                    </div>
                  )}
                </div>
              ) : conteudoTemp.tipo === 'info-box' ? (
                <div className="space-y-4">
                  {/* Tipo do Info Box */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo do Info Box <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={conteudoTemp.tipoInfoBox || 'info'}
                      onChange={(e) =>
                        setConteudoTemp({
                          ...conteudoTemp,
                          tipoInfoBox: e.target.value as
                            | 'atencao'
                            | 'saiba_mais'
                            | 'info'
                            | 'curiosidade',
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="atencao">Atenção</option>
                      <option value="saiba_mais">Saiba mais</option>
                      <option value="info">Informação</option>
                      <option value="curiosidade">Curiosidade</option>
                    </select>
                  </div>

                  {/* Título do Info Box */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título <span className="text-gray-400 text-xs">(opcional)</span>
                    </label>
                    <Input
                      value={conteudoTemp.tituloInfoBox || ''}
                      onChange={(e) =>
                        setConteudoTemp({
                          ...conteudoTemp,
                          tituloInfoBox: e.target.value,
                        })
                      }
                      placeholder="Digite o título do Info Box (opcional)..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Se deixar em branco, será usado o tipo como título
                    </p>
                  </div>

                  {/* Texto do Corpo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Texto do Corpo <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={conteudoTemp.conteudo}
                      onChange={(e) =>
                        setConteudoTemp({
                          ...conteudoTemp,
                          conteudo: e.target.value,
                        })
                      }
                      placeholder="Digite o texto do corpo do Info Box..."
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={8}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conteúdo <span className="text-red-500">*</span>
                  </label>
                  {conteudoTemp.tipo === 'paragrafo' ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Largura da coluna
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setConteudoTemp({ ...conteudoTemp, colunas: 12 })}
                            className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                              (conteudoTemp.colunas ?? 12) === 12
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                                : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400'
                            }`}
                          >
                            Largura total
                          </button>
                          <button
                            type="button"
                            onClick={() => setConteudoTemp({ ...conteudoTemp, colunas: 6 })}
                            className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                              conteudoTemp.colunas === 6
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                                : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400'
                            }`}
                          >
                            Meia largura
                          </button>
                        </div>
                      </div>
                      <RichTextEditor
                        value={conteudoTemp.conteudo}
                        onChange={(html) => setConteudoTemp({ ...conteudoTemp, conteudo: html })}
                        placeholder="Digite o parágrafo..."
                        autoFocus
                      />
                    </div>
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
                        conteudoTemp.tipo === 'titulo' ? 'título' : 'subtítulo'
                      }...`}
                    />
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeAdicionarConteudoModal}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  shouldCloseModal.current = true
                  setIsSavingConteudo(true)
                  handleSalvarConteudo()
                }}
                className="bg-blue-600 hover:bg-blue-700 min-w-[100px]"
                disabled={
                  isSavingConteudo ||
                  (conteudoTemp.tipo === 'accordion'
                    ? !conteudoTemp.items ||
                      conteudoTemp.items.length === 0 ||
                      conteudoTemp.items.some(
                        (item) => !item.titulo.trim() || !item.conteudo.trim()
                      )
                    : conteudoTemp.tipo === 'flipcard'
                      ? !conteudoTemp.tipoFrente ||
                        !conteudoTemp.conteudoVerso?.trim() ||
                        (conteudoTemp.tipoFrente === 'imagem' &&
                          !conteudoTemp.imagemFrente?.trim()) ||
                        (conteudoTemp.tipoFrente === 'imagem-titulo' &&
                          (!conteudoTemp.imagemFrente?.trim() ||
                            !conteudoTemp.tituloFrente?.trim())) ||
                        (conteudoTemp.tipoFrente === 'titulo' && !conteudoTemp.tituloFrente?.trim())
                      : conteudoTemp.tipo === 'lista'
                        ? !conteudoTemp.itensLista ||
                          conteudoTemp.itensLista.length === 0 ||
                          conteudoTemp.itensLista.some((item) => !item.texto.trim())
                        : conteudoTemp.tipo === 'quiz'
                          ? !conteudoTemp.quizData ||
                            !conteudoTemp.quizData.questions ||
                            conteudoTemp.quizData.questions.length === 0 ||
                            conteudoTemp.quizData.questions.some((q) => !q.pergunta.trim()) ||
                            conteudoTemp.quizData.questions.some(
                              (q) => !q.opcoes || q.opcoes.length !== 5
                            ) ||
                            conteudoTemp.quizData.questions.some((q) =>
                              q.opcoes.some((opcao) => !opcao.texto.trim())
                            ) ||
                            conteudoTemp.quizData.questions.some(
                              (q) => q.opcoes.filter((opcao) => opcao.isCorrect).length !== 1
                            ) ||
                            conteudoTemp.quizData.questions.some((q) =>
                              q.opcoes.some((opcao) => !opcao.feedback.trim())
                            )
                          : conteudoTemp.tipo === 'info-box'
                            ? !conteudoTemp.tipoInfoBox || !conteudoTemp.conteudo.trim()
                            : !conteudoTemp.conteudo.trim()) ||
                  (conteudoTemp.tipo === 'imagem' &&
                    (!conteudoTemp.tamanho || !conteudoTemp.legenda || !conteudoTemp.fonte))
                }
              >
                {isSavingConteudo ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
                  </span>
                ) : (
                  'Adicionar'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal para adicionar unidade */}
        <Dialog open={adicionarUnidadeModal} onOpenChange={() => setAdicionarUnidadeModal(false)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-600" />
                Adicionar Nova Unidade
              </DialogTitle>
              <DialogDescription>Crie uma nova unidade para o curso</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título da Unidade <span className="text-red-500">*</span>
                </label>
                <Input
                  value={novaUnidade}
                  onChange={(e) => setNovaUnidade(e.target.value)}
                  placeholder="Título da unidade"
                  onKeyDown={(e) => e.key === 'Enter' && handleAdicionarUnidade()}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição da Unidade <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={novaUnidadeDescricao}
                  onChange={(e) => setNovaUnidadeDescricao(e.target.value)}
                  placeholder="Descreva o que os alunos aprenderão nesta unidade..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeAdicionarUnidadeModal}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  handleAdicionarUnidade()
                  closeAdicionarUnidadeModal()
                }}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!novaUnidade.trim() || !novaUnidadeDescricao.trim()}
              >
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Drawer para editar unidade */}
        <Sheet
          open={editarUnidadeModal && !!unidadeParaEditar}
          onOpenChange={() => setEditarUnidadeModal(false)}
        >
          <SheetContent>
            <SheetHeader>
              <SheetTitle className="flex items-center">
                <Edit className="h-5 w-5 text-blue-600" />
                Editar Unidade
              </SheetTitle>
            </SheetHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título da Unidade <span className="text-red-500">*</span>
                </label>
                <Input
                  value={tituloUnidadeEditando}
                  onChange={(e) => setTituloUnidadeEditando(e.target.value)}
                  placeholder="Digite o título da unidade..."
                  onKeyDown={(e) => e.key === 'Enter' && handleSalvarEdicaoUnidade()}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descrição da Unidade <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={descricaoUnidadeEditando}
                  onChange={(e) => setDescricaoUnidadeEditando(e.target.value)}
                  placeholder="Descreva o que os alunos aprenderão nesta unidade..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={8}
                  required
                />
              </div>
            </div>
            <SheetFooter>
              <Button variant="outline" onClick={closeEditarUnidadeModal}>
                Cancelar
              </Button>
              <Button
                onClick={handleSalvarEdicaoUnidade}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!tituloUnidadeEditando.trim() || !descricaoUnidadeEditando.trim()}
              >
                Salvar
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Modal de confirmação para deletar conteúdo */}
        <Dialog
          open={confirmarDeletarConteudo && !!conteudoParaDeletar}
          onOpenChange={() => setConfirmarDeletarConteudo(false)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-600" />
                Confirmar Exclusão
              </DialogTitle>
              <DialogDescription>
                Tem certeza que deseja deletar este conteúdo? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={closeConfirmarDeletarConteudoModal}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (conteudoParaDeletar) {
                    setIsDeletingConteudo(true)
                    shouldCloseDeleteModal.current = true
                    deletarConteudo(conteudoParaDeletar.unidadeId, conteudoParaDeletar.conteudoId)
                  }
                }}
                className="bg-red-600 hover:bg-red-700 min-w-[90px]"
                disabled={isDeletingConteudo}
              >
                {isDeletingConteudo ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Excluindo...
                  </span>
                ) : (
                  'Excluir'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal para editar conteúdo */}
        <Dialog
          open={!!editandoConteudo && !!editandoConteudo.tipo}
          onOpenChange={closeEditarConteudoModal}
        >
          {editandoConteudo && (
            <DialogContent
              className={`${editandoConteudo.tipo === 'quiz' ? 'sm:max-w-4xl max-h-[90vh] overflow-y-auto' : 'sm:max-w-2xl max-h-[90vh] overflow-y-auto'}`}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {editandoConteudo.tipo === 'titulo' ? (
                    <Heading2 className="h-5 w-5 text-blue-600" />
                  ) : editandoConteudo.tipo === 'subtitulo' ? (
                    <Heading3 className="h-5 w-5 text-blue-600" />
                  ) : editandoConteudo.tipo === 'imagem' ? (
                    <>
                      {/* eslint-disable-next-line jsx-a11y/alt-text */}
                      <Image className="h-5 w-5 text-blue-600" />
                    </>
                  ) : editandoConteudo.tipo === 'accordion' ? (
                    <ChevronDown className="h-5 w-5 text-blue-600" />
                  ) : editandoConteudo.tipo === 'flipcard' ? (
                    <RotateCcw className="h-5 w-5 text-blue-600" />
                  ) : editandoConteudo.tipo === 'lista' ? (
                    <List className="h-5 w-5 text-blue-600" />
                  ) : editandoConteudo.tipo === 'quiz' ? (
                    <HelpCircle className="h-5 w-5 text-blue-600" />
                  ) : editandoConteudo.tipo === 'info-box' ? (
                    <AlertTriangle className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Type className="h-5 w-5 text-blue-600" />
                  )}
                  Editar{' '}
                  {editandoConteudo.tipo === 'titulo'
                    ? 'Título'
                    : editandoConteudo.tipo === 'subtitulo'
                      ? 'Subtítulo'
                      : editandoConteudo.tipo === 'imagem'
                        ? 'Imagem'
                        : editandoConteudo.tipo === 'accordion'
                          ? 'Accordion'
                          : editandoConteudo.tipo === 'flipcard'
                            ? 'FlipCard'
                            : editandoConteudo.tipo === 'lista'
                              ? 'Lista'
                              : editandoConteudo.tipo === 'quiz'
                                ? 'Quiz'
                                : editandoConteudo.tipo === 'info-box'
                                  ? 'Info Box'
                                  : 'Parágrafo'}
                </DialogTitle>
                <DialogDescription>Atualize o conteúdo abaixo</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {editandoConteudo?.tipo === 'quiz' ? (
                  <div className="space-y-6">
                    {/* Botão Adicionar Pergunta */}
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700">
                        Perguntas do Quiz <span className="text-red-500">*</span>
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!editandoConteudo.quizData) {
                            setEditandoConteudo({
                              ...editandoConteudo,
                              quizData: {
                                questions: [
                                  {
                                    id: `question-${Date.now()}`,
                                    pergunta: '',
                                    dica: '',
                                    opcoes: Array.from({ length: 5 }, (_, i) => ({
                                      id: `opcao-${Date.now()}-${i}`,
                                      texto: '',
                                      isCorrect: i === 0,
                                      feedback: '',
                                    })),
                                  },
                                ],
                              },
                            })
                            return
                          }
                          const novaPergunta: QuizQuestion = {
                            id: `question-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                            pergunta: '',
                            dica: '',
                            opcoes: Array.from({ length: 5 }, (_, i) => ({
                              id: `opcao-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 9)}`,
                              texto: '',
                              isCorrect: i === 0,
                              feedback: '',
                            })),
                          }
                          setEditandoConteudo({
                            ...editandoConteudo,
                            quizData: {
                              ...editandoConteudo.quizData,
                              questions: [...editandoConteudo.quizData.questions, novaPergunta],
                            },
                          })
                        }}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Pergunta
                      </Button>
                    </div>

                    {/* Lista de Perguntas */}
                    {editandoConteudo.quizData?.questions &&
                    editandoConteudo.quizData.questions.length > 0 ? (
                      <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                        {editandoConteudo.quizData.questions.map((question, questionIndex) => (
                          <Card
                            key={question.id}
                            className="p-6 border-2 border-blue-200 bg-blue-50/30"
                          >
                            {/* Cabeçalho da Pergunta */}
                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-blue-300">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                                  {questionIndex + 1}
                                </div>
                                <span className="text-sm font-semibold text-gray-700">
                                  Pergunta {questionIndex + 1}
                                </span>
                              </div>
                              {editandoConteudo.quizData &&
                                editandoConteudo.quizData.questions.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      if (
                                        editandoConteudo.quizData &&
                                        editandoConteudo.quizData.questions.length <= 1
                                      ) {
                                        alert('O quiz deve ter pelo menos uma pergunta.')
                                        return
                                      }
                                      setEditandoConteudo({
                                        ...editandoConteudo,
                                        quizData: editandoConteudo.quizData
                                          ? {
                                              ...editandoConteudo.quizData,
                                              questions: editandoConteudo.quizData.questions.filter(
                                                (q) => q.id !== question.id
                                              ),
                                            }
                                          : undefined,
                                      })
                                    }}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                            </div>

                            <div className="space-y-6">
                              {/* Texto da Pergunta */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Pergunta <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                  value={question.pergunta}
                                  onChange={(e) => {
                                    const novasQuestions = editandoConteudo.quizData?.questions.map(
                                      (q) =>
                                        q.id === question.id
                                          ? { ...q, pergunta: e.target.value }
                                          : q
                                    )
                                    setEditandoConteudo({
                                      ...editandoConteudo,
                                      quizData: editandoConteudo.quizData
                                        ? {
                                            ...editandoConteudo.quizData,
                                            questions: novasQuestions || [],
                                          }
                                        : undefined,
                                    })
                                  }}
                                  placeholder="Digite a pergunta do quiz..."
                                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  rows={3}
                                />
                              </div>

                              {/* Dica (opcional) */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Dica <span className="text-gray-400 text-xs">(opcional)</span>
                                </label>
                                <textarea
                                  value={question.dica || ''}
                                  onChange={(e) => {
                                    const novasQuestions = editandoConteudo.quizData?.questions.map(
                                      (q) =>
                                        q.id === question.id ? { ...q, dica: e.target.value } : q
                                    )
                                    setEditandoConteudo({
                                      ...editandoConteudo,
                                      quizData: editandoConteudo.quizData
                                        ? {
                                            ...editandoConteudo.quizData,
                                            questions: novasQuestions || [],
                                          }
                                        : undefined,
                                    })
                                  }}
                                  placeholder="Digite uma dica para o aluno..."
                                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  rows={2}
                                />
                              </div>

                              {/* Opções de Resposta */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                  Opções de Resposta <span className="text-red-500">*</span>
                                  <span className="text-xs text-gray-500 font-normal ml-2">
                                    (Marque exatamente uma resposta correta)
                                  </span>
                                </label>
                                <div className="space-y-4">
                                  {question.opcoes.map((opcao, index) => (
                                    <Card
                                      key={opcao.id}
                                      className={`p-4 border-2 ${
                                        opcao.isCorrect
                                          ? 'border-green-500 bg-green-50 dark:bg-green-900/30 dark:border-green-600'
                                          : 'border-gray-200 dark:border-gray-700'
                                      }`}
                                    >
                                      <div className="flex items-start gap-4">
                                        {/* Label da Opção */}
                                        <div className="shrink-0">
                                          <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                                              opcao.isCorrect
                                                ? 'bg-green-500 text-white'
                                                : 'bg-blue-500 text-white'
                                            }`}
                                          >
                                            {String.fromCharCode(65 + index)}
                                          </div>
                                        </div>

                                        {/* Conteúdo da Opção */}
                                        <div className="flex-1 space-y-3">
                                          {/* Texto da Opção */}
                                          <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                              Texto da Opção <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                              value={opcao.texto}
                                              onChange={(e) => {
                                                const novasQuestions =
                                                  editandoConteudo.quizData?.questions.map((q) =>
                                                    q.id === question.id
                                                      ? {
                                                          ...q,
                                                          opcoes: q.opcoes.map((opt) =>
                                                            opt.id === opcao.id
                                                              ? { ...opt, texto: e.target.value }
                                                              : opt
                                                          ),
                                                        }
                                                      : q
                                                  )
                                                setEditandoConteudo({
                                                  ...editandoConteudo,
                                                  quizData: editandoConteudo.quizData
                                                    ? {
                                                        ...editandoConteudo.quizData,
                                                        questions: novasQuestions || [],
                                                      }
                                                    : undefined,
                                                })
                                              }}
                                              placeholder={`Digite o texto da opção ${String.fromCharCode(65 + index)}...`}
                                              className="text-sm"
                                            />
                                          </div>

                                          {/* Feedback da Opção */}
                                          <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                              Feedback <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                              value={opcao.feedback}
                                              onChange={(e) => {
                                                const novasQuestions =
                                                  editandoConteudo.quizData?.questions.map((q) =>
                                                    q.id === question.id
                                                      ? {
                                                          ...q,
                                                          opcoes: q.opcoes.map((opt) =>
                                                            opt.id === opcao.id
                                                              ? { ...opt, feedback: e.target.value }
                                                              : opt
                                                          ),
                                                        }
                                                      : q
                                                  )
                                                setEditandoConteudo({
                                                  ...editandoConteudo,
                                                  quizData: editandoConteudo.quizData
                                                    ? {
                                                        ...editandoConteudo.quizData,
                                                        questions: novasQuestions || [],
                                                      }
                                                    : undefined,
                                                })
                                              }}
                                              placeholder="Digite o feedback que aparecerá quando o aluno escolher esta opção..."
                                              className="w-full p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                              rows={2}
                                            />
                                          </div>

                                          {/* Radio para Marcar como Correta */}
                                          <div className="flex items-center gap-2">
                                            <input
                                              type="radio"
                                              name={`edit-correct-${question.id}`}
                                              checked={opcao.isCorrect}
                                              onChange={() => {
                                                const novasQuestions =
                                                  editandoConteudo.quizData?.questions.map((q) =>
                                                    q.id === question.id
                                                      ? {
                                                          ...q,
                                                          opcoes: q.opcoes.map((opt) => ({
                                                            ...opt,
                                                            isCorrect: opt.id === opcao.id,
                                                          })),
                                                        }
                                                      : q
                                                  )
                                                setEditandoConteudo({
                                                  ...editandoConteudo,
                                                  quizData: editandoConteudo.quizData
                                                    ? {
                                                        ...editandoConteudo.quizData,
                                                        questions: novasQuestions || [],
                                                      }
                                                    : undefined,
                                                })
                                              }}
                                              className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                                              id={`edit-correct-${question.id}-${opcao.id}`}
                                            />
                                            <label
                                              htmlFor={`edit-correct-${question.id}-${opcao.id}`}
                                              className="text-sm font-medium text-gray-700 cursor-pointer"
                                            >
                                              Marcar como resposta correta
                                            </label>
                                          </div>
                                        </div>
                                      </div>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 text-sm border-2 border-dashed border-gray-300 rounded-lg">
                        <p>Nenhuma pergunta adicionada ainda.</p>
                        <p className="text-xs mt-1">
                          Clique em &quot;Adicionar Pergunta&quot; para começar.
                        </p>
                      </div>
                    )}
                  </div>
                ) : editandoConteudo?.tipo === 'imagem' ? (
                  <div className="space-y-4">
                    {/* Upload ou URL */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Imagem <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-3">
                        {/* Upload de Arquivo */}
                        <div>
                          <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors bg-gray-50 dark:bg-gray-800">
                            {isUploadingImage ? (
                              <div className="flex flex-col items-center gap-2">
                                <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  Enviando...
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2">
                                <Upload className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  Clique para fazer upload
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  ou arraste a imagem aqui
                                </span>
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  JPG, PNG, GIF, WEBP, SVG (máx. 10MB)
                                </span>
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  handleUploadImage(file, true)
                                }
                              }}
                              disabled={isUploadingImage}
                            />
                          </label>
                        </div>

                        {/* Divisor */}
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">
                              ou
                            </span>
                          </div>
                        </div>

                        {/* Input de URL */}
                        <div>
                          <Input
                            value={editandoConteudo.conteudo}
                            onChange={(e) => {
                              setEditandoConteudo({
                                ...editandoConteudo,
                                conteudo: e.target.value,
                              })
                              // Atualizar preview se for URL válida
                              if (e.target.value.startsWith('http')) {
                                setImagePreviewUrl(e.target.value)
                              } else {
                                setImagePreviewUrl(null)
                              }
                            }}
                            placeholder="Cole a URL da imagem..."
                          />
                        </div>

                        {/* Preview da Imagem */}
                        {(imagePreviewUrl || editandoConteudo.conteudo) && (
                          <div className="mt-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imagePreviewUrl || editandoConteudo.conteudo}
                              alt="Preview"
                              className="h-auto rounded-lg border border-gray-300 max-h-40 object-contain bg-gray-50 mx-auto"
                              onError={() => setImagePreviewUrl(null)}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tamanho da Imagem <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={editandoConteudo.tamanho || ''}
                        onChange={(e) =>
                          setEditandoConteudo({
                            ...editandoConteudo,
                            tamanho: e.target.value as 'pequena' | 'media' | 'grande',
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Legenda <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={editandoConteudo.legenda || ''}
                        onChange={(e) =>
                          setEditandoConteudo({
                            ...editandoConteudo,
                            legenda: e.target.value,
                          })
                        }
                        placeholder="Digite a legenda da imagem..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fonte <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={editandoConteudo.fonte || ''}
                        onChange={(e) =>
                          setEditandoConteudo({
                            ...editandoConteudo,
                            fonte: e.target.value,
                          })
                        }
                        placeholder="Digite a fonte da imagem..."
                      />
                    </div>
                  </div>
                ) : editandoConteudo?.tipo === 'accordion' ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700">
                        Itens do Accordion <span className="text-red-500">*</span>
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (editandoConteudo) {
                            const novoItem = {
                              id: `accordion-item-${Date.now()}-${Math.random()
                                .toString(36)
                                .substring(2, 9)}`,
                              titulo: '',
                              conteudo: '',
                            }
                            setEditandoConteudo({
                              ...editandoConteudo,
                              items: [...(editandoConteudo.items || []), novoItem],
                            })
                          }
                        }}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Item
                      </Button>
                    </div>

                    {editandoConteudo.items && editandoConteudo.items.length > 0 ? (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {editandoConteudo.items.map((item, index) => (
                          <Card key={item.id} className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-semibold text-gray-700">
                                Item {index + 1}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (editandoConteudo) {
                                    setEditandoConteudo({
                                      ...editandoConteudo,
                                      items:
                                        editandoConteudo.items?.filter((i) => i.id !== item.id) ||
                                        [],
                                    })
                                  }
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Título <span className="text-red-500">*</span>
                                </label>
                                <Input
                                  value={item.titulo}
                                  onChange={(e) => {
                                    if (editandoConteudo) {
                                      setEditandoConteudo({
                                        ...editandoConteudo,
                                        items:
                                          editandoConteudo.items?.map((i) =>
                                            i.id === item.id ? { ...i, titulo: e.target.value } : i
                                          ) || [],
                                      })
                                    }
                                  }}
                                  placeholder="Título do item..."
                                  className="text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Conteúdo <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                  value={item.conteudo}
                                  onChange={(e) => {
                                    if (editandoConteudo) {
                                      setEditandoConteudo({
                                        ...editandoConteudo,
                                        items:
                                          editandoConteudo.items?.map((i) =>
                                            i.id === item.id
                                              ? { ...i, conteudo: e.target.value }
                                              : i
                                          ) || [],
                                      })
                                    }
                                  }}
                                  placeholder="Conteúdo do item..."
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                                  rows={3}
                                />
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 text-sm border-2 border-dashed border-gray-300 rounded-lg">
                        <p>Nenhum item adicionado ainda.</p>
                        <p className="text-xs mt-1">
                          Clique em &quot;Adicionar Item&quot; para começar.
                        </p>
                      </div>
                    )}
                  </div>
                ) : editandoConteudo?.tipo === 'flipcard' ? (
                  <div className="space-y-4">
                    {/* Tipo de Frente */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Frente <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={editandoConteudo.tipoFrente || 'titulo'}
                        onChange={(e) =>
                          editandoConteudo &&
                          setEditandoConteudo({
                            ...editandoConteudo,
                            tipoFrente: e.target.value as 'imagem' | 'imagem-titulo' | 'titulo',
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="imagem">Apenas Imagem</option>
                        <option value="imagem-titulo">Imagem com Título no Rodapé</option>
                        <option value="titulo">Apenas Título Centralizado</option>
                      </select>
                    </div>

                    {/* Imagem (se necessário) */}
                    {(editandoConteudo.tipoFrente === 'imagem' ||
                      editandoConteudo.tipoFrente === 'imagem-titulo') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Imagem da Frente <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-3">
                          {/* Upload de Arquivo */}
                          <div>
                            <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors bg-gray-50">
                              {isUploadingImage ? (
                                <div className="flex flex-col items-center gap-2">
                                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                                  <span className="text-sm text-gray-600">Enviando...</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-2">
                                  <Upload className="h-6 w-6 text-gray-400" />
                                  <span className="text-sm text-gray-600">
                                    Clique para fazer upload
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    ou arraste a imagem aqui
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    JPG, PNG, GIF, WEBP, SVG (máx. 10MB)
                                  </span>
                                </div>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    handleUploadImage(file, true, true)
                                  }
                                }}
                                disabled={isUploadingImage}
                              />
                            </label>
                          </div>

                          {/* Divisor */}
                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                              <span className="bg-white px-2 text-gray-500">ou</span>
                            </div>
                          </div>

                          {/* Input de URL */}
                          <Input
                            value={editandoConteudo.imagemFrente || ''}
                            onChange={(e) =>
                              editandoConteudo &&
                              setEditandoConteudo({
                                ...editandoConteudo,
                                imagemFrente: e.target.value,
                              })
                            }
                            placeholder="Cole a URL da imagem..."
                          />

                          {/* Preview da Imagem */}
                          {(imagePreviewUrl || editandoConteudo.imagemFrente) && (
                            <div className="mt-3">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={imagePreviewUrl || editandoConteudo.imagemFrente}
                                alt="Preview"
                                className="h-auto rounded-lg border border-gray-300 max-h-40 object-contain bg-gray-50 mx-auto"
                                onError={() => setImagePreviewUrl(null)}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Título (se necessário) */}
                    {(editandoConteudo.tipoFrente === 'imagem-titulo' ||
                      editandoConteudo.tipoFrente === 'titulo') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Título da Frente <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={editandoConteudo.tituloFrente || ''}
                          onChange={(e) =>
                            editandoConteudo &&
                            setEditandoConteudo({
                              ...editandoConteudo,
                              tituloFrente: e.target.value,
                            })
                          }
                          placeholder="Digite o título da frente do card..."
                        />
                      </div>
                    )}

                    {/* Conteúdo do Verso */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Conteúdo do Verso <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={editandoConteudo.conteudoVerso || ''}
                        onChange={(e) =>
                          editandoConteudo &&
                          setEditandoConteudo({
                            ...editandoConteudo,
                            conteudoVerso: e.target.value,
                          })
                        }
                        placeholder="Digite o conteúdo do verso do card..."
                        className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={8}
                      />
                    </div>

                    {/* Altura do Card */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Altura do Card (opcional)
                      </label>
                      <Input
                        value={editandoConteudo.alturaCard || '300px'}
                        onChange={(e) =>
                          editandoConteudo &&
                          setEditandoConteudo({
                            ...editandoConteudo,
                            alturaCard: e.target.value,
                          })
                        }
                        placeholder="Ex: 300px, 400px, 50vh"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Use valores como &quot;300px&quot;, &quot;400px&quot; ou &quot;50vh&quot;
                        (viewport height)
                      </p>
                    </div>
                  </div>
                ) : editandoConteudo?.tipo === 'lista' ? (
                  <div className="space-y-4">
                    {/* Tipo de Lista */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Lista <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={editandoConteudo.tipoLista || 'nao-ordenada'}
                        onChange={(e) =>
                          editandoConteudo &&
                          setEditandoConteudo({
                            ...editandoConteudo,
                            tipoLista: e.target.value as 'ordenada' | 'nao-ordenada' | 'check',
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="nao-ordenada">Não Ordenada (Bullets)</option>
                        <option value="ordenada">Ordenada (Numerada)</option>
                        <option value="check">Com Ícone de Check</option>
                      </select>
                    </div>

                    {/* Itens da Lista */}
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700">
                        Itens da Lista <span className="text-red-500">*</span>
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (editandoConteudo) {
                            const novoItem = {
                              id: `lista-item-${Date.now()}-${Math.random()
                                .toString(36)
                                .substring(2, 9)}`,
                              texto: '',
                            }
                            setEditandoConteudo({
                              ...editandoConteudo,
                              itensLista: [...(editandoConteudo.itensLista || []), novoItem],
                            })
                          }
                        }}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Item
                      </Button>
                    </div>

                    {editandoConteudo.itensLista && editandoConteudo.itensLista.length > 0 ? (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {editandoConteudo.itensLista.map((item, index) => (
                          <Card key={item.id} className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-semibold text-gray-700">
                                Item {index + 1}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (editandoConteudo) {
                                    setEditandoConteudo({
                                      ...editandoConteudo,
                                      itensLista:
                                        editandoConteudo.itensLista?.filter(
                                          (i) => i.id !== item.id
                                        ) || [],
                                    })
                                  }
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Texto do Item <span className="text-red-500">*</span>
                              </label>
                              <Input
                                value={item.texto}
                                onChange={(e) => {
                                  if (editandoConteudo) {
                                    setEditandoConteudo({
                                      ...editandoConteudo,
                                      itensLista:
                                        editandoConteudo.itensLista?.map((i) =>
                                          i.id === item.id ? { ...i, texto: e.target.value } : i
                                        ) || [],
                                    })
                                  }
                                }}
                                placeholder="Digite o texto do item..."
                                className="text-sm"
                              />
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 text-sm border-2 border-dashed border-gray-300 rounded-lg">
                        <p>Nenhum item adicionado ainda.</p>
                        <p className="text-xs mt-1">
                          Clique em &quot;Adicionar Item&quot; para começar.
                        </p>
                      </div>
                    )}
                  </div>
                ) : editandoConteudo?.tipo === 'info-box' ? (
                  <div className="space-y-4">
                    {/* Tipo do Info Box */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo do Info Box <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={editandoConteudo.tipoInfoBox || 'info'}
                        onChange={(e) =>
                          editandoConteudo &&
                          setEditandoConteudo({
                            ...editandoConteudo,
                            tipoInfoBox: e.target.value as
                              | 'atencao'
                              | 'saiba_mais'
                              | 'info'
                              | 'curiosidade',
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="atencao">Atenção</option>
                        <option value="saiba_mais">Saiba mais</option>
                        <option value="info">Informação</option>
                        <option value="curiosidade">Curiosidade</option>
                      </select>
                    </div>

                    {/* Título do Info Box */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Título <span className="text-gray-400 text-xs">(opcional)</span>
                      </label>
                      <Input
                        value={editandoConteudo.tituloInfoBox || ''}
                        onChange={(e) =>
                          editandoConteudo &&
                          setEditandoConteudo({
                            ...editandoConteudo,
                            tituloInfoBox: e.target.value,
                          })
                        }
                        placeholder="Digite o título do Info Box (opcional)..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Se deixar em branco, será usado o tipo como título
                      </p>
                    </div>

                    {/* Texto do Corpo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Texto do Corpo <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={editandoConteudo.conteudo || ''}
                        onChange={(e) =>
                          editandoConteudo &&
                          setEditandoConteudo({
                            ...editandoConteudo,
                            conteudo: e.target.value,
                          })
                        }
                        placeholder="Digite o texto do corpo do Info Box..."
                        className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={8}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Conteúdo <span className="text-red-500">*</span>
                    </label>
                    {editandoConteudo?.tipo === 'paragrafo' ? (
                      <RichTextEditor
                        key={editandoConteudo.conteudoId}
                        value={editandoConteudo.conteudo}
                        onChange={(html) =>
                          editandoConteudo &&
                          setEditandoConteudo({ ...editandoConteudo, conteudo: html })
                        }
                        placeholder="Digite o parágrafo..."
                      />
                    ) : (
                      <Input
                        value={editandoConteudo?.conteudo || ''}
                        onChange={(e) =>
                          editandoConteudo &&
                          setEditandoConteudo({
                            ...editandoConteudo,
                            conteudo: e.target.value,
                          })
                        }
                        placeholder={`Digite o ${
                          editandoConteudo?.tipo === 'titulo' ? 'título' : 'subtítulo'
                        }...`}
                      />
                    )}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeEditarConteudoModal}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    if (editandoConteudo) {
                      handleEditarConteudo(
                        editandoConteudo.unidadeId,
                        editandoConteudo.conteudoId,
                        editandoConteudo.tipo,
                        editandoConteudo.conteudo || '',
                        editandoConteudo.tamanho,
                        editandoConteudo.legenda,
                        editandoConteudo.fonte,
                        editandoConteudo.corTexto,
                        editandoConteudo.alinhamento,
                        editandoConteudo.colunas,
                        editandoConteudo.items,
                        editandoConteudo.tipoFrente,
                        editandoConteudo.imagemFrente,
                        editandoConteudo.tituloFrente,
                        editandoConteudo.conteudoVerso,
                        editandoConteudo.alturaCard,
                        editandoConteudo.itensLista,
                        editandoConteudo.tipoLista,
                        editandoConteudo.quizData,
                        editandoConteudo.tipoInfoBox,
                        editandoConteudo.tituloInfoBox
                      )
                      closeEditarConteudoModal()
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={
                    (editandoConteudo?.tipo === 'accordion'
                      ? !editandoConteudo.items ||
                        editandoConteudo.items.length === 0 ||
                        editandoConteudo.items.some(
                          (item) => !item.titulo.trim() || !item.conteudo.trim()
                        )
                      : editandoConteudo?.tipo === 'flipcard'
                        ? !editandoConteudo.tipoFrente ||
                          !editandoConteudo.conteudoVerso?.trim() ||
                          (editandoConteudo.tipoFrente === 'imagem' &&
                            !editandoConteudo.imagemFrente?.trim()) ||
                          (editandoConteudo.tipoFrente === 'imagem-titulo' &&
                            (!editandoConteudo.imagemFrente?.trim() ||
                              !editandoConteudo.tituloFrente?.trim())) ||
                          (editandoConteudo.tipoFrente === 'titulo' &&
                            !editandoConteudo.tituloFrente?.trim())
                        : editandoConteudo?.tipo === 'lista'
                          ? !editandoConteudo.itensLista ||
                            editandoConteudo.itensLista.length === 0 ||
                            editandoConteudo.itensLista.some((item) => !item.texto.trim())
                          : editandoConteudo?.tipo === 'quiz'
                            ? !editandoConteudo.quizData ||
                              !editandoConteudo.quizData.questions ||
                              editandoConteudo.quizData.questions.length === 0 ||
                              editandoConteudo.quizData.questions.some((q) => !q.pergunta.trim()) ||
                              editandoConteudo.quizData.questions.some(
                                (q) => !q.opcoes || q.opcoes.length !== 5
                              ) ||
                              editandoConteudo.quizData.questions.some((q) =>
                                q.opcoes.some((opcao) => !opcao.texto.trim())
                              ) ||
                              editandoConteudo.quizData.questions.some(
                                (q) => q.opcoes.filter((opcao) => opcao.isCorrect).length !== 1
                              ) ||
                              editandoConteudo.quizData.questions.some((q) =>
                                q.opcoes.some((opcao) => !opcao.feedback.trim())
                              )
                            : editandoConteudo?.tipo === 'info-box'
                              ? !editandoConteudo.tipoInfoBox || !editandoConteudo.conteudo?.trim()
                              : !editandoConteudo?.conteudo?.trim()) ||
                    (editandoConteudo?.tipo === 'imagem' &&
                      (!editandoConteudo.tamanho ||
                        !editandoConteudo.legenda ||
                        !editandoConteudo.fonte))
                  }
                >
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>

        {/* Modal de Exportação */}
        <ExportModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          onExportPDF={async (filename) => {
            try {
              await generatePDF(state.cursoAtual!, filename)
              setExportModalOpen(false)
            } catch (error) {
              // Erro já foi tratado no hook, modal permanece aberto
              console.error('Erro ao gerar PDF:', error)
            }
          }}
          onExportSCORM={async (filename) => {
            try {
              console.log('🔄 [Export] Iniciando exportação SCORM...')
              console.log('📦 [Export] Curso atual:', state.cursoAtual)
              console.log('📝 [Export] Filename:', filename)

              if (state.cursoAtual) {
                console.log('✅ [Export] Curso encontrado, chamando generateSCORM...')
                await generateSCORM(state.cursoAtual, filename)
                console.log('✅ [Export] generateSCORM concluído')
                setExportModalOpen(false)
              } else {
                console.error('❌ [Export] state.cursoAtual é null/undefined')
                toast.error('Erro: Curso não encontrado')
              }
            } catch (error) {
              // Erro já foi tratado no hook, modal permanece aberto
              console.error('❌ [Export] Erro ao gerar SCORM:', error)
            }
          }}
          courseName={state.cursoAtual?.titulo || 'Curso'}
          courseId={state.cursoAtual?.id}
          isGeneratingPDF={isGeneratingPDF}
          isGeneratingSCORM={isGeneratingSCORM}
        />

        {/* Course Settings Drawer */}
        <CourseSettingsDrawer
          open={settingsDrawerOpen}
          onOpenChange={setSettingsDrawerOpen}
          courseData={{
            titulo: state.cursoAtual.titulo,
            descricao: state.cursoAtual.descricao || '',
            categoria: state.cursoAtual.categoria || undefined,
            cargaHoraria: state.cursoAtual.cargaHoraria,
          }}
          unidades={state.cursoAtual.unidades || []}
          onSave={(courseData, unidades) => {
            if (state.cursoAtual) {
              editarCurso(state.cursoAtual.id, {
                titulo: courseData.titulo,
                descricao: courseData.descricao,
                categoria: courseData.categoria || '',
                cargaHoraria: courseData.cargaHoraria,
              })
              reordenarUnidades(unidades as Unidade[])
            }
          }}
        />

        {/* Manage Units Modal */}
        <ManageUnitsModal
          open={manageUnitsModalOpen}
          onOpenChange={setManageUnitsModalOpen}
          unidades={state.cursoAtual.unidades || []}
        />

        <ContentBlockDrawer
          open={contentDrawerOpen}
          onOpenChange={setContentDrawerOpen}
          mode={contentDrawerMode}
          blockData={contentDrawerBlockData}
          onSave={handleSaveContentFromDrawer}
          onCancel={handleCancelContentDrawer}
          onUploadImage={handleUploadImageForDrawer}
        />
      </div>
    </PageTransition>
  )
}
