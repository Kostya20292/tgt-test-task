import type { MetricsDto } from '@shared/api.ts';

export type TenurePeriod = {
  label: string;
  fromWeek: number;
  toWeek: number;
};

export type DisciplineInsightProps = {
  discipline: MetricsDto['checkpointDiscipline'];
};

export type MetricsContentProps = {
  metrics: MetricsDto;
};
