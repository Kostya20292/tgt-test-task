import type { NewcomerDetailDto } from '@shared/api.ts'

export type HrContactCardProps = {
  newcomer: NewcomerDetailDto
}

export type CopyStatus = 'idle' | 'copied' | 'failed'
