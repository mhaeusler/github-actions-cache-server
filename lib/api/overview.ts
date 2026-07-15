import { sql } from 'kysely'
import z from 'zod'
import { env } from '../env'
import { base } from './base'

const countSchema = z.object({
  total: z.number(),
})

const breakdownSchema = z.object({
  name: z.string(),
  entries: z.number(),
  bytes: z.number(),
})

const recentEntrySchema = z.object({
  id: z.string(),
  key: z.string(),
  version: z.string(),
  scope: z.string(),
  repoId: z.string(),
  updatedAt: z.number(),
  sizeBytes: z.number().nullable(),
})

const activeUploadSchema = z.object({
  id: z.number(),
  key: z.string(),
  version: z.string(),
  scope: z.string(),
  repoId: z.string(),
  createdAt: z.number(),
  lastPartUploadedAt: z.number().nullable(),
  startedPartUploadCount: z.number(),
  finishedPartUploadCount: z.number(),
})

const overviewSchema = z.object({
  generatedAt: z.number(),
  server: z.object({
    version: z.string(),
    storageDriver: z.string(),
    databaseDriver: z.string(),
  }),
  cacheEntries: countSchema,
  uploads: countSchema,
  storage: z.object({
    locations: z.number(),
    mergedLocations: z.number(),
    pendingMerges: z.number(),
    downloadedLocations: z.number(),
    sizeTrackedLocations: z.number(),
    bytes: z.number(),
  }),
  topScopes: z.array(breakdownSchema),
  topRepositories: z.array(breakdownSchema),
  recentEntries: z.array(recentEntrySchema),
  activeUploads: z.array(activeUploadSchema),
})

const asNumber = (value: unknown) => Number(value ?? 0)

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
          'Retrieve aggregate cache, storage, upload, scope, repository, and recent-entry data for a management dashboard.',
      })
      .input(z.object({}))
      .output(overviewSchema)
      .handler(async ({ context }) => {
        const { db } = context

        const [
          cacheEntries,
          uploads,
          storage,
          topScopes,
          topRepositories,
          recentEntries,
          activeUploads,
        ] = await Promise.all([
          db
            .selectFrom('cache_entries')
            .select(({ fn }) => fn.countAll<number>().as('total'))
            .executeTakeFirstOrThrow(),
          db
            .selectFrom('uploads')
            .select(({ fn }) => fn.countAll<number>().as('total'))
            .executeTakeFirstOrThrow(),
          db
            .selectFrom('storage_locations')
            .select(({ fn }) => [
              fn.countAll<number>().as('locations'),
              sql<number>`coalesce(sum(${sql.ref('sizeBytes')}), 0)`.as('bytes'),
              sql<number>`coalesce(sum(case when ${sql.ref('mergedAt')} is not null then 1 else 0 end), 0)`.as(
                'mergedLocations',
              ),
              sql<number>`coalesce(sum(case when ${sql.ref('mergedAt')} is null then 1 else 0 end), 0)`.as(
                'pendingMerges',
              ),
              sql<number>`coalesce(sum(case when ${sql.ref('lastDownloadedAt')} is not null then 1 else 0 end), 0)`.as(
                'downloadedLocations',
              ),
              sql<number>`coalesce(sum(case when ${sql.ref('sizeBytes')} is not null then 1 else 0 end), 0)`.as(
                'sizeTrackedLocations',
              ),
            ])
            .executeTakeFirstOrThrow(),
          db
            .selectFrom('cache_entries')
            .leftJoin('storage_locations', 'storage_locations.id', 'cache_entries.locationId')
            .select(({ fn }) => [
              'cache_entries.scope as name',
              fn.countAll<number>().as('entries'),
              sql<number>`coalesce(sum(${sql.ref('storage_locations.sizeBytes')}), 0)`.as('bytes'),
            ])
            .groupBy('cache_entries.scope')
            .orderBy('entries', 'desc')
            .limit(6)
            .execute(),
          db
            .selectFrom('cache_entries')
            .leftJoin('storage_locations', 'storage_locations.id', 'cache_entries.locationId')
            .select(({ fn }) => [
              'cache_entries.repoId as name',
              fn.countAll<number>().as('entries'),
              sql<number>`coalesce(sum(${sql.ref('storage_locations.sizeBytes')}), 0)`.as('bytes'),
            ])
            .groupBy('cache_entries.repoId')
            .orderBy('entries', 'desc')
            .limit(6)
            .execute(),
          db
            .selectFrom('cache_entries')
            .leftJoin('storage_locations', 'storage_locations.id', 'cache_entries.locationId')
            .select([
              'cache_entries.id as id',
              'cache_entries.key as key',
              'cache_entries.version as version',
              'cache_entries.scope as scope',
              'cache_entries.repoId as repoId',
              'cache_entries.updatedAt as updatedAt',
              'storage_locations.sizeBytes as sizeBytes',
            ])
            .orderBy('cache_entries.updatedAt', 'desc')
            .limit(8)
            .execute(),
          db
            .selectFrom('uploads')
            .select([
              'id',
              'key',
              'version',
              'scope',
              'repoId',
              'createdAt',
              'lastPartUploadedAt',
              'startedPartUploadCount',
              'finishedPartUploadCount',
            ])
            .orderBy('createdAt', 'desc')
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
          uploads: { total: asNumber(uploads.total) },
          storage: {
            locations: asNumber(storage.locations),
            mergedLocations: asNumber(storage.mergedLocations),
            pendingMerges: asNumber(storage.pendingMerges),
            downloadedLocations: asNumber(storage.downloadedLocations),
            sizeTrackedLocations: asNumber(storage.sizeTrackedLocations),
            bytes: asNumber(storage.bytes),
          },
          topScopes: topScopes.map((item) => ({
            name: item.name,
            entries: asNumber(item.entries),
            bytes: asNumber(item.bytes),
          })),
          topRepositories: topRepositories.map((item) => ({
            name: item.name,
            entries: asNumber(item.entries),
            bytes: asNumber(item.bytes),
          })),
          recentEntries,
          activeUploads,
        }
      }),
  })
