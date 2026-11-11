import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { getTodayIsoDate } from '../../shared/dates.ts'
import { isInProgram } from '../../shared/timeline.ts'
import { db } from '../db/client.ts'
import { checkpoints, newcomers } from '../db/schema.ts'
import { badRequest, notFound } from '../lib/http.ts'
import { parseId, parseJsonBody } from '../lib/validation.ts'
import { getViewer, requireHr, requireManager } from '../lib/viewer.ts'
import { compareByRisk, toListItemDto } from '../services/mappers.ts'
import {
  assertViewerCanAccess,
  findMentorCandidates,
  findNewcomerAggregate,
  findNewcomerAggregates,
  getNewcomerDetail,
} from '../services/newcomers.ts'

const mentorSchema = z.object({ mentorId: z.number().int().positive().nullable() })

const checkpointSchema = z.object({
  done: z.boolean(),
  note: z.string().trim().max(1000).default(''),
})

export const newcomerRoutes = new Hono()

newcomerRoutes.get('/', async (context) => {
  const viewer = getViewer(context)
  const today = getTodayIsoDate()

  const activeCondition = eq(newcomers.status, 'active')
  const where =
    viewer.role === 'manager' ? and(activeCondition, eq(newcomers.managerId, viewer.managerId)) : activeCondition

  const aggregates = await findNewcomerAggregates(where)
  const items = aggregates
    .map((aggregate) => toListItemDto(aggregate, today, viewer))
    .filter((item) => isInProgram(item.dayNumber))
    .toSorted(compareByRisk)

  return context.json(items)
})

newcomerRoutes.get('/:id', async (context) => {
  const viewer = getViewer(context)
  return context.json(await getNewcomerDetail(parseId(context.req.param('id')), viewer, getTodayIsoDate()))
})

newcomerRoutes.patch('/:id/mentor', async (context) => {
  const viewer = getViewer(context)
  const newcomerId = parseId(context.req.param('id'))
  const { mentorId } = await parseJsonBody(context, mentorSchema)

  const aggregate = await findNewcomerAggregate(eq(newcomers.id, newcomerId))
  if (!aggregate) throw notFound('Новичок не найден')
  assertViewerCanAccess(aggregate, viewer)

  if (mentorId !== null) {
    const candidates = await findMentorCandidates(aggregate)
    if (!candidates.some((candidate) => candidate.id === mentorId)) {
      throw badRequest('Наставник должен работать в той же команде')
    }
  }

  await db.update(newcomers).set({ mentorId }).where(eq(newcomers.id, newcomerId))
  return context.json(await getNewcomerDetail(newcomerId, viewer, getTodayIsoDate()))
})

newcomerRoutes.post('/:id/hr-contact', async (context) => {
  const viewer = requireHr(context)
  const newcomerId = parseId(context.req.param('id'))

  const [updated] = await db
    .update(newcomers)
    .set({ hrContactedAt: new Date() })
    .where(eq(newcomers.id, newcomerId))
    .returning({ id: newcomers.id })
  if (!updated) throw notFound('Новичок не найден')

  return context.json(await getNewcomerDetail(newcomerId, viewer, getTodayIsoDate()))
})

export const checkpointRoutes = new Hono()

checkpointRoutes.patch('/:id', async (context) => {
  const viewer = requireManager(context)
  const checkpointId = parseId(context.req.param('id'))
  const { done, note } = await parseJsonBody(context, checkpointSchema)

  const checkpoint = await db.query.checkpoints.findFirst({
    where: eq(checkpoints.id, checkpointId),
    with: { newcomer: true },
  })
  if (!checkpoint) throw notFound('Встреча не найдена')
  assertViewerCanAccess(checkpoint.newcomer, viewer)

  await db
    .update(checkpoints)
    .set({ doneAt: done ? new Date() : null, note: done && note ? note : null })
    .where(eq(checkpoints.id, checkpointId))

  return context.json(await getNewcomerDetail(checkpoint.newcomerId, viewer, getTodayIsoDate()))
})
