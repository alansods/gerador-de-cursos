'use client'

import React, { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  HelpCircle,
  Upload,
  Loader2,
  Plus,
  Trash2,
  GalleryHorizontal,
  LayoutGrid,
} from 'lucide-react'
import Image from 'next/image'
import { Block, AccordionItem, ListItem, CategoryItem, HotspotItem } from '@/types/course'
import { BLOCK_CATALOG, cardsFlipcard, createEmptyBlock, videoSource } from '@/lib/blocks'
import { MEDIA_POLICY, type MediaCategory } from '@/lib/media'
import { uploadFile } from '@/lib/client-upload'
import { extractYouTubeId } from '@/lib/youtube'
import { RichTextEditor } from './RichTextEditor'
import { toast } from 'sonner'

interface ContentBlockDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'add' | 'edit'
  blockData: Partial<Block> | null
  onSave: (data: Omit<Block, 'id' | 'ordem'>) => void
  onCancel: () => void
}

function prepareForm(blockData: Partial<Block> | null): Partial<Block> {
  const form: Partial<Block> = {
    ...createEmptyBlock(blockData?.tipo || 'paragrafo'),
    ...blockData,
  }

  // Bloco salvo antes de `fonteVideo` existir abriria com o seletor na fonte errada.
  if (form.tipo === 'video' || form.tipo === 'video-interativo') {
    form.fonteVideo = videoSource(form, form.tipo === 'video' ? 'youtube' : 'arquivo')
  }

  if (form.tipo === 'flipcard') {
    form.itensFlipcard = cardsFlipcard(form)
    delete form.tipoFrente
    delete form.imagemFrente
    delete form.tituloFrente
    delete form.conteudoVerso
  }

  return form
}

const BLOCK_WIDTHS: { columns: 6 | 12; label: string }[] = [
  { columns: 12, label: 'Largura total' },
  { columns: 6, label: 'Meia largura' },
]

const CAROUSEL_DISPLAY_MODES: {
  value: NonNullable<Block['modoCarrossel']>
  label: string
  icon: typeof GalleryHorizontal
}[] = [
  { value: 'carrossel', label: 'Carrossel', icon: GalleryHorizontal },
  { value: 'grade', label: 'Grade', icon: LayoutGrid },
]

function FileField({
  category,
  label,
  url,
  onUrl,
  placeholderUrl = 'ou cole a URL aqui...',
  hint,
}: {
  category: MediaCategory
  label: string
  url: string
  onUrl: (url: string) => void
  placeholderUrl?: string
  hint?: React.ReactNode
}) {
  const [sending, setSending] = useState(false)
  const [previewBroken, setPreviewBroken] = useState(false)
  const fileInput = React.useRef<HTMLInputElement>(null)
  const policy = MEDIA_POLICY[category]

  useEffect(() => {
    setPreviewBroken(false)
  }, [url])

  const onSelect = async (file: File) => {
    setSending(true)
    try {
      const { url: uploaded, warning } = await uploadFile(file, category)
      onUrl(uploaded)
      if (warning) toast.warning(warning)
      else toast.success(`${policy.label} enviado`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar o arquivo')
    } finally {
      setSending(false)
    }
  }

  return (
    <FormField
      label={
        <>
          {label} <span className="text-destructive">*</span>
        </>
      }
    >
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={sending}
          onClick={() => fileInput.current?.click()}
        >
          {sending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          {sending ? 'Enviando...' : 'Escolher arquivo'}
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept={policy.extensions}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onSelect(file)
            e.target.value = ''
          }}
        />
      </div>

      <Input
        value={url}
        onChange={(e) => onUrl(e.target.value)}
        placeholder={placeholderUrl}
        className="text-sm"
      />

      {category === 'image' && url && !previewBroken && (
        <img
          src={url}
          alt=""
          onError={() => setPreviewBroken(true)}
          className="max-h-40 w-auto rounded-md border border-border object-contain"
        />
      )}

      <p className="text-xs text-muted-foreground">{hint ?? policy.sizeHint}</p>
    </FormField>
  )
}

