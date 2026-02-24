<script lang="ts">
	import './layout.css';
	import Navbar from '$lib/components/navigation/Navbar.svelte';
	import Footer from '$lib/components/footer/Footer.svelte';

	import { page } from '$app/state';
	let { children } = $props();

	const disallowedPaths = ['/dashboard', '/boards'];

	// Optional: Derived state for better readability
	const isDisallowed = $derived(
		disallowedPaths.some(path => page.url.pathname.startsWith(path))
	);
</script>

<svelte:head></svelte:head>

{#if !isDisallowed}
	<Navbar />
	<Footer />
{/if}

{@render children()}
