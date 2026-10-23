// Database schema for tgcloud's built-in SQLite database
// Used for bot-side session state only.
// Orders, menus, and main app data remain in Firebase Firestore.
// https://core.telegram.org/bots/serverless#the-database

import { table, integer, text, sql, uniqueIndex } from 'sdk/db';

// Tracks active table sessions linked to a Telegram user
export const sessions = table('sessions', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  telegramId:  integer('telegram_id').notNull(),
  cafeId:      text('cafe_id').notNull(),
  tableId:     text('table_id').notNull(),
  firstName:   text('first_name'),
  username:    text('username'),
  createdAt:   integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt:   integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (t) => ({
  uniqSession: uniqueIndex('sessions_unique_idx').on(t.telegramId, t.cafeId, t.tableId),
}));

// Stores pending waiter acknowledgments from inline button presses
export const waiterCalls = table('waiter_calls', {
  id:         integer('id').primaryKey({ autoIncrement: true }),
  tableId:    text('table_id').notNull(),
  cafeId:     text('cafe_id').notNull(),
  waiterId:   text('waiter_id'),
  status:     text('status').notNull().default('pending'), // pending | acked | delayed
  createdAt:  integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});
