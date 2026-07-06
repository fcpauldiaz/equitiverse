import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'

import * as schema from './schema'

type AppDb = LibSQLDatabase<typeof schema>

let dbInstance: AppDb | undefined

function getDb(): AppDb {
  if (typeof window !== 'undefined') {
    throw new Error('Database access is only available on the server.')
  }

  if (!dbInstance) {
    const url = process.env.TURSO_DATABASE_URL ?? 'file:local.db'
    const authToken = process.env.TURSO_AUTH_TOKEN

    const client = createClient({
      url,
      ...(authToken ? { authToken } : {}),
    })

    dbInstance = drizzle(client, { schema })
  }

  return dbInstance
}

export const db = new Proxy({} as AppDb, {
  get(_target, prop) {
    const instance = getDb()
    const value = Reflect.get(instance, prop, instance)
    return typeof value === 'function' ? value.bind(instance) : value
  },
})
