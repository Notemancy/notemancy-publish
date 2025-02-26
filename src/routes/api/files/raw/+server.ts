// src/routes/api/mdfiles/raw/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { pagetable } from '$lib/server/db/schema';
import { sql } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
  // Get the virtual_path query parameter; default to "home.md" if not provided.
  const virtual_path = url.searchParams.get('virtual_path') || 'home.md';

  try {
    // Query the mdfiles table for a record matching the provided virtual_path.
    const records = await db
      .select()
      .from(pagetable)
      .where(sql`${pagetable.virtualPath} = ${virtual_path}`)
      .limit(1)
      .all();

    if (records.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Markdown file not found.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Take the first record
    const record = records[0];

    // Parse the metadata string into a JSON object
    if (record.metadata) {
      try {
        record.metadata = JSON.parse(record.metadata);
      } catch (error) {
        console.error('Failed to parse metadata:', error);
        // Optionally, you might want to return an error here if the metadata is corrupted.
        record.metadata = null;
      }
    }

    // Return the record (including the parsed metadata) as the JSON response.
    return new Response(
      JSON.stringify(record),
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
;
