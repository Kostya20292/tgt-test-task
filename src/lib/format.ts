import { APP_TIME_ZONE } from '@shared/dates.ts'
import { DAY_FORMS, formatCount } from '@shared/text.ts'
import { PROGRAM_LENGTH_DAYS } from '@shared/timeline.ts'

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
})

const dateWithWeekdayFormatter = new Intl.DateTimeFormat('ru-RU', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
})

const dateTimeFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: APP_TIME_ZONE,
})

const isoDateToDate = (isoDate: string): Date => new Date(`${isoDate}T00:00:00Z`)

export const formatDate = (isoDate: string): string => dateFormatter.format(isoDateToDate(isoDate))

export const formatDateWithWeekday = (isoDate: string): string =>
  dateWithWeekdayFormatter.format(isoDateToDate(isoDate))

export const formatDateTime = (isoTimestamp: string): string => dateTimeFormatter.format(new Date(isoTimestamp))

export const formatPercent = (share: number): string => `${Math.round(share * 100)}%`

export const formatDayProgress = (dayNumber: number): string => {
  if (dayNumber < 1) return `Выход через ${formatCount(1 - dayNumber, DAY_FORMS)}`
  if (dayNumber > PROGRAM_LENGTH_DAYS) return `${dayNumber}-й день работы`
  return `День ${dayNumber} из ${PROGRAM_LENGTH_DAYS}`
}

export const toPhoneHref = (phone: string): string => `tel:${phone.replace(/[^\d+]/g, '')}`
