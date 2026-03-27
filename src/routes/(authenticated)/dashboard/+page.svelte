<script lang="ts">
	import DashboardTab from '$lib/components/dash/DashboardTab.svelte';
	import DashboardBox from '$lib/components/dash/DashboardBox.svelte';
	import CreateBoardPopup from '$lib/components/dash/CreateBoardPopup.svelte';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';
	import { onMount } from 'svelte';

	let { data } = $props();

	// svelte-ignore state_referenced_locally
	const user = data!.user;
	// svelte-ignore state_referenced_locally
	const boards = data!.boards;

	let createPopup: CreateBoardPopup;
	let theme: 'light' | 'dark' = $state('dark');

	onMount(() => {
		document.title = 'Evinote • Dashboard';
		let darkmode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');

		darkmode.addEventListener('change', e => {
			theme = e.matches ? 'dark' : 'light';
		});
	});
</script>

<CreateBoardPopup bind:this={createPopup} />

<div class="site-content">
	<DashboardTab>Your boards</DashboardTab>
	{#await boards then resolvedBoards}
		{#if resolvedBoards.length === 0}
			<p>You have no boards yet.</p>
			<button class="create-link" onclick={() => createPopup.show()} aria-label="create a new board"
				>create one?</button
			>
		{/if}
		<ul class="boards-grid">
			{#each resolvedBoards as board (board.id)}
				<li>
					<DashboardBox
						href={resolve(`/boards/${board.id}`)}
						src={`/api/boards/${board.id}/thumb?theme=${theme}`}
						name={board.name}
					></DashboardBox>
				</li>
			{/each}
			<DashboardBox type="createNew" onclick={() => createPopup.show()}></DashboardBox>
		</ul>
	{/await}
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

	.create-link {
		background: none;
		border: none;
		color: #3182ce;
		text-decoration: underline;
		cursor: pointer;
		padding: 0;
		font-family: inherit;
		font-size: 1rem;
	}

	.create-link:hover {
		color: #2b6cb0;
	}
</style>
