import { describe, expect, it } from 'vitest'
import { addDays } from '../../shared/dates.ts'
import {
  assessRisk,
  getRiskLevel,
  redactRiskForManager,
  type RiskCheckinSignal,
  type RiskFactorCode,
  type RiskInput,
} from '../../shared/risk.ts'

const TODAY = '2026-11-11'

const at = (isoDate: string): string => `${isoDate}T16:00:00.000Z`

const goodCheckin = (isoDate: string): RiskCheckinSignal => ({
  createdAt: at(isoDate),
  mood: 4,
  clarity: 'yes',
  support: 'yes',
  wantsHr: false,
})

const buildInput = (dayNumber: number, overrides: Partial<RiskInput> = {}): RiskInput => {
  const startDate = addDays(TODAY, -(dayNumber - 1))
  return {
    today: TODAY,
    startDate,
    hasMentor: true,
    hrContactedAt: null,
    checkins: dayNumber >= 2 ? [goodCheckin(addDays(TODAY, -1))] : [],
    checkpoints: [],
    checklist: [],
    ...overrides,
  }
}

const getCodes = (input: RiskInput): RiskFactorCode[] =>
  assessRisk(input).factors.map((factor) => factor.code)

describe('getRiskLevel', () => {
  it.each([
    [0, 'low'],
    [1, 'low'],
    [2, 'medium'],
    [3, 'medium'],
    [4, 'high'],
    [9, 'high'],
  ] as const)('%i баллов → %s', (score, level) => {
    expect(getRiskLevel(score)).toBe(level)
  })
})

