import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { ApiErrorDto } from '../shared/api.ts'
import { b24Routes } from './routes/b24.ts'
import { demoRoutes } from './routes/demo.ts'
import { metaRoutes } from './routes/meta.ts'
import { metricsRoutes } from './routes/metrics.ts'
import { newcomerPageRoutes } from './routes/newcomerPage.ts'
import { checkpointRoutes, newcomerRoutes } from './routes/newcomers.ts'

export const app = new Hono().basePath('/api')

app.use(async (context, next) => {
  await next()
  context.header('Cache-Control', 'no-store')
})

app.route('/meta', metaRoutes)
app.route('/newcomers', newcomerRoutes)
app.route('/checkpoints', checkpointRoutes)
app.route('/n', newcomerPageRoutes)
app.route('/b24', b24Routes)
app.route('/metrics', metricsRoutes)
app.route('/demo', demoRoutes)

app.notFound((context) => context.json<ApiErrorDto>({ error: 'Метод API не найден' }, 404))

app.onError((error, context) => {
  if (error instanceof HTTPException) {
    return context.json<ApiErrorDto>({ error: error.message }, error.status)
  }

  console.error(error)
  return context.json<ApiErrorDto>({ error: 'Внутренняя ошибка сервера' }, 500)
})
