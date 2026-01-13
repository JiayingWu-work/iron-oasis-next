import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import WeeklyIncomeSummary from '@/components/tables/WeeklyIncomeSummary'

describe('WeeklyIncomeSummary', () => {
  describe('basic display', () => {
    it('renders classes this week', () => {
      render(
        <WeeklyIncomeSummary
          totalClassesThisWeek={10}
          rate={0.46}
          finalWeeklyIncome={500}
        />,
      )

      expect(screen.getByText('Classes this week: 10')).toBeInTheDocument()
    })

    it('renders rate as percentage', () => {
      render(
        <WeeklyIncomeSummary
          totalClassesThisWeek={10}
          rate={0.46}
          finalWeeklyIncome={500}
        />,
      )

      expect(screen.getByText('Rate: 46%')).toBeInTheDocument()
    })

    it('renders higher rate correctly', () => {
      render(
        <WeeklyIncomeSummary
          totalClassesThisWeek={15}
          rate={0.51}
          finalWeeklyIncome={750}
        />,
      )

      expect(screen.getByText('Rate: 51%')).toBeInTheDocument()
    })

    it('renders final weekly income', () => {
      render(
        <WeeklyIncomeSummary
          totalClassesThisWeek={10}
          rate={0.46}
          finalWeeklyIncome={523.5}
        />,
      )

      expect(screen.getByText('Weekly income: $523.5')).toBeInTheDocument()
    })
  })

  describe('optional bonus income', () => {
    it('shows bonus income when provided and greater than 0', () => {
      render(
        <WeeklyIncomeSummary
          totalClassesThisWeek={10}
          rate={0.46}
          bonusIncome={75}
          finalWeeklyIncome={575}
        />,
      )

      expect(screen.getByText('Sales bonus: $75')).toBeInTheDocument()
    })

    it('does not show bonus income when 0', () => {
      render(
        <WeeklyIncomeSummary
          totalClassesThisWeek={10}
          rate={0.46}
          bonusIncome={0}
          finalWeeklyIncome={500}
        />,
      )

      expect(screen.queryByText(/Sales bonus/)).not.toBeInTheDocument()
    })

    it('does not show bonus income when undefined', () => {
      render(
        <WeeklyIncomeSummary
          totalClassesThisWeek={10}
          rate={0.46}
          finalWeeklyIncome={500}
        />,
      )

      expect(screen.queryByText(/Sales bonus/)).not.toBeInTheDocument()
    })
  })

  describe('optional late fees', () => {
    it('shows late fees when provided and greater than 0', () => {
      render(
        <WeeklyIncomeSummary
          totalClassesThisWeek={10}
          rate={0.46}
          lateFees={45}
          finalWeeklyIncome={545}
        />,
      )

      expect(screen.getByText('Late fees: $45')).toBeInTheDocument()
    })

    it('does not show late fees when 0', () => {
      render(
        <WeeklyIncomeSummary
          totalClassesThisWeek={10}
          rate={0.46}
          lateFees={0}
          finalWeeklyIncome={500}
        />,
      )

      expect(screen.queryByText(/Late fees/)).not.toBeInTheDocument()
    })

    it('does not show late fees when undefined', () => {
      render(
        <WeeklyIncomeSummary
          totalClassesThisWeek={10}
          rate={0.46}
          finalWeeklyIncome={500}
        />,
      )

      expect(screen.queryByText(/Late fees/)).not.toBeInTheDocument()
    })
  })

  describe('optional backfill adjustment', () => {
    it('shows backfill adjustment when provided and greater than 0', () => {
      render(
        <WeeklyIncomeSummary
          totalClassesThisWeek={10}
          rate={0.46}
          backfillAdjustment={23}
          finalWeeklyIncome={477}
        />,
      )

      expect(screen.getByText('Backfill: -$23')).toBeInTheDocument()
    })

    it('does not show backfill when 0', () => {
      render(
        <WeeklyIncomeSummary
          totalClassesThisWeek={10}
          rate={0.46}
          backfillAdjustment={0}
          finalWeeklyIncome={500}
        />,
      )

      expect(screen.queryByText(/Backfill/)).not.toBeInTheDocument()
    })

    it('does not show backfill when undefined', () => {
      render(
        <WeeklyIncomeSummary
          totalClassesThisWeek={10}
          rate={0.46}
          finalWeeklyIncome={500}
        />,
      )

      expect(screen.queryByText(/Backfill/)).not.toBeInTheDocument()
    })

    it('shows tooltip icon with backfill', () => {
      render(
        <WeeklyIncomeSummary
          totalClassesThisWeek={10}
          rate={0.46}
          backfillAdjustment={23}
          finalWeeklyIncome={477}
        />,
      )

      expect(screen.getByText('?')).toBeInTheDocument()
    })

    it('contains tooltip explanation text', () => {
      render(
        <WeeklyIncomeSummary
          totalClassesThisWeek={10}
          rate={0.46}
          backfillAdjustment={23}
          finalWeeklyIncome={477}
        />,
      )

      expect(
        screen.getByText(/Sessions completed before a package purchase/),
      ).toBeInTheDocument()
    })
  })

  describe('combined display', () => {
    it('shows all optional fields when all are provided', () => {
      render(
        <WeeklyIncomeSummary
          totalClassesThisWeek={12}
          rate={0.46}
          bonusIncome={100}
          lateFees={45}
          backfillAdjustment={20}
          finalWeeklyIncome={625}
        />,
      )

      expect(screen.getByText('Classes this week: 12')).toBeInTheDocument()
      expect(screen.getByText('Rate: 46%')).toBeInTheDocument()
      expect(screen.getByText('Sales bonus: $100')).toBeInTheDocument()
      expect(screen.getByText('Late fees: $45')).toBeInTheDocument()
      expect(screen.getByText('Backfill: -$20')).toBeInTheDocument()
      expect(screen.getByText('Weekly income: $625')).toBeInTheDocument()
    })

    it('shows only applicable fields', () => {
      render(
        <WeeklyIncomeSummary
          totalClassesThisWeek={8}
          rate={0.46}
          bonusIncome={50}
          lateFees={0}
          backfillAdjustment={0}
          finalWeeklyIncome={550}
        />,
      )

      expect(screen.getByText('Classes this week: 8')).toBeInTheDocument()
      expect(screen.getByText('Sales bonus: $50')).toBeInTheDocument()
      expect(screen.queryByText(/Late fees/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Backfill/)).not.toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('handles zero classes', () => {
      render(
        <WeeklyIncomeSummary
          totalClassesThisWeek={0}
          rate={0.46}
          finalWeeklyIncome={0}
        />,
      )

      expect(screen.getByText('Classes this week: 0')).toBeInTheDocument()
      expect(screen.getByText('Weekly income: $0')).toBeInTheDocument()
    })

    it('handles decimal income values', () => {
      render(
        <WeeklyIncomeSummary
          totalClassesThisWeek={5}
          rate={0.46}
          finalWeeklyIncome={345.6}
        />,
      )

      expect(screen.getByText('Weekly income: $345.6')).toBeInTheDocument()
    })

    it('handles large income values', () => {
      render(
        <WeeklyIncomeSummary
          totalClassesThisWeek={20}
          rate={0.51}
          finalWeeklyIncome={1523.5}
        />,
      )

      expect(screen.getByText('Weekly income: $1523.5')).toBeInTheDocument()
    })
  })
})
