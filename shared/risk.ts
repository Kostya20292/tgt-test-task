import { diffInDays, toIsoDate } from './dates.ts'
import type { AnswerLevel, Mood } from './domain.ts'
import { DAY_FORMS, ITEM_FORMS, formatCount } from './text.ts'
import {
  CHECKPOINT_TITLES,
  getCheckpointStatus,
  getDayNumber,
  type CheckpointDay,
} from './timeline.ts'

export type RiskLevel = 'low' | 'medium' | 'high'

export type RiskFactorCode =
  | 'low_mood'
  | 'wants_hr'
  | 'no_support'
  | 'no_clarity'
  | 'silence'
  | 'no_mentor'
  | 'overdue_checkpoint'
  | 'checklist_behind'
  | 'hr_signal'

export type RiskFactor = {
  code: RiskFactorCode
  points: number
  label: string
  action: string
  hrOnly: boolean
}

export type RiskAssessment = {
  score: number
  level: RiskLevel
  factors: RiskFactor[]
}

export type RiskCheckinSignal = {
  createdAt: string
  mood: Mood
  clarity: AnswerLevel
  support: AnswerLevel
  wantsHr: boolean
}

export type RiskInput = {
  today: string
  startDate: string
  hasMentor: boolean
  hrContactedAt: string | null
  checkins: RiskCheckinSignal[]
  checkpoints: { day: CheckpointDay; dueDate: string; doneAt: string | null }[]
  checklist: { dueDay: number; doneAt: string | null }[]
}

export const RISK_POINTS = {
  lowMood: 3,
  wantsHr: 3,
  noSupport: 2,
  noClarity: 2,
  silence: 2,
  noMentor: 2,
  overdueCheckpoint: 2,
  checklistBehind: 1,
} as const

export const RISK_RULES = {
  lowMoodMax: 2,
  silenceDays: 10,
  mentorGraceDays: 3,
  checklistBehindShare: 0.3,
} as const

export const RISK_THRESHOLDS = {
  medium: 2,
  high: 4,
} as const

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  low: 'Низкий риск',
  medium: 'Средний риск',
  high: 'Высокий риск',
}

export const getRiskLevel = (score: number): RiskLevel => {
  if (score >= RISK_THRESHOLDS.high) return 'high'
  if (score >= RISK_THRESHOLDS.medium) return 'medium'
  return 'low'
}

const getLatestCheckin = (checkins: RiskCheckinSignal[]): RiskCheckinSignal | null =>
  checkins.reduce<RiskCheckinSignal | null>(
    (latest, checkin) => (!latest || checkin.createdAt > latest.createdAt ? checkin : latest),
    null,
  )

const getCheckinFactors = (latest: RiskCheckinSignal | null): RiskFactor[] => {
  if (!latest) return []

  const factors: RiskFactor[] = []

  if (latest.mood <= RISK_RULES.lowMoodMax) {
    factors.push({
      code: 'low_mood',
      points: RISK_POINTS.lowMood,
      label: `Самочувствие ${latest.mood} из 5 в последнем чек-ине`,
      action: 'Поговорите лично: что мешает и чем помочь',
      hrOnly: false,
    })
  }

  if (latest.support === 'no') {
    factors.push({
      code: 'no_support',
      points: RISK_POINTS.noSupport,
      label: 'Новичку не хватает помощи',
      action: 'Проверьте, есть ли у наставника время; договоритесь о регулярных вопросах',
      hrOnly: false,
    })
  }

  if (latest.clarity === 'no') {
    factors.push({
      code: 'no_clarity',
      points: RISK_POINTS.noClarity,
      label: 'Новичку непонятно, чего от него ждут',
      action: 'Проговорите задачи и критерии успеха на ближайшую неделю',
      hrOnly: false,
    })
  }

  return factors
}

