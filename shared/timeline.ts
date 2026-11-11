import { addDays, diffInDays, toIsoDate } from './dates.ts'

export const PROGRAM_LENGTH_DAYS = 90
export const CHECKIN_INTERVAL_DAYS = 7
export const CHECKPOINT_DAYS = [1, 7, 30, 60, 90] as const
export type CheckpointDay = (typeof CHECKPOINT_DAYS)[number]

export const CHECKPOINT_TITLES: Record<CheckpointDay, string> = {
  1: 'Первый день: знакомство и план',
  7: 'Итоги первой недели',
  30: 'Итоги первого месяца',
  60: 'Промежуточная оценка',
  90: 'Решение по испытательному сроку',
}

export type Stage = 'not_started' | 'first_week' | 'first_month' | 'probation' | 'completed'

export const STAGE_LABELS: Record<Stage, string> = {
  not_started: 'Скоро выход',
  first_week: 'Первая неделя',
  first_month: 'Первый месяц',
  probation: 'Испытательный срок',
  completed: 'Адаптация завершена',
}

export type CheckpointStatus = 'done' | 'today' | 'overdue' | 'upcoming'

export const CHECKPOINT_STATUS_LABELS: Record<CheckpointStatus, string> = {
  done: 'Проведена',
  today: 'Сегодня',
  overdue: 'Просрочена',
  upcoming: 'Предстоит',
}

export type CheckpointTiming = {
  dueDate: string
  doneAt: string | null
}

export type CheckinAvailability = {
  available: boolean
  nextInDays: number
}

export const getDayNumber = (startDate: string, today: string): number =>
  diffInDays(startDate, today) + 1

export const getStage = (dayNumber: number): Stage => {
  if (dayNumber < 1) return 'not_started'
  if (dayNumber <= 7) return 'first_week'
  if (dayNumber <= 30) return 'first_month'
  if (dayNumber <= PROGRAM_LENGTH_DAYS) return 'probation'
  return 'completed'
}

export const isInProgram = (dayNumber: number): boolean => dayNumber <= PROGRAM_LENGTH_DAYS

export const getCheckpointDueDate = (startDate: string, day: number): string =>
  addDays(startDate, day - 1)

export const getCheckpointStatus = ({ dueDate, doneAt }: CheckpointTiming, today: string): CheckpointStatus => {
  if (doneAt) return 'done'
  if (dueDate === today) return 'today'
  if (dueDate < today) return 'overdue'
  return 'upcoming'
}

export const isCheckpointDoneOnTime = ({ dueDate, doneAt }: CheckpointTiming): boolean =>
  doneAt !== null && toIsoDate(doneAt) <= dueDate

export const getCheckinAvailability = (
  lastCheckinAt: string | null,
  dayNumber: number,
  today: string,
): CheckinAvailability => {
  if (dayNumber < 1) return { available: false, nextInDays: 1 - dayNumber }
  if (!lastCheckinAt) return { available: true, nextInDays: 0 }

  const daysSinceLast = diffInDays(toIsoDate(lastCheckinAt), today)
  if (daysSinceLast >= CHECKIN_INTERVAL_DAYS) return { available: true, nextInDays: 0 }

  return { available: false, nextInDays: CHECKIN_INTERVAL_DAYS - daysSinceLast }
}
