'use client'

// This page must not be exported statically (it uses context and client-side hooks)
// Next.js must skip it during the static build
export const dynamic = 'error'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useCourseEditor } from '@/context/CourseEditorContext'
import { useAuth } from '@/context/AuthContext'
import { usePreview } from '@/hooks/usePreview'
import { useTheme } from '@/hooks/useTheme'
import { usePDF } from '@/hooks/usePDF'
import { useSCORM } from '@/hooks/useSCORM'
import { CollabProvider } from '@/components/collaboration/CollabProvider'
import { CollabAvatars } from '@/components/collaboration/CollabAvatars'
import { CollabCursors } from '@/components/collaboration/CollabCursors'
import { useCollabEvents } from '@/hooks/useCollabEvents'
import { EditableCard } from '@/components/EditableCard'
import { ActivityGradingBadge } from '@/components/course/ActivityGradingBadge'
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
  ExternalLink,
} from 'lucide-react'
import { UnitsDropdown } from '@/components/UnitsDropdown'
import {
  ContentBlockDrawer,
  CourseSettingsDrawer,
  ExportModal,
  ManageUnitsModal,
  RichTextEditor,
  useMountAfterFirstOpen,
  usePreloadEditorParts,
} from '@/components/course/editor/lazy-editor-parts'
import { EditorLoading } from '@/components/course/editor/EditorLoading'
import { TrailBadgeFields } from '@/components/course/TrailBadgeFields'
import { TrailStepSummary } from '@/components/course/TrailStepSummary'
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
  blockIdentity,
  cardsFlipcard,
  createEmptyBlock,
  modalEntriesFor,
} from '@/lib/blocks'
import { uploadFile } from '@/lib/client-upload'

/** Rótulo curto do bloco para o toast do outro usuário */
const PENDING_BLOCK_ID = '__bloco-pendente__'

