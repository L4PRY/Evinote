<script lang="ts">
	import { page } from '$app/state';
	
	const links = [
		{ href: '/dashboard/settings', label: 'Account' },
		{ href: '/dashboard/settings/sessions', label: 'Sessions' }
	];
</script>

<nav class="settings-nav">
	{#each links as link}
		<a 
			href={link.href} 
			class="nav-link" 
			class:active={page.url.pathname === link.href}
		>
			{link.label}
		</a>
	{/each}
</nav>

<style>
	.settings-nav {
		display: flex;
		gap: 16px;
		border-bottom: 1px solid var(--button-stroke-color);
		padding-bottom: 0.5rem;
	}

	.nav-link {
		color: var(--default-text-color);
		text-decoration: none;
		font-weight: 500;
		font-size: 1.5rem;
		padding: 8px 16px;
		border-radius: 8px;
		opacity: 0.6;
		transition: all 0.2s ease;        
	}

	.nav-link:hover {
		opacity: 0.8;
		background-color: var(--default-blur-color);
	}

	.nav-link.active {
		opacity: 1;
		font-weight: 600;
		background-color: var(--default-stroke-color);
	}
</style>
