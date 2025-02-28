// src/routes/api/upload/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { pagetable } from '$lib/server/db/schema';
import matter from 'gray-matter';

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Parse the incoming JSON payload
		const payload = await request.json();
		const { virtual_path, local_path, mdcontent, metadata } = payload;
		console.log("Received upload payload:", payload);

		// Use gray-matter to remove the frontmatter from the markdown content
		const parsed = matter(mdcontent);
		const contentWithoutFrontmatter = parsed.content;
		console.log("Clean content:", contentWithoutFrontmatter);

		// Insert or update a record in the pagetable using the clean content
		const result = await db.insert(pagetable)
			.values({
				virtualPath: virtual_path,
				localPath: local_path,
				mdContent: contentWithoutFrontmatter,
				metadata: JSON.stringify(metadata)
			})
			.onConflictDoUpdate({
				target: [pagetable.virtualPath],
				set: {
					localPath: local_path,
					mdContent: contentWithoutFrontmatter,
					metadata: JSON.stringify(metadata)
				}
			})
			.run();

		return new Response(
			JSON.stringify({ success: true, id: result.lastInsertRowid }),
			{ status: 200 }
		);
	} catch (error: any) {
		console.error("Error in upload endpoint:", error);
		return new Response(
			JSON.stringify({ success: false, error: error.message }),
			{ status: 500 }
		);
	}
};
