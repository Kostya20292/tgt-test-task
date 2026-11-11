import type { AnswerLevel, DepartmentCode, Mood } from '../../shared/domain.ts'
import type { CheckpointDay } from '../../shared/timeline.ts'

export type CheckinValues = {
  mood: Mood
  clarity: AnswerLevel
  support: AnswerLevel
  comment: string | null
  wantsHr: boolean
}

export type ActiveScenario = {
  departmentCode: DepartmentCode
  dayNumber: number
  managerName?: string
  hasMentor?: boolean
  lastCheckin?: Partial<CheckinValues>
  stopCheckinsAfterDay?: number
  missedCheckpointDays?: CheckpointDay[]
  checklistDoneShare?: number
  hrContacted?: boolean
  dismissTaskReason?: string
}

const DEFAULT_STORE_MANAGER = 'Марина Котова'

export const ACTIVE_SCENARIOS: ActiveScenario[] = [
  { departmentCode: 'store', dayNumber: 2, managerName: DEFAULT_STORE_MANAGER },
  { departmentCode: 'store', dayNumber: 9, managerName: DEFAULT_STORE_MANAGER, lastCheckin: { mood: 3, support: 'partly', wantsHr: true, comment: 'Хочу обсудить график и оформление, с директором об этом говорить неудобно.' } },
  { departmentCode: 'store', dayNumber: 15, managerName: DEFAULT_STORE_MANAGER, lastCheckin: { mood: 3, clarity: 'no', comment: 'Каждый день говорят разное, не понимаю, за что я отвечаю.' } },
  { departmentCode: 'store', dayNumber: 22 },
  { departmentCode: 'store', dayNumber: 33, checklistDoneShare: 0.4, lastCheckin: { mood: 3 } },
  { departmentCode: 'store', dayNumber: 40, hrContacted: true, lastCheckin: { mood: 3, wantsHr: true, comment: 'Есть вопрос по переводу в другой магазин.' } },
  { departmentCode: 'store', dayNumber: 48 },
  { departmentCode: 'store', dayNumber: 58, managerName: DEFAULT_STORE_MANAGER, lastCheckin: { mood: 2, comment: 'Не уверен, что справляюсь с планом продаж.' } },
  { departmentCode: 'store', dayNumber: 74 },
  { departmentCode: 'store', dayNumber: 85, missedCheckpointDays: [60] },
  { departmentCode: 'store', dayNumber: -2, managerName: DEFAULT_STORE_MANAGER },
  { departmentCode: 'warehouse', dayNumber: 3 },
  { departmentCode: 'warehouse', dayNumber: 5, hasMentor: false },
  { departmentCode: 'warehouse', dayNumber: 12, lastCheckin: { mood: 2, support: 'no', comment: 'Тяжело втянуться в график, к концу смены очень устаю. Спросить не у кого — все заняты.' } },
  { departmentCode: 'warehouse', dayNumber: 19, stopCheckinsAfterDay: 3, missedCheckpointDays: [7], checklistDoneShare: 0.5, dismissTaskReason: 'Ожидания не совпали с реальной работой' },
  { departmentCode: 'warehouse', dayNumber: 26 },
  { departmentCode: 'warehouse', dayNumber: 41, missedCheckpointDays: [30] },
  { departmentCode: 'warehouse', dayNumber: 67 },
  { departmentCode: 'sales', dayNumber: 6 },
  { departmentCode: 'sales', dayNumber: 17, checklistDoneShare: 0.4, lastCheckin: { mood: 3, support: 'no', comment: 'Пока нет своих клиентов, непонятно, на что ориентироваться.' } },
  { departmentCode: 'sales', dayNumber: 36 },
  { departmentCode: 'sales', dayNumber: 63, lastCheckin: { mood: 3, clarity: 'no' } },
  { departmentCode: 'office', dayNumber: 1 },
  { departmentCode: 'office', dayNumber: 11, hasMentor: false, lastCheckin: { mood: 3, support: 'no', comment: 'Не к кому обратиться с вопросами по 1С.' } },
  { departmentCode: 'office', dayNumber: 29 },
  { departmentCode: 'office', dayNumber: 52 },
]

export const PENDING_HIRES: { departmentCode: DepartmentCode; startInDays: number }[] = [
  { departmentCode: 'store', startInDays: 0 },
  { departmentCode: 'warehouse', startInDays: 2 },
  { departmentCode: 'sales', startInDays: 5 },
]

export const HISTORY_SIZE = {
  passed: 70,
  earlyLeavers: 17,
  lateLeavers: 33,
} as const
