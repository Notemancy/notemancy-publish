import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	age: integer('age'),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull()
});

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

export const pagetable = sqliteTable('pagetable', {
    id: integer('id').primaryKey().unique(), // INTEGER PRIMARY KEY auto-increments in SQLite
		virtualPath: text('virtual_path').notNull().unique(),
		localPath: text('local_path').notNull(),
    mdContent: text('mdcontent').notNull(),
    metadata: text('metadata').notNull(), // JSON as text to store stringified JSON
});

export type Session = typeof session.$inferSelect;

export type User = typeof user.$inferSelect;
