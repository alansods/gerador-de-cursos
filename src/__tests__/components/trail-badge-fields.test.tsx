import '@testing-library/jest-dom'
import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BADGE_ICONS } from '@/lib/trail-progress'
import { BADGE_NAME_MAX_LENGTH, TrailBadgeFields } from '@/components/course/TrailBadgeFields'

function Harness({ layout = 'trail', initialName = '', initialIcon = '' }) {
  const [name, setName] = useState(initialName)
  const [icon, setIcon] = useState(initialIcon)
  return (
    <>
      <TrailBadgeFields
        layout={layout}
        unitIndex={2}
        name={name}
        icon={icon}
        onNameChange={setName}
        onIconChange={setIcon}
      />
      <output data-testid="value">{`${name}|${icon}`}</output>
    </>
  )
}

describe('TrailBadgeFields', () => {
  it('renders nothing outside the trail layout', () => {
    const { container } = render(<Harness layout="classic" />)

    expect(container.querySelector('fieldset')).not.toBeInTheDocument()
  })

  it('shows the default badge name for the unit position as placeholder', () => {
    render(<Harness />)

    expect(screen.getByLabelText(/Nome da medalha/)).toHaveAttribute(
      'placeholder',
      'Unidade 3 concluída'
    )
    expect(screen.getByLabelText(/Nome da medalha/)).toHaveAttribute(
      'maxLength',
      String(BADGE_NAME_MAX_LENGTH)
    )
  })

  it('edits the name and picks an icon by click, with the choice announced', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.type(screen.getByLabelText(/Nome da medalha/), 'Mãos limpas')
    await user.click(screen.getByRole('button', { name: 'Brilho' }))

    expect(screen.getByTestId('value')).toHaveTextContent('Mãos limpas|sparkles')
    expect(screen.getByRole('button', { name: 'Brilho' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /^Padrão/ })).toHaveAttribute('aria-pressed', 'false')
  })

  it('returns to the default icon', async () => {
    const user = userEvent.setup()
    render(<Harness initialIcon="flame" />)

    await user.click(screen.getByRole('button', { name: /^Padrão/ }))

    expect(screen.getByTestId('value')).toHaveTextContent('|')
    expect(screen.getByRole('button', { name: /^Padrão/ })).toHaveAttribute('aria-pressed', 'true')
  })

  it('offers every curated icon plus the default option', () => {
    render(<Harness />)

    expect(screen.getAllByRole('button')).toHaveLength(BADGE_ICONS.length + 1)
  })
})
