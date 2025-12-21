import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Modal from '@/components/ui/Modal/Modal'

describe('Modal', () => {
  describe('visibility', () => {
    it('renders nothing when isOpen is false', () => {
      render(
        <Modal isOpen={false} onClose={() => {}} title="Test Modal">
          <div>Content</div>
        </Modal>,
      )

      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
    })

    it('renders modal when isOpen is true', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal">
          <div>Content</div>
        </Modal>,
      )

      expect(screen.getByText('Test Modal')).toBeInTheDocument()
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  describe('close functionality', () => {
    it('calls onClose when close button is clicked', () => {
      const handleClose = vi.fn()
      render(
        <Modal isOpen={true} onClose={handleClose} title="Test Modal">
          <div>Content</div>
        </Modal>,
      )

      fireEvent.click(screen.getByRole('button', { name: 'Close' }))

      expect(handleClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when clicking backdrop', () => {
      const handleClose = vi.fn()
      render(
        <Modal isOpen={true} onClose={handleClose} title="Test Modal">
          <div>Content</div>
        </Modal>,
      )

      // Click on the backdrop (the outer div)
      const backdrop = screen.getByRole('dialog').parentElement!
      fireEvent.click(backdrop)

      expect(handleClose).toHaveBeenCalledTimes(1)
    })

    it('does not close when clicking inside modal', () => {
      const handleClose = vi.fn()
      render(
        <Modal isOpen={true} onClose={handleClose} title="Test Modal">
          <div>Content</div>
        </Modal>,
      )

      fireEvent.click(screen.getByText('Content'))

      expect(handleClose).not.toHaveBeenCalled()
    })

    it('calls onClose when Escape key is pressed', () => {
      const handleClose = vi.fn()
      render(
        <Modal isOpen={true} onClose={handleClose} title="Test Modal">
          <div>Content</div>
        </Modal>,
      )

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(handleClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('form mode', () => {
    it('renders form with submit button when onSubmit is provided', () => {
      render(
        <Modal
          isOpen={true}
          onClose={() => {}}
          title="Test Modal"
          onSubmit={() => {}}
          submitLabel="Save"
        >
          <input placeholder="Test input" />
        </Modal>,
      )

      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    })

    it('calls onSubmit when form is submitted', () => {
      const handleSubmit = vi.fn((e) => e.preventDefault())
      render(
        <Modal
          isOpen={true}
          onClose={() => {}}
          title="Test Modal"
          onSubmit={handleSubmit}
          submitLabel="Save"
        >
          <input placeholder="Test input" />
        </Modal>,
      )

      fireEvent.click(screen.getByRole('button', { name: 'Save' }))

      expect(handleSubmit).toHaveBeenCalled()
    })

    it('disables submit button when submitDisabled is true', () => {
      render(
        <Modal
          isOpen={true}
          onClose={() => {}}
          title="Test Modal"
          onSubmit={() => {}}
          submitLabel="Save"
          submitDisabled={true}
        >
          <input placeholder="Test input" />
        </Modal>,
      )

      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    })

    it('shows saving state when saving is true', () => {
      render(
        <Modal
          isOpen={true}
          onClose={() => {}}
          title="Test Modal"
          onSubmit={() => {}}
          submitLabel="Save"
          saving={true}
        >
          <input placeholder="Test input" />
        </Modal>,
      )

      expect(screen.getByText('Saving…')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    })

    it('displays error message when error is provided', () => {
      render(
        <Modal
          isOpen={true}
          onClose={() => {}}
          title="Test Modal"
          onSubmit={() => {}}
          submitLabel="Save"
          error="Something went wrong"
        >
          <input placeholder="Test input" />
        </Modal>,
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('calls onClose when cancel button is clicked', () => {
      const handleClose = vi.fn()
      render(
        <Modal
          isOpen={true}
          onClose={handleClose}
          title="Test Modal"
          onSubmit={() => {}}
          submitLabel="Save"
        >
          <input placeholder="Test input" />
        </Modal>,
      )

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(handleClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('content mode (no form)', () => {
    it('renders children without form when onSubmit is not provided', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal">
          <div>Just content, no form</div>
        </Modal>,
      )

      expect(screen.getByText('Just content, no form')).toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'Save' }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'Cancel' }),
      ).not.toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has dialog role', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal">
          <div>Content</div>
        </Modal>,
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('has aria-modal attribute', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal">
          <div>Content</div>
        </Modal>,
      )

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
    })
  })
})
