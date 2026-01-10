'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import styles from './SearchableSelect.module.css'

interface SelectOption {
  value: string | number
  label: string
}

interface SearchableSelectProps {
  value: string | number | undefined
  onChange: (value: string | number) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  disabled?: boolean
}

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className,
  disabled = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const optionsRef = useRef<HTMLUListElement>(null)

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Scroll highlighted option into view
  useEffect(() => {
    if (optionsRef.current && isOpen) {
      const highlightedOption = optionsRef.current.children[highlightedIndex] as HTMLElement
      if (highlightedOption?.scrollIntoView) {
        highlightedOption.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex, isOpen])

  const handleSelect = useCallback((optionValue: string | number) => {
    onChange(optionValue)
    setIsOpen(false)
    setSearchQuery('')
  }, [onChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev))
        break
      case 'Enter':
        e.preventDefault()
        if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex].value)
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSearchQuery('')
        break
      case 'Backspace':
        setSearchQuery((prev) => prev.slice(0, -1))
        setHighlightedIndex(0)
        break
      default:
        // Type to filter - only single printable characters
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          setSearchQuery((prev) => prev + e.key)
          setHighlightedIndex(0)
        }
    }
  }, [isOpen, filteredOptions, highlightedIndex, handleSelect])

  const highlightMatch = (label: string, query: string) => {
    if (!query) return label
    const index = label.toLowerCase().indexOf(query.toLowerCase())
    if (index === -1) return label
    return (
      <>
        {label.slice(0, index)}
        <span className={styles.highlight}>
          {label.slice(index, index + query.length)}
        </span>
        {label.slice(index + query.length)}
      </>
    )
  }

  const selectedOption = options.find((opt) => opt.value === value)

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${className || ''}`}
      data-select-open={isOpen ? 'true' : undefined}
      onKeyDown={handleKeyDown}
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
          ) : filteredOptions.length === 0 ? (
            <div className={styles.emptyState}>No matches for &quot;{searchQuery}&quot;</div>
          ) : (
            <ul ref={optionsRef} className={styles.optionsList}>
              {filteredOptions.map((option, index) => (
                <li key={option.value}>
                  <button
                    type="button"
                    className={`${styles.option} ${option.value === value ? styles.optionSelected : ''} ${index === highlightedIndex ? styles.optionHighlighted : ''}`}
                    onClick={() => handleSelect(option.value)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <span>{highlightMatch(option.label, searchQuery)}</span>
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