describe('assessRisk', () => {
  it('у благополучного новичка риск низкий и без причин', () => {
    expect(assessRisk(buildInput(12))).toEqual({ score: 0, level: 'low', factors: [] })
  })

  it('до выхода риск не считается', () => {
    expect(assessRisk(buildInput(-2, { hasMentor: false })).score).toBe(0)
  })

  it('низкое самочувствие в последнем чек-ине даёт 3 балла', () => {
    const input = buildInput(12, { checkins: [{ ...goodCheckin(addDays(TODAY, -1)), mood: 2 }] })
    expect(assessRisk(input)).toMatchObject({ score: 3, level: 'medium' })
    expect(getCodes(input)).toEqual(['low_mood'])
  })

  it('учитывает только последний чек-ин для оценки самочувствия', () => {
    const input = buildInput(20, {
      checkins: [{ ...goodCheckin(addDays(TODAY, -8)), mood: 1 }, goodCheckin(addDays(TODAY, -1))],
    })
    expect(assessRisk(input).score).toBe(0)
  })

  it('ответы «не хватает помощи» и «непонятно, что ждут» дают по 2 балла', () => {
    const input = buildInput(12, {
      checkins: [{ ...goodCheckin(addDays(TODAY, -1)), support: 'no', clarity: 'no' }],
    })
    expect(assessRisk(input)).toMatchObject({ score: 4, level: 'high' })
    expect(getCodes(input).toSorted()).toEqual(['no_clarity', 'no_support'])
  })

  it('ответ «частично» не повышает риск', () => {
    const input = buildInput(12, {
      checkins: [{ ...goodCheckin(addDays(TODAY, -1)), support: 'partly', clarity: 'partly' }],
    })
    expect(assessRisk(input).score).toBe(0)
  })

  it('просьба связаться с HR действует, пока HR не отметил контакт', () => {
    const checkins = [{ ...goodCheckin(addDays(TODAY, -1)), wantsHr: true }]
    const pending = assessRisk(buildInput(12, { checkins }))
    expect(pending.score).toBe(3)
    expect(pending.factors[0]).toMatchObject({ code: 'wants_hr', hrOnly: true })

    const contacted = assessRisk(buildInput(12, { checkins, hrContactedAt: at(TODAY) }))
    expect(contacted.score).toBe(0)
  })

  it('новая просьба после контакта HR снова повышает риск', () => {
    const checkins = [{ ...goodCheckin(TODAY), wantsHr: true }]
    const input = buildInput(12, { checkins, hrContactedAt: at(addDays(TODAY, -3)) })
    expect(getCodes(input)).toEqual(['wants_hr'])
  })

  it('молчание больше 10 дней даёт 2 балла', () => {
    expect(getCodes(buildInput(20, { checkins: [goodCheckin(addDays(TODAY, -10))] }))).toEqual([])
    expect(getCodes(buildInput(20, { checkins: [goodCheckin(addDays(TODAY, -11))] }))).toEqual(['silence'])
  })

  it('отсутствие чек-инов считается молчанием от даты выхода', () => {
    expect(getCodes(buildInput(11, { checkins: [] }))).toEqual([])
    expect(getCodes(buildInput(12, { checkins: [] }))).toEqual(['silence'])
  })

  it('наставник должен быть назначен после третьего дня', () => {
    expect(getCodes(buildInput(3, { hasMentor: false }))).toEqual([])
    expect(getCodes(buildInput(4, { hasMentor: false }))).toEqual(['no_mentor'])
  })

  it('каждая просроченная встреча даёт 2 балла', () => {
    const input = buildInput(40, {
      checkpoints: [
        { day: 1, dueDate: addDays(TODAY, -39), doneAt: at(addDays(TODAY, -39)) },
        { day: 7, dueDate: addDays(TODAY, -33), doneAt: null },
        { day: 30, dueDate: addDays(TODAY, -10), doneAt: null },
        { day: 60, dueDate: addDays(TODAY, 20), doneAt: null },
      ],
    })
    expect(assessRisk(input)).toMatchObject({ score: 4, level: 'high' })
    expect(getCodes(input)).toEqual(['overdue_checkpoint', 'overdue_checkpoint'])
  })

  it('встреча сегодня ещё не просрочена', () => {
    const input = buildInput(7, { checkpoints: [{ day: 7, dueDate: TODAY, doneAt: null }] })
    expect(assessRisk(input).score).toBe(0)
  })

  it('чек-лист отстаёт, если не сделано больше 30% пунктов с прошедшим сроком', () => {
    const doneAt = at(addDays(TODAY, -5))
    const onTrack = buildInput(10, {
      checklist: [
        { dueDay: 1, doneAt },
        { dueDay: 2, doneAt },
        { dueDay: 3, doneAt },
        { dueDay: 5, doneAt: null },
        { dueDay: 10, doneAt: null },
        { dueDay: 30, doneAt: null },
      ],
    })
    expect(getCodes(onTrack)).toEqual([])

    const behind = buildInput(10, {
      checklist: [
        { dueDay: 1, doneAt },
        { dueDay: 2, doneAt: null },
        { dueDay: 5, doneAt: null },
      ],
    })
    expect(assessRisk(behind)).toMatchObject({ score: 1, level: 'low' })
    expect(getCodes(behind)).toEqual(['checklist_behind'])
  })

  it('сортирует причины по весу', () => {
    const input = buildInput(20, {
      hasMentor: false,
      checkins: [{ ...goodCheckin(addDays(TODAY, -2)), mood: 1 }],
      checklist: [{ dueDay: 1, doneAt: null }],
    })
    expect(assessRisk(input).factors.map((factor) => factor.points)).toEqual([3, 2, 1])
  })
})

describe('redactRiskForManager', () => {
  it('скрывает HR-сигнал, сохраняя балл', () => {
    const risk = assessRisk(
      buildInput(12, { checkins: [{ ...goodCheckin(addDays(TODAY, -1)), mood: 2, wantsHr: true }] }),
    )
    const redacted = redactRiskForManager(risk)

    expect(redacted.score).toBe(risk.score)
    expect(redacted.level).toBe('high')
    expect(redacted.factors.map((factor) => factor.code).toSorted()).toEqual(['hr_signal', 'low_mood'])
    expect(JSON.stringify(redacted)).not.toContain('Просит связаться с HR')
  })
})
