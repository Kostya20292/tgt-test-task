import { useId, type ReactNode } from 'react'
import styles from './Card.module.scss'

type CardProps = {
  title?: string
  description?: ReactNode
  actions?: ReactNode
  tone?: 'default' | 'highlight'
  className?: string
  children: ReactNode
}

export const Card = ({ title, description, actions, tone = 'default', className, children }: CardProps) => {
  const titleId = useId()

  return (
    <section
      className={[styles.card, styles[tone], className].filter(Boolean).join(' ')}
      aria-labelledby={title ? titleId : undefined}
    >
      {(title || actions) && (
        <header className={styles.header}>
          <div className={styles.heading}>
            {title && <h2 id={titleId}>{title}</h2>}
            {description && <p className={styles.description}>{description}</p>}
          </div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </header>
      )}
      {children}
    </section>
  )
}
