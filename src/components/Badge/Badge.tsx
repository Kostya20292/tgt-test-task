import type { ReactNode } from 'react'
import styles from './Badge.module.scss'

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

type BadgeProps = {
  tone?: BadgeTone
  children: ReactNode
}

export const Badge = ({ tone = 'neutral', children }: BadgeProps) => (
  <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>
)
