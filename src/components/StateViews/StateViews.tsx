import { getErrorMessage } from '@/api/client.ts';
import { Button } from '../Button/Button.tsx';
import type { EmptyStateProps, ErrorStateProps, LoadingStateProps } from './StateViews.types.ts';
import styles from './StateViews.module.scss';

export const LoadingState = ({ label = 'Загружаем данные…' }: LoadingStateProps) => (
  <div className={styles.state} role="status">
    <span className={styles.spinner} aria-hidden="true" />
    <p>{label}</p>
  </div>
);

export const ErrorState = ({
  error,
  title = 'Не удалось загрузить данные',
  onRetry,
}: ErrorStateProps) => (
  <div className={`${styles.state} ${styles.error}`} role="alert">
    <h2>{title}</h2>
    <p>{getErrorMessage(error)}</p>
    {onRetry && (
      <Button variant="secondary" onClick={onRetry}>
        Попробовать ещё раз
      </Button>
    )}
  </div>
);

export const EmptyState = ({ title, children }: EmptyStateProps) => (
  <div className={styles.state}>
    <h2>{title}</h2>
    {children && <div className={styles.text}>{children}</div>}
  </div>
);
