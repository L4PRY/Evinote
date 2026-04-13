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
		padding: 2rem;
		margin-left: 150px;
		padding-top: 2rem;
		padding-bottom: 3rem;
		display: flex;
		flex-direction: column;
	}

	@media (max-width: 600px) {
		.nav, .site-content {
			margin-left: 0;
		}
		.nav {
			padding-top: 4rem; /* Accounts for the 50px fixed top bar */
		}
	}
</style>
