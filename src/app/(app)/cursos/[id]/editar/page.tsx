'use client'

// Esta página não deve ser exportada estaticamente (usa context e hooks client-side)
// O Next.js deve ignorar esta página durante build estático
export const dynamic = 'error'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useCourseEditor } from '@/context/CourseEditorContext'
import { useAuth } from '@/context/AuthContext'
import { usePreview } from '@/hooks/usePreview'
import { useTheme } from '@/hooks/useTheme'
import { usePDF } from '@/hooks/usePDF'
import { useSCORM } from '@/hooks/useSCORM'
import { ExportModal } from '@/components/ExportModal'
import { RichTextEditor } from '@/components/RichTextEditor'
import { PageTransition } from '@/components/PageTransition'
import { CollabProvider } from '@/components/collaboration/CollabProvider'
import { CollabAvatars } from '@/components/collaboration/CollabAvatars'
import { CollabCursors } from '@/components/collaboration/CollabCursors'
import { useCollabEvents } from '@/hooks/useCollabEvents'
import { EditableCard } from '@/components/EditableCard'
import { blockRegistry, larguraMaximaImagem } from '@/components/course/blocks'
import { TooltipButton } from '@/components/TooltipButton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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
import { UnitsDropdown } from '@/components/UnitsDropdown'
import { ManageUnitsModal } from '@/components/ManageUnitsModal'
import { SortableBlockWrapper } from '@/components/SortableBlockWrapper'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { QuizContent } from '@/components/QuizContent'
import { InfoBox } from '@/components/InfoBox'
import { BlockThemeProvider } from '@/components/course/blocks'
import { resolveLayout } from '@/components/course/layouts'
import { QuizData, QuizQuestion, Unit, Block } from '@/types/course'
import {
  BLOCK_CATALOG,
  BLOCK_CATEGORIES,
  BLOCK_TYPES,
  cardsFlipcard,
  createEmptyBlock,
} from '@/lib/blocks'
import { uploadFile } from '@/lib/client-upload'

/** Rótulo curto do bloco para o toast do outro usuário */
const PENDING_BLOCK_ID = '__bloco-pendente__'

function blockTitle(block: { titulo?: string; conteudo?: string; tipo?: string }) {
  return block.titulo?.trim() || block.conteudo?.trim().slice(0, 40) || block.tipo
}

