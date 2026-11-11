import { describe, expect, it } from 'vitest'
import { addDays, diffInDays, toIsoDate } from '../../shared/dates.ts'
import {
  getCheckinAvailability,
  getCheckpointDueDate,
  getCheckpointStatus,
  getDayNumber,
  getStage,
  isCheckpointDoneOnTime,
} from '../../shared/timeline.ts'

const TODAY = '2026-11-11'

describe('dates', () => {
  it('считает разницу и сдвиг дат без влияния часовых поясов', () => {
    expect(diffInDays('2026-10-31', '2026-11-01')).toBe(1)
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('переводит момент времени в дату по Москве', () => {
    expect(toIsoDate('2026-11-10T22:30:00Z')).toBe('2026-11-11')
  })
})

describe('getDayNumber', () => {
  it('день выхода — первый день', () => {
    expect(getDayNumber(TODAY, TODAY)).toBe(1)
  })

  it('до выхода номер дня не положительный', () => {
    expect(getDayNumber(addDays(TODAY, 1), TODAY)).toBe(0)
    expect(getDayNumber(addDays(TODAY, 3), TODAY)).toBe(-2)
  })

  it('девяностый день', () => {
    expect(getDayNumber(addDays(TODAY, -89), TODAY)).toBe(90)
  })
})

describe('getStage', () => {
  it.each([
    [0, 'not_started'],
    [1, 'first_week'],
    [7, 'first_week'],
    [8, 'first_month'],
    [30, 'first_month'],
    [31, 'probation'],
    [90, 'probation'],
    [91, 'completed'],
  ] as const)('день %i → %s', (dayNumber, stage) => {
    expect(getStage(dayNumber)).toBe(stage)
  })
})

describe('контрольные встречи', () => {
  it('встреча первого дня назначена на дату выхода', () => {
    expect(getCheckpointDueDate(TODAY, 1)).toBe(TODAY)
    expect(getCheckpointDueDate(TODAY, 7)).toBe(addDays(TODAY, 6))
  })

  it('определяет статус встречи', () => {
    expect(getCheckpointStatus({ dueDate: TODAY, doneAt: null }, TODAY)).toBe('today')
    expect(getCheckpointStatus({ dueDate: addDays(TODAY, -1), doneAt: null }, TODAY)).toBe('overdue')
    expect(getCheckpointStatus({ dueDate: addDays(TODAY, 1), doneAt: null }, TODAY)).toBe('upcoming')
    expect(getCheckpointStatus({ dueDate: addDays(TODAY, -5), doneAt: '2026-11-01T10:00:00Z' }, TODAY)).toBe('done')
  })

  it('встреча вовремя — проведена не позже срока', () => {
    expect(isCheckpointDoneOnTime({ dueDate: TODAY, doneAt: '2026-11-11T15:00:00Z' })).toBe(true)
    expect(isCheckpointDoneOnTime({ dueDate: TODAY, doneAt: '2026-11-12T09:00:00Z' })).toBe(false)
    expect(isCheckpointDoneOnTime({ dueDate: TODAY, doneAt: null })).toBe(false)
  })
})

describe('getCheckinAvailability', () => {
  it('до выхода чек-ин недоступен', () => {
    expect(getCheckinAvailability(null, -2, TODAY)).toEqual({ available: false, nextInDays: 3 })
  })

  it('первый чек-ин доступен сразу', () => {
    expect(getCheckinAvailability(null, 1, TODAY)).toEqual({ available: true, nextInDays: 0 })
  })

  it('следующий чек-ин — через 7 дней после предыдущего', () => {
    expect(getCheckinAvailability('2026-11-09T16:00:00Z', 10, TODAY)).toEqual({ available: false, nextInDays: 5 })
    expect(getCheckinAvailability('2026-11-04T16:00:00Z', 10, TODAY)).toEqual({ available: true, nextInDays: 0 })
  })
})
