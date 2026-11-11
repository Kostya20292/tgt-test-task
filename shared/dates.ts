export const APP_TIME_ZONE = 'Europe/Moscow'

const MS_PER_DAY = 86_400_000

const isoDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const isoDateToUtcMs = (isoDate: string): number => Date.parse(`${isoDate}T00:00:00Z`)

export const toIsoDate = (value: Date | string): string =>
  isoDateFormatter.format(typeof value === 'string' ? new Date(value) : value)

export const getTodayIsoDate = (): string => toIsoDate(new Date())

export const diffInDays = (fromIsoDate: string, toIsoDateValue: string): number =>
  Math.round((isoDateToUtcMs(toIsoDateValue) - isoDateToUtcMs(fromIsoDate)) / MS_PER_DAY)

export const addDays = (isoDate: string, days: number): string =>
  new Date(isoDateToUtcMs(isoDate) + days * MS_PER_DAY).toISOString().slice(0, 10)

export const atMoscowTime = (isoDate: string, time = '12:00'): Date =>
  new Date(`${isoDate}T${time}:00+03:00`)
