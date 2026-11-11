import type { IncomingMessage, ServerResponse } from 'node:http'
import { getRequestListener } from '@hono/node-server'
import { app } from './app.ts'

const API_PREFIX = '/api'
const ROUTED_PATH_PARAM = '__path'

const listener = getRequestListener(app.fetch)

const restoreOriginalUrl = (rawUrl: string): string => {
  const url = new URL(rawUrl, 'http://localhost')
  const routedPath = url.searchParams.get(ROUTED_PATH_PARAM)
  if (url.pathname !== API_PREFIX || routedPath === null) return rawUrl

  url.searchParams.delete(ROUTED_PATH_PARAM)
  const query = url.searchParams.toString()
  return `${API_PREFIX}/${routedPath}${query ? `?${query}` : ''}`
}

const handler = (request: IncomingMessage, response: ServerResponse) => {
  request.url = restoreOriginalUrl(request.url ?? API_PREFIX)
  return listener(request, response)
}

export default handler
