import { CHECKPOINT_STATUS_LABELS, type CheckpointStatus } from '@shared/timeline.ts'
import { Badge, type BadgeTone } from '../Badge/Badge.tsx'

const STATUS_TONES: Record<CheckpointStatus, BadgeTone> = {
  done: 'success',
  today: 'info',
  overdue: 'danger',
  upcoming: 'neutral',
}

type CheckpointStatusBadgeProps = {
  status: CheckpointStatus
}

export const CheckpointStatusBadge = ({ status }: CheckpointStatusBadgeProps) => (
  <Badge tone={STATUS_TONES[status]}>{CHECKPOINT_STATUS_LABELS[status]}</Badge>
)
