'use client'

import { useEffect, useState, useCallback } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'
import styles from './Toast.module.css'

export type ToastType = 'success' | 'error'

export interface ToastProps {
  message: string
  type: ToastType
  duration?: number
  onClose: () => void
}

export default function Toast({
  message,
  type,
  duration = 4000,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isLeaving, setIsLeaving] = useState(false)

  const handleClose = useCallback(() => {
    setIsLeaving(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose()
    }, 200)
  }, [onClose])

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, handleClose])

  if (!isVisible) return null

  return (
    <div
      className={`${styles.toast} ${styles[type]} ${isLeaving ? styles.leaving : ''}`}
      role="alert"
    >
      <div className={styles.icon}>
        {type === 'success' ? (
          <CheckCircle size={20} />
        ) : (
          <XCircle size={20} />
        )}
      </div>
      <p className={styles.message}>{message}</p>
      <button
        type="button"
        className={styles.closeButton}
        onClick={handleClose}
        aria-label="Close"
      >
        <X size={16} />
      </button>
    </div>
  )
}

// Toast Container for managing multiple toasts
export interface ToastItem {
  id: string
  message: string
  type: ToastType
}

interface ToastContainerProps {
  toasts: ToastItem[]
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  )
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = (message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const showSuccess = (message: string) => addToast(message, 'success')
  const showError = (message: string) => addToast(message, 'error')

  return {
    toasts,
    removeToast,
    showSuccess,
    showError,
  }
}
