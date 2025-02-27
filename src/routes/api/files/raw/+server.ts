// src/routes/api/files/raw/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { pagetable } from '$lib/server/db/schema';
import { sql } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
  // Get the virtual_path query parameter; default to "home.md" if not provided.
  const virtual_path = url.searchParams.get('virtual_path') || 'home.md';

  console.log(virtual_path)

  try {
    // Query the database for the record matching the virtual_path.
    const records = db
      .select()
      .from(pagetable)
      .where(sql`${pagetable.virtualPath} = ${virtual_path}`)
      .limit(1)
      .all();


    // If no record is found, return an empty content string.
    if (records.length === 0) {
      return new Response(
        JSON.stringify({ content: '' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const record = records[0];
    // Return only the markdown content.
    return new Response(
      JSON.stringify({ content: record.mdContent }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Database query error:', error);
    return new Response(
      JSON.stringify({ error: 'Database error occurred.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
