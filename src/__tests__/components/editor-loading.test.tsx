import '@testing-library/jest-dom'
import { act, render, renderHook, screen } from '@testing-library/react'
import Loading from '@/app/(app)/courses/[id]/edit/loading'
import { useMountAfterFirstOpen } from '@/components/course/editor/lazy-editor-parts'
import { usePDF } from '@/hooks/usePDF'

let pdfServiceLoaded = false
const mockGenerateCoursePDF = jest.fn()

jest.mock('@/lib/pdf-service', () => {
  pdfServiceLoaded = true
  return { generateCoursePDF: (...args: unknown[]) => mockGenerateCoursePDF(...args) }
})

describe('editor loading route', () => {
  it('shows the editor loading state while the route loads', () => {
    render(<Loading />)

    expect(screen.getByRole('status')).toHaveTextContent('Carregando curso...')
  })
})

describe('useMountAfterFirstOpen', () => {
  it('stays unmounted until the first open and keeps it mounted after closing', () => {
    const { result, rerender } = renderHook(({ open }) => useMountAfterFirstOpen(open), {
      initialProps: { open: false },
    })

    expect(result.current).toBe(false)

    rerender({ open: true })
    expect(result.current).toBe(true)

    rerender({ open: false })
    expect(result.current).toBe(true)
  })
})

describe('usePDF', () => {
  it('only loads the PDF library when a PDF is generated', async () => {
    const { result } = renderHook(() => usePDF())

    expect(pdfServiceLoaded).toBe(false)

    await act(() => result.current.generatePDF({ title: 'Curso', units: [] } as never, 'curso'))

    expect(pdfServiceLoaded).toBe(true)
    expect(mockGenerateCoursePDF).toHaveBeenCalledWith({ title: 'Curso', units: [] }, 'curso')
  })
})
