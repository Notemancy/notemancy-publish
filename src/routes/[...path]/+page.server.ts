// src/routes/+page.server.ts
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { pagetable } from '$lib/server/db/schema';
import { sql } from 'drizzle-orm';

export type PageData = {
  mdcontent: string;
  metadata: Record<string, any>;
};

export const load: PageServerLoad<PageData> = async ({ params }): Promise<PageData> => {
  let virtual_path = 'home.md';
  if (params.path) {
    const pathString = Array.isArray(params.path) ? params.path.join('/') : params.path;
    virtual_path = pathString;
  }
  console.log("GOT virtual_path:", virtual_path);

  try {
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
    let metadata: Record<string, any> = {};
    try {
      // First, try to parse the metadata string.
      let parsed = typeof record.metadata === 'string'
        ? JSON.parse(record.metadata)
        : record.metadata;

      console.log('After first parse, type is:', typeof parsed);
      
      // If the result is still a string, parse it again.
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
        console.log('After second parse, type is:', typeof parsed);
      }

      metadata = parsed;
      console.log('Final metadata object:', metadata);
    } catch (error) {
      console.error('Error parsing metadata:', error);
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
