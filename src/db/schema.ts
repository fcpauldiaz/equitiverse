import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['admin', 'subscriber'] })
    .notNull()
    .default('subscriber'),
  disabledAt: integer('disabled_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index('sessions_user_id_idx').on(table.userId)],
)

export const callouts = sqliteTable(
  'callouts',
  {
    id: text('id').primaryKey(),
    ticker: text('ticker').notNull(),
    entryPrice: real('entry_price').notNull(),
    entryDate: integer('entry_date', { mode: 'timestamp' }).notNull(),
    exitPrice: real('exit_price'),
    exitDate: integer('exit_date', { mode: 'timestamp' }),
    status: text('status', { enum: ['open', 'closed'] })
      .notNull()
      .default('open'),
    thesis: text('thesis'),
    createdBy: text('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index('callouts_status_idx').on(table.status),
    index('callouts_ticker_idx').on(table.ticker),
  ],
)

export const quoteCache = sqliteTable('quote_cache', {
  ticker: text('ticker').primaryKey(),
  price: real('price').notNull(),
  changePct: real('change_pct'),
  fetchedAt: integer('fetched_at', { mode: 'timestamp' }).notNull(),
})

export const subscriberPreferences = sqliteTable('subscriber_preferences', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  digestFrequency: text('digest_frequency', {
    enum: ['daily', 'weekly', 'none'],
  })
    .notNull()
    .default('weekly'),
  unsubscribedAt: integer('unsubscribed_at', { mode: 'timestamp' }),
})

export const digestLogs = sqliteTable('digest_logs', {
  id: text('id').primaryKey(),
  sentAt: integer('sent_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  recipientCount: integer('recipient_count').notNull(),
  type: text('type', { enum: ['daily', 'weekly', 'manual'] }).notNull(),
})

export const inviteTokens = sqliteTable('invite_tokens', {
  token: text('token').primaryKey(),
  email: text('email').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  usedAt: integer('used_at', { mode: 'timestamp' }),
  createdBy: text('created_by')
    .notNull()
    .references(() => users.id),
})

export const appSettings = sqliteTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
})

export type User = typeof users.$inferSelect
export type Callout = typeof callouts.$inferSelect
export type QuoteCacheEntry = typeof quoteCache.$inferSelect