function blockTitle(block: { title?: string; content?: string; type?: string }) {
  return block.title?.trim() || block.content?.trim().slice(0, 40) || block.type
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
  const { notify } = useCollabEvents()
  const authorName = user?.name ?? 'Alguém'

  const [newUnit, setNewUnit] = useState('')
  const [newUnitDescription, setNewUnitDescription] = useState('')
  const [editedTitle, setEditedTitle] = useState('')
  const [editedDescription, setEditedDescription] = useState('')
  const [editingUnitDescription, setEditingUnitDescription] = useState('')
  const [editingBlock, setEditingBlock] = useState<{
    unitId: string
    blockId: string
    type:
      | 'paragraph'
      | 'subheading'
      | 'heading'
      | 'image'
      | 'video'
      | 'accordion'
      | 'flipcard'
      | 'list'
      | 'quiz'
      | 'info-box'
    content: string
    size?: 'small' | 'medium' | 'large'
    caption?: string
    source?: string
    textColor?: string
    alignment?: 'left' | 'center' | 'right' | 'justify'
    columns?: 6 | 12
    items?: Array<{ id: string; title: string; content: string }>
    frontType?: 'image' | 'image-title' | 'title'
    frontImage?: string
    frontTitle?: string
    backContent?: string
    cardHeight?: string
    listItems?: Array<{ id: string; text: string }>
    listType?: 'ordered' | 'unordered' | 'check'
    quizData?: QuizData
    infoBoxType?: 'warning' | 'learn-more' | 'info' | 'fun-fact'
    infoBoxTitle?: string
    videoUrl?: string
    videoTitle?: string
  } | null>(null)
  const [tempBlock, setTempBlock] = useState<
    ReturnType<typeof createEmptyBlock> & {
      unitId: string
      frontType?: 'image' | 'image-title' | 'title'
      frontImage?: string
      frontTitle?: string
      backContent?: string
    }
  >({
    ...createEmptyBlock('paragraph'),
    unitId: '',
  })
  const [addUnitModal, setAddUnitModal] = useState(false)
  const [editUnitModal, setEditUnitModal] = useState(false)
  const [unitToEdit, setUnitToEdit] = useState<string | null>(null)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [editingUnitTitle, setEditingUnitTitle] = useState('')
  const [editingUnitBadgeName, setEditingUnitBadgeName] = useState('')
  const [editingUnitBadgeIcon, setEditingUnitBadgeIcon] = useState('')
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [isFetchingCourse, setIsFetchingCourse] = useState(false)
  const insertAtIndex = useRef<{ unitId: string; index: number } | null>(null)
  const [pendingBlock, setPendingBlock] = useState<{
    unitId: string
    index: number
    type: Block['type']
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

  // Select the course on mount (fetching from the server when needed)
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

  // Refresh isFetchingCourse once the course has loaded
  useEffect(() => {
    if (state.currentCourse?.id === courseId || state.currentCourse?.slug === courseId) {
      setIsFetchingCourse(false)
    }
  }, [state.currentCourse, courseId])

  // Block editing for anyone without permission on the course
  useEffect(() => {
    const course = state.currentCourse
    const isThisCourse = course?.id === courseId || course?.slug === courseId

    if (isThisCourse && course?.permissions && !course.permissions.canEdit) {
      toast.error('Você não tem permissão para editar este curso')
      router.replace(`/courses/${course.slug || course.id}/preview`)
    }
  }, [state.currentCourse, courseId, router])

  // Refresh the image preview when editing content
  useEffect(() => {
    if (editingBlock?.type === 'image' && editingBlock.content) {
      if (editingBlock.content.startsWith('http')) {
        setImagePreviewUrl(editingBlock.content)
      } else {
        setImagePreviewUrl(null)
      }
    } else if (!editingBlock) {
      setImagePreviewUrl(null)
    }
  }, [editingBlock])

  // Refresh the image preview when adding content
  useEffect(() => {
    if (tempBlock.type === 'image' && tempBlock.content) {
      if (tempBlock.content.startsWith('http')) {
        setImagePreviewUrl(tempBlock.content)
      }
    } else if (tempBlock.type !== 'image') {
      setImagePreviewUrl(null)
    }
  }, [tempBlock.type, tempBlock.content])

  useEffect(() => {
    if (editCourseModal && state.currentCourse) {
      setEditedTitle(state.currentCourse.title)
      setEditedDescription(state.currentCourse.description)
      setEditedWorkload(state.currentCourse.workload)
      setEditedModality(state.currentCourse.modality)
      setEditedCategory(state.currentCourse.category)
    }
  }, [editCourseModal, state.currentCourse])

  // Scroll to the top when the unit changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activeUnitIndex])

  // Move a freshly added item into place once the state settles
  useEffect(() => {
    if (pendingInsert.current) {
      const { unitId, targetIndex } = pendingInsert.current
      const unit = state.currentCourse?.units?.find((u) => u.id === unitId)
      if (unit) {
        const c = [...(unit.blocks || [])].sort((a, b) => a.order - b.order)
        console.log('🔍 reorder effect - c.length:', c.length, 'targetIndex:', targetIndex)
        console.log(
          '🔍 Array BEFORE arrayMove:',
          c.map((item, i) => `[${i}] ${item.type} order:${item.order}`)
        )

        if (c.length > 0 && targetIndex < c.length) {
          pendingInsert.current = null
          const reord = arrayMove(c, c.length - 1, targetIndex).map((item, i) => ({
            ...item,
            order: i,
          }))

          console.log(
            '🔍 Array AFTER arrayMove:',
            reord.map((item, i) => `[${i}] ${item.type} order:${item.order}`)
          )
          updateUnit(unitId, { blocks: reord })
          return
        }
      }
    }
    if (shouldCloseModal.current) {
      shouldCloseModal.current = false
      setIsSavingBlock(false)
      toast.success('Conteúdo adicionado')
      notify('added', 'block', authorName)
      setTempBlock({
        type: 'paragraph',
        content: '',
        unitId: '',
        size: 'medium',
        caption: '',
        source: '',
        textColor: '#000000',
        alignment: 'left',
        columns: 12,
        items: [],
        frontType: 'title',
        frontImage: '',
        frontTitle: '',
        backContent: '',
        cardHeight: '300px',
        listItems: [],
        videoUrl: '',
        videoTitle: '',
        listType: 'unordered',
        quizData: undefined,
        infoBoxType: 'info',
        infoBoxTitle: '',
      })
    }
    if (shouldCloseDeleteModal.current) {
      shouldCloseDeleteModal.current = false
      setIsDeletingBlock(false)
      toast.success('Conteúdo excluído')
      notify('deleted', 'block', authorName)
      setConfirmDeleteBlock(false)
      setBlockToDelete(null)
    }
  }, [state.currentCourse?.units, updateUnit])

  const handleBack = () => router.push('/courses')

  const closeAddUnitModal = () => {
    setAddUnitModal(false)
    setNewUnit('')
    setNewUnitDescription('')
  }

  const openEditUnitModal = (unitId: string) => {
    const unit = state.currentCourse?.units?.find((u) => u.id === unitId)
    if (unit) {
      setUnitToEdit(unitId)
      setEditingUnitTitle(unit.title)
      setEditingUnitDescription(unit.description)
      setEditingUnitBadgeName(unit.badgeName ?? '')
      setEditingUnitBadgeIcon(unit.badgeIcon ?? '')
      setEditUnitModal(true)
    }
  }

  const closeEditUnitModal = () => {
    setEditUnitModal(false)
    setUnitToEdit(null)
    setEditingUnitTitle('')
    setEditingUnitDescription('')
    setEditingUnitBadgeName('')
    setEditingUnitBadgeIcon('')
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
      type: 'paragraph',
      content: '',
      unitId: '',
      size: 'medium',
      caption: '',
      source: '',
      textColor: '#000000',
      alignment: 'left',
      columns: 12,
      items: [],
      frontType: 'title',
      frontImage: '',
      frontTitle: '',
      backContent: '',
      cardHeight: '300px',
      listItems: [],
      videoUrl: '',
      videoTitle: '',
      listType: 'unordered',
      quizData: undefined,
      infoBoxType: 'info',
      infoBoxTitle: '',
    })
  }

  const closeEditCourseModal = () => {
    setEditCourseModal(false)
  }

  const handleSaveCourseEdit = async () => {
    if (state.currentCourse) {
      try {
        await updateCourse(state.currentCourse.id, {
          title: editedTitle,
          description: editedDescription,
          workload: editedWorkload,
          modality: editedModality,
          category: editedCategory,
        })
      } catch (error) {
        console.error('Failed to save the course edit:', error)
      }
    }
  }

  const handleAddUnit = () => {
    if (newUnit.trim() && newUnitDescription.trim()) {
      addUnit({
        title: newUnit.trim(),
        description: newUnitDescription.trim(),
        blocks: [],
      })
      toast.success('Unidade adicionada')
      notify('added', 'unit', authorName, newUnit.trim())
      setNewUnit('')
      setNewUnitDescription('')
      setAddUnitModal(false)
    }
  }

  const handleSaveUnitEdit = () => {
    if (unitToEdit && editingUnitTitle.trim() && editingUnitDescription.trim()) {
      updateUnit(unitToEdit, {
        title: editingUnitTitle.trim(),
        description: editingUnitDescription.trim(),
        badgeName: editingUnitBadgeName.trim() || undefined,
        badgeIcon: editingUnitBadgeIcon || undefined,
      })
      toast.success('Unidade atualizada')
      notify('updated', 'unit', authorName, editingUnitTitle.trim())
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
      const { url: uploadedUrl, warning } = await uploadFile(file, 'image')
      if (warning) toast.warning(warning)
      const data = { url: uploadedUrl }

      // Store the image URL in the right piece of state
      if (forFlipcard) {
        // A flipcard updates frontImage
        if (forEdit && editingBlock) {
          setEditingBlock({
            ...editingBlock,
            frontImage: data.url,
          })
        } else {
          setTempBlock({
            ...tempBlock,
            frontImage: data.url,
          })
        }
      } else if (forEdit && editingBlock) {
        setEditingBlock({
          ...editingBlock,
          content: data.url,
        })
      } else {
        setTempBlock({
          ...tempBlock,
          content: data.url,
        })
      }

      // Show the preview
      setImagePreviewUrl(data.url)

      toast.success('Imagem enviada')
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error('Erro ao enviar imagem')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleOpenAddContentDrawer = (unitId: string, index: number) => {
    insertAtIndex.current = { unitId, index }
    setAddBlockModal(true)
  }

  const handleSelectBlockType = (
    type: Block['type'],
    unitId: string,
    preset: Partial<Block> = {}
  ) => {
    setAddBlockModal(false)
    setContentDrawerUnitId(unitId)
    setContentDrawerMode('add')
    setContentDrawerBlockData({ ...preset, type })
    setContentDrawerOpen(true)
  }

  const handleOpenEditContentDrawer = (unitId: string, content: Block) => {
    setContentDrawerUnitId(unitId)
    setContentDrawerMode('edit')
    setContentDrawerBlockData(content)
    setContentDrawerOpen(true)
  }

  const handleSaveContentFromDrawer = async (data: Omit<Block, 'id' | 'order'>) => {
    console.log('🔍 handleSaveContentFromDrawer - mode:', contentDrawerMode, 'data:', data)
    console.log('🔍 insertAtIndex.current:', insertAtIndex.current)

    if (contentDrawerMode === 'add') {
      if (insertAtIndex.current) {
        const { unitId, index } = insertAtIndex.current
        console.log('🔍 Adding content - unitId:', unitId, 'index:', index)

        const unit = state.currentCourse?.units?.find((u) => u.id === unitId)
        const contentLength = unit?.blocks?.length || 0
        console.log('🔍 Current content length:', contentLength)

        setPendingBlock({
          unitId,
          index: Math.min(index, contentLength),
          type: data.type,
          columns: data.columns,
        })

        try {
          await addBlock(unitId, data)
        } finally {
          setPendingBlock(null)
        }

        if (index < contentLength) {
          console.log('🔍 Reorder needed - index:', index, '< contentLength:', contentLength)
          pendingInsert.current = { unitId, targetIndex: index }
        } else {
          console.log('🔍 No reorder needed - appending at the end')
        }
      }
      toast.success('Conteúdo adicionado')
      notify('added', 'block', authorName, blockTitle(data))
    } else {
      if (contentDrawerBlockData?.id) {
        updateBlock(contentDrawerUnitId, contentDrawerBlockData.id, data)
        toast.success('Conteúdo atualizado')
        notify('updated', 'block', authorName, blockTitle(data))
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
    if (tempBlock.type === 'accordion') {
      // Validate the accordion
      if (!tempBlock.items || tempBlock.items.length === 0) {
        alert('Adicione pelo menos um item ao accordion.')
        return
      }
      // Every item needs a title and content
      const invalidItems = tempBlock.items.some(
        (item) => !item.title.trim() || !item.content.trim()
      )
      if (invalidItems) {
        alert('Todos os itens do accordion devem ter título e conteúdo preenchidos.')
        return
      }
    } else if (tempBlock.type === 'flipcard') {
      // Validate the flipcard
      if (!tempBlock.frontType) {
        alert('Selecione o tipo de frente do flipcard.')
        return
      }
      if (tempBlock.frontType === 'image' && !tempBlock.frontImage?.trim()) {
        alert('Adicione uma imagem para a frente do flipcard.')
        return
      }
      if (
        tempBlock.frontType === 'image-title' &&
        (!tempBlock.frontImage?.trim() || !tempBlock.frontTitle?.trim())
      ) {
        alert('Adicione uma imagem e um título para a frente do flipcard.')
        return
      }
      if (tempBlock.frontType === 'title' && !tempBlock.frontTitle?.trim()) {
        alert('Adicione um título para a frente do flipcard.')
        return
      }
      if (!tempBlock.backContent?.trim()) {
        alert('Adicione o conteúdo do verso do flipcard.')
        return
      }
    } else if (tempBlock.type === 'list') {
      // Validate the list
      if (!tempBlock.listItems || tempBlock.listItems.length === 0) {
        alert('Adicione pelo menos um item à lista.')
        return
      }
      if (tempBlock.listItems.some((item) => !item.text.trim())) {
        alert('Todos os itens da lista devem ter texto preenchido.')
        return
      }
    } else if (tempBlock.type === 'quiz') {
      // Validate the quiz
      if (
        !tempBlock.quizData ||
        !tempBlock.quizData.questions ||
        tempBlock.quizData.questions.length === 0
      ) {
        alert('O quiz deve ter pelo menos uma pergunta.')
        return
      }

      // Validate each question
      for (const question of tempBlock.quizData.questions) {
        if (!question.question.trim()) {
          alert('Todas as perguntas devem ter um texto preenchido.')
          return
        }
        if (!question.options || question.options.length !== 5) {
          alert('Cada pergunta deve ter exatamente 5 opções de resposta.')
          return
        }
        if (question.options.some((option) => !option.text.trim())) {
          alert('Todas as opções de resposta devem ter texto preenchido.')
          return
        }
        if (question.options.every((option) => !option.isCorrect)) {
          alert('Cada pergunta deve ter exatamente uma resposta correta marcada.')
          return
        }
        const correctCount = question.options.filter((option) => option.isCorrect).length
        if (correctCount !== 1) {
          alert('Cada pergunta deve ter exatamente uma resposta correta.')
          return
        }
        if (question.options.some((option) => !option.feedback.trim())) {
          alert('Todas as opções de resposta devem ter um feedback preenchido.')
          return
        }
      }
    } else if (tempBlock.type === 'info-box') {
      // Validate the info box
      if (!tempBlock.infoBoxType) {
        alert('Selecione o tipo do Info Box.')
        return
      }
      if (!tempBlock.content.trim()) {
        alert('O texto do corpo do Info Box é obrigatório.')
        return
      }
    } else if (tempBlock.type === 'image') {
      if (!tempBlock.size || !tempBlock.caption || !tempBlock.source) {
        alert('Por favor, preencha todos os campos obrigatórios para a imagem.')
        return
      }
    } else {
      if (!tempBlock.content.trim()) {
        return
      }
    }

    addBlock(tempBlock.unitId, {
      type: tempBlock.type,
      content: tempBlock.content || '',
      size: tempBlock.size,
      caption: tempBlock.caption,
      source: tempBlock.source,
      textColor: tempBlock.textColor,
      alignment: tempBlock.alignment,
      columns: tempBlock.columns,
      items: tempBlock.items,
      cardHeight: tempBlock.cardHeight,
      listItems: tempBlock.listItems,
      listType: tempBlock.listType,
      quizData: tempBlock.quizData,
      infoBoxType: tempBlock.infoBoxType,
      infoBoxTitle: tempBlock.infoBoxTitle,
    })
    // When a specific position was requested, remember it and reorder after the state settles
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
      | 'paragraph'
      | 'subheading'
      | 'heading'
      | 'image'
      | 'video'
      | 'accordion'
      | 'flipcard'
      | 'list'
      | 'quiz'
      | 'info-box',
    content: string,
    size?: 'small' | 'medium' | 'large',
    caption?: string,
    source?: string,
    textColor?: string,
    alignment?: 'left' | 'center' | 'right' | 'justify',
    columns?: 6 | 12,
    items?: Array<{ id: string; title: string; content: string }>,
    frontType?: 'image' | 'image-title' | 'title',
    frontImage?: string,
    frontTitle?: string,
    backContent?: string,
    cardHeight?: string,
    listItems?: Array<{ id: string; text: string }>,
    listType?: 'ordered' | 'unordered' | 'check',
    quizData?: QuizData,
    infoBoxType?: 'warning' | 'learn-more' | 'info' | 'fun-fact',
    infoBoxTitle?: string,
    videoUrl?: string,
    videoTitle?: string
  ) => {
    updateBlock(unitId, blockId, {
      type,
      content,
      size,
      caption,
      source,
      textColor,
      alignment,
      columns,
      items,
      cardHeight,
      listItems,
      listType,
      quizData,
      infoBoxType,
      infoBoxTitle,
      videoUrl,
      videoTitle,
    })
    toast.success('Conteúdo atualizado')
    setEditingBlock(null)
  }

  // Accordion item handlers
  const handleAddAccordionItem = () => {
    const newItem = {
      id: `accordion-item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: '',
      content: '',
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
    field: 'heading' | 'conteudo',
    value: string
  ) => {
    setTempBlock({
      ...tempBlock,
      items:
        tempBlock.items?.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)) ||
        [],
    })
  }

  // List item handlers
  const handleAddListItem = () => {
    const newItem = {
      id: `lista-item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      text: '',
    }
    setTempBlock({
      ...tempBlock,
      listItems: [...(tempBlock.listItems || []), newItem],
    })
  }

  const handleRemoveListItem = (itemId: string) => {
    setTempBlock({
      ...tempBlock,
      listItems: tempBlock.listItems?.filter((item) => item.id !== itemId) || [],
    })
  }

  const handleUpdateListItem = (itemId: string, value: string) => {
    setTempBlock({
      ...tempBlock,
      listItems:
        tempBlock.listItems?.map((item) =>
          item.id === itemId ? { ...item, text: value } : item
        ) || [],
    })
  }

  // Quiz handlers
  const handleAddQuizQuestion = () => {
    if (!tempBlock.quizData) return
    const newQuestion: QuizQuestion = {
      id: `question-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      question: '',
      hint: '',
      options: Array.from({ length: 5 }, (_, i) => ({
        id: `opcao-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 9)}`,
        text: '',
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
                options: q.options.map((option) =>
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
                options: q.options.map((option) => ({
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
      | 'heading'
      | 'subheading'
      | 'paragraph'
      | 'image'
      | 'accordion'
      | 'flipcard'
      | 'list'
      | 'quiz'
      | 'info-box',
    unitId?: string,
    columns: 6 | 12 = 12
  ) => {
    if (unitId) {
      // Seed quizData with an empty question for a quiz
      const quizDataInitial: QuizData | undefined =
        type === 'quiz'
          ? {
              questions: [
                {
                  id: `question-${Date.now()}`,
                  question: '',
                  hint: '',
                  options: Array.from({ length: 5 }, (_, i) => ({
                    id: `opcao-${Date.now()}-${i}`,
                    text: '',
                    isCorrect: i === 0, // first option correct by default
                    feedback: '',
                  })),
                },
              ],
            }
          : undefined

      setTempBlock({
        type,
        content: '',
        unitId,
        size: 'medium',
        caption: '',
        source: '',
        textColor: '#000000',
        alignment: 'left',
        columns,
        items: type === 'accordion' ? [] : [],
        frontType: type === 'flipcard' ? 'title' : 'title',
        frontImage: type === 'flipcard' ? '' : '',
        frontTitle: type === 'flipcard' ? '' : '',
        backContent: type === 'flipcard' ? '' : '',
        cardHeight: type === 'flipcard' ? '300px' : '300px',
        listItems: type === 'list' ? [] : [],
        listType: 'unordered',
        quizData: quizDataInitial,
        infoBoxType: type === 'info-box' ? 'info' : 'info',
        infoBoxTitle: type === 'info-box' ? '' : '',
        videoUrl: '',
        videoTitle: '',
      })
    }
  }

  // The move-up/move-down handlers are gone — reordering happens by drag-and-drop in the sidebar

  const handlePreview = () => {
    if (state.currentCourse) {
      openPreview(state.currentCourse)
    }
  }

  const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleBlockDragEnd = (event: DragEndEvent, unitId: string) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const unit = state.currentCourse?.units?.find((u) => u.id === unitId)
    if (!unit) return
    const content = [...(unit.blocks || [])].sort((a, b) => a.order - b.order)
    const oldIndex = content.findIndex((c) => c.id === active.id)
    const newIndex = content.findIndex((c) => c.id === over.id)
    const newBlock = arrayMove(content, oldIndex, newIndex).map((c, i) => ({ ...c, order: i }))
    updateUnit(unitId, { blocks: newBlock })
    notify('reordered', 'block', authorName)
  }

  const sortedBlocksByUnit = useMemo(() => {
    const byUnit = new Map<string, Block[]>()
    for (const unit of state.currentCourse?.units ?? []) {
      byUnit.set(
        unit.id,
        [...(unit.blocks ?? [])].sort((a, b) => a.order - b.order)
      )
    }
    return byUnit
  }, [state.currentCourse?.units])

  const exportModalMounted = useMountAfterFirstOpen(exportModalOpen)
  const settingsDrawerMounted = useMountAfterFirstOpen(settingsDrawerOpen)
  const manageUnitsModalMounted = useMountAfterFirstOpen(manageUnitsModalOpen)
  const contentDrawerMounted = useMountAfterFirstOpen(contentDrawerOpen)
  usePreloadEditorParts(Boolean(state.currentCourse))

  // Loading, or the course was not found
  if (state.loading || isFetchingCourse || !state.currentCourse) {
    return <EditorLoading />
  }

  return (
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
                      {state.currentCourse.title}
                    </h1>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{state.currentCourse.title}</TooltipContent>
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
                units={state.currentCourse.units}
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
                          {state.currentCourse.title}
                        </CardTitle>
                      </div>
                      <p className="text-blue-50 text-lg leading-relaxed max-w-4xl">
                        {state.currentCourse.description}
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
                          {state.currentCourse.workload}
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
                          {state.currentCourse.modality}
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
                      {state.currentCourse.units?.length || 0}{' '}
                      {state.currentCourse.units?.length === 1 ? 'Unidade' : 'Unidades'}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-white/20 backdrop-blur-sm text-white border-white/30 px-4 py-2 text-sm font-semibold shadow-md hover:bg-white/25 transition-all"
                    >
                      {state.currentCourse.category}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Lista de Unidades */}
              <div className="space-y-8">
                {(state.currentCourse.units || []).map((unit, unitIndex) => {
                  const safeIndex = Math.min(
                    activeUnitIndex,
                    (state.currentCourse?.units || []).length - 1
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
                            {unit.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {unit.description}
                          </p>
                          <TrailStepSummary layout={state.currentCourse?.layout} unit={unit} />
                        </div>
                      </EditableCard>

                      <div>
                        {/* Lista de Conteúdo */}
                        {(unit.blocks || []).length === 0 ? null : (
                          <BlockThemeProvider theme={editorBlockTheme}>
                            <DndContext
                              sensors={dndSensors}
                              collisionDetection={closestCenter}
                              onDragEnd={(e) => handleBlockDragEnd(e, unit.id)}
                            >
                              <SortableContext
                                items={(sortedBlocksByUnit.get(unit.id) ?? []).map((c) => c.id)}
                                strategy={verticalListSortingStrategy}
                              >
                                <div className="grid grid-cols-12 gap-1">
                                  {(() => {
                                    const savedBlocks = sortedBlocksByUnit.get(unit.id) ?? []

                                    const skeleton =
                                      pendingBlock?.unitId === unit.id
                                        ? ({
                                            id: PENDING_BLOCK_ID,
                                            type: pendingBlock.type,
                                            order: pendingBlock.index,
                                            columns: pendingBlock.columns,
                                          } as Block)
                                        : null

                                    const blocks = skeleton
                                      ? [
                                          ...savedBlocks.slice(0, pendingBlock!.index),
                                          skeleton,
                                          ...savedBlocks.slice(pendingBlock!.index),
                                        ]
                                      : savedBlocks

                                    // Group the items into rows
                                    type RowInfo = {
                                      startIndex: number
                                      endIndex: number
                                      totalCols: number
                                    }
                                    const rows: RowInfo[] = []
                                    let rStart = 0,
                                      rSum = 0
                                    blocks.forEach((it, i) => {
                                      const cols = it.columns || 12
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
                                                '🔵 CLICK on the insert button - position:',
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
                                                    item.columns === 6
                                                      ? 'md:col-span-6'
                                                      : 'md:col-span-12'
                                                  }`}
                                                >
                                                  <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20 p-6 text-blue-600 dark:text-blue-400">
                                                    <Loader2 className="h-5 w-5 animate-spin" />
                                                    <span className="text-sm font-medium">
                                                      Adicionando {BLOCK_CATALOG[item.type].label}
                                                      ...
                                                    </span>
                                                  </div>
                                                </div>
                                              )
                                            }

                                            return (
                                              <SortableBlockWrapper
                                                key={item.id}
                                                id={item.id}
                                                columns={item.columns}
                                              >
                                                {(dragHandle) => (
                                                  <EditableCard
                                                    flex
                                                    label={blockIdentity(item).label}
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
                                                      <ActivityGradingBadge block={item} />
                                                      {item.type === 'heading' ? (
                                                        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                                                          {item.content}
                                                        </h3>
                                                      ) : item.type === 'subheading' ? (
                                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                                          {item.content}
                                                        </h4>
                                                      ) : item.type === 'flipcard' ? (
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
                                                                {card.frontImage && (
                                                                  <>
                                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                    <img
                                                                      src={card.frontImage}
                                                                      alt=""
                                                                      className="max-h-14 mx-auto object-contain rounded"
                                                                      onError={(e) => {
                                                                        e.currentTarget.style.display =
                                                                          'none'
                                                                      }}
                                                                    />
                                                                  </>
                                                                )}
                                                                {card.frontTitle ? (
                                                                  <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                                                                    {card.frontTitle}
                                                                  </p>
                                                                ) : (
                                                                  !card.frontImage && (
                                                                    <p className="text-xs text-gray-400 italic">
                                                                      Sem conteúdo na frente
                                                                    </p>
                                                                  )
                                                                )}
                                                              </div>
                                                            ))
                                                          )}
                                                        </div>
                                                      ) : item.type === 'accordion' ? (
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
                                                                  {acc.title}
                                                                </span>
                                                                <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                                              </div>
                                                            ))
                                                          )}
                                                        </div>
                                                      ) : item.type === 'image' ? (
                                                        <div className="space-y-2">
                                                          {item.source && (
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                                              Fonte: {item.source}
                                                            </p>
                                                          )}
                                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                                          <img
                                                            src={item.content}
                                                            alt={item.caption || 'Imagem'}
                                                            className={`h-auto object-contain border border-[#e5e7eb] dark:border-gray-700 rounded-md mx-auto ${larguraMaximaImagem(item.size)}`}
                                                            onError={(e) => {
                                                              e.currentTarget.style.display = 'none'
                                                            }}
                                                          />
                                                          {item.caption && (
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 italic text-center">
                                                              {item.caption}
                                                            </p>
                                                          )}
                                                        </div>
                                                      ) : item.type === 'video' ? (
                                                        <div className="space-y-2">
                                                          {item.videoTitle && (
                                                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                              {item.videoTitle}
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
                                                      ) : item.type === 'list' ? (
                                                        <div className="space-y-1">
                                                          {(item.listItems || []).length === 0 ? (
                                                            <p className="text-xs text-gray-400 italic">
                                                              Nenhum item
                                                            </p>
                                                          ) : (
                                                            (item.listItems || []).map(
                                                              (listItem, idx) => (
                                                                <div
                                                                  key={listItem.id || idx}
                                                                  className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                                                                >
                                                                  <span className="shrink-0 mt-0.5">
                                                                    {item.listType === 'ordered' ? (
                                                                      <span className="flex items-center justify-center w-4 h-4 bg-(--block-accent,#2563eb) text-white rounded-full text-xs font-semibold">
                                                                        {idx + 1}
                                                                      </span>
                                                                    ) : item.listType ===
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
                                                                    {listItem.text}
                                                                  </span>
                                                                </div>
                                                              )
                                                            )
                                                          )}
                                                        </div>
                                                      ) : item.type === 'learning-objectives' ? (
                                                        <div className="space-y-1">
                                                          {(item.objectiveItems || []).length ===
                                                          0 ? (
                                                            <p className="text-xs text-gray-400 italic">
                                                              Nenhum objetivo
                                                            </p>
                                                          ) : (
                                                            (item.objectiveItems || []).map(
                                                              (objective, idx) => (
                                                                <div
                                                                  key={objective.id || idx}
                                                                  className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                                                                >
                                                                  <span className="flex items-center justify-center w-5 h-5 bg-(--block-accent,#2563eb)/10 text-(--block-accent,#2563eb) rounded font-semibold text-xs shrink-0">
                                                                    {idx + 1}
                                                                  </span>
                                                                  <span className="line-clamp-2">
                                                                    {objective.text}
                                                                  </span>
                                                                </div>
                                                              )
                                                            )
                                                          )}
                                                        </div>
                                                      ) : item.type === 'quiz' ? (
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
                                                      ) : item.type === 'info-box' ? (
                                                        item.infoBoxType ? (
                                                          <InfoBox
                                                            type={item.infoBoxType}
                                                            title={item.infoBoxTitle}
                                                          >
                                                            <div
                                                              dangerouslySetInnerHTML={{
                                                                __html: item.content || '',
                                                              }}
                                                            />
                                                          </InfoBox>
                                                        ) : null
                                                      ) : item.type === 'paragraph' ? (
                                                        <div
                                                          className={`conteudo-paragrafo text-gray-700 dark:text-gray-300 ${item.alignment === 'center' ? 'text-center' : item.alignment === 'right' ? 'text-right' : item.alignment === 'justify' ? 'text-justify' : 'text-left'}`}
                                                          dangerouslySetInnerHTML={{
                                                            __html: item.content,
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
                              const lastIndex = (unit.blocks || []).length
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
                            <Button onClick={() => handleStartNewBlock('heading', unit.id)}>
                              Título
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStartNewBlock('image', unit.id)}
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
                              onClick={() => handleStartNewBlock('list', unit.id)}
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
              {(state.currentCourse.units || []).length > 0 && (
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
                      disabled={activeUnitIndex >= (state.currentCourse.units || []).length - 1}
                      className="group flex items-center justify-center gap-1 px-8 py-2.5 rounded-lg bg-blue-600 dark:bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-600 dark:disabled:hover:bg-blue-600"
                    >
                      <span className="text-sm font-medium">Próxima</span>
                      <ChevronRight className="h-5 w-5 shrink-0" />
                    </button>
                  </div>
                </div>
              )}

              {(state.currentCourse.units || []).length === 0 && (
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
              Escolha o tipo de conteúdo que você quer incluir na unidade.{' '}
              <a
                href="/blocks"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                Ver exemplos
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
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
              const entries = modalEntriesFor(category.id)

              return (
                <TabsContent key={category.id} value={category.id}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {entries.map((entry) => {
                      const Icon = entry.icon
                      return (
                        <button
                          key={entry.id}
                          onClick={() => {
                            if (insertAtIndex.current) {
                              handleSelectBlockType(
                                entry.type,
                                insertAtIndex.current.unitId,
                                entry.preset
                              )
                            }
                          }}
                          className="flex flex-col items-start p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                            <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
                            {entry.label}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 text-left">
                            {entry.description}
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
          className={`${tempBlock.type === 'quiz' ? 'sm:max-w-4xl max-h-[90vh]' : 'sm:max-w-2xl'}`}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {tempBlock.type === 'heading' ? (
                <>
                  <Heading2 className="h-5 w-5 text-blue-600" />
                  Adicionar Título
                </>
              ) : tempBlock.type === 'subheading' ? (
                <>
                  <Heading3 className="h-5 w-5 text-blue-600" />
                  Adicionar Subtítulo
                </>
              ) : tempBlock.type === 'image' ? (
                <>
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image className="h-5 w-5 text-blue-600" />
                  Adicionar Imagem
                </>
              ) : tempBlock.type === 'accordion' ? (
                <>
                  <ChevronDown className="h-5 w-5 text-blue-600" />
                  Adicionar Accordion
                </>
              ) : tempBlock.type === 'flipcard' ? (
                <>
                  <RotateCcw className="h-5 w-5 text-blue-600" />
                  Adicionar FlipCard
                </>
              ) : tempBlock.type === 'list' ? (
                <>
                  <List className="h-5 w-5 text-blue-600" />
                  Adicionar Lista
                </>
              ) : tempBlock.type === 'quiz' ? (
                <>
                  <HelpCircle className="h-5 w-5 text-blue-600" />
                  Adicionar Quiz
                </>
              ) : tempBlock.type === 'info-box' ? (
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
            {tempBlock.type === 'image' ? (
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
                        value={tempBlock.content}
                        onChange={(e) => {
                          setTempBlock({
                            ...tempBlock,
                            content: e.target.value,
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
                    {(imagePreviewUrl || tempBlock.content) && (
                      <div className="mt-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imagePreviewUrl || tempBlock.content}
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
                    value={tempBlock.size || ''}
                    onChange={(e) =>
                      setTempBlock({
                        ...tempBlock,
                        size: e.target.value as 'small' | 'medium' | 'large',
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Selecione o tamanho</option>
                    <option value="small">Pequena (25%)</option>
                    <option value="medium">Média (50%)</option>
                    <option value="large">Grande (100%)</option>
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
                    value={tempBlock.caption || ''}
                    onChange={(e) =>
                      setTempBlock({
                        ...tempBlock,
                        caption: e.target.value,
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
                    value={tempBlock.source || ''}
                    onChange={(e) =>
                      setTempBlock({
                        ...tempBlock,
                        source: e.target.value,
                      })
                    }
                    placeholder="Digite a fonte da imagem..."
                  />
                </FormField>
              </div>
            ) : tempBlock.type === 'accordion' ? (
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
                              value={item.title}
                              onChange={(e) =>
                                handleUpdateAccordionItem(item.id, 'heading', e.target.value)
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
                              value={item.content}
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
            ) : tempBlock.type === 'flipcard' ? (
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
                    value={tempBlock.frontType || 'heading'}
                    onChange={(e) =>
                      setTempBlock({
                        ...tempBlock,
                        frontType: e.target.value as 'image' | 'image-title' | 'title',
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="image">Apenas Imagem</option>
                    <option value="image-title">Imagem com Título no Rodapé</option>
                    <option value="title">Apenas Título Centralizado</option>
                  </select>
                </FormField>

                {/* Imagem (se necessário) */}
                {(tempBlock.frontType === 'image' || tempBlock.frontType === 'image-title') && (
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
                        value={tempBlock.frontImage || ''}
                        onChange={(e) =>
                          setTempBlock({
                            ...tempBlock,
                            frontImage: e.target.value,
                          })
                        }
                        placeholder="Cole a URL da imagem..."
                      />

                      {/* Preview da Imagem */}
                      {(imagePreviewUrl || tempBlock.frontImage) && (
                        <div className="mt-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imagePreviewUrl || tempBlock.frontImage}
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
                {(tempBlock.frontType === 'image-title' || tempBlock.frontType === 'title') && (
                  <FormField
                    label={
                      <>
                        Título da Frente <span className="text-red-500">*</span>
                      </>
                    }
                  >
                    <Input
                      value={tempBlock.frontTitle || ''}
                      onChange={(e) =>
                        setTempBlock({
                          ...tempBlock,
                          frontTitle: e.target.value,
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
                    value={tempBlock.backContent || ''}
                    onChange={(e) =>
                      setTempBlock({
                        ...tempBlock,
                        backContent: e.target.value,
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
                    value={tempBlock.cardHeight || '300px'}
                    onChange={(e) =>
                      setTempBlock({
                        ...tempBlock,
                        cardHeight: e.target.value,
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
            ) : tempBlock.type === 'list' ? (
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
                    value={tempBlock.listType || 'unordered'}
                    onChange={(e) =>
                      setTempBlock({
                        ...tempBlock,
                        listType: e.target.value as 'ordered' | 'unordered' | 'check',
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="unordered">Não Ordenada (Bullets)</option>
                    <option value="ordered">Ordenada (Numerada)</option>
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

                {tempBlock.listItems && tempBlock.listItems.length > 0 ? (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {tempBlock.listItems.map((item, index) => (
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
                            value={item.text}
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
            ) : tempBlock.type === 'quiz' ? (
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
                              value={question.question}
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
                              value={question.hint || ''}
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
                              {question.options.map((option, index) => (
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
                                          value={option.text}
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
            ) : tempBlock.type === 'info-box' ? (
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
                    value={tempBlock.infoBoxType || 'info'}
                    onChange={(e) =>
                      setTempBlock({
                        ...tempBlock,
                        infoBoxType: e.target.value as
                          | 'warning'
                          | 'learn-more'
                          | 'info'
                          | 'fun-fact',
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="warning">Atenção</option>
                    <option value="learn-more">Saiba mais</option>
                    <option value="info">Informação</option>
                    <option value="fun-fact">Curiosidade</option>
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
                    value={tempBlock.infoBoxTitle || ''}
                    onChange={(e) =>
                      setTempBlock({
                        ...tempBlock,
                        infoBoxTitle: e.target.value,
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
                    value={tempBlock.content}
                    onChange={(e) =>
                      setTempBlock({
                        ...tempBlock,
                        content: e.target.value,
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
                {tempBlock.type === 'paragraph' ? (
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-foreground">Largura da coluna</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setTempBlock({ ...tempBlock, columns: 12 })}
                          className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                            (tempBlock.columns ?? 12) === 12
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                              : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400'
                          }`}
                        >
                          Largura total
                        </button>
                        <button
                          type="button"
                          onClick={() => setTempBlock({ ...tempBlock, columns: 6 })}
                          className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                            tempBlock.columns === 6
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                              : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400'
                          }`}
                        >
                          Meia largura
                        </button>
                      </div>
                    </div>
                    <RichTextEditor
                      value={tempBlock.content}
                      onChange={(html) => setTempBlock({ ...tempBlock, content: html })}
                      placeholder="Digite o parágrafo..."
                      autoFocus
                    />
                  </div>
                ) : (
                  <Input
                    value={tempBlock.content}
                    onChange={(e) =>
                      setTempBlock({
                        ...tempBlock,
                        content: e.target.value,
                      })
                    }
                    placeholder={`Digite o ${
                      tempBlock.type === 'heading' ? 'título' : 'subtítulo'
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
                (tempBlock.type === 'accordion'
                  ? !tempBlock.items ||
                    tempBlock.items.length === 0 ||
                    tempBlock.items.some((item) => !item.title.trim() || !item.content.trim())
                  : tempBlock.type === 'flipcard'
                    ? !tempBlock.frontType ||
                      !tempBlock.backContent?.trim() ||
                      (tempBlock.frontType === 'image' && !tempBlock.frontImage?.trim()) ||
                      (tempBlock.frontType === 'image-title' &&
                        (!tempBlock.frontImage?.trim() || !tempBlock.frontTitle?.trim())) ||
                      (tempBlock.frontType === 'title' && !tempBlock.frontTitle?.trim())
                    : tempBlock.type === 'list'
                      ? !tempBlock.listItems ||
                        tempBlock.listItems.length === 0 ||
                        tempBlock.listItems.some((item) => !item.text.trim())
                      : tempBlock.type === 'quiz'
                        ? !tempBlock.quizData ||
                          !tempBlock.quizData.questions ||
                          tempBlock.quizData.questions.length === 0 ||
                          tempBlock.quizData.questions.some((q) => !q.question.trim()) ||
                          tempBlock.quizData.questions.some(
                            (q) => !q.options || q.options.length !== 5
                          ) ||
                          tempBlock.quizData.questions.some((q) =>
                            q.options.some((option) => !option.text.trim())
                          ) ||
                          tempBlock.quizData.questions.some(
                            (q) => q.options.filter((option) => option.isCorrect).length !== 1
                          ) ||
                          tempBlock.quizData.questions.some((q) =>
                            q.options.some((option) => !option.feedback.trim())
                          )
                        : tempBlock.type === 'info-box'
                          ? !tempBlock.infoBoxType || !tempBlock.content.trim()
                          : !tempBlock.content.trim()) ||
                (tempBlock.type === 'image' &&
                  (!tempBlock.size || !tempBlock.caption || !tempBlock.source))
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
        <SheetContent className="overflow-y-auto">
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

            <TrailBadgeFields
              layout={state.currentCourse?.layout}
              unitIndex={Math.max(
                0,
                state.currentCourse?.units?.findIndex((u) => u.id === unitToEdit) ?? 0
              )}
              name={editingUnitBadgeName}
              icon={editingUnitBadgeIcon}
              onNameChange={setEditingUnitBadgeName}
              onIconChange={setEditingUnitBadgeIcon}
            />
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
      <Dialog open={!!editingBlock && !!editingBlock.type} onOpenChange={closeEditBlockModal}>
        {editingBlock && (
          <DialogContent
            className={`${editingBlock.type === 'quiz' ? 'sm:max-w-4xl max-h-[90vh] overflow-y-auto' : 'sm:max-w-2xl max-h-[90vh] overflow-y-auto'}`}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {editingBlock.type === 'heading' ? (
                  <Heading2 className="h-5 w-5 text-blue-600" />
                ) : editingBlock.type === 'subheading' ? (
                  <Heading3 className="h-5 w-5 text-blue-600" />
                ) : editingBlock.type === 'image' ? (
                  <>
                    {/* eslint-disable-next-line jsx-a11y/alt-text */}
                    <Image className="h-5 w-5 text-blue-600" />
                  </>
                ) : editingBlock.type === 'accordion' ? (
                  <ChevronDown className="h-5 w-5 text-blue-600" />
                ) : editingBlock.type === 'flipcard' ? (
                  <RotateCcw className="h-5 w-5 text-blue-600" />
                ) : editingBlock.type === 'list' ? (
                  <List className="h-5 w-5 text-blue-600" />
                ) : editingBlock.type === 'quiz' ? (
                  <HelpCircle className="h-5 w-5 text-blue-600" />
                ) : editingBlock.type === 'info-box' ? (
                  <AlertTriangle className="h-5 w-5 text-blue-600" />
                ) : (
                  <Type className="h-5 w-5 text-blue-600" />
                )}
                Editar{' '}
                {editingBlock.type === 'heading'
                  ? 'Título'
                  : editingBlock.type === 'subheading'
                    ? 'Subtítulo'
                    : editingBlock.type === 'image'
                      ? 'Imagem'
                      : editingBlock.type === 'accordion'
                        ? 'Accordion'
                        : editingBlock.type === 'flipcard'
                          ? 'FlipCard'
                          : editingBlock.type === 'list'
                            ? 'Lista'
                            : editingBlock.type === 'quiz'
                              ? 'Quiz'
                              : editingBlock.type === 'info-box'
                                ? 'Info Box'
                                : 'Parágrafo'}
              </DialogTitle>
              <DialogDescription>Atualize o conteúdo abaixo</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {editingBlock?.type === 'quiz' ? (
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
                                  question: '',
                                  hint: '',
                                  options: Array.from({ length: 5 }, (_, i) => ({
                                    id: `opcao-${Date.now()}-${i}`,
                                    text: '',
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
                          question: '',
                          hint: '',
                          options: Array.from({ length: 5 }, (_, i) => ({
                            id: `opcao-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 9)}`,
                            text: '',
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
                                value={question.question}
                                onChange={(e) => {
                                  const novasQuestions = editingBlock.quizData?.questions.map(
                                    (q) =>
                                      q.id === question.id ? { ...q, question: e.target.value } : q
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
                                value={question.hint || ''}
                                onChange={(e) => {
                                  const novasQuestions = editingBlock.quizData?.questions.map(
                                    (q) =>
                                      q.id === question.id ? { ...q, hint: e.target.value } : q
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
                                {question.options.map((option, index) => (
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
                                            value={option.text}
                                            onChange={(e) => {
                                              const novasQuestions =
                                                editingBlock.quizData?.questions.map((q) =>
                                                  q.id === question.id
                                                    ? {
                                                        ...q,
                                                        options: q.options.map((opt) =>
                                                          opt.id === option.id
                                                            ? { ...opt, text: e.target.value }
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
                                                        options: q.options.map((opt) =>
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
                                                        options: q.options.map((opt) => ({
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
              ) : editingBlock?.type === 'image' ? (
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
                          value={editingBlock.content}
                          onChange={(e) => {
                            setEditingBlock({
                              ...editingBlock,
                              content: e.target.value,
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
                      {(imagePreviewUrl || editingBlock.content) && (
                        <div className="mt-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imagePreviewUrl || editingBlock.content}
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
                      value={editingBlock.size || ''}
                      onChange={(e) =>
                        setEditingBlock({
                          ...editingBlock,
                          size: e.target.value as 'small' | 'medium' | 'large',
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Selecione o tamanho</option>
                      <option value="small">Pequena (25%)</option>
                      <option value="medium">Média (50%)</option>
                      <option value="large">Grande (100%)</option>
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
                      value={editingBlock.caption || ''}
                      onChange={(e) =>
                        setEditingBlock({
                          ...editingBlock,
                          caption: e.target.value,
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
                      value={editingBlock.source || ''}
                      onChange={(e) =>
                        setEditingBlock({
                          ...editingBlock,
                          source: e.target.value,
                        })
                      }
                      placeholder="Digite a fonte da imagem..."
                    />
                  </FormField>
                </div>
              ) : editingBlock?.type === 'accordion' ? (
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
                            title: '',
                            content: '',
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
                                value={item.title}
                                onChange={(e) => {
                                  if (editingBlock) {
                                    setEditingBlock({
                                      ...editingBlock,
                                      items:
                                        editingBlock.items?.map((i) =>
                                          i.id === item.id ? { ...i, title: e.target.value } : i
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
                                value={item.content}
                                onChange={(e) => {
                                  if (editingBlock) {
                                    setEditingBlock({
                                      ...editingBlock,
                                      items:
                                        editingBlock.items?.map((i) =>
                                          i.id === item.id ? { ...i, content: e.target.value } : i
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
              ) : editingBlock?.type === 'flipcard' ? (
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
                      value={editingBlock.frontType || 'heading'}
                      onChange={(e) =>
                        editingBlock &&
                        setEditingBlock({
                          ...editingBlock,
                          frontType: e.target.value as 'image' | 'image-title' | 'title',
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="image">Apenas Imagem</option>
                      <option value="image-title">Imagem com Título no Rodapé</option>
                      <option value="title">Apenas Título Centralizado</option>
                    </select>
                  </FormField>

                  {/* Imagem (se necessário) */}
                  {(editingBlock.frontType === 'image' ||
                    editingBlock.frontType === 'image-title') && (
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
                          value={editingBlock.frontImage || ''}
                          onChange={(e) =>
                            editingBlock &&
                            setEditingBlock({
                              ...editingBlock,
                              frontImage: e.target.value,
                            })
                          }
                          placeholder="Cole a URL da imagem..."
                        />

                        {/* Preview da Imagem */}
                        {(imagePreviewUrl || editingBlock.frontImage) && (
                          <div className="mt-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imagePreviewUrl || editingBlock.frontImage}
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
                  {(editingBlock.frontType === 'image-title' ||
                    editingBlock.frontType === 'title') && (
                    <FormField
                      label={
                        <>
                          Título da Frente <span className="text-red-500">*</span>
                        </>
                      }
                    >
                      <Input
                        value={editingBlock.frontTitle || ''}
                        onChange={(e) =>
                          editingBlock &&
                          setEditingBlock({
                            ...editingBlock,
                            frontTitle: e.target.value,
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
                      value={editingBlock.backContent || ''}
                      onChange={(e) =>
                        editingBlock &&
                        setEditingBlock({
                          ...editingBlock,
                          backContent: e.target.value,
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
                      value={editingBlock.cardHeight || '300px'}
                      onChange={(e) =>
                        editingBlock &&
                        setEditingBlock({
                          ...editingBlock,
                          cardHeight: e.target.value,
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
              ) : editingBlock?.type === 'list' ? (
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
                      value={editingBlock.listType || 'unordered'}
                      onChange={(e) =>
                        editingBlock &&
                        setEditingBlock({
                          ...editingBlock,
                          listType: e.target.value as 'ordered' | 'unordered' | 'check',
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="unordered">Não Ordenada (Bullets)</option>
                      <option value="ordered">Ordenada (Numerada)</option>
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
                            text: '',
                          }
                          setEditingBlock({
                            ...editingBlock,
                            listItems: [...(editingBlock.listItems || []), newItem],
                          })
                        }
                      }}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Item
                    </Button>
                  </div>

                  {editingBlock.listItems && editingBlock.listItems.length > 0 ? (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {editingBlock.listItems.map((item, index) => (
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
                                    listItems:
                                      editingBlock.listItems?.filter((i) => i.id !== item.id) || [],
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
                              value={item.text}
                              onChange={(e) => {
                                if (editingBlock) {
                                  setEditingBlock({
                                    ...editingBlock,
                                    listItems:
                                      editingBlock.listItems?.map((i) =>
                                        i.id === item.id ? { ...i, text: e.target.value } : i
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
              ) : editingBlock?.type === 'info-box' ? (
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
                      value={editingBlock.infoBoxType || 'info'}
                      onChange={(e) =>
                        editingBlock &&
                        setEditingBlock({
                          ...editingBlock,
                          infoBoxType: e.target.value as
                            | 'warning'
                            | 'learn-more'
                            | 'info'
                            | 'fun-fact',
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="warning">Atenção</option>
                      <option value="learn-more">Saiba mais</option>
                      <option value="info">Informação</option>
                      <option value="fun-fact">Curiosidade</option>
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
                      value={editingBlock.infoBoxTitle || ''}
                      onChange={(e) =>
                        editingBlock &&
                        setEditingBlock({
                          ...editingBlock,
                          infoBoxTitle: e.target.value,
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
                      value={editingBlock.content || ''}
                      onChange={(e) =>
                        editingBlock &&
                        setEditingBlock({
                          ...editingBlock,
                          content: e.target.value,
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
                  {editingBlock?.type === 'paragraph' ? (
                    <RichTextEditor
                      key={editingBlock.blockId}
                      value={editingBlock.content}
                      onChange={(html) =>
                        editingBlock && setEditingBlock({ ...editingBlock, content: html })
                      }
                      placeholder="Digite o parágrafo..."
                    />
                  ) : (
                    <Input
                      value={editingBlock?.content || ''}
                      onChange={(e) =>
                        editingBlock &&
                        setEditingBlock({
                          ...editingBlock,
                          content: e.target.value,
                        })
                      }
                      placeholder={`Digite o ${
                        editingBlock?.type === 'heading' ? 'título' : 'subtítulo'
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
                      editingBlock.type,
                      editingBlock.content || '',
                      editingBlock.size,
                      editingBlock.caption,
                      editingBlock.source,
                      editingBlock.textColor,
                      editingBlock.alignment,
                      editingBlock.columns,
                      editingBlock.items,
                      editingBlock.frontType,
                      editingBlock.frontImage,
                      editingBlock.frontTitle,
                      editingBlock.backContent,
                      editingBlock.cardHeight,
                      editingBlock.listItems,
                      editingBlock.listType,
                      editingBlock.quizData,
                      editingBlock.infoBoxType,
                      editingBlock.infoBoxTitle,
                      editingBlock.videoUrl,
                      editingBlock.videoTitle
                    )
                    closeEditBlockModal()
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={
                  (editingBlock?.type === 'accordion'
                    ? !editingBlock.items ||
                      editingBlock.items.length === 0 ||
                      editingBlock.items.some((item) => !item.title.trim() || !item.content.trim())
                    : editingBlock?.type === 'flipcard'
                      ? !editingBlock.frontType ||
                        !editingBlock.backContent?.trim() ||
                        (editingBlock.frontType === 'image' && !editingBlock.frontImage?.trim()) ||
                        (editingBlock.frontType === 'image-title' &&
                          (!editingBlock.frontImage?.trim() || !editingBlock.frontTitle?.trim())) ||
                        (editingBlock.frontType === 'title' && !editingBlock.frontTitle?.trim())
                      : editingBlock?.type === 'list'
                        ? !editingBlock.listItems ||
                          editingBlock.listItems.length === 0 ||
                          editingBlock.listItems.some((item) => !item.text.trim())
                        : editingBlock?.type === 'quiz'
                          ? !editingBlock.quizData ||
                            !editingBlock.quizData.questions ||
                            editingBlock.quizData.questions.length === 0 ||
                            editingBlock.quizData.questions.some((q) => !q.question.trim()) ||
                            editingBlock.quizData.questions.some(
                              (q) => !q.options || q.options.length !== 5
                            ) ||
                            editingBlock.quizData.questions.some((q) =>
                              q.options.some((option) => !option.text.trim())
                            ) ||
                            editingBlock.quizData.questions.some(
                              (q) => q.options.filter((option) => option.isCorrect).length !== 1
                            ) ||
                            editingBlock.quizData.questions.some((q) =>
                              q.options.some((option) => !option.feedback.trim())
                            )
                          : editingBlock?.type === 'info-box'
                            ? !editingBlock.infoBoxType || !editingBlock.content?.trim()
                            : !editingBlock?.content?.trim()) ||
                  (editingBlock?.type === 'image' &&
                    (!editingBlock.size || !editingBlock.caption || !editingBlock.source))
                }
              >
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Modal de Exportação */}
      {exportModalMounted && (
        <ExportModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          onExportPDF={async (filename) => {
            try {
              await generatePDF(state.currentCourse!, filename)
              setExportModalOpen(false)
            } catch (error) {
              // Erro já foi tratado no hook, modal permanece aberto
              console.error('PDF generation failed:', error)
            }
          }}
          onExportSCORM={async (filename) => {
            try {
              console.log('🔄 [Export] Starting the SCORM export...')
              console.log('📦 [Export] Current course:', state.currentCourse)
              console.log('📝 [Export] Filename:', filename)

              if (state.currentCourse) {
                console.log('✅ [Export] Course found, calling generateSCORM...')
                await generateSCORM(state.currentCourse, filename)
                console.log('✅ [Export] generateSCORM finished')
                setExportModalOpen(false)
              } else {
                console.error('❌ [Export] state.currentCourse is null/undefined')
                toast.error('Erro: Curso não encontrado')
              }
            } catch (error) {
              // Erro já foi tratado no hook, modal permanece aberto
              console.error('❌ [Export] SCORM generation failed:', error)
            }
          }}
          courseName={state.currentCourse?.title || 'Curso'}
          courseId={state.currentCourse?.id}
          isGeneratingPDF={isGeneratingPDF}
          isGeneratingSCORM={isGeneratingSCORM}
        />
      )}

      {/* Course Settings Drawer */}
      {settingsDrawerMounted && (
        <CourseSettingsDrawer
          courseId={state.currentCourse.id}
          canManageCollaborators={state.currentCourse.permissions?.canManageCollaborators ?? false}
          open={settingsDrawerOpen}
          onOpenChange={setSettingsDrawerOpen}
          courseData={{
            title: state.currentCourse.title,
            description: state.currentCourse.description || '',
            category: state.currentCourse.category || undefined,
            workload: state.currentCourse.workload,
            layout: state.currentCourse.layout,
            bannerVideoUrl: state.currentCourse.bannerVideoUrl,
          }}
          units={state.currentCourse.units || []}
          onSave={async (courseData, units) => {
            if (state.currentCourse) {
              await updateCourse(state.currentCourse.id, {
                title: courseData.title,
                description: courseData.description,
                category: courseData.category || '',
                workload: courseData.workload,
                layout: courseData.layout,
                bannerVideoUrl: courseData.bannerVideoUrl ?? '',
              })
              await reorderUnits(units as Unit[])
            }
          }}
        />
      )}

      {/* Manage Units Modal */}
      {manageUnitsModalMounted && (
        <ManageUnitsModal
          open={manageUnitsModalOpen}
          onOpenChange={setManageUnitsModalOpen}
          units={state.currentCourse.units || []}
        />
      )}

      {contentDrawerMounted && (
        <ContentBlockDrawer
          open={contentDrawerOpen}
          onOpenChange={setContentDrawerOpen}
          mode={contentDrawerMode}
          blockData={contentDrawerBlockData}
          onSave={handleSaveContentFromDrawer}
          onCancel={handleCancelContentDrawer}
        />
      )}
    </div>
  )
}

const BlockPreview = React.memo(function BlockPreview({ item }: { item: Block }) {
  const BlockComponent = blockRegistry[item.type]
  if (!BlockComponent) return null

  return (
    <div className="pointer-events-none">
      <BlockComponent item={item} />
    </div>
  )
})

export default function EditCoursePage() {
  const params = useParams()
  const courseId = (params?.id as string | undefined) ?? ''

  return (
    <CollabProvider courseId={courseId}>
      <CourseEditor />
    </CollabProvider>
  )
}
