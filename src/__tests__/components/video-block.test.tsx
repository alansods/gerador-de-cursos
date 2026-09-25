import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { VideoBlock } from '@/components/course/blocks/VideoBlock'
import type { Block } from '@/types/course'

const video = (fields: Partial<Block>) => ({ id: 'v1', type: 'video', ...fields }) as Block

describe('VideoBlock', () => {
  it('marks a lesson whose video was not added yet as pending', () => {
    render(<VideoBlock item={video({ videoTitle: 'Olá, .NET', videoUrl: '' })} />)

    expect(screen.getByText('Olá, .NET')).toBeInTheDocument()
    expect(screen.getByText('Vídeo pendente')).toBeInTheDocument()
  })

  it('plays the video once it has a link', () => {
    render(
      <VideoBlock
        item={video({ videoTitle: 'Olá, .NET', videoUrl: 'https://youtu.be/dQw4w9WgXcQ' })}
      />
    )

    expect(screen.queryByText('Vídeo pendente')).toBeNull()
    expect(screen.getByTitle('Olá, .NET')).toHaveAttribute(
      'src',
      'https://www.youtube.com/embed/dQw4w9WgXcQ'
    )
  })
})
