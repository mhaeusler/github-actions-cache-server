import type { Kysely, Transaction } from 'kysely'
import type { Database } from './db'
import { sql } from 'kysely'
import { env } from './env'

export function getUtcDay(timestamp = Date.now()) {
  return new Date(timestamp).toISOString().slice(0, 10)
}

export async function recordStorageDailyStats(
  db: Kysely<Database> | Transaction<Database>,
  { addedBytes = 0, removedBytes = 0 }: { addedBytes?: number; removedBytes?: number } = {},
) {
  const current = await db
    .selectFrom('storage_locations')
    .select(sql<number>`coalesce(sum(${sql.ref('sizeBytes')}), 0)`.as('totalBytes'))
    .executeTakeFirstOrThrow()

  const values = {
    day: getUtcDay(),
    addedBytes,
    removedBytes,
    totalBytes: Number(current.totalBytes ?? 0),
  }
  const insert = db.insertInto('storage_daily_stats').values(values)
  const addedBytesRef =
    env.DB_DRIVER === 'postgres' ? sql.ref('storage_daily_stats.addedBytes') : sql.ref('addedBytes')
  const removedBytesRef =
    env.DB_DRIVER === 'postgres'
      ? sql.ref('storage_daily_stats.removedBytes')
      : sql.ref('removedBytes')

  if (env.DB_DRIVER === 'mysql')
    return insert
      .onDuplicateKeyUpdate({
        addedBytes: sql<number>`${addedBytesRef} + ${addedBytes}`,
        removedBytes: sql<number>`${removedBytesRef} + ${removedBytes}`,
        totalBytes: values.totalBytes,
      })
      .execute()

  return insert
    .onConflict((oc) =>
      oc.column('day').doUpdateSet({
        addedBytes: sql<number>`${addedBytesRef} + ${addedBytes}`,
        removedBytes: sql<number>`${removedBytesRef} + ${removedBytes}`,
        totalBytes: values.totalBytes,
      }),
    )
    .execute()
}
