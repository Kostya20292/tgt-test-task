import type { ReactNode } from 'react'
import styles from './StatCard.module.scss'

type StatCardProps = {
  label: string
  value: ReactNode
  hint?: ReactNode
  tone?: 'default' | 'danger' | 'warning' | 'accent'
}

export const StatCard = ({ label, value, hint, tone = 'default' }: StatCardProps) => (
  <div className={`${styles.card} ${styles[tone]}`}>
    <dt className={styles.label}>{label}</dt>
    <dd className={styles.value}>{value}</dd>
    {hint && <dd className={styles.hint}>{hint}</dd>}
  </div>
)

type StatGridProps = {
  children: ReactNode
}

export const StatGrid = ({ children }: StatGridProps) => <dl className={styles.grid}>{children}</dl>
