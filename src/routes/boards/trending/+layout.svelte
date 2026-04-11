<script lang="ts">
	import Sidebar from '$lib/components/navigation/DashboardSidebar.svelte';
	let { children, data } = $props();
</script>

<svelte:head>
	<title>Trending Boards | Evinote</title>
</svelte:head>

{#if data.user}
	<aside class="sidebar-wrapper">
		<Sidebar />
	</aside>
{/if}

<main class="trending-layout">
	{@render children()}
</main>

<style>
	.trending-layout {
		min-height: 100vh;
		background-color: transparent;
		display: flex;
		flex-direction: column;
	}

	@media (max-width: 768px) {
		.trending-layout {
			margin-left: 0;
			margin-bottom: 60px;
		}

		.sidebar-wrapper {
			display: none;
		}
	}
</style>
