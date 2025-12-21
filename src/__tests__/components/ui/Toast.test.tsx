import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import Toast, {
  ToastContainer,
  useToast,
} from '@/components/ui/Toast/Toast'

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('rendering', () => {
    it('renders success toast with message', () => {
      render(
        <Toast message="Success message" type="success" onClose={() => {}} />,
      )

      expect(screen.getByText('Success message')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('renders error toast with message', () => {
      render(
        <Toast message="Error message" type="error" onClose={() => {}} />,
      )

      expect(screen.getByText('Error message')).toBeInTheDocument()
    })
  })

  describe('auto-dismiss', () => {
    it('calls onClose after default duration (4000ms)', async () => {
      const handleClose = vi.fn()
      render(
        <Toast message="Test" type="success" onClose={handleClose} />,
      )

      expect(handleClose).not.toHaveBeenCalled()

      // Fast-forward past duration + animation time
      act(() => {
        vi.advanceTimersByTime(4000)
      })

      // Wait for the leaving animation (200ms)
      act(() => {
        vi.advanceTimersByTime(200)
      })

      expect(handleClose).toHaveBeenCalledTimes(1)
    })

    it('respects custom duration', async () => {
      const handleClose = vi.fn()
      render(
        <Toast
          message="Test"
          type="success"
          duration={2000}
          onClose={handleClose}
        />,
      )

      // Advance less than custom duration
      act(() => {
        vi.advanceTimersByTime(1500)
      })
      expect(handleClose).not.toHaveBeenCalled()

      // Advance to custom duration + animation
      act(() => {
        vi.advanceTimersByTime(700)
      })

      expect(handleClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('manual close', () => {
    it('calls onClose when close button is clicked', async () => {
      const handleClose = vi.fn()
      render(
        <Toast message="Test" type="success" onClose={handleClose} />,
      )

      fireEvent.click(screen.getByRole('button', { name: 'Close' }))

      // Wait for animation
      act(() => {
        vi.advanceTimersByTime(200)
      })

      expect(handleClose).toHaveBeenCalledTimes(1)
    })
  })
})

describe('ToastContainer', () => {
  it('renders nothing when toasts array is empty', () => {
    const { container } = render(
      <ToastContainer toasts={[]} onRemove={() => {}} />,
    )

    expect(container.firstChild).toBeNull()
  })

  it('renders multiple toasts', () => {
    const toasts = [
      { id: '1', message: 'First toast', type: 'success' as const },
      { id: '2', message: 'Second toast', type: 'error' as const },
    ]

    render(<ToastContainer toasts={toasts} onRemove={() => {}} />)

    expect(screen.getByText('First toast')).toBeInTheDocument()
    expect(screen.getByText('Second toast')).toBeInTheDocument()
  })

  it('calls onRemove with correct id when toast closes', async () => {
    vi.useFakeTimers()
    const handleRemove = vi.fn()
    const toasts = [{ id: 'test-id', message: 'Test', type: 'success' as const }]

    render(<ToastContainer toasts={toasts} onRemove={handleRemove} />)

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(handleRemove).toHaveBeenCalledWith('test-id')
    vi.useRealTimers()
  })
})

describe('useToast hook', () => {
  function TestComponent() {
    const { toasts, removeToast, showSuccess, showError } = useToast()

    return (
      <div>
        <button onClick={() => showSuccess('Success!')}>Show Success</button>
        <button onClick={() => showError('Error!')}>Show Error</button>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    )
  }

  it('showSuccess adds a success toast', () => {
    render(<TestComponent />)

    fireEvent.click(screen.getByRole('button', { name: 'Show Success' }))

    expect(screen.getByText('Success!')).toBeInTheDocument()
  })

  it('showError adds an error toast', () => {
    render(<TestComponent />)

    fireEvent.click(screen.getByRole('button', { name: 'Show Error' }))

    expect(screen.getByText('Error!')).toBeInTheDocument()
  })

  it('can add multiple toasts', () => {
    render(<TestComponent />)

    fireEvent.click(screen.getByRole('button', { name: 'Show Success' }))
    fireEvent.click(screen.getByRole('button', { name: 'Show Error' }))

    expect(screen.getByText('Success!')).toBeInTheDocument()
    expect(screen.getByText('Error!')).toBeInTheDocument()
  })

  it('removeToast removes the correct toast', () => {
    vi.useFakeTimers()
    render(<TestComponent />)

    // Add a toast
    fireEvent.click(screen.getByRole('button', { name: 'Show Success' }))
    expect(screen.getByText('Success!')).toBeInTheDocument()

    // Close it
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    act(() => {
      vi.advanceTimersByTime(200)
    })

    // Toast should be removed
    expect(screen.queryByText('Success!')).not.toBeInTheDocument()

    vi.useRealTimers()
  })
})
