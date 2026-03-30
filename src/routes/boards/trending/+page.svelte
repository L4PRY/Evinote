<script lang="ts">
	import TrendingList from '$lib/components/trending/TrendingList.svelte';
	import { type Board } from '$lib/types/trending/Board';
	import type { Filter } from '$lib/types/trending/Filter';
	import { onMount } from 'svelte';

	let boards = $state<Board[]>([]);
	let filterType = $state<Filter['type']>('likes');
	let filterTimeframe = $state<Filter['timeframe']>('day');
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
</script>

<div class="container">
	<select id="timeframe-select" bind:value={filterTimeframe}>
		<option value="day">Day</option>
		<option value="week">Week</option>
		<option value="month">Month</option>
		<option value="year">Year</option>
	</select>
	<select id="type-select" bind:value={filterType}>
		<option value="likes">Likes</option>
		<option value="updated">Updated</option>
	</select>

	<TrendingList {boards} {loading} requestMore={() => addBoards(increment)} />
</div>
