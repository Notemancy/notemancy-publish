<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { createLinkPreview, melt } from '@melt-ui/svelte';
	import { Slot } from '@cartamd/plugin-component/svelte';
	import min_dark from 'shiki/themes/min-dark.mjs';
	import min_light from 'shiki/themes/min-light.mjs';
	import { Carta, Markdown, type Plugin } from 'carta-md';
	import { getCartaInstance } from '../carta-instance';

	import everforest_dark from 'shiki/themes/everforest-dark.mjs';

	// These props are passed in from Carta’s component mapping.
	let { href, children } = $props();

	// Create a new Carta instance with your plugins.
	/*const carta = new Carta({
		extensions: [
			cartawiki,
			math(),
			callouts,
			mermaid,
			anchor(),
			code({
				langs: ['javascript', 'docker', 'py', 'markdown', 'yaml', 'toml', 'bash']
			})
		],
		sanitizer: DOMPurify.sanitize
	});*/
	let currentTheme: 'dark' | 'light' = $state('light');

	const carta = getCartaInstance(currentTheme);

	// Remove a leading slash if present.
	const normalizedHref = href.startsWith('/') ? href.slice(1) : href;

	// A promise that resolves to the markdown content.
	let contentPromise: Promise<string>;

	// Replace Tauri's get_page_content with a fetch to our backend API.
	async function getContent(mdpath: string): Promise<string> {
		try {
			// Call the API endpoint with the virtual_path query parameter.
			const response = await fetch(`/api/files/raw?virtual_path=${encodeURIComponent(mdpath)}`);
			if (!response.ok) {
				throw new Error('Failed to fetch preview content');
			}
			const data = await response.json();
			if (!data || typeof data !== 'object' || !('content' in data)) {
				throw new Error('Invalid response format');
			}
			return data.content || '';
		} catch (error) {
			console.error('Error fetching preview content:', error);
			throw error;
		}
	}

	// On mount, begin fetching the preview content using the normalized href.
	onMount(() => {
		contentPromise = getContent(normalizedHref);
	});

	// Set up Melt‑UI's link preview.
	const {
		elements: { trigger, content },
		states: { open }
	} = createLinkPreview();
</script>

<!-- The trigger link -->
<a
	{href}
	rel="noopener noreferrer"
	use:melt={$trigger}
	class="rounded-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-black"
>
	<Slot />
</a>

{#if $open}
	<!-- The preview container is fixed to 500x500 and scrollable -->
	<div
		use:melt={$content}
		transition:fly={{ duration: 150, y: -8 }}
		class="border-muted shadow-popover mt-2 h-[500px] w-[500px] overflow-auto rounded-xl border bg-white p-4 dark:border-gray-300 dark:bg-gray-700"
	>
		<div
			class="prose lg:prose-base dark:prose-invert mt-0 h-full w-full pt-0 font-[Noto_Sans] font-normal"
		>
			<div class="mt-0 mb-4 border-b border-gray-300 pt-0 pb-3.5 text-[1.5rem] font-normal">
				<a
					class="mt-0 pt-0 text-gray-800 hover:text-blue-600 dark:text-gray-50 dark:hover:text-blue-500"
					href="/"
				>
					Gnosis
				</a>
			</div>
			<div id="mdcontent" class="h-full w-full">
				{#await contentPromise}
					<p>Loading preview...</p>
				{:then content}
					{#key content}
						<Markdown {carta} value={content} />
					{/key}
				{:catch error}
					<p>Error loading preview: {error.message}</p>
				{/await}
			</div>
		</div>
	</div>
{/if}
