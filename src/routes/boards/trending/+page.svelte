<script lang="ts">
	import TrendingList from '$lib/components/trending/TrendingList.svelte';
	import type { Board } from '$lib/types/trending/Board';
	import type { Filter } from '$lib/types/trending/Filter';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import DashboardTab from '$lib/components/dash/DashboardTab.svelte';
	import LucideSymbol from '$lib/components/frontend/LucideSymbol.svelte';
	import backgroundImage from '$lib/assets/evi_bg.png';

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
	let abortController: AbortController | null = null;
	const increment = 5;

	async function addBoards(amount: number) {
		if (loading) return;
		loading = true;

		const currentOffset = offset;
		const signal = abortController?.signal;

		try {
			const req = await fetch(
				`/api/boards/trending/${filterType}/${filterTimeframe}?limit=${amount}&offset=${currentOffset}`,
				{ signal }
			);

			const data = await req.json();

			if (req.ok && Array.isArray(data)) {
				// Safety check for duplicates
				const newBoards = data.filter((nb) => !boards.some((b) => b.id === nb.id));
				boards = [...boards, ...newBoards];
				offset += data.length;
			} else {
				console.error('Failed to fetch boards:', data);
			}
		} catch (e: any) {
			if (e.name !== 'AbortError') {
				console.error('Fetch error:', e);
			}
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		// Initial data handled by the $effect below
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

		// Cancel previous requests on filter change
		if (abortController) abortController.abort();
		abortController = new AbortController();

		// schedule reload
		queueMicrotask(() => {
			addBoards(limit);
		});

		return () => {
			if (abortController) abortController.abort();
		};
	});
</script>

{#if !data.user}
	<div class="background" style="background-image: url({backgroundImage});"></div>
{/if}

<div class="site-content" class:has-sidebar={data.user}>
	{#if data.user}
		<DashboardTab>Trending Boards</DashboardTab>
	{:else}
		<h1 class="page-title">Trending Boards</h1>
	{/if}

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
		max-width: 1200px;
		width: 100%;
		margin: 0 auto;
		box-sizing: border-box;
		transition: all 0.3s ease;
	}

	.site-content.has-sidebar {
		margin-left: 150px;
		max-width: calc(100% - 150px);
	}

	.site-content:not(.has-sidebar) {
		align-items: center;
	}

	.page-title {
		font-size: 3.2rem;
		font-weight: 700;
		margin: 2.5rem 0 3.5rem 0;
		color: white;
		letter-spacing: -0.03em;
		text-align: center;
		text-shadow: 2px 2px 10px rgba(0, 0, 0, 0.5);
	}

	.background {
		width: 100%;
		height: 100vh;
		position: fixed;
		background-size: cover;
		background-position: top;
		filter: brightness(0.6);
		top: 0;
		left: 0;
		margin: 0;
		z-index: -1;
	}

	.controls-bar {
		margin-bottom: 3rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
		flex-wrap: wrap;
		width: 100%;
	}

	.site-content.has-sidebar .controls-bar {
		justify-content: space-between;
	}

	.site-content.has-sidebar .page-title {
		text-align: left;
		font-size: 1.5rem; /* Match DashboardTab size if needed, but it's hidden anyway */
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
		font-size: 0.95rem;
		color: var(--default-text-color-o6);
		font-weight: 500;
		letter-spacing: 0.01em;
	}

	.site-content:not(.has-sidebar) .select-group label {
		color: rgba(255, 255, 255, 0.8);
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
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

	.site-content:not(.has-sidebar) .custom-select select {
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 255, 255, 0.2);
		color: white;
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
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
			padding-top: 4rem; /* Accounts for the 50px fixed top bar */
			margin-top: 2rem;
		}

		.site-content.has-sidebar {
			margin-left: 0;
			max-width: 100%;
			margin-top: 0;
		}

		.page-title {
			font-size: 2.2rem;
			margin-bottom: 2rem;
		}
		
		.controls-bar {
			margin-bottom: 2rem;
		}

		.filter-controls {
			flex-direction: column;
			width: 100%;
			gap: 1.25rem;
		}

		.select-group {
			width: 100%;
			flex-direction: column;
			align-items: center;
			gap: 0.5rem;
		}

		.select-group label {
			font-size: 0.85rem;
			opacity: 0.8;
		}

		.custom-select {
			width: 100%;
			max-width: 300px;
		}

		.custom-select select {
			width: 100%;
			padding: 0.75rem 2.5rem 0.75rem 1rem;
			text-align: center;
			font-size: 1rem;
		}
	}
</style>

