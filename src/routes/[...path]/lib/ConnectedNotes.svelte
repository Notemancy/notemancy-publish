<script lang="ts">
	import { onMount } from 'svelte';

	// Receive props using $props.
	let { virtualPath } = $props();

	// Initialize reactive state.
	let referencingNotes: string[] = $state([]);
	let loading = $state(true);
	let error: string | null = $state(null);

	$effect(async () => {
		console.log('From comp', virtualPath);
		try {
			const response = await fetch(
				`/api/files/connected?virtual_path=${encodeURIComponent(virtualPath)}`
			);
			// Parse the response.
			const result = await response.json();
			// If result is an array, use it directly; otherwise check for a property.
			referencingNotes = Array.isArray(result) ? result : result.connectedNotes || [];
		} catch (e: any) {
			error = e.message || 'Error fetching referencing notes';
		} finally {
			loading = false;
		}
	});

	// Extract the filename from the virtual path, removing the ".md" extension.
	function getTitle(path: string): string {
		const segments = path.split('/');
		let filename = segments[segments.length - 1];
		if (filename.endsWith('.md')) {
			filename = filename.slice(0, -3);
		}
		return filename;
	}
</script>

<div
	class="prose prose-sm fixed right-5 bottom-16 z-50 ml-0 w-[300px] rounded pl-0 lg:bottom-8 dark:invert"
>
	<h3 class="mb-2 font-semibold">Connected Notes</h3>
	{#if loading}
		<p>Loading...</p>
	{:else if error}
		<p class="text-red-500">{error}</p>
	{:else if referencingNotes.length === 0}
		<p>No connected notes found.</p>
	{:else}
		<ul class="m-0 list-none p-0">
			{#each referencingNotes as note}
				<li class="mb-1">
					<a href="/{note}" class="text-blue-600 hover:underline">
						{getTitle(note)}
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>
