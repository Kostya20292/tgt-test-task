import type { ChecklistItemDto, NewcomerPageDto } from '@shared/api.ts'

export type ChecklistSectionProps = {
  page: NewcomerPageDto
  token: string
}

export type ChecklistItemRowProps = {
  item: ChecklistItemDto
  dayNumber: number
  isDisabled: boolean
  onToggle: (itemId: number, done: boolean) => void
}
