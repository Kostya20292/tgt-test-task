import type { NewcomerListItemDto } from '@shared/api.ts';
import { useNewcomers } from '@/api/hooks.ts';
import { useCurrentManager } from '@/app/managerSelection.ts';
import { PageHeader } from '@/components/PageHeader/PageHeader.tsx';
import { StatCard, StatGrid } from '@/components/StatCard/StatCard.tsx';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateViews/StateViews.tsx';
import { NewcomerCard } from '@/pages/newcomers/NewcomerCard/NewcomerCard.tsx';
import type { ManagerNewcomersProps } from './ManagerPage.types.ts';
import styles from './ManagerPage.module.scss';

const countMeetingsToHold = (newcomers: NewcomerListItemDto[]): number =>
  newcomers.filter(
    (newcomer) =>
      newcomer.nextCheckpoint?.status === 'today' || newcomer.nextCheckpoint?.status === 'overdue',
  ).length;

const ManagerNewcomers = ({ viewer }: ManagerNewcomersProps) => {
  const newcomersQuery = useNewcomers(viewer);

  if (newcomersQuery.isPending) return <LoadingState />;
  if (newcomersQuery.isError) {
    return (
      <ErrorState error={newcomersQuery.error} onRetry={() => void newcomersQuery.refetch()} />
    );
  }

  const newcomers = newcomersQuery.data;

  if (newcomers.length === 0) {
    return (
      <EmptyState title="Сейчас новичков нет">
        Когда HR примет задачу о приёме из Битрикс24, новичок появится здесь вместе с планом встреч.
      </EmptyState>
    );
  }

  const highRiskCount = newcomers.filter((newcomer) => newcomer.risk.level === 'high').length;
  const mediumRiskCount = newcomers.filter((newcomer) => newcomer.risk.level === 'medium').length;
  const meetingsCount = countMeetingsToHold(newcomers);

  return (
    <>
      <StatGrid>
        <StatCard label="Новички в первых 90 днях" value={newcomers.length} />
        <StatCard
          label="Высокий риск"
          value={highRiskCount}
          tone={highRiskCount > 0 ? 'danger' : 'default'}
        />
        <StatCard
          label="Средний риск"
          value={mediumRiskCount}
          tone={mediumRiskCount > 0 ? 'warning' : 'default'}
        />
        <StatCard
          label="Встречи на сегодня и просроченные"
          value={meetingsCount}
          tone={meetingsCount > 0 ? 'accent' : 'default'}
        />
      </StatGrid>
      <section aria-labelledby="manager-list-title" className={styles.section}>
        <h2 id="manager-list-title" className={styles.sectionTitle}>
          Сначала те, кому нужно внимание
        </h2>
        <ul className={styles.list}>
          {newcomers.map((newcomer) => (
            <li key={newcomer.id}>
              <NewcomerCard newcomer={newcomer} href={`/manager/newcomers/${newcomer.id}`} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
};

export const ManagerPage = () => {
  const { viewer, metaQuery } = useCurrentManager();

  const renderContent = () => {
    if (metaQuery.isError)
      return <ErrorState error={metaQuery.error} onRetry={() => void metaQuery.refetch()} />;
    if (!viewer) return <LoadingState />;
    return <ManagerNewcomers viewer={viewer} />;
  };

  return (
    <>
      <title>Мои новички — Первые 90</title>
      <PageHeader
        title="Мои новички"
        description="Кто из ваших новичков сейчас в зоне риска, какие встречи пора провести и почему."
      />
      {renderContent()}
    </>
  );
};
