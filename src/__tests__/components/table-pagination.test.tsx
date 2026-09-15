import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TablePagination } from '@/components/TablePagination'

const renderPagination = (props: Partial<React.ComponentProps<typeof TablePagination>> = {}) => {
  const onPageChange = jest.fn()
  const onPageSizeChange = jest.fn()

  render(
    <TablePagination
      page={1}
      pageSize={20}
      total={137}
      pageSizeOptions={[20, 50, 100]}
      pageSizeLabel="Cursos por página"
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      {...props}
    />
  )

  return { onPageChange, onPageSizeChange }
}

describe('TablePagination', () => {
  it('shows the range of the current page', () => {
    renderPagination({ page: 2 })

    expect(screen.getByText('21–40 de 137')).toBeInTheDocument()
  })

  it('caps the range at the total on the last page', () => {
    renderPagination({ page: 7 })

    expect(screen.getByText('121–137 de 137')).toBeInTheDocument()
  })

  it('disables first and previous on the first page', () => {
    renderPagination({ page: 1 })

    expect(screen.getByRole('button', { name: 'Primeira página' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Última página' })).toBeEnabled()
  })

  it('disables next and last on the last page', () => {
    renderPagination({ page: 7 })

    expect(screen.getByRole('button', { name: 'Próxima página' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Última página' })).toBeDisabled()
  })

  it('jumps to the first, previous, next, last and a numbered page', async () => {
    const user = userEvent.setup()
    const { onPageChange } = renderPagination({ page: 4 })

    await user.click(screen.getByRole('button', { name: 'Primeira página' }))
    await user.click(screen.getByRole('button', { name: 'Página anterior' }))
    await user.click(screen.getByRole('button', { name: 'Próxima página' }))
    await user.click(screen.getByRole('button', { name: 'Última página' }))
    await user.click(screen.getByRole('button', { name: 'Página 5' }))

    expect(onPageChange.mock.calls.map(([page]) => page)).toEqual([1, 3, 5, 7, 5])
  })

  it('marks the current page', () => {
    renderPagination({ page: 3 })

    expect(screen.getByRole('button', { name: 'Página 3' })).toHaveAttribute('aria-current', 'page')
  })

  it('reports the chosen page size', async () => {
    const user = userEvent.setup()
    const { onPageSizeChange } = renderPagination()

    await user.click(screen.getByRole('combobox', { name: 'Cursos por página' }))
    await user.click(await screen.findByRole('option', { name: '50' }))

    expect(onPageSizeChange).toHaveBeenCalledWith(50)
  })
})
