import { RISK_LEVEL_LABELS, type RiskLevel } from '@shared/risk.ts';
import { Badge } from '../Badge/Badge.tsx';
import type { BadgeTone } from '../Badge/Badge.types.ts';
import type { RiskBadgeProps } from './RiskBadge.types.ts';
import styles from './RiskBadge.module.scss';

const RISK_TONES: Record<RiskLevel, BadgeTone> = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
};

export const RiskBadge = ({ level, score }: RiskBadgeProps) => (
  <Badge tone={RISK_TONES[level]}>
    <span className={`${styles.dot} ${styles[level]}`} aria-hidden="true" />
    {RISK_LEVEL_LABELS[level]}
    {score !== undefined && score > 0 && <span className={styles.score}>· {score}</span>}
  </Badge>
);
