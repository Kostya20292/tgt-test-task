import type { MetaDto } from '@shared/api.ts';
import type { RadarFilters } from '../radarFilters/radarFilters.ts';

export type RadarFiltersBarProps = {
  meta: MetaDto;
  filters: RadarFilters;
  isResetVisible: boolean;
  onChange: (key: keyof RadarFilters, value: string) => void;
  onReset: () => void;
};
