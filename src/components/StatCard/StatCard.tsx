import type { StatCardProps, StatGridProps } from './StatCard.types.ts';
import styles from './StatCard.module.scss';

export const StatCard = ({ label, value, hint, tone = 'default' }: StatCardProps) => (
  <div className={`${styles.card} ${styles[tone]}`}>
    <dt className={styles.label}>{label}</dt>
    <dd className={styles.value}>{value}</dd>
    {hint && <dd className={styles.hint}>{hint}</dd>}
  </div>
);

export const StatGrid = ({ children }: StatGridProps) => (
  <dl className={styles.grid}>{children}</dl>
);
