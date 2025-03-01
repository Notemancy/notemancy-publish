<script lang="ts">
	// Import SvelteKit stores, lifecycle hooks, and Svelte 5 runes.
	import { onMount, onDestroy, tick } from 'svelte';
	import { page } from '$app/stores';
	import Logo from './lib/Logo.svelte';
	import Logo2 from './lib/Logo2.svelte';
	import { slide } from 'svelte/transition';

	import min_dark from 'shiki/themes/min-dark.mjs';
	import min_light from 'shiki/themes/min-light.mjs';
	import { getCartaInstance } from './lib/carta-instance';

	// Import Carta components and plugins.
	import { Carta, Markdown, MarkdownEditor, type Plugin } from 'carta-md';
	import { math } from '@cartamd/plugin-math';
	import { anchor } from '@cartamd/plugin-anchor';
	import { code } from '@cartamd/plugin-code';
	import DOMPurify from 'isomorphic-dompurify';

	// Import your CSS and any other assets.
	import './tw.css';
	import ToC from './lib/Toc.svelte';
	import ConnectedNotes from './lib/ConnectedNotes.svelte';
	import rehypeCallouts from 'rehype-callouts';
	import 'rehype-callouts/theme/vitepress';
	import rehypeMermaid from 'rehype-mermaid';
	import cartawiki from './lib/cartawiki';
	import CommandPalette from './lib/CommandPalette.svelte';
	import FileTree from './lib/FileTree.svelte';
	import Icon from '@iconify/svelte';

	// ─────────────────────────────
	// Server-Loaded Data
	// ─────────────────────────────
	// Receive incoming props using $props.
	let { data } = $props();
	// Ensure md is always defined (fall back to empty string if undefined)
	let md = $state(data.mdcontent);
	let metadata = $state(data.metadata);

	$effect(() => {
		md = data.mdcontent;
		metadata = data.metadata;
	});

	$inspect(metadata);
	// $inspect(md);
	// ─────────────────────────────
	// Current Virtual Path
	// ─────────────────────────────
	let currentVirtualPath = $state('');
	/*onMount(() => {
		const unsubscribe = page.subscribe(($page) => {
			const path = $page.params.path || 'home.md';
			currentVirtualPath = decodeURIComponent(path);
		});
		return unsubscribe;
	});*/

	$effect(() => {
		// Reading $page makes this effect depend on its value.
		const path = $page.params.path || 'home.md';
		currentVirtualPath = decodeURIComponent(path);
	});

	/*──────────────────────────────
    Dark Mode Toggling & Sidebar
  ──────────────────────────────*/
	// Initialize the theme; default to 'light'
	let currentTheme: 'dark' | 'light' = $state('light');

	// Set up the initial theme on mount (using localStorage if available)
	onMount(() => {
		const storedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
		if (storedTheme === 'dark' || storedTheme === 'light') {
			currentTheme = storedTheme;
		}
		applyTheme(currentTheme);
	});

	// A helper function to update the document class and persist the setting
	function applyTheme(theme: 'dark' | 'light') {
		if (theme === 'dark') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
		localStorage.setItem('theme', theme);
	}

	// Toggle the theme and reinitialize Carta
	function toggleTheme() {
		currentTheme = currentTheme === 'light' ? 'dark' : 'light';
		applyTheme(currentTheme);
		// Reinitialize Carta with the updated theme.
		carta = getCartaInstance(currentTheme, true);
	}

	// Dummy implementation for initializeCarta, remove or replace with your real function.
	function initializeCarta() {
		console.log('Carta reinitialized with', currentTheme, 'theme');
	}

	let sidebarOpen = $state(true);
	let sidebarWidth = $state('');
	let toggleAlignment = $state('');
	$effect(() => {
		sidebarWidth = sidebarOpen ? '16rem' : '3rem';
	});
	$effect(() => {
		toggleAlignment = sidebarOpen ? 'justify-between' : 'justify-center';
	});

	// ─────────────────────────────
	// TOC Extraction (if needed)
	// ─────────────────────────────
	let headings: { id: string; text: string; level: number }[] = $state([]);
	let observer: IntersectionObserver | null = null;
	let activeHeading = $state('');

	$effect(async () => {
		md;
		if (isEditing) return;
		await tick();
		const mdElement = document.getElementById('mdcontent');
		if (mdElement) {
			if (observer) observer.disconnect();
			const headingElements = Array.from(mdElement.querySelectorAll('h1, h2, h3, h4, h5, h6'));
			headings = headingElements.map((h) => ({
				id: h.id,
				text: h.textContent || '',
				level: Number(h.tagName.substring(1))
			}));
			observer = new IntersectionObserver(
				(entries) => {
					const visibleEntry = entries.find((entry) => entry.isIntersecting);
					if (visibleEntry) {
						activeHeading = visibleEntry.target.id;
					}
				},
				{ root: null, rootMargin: '0px 0px -80% 0px', threshold: 0.1 }
			);
			headingElements.forEach((el) => observer.observe(el));
		}
	});
	onDestroy(() => {
		if (observer) observer.disconnect();
	});

	// ─────────────────────────────
	// Carta Editor Initialization
	// ─────────────────────────────
	let editorTheme = min_light;
	let carta = $state(getCartaInstance('light'));

	let isEditing = $state(false);
	let showCommandPalette = $state(false);

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape' && showCommandPalette) {
			closeCommandPalette();
			event.preventDefault();
			return;
		}
		if (event.ctrlKey && event.key.toLowerCase() === 'l') {
			isEditing = !isEditing;
			event.preventDefault();
		} else if (event.ctrlKey && event.key.toLowerCase() === 'k') {
			showCommandPalette = true;
			event.preventDefault();
		}
	}
	function closeCommandPalette() {
		showCommandPalette = false;
	}
	onMount(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('keydown', handleKeyDown);
		}
	});
	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('keydown', handleKeyDown);
		}
	});

	let isLargeScreen = $state(false);

	// Check the screen size on mount and update on changes.
	onMount(() => {
		const mediaQuery = window.matchMedia('(min-width: 1024px)');
		isLargeScreen = mediaQuery.matches;
		mediaQuery.addEventListener('change', (e) => {
			isLargeScreen = e.matches;
		});
	});

	let currentMobileView = $state('content');
	let contentContainer;

	// Scroll smoothly to the top
	function scrollToTop() {
		if (contentContainer) {
			contentContainer.scrollTo({ top: 0, behavior: 'smooth' });
		} else {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}

	let activeIndex = $state(1);

	$effect(() => {
		activeIndex = currentMobileView === 'sidebar' ? 0 : currentMobileView === 'content' ? 1 : 2;
	});
</script>

{#if isLargeScreen}
	<!-- Desktop Layout -->
	<div class="relative min-h-screen bg-white p-4 pt-4 lg:p-8 lg:pt-5 dark:bg-gray-800">
		<!-- Left Sidebar (Desktop only) -->
		<div class="fixed top-4 right-4 z-50">
			<button onclick={toggleTheme}>
				{#if currentTheme === 'dark'}
					<Icon
						icon="tabler:sun-filled"
						width="20"
						height="20"
						class="text-gray-100 transition-all duration-300"
					/>
				{:else}
					<Icon
						icon="ph:moon-fill"
						width="18"
						height="18"
						class="text-gray-700 transition-all duration-300"
					/>
				{/if}
			</button>
		</div>
		<div
			class="fixed top-4 left-0 hidden overflow-hidden transition-all duration-100 lg:block dark:bg-gray-800"
			style="width: {sidebarWidth}; height: calc(100vh - 1rem);"
		>
			<div class="flex items-center px-2 {toggleAlignment} mb-4">
				{#if sidebarOpen}
					<div class="font-[Megrim] text-2xl font-semibold dark:text-gray-100">NOTEMANCY</div>
				{/if}
				<button onclick={() => (sidebarOpen = !sidebarOpen)} class="ml-auto flex items-center">
					<Icon
						icon="ph:dots-nine-fill"
						width="32"
						height="32"
						class="transition-all duration-300 dark:text-gray-50"
						style="transform: rotate({sidebarOpen ? '0deg' : '180deg'});"
					/>
				</button>
			</div>
			{#if sidebarOpen}
				<div class="overflow-y-auto" style="height: calc(100vh - 1rem - 3rem);">
					<FileTree />
				</div>
			{/if}
		</div>

		<!-- Main Content Area -->
		<div
			class="pt-0 pl-0 transition-all duration-300 lg:pl-8"
			style="margin-left: {sidebarOpen ? sidebarWidth : '0'}"
		>
			{#if showCommandPalette}
				<!-- Command Palette Overlay -->
				<div
					class="fixed inset-0 z-50 flex items-center justify-center bg-gray-400/60 backdrop-blur-sm dark:bg-gray-600/60"
					onclick={closeCommandPalette}
				>
					<div class="rounded-xl p-0 shadow-lg">
						<CommandPalette onclick={closeCommandPalette} />
					</div>
				</div>
			{/if}

			<!-- Markdown Content Container -->
			<div class="mt-0 max-w-[700px] pt-0">
				<div class="mt-0 mb-4 border-b border-gray-300 pt-0 pb-3.5 text-[1.8rem] font-normal">
					<div class="mt-0 pt-0 text-gray-800 dark:text-gray-50">
						{metadata.title || 'Notemancy'}
					</div>
				</div>

				{#if isEditing}
					<div class="prose prose-sm dark:prose-invert max-w-[700px]">
						{#key currentTheme}
							<MarkdownEditor {carta} bind:value={md} disableToolbar={true} theme="tw" />
						{/key}
					</div>
				{:else}
					<div
						id="mdcontent"
						class="prose dark:prose-invert max-w-[700px] font-[Noto_Sans] font-normal"
					>
						{#key currentTheme}
							{#key md}
								<Markdown {carta} value={md} />
							{/key}
						{/key}
					</div>
				{/if}
			</div>
		</div>

		<!-- Right TOC (Desktop only) -->
		<div class="fixed top-5 right-5 hidden w-[300px] justify-start lg:flex">
			<ToC {headings} {activeHeading} />
		</div>

		<!-- Connected Notes (Desktop only) -->
		<div class="hidden lg:block">
			<ConnectedNotes virtualPath={currentVirtualPath} />
		</div>
	</div>
{:else}
	<!-- Mobile Layout: One view at a time, with the menubar always visible -->
	<div class="relative bg-white dark:bg-gray-800" style="height: calc(100vh - 3rem);">
		{#if currentMobileView === 'sidebar'}
			<div
				class="h-full overflow-y-auto p-4"
				in:slide={{ duration: 100 }}
				out:slide={{ duration: 100 }}
			>
				<!-- Replace logo with NOTEMANCY text in Megrim font -->
				<div class="mb-4 flex h-14 w-full items-center justify-center font-[Megrim] text-2xl">
					NOTEMANCY
				</div>
				<FileTree />
			</div>
		{:else if currentMobileView === 'content'}
			<div
				class="h-full overflow-y-auto p-4"
				bind:this={contentContainer}
				in:slide={{ duration: 100 }}
				out:slide={{ duration: 100 }}
			>
				{#if showCommandPalette}
					<div
						class="fixed inset-0 z-50 flex items-center justify-center bg-gray-400/60 backdrop-blur-sm dark:bg-gray-600/60"
						onclick={closeCommandPalette}
					>
						<div class="rounded-xl p-0 shadow-lg">
							<CommandPalette onclick={closeCommandPalette} />
						</div>
					</div>
				{/if}
				<div class="mx-auto mt-0 max-w-[700px] pt-0">
					<div class="mt-0 mb-4 border-b border-gray-300 pt-0 pb-3.5 text-[1.8rem] font-normal">
						<div class="mt-0 pt-0 text-gray-800 dark:text-gray-50">
							{metadata.title || 'Notemancy'}
						</div>
					</div>

					{#if isEditing}
						<div class="prose prose-sm dark:prose-invert max-w-[700px]">
							{#key currentTheme}
								<MarkdownEditor {carta} bind:value={md} disableToolbar={true} theme="tw" />
							{/key}
						</div>
					{:else}
						<div id="mdcontent" class="prose dark:prose-invert max-w-[700px] font-[Noto_Sans]">
							{#key currentTheme}
								{#key md}
									<Markdown {carta} value={md} />
								{/key}
							{/key}
						</div>
					{/if}
				</div>
			</div>
		{:else if currentMobileView === 'toc'}
			<div
				class="h-full overflow-y-auto p-4"
				in:slide={{ duration: 100 }}
				out:slide={{ duration: 100 }}
			>
				<ToC {headings} {activeHeading} />
				<ConnectedNotes virtualPath={currentVirtualPath} />
			</div>
		{/if}
	</div>
{/if}

<!-- Mobile Menubar (always visible on mobile) -->
{#if !isLargeScreen}
	<div class="fixed right-0 bottom-0 left-0 flex h-14 items-center justify-between bg-gray-700 p-3">
		<!-- Scroll-to-Top Button -->
		<button onclick={scrollToTop} class="mx-2">
			<Icon icon="oui:sort-up" width="22" height="22" class="text-yellow-200" />
		</button>
		<!-- Toggle Buttons Group -->
		<div class="relative flex w-65 justify-between">
			<!-- Sliding indicator (positioned based on activeIndex) -->
			<div
				class="absolute top-0 flex h-full w-1/3 items-center justify-center transition-all duration-300"
				style="left: {activeIndex * 33.33}%;"
			>
				<Icon icon="garden:dash-fill-12" width="46" height="46" class="text-yellow-200" />
			</div>
			<!-- Sidebar Toggle -->
			<button
				onclick={() => (currentMobileView = 'sidebar')}
				class="relative z-10 flex w-1/3 justify-center"
			>
				<Icon icon="mdi:dot" width="42" height="42" class="text-yellow-200" />
			</button>
			<!-- Content Toggle -->
			<button
				onclick={() => (currentMobileView = 'content')}
				class="relative z-10 flex w-1/3 justify-center"
			>
				<Icon icon="mdi:dot" width="42" height="42" class="text-yellow-200" />
			</button>
			<!-- TOC Toggle -->
			<button
				onclick={() => (currentMobileView = 'toc')}
				class="relative z-10 flex w-1/3 justify-center"
			>
				<Icon icon="mdi:dot" width="42" height="42" class="text-yellow-200" />
			</button>
		</div>
		<!-- Theme Toggle Button -->
		<button onclick={toggleTheme} class="mx-2">
			{#if currentTheme === 'dark'}
				<Icon
					icon="tabler:sun-filled"
					width="20"
					height="20"
					class="text-yellow-200 transition-all duration-300"
				/>
			{:else}
				<Icon
					icon="ph:moon-fill"
					width="18"
					height="18"
					class="m-0.5 text-yellow-200 transition-all duration-300"
				/>
			{/if}
		</button>
	</div>
{/if}

<!-- (Optional) Global styles for markdown, etc. -->
<style>
	:global(blockquote cite::before) {
		content: '— ';
	}
	:global(img) {
		border-radius: 6px;
	}
	:global([id^='mermaid-']) {
		width: 60vw;
		max-width: 80vw;
		position: relative;
	}
</style>
