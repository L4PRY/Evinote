<script lang="ts">
	import type { Board } from '$lib/types/trending/Board';
	import { onDestroy, onMount } from 'svelte';
	import DashboardBox from '../dash/DashboardBox.svelte';
	import { resolve } from '$app/paths';
	interface Props {
		boards: Board[];
		loading: boolean;
		requestMore: () => void;
	}

	let { boards = $bindable(), loading = $bindable(), requestMore }: Props = $props();

	let watcher: HTMLElement | null = null;
	let observer: IntersectionObserver | null = null;

	onMount(() => {
		if (!watcher) return;
		observer = new IntersectionObserver(
			boards => boards.forEach(b => b.isIntersecting && requestMore()),
			{
				root: null,
				rootMargin: '0px',
				threshold: 1.0
			}
		);

		observer.observe(watcher);
	});

	onDestroy(() => {
		if (observer && watcher) {
			observer.unobserve(watcher);
			observer.disconnect();
		}
	});
</script>

<ul id="trending-list">
	{#each boards as board, id (board.id)}
		<DashboardBox
			href={resolve(`/boards/${board.id}`)}
			src={`/api/boards/${board.id}/thumb?theme=dark&zoom=0.2`}
			name={board.title}
			likes={board.likes}
		></DashboardBox>
	{/each}
	<li bind:this={watcher}></li>
	{#if loading}
		<div class="loader">loadenden</div>
	{/if}
</ul>
