<script lang="ts">
	import SettingsNavbar from '$lib/components/navigation/SettingsNavbar.svelte';
	let { children } = $props();
</script>

<div class="nav">
	<SettingsNavbar />
</div>
<div class="site-content">
	{@render children()}
</div>

<style>
	.nav {
		margin-left: 150px;
		padding: 2rem;
		padding-bottom: 0;
	}

	.site-content {
		padding: 3rem;
		margin-left: 150px;
		padding-top: 2rem;
	}
</style>
