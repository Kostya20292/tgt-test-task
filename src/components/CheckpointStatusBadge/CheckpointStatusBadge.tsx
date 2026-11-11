import { CHECKPOINT_STATUS_LABELS, type CheckpointStatus } from '@shared/timeline.ts';
import { Badge } from '../Badge/Badge.tsx';
import type { BadgeTone } from '../Badge/Badge.types.ts';
import type { CheckpointStatusBadgeProps } from './CheckpointStatusBadge.types.ts';

const STATUS_TONES: Record<CheckpointStatus, BadgeTone> = {
  done: 'success',
  today: 'info',
  overdue: 'danger',
  upcoming: 'neutral',
};

export const CheckpointStatusBadge = ({ status }: CheckpointStatusBadgeProps) => (
  <Badge tone={STATUS_TONES[status]}>{CHECKPOINT_STATUS_LABELS[status]}</Badge>
);
