import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import type { ShowcaseNewcomerDto } from '../../shared/api.ts'
import { getTodayIsoDate } from '../../shared/dates.ts'
import { getDayNumber, getStage, type Stage } from '../../shared/timeline.ts'
import { db } from '../db/client.ts'
import { newcomers } from '../db/schema.ts'
import { seedDatabase } from '../seed/seedDatabase.ts'

const SHOWCASE_STAGES: Stage[] = ['first_week', 'first_month', 'probation']

export const demoRoutes = new Hono()

demoRoutes.post('/reset', async (context) => {
  const result = await seedDatabase()
  return context.json(result)
})

demoRoutes.get('/showcase', async (context) => {
  const today = getTodayIsoDate()
  const rows = await db.select().from(newcomers).where(eq(newcomers.status, 'active'))

  const candidates = rows
    .map((row) => {
      const dayNumber = getDayNumber(row.startDate, today)
      return { row, dayNumber, stage: getStage(dayNumber) }
    })
    .toSorted((first, second) => first.dayNumber - second.dayNumber)

  const showcase: ShowcaseNewcomerDto[] = SHOWCASE_STAGES.flatMap((stage) => {
    const candidate = candidates.find((item) => item.stage === stage)
    if (!candidate) return []
    return [
      {
        fullName: candidate.row.fullName,
        position: candidate.row.position,
        token: candidate.row.token,
        dayNumber: candidate.dayNumber,
        stage,
      },
    ]
  })

  return context.json(showcase)
})