const getHrRequestFactor = ({ checkins, hrContactedAt }: RiskInput): RiskFactor | null => {
  const hasPendingRequest = checkins.some(
    (checkin) => checkin.wantsHr && (!hrContactedAt || checkin.createdAt > hrContactedAt),
  )
  if (!hasPendingRequest) return null

  return {
    code: 'wants_hr',
    points: RISK_POINTS.wantsHr,
    label: 'Просит связаться с HR',
    action: 'Свяжитесь с сотрудником сегодня и отметьте «HR связался»',
    hrOnly: true,
  }
}

const getSilenceFactor = (
  latest: RiskCheckinSignal | null,
  { startDate, today }: RiskInput,
): RiskFactor | null => {
  const silenceFrom = latest ? toIsoDate(latest.createdAt) : startDate
  const silentDays = diffInDays(silenceFrom, today)
  if (silentDays <= RISK_RULES.silenceDays) return null

  return {
    code: 'silence',
    points: RISK_POINTS.silence,
    label: latest
      ? `Нет чек-ина ${formatCount(silentDays, DAY_FORMS)}`
      : `Ни одного чек-ина за ${formatCount(silentDays, DAY_FORMS)}`,
    action: 'Спросите лично, как дела, и напомните про чек-ин',
    hrOnly: false,
  }
}

const getMentorFactor = (dayNumber: number, hasMentor: boolean): RiskFactor | null => {
  if (hasMentor || dayNumber <= RISK_RULES.mentorGraceDays) return null

  return {
    code: 'no_mentor',
    points: RISK_POINTS.noMentor,
    label: 'Наставник не назначен',
    action: 'Назначьте наставника из команды',
    hrOnly: false,
  }
}

const getCheckpointFactors = ({ checkpoints, today }: RiskInput): RiskFactor[] =>
  checkpoints
    .filter((checkpoint) => getCheckpointStatus(checkpoint, today) === 'overdue')
    .toSorted((first, second) => first.day - second.day)
    .map((checkpoint) => ({
      code: 'overdue_checkpoint',
      points: RISK_POINTS.overdueCheckpoint,
      label: `Просрочена встреча «${CHECKPOINT_TITLES[checkpoint.day]}»`,
      action: 'Проведите встречу и отметьте её в карточке',
      hrOnly: false,
    }))

const getChecklistFactor = (dayNumber: number, { checklist }: RiskInput): RiskFactor | null => {
  const dueItems = checklist.filter((item) => item.dueDay < dayNumber)
  if (dueItems.length === 0) return null

  const missedCount = dueItems.filter((item) => !item.doneAt).length
  if (missedCount / dueItems.length <= RISK_RULES.checklistBehindShare) return null

  return {
    code: 'checklist_behind',
    points: RISK_POINTS.checklistBehind,
    label: `Чек-лист отстаёт: не выполнено ${formatCount(missedCount, ITEM_FORMS)} из ${dueItems.length}`,
    action: 'Помогите закрыть пункты адаптации',
    hrOnly: false,
  }
}

const isRiskFactor = (factor: RiskFactor | null): factor is RiskFactor => factor !== null

export const assessRisk = (input: RiskInput): RiskAssessment => {
  const dayNumber = getDayNumber(input.startDate, input.today)
  if (dayNumber < 1) return { score: 0, level: 'low', factors: [] }

  const latest = getLatestCheckin(input.checkins)

  const factors = [
    ...getCheckinFactors(latest),
    getHrRequestFactor(input),
    getSilenceFactor(latest, input),
    getMentorFactor(dayNumber, input.hasMentor),
    ...getCheckpointFactors(input),
    getChecklistFactor(dayNumber, input),
  ]
    .filter(isRiskFactor)
    .toSorted((first, second) => second.points - first.points)

  const score = factors.reduce((total, factor) => total + factor.points, 0)

  return { score, level: getRiskLevel(score), factors }
}

export const redactRiskForManager = (risk: RiskAssessment): RiskAssessment => ({
  ...risk,
  factors: risk.factors.map((factor) =>
    factor.hrOnly
      ? {
          code: 'hr_signal',
          points: factor.points,
          label: 'Есть сигнал для HR',
          action: 'HR в курсе и свяжется с сотрудником',
          hrOnly: false,
        }
      : factor,
  ),
})
