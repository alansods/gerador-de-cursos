'use client'

import { useId, useMemo, useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useIllustrationManifestQuery } from '@/hooks/queries/useIllustrationsQuery'
import {
  filterIllustrations,
  illustrationPath,
  type IllustrationManifest,
} from '@/lib/illustration-catalog'
import { ILLUSTRATION_CARD_COLOR } from '@/lib/illustration-paths'

const SELECT_CLASS =
  'h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

interface IllustrationPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  value?: string
  onSelect: (path: string) => void
}

export function IllustrationPicker({
  open,
  onOpenChange,
  value,
  onSelect,
}: IllustrationPickerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Acervo de ilustrações</DialogTitle>
          <DialogDescription>
            Escolha uma ilustração. Ela vai junto no pacote SCORM e funciona sem internet.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <IllustrationPickerData
            value={value}
            onCancel={() => onOpenChange(false)}
            onConfirm={(path) => {
              onSelect(path)
              onOpenChange(false)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function IllustrationPickerData({
  value,
  onCancel,
  onConfirm,
}: {
  value?: string
  onCancel: () => void
  onConfirm: (path: string) => void
}) {
  const { data, isLoading, isError } = useIllustrationManifestQuery()

  if (isLoading) {
    return (
      <p className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando o acervo...
      </p>
    )
  }

  if (isError || !data) {
    return (
      <p className="py-10 text-sm text-destructive">
        Não foi possível carregar o acervo de ilustrações.
      </p>
    )
  }

  return (
    <IllustrationBrowser manifest={data} value={value} onCancel={onCancel} onConfirm={onConfirm} />
  )
}

export function IllustrationBrowser({
  manifest,
  value,
  onCancel,
  onConfirm,
}: {
  manifest: IllustrationManifest
  value?: string
  onCancel: () => void
  onConfirm: (path: string) => void
}) {
  const ids = useId()
  const initial = manifest.items.find((item) => illustrationPath(item) === value)
  const [query, setQuery] = useState('')
  const [theme, setTheme] = useState('')
  const [category, setCategory] = useState('')
  const [set, setSet] = useState('')
  const [selectedId, setSelectedId] = useState(initial?.id ?? '')

  const categories = manifest.categories.filter((entry) => !theme || entry.theme === theme)
  const sets = useMemo(
    () => [...new Set(manifest.items.map((item) => item.set))].sort(),
    [manifest.items]
  )
  const results = filterIllustrations(manifest.items, { theme, category, set, query })
  const selected = manifest.items.find((item) => item.id === selectedId)
  const themeTitle = (id: string) => manifest.themes.find((entry) => entry.id === id)?.title ?? id

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <label className="relative sm:col-span-4">
          <span className="sr-only">Buscar ilustração</span>
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome ou palavra-chave"
            className="pl-9"
          />
        </label>

        <div className="space-y-1">
          <label htmlFor={`${ids}-theme`} className="text-xs font-medium text-muted-foreground">
            Tema
          </label>
          <select
            id={`${ids}-theme`}
            value={theme}
            onChange={(event) => {
              setTheme(event.target.value)
              setCategory('')
            }}
            className={SELECT_CLASS}
          >
            <option value="">Todos os temas</option>
            {manifest.themes.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.title}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor={`${ids}-category`} className="text-xs font-medium text-muted-foreground">
            Categoria
          </label>
          <select
            id={`${ids}-category`}
            value={category ? `${theme}/${category}` : ''}
            onChange={(event) => {
              const [nextTheme, nextCategory] = event.target.value.split('/')
              if (nextTheme) setTheme(nextTheme)
              setCategory(nextCategory ?? '')
            }}
            className={SELECT_CLASS}
          >
            <option value="">Todas as categorias</option>
            {categories.map((entry) => (
              <option key={`${entry.theme}/${entry.id}`} value={`${entry.theme}/${entry.id}`}>
                {theme ? entry.title : `${entry.title} (${themeTitle(entry.theme)})`}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor={`${ids}-set`} className="text-xs font-medium text-muted-foreground">
            Acervo
          </label>
          <select
            id={`${ids}-set`}
            value={set}
            onChange={(event) => setSet(event.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">Todos os acervos</option>
            {sets.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </div>

        <p aria-live="polite" className="self-end pb-2 text-xs text-muted-foreground sm:text-right">
          {results.length === 1 ? '1 ilustração' : `${results.length} ilustrações`}
        </p>
      </div>

      <div className="grid min-h-0 gap-4 md:grid-cols-[1fr_16rem]">
        {results.length === 0 ? (
          <p className="rounded-md border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
            Nenhuma ilustração encontrada. Tente outra busca ou limpe os filtros.
          </p>
        ) : (
          <ul
            aria-label="Ilustrações"
            className="grid max-h-[45vh] grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4 lg:grid-cols-5"
          >
            {results.map((item) => {
              const isSelected = item.id === selectedId
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedId(item.id)}
                    onDoubleClick={() => onConfirm(illustrationPath(item))}
                    className={`flex w-full flex-col items-center gap-1 rounded-md border-2 p-1.5 text-center text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent hover:border-border'
                    }`}
                  >
                    <span
                      className="flex aspect-square w-full items-center justify-center rounded-md p-2"
                      style={{ backgroundColor: ILLUSTRATION_CARD_COLOR }}
                    >
                      <img
                        src={illustrationPath(item)}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-contain"
                      />
                    </span>
                    <span className="line-clamp-2 leading-tight">{item.title}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        <aside aria-label="Pré-visualização" className="space-y-3 rounded-md border p-3">
          {selected ? (
            <>
              <div
                className="flex aspect-square items-center justify-center rounded-xl p-4"
                style={{ backgroundColor: ILLUSTRATION_CARD_COLOR }}
              >
                <img
                  src={illustrationPath(selected)}
                  alt={selected.title}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold">{selected.title}</p>
                <p className="text-xs text-muted-foreground">
                  {themeTitle(selected.theme)} · acervo {selected.set} · licença {selected.license}
                </p>
                <p className="text-xs text-muted-foreground">{selected.tags.join(', ')}</p>
              </div>
            </>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Selecione uma ilustração para ver maior.
            </p>
          )}
        </aside>
      </div>

      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="button"
          disabled={!selected}
          onClick={() => selected && onConfirm(illustrationPath(selected))}
        >
          Usar ilustração
        </Button>
      </DialogFooter>
    </div>
  )
}
