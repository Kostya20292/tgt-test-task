import type { MetricsDto } from '@shared/api.ts';
import { PERSON_FORMS, formatCount } from '@shared/text.ts';
import { useMetrics } from '@/api/hooks.ts';
import { BarList } from '@/components/BarList/BarList.tsx';
import type { BarListItem } from '@/components/BarList/BarList.types.ts';
import { Card } from '@/components/Card/Card.tsx';
import { PageHeader } from '@/components/PageHeader/PageHeader.tsx';
import { StatCard, StatGrid } from '@/components/StatCard/StatCard.tsx';
import { ErrorState, LoadingState } from '@/components/StateViews/StateViews.tsx';
import { formatPercent } from '@/lib/format.ts';
import type { DisciplineInsightProps, MetricsContentProps, TenurePeriod } from './MetricsPage.types.ts';
import styles from './MetricsPage.module.scss';

const getMaxValue = (values: number[]): number => Math.max(...values, 0);

const toDepartmentItems = (metrics: MetricsDto): BarListItem[] => {
  const maxRate = getMaxValue(metrics.byDepartment.map((department) => department.earlyLeaveRate));
  return metrics.byDepartment.map((department) => ({
    id: department.code,
    label: department.name,
    value: department.earlyLeaveRate,
    valueLabel: `${formatPercent(department.earlyLeaveRate)} · ${department.earlyLeaves} из ${department.hires}`,
    isHighlighted: department.earlyLeaveRate === maxRate && maxRate > 0,
  }));
};

const TENURE_PERIODS: TenurePeriod[] = [
  { label: 'Первая неделя', fromWeek: 1, toWeek: 1 },
  { label: '2–4-я недели', fromWeek: 2, toWeek: 4 },
  { label: 'Второй месяц', fromWeek: 5, toWeek: 8 },
  { label: 'Третий месяц', fromWeek: 9, toWeek: 13 },
];

const toPeriodItems = (metrics: MetricsDto): BarListItem[] => {
  const periodCounts = TENURE_PERIODS.map((period) =>
    metrics.byWeek
      .filter((week) => week.week >= period.fromWeek && week.week <= period.toWeek)
      .reduce((total, week) => total + week.count, 0),
  );
  const maxCount = getMaxValue(periodCounts);

  return TENURE_PERIODS.map((period, index) => ({
    id: period.label,
    label: period.label,
    value: periodCounts[index],
    valueLabel: formatCount(periodCounts[index], PERSON_FORMS),
    isHighlighted: periodCounts[index] === maxCount && maxCount > 0,
  }));
};

const toReasonItems = (metrics: MetricsDto): BarListItem[] =>
  metrics.reasons.map((reason, index) => ({
    id: reason.reason,
    label: reason.reason,
    value: reason.count,
    valueLabel: String(reason.count),
    isHighlighted: index === 0,
  }));

const DisciplineInsight = ({ discipline }: DisciplineInsightProps) => {
  if (discipline.cohortSize === 0) return null;

  return (
    <Card title="Ранние уходы и контрольные встречи" tone="highlight">
      <div className={styles.insight}>
        <p className={styles.insightNumbers}>
          <span className={styles.insightGood}>
            {formatPercent(discipline.earlyLeaveRateOnTime)}
          </span>
          <span className={styles.insightVersus}>против</span>
          <span className={styles.insightBad}>{formatPercent(discipline.earlyLeaveRateLate)}</span>
        </p>
        <p>
          Из новичков, с которыми все контрольные встречи провели вовремя, рано ушли{' '}
          {formatPercent(discipline.earlyLeaveRateOnTime)}. Там, где встречи срывались, —{' '}
          {formatPercent(discipline.earlyLeaveRateLate)}.
        </p>
        <p className={styles.insightNote}>
          Выборка: {formatCount(discipline.cohortSize, PERSON_FORMS)}, встречи вовремя —{' '}
          {formatPercent(discipline.onTimeShare)}. Это корреляция на демо-данных, а не доказанная
          причина.
        </p>
      </div>
    </Card>
  );
};

const MetricsContent = ({ metrics }: MetricsContentProps) => (
  <>
    <StatGrid>
      <StatCard label={`Принято за ${metrics.periodDays} дней`} value={metrics.hires} />
      <StatCard label="Уволилось" value={metrics.leaves} />
      <StatCard
        label="Ушли в первые 90 дней"
        value={formatPercent(metrics.earlyLeaveShare)}
        hint={`${metrics.earlyLeaves} из ${metrics.leaves} уволившихся`}
        tone="danger"
      />
      <StatCard
        label="Сейчас в адаптации"
        value={metrics.activeNewcomers}
        hint={`высокий риск: ${metrics.riskCounts.high}, средний: ${metrics.riskCounts.medium}`}
        tone="accent"
      />
    </StatGrid>

    <DisciplineInsight discipline={metrics.checkpointDiscipline} />

    <div className={styles.grid}>
      <Card title="Где уходят чаще" description="Доля ранних уходов от принятых в подразделение.">
        <BarList
          items={toDepartmentItems(metrics)}
          ariaLabel="Доля ранних уходов по подразделениям"
        />
      </Card>
      <Card title="Когда уходят" description="Сколько проработали те, кто ушёл в первые 90 дней.">
        <BarList items={toPeriodItems(metrics)} ariaLabel="Ранние уходы по сроку работы" />
      </Card>
      <Card title="Почему уходят" description="Причины из задач на увольнение в Битрикс24.">
        <BarList items={toReasonItems(metrics)} ariaLabel="Причины ранних уходов" />
      </Card>
    </div>
  </>
);

export const MetricsPage = () => {
  const metricsQuery = useMetrics();

  const renderContent = () => {
    if (metricsQuery.isPending) return <LoadingState />;
    if (metricsQuery.isError) {
      return <ErrorState error={metricsQuery.error} onRetry={() => void metricsQuery.refetch()} />;
    }
    return <MetricsContent metrics={metricsQuery.data} />;
  };

  return (
    <>
      <title>Метрики — Первые 90</title>
      <PageHeader
        title="Метрики ранних уходов"
        description="Сколько новичков уходит в первые 90 дней, где, когда и почему. Считается по задачам приёма и увольнения."
      />
      {renderContent()}
    </>
  );
};
