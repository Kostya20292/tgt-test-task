export const DEPARTMENT_CODES = ['warehouse', 'store', 'sales', 'office'] as const
export type DepartmentCode = (typeof DEPARTMENT_CODES)[number]

export const ANSWER_LEVELS = ['yes', 'partly', 'no'] as const
export type AnswerLevel = (typeof ANSWER_LEVELS)[number]

export const ANSWER_LABELS: Record<AnswerLevel, string> = {
  yes: 'Да',
  partly: 'Частично',
  no: 'Нет',
}

export const MOOD_VALUES = [1, 2, 3, 4, 5] as const
export type Mood = (typeof MOOD_VALUES)[number]

export const MOOD_LABELS: Record<Mood, string> = {
  1: 'Очень плохо',
  2: 'Плохо',
  3: 'Нормально',
  4: 'Хорошо',
  5: 'Отлично',
}

export type EmployeeRole = 'manager' | 'hr' | 'staff'
export type NewcomerStatus = 'active' | 'left'
export type ViewerRole = 'hr' | 'manager'
export type B24TaskType = 'hire' | 'dismiss'

export const EARLY_LEAVE_THRESHOLD_DAYS = 90
