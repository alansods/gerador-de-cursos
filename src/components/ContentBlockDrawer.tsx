'use client'

import React, { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { HelpCircle, Upload, Loader2, Plus, Trash2 } from 'lucide-react'
import Image from 'next/image'
import {
  ConteudoUnidade,
  AccordionItem,
  ListaItem,
  CategoriaItem,
  HotspotItem,
} from '@/types/gerador-curso'
import { CATALOGO_BLOCOS, cardsFlipcard, criarBlocoVazio } from '@/lib/blocos'
import { POLITICA_MIDIAS, type CategoriaMidia } from '@/lib/midias'
import { enviarArquivo } from '@/lib/upload-cliente'
import { extractYouTubeId } from '@/lib/youtube'
import { RichTextEditor } from './RichTextEditor'
import { toast } from 'sonner'

interface ContentBlockDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'add' | 'edit'
  blockData: Partial<ConteudoUnidade> | null
  onSave: (data: Omit<ConteudoUnidade, 'id' | 'ordem'>) => void
  onCancel: () => void
}

function prepararFormulario(blockData: Partial<ConteudoUnidade> | null): Partial<ConteudoUnidade> {
  const formulario: Partial<ConteudoUnidade> = {
    ...criarBlocoVazio(blockData?.tipo || 'paragrafo'),
    ...blockData,
  }

  if (formulario.tipo === 'flipcard') {
    formulario.itensFlipcard = cardsFlipcard(formulario)
    delete formulario.tipoFrente
    delete formulario.imagemFrente
    delete formulario.tituloFrente
    delete formulario.conteudoVerso
  }

  return formulario
}

const LARGURAS_BLOCO: { colunas: 6 | 12; rotulo: string }[] = [
  { colunas: 12, rotulo: 'Largura total' },
  { colunas: 6, rotulo: 'Meia largura' },
]

