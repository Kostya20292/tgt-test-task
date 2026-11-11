import type { PageHeaderProps } from './PageHeader.types.ts';
import styles from './PageHeader.module.scss';

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
);
