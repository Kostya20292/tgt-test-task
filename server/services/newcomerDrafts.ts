import { getChecklistTemplate } from '../../shared/checklistTemplates.ts'
import type { DepartmentCode } from '../../shared/domain.ts'
import { CHECKPOINT_DAYS, getCheckpointDueDate, type CheckpointDay } from '../../shared/timeline.ts'

export type ChecklistDraft = {
  title: string
  dueDay: number
  doneAt: Date | null
}

export type CheckpointDraft = {
  day: CheckpointDay
  dueDate: string
  doneAt: Date | null
  note: string | null
}

export const buildChecklistDrafts = (departmentCode: DepartmentCode): ChecklistDraft[] =>
  getChecklistTemplate(departmentCode).map(({ title, dueDay }) => ({ title, dueDay, doneAt: null }))

export const buildCheckpointDrafts = (startDate: string): CheckpointDraft[] =>
  CHECKPOINT_DAYS.map((day) => ({
    day,
    dueDate: getCheckpointDueDate(startDate, day),
    doneAt: null,
    note: null,
  }))
