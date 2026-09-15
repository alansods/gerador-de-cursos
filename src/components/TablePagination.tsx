'use client'

import { useId } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getPageItems } from '@/lib/pagination'

interface TablePaginationProps {
  page: number
  pageSize: number
  total: number
  pageSizeOptions: readonly number[]
  pageSizeLabel: string
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export function TablePagination({
  page,
  pageSize,
  total,
  pageSizeOptions,
  pageSizeLabel,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  const pageSizeLabelId = useId()
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const firstItem = total === 0 ? 0 : (page - 1) * pageSize + 1
  const lastItem = Math.min(page * pageSize, total)
  const isFirstPage = page <= 1
  const isLastPage = page >= totalPages

  return (
    <nav
      aria-label="Paginação"
      className="py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border"
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span id={pageSizeLabelId}>{pageSizeLabel}</span>
        <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
          <SelectTrigger aria-labelledby={pageSizeLabelId} className="h-8 w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="text-sm text-muted-foreground">
        {firstItem}–{lastItem} de {total}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          aria-label="Primeira página"
          disabled={isFirstPage}
          onClick={() => onPageChange(1)}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          aria-label="Página anterior"
          disabled={isFirstPage}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="hidden sm:flex items-center gap-1">
          {getPageItems(page, totalPages).map((item) =>
            typeof item === 'number' ? (
              <Button
                key={item}
                variant={item === page ? 'default' : 'ghost'}
                size="sm"
                className="h-8 min-w-8 px-2"
                aria-label={`Página ${item}`}
                aria-current={item === page ? 'page' : undefined}
                onClick={() => onPageChange(item)}
              >
                {item}
              </Button>
            ) : (
              <span key={item} aria-hidden className="px-1 text-muted-foreground">
                …
              </span>
            )
          )}
        </div>

        <span className="sm:hidden px-2 text-sm text-muted-foreground">
          Página {page} de {totalPages}
        </span>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          aria-label="Próxima página"
          disabled={isLastPage}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          aria-label="Última página"
          disabled={isLastPage}
          onClick={() => onPageChange(totalPages)}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  )
}
