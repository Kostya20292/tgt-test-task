import type { ReactNode } from 'react'
import { getErrorMessage } from '@/api/client.ts'
import { Button } from '../Button/Button.tsx'
import styles from './StateViews.module.scss'

type LoadingStateProps = {
  label?: string
}

export const LoadingState = ({ label = 'Загружаем данные…' }: LoadingStateProps) => (
  <div className={styles.state} role="status">
    <span className={styles.spinner} aria-hidden="true" />
    <p>{label}</p>
  </div>
)

type ErrorStateProps = {
  error: unknown
  title?: string
  onRetry?: () => void
}

export const ErrorState = ({ error, title = 'Не удалось загрузить данные', onRetry }: ErrorStateProps) => (
  <div className={`${styles.state} ${styles.error}`} role="alert">
    <h2>{title}</h2>
    <p>{getErrorMessage(error)}</p>
    {onRetry && (
      <Button variant="secondary" onClick={onRetry}>
        Попробовать ещё раз
      </Button>
    )}
  </div>
)

type EmptyStateProps = {
  title: string
  children?: ReactNode
}

export const EmptyState = ({ title, children }: EmptyStateProps) => (
  <div className={styles.state}>
    <h2>{title}</h2>
    {children && <div className={styles.text}>{children}</div>}
  </div>
)
