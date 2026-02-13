<script lang="ts">
	import './layout.css';
	import Navbar from '$lib/components/navigation/Navbar.svelte';

	let { children } = $props();
</script>

<svelte:head></svelte:head>

<Navbar />

{@render children()}
