import type { AnswerLevel, B24TaskType, DepartmentCode, Mood, NewcomerStatus } from './domain.ts'
import type { FaqItem } from './faq.ts'
import type { RiskAssessment, RiskLevel } from './risk.ts'
import type { CheckinAvailability, CheckpointDay, CheckpointStatus, Stage } from './timeline.ts'

export type Viewer = { role: 'hr' } | { role: 'manager'; managerId: number }

export const VIEWER_ROLE_HEADER = 'x-viewer-role'
export const VIEWER_MANAGER_HEADER = 'x-manager-id'

export type DepartmentDto = {
  id: number
  code: DepartmentCode
  name: string
}

export type LocationDto = {
  id: number
  name: string
}

export type PersonDto = {
  id: number
  fullName: string
  position: string
  phone: string
}

export type ManagerDto = PersonDto & {
  departmentId: number
  locationId: number
  activeNewcomers: number
}

export type MetaDto = {
  today: string
  departments: DepartmentDto[]
  locations: LocationDto[]
  managers: ManagerDto[]
  hr: PersonDto
}

export type CheckpointDto = {
  id: number
  day: CheckpointDay
  title: string
  dueDate: string
  doneAt: string | null
  note: string | null
  status: CheckpointStatus
}

export type ChecklistItemDto = {
  id: number
  title: string
  dueDay: number
  stage: Stage
  doneAt: string | null
}

export type CheckinDto = {
  id: number
  createdAt: string
  mood: Mood
  clarity: AnswerLevel
  support: AnswerLevel
  comment: string | null
  wantsHr?: boolean
}

export type NewcomerListItemDto = {
  id: number
  fullName: string
  position: string
  status: NewcomerStatus
  department: DepartmentDto
  location: LocationDto
  manager: PersonDto
  mentor: PersonDto | null
  startDate: string
  dayNumber: number
  stage: Stage
  risk: RiskAssessment
  nextCheckpoint: CheckpointDto | null
}

export type NewcomerDetailDto = NewcomerListItemDto & {
  token: string | null
  hrContactedAt: string | null
  checkpoints: CheckpointDto[]
  checklist: ChecklistItemDto[]
  checkins: CheckinDto[]
  mentorCandidates: PersonDto[]
}

export type NewcomerPageDto = {
  fullName: string
  firstName: string
  position: string
  status: NewcomerStatus
  department: DepartmentDto
  location: LocationDto
  startDate: string
  dayNumber: number
  stage: Stage
  manager: PersonDto
  mentor: PersonDto | null
  hr: PersonDto
  checklist: ChecklistItemDto[]
  nextCheckpoint: CheckpointDto | null
  checkin: CheckinAvailability & { lastAt: string | null }
  faq: FaqItem[]
}

export type CheckinInput = {
  mood: Mood
  clarity: AnswerLevel
  support: AnswerLevel
  comment: string
  wantsHr: boolean
}

export type CheckpointUpdateInput = {
  done: boolean
  note: string
}

export type HireTaskPayload = {
  fullName: string
  phone: string
  position: string
  departmentId: number
  locationId: number
  managerId: number
  startDate: string
}

export type DismissTaskPayload = {
  newcomerId: number
  fullName: string
  leaveDate: string
  reason: string
}

export type B24TaskPayload = HireTaskPayload | DismissTaskPayload

type B24TaskBaseDto = {
  id: number
  externalId: string
  createdAt: string
  processedAt: string | null
  newcomerId: number | null
}

export type B24HireTaskDto = B24TaskBaseDto & {
  type: Extract<B24TaskType, 'hire'>
  payload: HireTaskPayload
  departmentName: string
  locationName: string
  managerName: string
}

export type B24DismissTaskDto = B24TaskBaseDto & {
  type: Extract<B24TaskType, 'dismiss'>
  payload: DismissTaskPayload
  daysWorked: number | null
}

export type B24TaskDto = B24HireTaskDto | B24DismissTaskDto

export type B24TasksDto = {
  pending: B24TaskDto[]
  processed: B24TaskDto[]
}

export type B24ProcessResultDto = {
  type: B24TaskType
  newcomerId: number
  token: string | null
}

export type ShowcaseNewcomerDto = {
  fullName: string
  position: string
  token: string
  dayNumber: number
  stage: Stage
}

export type MetricsDto = {
  periodDays: number
  hires: number
  leaves: number
  earlyLeaves: number
  earlyLeaveShare: number
  activeNewcomers: number
  riskCounts: Record<RiskLevel, number>
  byDepartment: {
    code: DepartmentCode
    name: string
    hires: number
    earlyLeaves: number
    earlyLeaveRate: number
  }[]
  byWeek: { week: number; count: number }[]
  reasons: { reason: string; count: number }[]
  checkpointDiscipline: {
    cohortSize: number
    onTimeCount: number
    onTimeShare: number
    earlyLeaveRateOnTime: number
    earlyLeaveRateLate: number
  }
}

export type ApiErrorDto = {
  error: string
}
