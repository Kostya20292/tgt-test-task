import { closeDb } from '../server/db/client.ts'
import { seedDatabase } from '../server/seed/seedDatabase.ts'

const result = await seedDatabase()
console.log(`Демо-данные загружены: ${result.newcomers} новичков`)
await closeDb()
