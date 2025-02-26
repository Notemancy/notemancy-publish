import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { asc } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { pagetable} from '$lib/server/db/schema';

type FileRecord = {
	id: number;
	localPath: string;
	virtualPath: string;
	mdcontent: string;
	metadata: string;
};

export type TreeItem = {
	title: string;
	// For file nodes, the virtualPath is used as a link.
	link?: string;
	// Folder nodes may have nested children.
	children?: TreeItem[];
};

/**
 * GET /api/mdfiles/tree
 *
 * Retrieves all pagetable records, sorts them by virtualPath (alphabetically),
 * and builds a nested file tree.
 */
export const GET: RequestHandler = async () => {
	// Query all pagetable records and order them by virtualPath in ascending order.

  const files = await db.select().from(pagetable).all();

	// Build a nested tree from the flat list of files.
	const tree = buildTree(files);

	return json(tree);
};

/**
 * buildTree
 *
 * Creates a tree structure from a flat list of FileRecord objects.
 * Each file's virtualPath (e.g. "routes/contents/+page.svelte") is split into segments.
 * Folder nodes are created for intermediate segments, and the file node is created at
 * the final segment using the title from the metadata (if available) while attaching the
 * virtualPath as a link.
 */
function buildTree(files: FileRecord[]): TreeItem[] {
	const root: TreeItem[] = [];

	for (const file of files) {
		// Split the virtualPath into segments (ignoring empty strings).
		const parts = file.virtualPath.split('/').filter(Boolean);
		let currentLevel = root;

		parts.forEach((part, index) => {
			// Check if a node for this segment already exists.
			let node = currentLevel.find((item) => item.title === part);

			if (!node) {
				if (index < parts.length - 1) {
					// For intermediate segments, create a folder node.
					node = { title: part, children: [] };
				} else {
					// For the final segment, create a file node.
					let title = part;
					try {
						const meta = JSON.parse(file.metadata);
						if (meta.title) {
							title = meta.title;
						}
					} catch (e) {
						// Fallback to using the file name if metadata parsing fails.
					}
					node = { title, link: file.virtualPath };
				}
				currentLevel.push(node);
			}

			// If there are more segments, move to the children of the current node.
			if (index < parts.length - 1) {
				if (!node.children) {
					node.children = [];
				}
				currentLevel = node.children;
			}
		});
	}

	// Recursively sort the tree by title.
	sortTree(root);
	return root;
}

/**
 * sortTree
 *
 * Recursively sorts the tree nodes alphabetically by their title.
 */
function sortTree(nodes: TreeItem[]) {
	nodes.sort((a, b) => a.title.localeCompare(b.title));
	nodes.forEach((node) => {
		if (node.children) {
			sortTree(node.children);
		}
	});
}