interface FieldConfig<T> {
  key: keyof T & string
  label: string
  required?: boolean
  placeholder?: string
  type?: 'text' | 'multiline' | 'select' | 'image'
  options?: { value: string; label: string }[]
  visibleIf?: (item: T) => boolean
}

function ItemField<T>({ field, children }: { field: FieldConfig<T>; children: React.ReactNode }) {
  if (field.type === 'image') return <>{children}</>

  return (
    <FormField
      compact
      label={
        <>
          {field.label}
          {field.required && <span className="text-destructive"> *</span>}
        </>
      }
    >
      {children}
    </FormField>
  )
}

function ItemEditor<T extends { id: string }>({
  label,
  itemLabel,
  items,
  fields,
  createItem,
  onChange,
  emptyText: empty,
}: {
  label: string
  itemLabel: string
  items: T[]
  fields: FieldConfig<T>[]
  createItem: () => T
  onChange: (items: T[]) => void
  emptyText: string
}) {
  const update = (id: string, key: string, value: string) =>
    onChange(items.map((item) => (item.id === id ? { ...item, [key]: value } : item)))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          {label} <span className="text-destructive">*</span>
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...items, createItem()])}
          className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/20"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar
        </Button>
      </div>

      {items.length > 0 ? (
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {items.map((item, index) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {itemLabel} {index + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange(items.filter((another) => another.id !== item.id))}
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3">
                {fields
                  .filter((field) => !field.visibleIf || field.visibleIf(item))
                  .map((field) => (
                    <ItemField key={field.key} field={field}>
                      {field.type === 'multiline' ? (
                        <Textarea
                          value={String(item[field.key] ?? '')}
                          onChange={(e) => update(item.id, field.key, e.target.value)}
                          placeholder={field.placeholder}
                          rows={3}
                          className="text-sm"
                        />
                      ) : field.type === 'select' ? (
                        <Select
                          value={String(item[field.key] ?? '')}
                          onValueChange={(value) => update(item.id, field.key, value)}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(field.options ?? []).map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : field.type === 'image' ? (
                        <FileField
                          category="image"
                          label={field.label}
                          url={String(item[field.key] ?? '')}
                          onUrl={(url) => update(item.id, field.key, url)}
                        />
                      ) : (
                        <Input
                          value={String(item[field.key] ?? '')}
                          onChange={(e) => update(item.id, field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="text-sm"
                        />
                      )}
                    </ItemField>
                  ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">{empty}</p>
      )}
    </div>
  )
}

function CategoryEditor({
  categories,
  onChange,
}: {
  categories: CategoryItem[]
  onChange: (categories: CategoryItem[]) => void
}) {
  const update = (id: string, change: Partial<CategoryItem>) =>
    onChange(categories.map((c) => (c.id === id ? { ...c, ...change } : c)))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          Categorias <span className="text-destructive">*</span>
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onChange([...categories, { id: `cat-${Date.now()}`, nome: '', itens: [] }])
          }
          className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/20"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar
        </Button>
      </div>

      {categories.length > 0 ? (
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {categories.map((category, index) => (
            <Card key={category.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Categoria {index + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange(categories.filter((other) => other.id !== category.id))}
                  className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <Input
                value={category.nome}
                onChange={(e) => update(category.id, { nome: e.target.value })}
                placeholder="Nome da categoria..."
                className="text-sm"
              />

              <div className="mt-3 space-y-2">
                {category.itens.map((input) => (
                  <div key={input.id} className="flex items-center gap-2">
                    <Input
                      value={input.texto}
                      onChange={(e) =>
                        update(category.id, {
                          itens: category.itens.map((another) =>
                            another.id === input.id
                              ? { ...another, texto: e.target.value }
                              : another
                          ),
                        })
                      }
                      placeholder="Item desta categoria..."
                      className="text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        update(category.id, {
                          itens: category.itens.filter((another) => another.id !== input.id),
                        })
                      }
                      className="text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    update(category.id, {
                      itens: [...category.itens, { id: `item-${Date.now()}`, texto: '' }],
                    })
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar item
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          Nenhuma categoria adicionada ainda.
        </p>
      )}
    </div>
  )
}

function HotspotEditor({
  baseImage,
  hotspots,
  onChange,
}: {
  baseImage: string
  hotspots: HotspotItem[]
  onChange: (hotspots: HotspotItem[]) => void
}) {
  const update = (id: string, change: Partial<HotspotItem>) =>
    onChange(hotspots.map((h) => (h.id === id ? { ...h, ...change } : h)))

  const addOnClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const area = event.currentTarget.getBoundingClientRect()
    const x = Math.round(((event.clientX - area.left) / area.width) * 100)
    const y = Math.round(((event.clientY - area.top) / area.height) * 100)
    onChange([...hotspots, { id: `hotspot-${Date.now()}`, x, y, titulo: '', conteudo: '' }])
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            Pontos <span className="text-destructive">*</span>
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onChange([
                ...hotspots,
                { id: `hotspot-${Date.now()}`, x: 50, y: 50, titulo: '', conteudo: '' },
              ])
            }
            className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>
        {baseImage ? (
          <>
            <div
              onClick={addOnClick}
              className="relative inline-block max-w-full cursor-crosshair rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <img src={baseImage} alt="" className="max-w-full h-auto rounded-lg" />
              {hotspots.map((hotspot, index) => (
                <span
                  key={hotspot.id}
                  style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                  className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-xs font-bold text-white shadow"
                >
                  {index + 1}
                </span>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Clique sobre a imagem para adicionar um ponto, ou use os campos de posição de cada
              ponto abaixo.
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            Envie a imagem de fundo para posicionar os pontos.
          </p>
        )}
      </div>

      {hotspots.length > 0 && (
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {hotspots.map((hotspot, index) => (
            <Card key={hotspot.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Ponto {index + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange(hotspots.filter((another) => another.id !== hotspot.id))}
                  className="text-red-600 dark:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {(['x', 'y'] as const).map((axis) => (
                    <FormField
                      key={axis}
                      compact
                      label={axis === 'x' ? 'Horizontal (%)' : 'Vertical (%)'}
                      htmlFor={`${hotspot.id}-${axis}`}
                    >
                      <Input
                        id={`${hotspot.id}-${axis}`}
                        type="number"
                        min={0}
                        max={100}
                        value={hotspot[axis]}
                        onChange={(e) =>
                          update(hotspot.id, {
                            [axis]: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                          })
                        }
                        className="text-sm"
                      />
                    </FormField>
                  ))}
                </div>

                <Input
                  value={hotspot.titulo}
                  onChange={(e) => update(hotspot.id, { titulo: e.target.value })}
                  placeholder="Título do ponto..."
                  className="text-sm"
                />
                <Textarea
                  value={hotspot.conteudo}
                  onChange={(e) => update(hotspot.id, { conteudo: e.target.value })}
                  placeholder="Descrição exibida ao clicar..."
                  rows={3}
                  className="text-sm"
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export function ContentBlockDrawer({
  open,
  onOpenChange,
  mode,
  blockData,
  onSave,
  onCancel,
}: ContentBlockDrawerProps) {
  const [selectedType, setSelectedType] = useState<Block['tipo'] | null>(blockData?.tipo || null)

  const [formData, setFormData] = useState<Partial<Block>>(prepareForm(blockData))
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setSelectedType(blockData?.tipo || null)
      setFormData(prepareForm(blockData))
      if (blockData?.conteudo && blockData?.tipo === 'imagem') {
        setImagePreviewUrl(blockData.conteudo)
      }
    }
  }, [open, blockData])

  const handleSave = () => {
    if (!selectedType) return

    if (!validateForm()) return

    onSave(formData as Omit<Block, 'id' | 'ordem'>)
    onOpenChange(false)
  }

  const handleCancel = () => {
    setSelectedType(null)
    setFormData(createEmptyBlock('paragrafo'))
    setImagePreviewUrl(null)
    onCancel()
  }

  const validateForm = (): boolean => {
    if (!selectedType) return false

    const error = BLOCK_CATALOG[selectedType].validateForm(formData)
    if (error) {
      toast.error(error)
      return false
    }
    return true
  }

  const handleUploadImage = async (file: File) => {
    setIsUploadingImage(true)
    setImagePreviewUrl(null)

    try {
      const { url, warning } = await uploadFile(file, 'image')

      setFormData({ ...formData, conteudo: url })
      setImagePreviewUrl(url)
      if (warning) toast.warning(warning)
      else toast.success('Imagem enviada')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar imagem')
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
    const newItem: ListItem = {
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

  const handleAddObjective = () => {
    const newItem: ListItem = {
      id: `objetivo-${Date.now()}`,
      texto: '',
    }
    setFormData({
      ...formData,
      itensObjetivos: [...(formData.itensObjetivos || []), newItem],
    })
  }

  const handleRemoveObjective = (id: string) => {
    setFormData({
      ...formData,
      itensObjetivos: formData.itensObjetivos?.filter((item) => item.id !== id),
    })
  }

  const handleUpdateObjective = (id: string, value: string) => {
    setFormData({
      ...formData,
      itensObjetivos: formData.itensObjetivos?.map((item) =>
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

    switch (selectedType) {
      case 'titulo':
      case 'subtitulo':
        return (
          <div className="space-y-4">
            <FormField
              label={
                <>
                  Conteúdo <span className="text-red-500">*</span>
                </>
              }
            >
              <Input
                value={formData.conteudo || ''}
                onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                placeholder={`Digite o ${selectedType === 'titulo' ? 'título' : 'subtítulo'}...`}
                autoFocus
              />
            </FormField>
          </div>
        )

      case 'paragrafo':
        return (
          <div className="space-y-4">
            <FormField
              label={
                <>
                  Conteúdo <span className="text-red-500">*</span>
                </>
              }
            >
              <RichTextEditor
                value={formData.conteudo || ''}
                onChange={(value) => setFormData({ ...formData, conteudo: value })}
                placeholder="Digite o texto..."
                autoFocus
              />
            </FormField>
          </div>
        )

      case 'imagem':
        return (
          <div className="space-y-4">
            <FormField
              label={
                <>
                  Imagem <span className="text-red-500">*</span>
                </>
              }
            >
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
            </FormField>

            <FormField
              label={
                <>
                  Tamanho da Imagem <span className="text-red-500">*</span>
                </>
              }
            >
              <Select
                value={formData.tamanho || ''}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    tamanho: value as 'pequena' | 'media' | 'grande',
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o tamanho" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pequena">Pequena (25%)</SelectItem>
                  <SelectItem value="media">Média (50%)</SelectItem>
                  <SelectItem value="grande">Grande (100%)</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField
              label={
                <>
                  Legenda <span className="text-red-500">*</span>
                </>
              }
            >
              <Input
                value={formData.legenda || ''}
                onChange={(e) => setFormData({ ...formData, legenda: e.target.value })}
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
                value={formData.fonte || ''}
                onChange={(e) => setFormData({ ...formData, fonte: e.target.value })}
                placeholder="Digite a fonte da imagem..."
              />
            </FormField>
          </div>
        )

      case 'video': {
        // Sem seletor de fonte: enviar arquivo e colar link são o mesmo campo, e a URL
        // é que diz qual player usar.
        const fromFile = videoSource(formData, 'youtube') === 'arquivo'

        return (
          <div className="space-y-4">
            <FormField
              label={
                <>
                  Título do Vídeo <span className="text-red-500">*</span>
                </>
              }
            >
              <Input
                value={formData.videoTitulo || ''}
                onChange={(e) => setFormData({ ...formData, videoTitulo: e.target.value })}
                placeholder="Digite o título do vídeo..."
                autoFocus
              />
            </FormField>

            <FileField
              category="video"
              label="Vídeo"
              url={formData.videoUrl || ''}
              onUrl={(videoUrl) =>
                setFormData({
                  ...formData,
                  videoUrl,
                  fonteVideo: videoSource({ videoUrl }, 'youtube'),
                })
              }
              placeholderUrl="ou cole o link do YouTube aqui..."
              hint="Envie um MP4/WebM (ideal até 25 MB) ou cole um link do YouTube."
            />

            {formData.videoUrl && (
              <FormField label="Pré-visualização" className="mt-4">
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                  {fromFile ? (
                    <video
                      controls
                      preload="metadata"
                      className="w-full h-full"
                      src={formData.videoUrl}
                    />
                  ) : (
                    <iframe
                      src={`https://www.youtube.com/embed/${extractYouTubeId(formData.videoUrl)}`}
                      title="YouTube video preview"
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                </div>
              </FormField>
            )}
          </div>
        )
      }

      case 'video-interativo': {
        const ofYouTube = videoSource(formData) === 'youtube'

        return (
          <div className="space-y-4">
            <FormField
              label={
                <>
                  Título do Vídeo <span className="text-red-500">*</span>
                </>
              }
            >
              <Input
                value={formData.videoTitulo || ''}
                onChange={(e) => setFormData({ ...formData, videoTitulo: e.target.value })}
                placeholder="Digite o título do vídeo..."
                autoFocus
              />
            </FormField>

            <FileField
              category="video"
              label="Vídeo"
              url={formData.videoUrl || ''}
              onUrl={(videoUrl) =>
                setFormData({ ...formData, videoUrl, fonteVideo: videoSource({ videoUrl }) })
              }
              placeholderUrl="ou cole o link do YouTube aqui..."
              hint="Envie um MP4/WebM (ideal até 25 MB) ou cole um link do YouTube."
            />

            {ofYouTube && (
              <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                O vídeo do YouTube <strong>não</strong> é embutido no pacote SCORM: o aluno
                precisará de internet e do domínio do YouTube liberado no LMS. Para funcionar
                offline, envie o arquivo.
              </p>
            )}

            {formData.videoUrl && (
              <FormField label="Pré-visualização">
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                  {ofYouTube ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${extractYouTubeId(formData.videoUrl)}`}
                      title="Pré-visualização do vídeo"
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      controls
                      preload="metadata"
                      className="w-full h-full"
                      src={formData.videoUrl}
                    />
                  )}
                </div>
              </FormField>
            )}

            <ItemEditor
              label="Perguntas"
              itemLabel="Pergunta"
              emptyText="Nenhuma pergunta adicionada ainda."
              items={formData.perguntasVideo || []}
              createItem={() => ({
                id: `pv-${Date.now()}`,
                tempo: '',
                pergunta: '',
                opcaoA: '',
                opcaoB: '',
                correta: 'A' as const,
              })}
              onChange={(videoQuestions) =>
                setFormData({ ...formData, perguntasVideo: videoQuestions })
              }
              fields={[
                {
                  key: 'tempo',
                  label: 'Tempo do vídeo',
                  required: true,
                  placeholder: 'mm:ss — ex.: 02:30',
                },
                {
                  key: 'pergunta',
                  label: 'Enunciado',
                  required: true,
                  type: 'multiline',
                  placeholder: 'O que o aluno precisa responder...',
                },
                {
                  key: 'opcaoA',
                  label: 'Alternativa A',
                  required: true,
                  placeholder: 'A...',
                },
                {
                  key: 'opcaoB',
                  label: 'Alternativa B',
                  required: true,
                  placeholder: 'B...',
                },
                { key: 'opcaoC', label: 'Alternativa C', placeholder: 'C... (opcional)' },
                { key: 'opcaoD', label: 'Alternativa D', placeholder: 'D... (opcional)' },
                { key: 'opcaoE', label: 'Alternativa E', placeholder: 'E... (opcional)' },
                {
                  key: 'correta',
                  label: 'Alternativa correta',
                  required: true,
                  type: 'select',
                  options: [
                    { value: 'A', label: 'A' },
                    { value: 'B', label: 'B' },
                    { value: 'C', label: 'C' },
                    { value: 'D', label: 'D' },
                    { value: 'E', label: 'E' },
                  ],
                },
                {
                  key: 'feedback',
                  label: 'Feedback',
                  type: 'multiline',
                  placeholder: 'Explicação mostrada depois da resposta (opcional)...',
                },
              ]}
            />
          </div>
        )
      }

      case 'accordion':
        return (
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
                        <Textarea
                          value={item.conteudo}
                          onChange={(e) =>
                            handleUpdateAccordionItem(item.id, 'conteudo', e.target.value)
                          }
                          placeholder="Conteúdo do item..."
                          className="resize-none text-sm"
                          rows={3}
                        />
                      </FormField>
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
            <FormField
              label={
                <>
                  Tipo de Lista <span className="text-red-500">*</span>
                </>
              }
            >
              <Select
                value={formData.tipoLista || 'nao-ordenada'}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    tipoLista: value as 'ordenada' | 'nao-ordenada' | 'check',
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nao-ordenada">Não Ordenada (Bullets)</SelectItem>
                  <SelectItem value="ordenada">Ordenada (Numerada)</SelectItem>
                  <SelectItem value="check">Com Check</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Itens da Lista <span className="text-destructive">*</span>
              </span>
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

      case 'objetivos-aprendizagem':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Objetivos de Aprendizagem <span className="text-destructive">*</span>
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddObjective}
                className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/20"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Objetivo
              </Button>
            </div>

            {formData.itensObjetivos && formData.itensObjetivos.length > 0 ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {formData.itensObjetivos.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-6">
                      {index + 1}.
                    </span>
                    <Input
                      value={item.texto}
                      onChange={(e) => handleUpdateObjective(item.id, e.target.value)}
                      placeholder="Descreva o objetivo de aprendizagem..."
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveObjective(item.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <p>Nenhum objetivo adicionado ainda.</p>
                <p className="text-xs mt-1">
                  Clique em &quot;Adicionar Objetivo&quot; para começar.
                </p>
              </div>
            )}
          </div>
        )

      case 'info-box':
        return (
          <div className="space-y-4">
            <FormField
              label={
                <>
                  Tipo de Info Box <span className="text-red-500">*</span>
                </>
              }
            >
              <Select
                value={formData.tipoInfoBox || 'info'}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    tipoInfoBox: value as 'atencao' | 'saiba_mais' | 'info' | 'curiosidade',
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Informação</SelectItem>
                  <SelectItem value="atencao">Atenção</SelectItem>
                  <SelectItem value="saiba_mais">Saiba Mais</SelectItem>
                  <SelectItem value="curiosidade">Curiosidade</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Título (opcional)">
              <Input
                value={formData.tituloInfoBox || ''}
                onChange={(e) => setFormData({ ...formData, tituloInfoBox: e.target.value })}
                placeholder="Digite o título..."
              />
            </FormField>

            <FormField
              label={
                <>
                  Conteúdo <span className="text-red-500">*</span>
                </>
              }
            >
              <Textarea
                value={formData.conteudo || ''}
                onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                placeholder="Digite o conteúdo do destaque..."
                className="resize-none"
                rows={6}
              />
            </FormField>
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
          <div className="space-y-5">
            <ItemEditor
              label="Flipcards"
              itemLabel="Card"
              emptyText="Nenhum flipcard adicionado ainda."
              items={formData.itensFlipcard || []}
              createItem={() => ({
                id: `flip-${Date.now()}`,
                tipoFrente: 'titulo' as const,
                imagemFrente: '',
                tituloFrente: '',
                conteudoVerso: '',
              })}
              onChange={(flipcardItems) =>
                setFormData({ ...formData, itensFlipcard: flipcardItems })
              }
              fields={[
                {
                  key: 'tipoFrente',
                  label: 'Tipo de frente',
                  required: true,
                  type: 'select',
                  options: [
                    { value: 'titulo', label: 'Apenas título centralizado' },
                    { value: 'imagem', label: 'Apenas imagem' },
                    { value: 'imagem-titulo', label: 'Imagem com título no rodapé' },
                  ],
                },
                {
                  key: 'imagemFrente',
                  label: 'Imagem da frente',
                  required: true,
                  type: 'image',
                  visibleIf: (card) => card.tipoFrente !== 'titulo',
                },
                {
                  key: 'tituloFrente',
                  label: 'Título da frente',
                  required: true,
                  placeholder: 'Digite o título...',
                  visibleIf: (card) => card.tipoFrente !== 'imagem',
                },
                {
                  key: 'conteudoVerso',
                  label: 'Conteúdo do verso',
                  required: true,
                  type: 'multiline',
                  placeholder: 'Digite o conteúdo do verso...',
                },
              ]}
            />

            <FormField label="Altura dos cards">
              <Input
                value={formData.alturaCard || '300px'}
                onChange={(e) => setFormData({ ...formData, alturaCard: e.target.value })}
                placeholder="Ex: 300px, 20vh"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Até 4 cards por linha; eles se ajustam para ocupar toda a largura.
              </p>
            </FormField>
          </div>
        )

      case 'separador':
        return (
          <FormField label="Estilo">
            <Select
              value={formData.estiloSeparador || 'linha'}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  estiloSeparador: value as Block['estiloSeparador'],
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linha">Linha</SelectItem>
                <SelectItem value="linha-icone">Linha com ícone</SelectItem>
                <SelectItem value="espaco">Apenas espaço</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        )

      case 'tabs':
        return (
          <ItemEditor
            label="Abas"
            itemLabel="Aba"
            emptyText="Nenhuma aba adicionada ainda."
            items={formData.itensTabs || []}
            createItem={() => ({ id: `tab-${Date.now()}`, titulo: '', conteudo: '' })}
            onChange={(tabItems) => setFormData({ ...formData, itensTabs: tabItems })}
            fields={[
              {
                key: 'titulo',
                label: 'Título',
                required: true,
                placeholder: 'Título da aba...',
              },
              {
                key: 'conteudo',
                label: 'Conteúdo',
                required: true,
                type: 'multiline',
                placeholder: 'Conteúdo da aba...',
              },
            ]}
          />
        )

      case 'linha-do-tempo':
        return (
          <div className="space-y-5">
            <FormField label="Orientação">
              <Select
                value={formData.orientacaoTimeline || 'vertical'}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    orientacaoTimeline: value as Block['orientacaoTimeline'],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vertical">Vertical</SelectItem>
                  <SelectItem value="horizontal">Horizontal</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <ItemEditor
              label="Eventos"
              itemLabel="Evento"
              emptyText="Nenhum evento adicionado ainda."
              items={formData.itensTimeline || []}
              createItem={() => ({
                id: `evento-${Date.now()}`,
                data: '',
                titulo: '',
                descricao: '',
              })}
              onChange={(timelineItems) =>
                setFormData({ ...formData, itensTimeline: timelineItems })
              }
              fields={[
                { key: 'data', label: 'Data', placeholder: 'Ex.: 1990 ou Março/2024' },
                {
                  key: 'titulo',
                  label: 'Título',
                  required: true,
                  placeholder: 'Título do evento...',
                },
                {
                  key: 'descricao',
                  label: 'Descrição',
                  type: 'multiline',
                  placeholder: 'Descrição do evento...',
                },
              ]}
            />
          </div>
        )

      case 'carrossel':
        return (
          <div className="space-y-5">
            <FormField label="Exibição">
              <div className="grid grid-cols-2 gap-2">
                {CAROUSEL_DISPLAY_MODES.map((mode) => {
                  const active = (formData.modoCarrossel || 'carrossel') === mode.value
                  const Icon = mode.icon

                  return (
                    <Button
                      key={mode.value}
                      type="button"
                      variant={active ? 'default' : 'outline'}
                      onClick={() => setFormData({ ...formData, modoCarrossel: mode.value })}
                      className="h-auto flex-col gap-1.5 py-3"
                    >
                      <Icon className="h-5 w-5" />
                      {mode.label}
                    </Button>
                  )
                })}
              </div>
            </FormField>

            <ItemEditor
              label="Imagens"
              itemLabel="Imagem"
              emptyText="Nenhuma imagem adicionada ainda."
              items={formData.itensCarrossel || []}
              createItem={() => ({ id: `img-${Date.now()}`, url: '', legenda: '', fonte: '' })}
              onChange={(carouselItems) =>
                setFormData({ ...formData, itensCarrossel: carouselItems })
              }
              fields={[
                {
                  key: 'url',
                  label: 'Imagem',
                  required: true,
                  type: 'image',
                },
                {
                  key: 'legenda',
                  label: 'Legenda',
                  required: true,
                  placeholder: 'Legenda da imagem...',
                },
                {
                  key: 'fonte',
                  label: 'Fonte',
                  required: true,
                  placeholder: 'Fonte da imagem...',
                },
              ]}
            />
          </div>
        )

      case 'audio':
        return (
          <div className="space-y-5">
            <FileField
              category="audio"
              label="Arquivo de áudio"
              url={formData.audioUrl || ''}
              onUrl={(audioUrl) => setFormData({ ...formData, audioUrl })}
            />

            <FormField
              label={
                <>
                  Título <span className="text-red-500">*</span>
                </>
              }
            >
              <Input
                value={formData.audioTitulo || ''}
                onChange={(e) => setFormData({ ...formData, audioTitulo: e.target.value })}
                placeholder="Título do áudio..."
              />
            </FormField>

            <FormField label="Transcrição">
              <Textarea
                value={formData.transcricao || ''}
                onChange={(e) => setFormData({ ...formData, transcricao: e.target.value })}
                placeholder="Transcrição do áudio (recomendada para acessibilidade)..."
                rows={5}
              />
            </FormField>
          </div>
        )

      case 'pdf':
        return (
          <div className="space-y-5">
            <FileField
              category="document"
              label="Arquivo PDF"
              url={formData.pdfUrl || ''}
              onUrl={(pdfUrl) => setFormData({ ...formData, pdfUrl })}
            />

            <FormField
              label={
                <>
                  Título <span className="text-red-500">*</span>
                </>
              }
            >
              <Input
                value={formData.pdfTitulo || ''}
                onChange={(e) => setFormData({ ...formData, pdfTitulo: e.target.value })}
                placeholder="Título do documento..."
              />
            </FormField>

            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={formData.permitirDownloadPdf !== false}
                onChange={(e) =>
                  setFormData({ ...formData, permitirDownloadPdf: e.target.checked })
                }
                className="h-4 w-4"
              />
              Permitir download do arquivo
            </label>
          </div>
        )

      case 'imagem-interativa':
        return (
          <div className="space-y-5">
            <FileField
              category="image"
              label="Imagem de fundo"
              url={formData.imagemBase || ''}
              onUrl={(baseImage) => setFormData({ ...formData, imagemBase: baseImage })}
            />

            <HotspotEditor
              baseImage={formData.imagemBase || ''}
              hotspots={formData.hotspots || []}
              onChange={(hotspots) => setFormData({ ...formData, hotspots })}
            />

            <FormField label="Legenda">
              <Input
                value={formData.legenda || ''}
                onChange={(e) => setFormData({ ...formData, legenda: e.target.value })}
                placeholder="Legenda da imagem..."
              />
            </FormField>
          </div>
        )

      case 'associacao':
        return (
          <ItemEditor
            label="Pares"
            itemLabel="Par"
            emptyText="Nenhum par adicionado ainda."
            items={formData.paresAssociacao || []}
            createItem={() => ({ id: `par-${Date.now()}`, esquerda: '', direita: '' })}
            onChange={(matchingPairs) =>
              setFormData({ ...formData, paresAssociacao: matchingPairs })
            }
            fields={[
              {
                key: 'esquerda',
                label: 'Item fixo',
                required: true,
                placeholder: 'Ex.: Água',
              },
              {
                key: 'direita',
                label: 'Correspondente',
                required: true,
                placeholder: 'Ex.: H₂O',
              },
            ]}
          />
        )

      case 'categorizacao':
        return (
          <CategoryEditor
            categories={formData.categorias || []}
            onChange={(categories) => setFormData({ ...formData, categorias: categories })}
          />
        )

      default:
        return null
    }
  }

  const meta = selectedType ? BLOCK_CATALOG[selectedType] : null
  const Icon = meta?.icon

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col p-0 !w-[480px] !max-w-[480px] bg-white dark:bg-gray-900">
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
              <SheetTitle className="text-xl">{meta?.label ?? 'Conteúdo'}</SheetTitle>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {renderForm()}
          {meta?.adjustableWidth && (
            <FormField label="Largura do bloco">
              <div className="grid grid-cols-2 gap-2">
                {BLOCK_WIDTHS.map((width) => (
                  <Button
                    key={width.columns}
                    type="button"
                    variant={(formData.colunas ?? 12) === width.columns ? 'default' : 'outline'}
                    onClick={() => setFormData({ ...formData, colunas: width.columns })}
                  >
                    {width.label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Em meia largura o bloco divide a linha com o bloco seguinte.
              </p>
            </FormField>
          )}
        </div>

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
