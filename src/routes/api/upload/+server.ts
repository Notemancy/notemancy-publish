// src/routes/api/upload/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { pagetable } from '$lib/server/db/schema';

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Parse the incoming JSON payload
		const payload = await request.json();
		console.log("Received upload payload:", payload);

		// Use the snake_case keys as sent from the client
		const { virtual_path, local_path, mdcontent, metadata } = payload;
		console.log("virtual_path:", virtual_path);
		console.log("local_path:", local_path);

		// Insert a new record into the pagetable.
		// If a record with the same virtualPath exists, update it instead.
		const result = db.insert(pagetable)
			.values({
				virtualPath: virtual_path,
				localPath: local_path,
				mdContent: mdcontent,
				metadata: JSON.stringify(metadata)
			})
			.onConflictDoUpdate({
				target: [pagetable.virtualPath],
				set: {
					localPath: local_path,
					mdContent: mdcontent,
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
