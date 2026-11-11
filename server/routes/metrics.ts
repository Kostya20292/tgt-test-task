import { Hono } from 'hono'
import { getTodayIsoDate } from '../../shared/dates.ts'
import { requireHr } from '../lib/viewer.ts'
import { computeMetrics } from '../services/metrics.ts'

export const metricsRoutes = new Hono()

metricsRoutes.get('/', async (context) => {
  requireHr(context)
  return context.json(await computeMetrics(getTodayIsoDate()))
})
