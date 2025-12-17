import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DatePicker from '@/components/ui/DatePicker/DatePicker'

describe('DatePicker', () => {
  beforeEach(() => {
    // Mock current date to January 15, 2025 for consistent tests
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 0, 15))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial render', () => {
    it('displays formatted date when value is provided', () => {
      render(<DatePicker value="2025-01-15" onChange={() => {}} />)
      expect(screen.getByText('January 15, 2025')).toBeInTheDocument()
    })

    it('displays placeholder when no value', () => {
      render(<DatePicker value="" onChange={() => {}} />)
      expect(screen.getByText('Select date...')).toBeInTheDocument()
    })

    it('calendar is closed by default', () => {
      render(<DatePicker value="2025-01-15" onChange={() => {}} />)
      expect(screen.queryByText('Sun')).not.toBeInTheDocument()
    })
  })

  describe('opening and closing calendar', () => {
    it('opens calendar when trigger button is clicked', () => {
      render(<DatePicker value="2025-01-15" onChange={() => {}} />)

      fireEvent.click(screen.getByRole('button', { name: /january 15/i }))

      // Calendar header should be visible
      expect(screen.getByText('January 2025')).toBeInTheDocument()
      // Day headers should be visible
      expect(screen.getByText('Sun')).toBeInTheDocument()
      expect(screen.getByText('Mon')).toBeInTheDocument()
    })

    it('closes calendar when clicking trigger again', () => {
      render(<DatePicker value="2025-01-15" onChange={() => {}} />)

      const trigger = screen.getByRole('button', { name: /january 15/i })

      // Open
      fireEvent.click(trigger)
      expect(screen.getByText('January 2025')).toBeInTheDocument()

      // Close
      fireEvent.click(trigger)
      expect(screen.queryByText('January 2025')).not.toBeInTheDocument()
    })

    it('closes calendar when clicking outside', () => {
      render(
        <div>
          <DatePicker value="2025-01-15" onChange={() => {}} />
          <div data-testid="outside">Outside</div>
        </div>,
      )

      // Open calendar
      fireEvent.click(screen.getByRole('button', { name: /january 15/i }))
      expect(screen.getByText('January 2025')).toBeInTheDocument()

      // Click outside
      fireEvent.mouseDown(screen.getByTestId('outside'))
      expect(screen.queryByText('January 2025')).not.toBeInTheDocument()
    })
  })

  describe('month navigation', () => {
    it('navigates to previous month when clicking prev button', () => {
      render(<DatePicker value="2025-01-15" onChange={() => {}} />)

      // Open calendar
      fireEvent.click(screen.getByRole('button', { name: /january 15/i }))
      expect(screen.getByText('January 2025')).toBeInTheDocument()

      // Click prev month (first nav button)
      const navButtons = screen.getAllByRole('button')
      const prevButton = navButtons.find((btn) =>
        btn.querySelector('svg path[d="M15 18l-6-6 6-6"]'),
      )!
      fireEvent.click(prevButton)

      expect(screen.getByText('December 2024')).toBeInTheDocument()
    })

    it('navigates to next month when clicking next button', () => {
      render(<DatePicker value="2025-01-15" onChange={() => {}} />)

      // Open calendar
      fireEvent.click(screen.getByRole('button', { name: /january 15/i }))

      // Click next month (second nav button)
      const navButtons = screen.getAllByRole('button')
      const nextButton = navButtons.find((btn) =>
        btn.querySelector('svg path[d="M9 18l6-6-6-6"]'),
      )!
      fireEvent.click(nextButton)

      expect(screen.getByText('February 2025')).toBeInTheDocument()
    })

    it('can navigate multiple months', () => {
      render(<DatePicker value="2025-01-15" onChange={() => {}} />)

      // Open calendar
      fireEvent.click(screen.getByRole('button', { name: /january 15/i }))

      // Navigate forward 3 months
      const navButtons = screen.getAllByRole('button')
      const nextButton = navButtons.find((btn) =>
        btn.querySelector('svg path[d="M9 18l6-6-6-6"]'),
      )!

      fireEvent.click(nextButton)
      fireEvent.click(nextButton)
      fireEvent.click(nextButton)

      expect(screen.getByText('April 2025')).toBeInTheDocument()
    })
  })

  describe('selecting a date', () => {
    it('calls onChange with selected date', () => {
      const handleChange = vi.fn()
      render(<DatePicker value="2025-01-15" onChange={handleChange} />)

      // Open calendar
      fireEvent.click(screen.getByRole('button', { name: /january 15/i }))

      // Click on day 20
      fireEvent.click(screen.getByRole('button', { name: '20' }))

      expect(handleChange).toHaveBeenCalledWith('2025-01-20')
    })

    it('closes calendar after selecting a date', () => {
      render(<DatePicker value="2025-01-15" onChange={() => {}} />)

      // Open calendar
      fireEvent.click(screen.getByRole('button', { name: /january 15/i }))
      expect(screen.getByText('January 2025')).toBeInTheDocument()

      // Select a date
      fireEvent.click(screen.getByRole('button', { name: '20' }))

      // Calendar should close
      expect(screen.queryByText('January 2025')).not.toBeInTheDocument()
    })

    it('can select a date in a different month after navigating', () => {
      const handleChange = vi.fn()
      render(<DatePicker value="2025-01-15" onChange={handleChange} />)

      // Open calendar
      fireEvent.click(screen.getByRole('button', { name: /january 15/i }))

      // Navigate to February
      const navButtons = screen.getAllByRole('button')
      const nextButton = navButtons.find((btn) =>
        btn.querySelector('svg path[d="M9 18l6-6-6-6"]'),
      )!
      fireEvent.click(nextButton)

      // Select Feb 10
      fireEvent.click(screen.getByRole('button', { name: '10' }))

      expect(handleChange).toHaveBeenCalledWith('2025-02-10')
    })
  })

  describe('Today button', () => {
    it('selects today when clicking Today button', () => {
      const handleChange = vi.fn()
      render(<DatePicker value="2025-03-01" onChange={handleChange} />)

      // Open calendar (showing March)
      fireEvent.click(screen.getByRole('button', { name: /march 1/i }))

      // Click Today button
      fireEvent.click(screen.getByRole('button', { name: 'Today' }))

      // Should select Jan 15, 2025 (our mocked today)
      expect(handleChange).toHaveBeenCalledWith('2025-01-15')
    })

    it('closes calendar after clicking Today', () => {
      render(<DatePicker value="2025-03-01" onChange={() => {}} />)

      // Open calendar
      fireEvent.click(screen.getByRole('button', { name: /march 1/i }))
      expect(screen.getByText('March 2025')).toBeInTheDocument()

      // Click Today
      fireEvent.click(screen.getByRole('button', { name: 'Today' }))

      // Calendar should close
      expect(screen.queryByText('March 2025')).not.toBeInTheDocument()
    })
  })

  describe('visual states', () => {
    it('highlights the selected date', () => {
      render(<DatePicker value="2025-01-15" onChange={() => {}} />)

      // Open calendar
      fireEvent.click(screen.getByRole('button', { name: /january 15/i }))

      // Day 15 should have selected class
      const day15 = screen.getByRole('button', { name: '15' })
      expect(day15.className).toContain('daySelected')
    })

    it('highlights today', () => {
      render(<DatePicker value="2025-01-20" onChange={() => {}} />)

      // Open calendar
      fireEvent.click(screen.getByRole('button', { name: /january 20/i }))

      // Day 15 (today) should have today class
      const day15 = screen.getByRole('button', { name: '15' })
      expect(day15.className).toContain('dayToday')
    })
  })

  describe('calendar grid generation', () => {
    it('renders correct number of days for January', () => {
      render(<DatePicker value="2025-01-15" onChange={() => {}} />)

      // Open calendar
      fireEvent.click(screen.getByRole('button', { name: /january 15/i }))

      // January 2025 has 31 days
      expect(screen.getByRole('button', { name: '31' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: '32' })).not.toBeInTheDocument()
    })

    it('renders correct number of days for February in non-leap year', () => {
      render(<DatePicker value="2025-02-15" onChange={() => {}} />)

      // Open calendar
      fireEvent.click(screen.getByRole('button', { name: /february 15/i }))

      // February 2025 has 28 days (not a leap year)
      expect(screen.getByRole('button', { name: '28' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: '29' })).not.toBeInTheDocument()
    })

    it('renders correct number of days for February in leap year', () => {
      render(<DatePicker value="2024-02-15" onChange={() => {}} />)

      // Open calendar
      fireEvent.click(screen.getByRole('button', { name: /february 15/i }))

      // February 2024 has 29 days (leap year)
      expect(screen.getByRole('button', { name: '29' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: '30' })).not.toBeInTheDocument()
    })
  })

  describe('resets navigation on close', () => {
    it('resets month offset when calendar closes', () => {
      render(<DatePicker value="2025-01-15" onChange={() => {}} />)

      const trigger = screen.getByRole('button', { name: /january 15/i })

      // Open and navigate to March
      fireEvent.click(trigger)
      const navButtons = screen.getAllByRole('button')
      const nextButton = navButtons.find((btn) =>
        btn.querySelector('svg path[d="M9 18l6-6-6-6"]'),
      )!
      fireEvent.click(nextButton)
      fireEvent.click(nextButton)
      expect(screen.getByText('March 2025')).toBeInTheDocument()

      // Close
      fireEvent.click(trigger)

      // Reopen - should be back to January
      fireEvent.click(trigger)
      expect(screen.getByText('January 2025')).toBeInTheDocument()
    })
  })
})
