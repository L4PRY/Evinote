<script lang="ts">
	import type { Board } from '$lib/types/trending/Board';
	import { onDestroy, onMount } from 'svelte';
	import DashboardBox from '../dash/DashboardBox.svelte';
	import { resolve } from '$app/paths';
	import TrendingBox from './TrendingBox.svelte';
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
	{#each boards as board (board.id)}
		<li>
			<TrendingBox
				id={board.id}
				href={resolve(`/boards/${board.id}`)}
				src={`/api/boards/${board.id}/thumb?theme=dark&zoom=0.2`}
				name={board.title}
				likes={board.likes}
			></TrendingBox>
		</li>
	{/each}
	<li bind:this={watcher} class="watcher"></li>
	{#if loading}
		<div class="loader-container">
			<div class="spinner"></div>
			<p>Finding boards...</p>
		</div>
	{/if}
</ul>

<style>
	#trending-list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1.5rem;
		padding: 0 0 5rem 0;
		margin: 1rem 0 0 0;
		list-style: none;
	}

	.watcher {
		height: 1px;
		grid-column: 1 / -1;
	}

	.loader-container {
		grid-column: 1 / -1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 4rem;
		gap: 1rem;
		color: var(--default-text-color-o5);
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid var(--default-stroke-color);
		border-top-color: var(--fancycolor-2);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 600px) {
		#trending-list {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}
	}
</style>

