import type { BadgeProps } from './Badge.types.ts';
import styles from './Badge.module.scss';

export const Badge = ({ tone = 'neutral', children }: BadgeProps) => (
  <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>
);
