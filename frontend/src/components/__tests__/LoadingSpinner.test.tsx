import React from 'react'
import { render, screen } from '@/utils/test-utils'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders without crashing', () => {
    render(<LoadingSpinner />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('displays custom message when provided', () => {
    const message = 'Loading trips...'
    render(<LoadingSpinner message={message} />)
    expect(screen.getByText(message)).toBeInTheDocument()
  })

  it('renders with custom size', () => {
    render(<LoadingSpinner size={60} />)
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toHaveStyle({ width: '60px', height: '60px' })
  })

  it('applies fullScreen styles when enabled', () => {
    render(<LoadingSpinner fullScreen />)
    const container = screen.getByRole('progressbar').closest('div')
    expect(container).toHaveClass('MuiBox-root')
  })

  it('does not display message when not provided', () => {
    render(<LoadingSpinner />)
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
  })
})