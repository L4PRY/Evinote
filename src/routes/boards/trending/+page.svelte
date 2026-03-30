<script lang="ts">
	import TrendingList from '$lib/components/trending/TrendingList.svelte';
	import { type Board } from '$lib/types/trending/Board';
	import type { Filter } from '$lib/types/trending/Filter';
	import { onMount } from 'svelte';
	import { type PageProps } from './$types';
	import { page } from '$app/state';

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

		page.url.searchParams.set('filter', filterType);
		page.url.searchParams.set('timeframe', filterTimeframe);

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

<div class="container">
	<select id="timeframe-select" bind:value={filterTimeframe}>
		<option value="day">Day</option>
		<option value="week">Week</option>
		<option value="month">Month</option>
		<option value="year">Year</option>
		<option value="all">All Time</option>
	</select>
	<select id="type-select" bind:value={filterType}>
		<option value="likes">Likes</option>
		<option value="updated">Updated</option>
	</select>

	<TrendingList {boards} {loading} requestMore={() => addBoards(increment)} />
</div>
