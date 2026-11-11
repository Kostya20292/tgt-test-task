import type { ReactNode } from 'react'
import type { B24TaskDto } from '@shared/api.ts'

export type TaskDetail = {
  label: string
  value: ReactNode
}

export type B24TaskCardProps = {
  task: B24TaskDto
  isProcessing: boolean
  isDisabled: boolean
  onProcess: (taskId: number) => void
}
