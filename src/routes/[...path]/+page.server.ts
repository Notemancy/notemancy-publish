// src/routes/+page.server.ts
import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/public';
import { db } from '$lib/server/db';
import { pagetable } from '$lib/server/db/schema';
import { sql } from 'drizzle-orm';

export type PageData = {
  mdcontent: string;
  metadata: Record<string, any>;
};

export const load: PageServerLoad<PageData> = async ({ params }): Promise<PageData> => {
  // Determine the virtual path.
  let virtual_path = 'home.md';
  if (params.path) {
    // When using a catch-all ([...path]), params.path is an array.
    const pathString = Array.isArray(params.path) ? params.path.join('/') : params.path;
    virtual_path = pathString;// + '.md';
  }
  console.log("GOT: ", virtual_path)

  try {
    // Query the database directly for the record matching the virtual_path.
    const records = await db
      .select()
      .from(pagetable)
      .where(sql`${pagetable.virtualPath} = ${virtual_path}`)
      .limit(1)
      .all();

    if (records.length === 0) {
      return {
        mdcontent: '',
        metadata: {},
      };
    }

    const record = records[0];
    let metadata: Record<string, any>;
    try {
      metadata = JSON.parse(record.metadata);
    } catch (error) {
      metadata = {};
    }

    return {
      mdcontent: record.mdContent,
      metadata,
    };
  } catch (error) {
    console.error('Database query error:', error);
    return {
      mdcontent: '',
      metadata: {},
    };
  }
};
