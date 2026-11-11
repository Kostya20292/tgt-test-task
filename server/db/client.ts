import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema.ts'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set')
}

const isServerless = Boolean(process.env.VERCEL)

const client = postgres(databaseUrl, {
  max: isServerless ? 1 : 5,
  prepare: false,
  onnotice: () => {},
})

export const db = drizzle(client, { schema, casing: 'snake_case' })

export type Database = typeof db
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0]
export type DbExecutor = Database | Transaction

export const closeDb = (): Promise<void> => client.end()
