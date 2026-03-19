<script lang="ts">
	import Sidebar from '$lib/components/navigation/DashboardSidebar.svelte';

	import { page } from '$app/state';
	let { children } = $props();
</script>

<svelte:head></svelte:head>
<Sidebar />
{@render children()}

<style>

</style>
