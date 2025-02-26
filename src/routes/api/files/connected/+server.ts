// src/routes/api/files/connected/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { pagetable } from '$lib/server/db/schema';

export const GET: RequestHandler = async ({ url }) => {
  // Get the current note's virtual path from the query parameters.
  const currentPath = url.searchParams.get('virtual_path');
  if (!currentPath) {
    return new Response(
      JSON.stringify({ error: 'virtual_path query param is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Fetch all notes from the database.
    const notes = await db.select().from(pagetable).all();

    // Define a regex that matches wiki-links in the following formats:
    // [[<virtual path>]] or [[<virtual path> | alias]]
    const wikiLinkRegex = /\[\[\s*([^\]|]+)(?:\|[^\]]+)?\s*\]\]/g;
    const referencingNotes: string[] = [];

    // Iterate over all notes.
    for (const note of notes) {
      // Skip the current note.
      if (note.virtualPath === currentPath) continue;
      if (!note.mdContent) continue;

      let match: RegExpExecArray | null;
      while ((match = wikiLinkRegex.exec(note.mdContent)) !== null) {
        // match[1] is the captured virtual path.
        const linkedPath = match[1].trim();
        if (linkedPath === currentPath) {
          referencingNotes.push(note.virtualPath);
          break; // found a match, no need to check further in this note.
        }
      }
    }

    console.log("REF", referencingNotes);

    return new Response(
      JSON.stringify(referencingNotes),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error querying connected notes:', error);
    return new Response(
      JSON.stringify({ error: 'Database error occurred.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
