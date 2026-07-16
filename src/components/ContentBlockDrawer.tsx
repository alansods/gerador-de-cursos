'use client'

import React, { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  Heading2,
  Heading3,
  Type,
  Image as ImageIcon,
  List,
  AlertTriangle,
  RotateCcw,
  ChevronDown,
  HelpCircle,
  Upload,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react'
import Image from 'next/image'
import { ConteudoUnidade, AccordionItem, ListaItem } from '@/types/gerador-curso'
import { RichTextEditor } from './RichTextEditor'
import { toast } from 'sonner'

interface ContentBlockDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'add' | 'edit'
  blockData: Partial<ConteudoUnidade> | null
  onSave: (data: Omit<ConteudoUnidade, 'id' | 'ordem'>) => void
  onCancel: () => void
  onUploadImage?: (file: File, forFlipcard?: boolean) => Promise<string>
}

const getBlockTitle = (tipo: ConteudoUnidade['tipo'] | null, mode: 'add' | 'edit'): string => {
  const action = mode === 'add' ? 'Adicionar' : 'Editar'
  if (!tipo) return 'Adicionar conteúdo'

  const titles: Record<ConteudoUnidade['tipo'], string> = {
    titulo: `${action} Título`,
    subtitulo: `${action} Subtítulo`,
    paragrafo: `${action} Texto`,
    imagem: `${action} Imagem`,
    lista: `${action} Lista`,
    'info-box': `${action} Destaque`,
    flipcard: `${action} Flashcards`,
    accordion: `${action} Sanfona`,
    quiz: `${action} Quiz`,
  }
  return titles[tipo]
}

const getBlockIcon = (tipo: ConteudoUnidade['tipo'] | null) => {
  if (!tipo) return null
  const icons: Record<ConteudoUnidade['tipo'], React.ElementType> = {
    titulo: Heading2,
    subtitulo: Heading3,
    paragrafo: Type,
    imagem: ImageIcon,
    lista: List,
    'info-box': AlertTriangle,
    flipcard: RotateCcw,
    accordion: ChevronDown,
    quiz: HelpCircle,
  }
  return icons[tipo]
}

