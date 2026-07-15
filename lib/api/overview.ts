import { sql } from 'kysely'
import z from 'zod'
import { env } from '../env'
import { getUtcDay } from '../storage-stats'
import { base } from './base'

const countSchema = z.object({
  total: z.number(),
})

const breakdownSchema = z.object({
  name: z.string(),
  entries: z.number(),
  bytes: z.number(),
})

const largestEntrySchema = z.object({
  id: z.string(),
  key: z.string(),
  repoId: z.string(),
  updatedAt: z.number(),
  lastAccessedAt: z.number().nullable(),
  sizeBytes: z.number(),
})

const recentEntrySchema = largestEntrySchema

const dailyStatSchema = z.object({
  day: z.string(),
  addedBytes: z.number(),
  removedBytes: z.number(),
  totalBytes: z.number(),
})

const overviewSchema = z.object({
  generatedAt: z.number(),
  server: z.object({
    version: z.string(),
    storageDriver: z.string(),
    databaseDriver: z.string(),
  }),
  cacheEntries: countSchema,
  storage: z.object({
    locations: z.number(),
    sizeTrackedLocations: z.number(),
    bytes: z.number(),
  }),
  topRepositories: z.array(breakdownSchema),
  dailyStats: z.array(dailyStatSchema),
  largestEntries: z.array(largestEntrySchema),
  recentEntries: z.array(recentEntrySchema),
})

const asNumber = (value: unknown) => Number(value ?? 0)

function getRecentUtcDays(count: number) {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  return Array.from({ length: count }, (_, index) => {
    const day = new Date(today)
    day.setUTCDate(today.getUTCDate() - count + index + 1)
    return getUtcDay(day.getTime())
  })
}

export const overviewRouter = base
  .prefix('/overview')
  .tag('Overview')
  .router({
    get: base
      .route({
        method: 'GET',
        path: '/',
        summary: 'Get cache server overview',
        description:
          'Retrieve aggregate cache, storage, repository, daily data movement, and largest-entry data for a management dashboard.',
      })
      .input(z.object({}))
      .output(overviewSchema)
      .handler(async ({ context }) => {
        const { db } = context

        const [cacheEntries, storage, topRepositories, dailyStats, largestEntries, recentEntries] =
          await Promise.all([
            db
              .selectFrom('cache_entries')
              .select(({ fn }) => fn.countAll<number>().as('total'))
              .executeTakeFirstOrThrow(),
            db
              .selectFrom('storage_locations')
              .select(({ fn }) => [
                fn.countAll<number>().as('locations'),
                sql<number>`coalesce(sum(${sql.ref('sizeBytes')}), 0)`.as('bytes'),
                sql<number>`coalesce(sum(case when ${sql.ref('sizeBytes')} is not null then 1 else 0 end), 0)`.as(
                  'sizeTrackedLocations',
                ),
              ])
              .executeTakeFirstOrThrow(),
            db
              .selectFrom('cache_entries')
              .leftJoin('storage_locations', 'storage_locations.id', 'cache_entries.locationId')
              .select(({ fn }) => [
                'cache_entries.repoId as name',
                fn.countAll<number>().as('entries'),
                sql<number>`coalesce(sum(${sql.ref('storage_locations.sizeBytes')}), 0)`.as(
                  'bytes',
                ),
              ])
              .groupBy('cache_entries.repoId')
              .orderBy('entries', 'desc')
              .limit(6)
              .execute(),
            db
              .selectFrom('storage_daily_stats')
              .selectAll()
              .where('day', '>=', getRecentUtcDays(30)[0])
              .orderBy('day', 'asc')
              .execute(),
            db
              .selectFrom('cache_entries')
              .leftJoin('storage_locations', 'storage_locations.id', 'cache_entries.locationId')
              .select([
                'cache_entries.id as id',
                'cache_entries.key as key',
                'cache_entries.repoId as repoId',
                'cache_entries.updatedAt as updatedAt',
                'storage_locations.lastDownloadedAt as lastAccessedAt',
                sql<number>`coalesce(${sql.ref('storage_locations.sizeBytes')}, 0)`.as('sizeBytes'),
              ])
              .orderBy('sizeBytes', 'desc')
              .orderBy('cache_entries.updatedAt', 'desc')
              .limit(20)
              .execute(),
            db
              .selectFrom('cache_entries')
              .leftJoin('storage_locations', 'storage_locations.id', 'cache_entries.locationId')
              .select([
                'cache_entries.id as id',
                'cache_entries.key as key',
                'cache_entries.repoId as repoId',
                'cache_entries.updatedAt as updatedAt',
                'storage_locations.lastDownloadedAt as lastAccessedAt',
                sql<number>`coalesce(${sql.ref('storage_locations.sizeBytes')}, 0)`.as('sizeBytes'),
              ])
              .orderBy('cache_entries.updatedAt', 'desc')
              .limit(8)
              .execute(),
          ])

        return {
          generatedAt: Date.now(),
          server: {
            version: useRuntimeConfig().version,
            storageDriver: env.STORAGE_DRIVER,
            databaseDriver: env.DB_DRIVER,
          },
          cacheEntries: { total: asNumber(cacheEntries.total) },
          storage: {
            locations: asNumber(storage.locations),
            sizeTrackedLocations: asNumber(storage.sizeTrackedLocations),
            bytes: asNumber(storage.bytes),
          },
          topRepositories: topRepositories.map((item) => ({
            name: item.name,
            entries: asNumber(item.entries),
            bytes: asNumber(item.bytes),
          })),
          dailyStats: (() => {
            const statsByDay = new Map(dailyStats.map((item) => [item.day, item]))
            const days = getRecentUtcDays(30)
            const today = days.at(-1)
            let totalBytes = 0
            return days.map((day) => {
              const stat = statsByDay.get(day)
              if (stat) totalBytes = asNumber(stat.totalBytes)
              if (day === today) totalBytes = asNumber(storage.bytes)
              return {
                day,
                addedBytes: asNumber(stat?.addedBytes),
                removedBytes: asNumber(stat?.removedBytes),
                totalBytes,
              }
            })
          })(),
          largestEntries: largestEntries.map((item) => ({
            id: item.id,
            key: item.key,
            repoId: item.repoId,
            updatedAt: item.updatedAt,
            lastAccessedAt: item.lastAccessedAt,
            sizeBytes: asNumber(item.sizeBytes),
          })),
          recentEntries: recentEntries.map((item) => ({
            id: item.id,
            key: item.key,
            repoId: item.repoId,
            updatedAt: item.updatedAt,
            lastAccessedAt: item.lastAccessedAt,
            sizeBytes: asNumber(item.sizeBytes),
          })),
        }
      }),
  })
