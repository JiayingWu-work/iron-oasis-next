import type { ReactNode } from 'react'
import styles from './Card.module.css'

interface CardProps extends React.HTMLAttributes<HTMLElement> {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'article'
}

export function Card({
  children,
  className = '',
  as: Tag = 'section',
  ...rest
}: CardProps) {
  return (
    <Tag
      className={`${styles.card}${className ? ` ${className}` : ''}`}
      {...rest}
    >
      {children}
    </Tag>
  )
}
