'use client'

import { useState, useRef, useEffect } from 'react'
import styles from './DatePicker.module.css'

interface DatePickerProps {
  value: string // YYYY-MM-DD format
  onChange: (value: string) => void
  className?: string
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-').map(Number)
  return `${MONTHS[month - 1]} ${day}, ${year}`
}

function toDateString(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${year}-${m}-${d}`
}

function parseDate(dateStr: string): { year: number; month: number } {
  if (dateStr) {
    const d = new Date(dateStr + 'T00:00:00')
    return { year: d.getFullYear(), month: d.getMonth() }
  }
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() }
}

export default function DatePicker({
  value,
  onChange,
  className,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Track manual navigation offset from the value's month
  const [monthOffset, setMonthOffset] = useState(0)

  // Calculate view year/month from value + offset
  const baseDate = parseDate(value)
  let viewMonth = baseDate.month + monthOffset
  let viewYear = baseDate.year

  // Handle month overflow/underflow
  while (viewMonth > 11) {
    viewMonth -= 12
    viewYear += 1
  }
  while (viewMonth < 0) {
    viewMonth += 12
    viewYear -= 1
  }

  // Reset offset when dropdown closes
  const handleToggle = () => {
    if (isOpen) {
      setMonthOffset(0)
    }
    setIsOpen(!isOpen)
  }

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handlePrevMonth = () => {
    setMonthOffset((o) => o - 1)
  }

  const handleNextMonth = () => {
    setMonthOffset((o) => o + 1)
  }

  const handleSelectDay = (day: number) => {
    onChange(toDateString(viewYear, viewMonth, day))
    setMonthOffset(0)
    setIsOpen(false)
  }

  const handleToday = () => {
    const today = new Date()
    onChange(toDateString(today.getFullYear(), today.getMonth(), today.getDate()))
    setMonthOffset(0)
    setIsOpen(false)
  }

  // Generate calendar grid
  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)
  const today = new Date()
  const todayStr = toDateString(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  )

  const calendarDays: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null)
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d)
  }

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${className || ''}`}
    >
      <button
        type="button"
        className={styles.trigger}
        onClick={handleToggle}
      >
        <span className={styles.triggerText}>
          {value ? formatDateDisplay(value) : 'Select date...'}
        </span>
        <svg
          className={styles.triggerIcon}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
        >
          <rect
            x="3"
            y="4"
            width="18"
            height="18"
            rx="2"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path d="M3 10h18" stroke="currentColor" strokeWidth="2" />
          <path d="M8 2v4M16 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <button
              type="button"
              className={styles.navButton}
              onClick={handlePrevMonth}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 18l-6-6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <span className={styles.monthYear}>
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              className={styles.navButton}
              onClick={handleNextMonth}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 18l6-6-6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <div className={styles.weekdays}>
            {DAYS.map((day) => (
              <div key={day} className={styles.weekday}>
                {day}
              </div>
            ))}
          </div>

          <div className={styles.days}>
            {calendarDays.map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} className={styles.emptyDay} />
              }
              const dateStr = toDateString(viewYear, viewMonth, day)
              const isSelected = dateStr === value
              const isToday = dateStr === todayStr

              return (
                <button
                  key={day}
                  type="button"
                  className={`${styles.day} ${isSelected ? styles.daySelected : ''} ${isToday ? styles.dayToday : ''}`}
                  onClick={() => handleSelectDay(day)}
                >
                  {day}
                </button>
              )
            })}
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              className={`${styles.footerButton} ${styles.footerButtonPrimary}`}
              onClick={handleToday}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
