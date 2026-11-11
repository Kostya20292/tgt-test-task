import type { CheckpointDto, NewcomerDetailDto, Viewer } from '@shared/api.ts'

export type SaveCheckpoint = (checkpointId: number, done: boolean, note: string, onSaved?: () => void) => void

export type CheckpointItemProps = {
  checkpoint: CheckpointDto
  canEdit: boolean
  isPending: boolean
  onSave: SaveCheckpoint
}

export type CheckpointsCardProps = {
  newcomer: NewcomerDetailDto
  viewer: Viewer
}
