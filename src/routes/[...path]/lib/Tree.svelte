<script lang="ts">
	// Import runes and helpers from Svelte 5.
	import { getContext } from 'svelte';
	import Icon from '@iconify/svelte';
	import { melt, type TreeView } from '@melt-ui/svelte';

	// Define the type for a tree item.
	export type TreeItem = {
		title: string;
		link?: string;
		children?: TreeItem[];
	};

	// Get props via $props.
	let { treeItems = [] as TreeItem[], level = 1 } = $props();

	// Get the tree view context from Melt UI.
	const {
		elements: { item, group },
		helpers: { isExpanded, isSelected }
	} = getContext<TreeView>('tree');

	// Create reactive state for grouping folders and files.
	let folders = $state([] as TreeItem[]);
	let files = $state([] as TreeItem[]);
	$effect(() => {
		folders = treeItems.filter((t) => t.children && t.children.length > 0);
		files = treeItems.filter((t) => !t.children || t.children.length === 0);
	});
</script>

{#each folders as treeItem, i (treeItem.title + i)}
	{@const itemId = `${treeItem.title}-${i}`}
	<li class={(level !== 1 ? 'pl-4 ' : '') + 'focus:outline-none dark:text-gray-100'}>
		{#if treeItem.link}
			<!-- If a link exists, use an anchor for navigation -->
			<a
				href={'/' + treeItem.link}
				class={'flex w-full items-center gap-2 rounded-md p-2 hover:bg-gray-50 focus:outline-none dark:hover:bg-gray-700 ' +
					($isSelected(itemId) ? 'bg-gray-100 dark:bg-gray-700' : '')}
				use:melt={$item({ id: itemId, hasChildren: true })}
			>
				<Icon
					icon="mynaui:chevron-right-solid"
					class={'h-5 w-5 transition-transform duration-200 ' +
						($isExpanded(itemId) ? 'rotate-90' : '')}
				/>
				<span class="flex-1 text-left font-semibold">{treeItem.title}</span>
			</a>
		{:else}
			<!-- Otherwise use a button that toggles expansion -->
			<button
				class={'flex w-full items-center gap-2 rounded-md p-2 hover:bg-gray-50 focus:outline-none dark:hover:bg-gray-700 ' +
					($isSelected(itemId) ? 'bg-gray-100 dark:bg-gray-700' : '')}
				use:melt={$item({ id: itemId, hasChildren: true })}
			>
				<Icon
					icon="mynaui:chevron-right-solid"
					class={'h-5 w-5 transition-transform duration-200 ' +
						($isExpanded(itemId) ? 'rotate-90' : '')}
				/>
				<span class="flex-1 text-left font-semibold">{treeItem.title}</span>
			</button>
		{/if}
		{#if treeItem.children}
			<ul use:melt={$group({ id: itemId })}>
				<!-- Recursively render the folder's children -->
				<svelte:self treeItems={treeItem.children} level={level + 1} />
			</ul>
		{/if}
	</li>
{/each}

{#each files as treeItem, j (treeItem.title + j)}
	{@const itemId = `${treeItem.title}-${j}`}
	<li class={(level !== 1 ? 'pl-4 ' : '') + 'focus:outline-none dark:text-gray-100'}>
		{#if treeItem.link}
			<a
				href={'/' + treeItem.link}
				class={'flex w-full items-center gap-2 rounded-md p-1 hover:bg-gray-50 focus:outline-none dark:hover:bg-gray-700 ' +
					($isSelected(itemId) ? 'bg-gray-100 dark:bg-gray-700' : '')}
				use:melt={$item({ id: itemId, hasChildren: false })}
			>
				<span class="inline-block h-4 w-4"></span>
				{treeItem.title}
			</a>
		{:else}
			<button
				class={'flex w-full items-center gap-2 rounded-md p-1 hover:bg-gray-50 focus:outline-none dark:hover:bg-gray-700 ' +
					($isSelected(itemId) ? 'bg-gray-200' : '')}
				use:melt={$item({ id: itemId, hasChildren: false })}
			>
				<span class="inline-block h-4 w-4"></span>
				{treeItem.title}
			</button>
		{/if}
	</li>
{/each}
