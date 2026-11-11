import { useState } from 'react';
import { Link } from 'react-router';
import type { B24ProcessResultDto } from '@shared/api.ts';
import { getErrorMessage } from '@/api/client.ts';
import { useB24Tasks, useProcessB24Task, useSimulateB24Task } from '@/api/hooks.ts';
import { Button } from '@/components/Button/Button.tsx';
import { Card } from '@/components/Card/Card.tsx';
import { PageHeader } from '@/components/PageHeader/PageHeader.tsx';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateViews/StateViews.tsx';
import { formatDateTime } from '@/lib/format.ts';
import { B24TaskCard } from '../B24TaskCard/B24TaskCard.tsx';
import type { ProcessResultProps, ProcessedTaskListProps } from './B24Page.types.ts';
import styles from './B24Page.module.scss';

const ProcessResult = ({ result }: ProcessResultProps) => {
  if (result.type === 'dismiss') {
    return (
      <p>
        Увольнение учтено: новичок убран с радара, причина попала в{' '}
        <Link to="/hr/metrics">метрики ранних уходов</Link>.
      </p>
    );
  }

  return (
    <div className={styles.resultBody}>
      <p>
        Новичок заведён: создан план адаптации и график встреч, руководитель видит его в своём
        списке.
      </p>
      <div className={styles.resultLinks}>
        <Link to={`/hr/newcomers/${result.newcomerId}`}>Открыть карточку</Link>
        {result.token && (
          <Link to={`/n/${result.token}`} target="_blank" rel="noopener">
            Страница новичка
            <span className="visually-hidden"> (в новой вкладке)</span>
          </Link>
        )}
      </div>
    </div>
  );
};

const ProcessedTaskList = ({ tasks }: ProcessedTaskListProps) => (
  <ul className={styles.processed}>
    {tasks.map((task) => (
      <li key={task.id} className={styles.processedItem}>
        <span className={styles.processedMeta}>
          {task.externalId} · {task.type === 'hire' ? 'Приём' : 'Увольнение'}
        </span>
        {task.newcomerId && task.type === 'hire' ? (
          <Link to={`/hr/newcomers/${task.newcomerId}`}>{task.payload.fullName}</Link>
        ) : (
          <span>{task.payload.fullName}</span>
        )}
        {task.processedAt && (
          <span className={styles.processedMeta}>{formatDateTime(task.processedAt)}</span>
        )}
      </li>
    ))}
  </ul>
);

export const B24Page = () => {
  const tasksQuery = useB24Tasks();
  const processMutation = useProcessB24Task();
  const simulateMutation = useSimulateB24Task();
  const [lastResult, setLastResult] = useState<B24ProcessResultDto | null>(null);

  const handleProcess = (taskId: number) => {
    setLastResult(null);
    processMutation.mutate(taskId, { onSuccess: setLastResult });
  };

  const handleSimulate = () => {
    simulateMutation.mutate();
  };

  const mutationError = processMutation.error ?? simulateMutation.error;

  const renderTasks = () => {
    if (tasksQuery.isPending) return <LoadingState />;
    if (tasksQuery.isError)
      return <ErrorState error={tasksQuery.error} onRetry={() => void tasksQuery.refetch()} />;

    const { pending, processed } = tasksQuery.data;

    return (
      <>
        <section aria-labelledby="b24-pending-title" className={styles.section}>
          <h2 id="b24-pending-title" className={styles.sectionTitle}>
            Новые задачи ({pending.length})
          </h2>
          {pending.length === 0 ? (
            <EmptyState title="Новых задач нет">
              Нажмите «Пришла задача о приёме», чтобы сымитировать её.
            </EmptyState>
          ) : (
            <ul className={styles.list}>
              {pending.map((task) => (
                <li key={task.id}>
                  <B24TaskCard
                    task={task}
                    isProcessing={
                      processMutation.isPending && processMutation.variables === task.id
                    }
                    isDisabled={processMutation.isPending}
                    onProcess={handleProcess}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
        {processed.length > 0 && (
          <Card title="Недавно обработанные">
            <ProcessedTaskList tasks={processed} />
          </Card>
        )}
      </>
    );
  };

  return (
    <>
      <title>Задачи Битрикс24 — Первые 90</title>
      <PageHeader
        title="Задачи Битрикс24"
        description="Приём и увольнение уже идут задачами в Битрикс24. Здесь они подхватываются автоматически: одна кнопка — и у новичка есть план, встречи и личная страница. Интеграция в демо имитирована."
        actions={
          <Button
            variant="secondary"
            onClick={handleSimulate}
            isLoading={simulateMutation.isPending}
          >
            Пришла задача о приёме
          </Button>
        }
      />
      {mutationError && (
        <p className={styles.error} role="alert">
          {getErrorMessage(mutationError)}
        </p>
      )}
      <div role="status">
        {lastResult && (
          <Card title="Готово" tone="highlight">
            <ProcessResult result={lastResult} />
          </Card>
        )}
      </div>
      {renderTasks()}
    </>
  );
};
