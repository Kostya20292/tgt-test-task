import type {
  CheckinDto,
  ChecklistItemDto,
  CheckpointDto,
  DepartmentDto,
  LocationDto,
  NewcomerDetailDto,
  NewcomerListItemDto,
  PersonDto,
} from '../../shared/api.ts'
import { assessRisk, redactRiskForManager, type RiskAssessment } from '../../shared/risk.ts'
import { CHECKPOINT_TITLES, getCheckpointStatus, getDayNumber, getStage } from '../../shared/timeline.ts'
import type { checkins, checklistItems, checkpoints, departments, employees, locations } from '../db/schema.ts'
import type { Viewer } from '../lib/viewer.ts'
import type { NewcomerAggregate } from './newcomers.ts'

type EmployeeRow = typeof employees.$inferSelect
type DepartmentRow = typeof departments.$inferSelect
type LocationRow = typeof locations.$inferSelect
type CheckpointRow = typeof checkpoints.$inferSelect
type ChecklistItemRow = typeof checklistItems.$inferSelect
type CheckinRow = typeof checkins.$inferSelect

export const toIsoString = (value: Date | null): string | null => value?.toISOString() ?? null

export const toPersonDto = ({ id, fullName, position, phone }: EmployeeRow): PersonDto => ({
  id,
  fullName,
  position,
  phone,
})

export const toDepartmentDto = ({ id, code, name }: DepartmentRow): DepartmentDto => ({ id, code, name })

export const toLocationDto = ({ id, name }: LocationRow): LocationDto => ({ id, name })

export const toCheckpointDto = (checkpoint: CheckpointRow, today: string): CheckpointDto => {
  const doneAt = toIsoString(checkpoint.doneAt)
  return {
    id: checkpoint.id,
    day: checkpoint.day,
    title: CHECKPOINT_TITLES[checkpoint.day],
    dueDate: checkpoint.dueDate,
    doneAt,
    note: checkpoint.note,
    status: getCheckpointStatus({ dueDate: checkpoint.dueDate, doneAt }, today),
  }
}

export const toChecklistItemDto = (item: ChecklistItemRow): ChecklistItemDto => ({
  id: item.id,
  title: item.title,
  dueDay: item.dueDay,
  stage: getStage(item.dueDay),
  doneAt: toIsoString(item.doneAt),
})

const toCheckinDto = (checkin: CheckinRow, viewer: Viewer): CheckinDto => {
  const base: CheckinDto = {
    id: checkin.id,
    createdAt: checkin.createdAt.toISOString(),
    mood: checkin.mood,
    clarity: checkin.clarity,
    support: checkin.support,
    comment: checkin.comment,
  }
  if (viewer.role === 'hr') return { ...base, wantsHr: checkin.wantsHr }
  return checkin.wantsHr ? { ...base, comment: null } : base
}

export const sortCheckpoints = (rows: CheckpointRow[]): CheckpointRow[] =>
  rows.toSorted((first, second) => first.day - second.day)

export const sortChecklist = (rows: ChecklistItemRow[]): ChecklistItemRow[] =>
  rows.toSorted((first, second) => first.dueDay - second.dueDay || first.id - second.id)

export const sortCheckinsNewestFirst = (rows: CheckinRow[]): CheckinRow[] =>
  rows.toSorted((first, second) => second.createdAt.getTime() - first.createdAt.getTime())

export const getNextCheckpoint = (items: CheckpointDto[]): CheckpointDto | null =>
  items.find((item) => item.status !== 'done') ?? null

export const assessNewcomerRisk = (aggregate: NewcomerAggregate, today: string): RiskAssessment =>
  assessRisk({
    today,
    startDate: aggregate.startDate,
    hasMentor: aggregate.mentorId !== null,
    hrContactedAt: toIsoString(aggregate.hrContactedAt),
    checkins: aggregate.checkins.map((checkin) => ({
      createdAt: checkin.createdAt.toISOString(),
      mood: checkin.mood,
      clarity: checkin.clarity,
      support: checkin.support,
      wantsHr: checkin.wantsHr,
    })),
    checkpoints: aggregate.checkpoints.map((checkpoint) => ({
      day: checkpoint.day,
      dueDate: checkpoint.dueDate,
      doneAt: toIsoString(checkpoint.doneAt),
    })),
    checklist: aggregate.checklistItems.map((item) => ({
      dueDay: item.dueDay,
      doneAt: toIsoString(item.doneAt),
    })),
  })

const getViewerRisk = (aggregate: NewcomerAggregate, today: string, viewer: Viewer): RiskAssessment => {
  const risk = assessNewcomerRisk(aggregate, today)
  return viewer.role === 'hr' ? risk : redactRiskForManager(risk)
}

export const toListItemDto = (
  aggregate: NewcomerAggregate,
  today: string,
  viewer: Viewer,
): NewcomerListItemDto => {
  const dayNumber = getDayNumber(aggregate.startDate, today)
  const checkpointDtos = sortCheckpoints(aggregate.checkpoints).map((row) => toCheckpointDto(row, today))

  return {
    id: aggregate.id,
    fullName: aggregate.fullName,
    position: aggregate.position,
    status: aggregate.status,
    department: toDepartmentDto(aggregate.department),
    location: toLocationDto(aggregate.location),
    manager: toPersonDto(aggregate.manager),
    mentor: aggregate.mentor ? toPersonDto(aggregate.mentor) : null,
    startDate: aggregate.startDate,
    dayNumber,
    stage: getStage(dayNumber),
    risk: getViewerRisk(aggregate, today, viewer),
    nextCheckpoint: getNextCheckpoint(checkpointDtos),
  }
}

export const toDetailDto = (
  aggregate: NewcomerAggregate,
  today: string,
  viewer: Viewer,
  mentorCandidates: PersonDto[],
): NewcomerDetailDto => ({
  ...toListItemDto(aggregate, today, viewer),
  token: viewer.role === 'hr' ? aggregate.token : null,
  hrContactedAt: viewer.role === 'hr' ? toIsoString(aggregate.hrContactedAt) : null,
  checkpoints: sortCheckpoints(aggregate.checkpoints).map((row) => toCheckpointDto(row, today)),
  checklist: sortChecklist(aggregate.checklistItems).map(toChecklistItemDto),
  checkins: sortCheckinsNewestFirst(aggregate.checkins).map((row) => toCheckinDto(row, viewer)),
  mentorCandidates,
})

export const compareByRisk = (first: NewcomerListItemDto, second: NewcomerListItemDto): number =>
  second.risk.score - first.risk.score || first.dayNumber - second.dayNumber
