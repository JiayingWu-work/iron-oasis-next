'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import styles from './Select.module.css'

interface SelectOption {
  value: string | number
  label: string
}

interface SelectProps {
  value: string | number | undefined
  onChange: (value: string | number) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  disabled?: boolean
}

export default function Select({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className,
  disabled = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

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

  const handleSelect = (optionValue: string | number) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  const selectedOption = options.find((opt) => opt.value === value)

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${className || ''}`}
      data-select-open={isOpen ? 'true' : undefined}
    >
      <button
        type="button"
        className={`${styles.trigger} ${disabled ? styles.triggerDisabled : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span
          className={`${styles.triggerText} ${!selectedOption ? styles.placeholder : ''}`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`${styles.triggerIcon} ${isOpen ? styles.triggerIconOpen : ''}`}
          size={16}
        />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {options.length === 0 ? (
            <div className={styles.emptyState}>No options available</div>
          ) : (
            <ul className={styles.optionsList}>
              {options.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    className={`${styles.option} ${option.value === value ? styles.optionSelected : ''}`}
                    onClick={() => handleSelect(option.value)}
                  >
                    {option.label}
                    {option.value === value && (
                      <Check className={styles.checkIcon} size={16} />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