function CampoArquivo({
  categoria,
  rotulo,
  url,
  onUrl,
}: {
  categoria: CategoriaMidia
  rotulo: string
  url: string
  onUrl: (url: string) => void
}) {
  const [enviando, setEnviando] = useState(false)
  const entradaArquivo = React.useRef<HTMLInputElement>(null)
  const politica = POLITICA_MIDIAS[categoria]

  const aoSelecionar = async (arquivo: File) => {
    setEnviando(true)
    try {
      const { url: enviada, aviso } = await enviarArquivo(arquivo, categoria)
      onUrl(enviada)
      if (aviso) toast.warning(aviso)
      else toast.success(`${politica.rotulo} enviado`)
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : 'Erro ao enviar o arquivo')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {rotulo} <span className="text-red-500">*</span>
      </label>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={enviando}
          onClick={() => entradaArquivo.current?.click()}
        >
          {enviando ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          {enviando ? 'Enviando...' : 'Escolher arquivo'}
        </Button>
        <input
          ref={entradaArquivo}
          type="file"
          accept={politica.extensoes}
          className="hidden"
          onChange={(e) => {
            const arquivo = e.target.files?.[0]
            if (arquivo) aoSelecionar(arquivo)
            e.target.value = ''
          }}
        />
      </div>

      <Input
        value={url}
        onChange={(e) => onUrl(e.target.value)}
        placeholder="ou cole a URL aqui..."
        className="text-sm"
      />

      <p className="text-xs text-gray-500 dark:text-gray-400">{politica.dicaTamanho}</p>
    </div>
  )
}

interface CampoItem<T> {
  chave: keyof T & string
  rotulo: string
  obrigatorio?: boolean
  placeholder?: string
  tipo?: 'texto' | 'multilinha' | 'select' | 'imagem'
  opcoes?: { valor: string; rotulo: string }[]
  visivelSe?: (item: T) => boolean
}

function EditorDeItens<T extends { id: string }>({
  rotulo,
  rotuloItem,
  itens,
  campos,
  criarItem,
  onChange,
  vazio,
}: {
  rotulo: string
  rotuloItem: string
  itens: T[]
  campos: CampoItem<T>[]
  criarItem: () => T
  onChange: (itens: T[]) => void
  vazio: string
}) {
  const atualizar = (id: string, chave: string, valor: string) =>
    onChange(itens.map((item) => (item.id === id ? { ...item, [chave]: valor } : item)))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {rotulo} <span className="text-red-500">*</span>
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...itens, criarItem()])}
          className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/20"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar
        </Button>
      </div>

      {itens.length > 0 ? (
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {itens.map((item, index) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {rotuloItem} {index + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange(itens.filter((outro) => outro.id !== item.id))}
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3">
                {campos
                  .filter((campo) => !campo.visivelSe || campo.visivelSe(item))
                  .map((campo) => (
                    <div key={campo.chave}>
                      {campo.tipo !== 'imagem' && (
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          {campo.rotulo}
                          {campo.obrigatorio && <span className="text-red-500"> *</span>}
                        </label>
                      )}
                      {campo.tipo === 'multilinha' ? (
                        <Textarea
                          value={String(item[campo.chave] ?? '')}
                          onChange={(e) => atualizar(item.id, campo.chave, e.target.value)}
                          placeholder={campo.placeholder}
                          rows={3}
                          className="text-sm"
                        />
                      ) : campo.tipo === 'select' ? (
                        <Select
                          value={String(item[campo.chave] ?? '')}
                          onValueChange={(valor) => atualizar(item.id, campo.chave, valor)}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(campo.opcoes ?? []).map((opcao) => (
                              <SelectItem key={opcao.valor} value={opcao.valor}>
                                {opcao.rotulo}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : campo.tipo === 'imagem' ? (
                        <CampoArquivo
                          categoria="imagem"
                          rotulo={campo.rotulo}
                          url={String(item[campo.chave] ?? '')}
                          onUrl={(url) => atualizar(item.id, campo.chave, url)}
                        />
                      ) : (
                        <Input
                          value={String(item[campo.chave] ?? '')}
                          onChange={(e) => atualizar(item.id, campo.chave, e.target.value)}
                          placeholder={campo.placeholder}
                          className="text-sm"
                        />
                      )}
                    </div>
                  ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">{vazio}</p>
      )}
    </div>
  )
}

function EditorDeCategorias({
  categorias,
  onChange,
}: {
  categorias: CategoriaItem[]
  onChange: (categorias: CategoriaItem[]) => void
}) {
  const atualizar = (id: string, mudanca: Partial<CategoriaItem>) =>
    onChange(categorias.map((c) => (c.id === id ? { ...c, ...mudanca } : c)))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Categorias <span className="text-red-500">*</span>
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onChange([...categorias, { id: `cat-${Date.now()}`, nome: '', itens: [] }])
          }
          className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/20"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar
        </Button>
      </div>

      {categorias.length > 0 ? (
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {categorias.map((categoria, index) => (
            <Card key={categoria.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Categoria {index + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange(categorias.filter((outra) => outra.id !== categoria.id))}
                  className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <Input
                value={categoria.nome}
                onChange={(e) => atualizar(categoria.id, { nome: e.target.value })}
                placeholder="Nome da categoria..."
                className="text-sm"
              />

              <div className="mt-3 space-y-2">
                {categoria.itens.map((entrada) => (
                  <div key={entrada.id} className="flex items-center gap-2">
                    <Input
                      value={entrada.texto}
                      onChange={(e) =>
                        atualizar(categoria.id, {
                          itens: categoria.itens.map((outro) =>
                            outro.id === entrada.id ? { ...outro, texto: e.target.value } : outro
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
                        atualizar(categoria.id, {
                          itens: categoria.itens.filter((outro) => outro.id !== entrada.id),
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
                    atualizar(categoria.id, {
                      itens: [...categoria.itens, { id: `item-${Date.now()}`, texto: '' }],
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

function EditorDeHotspots({
  imagemBase,
  hotspots,
  onChange,
}: {
  imagemBase: string
  hotspots: HotspotItem[]
  onChange: (hotspots: HotspotItem[]) => void
}) {
  const atualizar = (id: string, mudanca: Partial<HotspotItem>) =>
    onChange(hotspots.map((h) => (h.id === id ? { ...h, ...mudanca } : h)))

  const adicionarNoClique = (evento: React.MouseEvent<HTMLDivElement>) => {
    const area = evento.currentTarget.getBoundingClientRect()
    const x = Math.round(((evento.clientX - area.left) / area.width) * 100)
    const y = Math.round(((evento.clientY - area.top) / area.height) * 100)
    onChange([...hotspots, { id: `hotspot-${Date.now()}`, x, y, titulo: '', conteudo: '' }])
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Pontos <span className="text-red-500">*</span>
          </label>
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
        {imagemBase ? (
          <>
            <div
              onClick={adicionarNoClique}
              className="relative inline-block max-w-full cursor-crosshair rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <img src={imagemBase} alt="" className="max-w-full h-auto rounded-lg" />
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
                  onClick={() => onChange(hotspots.filter((outro) => outro.id !== hotspot.id))}
                  className="text-red-600 dark:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {(['x', 'y'] as const).map((eixo) => (
                    <div key={eixo}>
                      <label
                        htmlFor={`${hotspot.id}-${eixo}`}
                        className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1"
                      >
                        {eixo === 'x' ? 'Horizontal (%)' : 'Vertical (%)'}
                      </label>
                      <Input
                        id={`${hotspot.id}-${eixo}`}
                        type="number"
                        min={0}
                        max={100}
                        value={hotspot[eixo]}
                        onChange={(e) =>
                          atualizar(hotspot.id, {
                            [eixo]: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                          })
                        }
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>

                <Input
                  value={hotspot.titulo}
                  onChange={(e) => atualizar(hotspot.id, { titulo: e.target.value })}
                  placeholder="Título do ponto..."
                  className="text-sm"
                />
                <Textarea
                  value={hotspot.conteudo}
                  onChange={(e) => atualizar(hotspot.id, { conteudo: e.target.value })}
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
  const [selectedType, setSelectedType] = useState<ConteudoUnidade['tipo'] | null>(
    blockData?.tipo || null
  )

  const [formData, setFormData] = useState<Partial<ConteudoUnidade>>(prepararFormulario(blockData))
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setSelectedType(blockData?.tipo || null)
      setFormData(prepararFormulario(blockData))
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
    setFormData(criarBlocoVazio('paragrafo'))
    setImagePreviewUrl(null)
    onCancel()
  }

  const validateForm = (): boolean => {
    if (!selectedType) return false

    const erro = CATALOGO_BLOCOS[selectedType].validarFormulario(formData)
    if (erro) {
      toast.error(erro)
      return false
    }
    return true
  }

  const handleUploadImage = async (file: File) => {
    setIsUploadingImage(true)
    setImagePreviewUrl(null)

    try {
      const { url, aviso } = await enviarArquivo(file, 'imagem')

      setFormData({ ...formData, conteudo: url })
      setImagePreviewUrl(url)
      if (aviso) toast.warning(aviso)
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

  const handleAddObjetivo = () => {
    const newItem: ListaItem = {
      id: `objetivo-${Date.now()}`,
      texto: '',
    }
    setFormData({
      ...formData,
      itensObjetivos: [...(formData.itensObjetivos || []), newItem],
    })
  }

  const handleRemoveObjetivo = (id: string) => {
    setFormData({
      ...formData,
      itensObjetivos: formData.itensObjetivos?.filter((item) => item.id !== id),
    })
  }

  const handleUpdateObjetivo = (id: string, value: string) => {
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tamanho da Imagem <span className="text-red-500">*</span>
              </label>
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

      case 'video':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Título do Vídeo <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.videoTitulo || ''}
                onChange={(e) => setFormData({ ...formData, videoTitulo: e.target.value })}
                placeholder="Digite o título do vídeo..."
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Link do YouTube <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.videoUrl || ''}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                placeholder="Cole o link do vídeo do YouTube..."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Exemplo: https://www.youtube.com/watch?v=VIDEO_ID ou https://youtu.be/VIDEO_ID
              </p>
            </div>

            {formData.videoUrl && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pré-visualização
                </label>
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <iframe
                    src={`https://www.youtube.com/embed/${extractYouTubeId(formData.videoUrl)}`}
                    title="YouTube video preview"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
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
                        <Textarea
                          value={item.conteudo}
                          onChange={(e) =>
                            handleUpdateAccordionItem(item.id, 'conteudo', e.target.value)
                          }
                          placeholder="Conteúdo do item..."
                          className="resize-none text-sm"
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tipo de Lista <span className="text-red-500">*</span>
              </label>
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

      case 'objetivos-aprendizagem':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Objetivos de Aprendizagem <span className="text-red-500">*</span>
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddObjetivo}
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
                      onChange={(e) => handleUpdateObjetivo(item.id, e.target.value)}
                      placeholder="Descreva o objetivo de aprendizagem..."
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveObjetivo(item.id)}
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tipo de Info Box <span className="text-red-500">*</span>
              </label>
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
              <Textarea
                value={formData.conteudo || ''}
                onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                placeholder="Digite o conteúdo do destaque..."
                className="resize-none"
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
          <div className="space-y-5">
            <EditorDeItens
              rotulo="Flipcards"
              rotuloItem="Card"
              vazio="Nenhum flipcard adicionado ainda."
              itens={formData.itensFlipcard || []}
              criarItem={() => ({
                id: `flip-${Date.now()}`,
                tipoFrente: 'titulo' as const,
                imagemFrente: '',
                tituloFrente: '',
                conteudoVerso: '',
              })}
              onChange={(itensFlipcard) => setFormData({ ...formData, itensFlipcard })}
              campos={[
                {
                  chave: 'tipoFrente',
                  rotulo: 'Tipo de frente',
                  obrigatorio: true,
                  tipo: 'select',
                  opcoes: [
                    { valor: 'titulo', rotulo: 'Apenas título centralizado' },
                    { valor: 'imagem', rotulo: 'Apenas imagem' },
                    { valor: 'imagem-titulo', rotulo: 'Imagem com título no rodapé' },
                  ],
                },
                {
                  chave: 'imagemFrente',
                  rotulo: 'Imagem da frente',
                  obrigatorio: true,
                  tipo: 'imagem',
                  visivelSe: (card) => card.tipoFrente !== 'titulo',
                },
                {
                  chave: 'tituloFrente',
                  rotulo: 'Título da frente',
                  obrigatorio: true,
                  placeholder: 'Digite o título...',
                  visivelSe: (card) => card.tipoFrente !== 'imagem',
                },
                {
                  chave: 'conteudoVerso',
                  rotulo: 'Conteúdo do verso',
                  obrigatorio: true,
                  tipo: 'multilinha',
                  placeholder: 'Digite o conteúdo do verso...',
                },
              ]}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Altura dos cards
              </label>
              <Input
                value={formData.alturaCard || '300px'}
                onChange={(e) => setFormData({ ...formData, alturaCard: e.target.value })}
                placeholder="Ex: 300px, 20vh"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Até 4 cards por linha; eles se ajustam para ocupar toda a largura.
              </p>
            </div>
          </div>
        )

      case 'separador':
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Estilo
            </label>
            <Select
              value={formData.estiloSeparador || 'linha'}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  estiloSeparador: value as ConteudoUnidade['estiloSeparador'],
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
          </div>
        )

      case 'tabs':
        return (
          <EditorDeItens
            rotulo="Abas"
            rotuloItem="Aba"
            vazio="Nenhuma aba adicionada ainda."
            itens={formData.itensTabs || []}
            criarItem={() => ({ id: `tab-${Date.now()}`, titulo: '', conteudo: '' })}
            onChange={(itensTabs) => setFormData({ ...formData, itensTabs })}
            campos={[
              {
                chave: 'titulo',
                rotulo: 'Título',
                obrigatorio: true,
                placeholder: 'Título da aba...',
              },
              {
                chave: 'conteudo',
                rotulo: 'Conteúdo',
                obrigatorio: true,
                tipo: 'multilinha',
                placeholder: 'Conteúdo da aba...',
              },
            ]}
          />
        )

      case 'linha-do-tempo':
        return (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Orientação
              </label>
              <Select
                value={formData.orientacaoTimeline || 'vertical'}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    orientacaoTimeline: value as ConteudoUnidade['orientacaoTimeline'],
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
            </div>

            <EditorDeItens
              rotulo="Eventos"
              rotuloItem="Evento"
              vazio="Nenhum evento adicionado ainda."
              itens={formData.itensTimeline || []}
              criarItem={() => ({
                id: `evento-${Date.now()}`,
                data: '',
                titulo: '',
                descricao: '',
              })}
              onChange={(itensTimeline) => setFormData({ ...formData, itensTimeline })}
              campos={[
                { chave: 'data', rotulo: 'Data', placeholder: 'Ex.: 1990 ou Março/2024' },
                {
                  chave: 'titulo',
                  rotulo: 'Título',
                  obrigatorio: true,
                  placeholder: 'Título do evento...',
                },
                {
                  chave: 'descricao',
                  rotulo: 'Descrição',
                  tipo: 'multilinha',
                  placeholder: 'Descrição do evento...',
                },
              ]}
            />
          </div>
        )

      case 'carrossel':
        return (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Exibição
              </label>
              <Select
                value={formData.modoCarrossel || 'carrossel'}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    modoCarrossel: value as ConteudoUnidade['modoCarrossel'],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="carrossel">Carrossel</SelectItem>
                  <SelectItem value="grade">Grade</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <EditorDeItens
              rotulo="Imagens"
              rotuloItem="Imagem"
              vazio="Nenhuma imagem adicionada ainda."
              itens={formData.itensCarrossel || []}
              criarItem={() => ({ id: `img-${Date.now()}`, url: '', legenda: '', fonte: '' })}
              onChange={(itensCarrossel) => setFormData({ ...formData, itensCarrossel })}
              campos={[
                {
                  chave: 'url',
                  rotulo: 'URL da imagem',
                  obrigatorio: true,
                  placeholder: 'https://...',
                },
                { chave: 'legenda', rotulo: 'Legenda', placeholder: 'Legenda da imagem...' },
                { chave: 'fonte', rotulo: 'Fonte', placeholder: 'Fonte da imagem...' },
              ]}
            />
          </div>
        )

      case 'audio':
        return (
          <div className="space-y-5">
            <CampoArquivo
              categoria="audio"
              rotulo="Arquivo de áudio"
              url={formData.audioUrl || ''}
              onUrl={(audioUrl) => setFormData({ ...formData, audioUrl })}
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Título <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.audioTitulo || ''}
                onChange={(e) => setFormData({ ...formData, audioTitulo: e.target.value })}
                placeholder="Título do áudio..."
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Transcrição
              </label>
              <Textarea
                value={formData.transcricao || ''}
                onChange={(e) => setFormData({ ...formData, transcricao: e.target.value })}
                placeholder="Transcrição do áudio (recomendada para acessibilidade)..."
                rows={5}
              />
            </div>
          </div>
        )

      case 'pdf':
        return (
          <div className="space-y-5">
            <CampoArquivo
              categoria="documento"
              rotulo="Arquivo PDF"
              url={formData.pdfUrl || ''}
              onUrl={(pdfUrl) => setFormData({ ...formData, pdfUrl })}
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Título <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.pdfTitulo || ''}
                onChange={(e) => setFormData({ ...formData, pdfTitulo: e.target.value })}
                placeholder="Título do documento..."
              />
            </div>

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
            <CampoArquivo
              categoria="imagem"
              rotulo="Imagem de fundo"
              url={formData.imagemBase || ''}
              onUrl={(imagemBase) => setFormData({ ...formData, imagemBase })}
            />

            <EditorDeHotspots
              imagemBase={formData.imagemBase || ''}
              hotspots={formData.hotspots || []}
              onChange={(hotspots) => setFormData({ ...formData, hotspots })}
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Legenda
              </label>
              <Input
                value={formData.legenda || ''}
                onChange={(e) => setFormData({ ...formData, legenda: e.target.value })}
                placeholder="Legenda da imagem..."
              />
            </div>
          </div>
        )

      case 'associacao':
        return (
          <EditorDeItens
            rotulo="Pares"
            rotuloItem="Par"
            vazio="Nenhum par adicionado ainda."
            itens={formData.paresAssociacao || []}
            criarItem={() => ({ id: `par-${Date.now()}`, esquerda: '', direita: '' })}
            onChange={(paresAssociacao) => setFormData({ ...formData, paresAssociacao })}
            campos={[
              {
                chave: 'esquerda',
                rotulo: 'Item fixo',
                obrigatorio: true,
                placeholder: 'Ex.: Água',
              },
              {
                chave: 'direita',
                rotulo: 'Correspondente',
                obrigatorio: true,
                placeholder: 'Ex.: H₂O',
              },
            ]}
          />
        )

      case 'categorizacao':
        return (
          <EditorDeCategorias
            categorias={formData.categorias || []}
            onChange={(categorias) => setFormData({ ...formData, categorias })}
          />
        )

      default:
        return null
    }
  }

  const meta = selectedType ? CATALOGO_BLOCOS[selectedType] : null
  const Icon = meta?.icone

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
              <SheetTitle className="text-xl">{meta?.rotulo ?? 'Conteúdo'}</SheetTitle>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {renderForm()}
          {meta?.larguraAjustavel && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Largura do bloco
              </label>
              <div className="grid grid-cols-2 gap-2">
                {LARGURAS_BLOCO.map((largura) => (
                  <Button
                    key={largura.colunas}
                    type="button"
                    variant={(formData.colunas ?? 12) === largura.colunas ? 'default' : 'outline'}
                    onClick={() => setFormData({ ...formData, colunas: largura.colunas })}
                  >
                    {largura.rotulo}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Em meia largura o bloco divide a linha com o bloco seguinte.
              </p>
            </div>
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
