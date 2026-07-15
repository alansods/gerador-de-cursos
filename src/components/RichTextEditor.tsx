'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useCallback } from 'react'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
} from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: number
  autoFocus?: boolean
}

const COLORS = [
  { label: 'Padrão', value: '' },
  { label: 'Preto', value: '#111827' },
  { label: 'Cinza', value: '#6B7280' },
  { label: 'Azul', value: '#2563EB' },
  { label: 'Verde', value: '#16A34A' },
  { label: 'Vermelho', value: '#DC2626' },
  { label: 'Laranja', value: '#EA580C' },
  { label: 'Roxo', value: '#9333EA' },
]

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Digite o conteúdo...',
  minHeight = 160,
  autoFocus = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    autofocus: autoFocus ? 'end' : false,
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'outline-none',
      },
    },
  })

  // Sincronizar valor externo (ex: ao abrir o modal com conteúdo existente)
  const syncContent = useCallback(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (current !== value) {
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
  }, [editor, value])

  useEffect(() => {
    syncContent()
  }, [syncContent])

  if (!editor) {
    return (
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden animate-pulse">
        {/* Toolbar Skeleton */}
        <div className="flex items-center gap-2 px-2 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
          <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        {/* Content Skeleton */}
        <div className="px-3 py-2.5 bg-white dark:bg-gray-900 space-y-2" style={{ minHeight }}>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
        </div>
      </div>
    )
  }

  const ToolbarButton = ({
    onClick,
    active,
    title,
    children,
  }: {
    onClick: () => void
    active?: boolean
    title: string
    children: React.ReactNode
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        active
          ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100'
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200'
      }`}
    >
      {children}
    </button>
  )

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        {/* Negrito / Itálico / Sublinhado */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Negrito"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Itálico"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="Sublinhado"
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* Alinhamento */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
          title="Alinhar à esquerda"
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
          title="Centralizar"
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
          title="Alinhar à direita"
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          active={editor.isActive({ textAlign: 'justify' })}
          title="Justificar"
        >
          <AlignJustify className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* Listas */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Lista com marcadores"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Lista numerada"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* Cor do texto */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400 select-none">Cor:</span>
          <div className="flex gap-0.5">
            {COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                title={c.label}
                onClick={() => {
                  if (c.value) {
                    editor.chain().focus().setColor(c.value).run()
                  } else {
                    editor.chain().focus().unsetColor().run()
                  }
                }}
                className={`w-4 h-4 rounded-full border transition-transform hover:scale-110 ${
                  c.value === ''
                    ? 'bg-gradient-to-br from-gray-200 to-gray-400 border-gray-400'
                    : 'border-gray-300 dark:border-gray-600'
                } ${
                  editor.isActive('textStyle', { color: c.value }) && c.value
                    ? 'ring-2 ring-offset-1 ring-blue-500'
                    : ''
                }`}
                style={c.value ? { backgroundColor: c.value } : undefined}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Área de edição */}
      <EditorContent
        editor={editor}
        className="px-3 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm leading-relaxed [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:my-1 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_.is-editor-empty]:before:content-[attr(data-placeholder)] [&_.ProseMirror_.is-editor-empty]:before:text-gray-400 [&_.ProseMirror_.is-editor-empty]:before:dark:text-gray-600 [&_.ProseMirror_.is-editor-empty]:before:pointer-events-none [&_.ProseMirror_.is-editor-empty]:before:float-left [&_.ProseMirror_.is-editor-empty]:before:h-0"
        style={{ minHeight }}
      />
    </div>
  )
}
