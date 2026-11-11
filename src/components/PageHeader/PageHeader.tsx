import type { ReactNode } from 'react'
import styles from './PageHeader.module.scss'

type PageHeaderProps = {
  title: string
  description?: ReactNode
  actions?: ReactNode
  before?: ReactNode
}

export const PageHeader = ({ title, description, actions, before }: PageHeaderProps) => (
  <header className={styles.header}>
    {before}
    <div className={styles.row}>
      <div className={styles.text}>
        <h1>{title}</h1>
        {description && <div className={styles.description}>{description}</div>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  </header>
)