export function ContentBlockDrawer({
  open,
  onOpenChange,
  mode,
  blockData,
  onSave,
  onCancel,
  onUploadImage,
}: ContentBlockDrawerProps) {
  const [selectedType, setSelectedType] = useState<ConteudoUnidade['tipo'] | null>(
    blockData?.tipo || null
  )
  const [formData, setFormData] = useState<Partial<ConteudoUnidade>>({
    tipo: 'paragrafo',
    conteudo: '',
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
    tipoLista: 'nao-ordenada',
    quizData: undefined,
    tipoInfoBox: 'info',
    tituloInfoBox: '',
    ...blockData,
  })
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setSelectedType(blockData?.tipo || null)
      setFormData({
        tipo: 'paragrafo',
        conteudo: '',
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
        tipoLista: 'nao-ordenada',
        quizData: undefined,
        tipoInfoBox: 'info',
        tituloInfoBox: '',
        ...blockData,
      })
      if (blockData?.conteudo && blockData?.tipo === 'imagem') {
        setImagePreviewUrl(blockData.conteudo)
      }
    }
  }, [open, blockData])

  const handleSave = () => {
    if (!selectedType) return

    if (!validateForm()) return

    onSave(formData as Omit<ConteudoUnidade, 'id' | 'ordem'>)
    onOpenChange(false)
  }

  const handleCancel = () => {
    setSelectedType(null)
    setFormData({
      tipo: 'paragrafo',
      conteudo: '',
      tamanho: 'media',
      legenda: '',
      fonte: '',
    })
    setImagePreviewUrl(null)
    onCancel()
  }

  const validateForm = (): boolean => {
    if (!selectedType) return false

    switch (selectedType) {
      case 'titulo':
      case 'subtitulo':
      case 'paragrafo':
        if (!formData.conteudo?.trim()) {
          toast.error('Preencha o conteúdo')
          return false
        }
        break
      case 'imagem':
        if (!formData.conteudo?.trim()) {
          toast.error('Adicione uma imagem')
          return false
        }
        if (!formData.tamanho) {
          toast.error('Selecione o tamanho da imagem')
          return false
        }
        if (!formData.legenda?.trim()) {
          toast.error('Adicione uma legenda')
          return false
        }
        if (!formData.fonte?.trim()) {
          toast.error('Adicione a fonte da imagem')
          return false
        }
        break
      case 'accordion':
        if (!formData.items || formData.items.length === 0) {
          toast.error('Adicione pelo menos um item ao accordion')
          return false
        }
        if (formData.items.some((item) => !item.titulo.trim() || !item.conteudo.trim())) {
          toast.error('Todos os itens devem ter título e conteúdo')
          return false
        }
        break
      case 'flipcard':
        if (!formData.tipoFrente) {
          toast.error('Selecione o tipo de frente do flipcard')
          return false
        }
        if (formData.tipoFrente === 'imagem' && !formData.imagemFrente?.trim()) {
          toast.error('Adicione uma imagem para a frente do flipcard')
          return false
        }
        if (
          formData.tipoFrente === 'imagem-titulo' &&
          (!formData.imagemFrente?.trim() || !formData.tituloFrente?.trim())
        ) {
          toast.error('Adicione uma imagem e um título para a frente do flipcard')
          return false
        }
        if (formData.tipoFrente === 'titulo' && !formData.tituloFrente?.trim()) {
          toast.error('Adicione um título para a frente do flipcard')
          return false
        }
        if (!formData.conteudoVerso?.trim()) {
          toast.error('Adicione o conteúdo do verso do flipcard')
          return false
        }
        break
      case 'lista':
        if (!formData.itensLista || formData.itensLista.length === 0) {
          toast.error('Adicione pelo menos um item à lista')
          return false
        }
        if (formData.itensLista.some((item) => !item.texto.trim())) {
          toast.error('Todos os itens devem ter texto')
          return false
        }
        break
      case 'quiz':
        if (
          !formData.quizData ||
          !formData.quizData.questions ||
          formData.quizData.questions.length === 0
        ) {
          toast.error('O quiz deve ter pelo menos uma pergunta')
          return false
        }
        break
      case 'info-box':
        if (!formData.conteudo?.trim()) {
          toast.error('Preencha o conteúdo do destaque')
          return false
        }
        break
    }
    return true
  }

  const handleUploadImage = async (file: File, forFlipcard: boolean = false) => {
    if (!onUploadImage) {
      toast.error('Upload de imagem não configurado')
      return
    }

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

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Máximo: 10MB')
      return
    }

    setIsUploadingImage(true)
    setImagePreviewUrl(null)

    try {
      const url = await onUploadImage(file, forFlipcard)

      if (forFlipcard) {
        setFormData({ ...formData, imagemFrente: url })
      } else {
        setFormData({ ...formData, conteudo: url })
      }

      setImagePreviewUrl(url)
      toast.success('Imagem enviada')
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      toast.error('Erro ao enviar imagem')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleAddAccordionItem = () => {
    const newItem: AccordionItem = {
      id: `accordion-item-${Date.now()}`,
      titulo: '',
      conteudo: '',
    }
    setFormData({
      ...formData,
      items: [...(formData.items || []), newItem],
    })
  }

  const handleRemoveAccordionItem = (id: string) => {
    setFormData({
      ...formData,
      items: formData.items?.filter((item) => item.id !== id),
    })
  }

  const handleUpdateAccordionItem = (id: string, field: 'titulo' | 'conteudo', value: string) => {
    setFormData({
      ...formData,
      items: formData.items?.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    })
  }

  const handleAddListItem = () => {
    const newItem: ListaItem = {
      id: `list-item-${Date.now()}`,
      texto: '',
    }
    setFormData({
      ...formData,
      itensLista: [...(formData.itensLista || []), newItem],
    })
  }

  const handleRemoveListItem = (id: string) => {
    setFormData({
      ...formData,
      itensLista: formData.itensLista?.filter((item) => item.id !== id),
    })
  }

  const handleUpdateListItem = (id: string, value: string) => {
    setFormData({
      ...formData,
      itensLista: formData.itensLista?.map((item) =>
        item.id === id ? { ...item, texto: value } : item
      ),
    })
  }

  const renderForm = () => {
    if (!selectedType) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Nenhum tipo de conteúdo selecionado</p>
        </div>
      )
    }

    const commonInputClass =
      'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'

    switch (selectedType) {
      case 'titulo':
      case 'subtitulo':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Conteúdo <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.conteudo || ''}
                onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                placeholder={`Digite o ${selectedType === 'titulo' ? 'título' : 'subtítulo'}...`}
                autoFocus
              />
            </div>
          </div>
        )

      case 'paragrafo':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Conteúdo <span className="text-red-500">*</span>
              </label>
              <RichTextEditor
                value={formData.conteudo || ''}
                onChange={(value) => setFormData({ ...formData, conteudo: value })}
                placeholder="Digite o texto..."
                autoFocus
              />
            </div>
          </div>
        )

      case 'imagem':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Imagem <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
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
                        if (file) handleUploadImage(file)
                      }}
                      disabled={isUploadingImage}
                    />
                  </label>
                </div>

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

                <div>
                  <Input
                    value={formData.conteudo || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, conteudo: e.target.value })
                      if (e.target.value.startsWith('http')) {
                        setImagePreviewUrl(e.target.value)
                      } else {
                        setImagePreviewUrl(null)
                      }
                    }}
                    placeholder="Cole a URL da imagem..."
                  />
                </div>

                {(imagePreviewUrl || formData.conteudo) && (
                  <div className="mt-3 flex justify-center">
                    <Image
                      src={imagePreviewUrl || formData.conteudo || ''}
                      alt="Preview"
                      width={300}
                      height={160}
                      className="h-auto rounded-lg border border-gray-300 dark:border-gray-600 max-h-40 object-contain bg-gray-50 dark:bg-gray-800"
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
                value={formData.tamanho || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tamanho: e.target.value as 'pequena' | 'media' | 'grande',
                  })
                }
                className={commonInputClass}
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
                value={formData.legenda || ''}
                onChange={(e) => setFormData({ ...formData, legenda: e.target.value })}
                placeholder="Digite a legenda da imagem..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fonte <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.fonte || ''}
                onChange={(e) => setFormData({ ...formData, fonte: e.target.value })}
                placeholder="Digite a fonte da imagem..."
              />
            </div>
          </div>
        )

      case 'accordion':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Itens do Accordion <span className="text-red-500">*</span>
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddAccordionItem}
                className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/20"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Item
              </Button>
            </div>

            {formData.items && formData.items.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {formData.items.map((item, index) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Item {index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAccordionItem(item.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Título <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={item.titulo}
                          onChange={(e) =>
                            handleUpdateAccordionItem(item.id, 'titulo', e.target.value)
                          }
                          placeholder="Título do item..."
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Conteúdo <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={item.conteudo}
                          onChange={(e) =>
                            handleUpdateAccordionItem(item.id, 'conteudo', e.target.value)
                          }
                          placeholder="Conteúdo do item..."
                          className={`${commonInputClass} resize-none text-sm`}
                          rows={3}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <p>Nenhum item adicionado ainda.</p>
                <p className="text-xs mt-1">Clique em &quot;Adicionar Item&quot; para começar.</p>
              </div>
            )}
          </div>
        )

      case 'lista':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Lista <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.tipoLista || 'nao-ordenada'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tipoLista: e.target.value as 'ordenada' | 'nao-ordenada' | 'check',
                  })
                }
                className={commonInputClass}
              >
                <option value="nao-ordenada">Não Ordenada (Bullets)</option>
                <option value="ordenada">Ordenada (Numerada)</option>
                <option value="check">Com Check</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Itens da Lista <span className="text-red-500">*</span>
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddListItem}
                className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/20"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Item
              </Button>
            </div>

            {formData.itensLista && formData.itensLista.length > 0 ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {formData.itensLista.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-6">
                      {index + 1}.
                    </span>
                    <Input
                      value={item.texto}
                      onChange={(e) => handleUpdateListItem(item.id, e.target.value)}
                      placeholder="Texto do item..."
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveListItem(item.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <p>Nenhum item adicionado ainda.</p>
                <p className="text-xs mt-1">Clique em &quot;Adicionar Item&quot; para começar.</p>
              </div>
            )}
          </div>
        )

      case 'info-box':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Destaque <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.tipoInfoBox || 'info'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tipoInfoBox: e.target.value as
                      | 'atencao'
                      | 'saiba_mais'
                      | 'info'
                      | 'curiosidade',
                  })
                }
                className={commonInputClass}
              >
                <option value="info">Informação</option>
                <option value="atencao">Atenção</option>
                <option value="saiba_mais">Saiba Mais</option>
                <option value="curiosidade">Curiosidade</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Título (opcional)
              </label>
              <Input
                value={formData.tituloInfoBox || ''}
                onChange={(e) => setFormData({ ...formData, tituloInfoBox: e.target.value })}
                placeholder="Digite o título..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Conteúdo <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.conteudo || ''}
                onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                placeholder="Digite o conteúdo do destaque..."
                className={`${commonInputClass} resize-none`}
                rows={6}
              />
            </div>
          </div>
        )

      case 'quiz':
        return (
          <div className="space-y-4">
            <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <HelpCircle className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Edição de Quiz
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                A edição de quiz ainda não foi migrada para o drawer. Por favor, use o modal
                temporariamente para criar/editar quizzes.
              </p>
            </div>
          </div>
        )

      case 'flipcard':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Frente <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.tipoFrente || 'titulo'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tipoFrente: e.target.value as 'imagem' | 'imagem-titulo' | 'titulo',
                  })
                }
                className={commonInputClass}
              >
                <option value="imagem">Apenas Imagem</option>
                <option value="imagem-titulo">Imagem com Título no Rodapé</option>
                <option value="titulo">Apenas Título Centralizado</option>
              </select>
            </div>

            {(formData.tipoFrente === 'imagem' || formData.tipoFrente === 'imagem-titulo') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Imagem da Frente <span className="text-red-500">*</span>
                </label>
                <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors bg-gray-50 dark:bg-gray-800">
                  {isUploadingImage ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Enviando...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Clique para fazer upload
                      </span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleUploadImage(file, true)
                    }}
                    disabled={isUploadingImage}
                  />
                </label>
              </div>
            )}

            {(formData.tipoFrente === 'titulo' || formData.tipoFrente === 'imagem-titulo') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título da Frente <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.tituloFrente || ''}
                  onChange={(e) => setFormData({ ...formData, tituloFrente: e.target.value })}
                  placeholder="Digite o título..."
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Conteúdo do Verso <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.conteudoVerso || ''}
                onChange={(e) => setFormData({ ...formData, conteudoVerso: e.target.value })}
                placeholder="Digite o conteúdo do verso..."
                className={`${commonInputClass} resize-none`}
                rows={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Altura do Card
              </label>
              <Input
                value={formData.alturaCard || '300px'}
                onChange={(e) => setFormData({ ...formData, alturaCard: e.target.value })}
                placeholder="Ex: 300px, 20vh"
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const Icon = getBlockIcon(selectedType)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col p-0 !w-[480px] !max-w-[480px]">
        <SheetHeader className="pb-4 border-b border-gray-200 dark:border-gray-700 px-6 pt-6">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {mode === 'add' ? 'ADICIONAR' : 'EDITAR'}
              </p>
              <SheetTitle className="text-xl">{getBlockTitle(selectedType, mode)}</SheetTitle>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6">{renderForm()}</div>

        <SheetFooter className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          {selectedType && (
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              Salvar
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
