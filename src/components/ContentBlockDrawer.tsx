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
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import Image from 'next/image'
import {
  Block,
  AccordionItem,
  ListItem,
  CategoryItem,
  HotspotItem,
  MatchingPair,
  ScenarioOption,
  SequenceItem,
  TrueFalseItem,
} from '@/types/course'
import { BLOCK_CATALOG, cardsFlipcard, createEmptyBlock, videoSource } from '@/lib/blocks'
import { MEDIA_POLICY, type MediaCategory } from '@/lib/media'
import { uploadFile } from '@/lib/client-upload'
import { extractYouTubeId } from '@/lib/youtube'
import { cleanDistractors, fillBlanksAnswers } from '@/lib/fill-blanks'
import { RichTextEditor } from './RichTextEditor'
import { toast } from 'sonner'

interface ContentBlockDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'add' | 'edit'
  blockData: Partial<Block> | null
  onSave: (data: Omit<Block, 'id' | 'order'>) => void
  onCancel: () => void
}

function prepareForm(blockData: Partial<Block> | null): Partial<Block> {
  const form: Partial<Block> = {
    ...createEmptyBlock(blockData?.type || 'paragraph'),
    ...blockData,
  }

  // A block saved before `videoSource` existed would open with the picker on the wrong source.
  if (form.type === 'video' || form.type === 'interactive-video') {
    form.videoSource = videoSource(form, form.type === 'video' ? 'youtube' : 'file')
  }

  if (form.type === 'flipcard') {
    form.flipcardItems = cardsFlipcard(form)
  }

  return form
}

const BLOCK_WIDTHS: { columns: 6 | 12; label: string }[] = [
  { columns: 12, label: 'Largura total' },
  { columns: 6, label: 'Meia largura' },
]

const CAROUSEL_DISPLAY_MODES: {
  value: NonNullable<Block['carouselMode']>
  label: string
  icon: typeof GalleryHorizontal
}[] = [
  { value: 'carousel', label: 'Carrossel', icon: GalleryHorizontal },
  { value: 'grid', label: 'Grade', icon: LayoutGrid },
]

