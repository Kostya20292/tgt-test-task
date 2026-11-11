import { HTTPException } from 'hono/http-exception'

export const badRequest = (message: string): HTTPException => new HTTPException(400, { message })

export const forbidden = (message = 'Недостаточно прав'): HTTPException =>
  new HTTPException(403, { message })

export const notFound = (message = 'Не найдено'): HTTPException => new HTTPException(404, { message })

export const conflict = (message: string): HTTPException => new HTTPException(409, { message })

export const serviceUnavailable = (message: string): HTTPException =>
  new HTTPException(503, { message })
