import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import type { NewcomerPageDto } from '../../shared/api.ts'
import { getTodayIsoDate } from '../../shared/dates.ts'
import { ANSWER_LEVELS, MOOD_VALUES } from '../../shared/domain.ts'
import { getFaq } from '../../shared/faq.ts'
import { getFirstName } from '../../shared/text.ts'
import { getCheckinAvailability, getDayNumber, getStage } from '../../shared/timeline.ts'
import { db } from '../db/client.ts'
import { checkins, checklistItems, employees, newcomers } from '../db/schema.ts'
import { conflict, notFound, serviceUnavailable } from '../lib/http.ts'
import { parseId, parseJsonBody } from '../lib/validation.ts'
import {
  getNextCheckpoint,
  sortCheckinsNewestFirst,
  sortChecklist,
  sortCheckpoints,
  toChecklistItemDto,
  toCheckpointDto,
  toDepartmentDto,
  toLocationDto,
  toPersonDto,
} from '../services/mappers.ts'
import { findNewcomerAggregate, type NewcomerAggregate } from '../services/newcomers.ts'

const checklistSchema = z.object({ done: z.boolean() })

const checkinSchema = z.object({
  mood: z.literal(MOOD_VALUES),
  clarity: z.enum(ANSWER_LEVELS),
  support: z.enum(ANSWER_LEVELS),
  comment: z.string().trim().max(1000).default(''),
  wantsHr: z.boolean().default(false),
})

const findByToken = async (token: string): Promise<NewcomerAggregate> => {
  const aggregate = await findNewcomerAggregate(eq(newcomers.token, token))
  if (!aggregate) throw notFound('Страница не найдена. Проверьте ссылку или спросите её у HR.')
  return aggregate
}

const findActiveByToken = async (token: string): Promise<NewcomerAggregate> => {
  const aggregate = await findByToken(token)
  if (aggregate.status !== 'active') throw conflict('Адаптация по этой ссылке завершена')
  return aggregate
}

const buildPageDto = async (aggregate: NewcomerAggregate, today: string): Promise<NewcomerPageDto> => {
  const hr = await db.query.employees.findFirst({ where: eq(employees.role, 'hr') })
  if (!hr) throw serviceUnavailable('Демо-данные не загружены')

  const dayNumber = getDayNumber(aggregate.startDate, today)
  const lastCheckin = sortCheckinsNewestFirst(aggregate.checkins)[0] ?? null
  const lastAt = lastCheckin?.createdAt.toISOString() ?? null
  const checkpointDtos = sortCheckpoints(aggregate.checkpoints).map((row) => toCheckpointDto(row, today))

  return {
    fullName: aggregate.fullName,
    firstName: getFirstName(aggregate.fullName),
    position: aggregate.position,
    status: aggregate.status,
    department: toDepartmentDto(aggregate.department),
    location: toLocationDto(aggregate.location),
    startDate: aggregate.startDate,
    dayNumber,
    stage: getStage(dayNumber),
    manager: toPersonDto(aggregate.manager),
    mentor: aggregate.mentor ? toPersonDto(aggregate.mentor) : null,
    hr: toPersonDto(hr),
    checklist: sortChecklist(aggregate.checklistItems).map(toChecklistItemDto),
    nextCheckpoint: getNextCheckpoint(checkpointDtos),
    checkin: { ...getCheckinAvailability(lastAt, dayNumber, today), lastAt },
    faq: getFaq(aggregate.department.code),
  }
}

export const newcomerPageRoutes = new Hono()

newcomerPageRoutes.get('/:token', async (context) => {
  const aggregate = await findByToken(context.req.param('token'))
  return context.json(await buildPageDto(aggregate, getTodayIsoDate()))
})

newcomerPageRoutes.patch('/:token/checklist/:itemId', async (context) => {
  const token = context.req.param('token')
  const itemId = parseId(context.req.param('itemId'))
  const { done } = await parseJsonBody(context, checklistSchema)
  const aggregate = await findActiveByToken(token)

  const [updated] = await db
    .update(checklistItems)
    .set({ doneAt: done ? new Date() : null })
    .where(and(eq(checklistItems.id, itemId), eq(checklistItems.newcomerId, aggregate.id)))
    .returning({ id: checklistItems.id })
  if (!updated) throw notFound('Пункт чек-листа не найден')

  return context.json(await buildPageDto(await findByToken(token), getTodayIsoDate()))
})

newcomerPageRoutes.post('/:token/checkins', async (context) => {
  const token = context.req.param('token')
  const input = await parseJsonBody(context, checkinSchema)
  const aggregate = await findActiveByToken(token)
  const today = getTodayIsoDate()

  const lastAt = sortCheckinsNewestFirst(aggregate.checkins)[0]?.createdAt.toISOString() ?? null
  const dayNumber = getDayNumber(aggregate.startDate, today)
  if (dayNumber < 1) throw conflict('Чек-ин станет доступен после выхода на работу')

  const availability = getCheckinAvailability(lastAt, dayNumber, today)
  if (!availability.available) throw conflict('Чек-ин на этой неделе уже пройден')

  await db.insert(checkins).values({
    newcomerId: aggregate.id,
    mood: input.mood,
    clarity: input.clarity,
    support: input.support,
    comment: input.comment || null,
    wantsHr: input.wantsHr,
  })

  return context.json(await buildPageDto(await findByToken(token), today), 201)
})
