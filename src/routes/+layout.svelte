<script lang="ts">
	import './layout.css';
	import Navbar from '$lib/components/navigation/Navbar.svelte';
	import Footer from '$lib/components/footer/Footer.svelte';

	export let data: { mode?: 'hidden' | 'fixed' | 'scroll' };
</script>

<div class="layout">
	<Navbar />
	<main>
		<slot />
	</main>
	<Footer mode={data.mode ?? 'fixed'} />
</div>

<style>
	.layout {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	main {
		flex: 1;
		padding-bottom: 90px;
	}
</style>
