<script lang="ts">
	import TrendingList from '$lib/components/trending/TrendingList.svelte';
	import type { Board } from '$lib/types/trending/Board';
	import type { Filter } from '$lib/types/trending/Filter';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import DashboardTab from '$lib/components/dash/DashboardTab.svelte';
	import LucideSymbol from '$lib/components/frontend/LucideSymbol.svelte';

	let { data } = $props();

	const params = new URLSearchParams(page.url.searchParams);

	// get filters from query params, or default to 'updated' and 'day'
	const filter = (params.get('filter') || 'updated') as Filter['type'];
	const timeframe = (params.get('timeframe') || 'day') as Filter['timeframe'];

	let boards = $state<Board[]>([]);
	let filterType = $state<Filter['type']>(filter);
	let filterTimeframe = $state<Filter['timeframe']>(timeframe);
	let limit = $state(20);
	let offset = $state(0);
	let expected = $state(0);
	let loading = $state(false);
	const increment = 5;

	async function addBoards(amount: number) {
		loading = true;
		offset += amount;
		expected += amount;

		const req = await fetch(
			`/api/boards/trending/${filterType}/${filterTimeframe}?limit=${amount}&offset=${offset}`
		);

		const data = await req.json();

		if (req.ok && Array.isArray(data)) boards = [...boards, ...data];
		else {
			console.error('Failed to fetch boards:', data);
			expected -= amount;
		}
		loading = false;
	}

	onMount(() => {
		addBoards(limit);
	});

	$effect(() => {
		// dependency on both filters triggers this
		filterType;
		filterTimeframe;

		const newUrl = new URL(page.url);
		newUrl.searchParams.set('filter', filterType);
		newUrl.searchParams.set('timeframe', filterTimeframe);
		window.history.replaceState({}, '', newUrl);

		// reset state
		boards = [];
		offset = 0;
		expected = 0;

		// schedule reload
		queueMicrotask(() => {
			addBoards(limit);
		});
	});
</script>

<div class="site-content" class:has-sidebar={data.user}>
	<DashboardTab>Trending Boards</DashboardTab>

	<div class="controls-bar">
		<div class="filter-controls">
			<div class="select-group">
				<label for="type-select">Show me</label>
				<div class="custom-select">
					<select id="type-select" bind:value={filterType}>
						<option value="likes">Most popular</option>
						<option value="updated">Newest updates</option>
					</select>
					<LucideSymbol symbol="ChevronDown" size={14} />
				</div>
			</div>

			<div class="select-group">
				<label for="timeframe-select">from the past</label>
				<div class="custom-select">
					<select id="timeframe-select" bind:value={filterTimeframe}>
						<option value="hour">Hour</option>
						<option value="day">Day</option>
						<option value="week">Week</option>
						<option value="month">Month</option>
						<option value="year">Year</option>
						<option value="all">All Time</option>
					</select>
					<LucideSymbol symbol="ChevronDown" size={14} />
				</div>
			</div>
		</div>
	</div>

	<TrendingList {boards} {loading} requestMore={() => addBoards(increment)} />
</div>

<style>
	.site-content {
		padding: 2rem;
		flex: 1;
		display: flex;
		flex-direction: column;
		max-width: 100%;
		width: 100%;
		box-sizing: border-box;
		transition: margin-left 0.3s ease;
	}

	.site-content.has-sidebar {
		margin-left: 150px;
	}

	.controls-bar {
		margin-bottom: 3rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;
		flex-wrap: wrap;
	}

	.filter-controls {
		display: flex;
		gap: 1.5rem;
		align-items: center;
	}

	.select-group {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.select-group label {
		font-size: 0.9rem;
		color: var(--default-text-color-o5);
		font-weight: 500;
	}

	.custom-select {
		position: relative;
		display: flex;
		align-items: center;
	}

	.custom-select select {
		appearance: none;
		background: var(--default-bg-color-transparent);
		border: 1px solid var(--default-stroke-color);
		border-radius: 8px;
		padding: 0.5rem 2rem 0.5rem 0.75rem;
		color: var(--default-text-color);
		font-family: inherit;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.custom-select select:hover {
		background: var(--default-blur-hover-color);
		border-color: var(--default-text-color-o5);
	}

	.custom-select :global(svg) {
		position: absolute;
		right: 0.75rem;
		pointer-events: none;
		opacity: 0.5;
	}

	@media (max-width: 600px) {
		.site-content {
			padding: 1rem;
		}
		
		.filter-controls {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}
	}
</style>