function FileField({
  category,
  label,
  url,
  onUrl,
  placeholderUrl = 'ou cole a URL aqui...',
  hint,
  preview = true,
  required = true,
}: {
  category: MediaCategory
  label: string
  url: string
  onUrl: (url: string) => void
  placeholderUrl?: string
  hint?: React.ReactNode
  preview?: boolean
  required?: boolean
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
          {label} {required && <span className="text-destructive">*</span>}
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

      {preview && category === 'image' && url && !previewBroken && (
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
  reorderable = false,
}: {
  label: string
  itemLabel: string
  items: T[]
  fields: FieldConfig<T>[]
  createItem: () => T
  onChange: (items: T[]) => void
  emptyText: string
  reorderable?: boolean
}) {
  const update = (id: string, key: string, value: string) =>
    onChange(items.map((item) => (item.id === id ? { ...item, [key]: value } : item)))

  const moveItem = (index: number, offset: number) => {
    const target = index + offset
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

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
        <div className="space-y-3 sm:max-h-[400px] sm:overflow-y-auto">
          {items.map((item, index) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {itemLabel} {index + 1}
                </span>
                <div className="flex items-center gap-1">
                  {reorderable && (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={index === 0}
                        aria-label={`Mover ${itemLabel.toLowerCase()} ${index + 1} para cima`}
                        onClick={() => moveItem(index, -1)}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={index === items.length - 1}
                        aria-label={`Mover ${itemLabel.toLowerCase()} ${index + 1} para baixo`}
                        onClick={() => moveItem(index, 1)}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </>
                  )}
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
                          required={!!field.required}
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
            onChange([...categories, { id: `cat-${Date.now()}`, name: '', items: [] }])
          }
          className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/20"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar
        </Button>
      </div>

      {categories.length > 0 ? (
        <div className="space-y-3 sm:max-h-[400px] sm:overflow-y-auto">
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
                value={category.name}
                onChange={(e) => update(category.id, { name: e.target.value })}
                placeholder="Nome da categoria..."
                className="text-sm"
              />

              <div className="mt-3 space-y-2">
                {category.items.map((input) => (
                  <div key={input.id} className="flex items-center gap-2">
                    <Input
                      value={input.text}
                      onChange={(e) =>
                        update(category.id, {
                          items: category.items.map((another) =>
                            another.id === input.id ? { ...another, text: e.target.value } : another
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
                          items: category.items.filter((another) => another.id !== input.id),
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
                      items: [...category.items, { id: `item-${Date.now()}`, text: '' }],
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

function ImageSizeField({
  value,
  onChange,
}: {
  value: Block['size']
  onChange: (size: NonNullable<Block['size']>) => void
}) {
  return (
    <FormField
      label={
        <>
          Tamanho da Imagem <span className="text-red-500">*</span>
        </>
      }
    >
      <Select
        value={value || ''}
        onValueChange={(size) => onChange(size as NonNullable<Block['size']>)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecione o tamanho" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="small">Pequena (25%)</SelectItem>
          <SelectItem value="medium">Média (50%)</SelectItem>
          <SelectItem value="large">Grande (100%)</SelectItem>
        </SelectContent>
      </Select>
    </FormField>
  )
}

const HOTSPOT_MODES: {
  value: NonNullable<Block['hotspotMode']>
  label: string
  description: string
}[] = [
  {
    value: 'explore',
    label: 'Explorar',
    description: 'Os pontos ficam visíveis e o aluno clica para ler cada um.',
  },
  {
    value: 'find',
    label: 'Encontrar',
    description:
      'Os pontos ficam escondidos até o aluno tocar no lugar certo. Vale como atividade avaliada.',
  },
]

function HotspotModeField({
  value,
  onChange,
}: {
  value: Block['hotspotMode']
  onChange: (mode: NonNullable<Block['hotspotMode']>) => void
}) {
  const current = value ?? 'explore'

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-gray-900 dark:text-gray-100">Modo</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {HOTSPOT_MODES.map((mode) => (
          <label
            key={mode.value}
            className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm transition-colors has-focus-visible:ring-2 has-focus-visible:ring-blue-600 ${
              current === mode.value
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40'
                : 'border-gray-200 hover:border-blue-300 dark:border-gray-700'
            }`}
          >
            <input
              type="radio"
              name="hotspot-mode"
              value={mode.value}
              checked={current === mode.value}
              onChange={() => onChange(mode.value)}
              className="mt-0.5 accent-blue-600"
            />
            <span>
              <span className="block font-medium text-gray-900 dark:text-gray-100">
                {mode.label}
              </span>
              <span className="block text-xs text-gray-600 dark:text-gray-400">
                {mode.description}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function FillBlanksFields({
  text,
  distractors,
  onChange,
}: {
  text: string
  distractors: string[]
  onChange: (change: Pick<Block, 'fillBlanksText' | 'fillBlanksDistractors'>) => void
}) {
  const [rawDistractors, setRawDistractors] = useState(distractors.join(', '))
  const answers = fillBlanksAnswers(text)

  return (
    <div className="space-y-5">
      <FormField
        label={
          <>
            Texto com lacunas <span className="text-destructive">*</span>
          </>
        }
        description="Escreva entre colchetes cada palavra que o aluno deve completar. Ex.: Lave as mãos por [20] segundos com [sabão]."
      >
        {(field) => (
          <Textarea
            {...field}
            value={text}
            rows={5}
            onChange={(e) =>
              onChange({
                fillBlanksText: e.target.value,
                fillBlanksDistractors: cleanDistractors(
                  rawDistractors,
                  fillBlanksAnswers(e.target.value)
                ),
              })
            }
            placeholder="Lave as mãos por [20] segundos com [sabão]."
          />
        )}
      </FormField>

      <p className="text-xs text-muted-foreground" aria-live="polite">
        {answers.length === 0
          ? 'Nenhuma lacuna marcada ainda.'
          : `${answers.length} ${answers.length === 1 ? 'lacuna' : 'lacunas'}: ${answers
              .map((answer) => answer || '(vazia)')
              .join(', ')}`}
      </p>

      <FormField
        label="Palavras extras"
        optional
        description="Palavras erradas, mas plausíveis, separadas por vírgula. Aparecem junto das respostas."
      >
        {(field) => (
          <Input
            {...field}
            value={rawDistractors}
            onChange={(e) => {
              setRawDistractors(e.target.value)
              onChange({
                fillBlanksText: text,
                fillBlanksDistractors: cleanDistractors(e.target.value, answers),
              })
            }}
            placeholder="Ex.: 10, álcool"
          />
        )}
      </FormField>
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

  const areaRef = React.useRef<HTMLDivElement>(null)
  const draggingId = React.useRef<string | null>(null)

  const clampPercent = (value: number) => Math.min(100, Math.max(0, Math.round(value)))

  const positionAt = (clientX: number, clientY: number) => {
    const area = areaRef.current?.getBoundingClientRect()
    if (!area || area.width === 0 || area.height === 0) return null
    return {
      x: clampPercent(((clientX - area.left) / area.width) * 100),
      y: clampPercent(((clientY - area.top) / area.height) * 100),
    }
  }

  const addOnClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const position = positionAt(event.clientX, event.clientY)
    if (!position) return
    onChange([...hotspots, { id: `hotspot-${Date.now()}`, ...position, title: '', content: '' }])
  }

  const startDrag = (event: React.PointerEvent<HTMLButtonElement>, id: string) => {
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.focus()
    event.currentTarget.setPointerCapture(event.pointerId)
    draggingId.current = id
  }

  const drag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!draggingId.current) return
    const position = positionAt(event.clientX, event.clientY)
    if (position) update(draggingId.current, position)
  }

  const endDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    draggingId.current = null
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const nudge = (event: React.KeyboardEvent<HTMLButtonElement>, hotspot: HotspotItem) => {
    const step = event.shiftKey ? 5 : 1
    const moves: Record<string, Partial<HotspotItem>> = {
      ArrowLeft: { x: clampPercent(hotspot.x - step) },
      ArrowRight: { x: clampPercent(hotspot.x + step) },
      ArrowUp: { y: clampPercent(hotspot.y - step) },
      ArrowDown: { y: clampPercent(hotspot.y + step) },
    }
    const move = moves[event.key]
    if (!move) return
    event.preventDefault()
    update(hotspot.id, move)
  }

  return (
    <div className="space-y-4">
      <div>
        <span className="mb-2 block text-sm font-medium text-foreground">
          Pontos <span className="text-destructive">*</span>
        </span>
        {baseImage ? (
          <>
            <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
              Clique na imagem onde deseja adicionar um ponto. Arraste um ponto para mudar a
              posição.
            </p>
            <div
              ref={areaRef}
              onClick={addOnClick}
              className="relative inline-block max-w-full cursor-crosshair select-none rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <img
                src={baseImage}
                alt=""
                draggable={false}
                className="max-w-full h-auto rounded-lg"
              />
              {hotspots.map((hotspot, index) => (
                <button
                  key={hotspot.id}
                  type="button"
                  aria-label={`Mover ponto ${index + 1}`}
                  style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                  onPointerDown={(event) => startDrag(event, hotspot.id)}
                  onPointerMove={drag}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => nudge(event, hotspot)}
                  className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none items-center justify-center rounded-full border-2 border-white bg-blue-600 text-xs font-bold text-white shadow outline-none focus-visible:ring-2 focus-visible:ring-blue-400 active:cursor-grabbing"
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            Envie a imagem de fundo para posicionar os pontos.
          </p>
        )}
      </div>

      {hotspots.length > 0 && (
        <div className="space-y-3 sm:max-h-[300px] sm:overflow-y-auto">
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
                <Input
                  value={hotspot.title}
                  onChange={(e) => update(hotspot.id, { title: e.target.value })}
                  placeholder="Título do ponto..."
                  className="text-sm"
                />
                <Textarea
                  value={hotspot.content}
                  onChange={(e) => update(hotspot.id, { content: e.target.value })}
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
  const [selectedType, setSelectedType] = useState<Block['type'] | null>(blockData?.type || null)

  const [formData, setFormData] = useState<Partial<Block>>(prepareForm(blockData))
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setSelectedType(blockData?.type || null)
      setFormData(prepareForm(blockData))
      if (blockData?.content && blockData?.type === 'image') {
        setImagePreviewUrl(blockData.content)
      }
    }
  }, [open, blockData])

  const handleSave = () => {
    if (!selectedType) return

    if (!validateForm()) return

    onSave(formData as Omit<Block, 'id' | 'order'>)
    onOpenChange(false)
  }

  const handleCancel = () => {
    setSelectedType(null)
    setFormData(createEmptyBlock('paragraph'))
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

      setFormData({ ...formData, content: url })
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
      title: '',
      content: '',
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
      text: '',
    }
    setFormData({
      ...formData,
      listItems: [...(formData.listItems || []), newItem],
    })
  }

  const handleRemoveListItem = (id: string) => {
    setFormData({
      ...formData,
      listItems: formData.listItems?.filter((item) => item.id !== id),
    })
  }

  const handleUpdateListItem = (id: string, value: string) => {
    setFormData({
      ...formData,
      listItems: formData.listItems?.map((item) =>
        item.id === id ? { ...item, text: value } : item
      ),
    })
  }

  const handleAddObjective = () => {
    const newItem: ListItem = {
      id: `objetivo-${Date.now()}`,
      text: '',
    }
    setFormData({
      ...formData,
      objectiveItems: [...(formData.objectiveItems || []), newItem],
    })
  }

  const handleRemoveObjective = (id: string) => {
    setFormData({
      ...formData,
      objectiveItems: formData.objectiveItems?.filter((item) => item.id !== id),
    })
  }

  const handleUpdateObjective = (id: string, value: string) => {
    setFormData({
      ...formData,
      objectiveItems: formData.objectiveItems?.map((item) =>
        item.id === id ? { ...item, text: value } : item
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
      case 'heading':
      case 'subheading':
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
                value={formData.content || ''}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder={`Digite o ${selectedType === 'heading' ? 'título' : 'subtítulo'}...`}
                autoFocus
              />
            </FormField>
          </div>
        )

      case 'paragraph':
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
                value={formData.content || ''}
                onChange={(value) => setFormData({ ...formData, content: value })}
                placeholder="Digite o texto..."
                autoFocus
              />
            </FormField>
          </div>
        )

      case 'image':
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
                    value={formData.content || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, content: e.target.value })
                      if (e.target.value.startsWith('http')) {
                        setImagePreviewUrl(e.target.value)
                      } else {
                        setImagePreviewUrl(null)
                      }
                    }}
                    placeholder="Cole a URL da imagem..."
                  />
                </div>

                {(imagePreviewUrl || formData.content) && (
                  <div className="mt-3 flex justify-center">
                    <Image
                      src={imagePreviewUrl || formData.content || ''}
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

            <ImageSizeField
              value={formData.size}
              onChange={(size) => setFormData({ ...formData, size })}
            />

            <FormField
              label={
                <>
                  Legenda <span className="text-red-500">*</span>
                </>
              }
            >
              <Input
                value={formData.caption || ''}
                onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
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
                value={formData.source || ''}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                placeholder="Digite a fonte da imagem..."
              />
            </FormField>
          </div>
        )

      case 'video': {
        // No source picker: uploading a file and pasting a link share one field, and the URL
        // decides which player to use.
        const fromFile = videoSource(formData, 'youtube') === 'file'

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
                value={formData.videoTitle || ''}
                onChange={(e) => setFormData({ ...formData, videoTitle: e.target.value })}
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
                  videoSource: videoSource({ videoUrl }, 'youtube'),
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

      case 'interactive-video': {
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
                value={formData.videoTitle || ''}
                onChange={(e) => setFormData({ ...formData, videoTitle: e.target.value })}
                placeholder="Digite o título do vídeo..."
                autoFocus
              />
            </FormField>

            <FileField
              category="video"
              label="Vídeo"
              url={formData.videoUrl || ''}
              onUrl={(videoUrl) =>
                setFormData({ ...formData, videoUrl, videoSource: videoSource({ videoUrl }) })
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
              items={formData.videoQuestions || []}
              createItem={() => ({
                id: `pv-${Date.now()}`,
                time: '',
                question: '',
                optionA: '',
                optionB: '',
                correct: 'A' as const,
              })}
              onChange={(videoQuestions) => setFormData({ ...formData, videoQuestions })}
              fields={[
                {
                  key: 'time',
                  label: 'Tempo do vídeo',
                  required: true,
                  placeholder: 'mm:ss — ex.: 02:30',
                },
                {
                  key: 'question',
                  label: 'Enunciado',
                  required: true,
                  type: 'multiline',
                  placeholder: 'O que o aluno precisa responder...',
                },
                {
                  key: 'optionA',
                  label: 'Alternativa A',
                  required: true,
                  placeholder: 'A...',
                },
                {
                  key: 'optionB',
                  label: 'Alternativa B',
                  required: true,
                  placeholder: 'B...',
                },
                { key: 'optionC', label: 'Alternativa C', placeholder: 'C... (opcional)' },
                { key: 'optionD', label: 'Alternativa D', placeholder: 'D... (opcional)' },
                { key: 'optionE', label: 'Alternativa E', placeholder: 'E... (opcional)' },
                {
                  key: 'correct',
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
              <div className="space-y-3 sm:max-h-[400px] sm:overflow-y-auto">
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
                          value={item.title}
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
                          value={item.content}
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

      case 'list':
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
                value={formData.listType || 'nao-ordenada'}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    listType: value as 'ordered' | 'unordered' | 'check',
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unordered">Não Ordenada (Bullets)</SelectItem>
                  <SelectItem value="ordered">Ordenada (Numerada)</SelectItem>
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

            {formData.listItems && formData.listItems.length > 0 ? (
              <div className="space-y-2 sm:max-h-[400px] sm:overflow-y-auto">
                {formData.listItems.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-6">
                      {index + 1}.
                    </span>
                    <Input
                      value={item.text}
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

      case 'learning-objectives':
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

            {formData.objectiveItems && formData.objectiveItems.length > 0 ? (
              <div className="space-y-2 sm:max-h-[400px] sm:overflow-y-auto">
                {formData.objectiveItems.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-6">
                      {index + 1}.
                    </span>
                    <Input
                      value={item.text}
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
                value={formData.infoBoxType || 'info'}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    infoBoxType: value as 'warning' | 'learn-more' | 'info' | 'fun-fact',
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Informação</SelectItem>
                  <SelectItem value="warning">Atenção</SelectItem>
                  <SelectItem value="learn-more">Saiba Mais</SelectItem>
                  <SelectItem value="fun-fact">Curiosidade</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Título (opcional)">
              <Input
                value={formData.infoBoxTitle || ''}
                onChange={(e) => setFormData({ ...formData, infoBoxTitle: e.target.value })}
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
                value={formData.content || ''}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
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
              items={formData.flipcardItems || []}
              createItem={() => ({
                id: `flip-${Date.now()}`,
                frontType: 'title' as const,
                frontImage: '',
                frontTitle: '',
                backContent: '',
              })}
              onChange={(flipcardItems) => setFormData({ ...formData, flipcardItems })}
              fields={[
                {
                  key: 'frontType',
                  label: 'Tipo de frente',
                  required: true,
                  type: 'select',
                  options: [
                    { value: 'title', label: 'Apenas título centralizado' },
                    { value: 'image', label: 'Apenas imagem' },
                    { value: 'image-title', label: 'Imagem com título no rodapé' },
                  ],
                },
                {
                  key: 'frontImage',
                  label: 'Imagem da frente',
                  required: true,
                  type: 'image',
                  visibleIf: (card) => card.frontType !== 'title',
                },
                {
                  key: 'frontTitle',
                  label: 'Título da frente',
                  required: true,
                  placeholder: 'Digite o título...',
                  visibleIf: (card) => card.frontType !== 'image',
                },
                {
                  key: 'backContent',
                  label: 'Conteúdo do verso',
                  required: true,
                  type: 'multiline',
                  placeholder: 'Digite o conteúdo do verso...',
                },
              ]}
            />

            <FormField label="Altura dos cards">
              <Input
                value={formData.cardHeight || '300px'}
                onChange={(e) => setFormData({ ...formData, cardHeight: e.target.value })}
                placeholder="Ex: 300px, 20vh"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Até 4 cards por linha; eles se ajustam para ocupar toda a largura.
              </p>
            </FormField>
          </div>
        )

      case 'divider':
        return (
          <FormField label="Estilo">
            <Select
              value={formData.dividerStyle || 'linha'}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  dividerStyle: value as Block['dividerStyle'],
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Linha</SelectItem>
                <SelectItem value="line-icon">Linha com ícone</SelectItem>
                <SelectItem value="space">Apenas espaço</SelectItem>
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
            items={formData.tabItems || []}
            createItem={() => ({ id: `tab-${Date.now()}`, title: '', content: '' })}
            onChange={(tabItems) => setFormData({ ...formData, tabItems })}
            fields={[
              {
                key: 'title',
                label: 'Título',
                required: true,
                placeholder: 'Título da aba...',
              },
              {
                key: 'content',
                label: 'Conteúdo',
                required: true,
                type: 'multiline',
                placeholder: 'Conteúdo da aba...',
              },
            ]}
          />
        )

      case 'timeline':
        return (
          <div className="space-y-5">
            <FormField label="Orientação">
              <Select
                value={formData.timelineOrientation || 'vertical'}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    timelineOrientation: value as Block['timelineOrientation'],
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
              items={formData.timelineItems || []}
              createItem={() => ({
                id: `timeline-${Date.now()}`,
                date: '',
                title: '',
                description: '',
              })}
              onChange={(timelineItems) => setFormData({ ...formData, timelineItems })}
              fields={[
                { key: 'date', label: 'Data', placeholder: 'Ex.: 1990 ou Março/2024' },
                {
                  key: 'title',
                  label: 'Título',
                  required: true,
                  placeholder: 'Título do evento...',
                },
                {
                  key: 'description',
                  label: 'Descrição',
                  type: 'multiline',
                  placeholder: 'Descrição do evento...',
                },
              ]}
            />
          </div>
        )

      case 'carousel':
        return (
          <div className="space-y-5">
            <FormField label="Exibição">
              <div className="grid grid-cols-2 gap-2">
                {CAROUSEL_DISPLAY_MODES.map((mode) => {
                  const active = (formData.carouselMode || 'carrossel') === mode.value
                  const Icon = mode.icon

                  return (
                    <Button
                      key={mode.value}
                      type="button"
                      variant={active ? 'default' : 'outline'}
                      onClick={() => setFormData({ ...formData, carouselMode: mode.value })}
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
              items={formData.carouselItems || []}
              createItem={() => ({ id: `img-${Date.now()}`, url: '', caption: '', source: '' })}
              onChange={(carouselItems) => setFormData({ ...formData, carouselItems })}
              fields={[
                {
                  key: 'url',
                  label: 'Imagem',
                  required: true,
                  type: 'image',
                },
                {
                  key: 'caption',
                  label: 'Legenda',
                  required: true,
                  placeholder: 'Legenda da imagem...',
                },
                {
                  key: 'source',
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
                value={formData.audioTitle || ''}
                onChange={(e) => setFormData({ ...formData, audioTitle: e.target.value })}
                placeholder="Título do áudio..."
              />
            </FormField>

            <FormField label="Transcrição">
              <Textarea
                value={formData.transcript || ''}
                onChange={(e) => setFormData({ ...formData, transcript: e.target.value })}
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
                value={formData.pdfTitle || ''}
                onChange={(e) => setFormData({ ...formData, pdfTitle: e.target.value })}
                placeholder="Título do documento..."
              />
            </FormField>

            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={formData.allowPdfDownload !== false}
                onChange={(e) => setFormData({ ...formData, allowPdfDownload: e.target.checked })}
                className="h-4 w-4"
              />
              Permitir download do arquivo
            </label>
          </div>
        )

      case 'interactive-image':
        return (
          <div className="space-y-5">
            <FileField
              category="image"
              label="Imagem de fundo"
              preview={false}
              url={formData.baseImage || ''}
              onUrl={(baseImage) => setFormData({ ...formData, baseImage })}
            />

            <HotspotModeField
              value={formData.hotspotMode}
              onChange={(hotspotMode) => setFormData({ ...formData, hotspotMode })}
            />

            <HotspotEditor
              baseImage={formData.baseImage || ''}
              hotspots={formData.hotspots || []}
              onChange={(hotspots) => setFormData({ ...formData, hotspots })}
            />

            <ImageSizeField
              value={formData.size}
              onChange={(size) => setFormData({ ...formData, size })}
            />

            <FormField label="Legenda">
              <Input
                value={formData.caption || ''}
                onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                placeholder="Legenda da imagem..."
              />
            </FormField>
          </div>
        )

      case 'matching':
        return (
          <ItemEditor<MatchingPair>
            label="Pares"
            itemLabel="Par"
            emptyText="Nenhum par adicionado ainda."
            items={formData.matchingPairs || []}
            createItem={() => ({ id: `par-${Date.now()}`, left: '', right: '' })}
            onChange={(matchingPairs) => setFormData({ ...formData, matchingPairs })}
            fields={[
              {
                key: 'left',
                label: 'Item fixo',
                required: true,
                placeholder: 'Ex.: Água',
              },
              {
                key: 'leftImage',
                label: 'Imagem do item fixo',
                type: 'image',
              },
              {
                key: 'right',
                label: 'Correspondente',
                required: true,
                placeholder: 'Ex.: H₂O',
              },
            ]}
          />
        )

      case 'categorization':
        return (
          <CategoryEditor
            categories={formData.categories || []}
            onChange={(categories) => setFormData({ ...formData, categories })}
          />
        )

      case 'scenario':
        return (
          <div className="space-y-5">
            <FormField
              label="Personagem"
              optional
              description="Nome e papel de quem vive a situação."
            >
              {(field) => (
                <Input
                  {...field}
                  value={formData.scenarioCharacter || ''}
                  onChange={(e) => setFormData({ ...formData, scenarioCharacter: e.target.value })}
                  placeholder="Ex.: Seu João, encarregado da obra"
                />
              )}
            </FormField>

            <FileField
              category="image"
              label="Imagem do personagem"
              required={false}
              url={formData.scenarioAvatar || ''}
              onUrl={(scenarioAvatar) => setFormData({ ...formData, scenarioAvatar })}
            />

            <FormField
              label={
                <>
                  Situação <span className="text-destructive">*</span>
                </>
              }
              description="A fala ou o problema que pede uma decisão do aluno."
            >
              {(field) => (
                <Textarea
                  {...field}
                  value={formData.scenarioSituation || ''}
                  rows={4}
                  onChange={(e) => setFormData({ ...formData, scenarioSituation: e.target.value })}
                  placeholder="Ex.: Um colega vai subir no andaime sem o cinto. O que você faz?"
                />
              )}
            </FormField>

            <ItemEditor<ScenarioOption>
              label="Opções"
              itemLabel="Opção"
              emptyText="Nenhuma opção adicionada ainda."
              items={formData.scenarioOptions || []}
              createItem={() => ({
                id: `op-${Date.now()}`,
                text: '',
                outcome: 'incorrect',
                consequence: '',
              })}
              onChange={(scenarioOptions) => setFormData({ ...formData, scenarioOptions })}
              fields={[
                {
                  key: 'text',
                  label: 'Escolha',
                  required: true,
                  placeholder: 'Ex.: Peço que ele use o cinto antes de subir',
                },
                {
                  key: 'outcome',
                  label: 'Resultado',
                  required: true,
                  type: 'select',
                  options: [
                    { value: 'correct', label: 'Correta' },
                    { value: 'incorrect', label: 'Incorreta' },
                  ],
                },
                {
                  key: 'consequence',
                  label: 'Consequência',
                  type: 'multiline',
                  placeholder: 'O que acontece com essa escolha',
                },
              ]}
            />
          </div>
        )

      case 'fill-blanks':
        return (
          <FillBlanksFields
            text={formData.fillBlanksText || ''}
            distractors={formData.fillBlanksDistractors || []}
            onChange={(change) => setFormData({ ...formData, ...change })}
          />
        )

      case 'sequence':
        return (
          <ItemEditor<SequenceItem>
            label="Passos, na ordem correta"
            itemLabel="Passo"
            emptyText="Nenhum passo adicionado ainda."
            items={formData.sequenceItems || []}
            createItem={() => ({ id: `seq-${Date.now()}`, text: '' })}
            onChange={(sequenceItems) => setFormData({ ...formData, sequenceItems })}
            reorderable
            fields={[
              {
                key: 'text',
                label: 'Texto do passo',
                required: true,
                placeholder: 'Ex.: Ajustar a carneira ao tamanho da cabeça',
              },
            ]}
          />
        )

      case 'true-false':
        return (
          <ItemEditor<TrueFalseItem>
            label="Afirmações"
            itemLabel="Afirmação"
            emptyText="Nenhuma afirmação adicionada ainda."
            items={formData.trueFalseItems || []}
            createItem={() => ({
              id: `vf-${Date.now()}`,
              statement: '',
              answer: 'true',
              explanation: '',
            })}
            onChange={(trueFalseItems) => setFormData({ ...formData, trueFalseItems })}
            fields={[
              {
                key: 'statement',
                label: 'Afirmação',
                required: true,
                type: 'multiline',
                placeholder: 'Ex.: O EPI deve ser fornecido gratuitamente pelo empregador.',
              },
              {
                key: 'answer',
                label: 'Resposta',
                required: true,
                type: 'select',
                options: [
                  { value: 'true', label: 'Verdadeiro' },
                  { value: 'false', label: 'Falso' },
                ],
              },
              {
                key: 'explanation',
                label: 'Explicação',
                type: 'multiline',
                placeholder: 'Mostrada depois da resposta',
              },
            ]}
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
      <SheetContent className="flex flex-col p-0 w-full max-w-full! sm:max-w-[480px]! bg-white dark:bg-gray-900">
        <SheetHeader className="pb-4 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 pt-6">
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

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-5">
          {renderForm()}
          {meta?.adjustableWidth && (
            <FormField label="Largura do bloco">
              <div className="grid grid-cols-2 gap-2">
                {BLOCK_WIDTHS.map((width) => (
                  <Button
                    key={width.columns}
                    type="button"
                    variant={(formData.columns ?? 12) === width.columns ? 'default' : 'outline'}
                    onClick={() => setFormData({ ...formData, columns: width.columns })}
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

        <SheetFooter className="border-t border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 flex justify-end gap-3">
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
