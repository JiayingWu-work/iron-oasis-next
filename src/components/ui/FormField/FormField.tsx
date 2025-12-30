import type { ReactNode } from 'react'
import styles from './FormField.module.css'

interface FormFieldProps {
  label: string
  children: ReactNode
  hints?: ReactNode[]
}

export default function FormField({ label, children, hints }: FormFieldProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      {children}
      {hints && hints.length > 0 && (
        <ul className={styles.hints}>
          {hints.map((hint, index) => (
            <li key={index}>{hint}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