function CourseEditor() {
  const {
    state,
    addUnit,
    updateUnit,
    deleteUnit,
    reorderUnits,
    addBlock,
    updateBlock,
    deleteBlock,
    updateCourse,
    selectCourse,
  } = useCourseEditor()
  const { user } = useAuth()
  const editorBlockTheme = resolveLayout(state.currentCourse?.layout).meta.blockTheme
  const { openPreview } = usePreview()
  const { isDarkMode, toggleDarkMode } = useTheme()
  const { generatePDF, isGenerating: isGeneratingPDF } = usePDF()
  const { generateSCORM, isGeneratingSCORM } = useSCORM()
  const router = useRouter()
  const params = useParams()
  const collabContainerRef = useRef<HTMLDivElement | null>(null)
  const { avisar: notify } = useCollabEvents()
  const authorName = user?.nome ?? 'Alguém'

  const [newUnit, setNewUnit] = useState('')
  const [newUnitDescription, setNewUnitDescription] = useState('')
  const [editedTitle, setEditedTitle] = useState('')
  const [editedDescription, setEditedDescription] = useState('')
  const [editingUnitDescription, setEditingUnitDescription] = useState('')
  const [editingBlock, setEditingBlock] = useState<{
    unitId: string
    blockId: string
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
  const [tempBlock, setTempBlock] = useState({
    ...createEmptyBlock('paragrafo'),
    unitId: '',
  })
  const [addUnitModal, setAddUnitModal] = useState(false)
  const [editUnitModal, setEditUnitModal] = useState(false)
  const [unitToEdit, setUnitToEdit] = useState<string | null>(null)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [editingUnitTitle, setEditingUnitTitle] = useState('')
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [isFetchingCourse, setIsFetchingCourse] = useState(false)
  const insertAtIndex = useRef<{ unitId: string; index: number } | null>(null)
  const [pendingBlock, setPendingBlock] = useState<{
    unitId: string
    index: number
    type: Block['tipo']
    columns?: number
  } | null>(null)
  const pendingInsert = useRef<{ unitId: string; targetIndex: number } | null>(null)
  const [isSavingBlock, setIsSavingBlock] = useState(false)
  const [isDeletingBlock, setIsDeletingBlock] = useState(false)
  const shouldCloseModal = useRef(false)
  const shouldCloseDeleteModal = useRef(false)
  const [blockToDelete, setBlockToDelete] = useState<{
    unitId: string
    blockId: string
  } | null>(null)
  const [confirmDeleteBlock, setConfirmDeleteBlock] = useState(false)
  const [editCourseModal, setEditCourseModal] = useState(false)
  const [addBlockModal, setAddBlockModal] = useState(false)

  const [editedWorkload, setEditedWorkload] = useState('')
  const [editedModality, setEditedModality] = useState('')
  const [editedCategory, setEditedCategory] = useState('')
  const [activeUnitIndex, setActiveUnitIndex] = useState(0)
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false)
  const [manageUnitsModalOpen, setManageUnitsModalOpen] = useState(false)

  const [contentDrawerOpen, setContentDrawerOpen] = useState(false)
  const [contentDrawerMode, setContentDrawerMode] = useState<'add' | 'edit'>('add')
  const [contentDrawerBlockData, setContentDrawerBlockData] = useState<Partial<Block> | null>(null)
  const [contentDrawerUnitId, setContentDrawerUnitId] = useState<string>('')

  const courseId = params.id as string

  // Selecionar o curso ao carregar a página (busca do servidor se necessário)
  useEffect(() => {
    if (!courseId || state.loading) return

    const alreadySelected =
      state.currentCourse?.id === courseId || state.currentCourse?.slug === courseId

    if (alreadySelected) {
      setIsFetchingCourse(false)
      return
    }

    setIsFetchingCourse(true)
    selectCourse(courseId)
  }, [courseId, state.loading, state.currentCourse?.id, state.currentCourse?.slug, selectCourse])

  // Atualizar isFetchingCurso quando o curso for carregado
  useEffect(() => {
    if (state.currentCourse?.id === courseId || state.currentCourse?.slug === courseId) {
      setIsFetchingCourse(false)
    }
  }, [state.currentCourse, courseId])

  // Bloquear a edição para quem não tem permissão no curso
  useEffect(() => {
    const course = state.currentCourse
    const isThisCourse = course?.id === courseId || course?.slug === courseId

    if (isThisCourse && course?.permissoes && !course.permissoes.podeEditar) {
      toast.error('Você não tem permissão para editar este curso')
      router.replace(`/cursos/${course.slug || course.id}/preview`)
    }
  }, [state.currentCourse, courseId, router])

  // Atualizar preview da imagem ao editar conteúdo
  useEffect(() => {
    if (editingBlock?.tipo === 'imagem' && editingBlock.conteudo) {
      if (editingBlock.conteudo.startsWith('http')) {
        setImagePreviewUrl(editingBlock.conteudo)
      } else {
        setImagePreviewUrl(null)
      }
    } else if (!editingBlock) {
      setImagePreviewUrl(null)
    }
  }, [editingBlock])

  // Atualizar preview da imagem ao adicionar conteúdo
  useEffect(() => {
    if (tempBlock.tipo === 'imagem' && tempBlock.conteudo) {
      if (tempBlock.conteudo.startsWith('http')) {
        setImagePreviewUrl(tempBlock.conteudo)
      }
    } else if (tempBlock.tipo !== 'imagem') {
      setImagePreviewUrl(null)
    }
  }, [tempBlock.tipo, tempBlock.conteudo])

  useEffect(() => {
    if (editCourseModal && state.currentCourse) {
      setEditedTitle(state.currentCourse.titulo)
      setEditedDescription(state.currentCourse.descricao)
      setEditedWorkload(state.currentCourse.cargaHoraria)
      setEditedModality(state.currentCourse.modalidade)
      setEditedCategory(state.currentCourse.categoria)
    }
  }, [editCourseModal, state.currentCourse])

  // Rolar para o topo ao mudar de unidade
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activeUnitIndex])

  // Reordenar item recém-adicionado para a posição correta após o state atualizar
  useEffect(() => {
    if (pendingInsert.current) {
      const { unitId, targetIndex } = pendingInsert.current
      const unit = state.currentCourse?.unidades?.find((u) => u.id === unitId)
      if (unit) {
        const c = [...(unit.conteudo || [])]
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
          updateUnit(unitId, { conteudo: reord })
          return
        }
      }
    }
    if (shouldCloseModal.current) {
      shouldCloseModal.current = false
      setIsSavingBlock(false)
      toast.success('Conteúdo adicionado')
      notify('adicionou', 'bloco', authorName)
      setTempBlock({
        tipo: 'paragrafo',
        conteudo: '',
        unitId: '',
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
      setIsDeletingBlock(false)
      toast.success('Conteúdo excluído')
      notify('excluiu', 'bloco', authorName)
      setConfirmDeleteBlock(false)
      setBlockToDelete(null)
    }
  }, [state.currentCourse?.unidades, updateUnit])

  const handleBack = () => router.push('/cursos')

  const closeAddUnitModal = () => {
    setAddUnitModal(false)
    setNewUnit('')
    setNewUnitDescription('')
  }

  const openEditUnitModal = (unitId: string) => {
    const unit = state.currentCourse?.unidades?.find((u) => u.id === unitId)
    if (unit) {
      setUnitToEdit(unitId)
      setEditingUnitTitle(unit.titulo)
      setEditingUnitDescription(unit.descricao)
      setEditUnitModal(true)
    }
  }

  const closeEditUnitModal = () => {
    setEditUnitModal(false)
    setUnitToEdit(null)
    setEditingUnitTitle('')
    setEditingUnitDescription('')
  }

  const closeConfirmDeleteBlockModal = () => {
    setConfirmDeleteBlock(false)
    setBlockToDelete(null)
  }

  const closeEditBlockModal = () => {
    setEditingBlock(null)
  }

  const closeAddBlockModal = () => {
    setTempBlock({
      tipo: 'paragrafo',
      conteudo: '',
      unitId: '',
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

  const closeEditCourseModal = () => {
    setEditCourseModal(false)
  }

  const handleSaveCourseEdit = async () => {
    if (state.currentCourse) {
      try {
        await updateCourse(state.currentCourse.id, {
          titulo: editedTitle,
          descricao: editedDescription,
          cargaHoraria: editedWorkload,
          modalidade: editedModality,
          categoria: editedCategory,
        })
      } catch (error) {
        console.error('Erro ao salvar edição do curso:', error)
      }
    }
  }

  const handleAddUnit = () => {
    if (newUnit.trim() && newUnitDescription.trim()) {
      addUnit({
        titulo: newUnit.trim(),
        descricao: newUnitDescription.trim(),
        conteudo: [],
      })
      toast.success('Unidade adicionada')
      notify('adicionou', 'unidade', authorName, newUnit.trim())
      setNewUnit('')
      setNewUnitDescription('')
      setAddUnitModal(false)
    }
  }

  const handleSaveUnitEdit = () => {
    if (unitToEdit && editingUnitTitle.trim() && editingUnitDescription.trim()) {
      updateUnit(unitToEdit, {
        titulo: editingUnitTitle.trim(),
        descricao: editingUnitDescription.trim(),
      })
      toast.success('Unidade atualizada')
      notify('editou', 'unidade', authorName, editingUnitTitle.trim())
      closeEditUnitModal()
    }
  }

  const handleUploadImage = async (
    file: File,
    forEdit: boolean = false,
    forFlipcard: boolean = false
  ) => {
    if (!file) return

    setIsUploadingImage(true)
    setImagePreviewUrl(null)

    try {
      const { url: uploadedUrl, warning } = await uploadFile(file, 'imagem')
      if (warning) toast.warning(warning)
      const data = { url: uploadedUrl }

      // Atualizar URL da imagem no estado correto
      if (forFlipcard) {
        // Para flipcard, atualizar imagemFrente
        if (forEdit && editingBlock) {
          setEditingBlock({
            ...editingBlock,
            imagemFrente: data.url,
          })
        } else {
          setTempBlock({
            ...tempBlock,
            imagemFrente: data.url,
          })
        }
      } else if (forEdit && editingBlock) {
        setEditingBlock({
          ...editingBlock,
          conteudo: data.url,
        })
      } else {
        setTempBlock({
          ...tempBlock,
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

  const handleOpenAddContentDrawer = (unitId: string, index: number) => {
    insertAtIndex.current = { unitId, index }
    setAddBlockModal(true)
  }

  const handleSelectBlockType = (type: Block['tipo'], unitId: string) => {
    setAddBlockModal(false)
    setContentDrawerUnitId(unitId)
    setContentDrawerMode('add')
    setContentDrawerBlockData({ tipo: type })
    setContentDrawerOpen(true)
  }

  const handleOpenEditContentDrawer = (unitId: string, content: Block) => {
    setContentDrawerUnitId(unitId)
    setContentDrawerMode('edit')
    setContentDrawerBlockData(content)
    setContentDrawerOpen(true)
  }

  const handleSaveContentFromDrawer = async (data: Omit<Block, 'id' | 'ordem'>) => {
    console.log('🔍 handleSaveContentFromDrawer - mode:', contentDrawerMode, 'data:', data)
    console.log('🔍 insertAtIndex.current:', insertAtIndex.current)

    if (contentDrawerMode === 'add') {
      if (insertAtIndex.current) {
        const { unitId, index } = insertAtIndex.current
        console.log('🔍 Adicionando conteúdo - unidadeId:', unitId, 'index:', index)

        const unit = state.currentCourse?.unidades?.find((u) => u.id === unitId)
        const contentLength = unit?.conteudo?.length || 0
        console.log('🔍 Tamanho atual do conteúdo:', contentLength)

        setPendingBlock({
          unitId,
          index: Math.min(index, contentLength),
          type: data.tipo,
          columns: data.colunas,
        })

        try {
          await addBlock(unitId, data)
        } finally {
          setPendingBlock(null)
        }

        if (index < contentLength) {
          console.log('🔍 Precisa reordenar - index:', index, '< conteudoLength:', contentLength)
          pendingInsert.current = { unitId, targetIndex: index }
        } else {
          console.log('🔍 NÃO precisa reordenar - adicionar no final')
        }
      }
      toast.success('Conteúdo adicionado')
      notify('adicionou', 'bloco', authorName, blockTitle(data))
    } else {
      if (contentDrawerBlockData?.id) {
        updateBlock(contentDrawerUnitId, contentDrawerBlockData.id, data)
        toast.success('Conteúdo atualizado')
        notify('editou', 'bloco', authorName, blockTitle(data))
      }
    }
    setContentDrawerOpen(false)
  }

  const handleCancelContentDrawer = () => {
    setContentDrawerOpen(false)
    setContentDrawerBlockData(null)
    setContentDrawerUnitId('')
    insertAtIndex.current = null
  }

  const handleSaveBlock = () => {
    if (tempBlock.tipo === 'accordion') {
      // Validar accordion
      if (!tempBlock.items || tempBlock.items.length === 0) {
        alert('Adicione pelo menos um item ao accordion.')
        return
      }
      // Verificar se todos os itens têm título e conteúdo
      const invalidItems = tempBlock.items.some(
        (item) => !item.titulo.trim() || !item.conteudo.trim()
      )
      if (invalidItems) {
        alert('Todos os itens do accordion devem ter título e conteúdo preenchidos.')
        return
      }
    } else if (tempBlock.tipo === 'flipcard') {
      // Validar flipcard
      if (!tempBlock.tipoFrente) {
        alert('Selecione o tipo de frente do flipcard.')
        return
      }
      if (tempBlock.tipoFrente === 'imagem' && !tempBlock.imagemFrente?.trim()) {
        alert('Adicione uma imagem para a frente do flipcard.')
        return
      }
      if (
        tempBlock.tipoFrente === 'imagem-titulo' &&
        (!tempBlock.imagemFrente?.trim() || !tempBlock.tituloFrente?.trim())
      ) {
        alert('Adicione uma imagem e um título para a frente do flipcard.')
        return
      }
      if (tempBlock.tipoFrente === 'titulo' && !tempBlock.tituloFrente?.trim()) {
        alert('Adicione um título para a frente do flipcard.')
        return
      }
      if (!tempBlock.conteudoVerso?.trim()) {
        alert('Adicione o conteúdo do verso do flipcard.')
        return
      }
    } else if (tempBlock.tipo === 'lista') {
      // Validar lista
      if (!tempBlock.itensLista || tempBlock.itensLista.length === 0) {
        alert('Adicione pelo menos um item à lista.')
        return
      }
      if (tempBlock.itensLista.some((item) => !item.texto.trim())) {
        alert('Todos os itens da lista devem ter texto preenchido.')
        return
      }
    } else if (tempBlock.tipo === 'quiz') {
      // Validar quiz
      if (
        !tempBlock.quizData ||
        !tempBlock.quizData.questions ||
        tempBlock.quizData.questions.length === 0
      ) {
        alert('O quiz deve ter pelo menos uma pergunta.')
        return
      }

      // Validar cada pergunta
      for (const question of tempBlock.quizData.questions) {
        if (!question.pergunta.trim()) {
          alert('Todas as perguntas devem ter um texto preenchido.')
          return
        }
        if (!question.opcoes || question.opcoes.length !== 5) {
          alert('Cada pergunta deve ter exatamente 5 opções de resposta.')
          return
        }
        if (question.opcoes.some((option) => !option.texto.trim())) {
          alert('Todas as opções de resposta devem ter texto preenchido.')
          return
        }
        if (question.opcoes.every((option) => !option.isCorrect)) {
          alert('Cada pergunta deve ter exatamente uma resposta correta marcada.')
          return
        }
        const correctCount = question.opcoes.filter((option) => option.isCorrect).length
        if (correctCount !== 1) {
          alert('Cada pergunta deve ter exatamente uma resposta correta.')
          return
        }
        if (question.opcoes.some((option) => !option.feedback.trim())) {
          alert('Todas as opções de resposta devem ter um feedback preenchido.')
          return
        }
      }
    } else if (tempBlock.tipo === 'info-box') {
      // Validar info-box
      if (!tempBlock.tipoInfoBox) {
        alert('Selecione o tipo do Info Box.')
        return
      }
      if (!tempBlock.conteudo.trim()) {
        alert('O texto do corpo do Info Box é obrigatório.')
        return
      }
    } else if (tempBlock.tipo === 'imagem') {
      if (!tempBlock.tamanho || !tempBlock.legenda || !tempBlock.fonte) {
        alert('Por favor, preencha todos os campos obrigatórios para a imagem.')
        return
      }
    } else {
      if (!tempBlock.conteudo.trim()) {
        return
      }
    }

    addBlock(tempBlock.unitId, {
      tipo: tempBlock.tipo,
      conteudo: tempBlock.conteudo || '',
      tamanho: tempBlock.tamanho,
      legenda: tempBlock.legenda,
      fonte: tempBlock.fonte,
      corTexto: tempBlock.corTexto,
      alinhamento: tempBlock.alinhamento,
      colunas: tempBlock.colunas,
      items: tempBlock.items,
      tipoFrente: tempBlock.tipoFrente,
      imagemFrente: tempBlock.imagemFrente,
      tituloFrente: tempBlock.tituloFrente,
      conteudoVerso: tempBlock.conteudoVerso,
      alturaCard: tempBlock.alturaCard,
      itensLista: tempBlock.itensLista,
      tipoLista: tempBlock.tipoLista,
      quizData: tempBlock.quizData,
      tipoInfoBox: tempBlock.tipoInfoBox,
      tituloInfoBox: tempBlock.tituloInfoBox,
    })
    // Se foi solicitada inserção em posição específica, registrar para reordenar após state atualizar
    if (insertAtIndex.current && insertAtIndex.current.unitId === tempBlock.unitId) {
      pendingInsert.current = {
        unitId: tempBlock.unitId,
        targetIndex: insertAtIndex.current.index + 1,
      }
      insertAtIndex.current = null
    }
  }

  const handleEditBlock = (
    unitId: string,
    blockId: string,
    type:
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
    content: string,
    size?: 'pequena' | 'media' | 'grande',
    caption?: string,
    source?: string,
    textColor?: string,
    alignment?: 'esquerda' | 'centro' | 'direita' | 'justificado',
    columns?: 6 | 12,
    items?: Array<{ id: string; titulo: string; conteudo: string }>,
    frontType?: 'imagem' | 'imagem-titulo' | 'titulo',
    frontImage?: string,
    frontTitle?: string,
    backContent?: string,
    cardHeight?: string,
    listItems?: Array<{ id: string; texto: string }>,
    listType?: 'ordenada' | 'nao-ordenada' | 'check',
    quizData?: QuizData,
    infoBoxType?: 'atencao' | 'saiba_mais' | 'info' | 'curiosidade',
    infoBoxTitle?: string,
    videoUrl?: string,
    videoTitle?: string
  ) => {
    updateBlock(unitId, blockId, {
      tipo: type,
      conteudo: content,
      tamanho: size,
      legenda: caption,
      fonte: source,
      corTexto: textColor,
      alinhamento: alignment,
      colunas: columns,
      items,
      tipoFrente: frontType,
      imagemFrente: frontImage,
      tituloFrente: frontTitle,
      conteudoVerso: backContent,
      alturaCard: cardHeight,
      itensLista: listItems,
      tipoLista: listType,
      quizData,
      tipoInfoBox: infoBoxType,
      tituloInfoBox: infoBoxTitle,
      videoUrl,
      videoTitulo: videoTitle,
    })
    toast.success('Conteúdo atualizado')
    setEditingBlock(null)
  }

  // Funções para gerenciar itens do accordion
  const handleAddAccordionItem = () => {
    const newItem = {
      id: `accordion-item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      titulo: '',
      conteudo: '',
    }
    setTempBlock({
      ...tempBlock,
      items: [...(tempBlock.items || []), newItem],
    })
  }

  const handleRemoveAccordionItem = (itemId: string) => {
    setTempBlock({
      ...tempBlock,
      items: tempBlock.items?.filter((item) => item.id !== itemId) || [],
    })
  }

  const handleUpdateAccordionItem = (
    itemId: string,
    field: 'titulo' | 'conteudo',
    value: string
  ) => {
    setTempBlock({
      ...tempBlock,
      items:
        tempBlock.items?.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)) ||
        [],
    })
  }

  // Funções para gerenciar itens da lista
  const handleAddListItem = () => {
    const newItem = {
      id: `lista-item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      texto: '',
    }
    setTempBlock({
      ...tempBlock,
      itensLista: [...(tempBlock.itensLista || []), newItem],
    })
  }

  const handleRemoveListItem = (itemId: string) => {
    setTempBlock({
      ...tempBlock,
      itensLista: tempBlock.itensLista?.filter((item) => item.id !== itemId) || [],
    })
  }

  const handleUpdateListItem = (itemId: string, value: string) => {
    setTempBlock({
      ...tempBlock,
      itensLista:
        tempBlock.itensLista?.map((item) =>
          item.id === itemId ? { ...item, texto: value } : item
        ) || [],
    })
  }

  // Funções para gerenciar quiz
  const handleAddQuizQuestion = () => {
    if (!tempBlock.quizData) return
    const newQuestion: QuizQuestion = {
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
    setTempBlock({
      ...tempBlock,
      quizData: {
        ...tempBlock.quizData,
        questions: [...tempBlock.quizData.questions, newQuestion],
      },
    })
  }

  const handleRemoveQuizQuestion = (questionId: string) => {
    if (!tempBlock.quizData || tempBlock.quizData.questions.length <= 1) {
      alert('O quiz deve ter pelo menos uma pergunta.')
      return
    }
    setTempBlock({
      ...tempBlock,
      quizData: {
        ...tempBlock.quizData,
        questions: tempBlock.quizData.questions.filter((q) => q.id !== questionId),
      },
    })
  }

  const handleUpdateQuizQuestion = (
    questionId: string,
    field: 'pergunta' | 'dica',
    value: string
  ) => {
    if (!tempBlock.quizData) return
    setTempBlock({
      ...tempBlock,
      quizData: {
        ...tempBlock.quizData,
        questions: tempBlock.quizData.questions.map((q) =>
          q.id === questionId ? { ...q, [field]: value } : q
        ),
      },
    })
  }

  const handleUpdateQuizOption = (
    questionId: string,
    optionId: string,
    field: 'texto' | 'feedback',
    value: string
  ) => {
    if (!tempBlock.quizData) return
    setTempBlock({
      ...tempBlock,
      quizData: {
        ...tempBlock.quizData,
        questions: tempBlock.quizData.questions.map((q) =>
          q.id === questionId
            ? {
                ...q,
                opcoes: q.opcoes.map((option) =>
                  option.id === optionId ? { ...option, [field]: value } : option
                ),
              }
            : q
        ),
      },
    })
  }

  const handleMarkCorrectAnswer = (questionId: string, optionId: string) => {
    if (!tempBlock.quizData) return
    setTempBlock({
      ...tempBlock,
      quizData: {
        ...tempBlock.quizData,
        questions: tempBlock.quizData.questions.map((q) =>
          q.id === questionId
            ? {
                ...q,
                opcoes: q.opcoes.map((option) => ({
                  ...option,
                  isCorrect: option.id === optionId,
                })),
              }
            : q
        ),
      },
    })
  }

  const handleDeleteBlock = (unitId: string, blockId: string) => {
    setBlockToDelete({ unitId, blockId })
    setConfirmDeleteBlock(true)
  }

  const handleStartNewBlock = (
    type:
      | 'titulo'
      | 'subtitulo'
      | 'paragrafo'
      | 'imagem'
      | 'accordion'
      | 'flipcard'
      | 'lista'
      | 'quiz'
      | 'info-box',
    unitId?: string,
    columns: 6 | 12 = 12
  ) => {
    if (unitId) {
      // Inicializar quizData com uma pergunta vazia se for quiz
      const quizDataInitial: QuizData | undefined =
        type === 'quiz'
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

      setTempBlock({
        tipo: type,
        conteudo: '',
        unitId,
        tamanho: 'media',
        legenda: '',
        fonte: '',
        corTexto: '#000000',
        alinhamento: 'esquerda',
        colunas: columns,
        items: type === 'accordion' ? [] : [],
        tipoFrente: type === 'flipcard' ? 'titulo' : 'titulo',
        imagemFrente: type === 'flipcard' ? '' : '',
        tituloFrente: type === 'flipcard' ? '' : '',
        conteudoVerso: type === 'flipcard' ? '' : '',
        alturaCard: type === 'flipcard' ? '300px' : '300px',
        itensLista: type === 'lista' ? [] : [],
        tipoLista: type === 'lista' ? 'nao-ordenada' : 'nao-ordenada',
        quizData: quizDataInitial,
        tipoInfoBox: type === 'info-box' ? 'info' : 'info',
        tituloInfoBox: type === 'info-box' ? '' : '',
        videoUrl: '',
        videoTitulo: '',
      })
    }
  }

  // handleMoverUnidadeAcima e handleMoverUnidadeAbaixo removidos — reordenação via drag-and-drop na sidebar

  const handlePreview = () => {
    if (state.currentCourse) {
      openPreview(state.currentCourse)
    }
  }

  const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleBlockDragEnd = (event: DragEndEvent, unitId: string) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const unit = state.currentCourse?.unidades?.find((u) => u.id === unitId)
    if (!unit) return
    const content = [...(unit.conteudo || [])]
    const oldIndex = content.findIndex((c) => c.id === active.id)
    const newIndex = content.findIndex((c) => c.id === over.id)
    const newBlock = arrayMove(content, oldIndex, newIndex)
    newBlock.forEach((c, i) => (c.ordem = i))
    updateUnit(unitId, { conteudo: newBlock })
    notify('reordenou', 'bloco', authorName)
  }

  // Verificar se está carregando ou se o curso não foi encontrado
  if (state.loading || isFetchingCourse || !state.currentCourse) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA] dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Carregando curso...</p>
        </div>
      </div>
    )
  }

  return (
    <PageTransition>
      <div
        ref={collabContainerRef}
        className="relative min-h-screen flex flex-col bg-[#F5F7FA] dark:bg-gray-950"
      >
        <CollabCursors containerRef={collabContainerRef} />
        {/* Header */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-[#e5e7eb] dark:border-gray-800 sticky top-0 z-50">
          <div className="px-3 sm:px-6 py-3">
            <div className="flex items-center justify-between gap-2 sm:gap-4 flex-wrap md:flex-nowrap">
              {/* Esquerda */}
              <div className="order-1 flex items-center gap-2 sm:gap-3 min-w-0">
                <TooltipButton icon={ArrowLeft} tooltip="Voltar" onClick={handleBack} />
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[120px] sm:max-w-[190px] md:max-w-[290px] cursor-default">
                        {state.currentCourse.titulo}
                      </h1>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">{state.currentCourse.titulo}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Direita */}
              <div className="order-2 md:order-3 flex items-center gap-1 sm:gap-2 shrink-0">
                <div className="hidden sm:block">
                  <CollabAvatars />
                </div>
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
                  className="bg-orange-600 hover:bg-orange-700 text-white px-3 sm:px-4"
                >
                  <Download className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Exportar</span>
                </Button>
              </div>

              {/* Centro - Dropdown de Unidades */}
              <div className="order-3 md:order-2 w-full md:w-auto md:flex-1 flex justify-center">
                <UnitsDropdown
                  units={state.currentCourse.unidades}
                  activeUnitIndex={activeUnitIndex}
                  onSelectUnit={setActiveUnitIndex}
                  onOpenManageModal={() => setManageUnitsModalOpen(true)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Painel de Conteúdo - Largura Total */}
        <div className="flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Conteúdo Principal */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-6">
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
                            {state.currentCourse.titulo}
                          </CardTitle>
                        </div>
                        <p className="text-blue-50 text-lg leading-relaxed max-w-4xl">
                          {state.currentCourse.descricao}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <TooltipButton
                          icon={Edit}
                          tooltip="Editar informações do curso"
                          onClick={() => setEditCourseModal(true)}
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
                            {state.currentCourse.cargaHoraria}
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
                            {state.currentCourse.modalidade}
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
                        {state.currentCourse.unidades?.length || 0}{' '}
                        {state.currentCourse.unidades?.length === 1 ? 'Unidade' : 'Unidades'}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="bg-white/20 backdrop-blur-sm text-white border-white/30 px-4 py-2 text-sm font-semibold shadow-md hover:bg-white/25 transition-all"
                      >
                        {state.currentCourse.categoria}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Lista de Unidades */}
                <div className="space-y-8">
                  {(state.currentCourse.unidades || []).map((unit, unitIndex) => {
                    const safeIndex = Math.min(
                      activeUnitIndex,
                      (state.currentCourse?.unidades || []).length - 1
                    )
                    if (unitIndex !== safeIndex) return null
                    return (
                      <div key={unit.id || `unidade-${unitIndex}`}>
                        <EditableCard
                          actions={
                            <TooltipButton
                              icon={Edit}
                              tooltip="Editar unidade"
                              onClick={() => openEditUnitModal(unit.id)}
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
                              Unidade {unitIndex + 1}
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                              {unit.titulo}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                              {unit.descricao}
                            </p>
                          </div>
                        </EditableCard>

                        <div>
                          {/* Lista de Conteúdo */}
                          {(unit.conteudo || []).length === 0 ? null : (
                            <BlockThemeProvider theme={editorBlockTheme}>
                              <DndContext
                                sensors={dndSensors}
                                collisionDetection={closestCenter}
                                onDragEnd={(e) => handleBlockDragEnd(e, unit.id)}
                              >
                                <SortableContext
                                  items={(unit.conteudo || [])
                                    .sort((a, b) => a.ordem - b.ordem)
                                    .map((c) => c.id)}
                                  strategy={verticalListSortingStrategy}
                                >
                                  <div className="grid grid-cols-12 gap-1">
                                    {(() => {
                                      const savedBlocks = (unit.conteudo || []).sort(
                                        (a, b) => a.ordem - b.ordem
                                      )

                                      const skeleton =
                                        pendingBlock?.unitId === unit.id
                                          ? ({
                                              id: PENDING_BLOCK_ID,
                                              tipo: pendingBlock.type,
                                              ordem: pendingBlock.index,
                                              colunas: pendingBlock.columns,
                                            } as Block)
                                          : null

                                      const blocks = skeleton
                                        ? [
                                            ...savedBlocks.slice(0, pendingBlock!.index),
                                            skeleton,
                                            ...savedBlocks.slice(pendingBlock!.index),
                                          ]
                                        : savedBlocks

                                      console.log(
                                        `🔍 Unidade ${unit.titulo} - Total de conteúdos:`,
                                        blocks.length
                                      )
                                      blocks.forEach((c, i) => {
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
                                      blocks.forEach((it, i) => {
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
                                      if (blocks.length > 0)
                                        rows.push({
                                          startIndex: rStart,
                                          endIndex: blocks.length - 1,
                                          totalCols: rSum,
                                        })

                                      console.log('🟣 ROWS calculadas:', rows)
                                      rows.forEach((r, i) => {
                                        console.log(
                                          `  Row ${i}: startIndex=${r.startIndex}, endIndex=${r.endIndex}, totalCols=${r.totalCols}`
                                        )
                                      })

                                      const insertDropdown = (
                                        targetPosition: number,
                                        colSpanClass: string,
                                        key: string
                                      ) => (
                                        <div
                                          key={key}
                                          className={`group/div relative ${colSpanClass}`}
                                        >
                                          <div className="relative flex items-center justify-center py-2 md:py-0">
                                            {/* Linha horizontal */}
                                            <div className="absolute inset-x-0 h-0.5 rounded-full bg-blue-600 dark:bg-blue-500 opacity-20 md:opacity-0 md:group-hover/div:opacity-35 transition-opacity duration-150"></div>

                                            {/* Botão circular */}
                                            <TooltipButton
                                              icon={Plus}
                                              tooltip="Inserir conteúdo aqui"
                                              onClick={(e) => {
                                                e?.stopPropagation()
                                                console.log(
                                                  '🔵 CLIQUE no botão inserir - posição:',
                                                  targetPosition
                                                )
                                                handleOpenAddContentDrawer(unit.id, targetPosition)
                                              }}
                                              asButton={false}
                                              size="sm"
                                              tooltipSide="top"
                                              tooltipClassName="text-xs"
                                              className="relative z-10 flex items-center justify-center w-[20px] h-[20px] md:w-[26px] md:h-[26px] rounded-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-lg opacity-100 scale-100 md:opacity-0 md:scale-50 md:group-hover/div:opacity-100 md:group-hover/div:scale-100 transition-[opacity,scale] duration-150 ease-out"
                                            />
                                          </div>
                                        </div>
                                      )

                                      const emptySlot = (
                                        targetPosition: number,
                                        emptyCols: number
                                      ) => {
                                        const colClass =
                                          emptyCols === 6
                                            ? 'col-span-12 md:col-span-6'
                                            : 'col-span-12'
                                        return (
                                          <div
                                            key={`empty-${targetPosition}`}
                                            className={`${colClass} group/empty`}
                                          >
                                            <button
                                              className="w-full h-full min-h-[60px] rounded-lg border-2 border-dashed flex items-center justify-center text-gray-400 dark:text-gray-500 opacity-100 border-gray-300 dark:border-gray-600 md:opacity-0 md:border-transparent md:group-hover/empty:opacity-100 md:group-hover/empty:border-gray-300 dark:md:group-hover/empty:border-gray-600 hover:border-blue-400! dark:hover:border-blue-500! hover:text-blue-500! dark:hover:text-blue-400! hover:bg-blue-50! dark:hover:bg-blue-950/20! transition-all"
                                              onClick={() => {
                                                handleOpenAddContentDrawer(unit.id, targetPosition)
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
                                            insertDropdown(0, 'col-span-12', 'divider-first')}
                                          {rowIndex > 0 &&
                                            insertDropdown(
                                              row.startIndex,
                                              'col-span-12',
                                              `divider-${rowIndex}`
                                            )}
                                          {blocks
                                            .slice(row.startIndex, row.endIndex + 1)
                                            .map((item, itemIndex) => {
                                              if (item.id === PENDING_BLOCK_ID) {
                                                return (
                                                  <div
                                                    key={PENDING_BLOCK_ID}
                                                    className={`col-span-12 ${
                                                      item.colunas === 6
                                                        ? 'md:col-span-6'
                                                        : 'md:col-span-12'
                                                    }`}
                                                  >
                                                    <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20 p-6 text-blue-600 dark:text-blue-400">
                                                      <Loader2 className="h-5 w-5 animate-spin" />
                                                      <span className="text-sm font-medium">
                                                        Adicionando {BLOCK_CATALOG[item.tipo].label}
                                                        ...
                                                      </span>
                                                    </div>
                                                  </div>
                                                )
                                              }

                                              console.log(
                                                `🔍 Renderizando conteúdo [${row.startIndex + itemIndex}]:`,
                                                item.tipo,
                                                item.id,
                                                item.videoTitulo || item.conteudo?.substring(0, 50)
                                              )
                                              return (
                                                <SortableBlockWrapper
                                                  key={item.id}
                                                  id={item.id}
                                                  columns={item.colunas}
                                                >
                                                  {(dragHandle) => (
                                                    <EditableCard
                                                      flex
                                                      label={BLOCK_CATALOG[item.tipo].label}
                                                      actions={
                                                        <>
                                                          {dragHandle}
                                                          <TooltipButton
                                                            icon={Edit}
                                                            tooltip="Editar"
                                                            onClick={() =>
                                                              handleOpenEditContentDrawer(
                                                                unit.id,
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
                                                              handleDeleteBlock(unit.id, item.id)
                                                            }
                                                            asButton={false}
                                                            size="sm"
                                                            className="p-1.5 rounded text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                          />
                                                        </>
                                                      }
                                                    >
                                                      <div className="flex-1 min-w-0 mt-1">
                                                        {item.tipo === 'titulo' ? (
                                                          <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                                                            {item.conteudo}
                                                          </h3>
                                                        ) : item.tipo === 'subtitulo' ? (
                                                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                                            {item.conteudo}
                                                          </h4>
                                                        ) : item.tipo === 'flipcard' ? (
                                                          <div className="grid grid-cols-2 gap-2">
                                                            {cardsFlipcard(item).length === 0 ? (
                                                              <p className="text-xs text-gray-400 italic col-span-2">
                                                                Nenhum flipcard
                                                              </p>
                                                            ) : (
                                                              cardsFlipcard(item).map((card) => (
                                                                <div
                                                                  key={card.id}
                                                                  className="border border-[#e5e7eb] dark:border-gray-700 rounded-lg p-3 bg-linear-to-br from-(--block-accent,#2563eb)/8 to-(--block-accent,#2563eb)/15 text-center min-h-[72px] flex flex-col items-center justify-center gap-2"
                                                                >
                                                                  {card.imagemFrente && (
                                                                    <>
                                                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                      <img
                                                                        src={card.imagemFrente}
                                                                        alt=""
                                                                        className="max-h-14 mx-auto object-contain rounded"
                                                                        onError={(e) => {
                                                                          e.currentTarget.style.display =
                                                                            'none'
                                                                        }}
                                                                      />
                                                                    </>
                                                                  )}
                                                                  {card.tituloFrente ? (
                                                                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                                                                      {card.tituloFrente}
                                                                    </p>
                                                                  ) : (
                                                                    !card.imagemFrente && (
                                                                      <p className="text-xs text-gray-400 italic">
                                                                        Sem conteúdo na frente
                                                                      </p>
                                                                    )
                                                                  )}
                                                                </div>
                                                              ))
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
                                                                  className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-[#e5e7eb] dark:border-gray-700 last:border-b-0"
                                                                >
                                                                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate min-w-0 flex-1">
                                                                    {acc.titulo}
                                                                  </span>
                                                                  <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />
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
                                                              className={`h-auto object-contain border border-[#e5e7eb] dark:border-gray-700 rounded-md mx-auto ${larguraMaximaImagem(item.tamanho)}`}
                                                              onError={(e) => {
                                                                e.currentTarget.style.display =
                                                                  'none'
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
                                                            {(item.itensLista || []).length ===
                                                            0 ? (
                                                              <p className="text-xs text-gray-400 italic">
                                                                Nenhum item
                                                              </p>
                                                            ) : (
                                                              (item.itensLista || []).map(
                                                                (listItem, idx) => (
                                                                  <div
                                                                    key={listItem.id || idx}
                                                                    className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                                                                  >
                                                                    <span className="shrink-0 mt-0.5">
                                                                      {item.tipoLista ===
                                                                      'ordenada' ? (
                                                                        <span className="flex items-center justify-center w-4 h-4 bg-(--block-accent,#2563eb) text-white rounded-full text-xs font-semibold">
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
                                                                        <span className="w-1.5 h-1.5 bg-(--block-accent,#2563eb) rounded-full mt-1.5 block" />
                                                                      )}
                                                                    </span>
                                                                    <span className="line-clamp-1">
                                                                      {listItem.texto}
                                                                    </span>
                                                                  </div>
                                                                )
                                                              )
                                                            )}
                                                          </div>
                                                        ) : item.tipo ===
                                                          'objetivos-aprendizagem' ? (
                                                          <div className="space-y-1">
                                                            {(item.itensObjetivos || []).length ===
                                                            0 ? (
                                                              <p className="text-xs text-gray-400 italic">
                                                                Nenhum objetivo
                                                              </p>
                                                            ) : (
                                                              (item.itensObjetivos || []).map(
                                                                (objective, idx) => (
                                                                  <div
                                                                    key={objective.id || idx}
                                                                    className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                                                                  >
                                                                    <span className="flex items-center justify-center w-5 h-5 bg-(--block-accent,#2563eb)/10 text-(--block-accent,#2563eb) rounded font-semibold text-xs shrink-0">
                                                                      {idx + 1}
                                                                    </span>
                                                                    <span className="line-clamp-2">
                                                                      {objective.texto}
                                                                    </span>
                                                                  </div>
                                                                )
                                                              )
                                                            )}
                                                          </div>
                                                        ) : item.tipo === 'quiz' ? (
                                                          item.quizData ? (
                                                            <QuizContent
                                                              quizData={item.quizData}
                                                              isEditing={true}
                                                            />
                                                          ) : (
                                                            <p className="text-xs text-gray-400 italic">
                                                              Sem perguntas
                                                            </p>
                                                          )
                                                        ) : item.tipo === 'info-box' ? (
                                                          item.tipoInfoBox ? (
                                                            <InfoBox
                                                              type={item.tipoInfoBox}
                                                              title={item.tituloInfoBox}
                                                            >
                                                              <div
                                                                dangerouslySetInnerHTML={{
                                                                  __html: item.conteudo || '',
                                                                }}
                                                              />
                                                            </InfoBox>
                                                          ) : null
                                                        ) : item.tipo === 'paragrafo' ? (
                                                          <div
                                                            className={`conteudo-paragrafo text-gray-700 dark:text-gray-300 ${item.alinhamento === 'centro' ? 'text-center' : item.alinhamento === 'direita' ? 'text-right' : item.alinhamento === 'justificado' ? 'text-justify' : 'text-left'}`}
                                                            dangerouslySetInnerHTML={{
                                                              __html: item.conteudo,
                                                            }}
                                                          />
                                                        ) : (
                                                          <BlockPreview item={item} />
                                                        )}
                                                      </div>
                                                    </EditableCard>
                                                  )}
                                                </SortableBlockWrapper>
                                              )
                                            })}
                                          {row.totalCols < 12 &&
                                            emptySlot(row.endIndex + 1, 12 - row.totalCols)}
                                        </React.Fragment>
                                      ))
                                    })()}
                                  </div>
                                </SortableContext>
                              </DndContext>
                            </BlockThemeProvider>
                          )}

                          {/* Botão Adicionar Conteúdo */}
                          <div className="mt-8">
                            <button
                              onClick={() => {
                                const lastIndex = (unit.conteudo || []).length
                                handleOpenAddContentDrawer(unit.id, lastIndex)
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
                              <Button onClick={() => handleStartNewBlock('titulo', unit.id)}>
                                Título
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStartNewBlock('imagem', unit.id)}
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
                                onClick={() => handleStartNewBlock('accordion', unit.id)}
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
                                onClick={() => handleStartNewBlock('flipcard', unit.id)}
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
                                onClick={() => handleStartNewBlock('lista', unit.id)}
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
                                onClick={() => handleStartNewBlock('quiz', unit.id)}
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
                                onClick={() => handleStartNewBlock('info-box', unit.id)}
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
                {(state.currentCourse.unidades || []).length > 0 && (
                  <div className="mt-12 mb-8">
                    {/* Divisor */}
                    <div className="mb-6">
                      <div className="h-px bg-gray-200 dark:bg-gray-700"></div>
                    </div>

                    {/* Botões de navegação */}
                    <div className="flex items-center justify-between">
                      {/* Botão Anterior */}
                      <button
                        onClick={() => setActiveUnitIndex(activeUnitIndex - 1)}
                        disabled={activeUnitIndex === 0}
                        className="group flex items-center justify-center gap-1 px-8 py-2.5 rounded-lg bg-blue-600 dark:bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-600 dark:disabled:hover:bg-blue-600"
                      >
                        <ChevronLeft className="h-5 w-5 shrink-0" />
                        <span className="text-sm font-medium">Anterior</span>
                      </button>

                      {/* Botão Próxima */}
                      <button
                        onClick={() => setActiveUnitIndex(activeUnitIndex + 1)}
                        disabled={
                          activeUnitIndex >= (state.currentCourse.unidades || []).length - 1
                        }
                        className="group flex items-center justify-center gap-1 px-8 py-2.5 rounded-lg bg-blue-600 dark:bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-600 dark:disabled:hover:bg-blue-600"
                      >
                        <span className="text-sm font-medium">Próxima</span>
                        <ChevronRight className="h-5 w-5 shrink-0" />
                      </button>
                    </div>
                  </div>
                )}

                {(state.currentCourse.unidades || []).length === 0 && (
                  <Card>
                    <CardContent className="text-center py-12">
                      <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                        <BookmarkPlus className="h-12 w-12 text-gray-400 dark:text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-2">
                        Nenhuma unidade criada
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-8">
                        Comece adicionando a primeira unidade do seu curso
                      </p>
                      <Button
                        onClick={() => setAddUnitModal(true)}
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
        <Dialog open={addBlockModal} onOpenChange={setAddBlockModal}>
          <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Adicionar conteúdo</DialogTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Escolha o tipo de conteúdo que você quer incluir na unidade.
              </p>
            </DialogHeader>
            <Tabs defaultValue={BLOCK_CATEGORIES[0].id} className="mt-4">
              <TabsList className="w-full max-w-full justify-start overflow-x-auto">
                {BLOCK_CATEGORIES.map((category) => (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className="flex-none whitespace-nowrap"
                  >
                    {category.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {BLOCK_CATEGORIES.map((category) => {
                const types = BLOCK_TYPES.filter(
                  (type) => BLOCK_CATALOG[type].category === category.id
                )

                return (
                  <TabsContent key={category.id} value={category.id}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {types.map((type) => {
                        const meta = BLOCK_CATALOG[type]
                        const Icon = meta.icon
                        return (
                          <button
                            key={type}
                            onClick={() => {
                              if (insertAtIndex.current) {
                                handleSelectBlockType(type, insertAtIndex.current.unitId)
                              }
                            }}
                            className="flex flex-col items-start p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                              <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
                              {meta.label}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-left">
                              {meta.description}
                            </p>
                          </button>
                        )
                      })}
                    </div>
                  </TabsContent>
                )
              })}
            </Tabs>
          </DialogContent>
        </Dialog>

        {/* Modal para editar curso */}
        <Dialog open={editCourseModal} onOpenChange={() => setEditCourseModal(false)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-600" />
                Editar Curso
              </DialogTitle>
              <DialogDescription>Atualize as informações do curso</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <FormField
                label={
                  <>
                    Título do Curso <span className="text-red-500">*</span>
                  </>
                }
              >
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  placeholder="Título do curso"
                />
              </FormField>
              <FormField
                label={
                  <>
                    Descrição do Curso <span className="text-red-500">*</span>
                  </>
                }
              >
                <Textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  placeholder="Descrição do curso"
                  className="resize-none"
                  rows={6}
                />
              </FormField>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  label={
                    <>
                      Carga Horária <span className="text-red-500">*</span>
                    </>
                  }
                >
                  <Input
                    value={editedWorkload}
                    onChange={(e) => setEditedWorkload(e.target.value)}
                    placeholder="Ex: 40 horas"
                  />
                </FormField>
                <FormField
                  label={
                    <>
                      Modalidade <span className="text-red-500">*</span>
                    </>
                  }
                >
                  <Input
                    value={editedModality}
                    onChange={(e) => setEditedModality(e.target.value)}
                    placeholder="Ex: EAD, Presencial"
                  />
                </FormField>
                <FormField
                  label={
                    <>
                      Categoria <span className="text-red-500">*</span>
                    </>
                  }
                >
                  <Input
                    value={editedCategory}
                    onChange={(e) => setEditedCategory(e.target.value)}
                    placeholder="Ex: Programação, Design, Marketing"
                  />
                </FormField>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeEditCourseModal}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  handleSaveCourseEdit()
                  closeEditCourseModal()
                }}
                disabled={
                  !editedTitle.trim() ||
                  !editedDescription.trim() ||
                  !editedWorkload.trim() ||
                  !editedModality.trim() ||
                  !editedCategory.trim()
                }
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal para adicionar conteúdo */}
        <Dialog open={!!tempBlock.unitId} onOpenChange={closeAddBlockModal}>
          <DialogContent
            className={`${tempBlock.tipo === 'quiz' ? 'sm:max-w-4xl max-h-[90vh]' : 'sm:max-w-2xl'}`}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {tempBlock.tipo === 'titulo' ? (
                  <>
                    <Heading2 className="h-5 w-5 text-blue-600" />
                    Adicionar Título
                  </>
                ) : tempBlock.tipo === 'subtitulo' ? (
                  <>
                    <Heading3 className="h-5 w-5 text-blue-600" />
                    Adicionar Subtítulo
                  </>
                ) : tempBlock.tipo === 'imagem' ? (
                  <>
                    {/* eslint-disable-next-line jsx-a11y/alt-text */}
                    <Image className="h-5 w-5 text-blue-600" />
                    Adicionar Imagem
                  </>
                ) : tempBlock.tipo === 'accordion' ? (
                  <>
                    <ChevronDown className="h-5 w-5 text-blue-600" />
                    Adicionar Accordion
                  </>
                ) : tempBlock.tipo === 'flipcard' ? (
                  <>
                    <RotateCcw className="h-5 w-5 text-blue-600" />
                    Adicionar FlipCard
                  </>
                ) : tempBlock.tipo === 'lista' ? (
                  <>
                    <List className="h-5 w-5 text-blue-600" />
                    Adicionar Lista
                  </>
                ) : tempBlock.tipo === 'quiz' ? (
                  <>
                    <HelpCircle className="h-5 w-5 text-blue-600" />
                    Adicionar Quiz
                  </>
                ) : tempBlock.tipo === 'info-box' ? (
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
              {tempBlock.tipo === 'imagem' ? (
                <div className="space-y-4">
                  {/* Upload ou URL */}
                  <FormField
                    label={
                      <>
                        Imagem <span className="text-red-500">*</span>
                      </>
                    }
                  >
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
                          value={tempBlock.conteudo}
                          onChange={(e) => {
                            setTempBlock({
                              ...tempBlock,
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
                      {(imagePreviewUrl || tempBlock.conteudo) && (
                        <div className="mt-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imagePreviewUrl || tempBlock.conteudo}
                            alt="Preview"
                            className="h-auto rounded-lg border border-gray-300 dark:border-gray-600 max-h-40 object-contain bg-gray-50 dark:bg-gray-800 mx-auto"
                            onError={() => setImagePreviewUrl(null)}
                          />
                        </div>
                      )}
                    </div>
                  </FormField>

                  <FormField
                    label={
                      <>
                        Tamanho da Imagem <span className="text-red-500">*</span>
                      </>
                    }
                  >
                    <select
                      value={tempBlock.tamanho || ''}
                      onChange={(e) =>
                        setTempBlock({
                          ...tempBlock,
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
                  </FormField>

                  <FormField
                    label={
                      <>
                        Legenda <span className="text-red-500">*</span>
                      </>
                    }
                  >
                    <Input
                      value={tempBlock.legenda || ''}
                      onChange={(e) =>
                        setTempBlock({
                          ...tempBlock,
                          legenda: e.target.value,
                        })
                      }
                      placeholder="Digite a legenda da imagem..."
                    />
                  </FormField>

                  <FormField
                    label={
                      <>
                        Fonte <span className="text-red-500">*</span>
                      </>
                    }
                  >
                    <Input
                      value={tempBlock.fonte || ''}
                      onChange={(e) =>
                        setTempBlock({
                          ...tempBlock,
                          fonte: e.target.value,
                        })
                      }
                      placeholder="Digite a fonte da imagem..."
                    />
                  </FormField>
                </div>
              ) : tempBlock.tipo === 'accordion' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      Itens do Accordion <span className="text-destructive">*</span>
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddAccordionItem}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Item
                    </Button>
                  </div>

                  {tempBlock.items && tempBlock.items.length > 0 ? (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {tempBlock.items.map((item, index) => (
                        <Card key={item.id} className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-gray-700">
                              Item {index + 1}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveAccordionItem(item.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="space-y-3">
                            <FormField
                              label={
                                <>
                                  Título <span className="text-red-500">*</span>
                                </>
                              }
                              compact
                            >
                              <Input
                                value={item.titulo}
                                onChange={(e) =>
                                  handleUpdateAccordionItem(item.id, 'titulo', e.target.value)
                                }
                                placeholder="Título do item..."
                                className="text-sm"
                              />
                            </FormField>
                            <FormField
                              label={
                                <>
                                  Conteúdo <span className="text-red-500">*</span>
                                </>
                              }
                              compact
                            >
                              <textarea
                                value={item.conteudo}
                                onChange={(e) =>
                                  handleUpdateAccordionItem(item.id, 'conteudo', e.target.value)
                                }
                                placeholder="Conteúdo do item..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                                rows={3}
                              />
                            </FormField>
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
              ) : tempBlock.tipo === 'flipcard' ? (
                <div className="space-y-4">
                  {/* Tipo de Frente */}
                  <FormField
                    label={
                      <>
                        Tipo de Frente <span className="text-red-500">*</span>
                      </>
                    }
                  >
                    <select
                      value={tempBlock.tipoFrente || 'titulo'}
                      onChange={(e) =>
                        setTempBlock({
                          ...tempBlock,
                          tipoFrente: e.target.value as 'imagem' | 'imagem-titulo' | 'titulo',
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="imagem">Apenas Imagem</option>
                      <option value="imagem-titulo">Imagem com Título no Rodapé</option>
                      <option value="titulo">Apenas Título Centralizado</option>
                    </select>
                  </FormField>

                  {/* Imagem (se necessário) */}
                  {(tempBlock.tipoFrente === 'imagem' ||
                    tempBlock.tipoFrente === 'imagem-titulo') && (
                    <FormField
                      label={
                        <>
                          Imagem da Frente <span className="text-red-500">*</span>
                        </>
                      }
                    >
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
                          value={tempBlock.imagemFrente || ''}
                          onChange={(e) =>
                            setTempBlock({
                              ...tempBlock,
                              imagemFrente: e.target.value,
                            })
                          }
                          placeholder="Cole a URL da imagem..."
                        />

                        {/* Preview da Imagem */}
                        {(imagePreviewUrl || tempBlock.imagemFrente) && (
                          <div className="mt-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imagePreviewUrl || tempBlock.imagemFrente}
                              alt="Preview"
                              className="h-auto rounded-lg border border-gray-300 max-h-40 object-contain bg-gray-50 mx-auto"
                              onError={() => setImagePreviewUrl(null)}
                            />
                          </div>
                        )}
                      </div>
                    </FormField>
                  )}

                  {/* Título (se necessário) */}
                  {(tempBlock.tipoFrente === 'imagem-titulo' ||
                    tempBlock.tipoFrente === 'titulo') && (
                    <FormField
                      label={
                        <>
                          Título da Frente <span className="text-red-500">*</span>
                        </>
                      }
                    >
                      <Input
                        value={tempBlock.tituloFrente || ''}
                        onChange={(e) =>
                          setTempBlock({
                            ...tempBlock,
                            tituloFrente: e.target.value,
                          })
                        }
                        placeholder="Digite o título da frente do card..."
                      />
                    </FormField>
                  )}

                  {/* Conteúdo do Verso */}
                  <FormField
                    label={
                      <>
                        Conteúdo do Verso <span className="text-red-500">*</span>
                      </>
                    }
                  >
                    <textarea
                      value={tempBlock.conteudoVerso || ''}
                      onChange={(e) =>
                        setTempBlock({
                          ...tempBlock,
                          conteudoVerso: e.target.value,
                        })
                      }
                      placeholder="Digite o conteúdo do verso do card..."
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={8}
                    />
                  </FormField>

                  {/* Altura do Card */}
                  <FormField label="Altura do Card (opcional)">
                    <Input
                      value={tempBlock.alturaCard || '300px'}
                      onChange={(e) =>
                        setTempBlock({
                          ...tempBlock,
                          alturaCard: e.target.value,
                        })
                      }
                      placeholder="Ex: 300px, 400px, 50vh"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use valores como &quot;300px&quot;, &quot;400px&quot; ou &quot;50vh&quot;
                      (viewport height)
                    </p>
                  </FormField>
                </div>
              ) : tempBlock.tipo === 'lista' ? (
                <div className="space-y-4">
                  {/* Tipo de Lista */}
                  <FormField
                    label={
                      <>
                        Tipo de Lista <span className="text-red-500">*</span>
                      </>
                    }
                  >
                    <select
                      value={tempBlock.tipoLista || 'nao-ordenada'}
                      onChange={(e) =>
                        setTempBlock({
                          ...tempBlock,
                          tipoLista: e.target.value as 'ordenada' | 'nao-ordenada' | 'check',
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="nao-ordenada">Não Ordenada (Bullets)</option>
                      <option value="ordenada">Ordenada (Numerada)</option>
                      <option value="check">Com Ícone de Check</option>
                    </select>
                  </FormField>

                  {/* Itens da Lista */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      Itens da Lista <span className="text-destructive">*</span>
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddListItem}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Item
                    </Button>
                  </div>

                  {tempBlock.itensLista && tempBlock.itensLista.length > 0 ? (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {tempBlock.itensLista.map((item, index) => (
                        <Card key={item.id} className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-gray-700">
                              Item {index + 1}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveListItem(item.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <FormField
                            label={
                              <>
                                Texto do Item <span className="text-red-500">*</span>
                              </>
                            }
                            compact
                          >
                            <Input
                              value={item.texto}
                              onChange={(e) => handleUpdateListItem(item.id, e.target.value)}
                              placeholder="Digite o texto do item..."
                              className="text-sm"
                            />
                          </FormField>
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
              ) : tempBlock.tipo === 'quiz' ? (
                <div className="space-y-6">
                  {/* Botão Adicionar Pergunta */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      Perguntas do Quiz <span className="text-destructive">*</span>
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddQuizQuestion}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Pergunta
                    </Button>
                  </div>

                  {/* Lista de Perguntas */}
                  {tempBlock.quizData?.questions && tempBlock.quizData.questions.length > 0 ? (
                    <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                      {tempBlock.quizData.questions.map((question, questionIndex) => (
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
                            {tempBlock.quizData && tempBlock.quizData.questions.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveQuizQuestion(question.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          <div className="space-y-6">
                            {/* Texto da Pergunta */}
                            <FormField
                              label={
                                <>
                                  Pergunta <span className="text-red-500">*</span>
                                </>
                              }
                            >
                              <textarea
                                value={question.pergunta}
                                onChange={(e) =>
                                  handleUpdateQuizQuestion(question.id, 'pergunta', e.target.value)
                                }
                                placeholder="Digite a pergunta do quiz..."
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-400"
                                rows={3}
                              />
                            </FormField>

                            {/* Dica (opcional) */}
                            <FormField
                              label={
                                <>
                                  Dica{' '}
                                  <span className="text-gray-400 dark:text-gray-500 text-xs">
                                    (opcional)
                                  </span>
                                </>
                              }
                            >
                              <textarea
                                value={question.dica || ''}
                                onChange={(e) =>
                                  handleUpdateQuizQuestion(question.id, 'dica', e.target.value)
                                }
                                placeholder="Digite uma dica para o aluno..."
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-400"
                                rows={2}
                              />
                            </FormField>

                            {/* Opções de Resposta */}
                            <FormField
                              label={
                                <>
                                  Opções de Resposta <span className="text-red-500">*</span>
                                  <span className="text-xs text-gray-500 font-normal ml-2">
                                    (Marque exatamente uma resposta correta)
                                  </span>
                                </>
                              }
                            >
                              <div className="space-y-4">
                                {question.opcoes.map((option, index) => (
                                  <Card
                                    key={option.id}
                                    className={`p-4 border-2 ${
                                      option.isCorrect
                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/30 dark:border-green-600'
                                        : 'border-gray-200 dark:border-gray-700'
                                    }`}
                                  >
                                    <div className="flex items-start gap-4">
                                      {/* Label da Opção */}
                                      <div className="shrink-0">
                                        <div
                                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                                            option.isCorrect
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
                                        <FormField
                                          label={
                                            <>
                                              Texto da Opção <span className="text-red-500">*</span>
                                            </>
                                          }
                                          compact
                                        >
                                          <Input
                                            value={option.texto}
                                            onChange={(e) =>
                                              handleUpdateQuizOption(
                                                question.id,
                                                option.id,
                                                'texto',
                                                e.target.value
                                              )
                                            }
                                            placeholder={`Digite o texto da opção ${String.fromCharCode(65 + index)}...`}
                                            className="text-sm"
                                          />
                                        </FormField>

                                        {/* Feedback da Opção */}
                                        <FormField
                                          label={
                                            <>
                                              Feedback <span className="text-red-500">*</span>
                                            </>
                                          }
                                          compact
                                        >
                                          <textarea
                                            value={option.feedback}
                                            onChange={(e) =>
                                              handleUpdateQuizOption(
                                                question.id,
                                                option.id,
                                                'feedback',
                                                e.target.value
                                              )
                                            }
                                            placeholder="Digite o feedback que aparecerá quando o aluno escolher esta opção..."
                                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-400"
                                            rows={2}
                                          />
                                        </FormField>

                                        {/* Radio para Marcar como Correta */}
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="radio"
                                            name={`correct-${question.id}`}
                                            checked={option.isCorrect}
                                            onChange={() =>
                                              handleMarkCorrectAnswer(question.id, option.id)
                                            }
                                            className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                                            id={`correct-${question.id}-${option.id}`}
                                          />
                                          <label
                                            htmlFor={`correct-${question.id}-${option.id}`}
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
                            </FormField>
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
              ) : tempBlock.tipo === 'info-box' ? (
                <div className="space-y-4">
                  {/* Tipo do Info Box */}
                  <FormField
                    label={
                      <>
                        Tipo do Info Box <span className="text-red-500">*</span>
                      </>
                    }
                  >
                    <select
                      value={tempBlock.tipoInfoBox || 'info'}
                      onChange={(e) =>
                        setTempBlock({
                          ...tempBlock,
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
                  </FormField>

                  {/* Título do Info Box */}
                  <FormField
                    label={
                      <>
                        Título <span className="text-gray-400 text-xs">(opcional)</span>
                      </>
                    }
                  >
                    <Input
                      value={tempBlock.tituloInfoBox || ''}
                      onChange={(e) =>
                        setTempBlock({
                          ...tempBlock,
                          tituloInfoBox: e.target.value,
                        })
                      }
                      placeholder="Digite o título do Info Box (opcional)..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Se deixar em branco, será usado o tipo como título
                    </p>
                  </FormField>

                  {/* Texto do Corpo */}
                  <FormField
                    label={
                      <>
                        Texto do Corpo <span className="text-red-500">*</span>
                      </>
                    }
                  >
                    <textarea
                      value={tempBlock.conteudo}
                      onChange={(e) =>
                        setTempBlock({
                          ...tempBlock,
                          conteudo: e.target.value,
                        })
                      }
                      placeholder="Digite o texto do corpo do Info Box..."
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={8}
                    />
                  </FormField>
                </div>
              ) : (
                <FormField
                  label={
                    <>
                      Conteúdo <span className="text-red-500">*</span>
                    </>
                  }
                >
                  {tempBlock.tipo === 'paragrafo' ? (
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-foreground">
                          Largura da coluna
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setTempBlock({ ...tempBlock, colunas: 12 })}
                            className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                              (tempBlock.colunas ?? 12) === 12
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                                : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400'
                            }`}
                          >
                            Largura total
                          </button>
                          <button
                            type="button"
                            onClick={() => setTempBlock({ ...tempBlock, colunas: 6 })}
                            className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                              tempBlock.colunas === 6
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                                : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400'
                            }`}
                          >
                            Meia largura
                          </button>
                        </div>
                      </div>
                      <RichTextEditor
                        value={tempBlock.conteudo}
                        onChange={(html) => setTempBlock({ ...tempBlock, conteudo: html })}
                        placeholder="Digite o parágrafo..."
                        autoFocus
                      />
                    </div>
                  ) : (
                    <Input
                      value={tempBlock.conteudo}
                      onChange={(e) =>
                        setTempBlock({
                          ...tempBlock,
                          conteudo: e.target.value,
                        })
                      }
                      placeholder={`Digite o ${
                        tempBlock.tipo === 'titulo' ? 'título' : 'subtítulo'
                      }...`}
                    />
                  )}
                </FormField>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeAddBlockModal}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  shouldCloseModal.current = true
                  setIsSavingBlock(true)
                  handleSaveBlock()
                }}
                className="bg-blue-600 hover:bg-blue-700 min-w-[100px]"
                disabled={
                  isSavingBlock ||
                  (tempBlock.tipo === 'accordion'
                    ? !tempBlock.items ||
                      tempBlock.items.length === 0 ||
                      tempBlock.items.some((item) => !item.titulo.trim() || !item.conteudo.trim())
                    : tempBlock.tipo === 'flipcard'
                      ? !tempBlock.tipoFrente ||
                        !tempBlock.conteudoVerso?.trim() ||
                        (tempBlock.tipoFrente === 'imagem' && !tempBlock.imagemFrente?.trim()) ||
                        (tempBlock.tipoFrente === 'imagem-titulo' &&
                          (!tempBlock.imagemFrente?.trim() || !tempBlock.tituloFrente?.trim())) ||
                        (tempBlock.tipoFrente === 'titulo' && !tempBlock.tituloFrente?.trim())
                      : tempBlock.tipo === 'lista'
                        ? !tempBlock.itensLista ||
                          tempBlock.itensLista.length === 0 ||
                          tempBlock.itensLista.some((item) => !item.texto.trim())
                        : tempBlock.tipo === 'quiz'
                          ? !tempBlock.quizData ||
                            !tempBlock.quizData.questions ||
                            tempBlock.quizData.questions.length === 0 ||
                            tempBlock.quizData.questions.some((q) => !q.pergunta.trim()) ||
                            tempBlock.quizData.questions.some(
                              (q) => !q.opcoes || q.opcoes.length !== 5
                            ) ||
                            tempBlock.quizData.questions.some((q) =>
                              q.opcoes.some((option) => !option.texto.trim())
                            ) ||
                            tempBlock.quizData.questions.some(
                              (q) => q.opcoes.filter((option) => option.isCorrect).length !== 1
                            ) ||
                            tempBlock.quizData.questions.some((q) =>
                              q.opcoes.some((option) => !option.feedback.trim())
                            )
                          : tempBlock.tipo === 'info-box'
                            ? !tempBlock.tipoInfoBox || !tempBlock.conteudo.trim()
                            : !tempBlock.conteudo.trim()) ||
                  (tempBlock.tipo === 'imagem' &&
                    (!tempBlock.tamanho || !tempBlock.legenda || !tempBlock.fonte))
                }
              >
                {isSavingBlock ? (
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
        <Dialog open={addUnitModal} onOpenChange={() => setAddUnitModal(false)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-600" />
                Adicionar Nova Unidade
              </DialogTitle>
              <DialogDescription>Crie uma nova unidade para o curso</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <FormField
                label={
                  <>
                    Título da Unidade <span className="text-red-500">*</span>
                  </>
                }
              >
                <Input
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  placeholder="Título da unidade"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddUnit()}
                />
              </FormField>

              <FormField
                label={
                  <>
                    Descrição da Unidade <span className="text-red-500">*</span>
                  </>
                }
              >
                <Textarea
                  value={newUnitDescription}
                  onChange={(e) => setNewUnitDescription(e.target.value)}
                  placeholder="Descreva o que os alunos aprenderão nesta unidade..."
                  className="resize-none"
                  rows={4}
                  required
                />
              </FormField>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeAddUnitModal}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  handleAddUnit()
                  closeAddUnitModal()
                }}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!newUnit.trim() || !newUnitDescription.trim()}
              >
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Drawer para editar unidade */}
        <Sheet open={editUnitModal && !!unitToEdit} onOpenChange={() => setEditUnitModal(false)}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle className="flex items-center">
                <Edit className="h-5 w-5 text-blue-600" />
                Editar Unidade
              </SheetTitle>
            </SheetHeader>
            <div className="space-y-4 py-4">
              <FormField
                label={
                  <>
                    Título da Unidade <span className="text-red-500">*</span>
                  </>
                }
              >
                <Input
                  value={editingUnitTitle}
                  onChange={(e) => setEditingUnitTitle(e.target.value)}
                  placeholder="Digite o título da unidade..."
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveUnitEdit()}
                />
              </FormField>

              <FormField
                label={
                  <>
                    Descrição da Unidade <span className="text-red-500">*</span>
                  </>
                }
              >
                <Textarea
                  value={editingUnitDescription}
                  onChange={(e) => setEditingUnitDescription(e.target.value)}
                  placeholder="Descreva o que os alunos aprenderão nesta unidade..."
                  className="resize-none"
                  rows={8}
                  required
                />
              </FormField>
            </div>
            <SheetFooter>
              <Button variant="outline" onClick={closeEditUnitModal}>
                Cancelar
              </Button>
              <Button
                onClick={handleSaveUnitEdit}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!editingUnitTitle.trim() || !editingUnitDescription.trim()}
              >
                Salvar
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Modal de confirmação para deletar conteúdo */}
        <Dialog
          open={confirmDeleteBlock && !!blockToDelete}
          onOpenChange={() => setConfirmDeleteBlock(false)}
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
              <Button variant="outline" onClick={closeConfirmDeleteBlockModal}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (blockToDelete) {
                    setIsDeletingBlock(true)
                    shouldCloseDeleteModal.current = true
                    deleteBlock(blockToDelete.unitId, blockToDelete.blockId)
                  }
                }}
                className="bg-red-600 hover:bg-red-700 min-w-[90px]"
                disabled={isDeletingBlock}
              >
                {isDeletingBlock ? (
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
        <Dialog open={!!editingBlock && !!editingBlock.tipo} onOpenChange={closeEditBlockModal}>
          {editingBlock && (
            <DialogContent
              className={`${editingBlock.tipo === 'quiz' ? 'sm:max-w-4xl max-h-[90vh] overflow-y-auto' : 'sm:max-w-2xl max-h-[90vh] overflow-y-auto'}`}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {editingBlock.tipo === 'titulo' ? (
                    <Heading2 className="h-5 w-5 text-blue-600" />
                  ) : editingBlock.tipo === 'subtitulo' ? (
                    <Heading3 className="h-5 w-5 text-blue-600" />
                  ) : editingBlock.tipo === 'imagem' ? (
                    <>
                      {/* eslint-disable-next-line jsx-a11y/alt-text */}
                      <Image className="h-5 w-5 text-blue-600" />
                    </>
                  ) : editingBlock.tipo === 'accordion' ? (
                    <ChevronDown className="h-5 w-5 text-blue-600" />
                  ) : editingBlock.tipo === 'flipcard' ? (
                    <RotateCcw className="h-5 w-5 text-blue-600" />
                  ) : editingBlock.tipo === 'lista' ? (
                    <List className="h-5 w-5 text-blue-600" />
                  ) : editingBlock.tipo === 'quiz' ? (
                    <HelpCircle className="h-5 w-5 text-blue-600" />
                  ) : editingBlock.tipo === 'info-box' ? (
                    <AlertTriangle className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Type className="h-5 w-5 text-blue-600" />
                  )}
                  Editar{' '}
                  {editingBlock.tipo === 'titulo'
                    ? 'Título'
                    : editingBlock.tipo === 'subtitulo'
                      ? 'Subtítulo'
                      : editingBlock.tipo === 'imagem'
                        ? 'Imagem'
                        : editingBlock.tipo === 'accordion'
                          ? 'Accordion'
                          : editingBlock.tipo === 'flipcard'
                            ? 'FlipCard'
                            : editingBlock.tipo === 'lista'
                              ? 'Lista'
                              : editingBlock.tipo === 'quiz'
                                ? 'Quiz'
                                : editingBlock.tipo === 'info-box'
                                  ? 'Info Box'
                                  : 'Parágrafo'}
                </DialogTitle>
                <DialogDescription>Atualize o conteúdo abaixo</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {editingBlock?.tipo === 'quiz' ? (
                  <div className="space-y-6">
                    {/* Botão Adicionar Pergunta */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        Perguntas do Quiz <span className="text-destructive">*</span>
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!editingBlock.quizData) {
                            setEditingBlock({
                              ...editingBlock,
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
                          const newQuestion: QuizQuestion = {
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
                          setEditingBlock({
                            ...editingBlock,
                            quizData: {
                              ...editingBlock.quizData,
                              questions: [...editingBlock.quizData.questions, newQuestion],
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
                    {editingBlock.quizData?.questions &&
                    editingBlock.quizData.questions.length > 0 ? (
                      <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                        {editingBlock.quizData.questions.map((question, questionIndex) => (
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
                              {editingBlock.quizData &&
                                editingBlock.quizData.questions.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      if (
                                        editingBlock.quizData &&
                                        editingBlock.quizData.questions.length <= 1
                                      ) {
                                        alert('O quiz deve ter pelo menos uma pergunta.')
                                        return
                                      }
                                      setEditingBlock({
                                        ...editingBlock,
                                        quizData: editingBlock.quizData
                                          ? {
                                              ...editingBlock.quizData,
                                              questions: editingBlock.quizData.questions.filter(
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
                              <FormField
                                label={
                                  <>
                                    Pergunta <span className="text-red-500">*</span>
                                  </>
                                }
                              >
                                <textarea
                                  value={question.pergunta}
                                  onChange={(e) => {
                                    const novasQuestions = editingBlock.quizData?.questions.map(
                                      (q) =>
                                        q.id === question.id
                                          ? { ...q, pergunta: e.target.value }
                                          : q
                                    )
                                    setEditingBlock({
                                      ...editingBlock,
                                      quizData: editingBlock.quizData
                                        ? {
                                            ...editingBlock.quizData,
                                            questions: novasQuestions || [],
                                          }
                                        : undefined,
                                    })
                                  }}
                                  placeholder="Digite a pergunta do quiz..."
                                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  rows={3}
                                />
                              </FormField>

                              {/* Dica (opcional) */}
                              <FormField
                                label={
                                  <>
                                    Dica <span className="text-gray-400 text-xs">(opcional)</span>
                                  </>
                                }
                              >
                                <textarea
                                  value={question.dica || ''}
                                  onChange={(e) => {
                                    const novasQuestions = editingBlock.quizData?.questions.map(
                                      (q) =>
                                        q.id === question.id ? { ...q, dica: e.target.value } : q
                                    )
                                    setEditingBlock({
                                      ...editingBlock,
                                      quizData: editingBlock.quizData
                                        ? {
                                            ...editingBlock.quizData,
                                            questions: novasQuestions || [],
                                          }
                                        : undefined,
                                    })
                                  }}
                                  placeholder="Digite uma dica para o aluno..."
                                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  rows={2}
                                />
                              </FormField>

                              {/* Opções de Resposta */}
                              <FormField
                                label={
                                  <>
                                    Opções de Resposta <span className="text-red-500">*</span>
                                    <span className="text-xs text-gray-500 font-normal ml-2">
                                      (Marque exatamente uma resposta correta)
                                    </span>
                                  </>
                                }
                              >
                                <div className="space-y-4">
                                  {question.opcoes.map((option, index) => (
                                    <Card
                                      key={option.id}
                                      className={`p-4 border-2 ${
                                        option.isCorrect
                                          ? 'border-green-500 bg-green-50 dark:bg-green-900/30 dark:border-green-600'
                                          : 'border-gray-200 dark:border-gray-700'
                                      }`}
                                    >
                                      <div className="flex items-start gap-4">
                                        {/* Label da Opção */}
                                        <div className="shrink-0">
                                          <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                                              option.isCorrect
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
                                          <FormField
                                            label={
                                              <>
                                                Texto da Opção{' '}
                                                <span className="text-red-500">*</span>
                                              </>
                                            }
                                            compact
                                          >
                                            <Input
                                              value={option.texto}
                                              onChange={(e) => {
                                                const novasQuestions =
                                                  editingBlock.quizData?.questions.map((q) =>
                                                    q.id === question.id
                                                      ? {
                                                          ...q,
                                                          opcoes: q.opcoes.map((opt) =>
                                                            opt.id === option.id
                                                              ? { ...opt, texto: e.target.value }
                                                              : opt
                                                          ),
                                                        }
                                                      : q
                                                  )
                                                setEditingBlock({
                                                  ...editingBlock,
                                                  quizData: editingBlock.quizData
                                                    ? {
                                                        ...editingBlock.quizData,
                                                        questions: novasQuestions || [],
                                                      }
                                                    : undefined,
                                                })
                                              }}
                                              placeholder={`Digite o texto da opção ${String.fromCharCode(65 + index)}...`}
                                              className="text-sm"
                                            />
                                          </FormField>

                                          {/* Feedback da Opção */}
                                          <FormField
                                            label={
                                              <>
                                                Feedback <span className="text-red-500">*</span>
                                              </>
                                            }
                                            compact
                                          >
                                            <textarea
                                              value={option.feedback}
                                              onChange={(e) => {
                                                const novasQuestions =
                                                  editingBlock.quizData?.questions.map((q) =>
                                                    q.id === question.id
                                                      ? {
                                                          ...q,
                                                          opcoes: q.opcoes.map((opt) =>
                                                            opt.id === option.id
                                                              ? { ...opt, feedback: e.target.value }
                                                              : opt
                                                          ),
                                                        }
                                                      : q
                                                  )
                                                setEditingBlock({
                                                  ...editingBlock,
                                                  quizData: editingBlock.quizData
                                                    ? {
                                                        ...editingBlock.quizData,
                                                        questions: novasQuestions || [],
                                                      }
                                                    : undefined,
                                                })
                                              }}
                                              placeholder="Digite o feedback que aparecerá quando o aluno escolher esta opção..."
                                              className="w-full p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                              rows={2}
                                            />
                                          </FormField>

                                          {/* Radio para Marcar como Correta */}
                                          <div className="flex items-center gap-2">
                                            <input
                                              type="radio"
                                              name={`edit-correct-${question.id}`}
                                              checked={option.isCorrect}
                                              onChange={() => {
                                                const novasQuestions =
                                                  editingBlock.quizData?.questions.map((q) =>
                                                    q.id === question.id
                                                      ? {
                                                          ...q,
                                                          opcoes: q.opcoes.map((opt) => ({
                                                            ...opt,
                                                            isCorrect: opt.id === option.id,
                                                          })),
                                                        }
                                                      : q
                                                  )
                                                setEditingBlock({
                                                  ...editingBlock,
                                                  quizData: editingBlock.quizData
                                                    ? {
                                                        ...editingBlock.quizData,
                                                        questions: novasQuestions || [],
                                                      }
                                                    : undefined,
                                                })
                                              }}
                                              className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                                              id={`edit-correct-${question.id}-${option.id}`}
                                            />
                                            <label
                                              htmlFor={`edit-correct-${question.id}-${option.id}`}
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
                              </FormField>
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
                ) : editingBlock?.tipo === 'imagem' ? (
                  <div className="space-y-4">
                    {/* Upload ou URL */}
                    <FormField
                      label={
                        <>
                          Imagem <span className="text-red-500">*</span>
                        </>
                      }
                    >
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
                            value={editingBlock.conteudo}
                            onChange={(e) => {
                              setEditingBlock({
                                ...editingBlock,
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
                        {(imagePreviewUrl || editingBlock.conteudo) && (
                          <div className="mt-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imagePreviewUrl || editingBlock.conteudo}
                              alt="Preview"
                              className="h-auto rounded-lg border border-gray-300 max-h-40 object-contain bg-gray-50 mx-auto"
                              onError={() => setImagePreviewUrl(null)}
                            />
                          </div>
                        )}
                      </div>
                    </FormField>

                    <FormField
                      label={
                        <>
                          Tamanho da Imagem <span className="text-red-500">*</span>
                        </>
                      }
                    >
                      <select
                        value={editingBlock.tamanho || ''}
                        onChange={(e) =>
                          setEditingBlock({
                            ...editingBlock,
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
                    </FormField>

                    <FormField
                      label={
                        <>
                          Legenda <span className="text-red-500">*</span>
                        </>
                      }
                    >
                      <Input
                        value={editingBlock.legenda || ''}
                        onChange={(e) =>
                          setEditingBlock({
                            ...editingBlock,
                            legenda: e.target.value,
                          })
                        }
                        placeholder="Digite a legenda da imagem..."
                      />
                    </FormField>

                    <FormField
                      label={
                        <>
                          Fonte <span className="text-red-500">*</span>
                        </>
                      }
                    >
                      <Input
                        value={editingBlock.fonte || ''}
                        onChange={(e) =>
                          setEditingBlock({
                            ...editingBlock,
                            fonte: e.target.value,
                          })
                        }
                        placeholder="Digite a fonte da imagem..."
                      />
                    </FormField>
                  </div>
                ) : editingBlock?.tipo === 'accordion' ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        Itens do Accordion <span className="text-destructive">*</span>
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (editingBlock) {
                            const newItem = {
                              id: `accordion-item-${Date.now()}-${Math.random()
                                .toString(36)
                                .substring(2, 9)}`,
                              titulo: '',
                              conteudo: '',
                            }
                            setEditingBlock({
                              ...editingBlock,
                              items: [...(editingBlock.items || []), newItem],
                            })
                          }
                        }}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Item
                      </Button>
                    </div>

                    {editingBlock.items && editingBlock.items.length > 0 ? (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {editingBlock.items.map((item, index) => (
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
                                  if (editingBlock) {
                                    setEditingBlock({
                                      ...editingBlock,
                                      items:
                                        editingBlock.items?.filter((i) => i.id !== item.id) || [],
                                    })
                                  }
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="space-y-3">
                              <FormField
                                label={
                                  <>
                                    Título <span className="text-red-500">*</span>
                                  </>
                                }
                                compact
                              >
                                <Input
                                  value={item.titulo}
                                  onChange={(e) => {
                                    if (editingBlock) {
                                      setEditingBlock({
                                        ...editingBlock,
                                        items:
                                          editingBlock.items?.map((i) =>
                                            i.id === item.id ? { ...i, titulo: e.target.value } : i
                                          ) || [],
                                      })
                                    }
                                  }}
                                  placeholder="Título do item..."
                                  className="text-sm"
                                />
                              </FormField>
                              <FormField
                                label={
                                  <>
                                    Conteúdo <span className="text-red-500">*</span>
                                  </>
                                }
                                compact
                              >
                                <textarea
                                  value={item.conteudo}
                                  onChange={(e) => {
                                    if (editingBlock) {
                                      setEditingBlock({
                                        ...editingBlock,
                                        items:
                                          editingBlock.items?.map((i) =>
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
                              </FormField>
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
                ) : editingBlock?.tipo === 'flipcard' ? (
                  <div className="space-y-4">
                    {/* Tipo de Frente */}
                    <FormField
                      label={
                        <>
                          Tipo de Frente <span className="text-red-500">*</span>
                        </>
                      }
                    >
                      <select
                        value={editingBlock.tipoFrente || 'titulo'}
                        onChange={(e) =>
                          editingBlock &&
                          setEditingBlock({
                            ...editingBlock,
                            tipoFrente: e.target.value as 'imagem' | 'imagem-titulo' | 'titulo',
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="imagem">Apenas Imagem</option>
                        <option value="imagem-titulo">Imagem com Título no Rodapé</option>
                        <option value="titulo">Apenas Título Centralizado</option>
                      </select>
                    </FormField>

                    {/* Imagem (se necessário) */}
                    {(editingBlock.tipoFrente === 'imagem' ||
                      editingBlock.tipoFrente === 'imagem-titulo') && (
                      <FormField
                        label={
                          <>
                            Imagem da Frente <span className="text-red-500">*</span>
                          </>
                        }
                      >
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
                            value={editingBlock.imagemFrente || ''}
                            onChange={(e) =>
                              editingBlock &&
                              setEditingBlock({
                                ...editingBlock,
                                imagemFrente: e.target.value,
                              })
                            }
                            placeholder="Cole a URL da imagem..."
                          />

                          {/* Preview da Imagem */}
                          {(imagePreviewUrl || editingBlock.imagemFrente) && (
                            <div className="mt-3">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={imagePreviewUrl || editingBlock.imagemFrente}
                                alt="Preview"
                                className="h-auto rounded-lg border border-gray-300 max-h-40 object-contain bg-gray-50 mx-auto"
                                onError={() => setImagePreviewUrl(null)}
                              />
                            </div>
                          )}
                        </div>
                      </FormField>
                    )}

                    {/* Título (se necessário) */}
                    {(editingBlock.tipoFrente === 'imagem-titulo' ||
                      editingBlock.tipoFrente === 'titulo') && (
                      <FormField
                        label={
                          <>
                            Título da Frente <span className="text-red-500">*</span>
                          </>
                        }
                      >
                        <Input
                          value={editingBlock.tituloFrente || ''}
                          onChange={(e) =>
                            editingBlock &&
                            setEditingBlock({
                              ...editingBlock,
                              tituloFrente: e.target.value,
                            })
                          }
                          placeholder="Digite o título da frente do card..."
                        />
                      </FormField>
                    )}

                    {/* Conteúdo do Verso */}
                    <FormField
                      label={
                        <>
                          Conteúdo do Verso <span className="text-red-500">*</span>
                        </>
                      }
                    >
                      <textarea
                        value={editingBlock.conteudoVerso || ''}
                        onChange={(e) =>
                          editingBlock &&
                          setEditingBlock({
                            ...editingBlock,
                            conteudoVerso: e.target.value,
                          })
                        }
                        placeholder="Digite o conteúdo do verso do card..."
                        className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={8}
                      />
                    </FormField>

                    {/* Altura do Card */}
                    <FormField label="Altura do Card (opcional)">
                      <Input
                        value={editingBlock.alturaCard || '300px'}
                        onChange={(e) =>
                          editingBlock &&
                          setEditingBlock({
                            ...editingBlock,
                            alturaCard: e.target.value,
                          })
                        }
                        placeholder="Ex: 300px, 400px, 50vh"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Use valores como &quot;300px&quot;, &quot;400px&quot; ou &quot;50vh&quot;
                        (viewport height)
                      </p>
                    </FormField>
                  </div>
                ) : editingBlock?.tipo === 'lista' ? (
                  <div className="space-y-4">
                    {/* Tipo de Lista */}
                    <FormField
                      label={
                        <>
                          Tipo de Lista <span className="text-red-500">*</span>
                        </>
                      }
                    >
                      <select
                        value={editingBlock.tipoLista || 'nao-ordenada'}
                        onChange={(e) =>
                          editingBlock &&
                          setEditingBlock({
                            ...editingBlock,
                            tipoLista: e.target.value as 'ordenada' | 'nao-ordenada' | 'check',
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="nao-ordenada">Não Ordenada (Bullets)</option>
                        <option value="ordenada">Ordenada (Numerada)</option>
                        <option value="check">Com Ícone de Check</option>
                      </select>
                    </FormField>

                    {/* Itens da Lista */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        Itens da Lista <span className="text-destructive">*</span>
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (editingBlock) {
                            const newItem = {
                              id: `lista-item-${Date.now()}-${Math.random()
                                .toString(36)
                                .substring(2, 9)}`,
                              texto: '',
                            }
                            setEditingBlock({
                              ...editingBlock,
                              itensLista: [...(editingBlock.itensLista || []), newItem],
                            })
                          }
                        }}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Item
                      </Button>
                    </div>

                    {editingBlock.itensLista && editingBlock.itensLista.length > 0 ? (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {editingBlock.itensLista.map((item, index) => (
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
                                  if (editingBlock) {
                                    setEditingBlock({
                                      ...editingBlock,
                                      itensLista:
                                        editingBlock.itensLista?.filter((i) => i.id !== item.id) ||
                                        [],
                                    })
                                  }
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <FormField
                              label={
                                <>
                                  Texto do Item <span className="text-red-500">*</span>
                                </>
                              }
                              compact
                            >
                              <Input
                                value={item.texto}
                                onChange={(e) => {
                                  if (editingBlock) {
                                    setEditingBlock({
                                      ...editingBlock,
                                      itensLista:
                                        editingBlock.itensLista?.map((i) =>
                                          i.id === item.id ? { ...i, texto: e.target.value } : i
                                        ) || [],
                                    })
                                  }
                                }}
                                placeholder="Digite o texto do item..."
                                className="text-sm"
                              />
                            </FormField>
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
                ) : editingBlock?.tipo === 'info-box' ? (
                  <div className="space-y-4">
                    {/* Tipo do Info Box */}
                    <FormField
                      label={
                        <>
                          Tipo do Info Box <span className="text-red-500">*</span>
                        </>
                      }
                    >
                      <select
                        value={editingBlock.tipoInfoBox || 'info'}
                        onChange={(e) =>
                          editingBlock &&
                          setEditingBlock({
                            ...editingBlock,
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
                    </FormField>

                    {/* Título do Info Box */}
                    <FormField
                      label={
                        <>
                          Título <span className="text-gray-400 text-xs">(opcional)</span>
                        </>
                      }
                    >
                      <Input
                        value={editingBlock.tituloInfoBox || ''}
                        onChange={(e) =>
                          editingBlock &&
                          setEditingBlock({
                            ...editingBlock,
                            tituloInfoBox: e.target.value,
                          })
                        }
                        placeholder="Digite o título do Info Box (opcional)..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Se deixar em branco, será usado o tipo como título
                      </p>
                    </FormField>

                    {/* Texto do Corpo */}
                    <FormField
                      label={
                        <>
                          Texto do Corpo <span className="text-red-500">*</span>
                        </>
                      }
                    >
                      <textarea
                        value={editingBlock.conteudo || ''}
                        onChange={(e) =>
                          editingBlock &&
                          setEditingBlock({
                            ...editingBlock,
                            conteudo: e.target.value,
                          })
                        }
                        placeholder="Digite o texto do corpo do Info Box..."
                        className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={8}
                      />
                    </FormField>
                  </div>
                ) : (
                  <FormField
                    label={
                      <>
                        Conteúdo <span className="text-red-500">*</span>
                      </>
                    }
                  >
                    {editingBlock?.tipo === 'paragrafo' ? (
                      <RichTextEditor
                        key={editingBlock.blockId}
                        value={editingBlock.conteudo}
                        onChange={(html) =>
                          editingBlock && setEditingBlock({ ...editingBlock, conteudo: html })
                        }
                        placeholder="Digite o parágrafo..."
                      />
                    ) : (
                      <Input
                        value={editingBlock?.conteudo || ''}
                        onChange={(e) =>
                          editingBlock &&
                          setEditingBlock({
                            ...editingBlock,
                            conteudo: e.target.value,
                          })
                        }
                        placeholder={`Digite o ${
                          editingBlock?.tipo === 'titulo' ? 'título' : 'subtítulo'
                        }...`}
                      />
                    )}
                  </FormField>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeEditBlockModal}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    if (editingBlock) {
                      handleEditBlock(
                        editingBlock.unitId,
                        editingBlock.blockId,
                        editingBlock.tipo,
                        editingBlock.conteudo || '',
                        editingBlock.tamanho,
                        editingBlock.legenda,
                        editingBlock.fonte,
                        editingBlock.corTexto,
                        editingBlock.alinhamento,
                        editingBlock.colunas,
                        editingBlock.items,
                        editingBlock.tipoFrente,
                        editingBlock.imagemFrente,
                        editingBlock.tituloFrente,
                        editingBlock.conteudoVerso,
                        editingBlock.alturaCard,
                        editingBlock.itensLista,
                        editingBlock.tipoLista,
                        editingBlock.quizData,
                        editingBlock.tipoInfoBox,
                        editingBlock.tituloInfoBox,
                        editingBlock.videoUrl,
                        editingBlock.videoTitulo
                      )
                      closeEditBlockModal()
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={
                    (editingBlock?.tipo === 'accordion'
                      ? !editingBlock.items ||
                        editingBlock.items.length === 0 ||
                        editingBlock.items.some(
                          (item) => !item.titulo.trim() || !item.conteudo.trim()
                        )
                      : editingBlock?.tipo === 'flipcard'
                        ? !editingBlock.tipoFrente ||
                          !editingBlock.conteudoVerso?.trim() ||
                          (editingBlock.tipoFrente === 'imagem' &&
                            !editingBlock.imagemFrente?.trim()) ||
                          (editingBlock.tipoFrente === 'imagem-titulo' &&
                            (!editingBlock.imagemFrente?.trim() ||
                              !editingBlock.tituloFrente?.trim())) ||
                          (editingBlock.tipoFrente === 'titulo' &&
                            !editingBlock.tituloFrente?.trim())
                        : editingBlock?.tipo === 'lista'
                          ? !editingBlock.itensLista ||
                            editingBlock.itensLista.length === 0 ||
                            editingBlock.itensLista.some((item) => !item.texto.trim())
                          : editingBlock?.tipo === 'quiz'
                            ? !editingBlock.quizData ||
                              !editingBlock.quizData.questions ||
                              editingBlock.quizData.questions.length === 0 ||
                              editingBlock.quizData.questions.some((q) => !q.pergunta.trim()) ||
                              editingBlock.quizData.questions.some(
                                (q) => !q.opcoes || q.opcoes.length !== 5
                              ) ||
                              editingBlock.quizData.questions.some((q) =>
                                q.opcoes.some((option) => !option.texto.trim())
                              ) ||
                              editingBlock.quizData.questions.some(
                                (q) => q.opcoes.filter((option) => option.isCorrect).length !== 1
                              ) ||
                              editingBlock.quizData.questions.some((q) =>
                                q.opcoes.some((option) => !option.feedback.trim())
                              )
                            : editingBlock?.tipo === 'info-box'
                              ? !editingBlock.tipoInfoBox || !editingBlock.conteudo?.trim()
                              : !editingBlock?.conteudo?.trim()) ||
                    (editingBlock?.tipo === 'imagem' &&
                      (!editingBlock.tamanho || !editingBlock.legenda || !editingBlock.fonte))
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
              await generatePDF(state.currentCourse!, filename)
              setExportModalOpen(false)
            } catch (error) {
              // Erro já foi tratado no hook, modal permanece aberto
              console.error('Erro ao gerar PDF:', error)
            }
          }}
          onExportSCORM={async (filename) => {
            try {
              console.log('🔄 [Export] Iniciando exportação SCORM...')
              console.log('📦 [Export] Curso atual:', state.currentCourse)
              console.log('📝 [Export] Filename:', filename)

              if (state.currentCourse) {
                console.log('✅ [Export] Curso encontrado, chamando generateSCORM...')
                await generateSCORM(state.currentCourse, filename)
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
          courseName={state.currentCourse?.titulo || 'Curso'}
          courseId={state.currentCourse?.id}
          isGeneratingPDF={isGeneratingPDF}
          isGeneratingSCORM={isGeneratingSCORM}
        />

        {/* Course Settings Drawer */}
        <CourseSettingsDrawer
          courseId={state.currentCourse.id}
          canManageCollaborators={
            state.currentCourse.permissoes?.podeGerenciarColaboradores ?? false
          }
          open={settingsDrawerOpen}
          onOpenChange={setSettingsDrawerOpen}
          courseData={{
            titulo: state.currentCourse.titulo,
            descricao: state.currentCourse.descricao || '',
            categoria: state.currentCourse.categoria || undefined,
            cargaHoraria: state.currentCourse.cargaHoraria,
            layout: state.currentCourse.layout,
            bannerVideoUrl: state.currentCourse.bannerVideoUrl,
          }}
          units={state.currentCourse.unidades || []}
          onSave={async (courseData, units) => {
            if (state.currentCourse) {
              await updateCourse(state.currentCourse.id, {
                titulo: courseData.titulo,
                descricao: courseData.descricao,
                categoria: courseData.categoria || '',
                cargaHoraria: courseData.cargaHoraria,
                layout: courseData.layout,
                bannerVideoUrl: courseData.bannerVideoUrl ?? '',
              })
              await reorderUnits(units as Unit[])
            }
          }}
        />

        {/* Manage Units Modal */}
        <ManageUnitsModal
          open={manageUnitsModalOpen}
          onOpenChange={setManageUnitsModalOpen}
          units={state.currentCourse.unidades || []}
        />

        <ContentBlockDrawer
          open={contentDrawerOpen}
          onOpenChange={setContentDrawerOpen}
          mode={contentDrawerMode}
          blockData={contentDrawerBlockData}
          onSave={handleSaveContentFromDrawer}
          onCancel={handleCancelContentDrawer}
        />
      </div>
    </PageTransition>
  )
}

function BlockPreview({ item }: { item: Block }) {
  const BlockComponent = blockRegistry[item.tipo]
  if (!BlockComponent) return null

  return (
    <div className="pointer-events-none">
      <BlockComponent item={item} />
    </div>
  )
}

export default function EditCoursePage() {
  const params = useParams()
  const courseId = (params?.id as string | undefined) ?? ''

  return (
    <CollabProvider courseId={courseId}>
      <CourseEditor />
    </CollabProvider>
  )
}
