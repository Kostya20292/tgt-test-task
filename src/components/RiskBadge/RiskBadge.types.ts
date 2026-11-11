import type { RiskLevel } from '@shared/risk.ts';

export type RiskBadgeProps = {
  level: RiskLevel;
  score?: number;
};
