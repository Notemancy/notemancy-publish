<script lang="ts">
	import { onMount } from 'svelte';
	import { createTreeView } from '@melt-ui/svelte';
	import { setContext } from 'svelte';
	import Tree, { type TreeItem } from './Tree.svelte';

	let treeItems: TreeItem[] = [];

	// Fetch the tree data from the API endpoint.
	async function fetchTree() {
		const res = await fetch('/api/tree');
		if (res.ok) {
			treeItems = await res.json();
		} else {
			console.error('Failed to fetch file tree');
		}
	}

	onMount(() => {
		fetchTree();
	});

	// Create the tree view context.
	const ctx = createTreeView({ defaultExpanded: [] });
	setContext('tree', ctx);
	const {
		elements: { tree }
	} = ctx;
</script>

<!-- The tree spans the full height and scrolls internally -->
<ul class="h-full overflow-y-auto" {...$tree}>
	<Tree {treeItems} />
</ul>
