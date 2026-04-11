<script lang="ts">
	import DashboardTab from '$lib/components/dash/DashboardTab.svelte';
	import DashboardBox from '$lib/components/dash/DashboardBox.svelte';
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';
	import { onMount } from 'svelte';

	let { data } = $props();
	// svelte-ignore state_referenced_locally
	const { boards, user }: PageData = data;

	let theme: 'light' | 'dark' = $state('dark');
	let viewports = $state<Record<string, { left: number; top: number; zoom: number }>>({});

	onMount(async () => {
		document.title = 'Evinote • Shared with me';

		for (const board of boards) {
			const vwp = localStorage.getItem(`board-${board.id}-viewport`);
			viewports[board.id] = vwp
				? JSON.parse(vwp)
				: {
						width: 800,
						height: 600,
						zoom: 1
					};
		}
	});

	$effect(() => {
		if (theme !== 'light' && theme !== 'dark') {
			theme =
				(localStorage.getItem('theme') ?? window.matchMedia('(prefers-color-scheme: dark)').matches)
					? 'dark'
					: 'light';
		}
	});
</script>

<div class="site-content">
	<DashboardTab>Shared with me</DashboardTab>
	
	{#if boards.length === 0}
		<div class="empty-state">
			<p>No boards have been shared with you yet.</p>
		</div>
	{:else}
		<ul class="boards-grid">
			{#each boards as board (board.id)}
				<li>
					<DashboardBox
						href={resolve(`/boards/${board.id}`)}
						src={`/api/boards/${board.id}/thumb?theme=${theme}&zoom=0.2`}
						name={board.name}
						likes={board.likes}
					></DashboardBox>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.site-content {
		padding: 2rem;
		margin-left: 150px;
	}

	.boards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1.5rem;
		list-style: none;
		padding: 0;
		margin: 1rem 0 0 0;
	}

	.boards-grid li {
		display: block;
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: var(--border-radius);
		border: 1px dashed var(--default-stroke-color);
		color: var(--default-text-color);
		opacity: 0.7;
	}
</style>
