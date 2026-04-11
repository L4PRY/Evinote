<script lang="ts">
	import { page } from '$app/state';
	import ThemeToggler from '$lib/components/frontend/ThemeToggler.svelte';

	const links = [
		{ href: '/dashboard/settings', label: 'Account' },
		{ href: '/dashboard/settings/sessions', label: 'Sessions' }
	];
</script>

<nav class="settings-nav">
	<div class="nav-links">
		{#each links as link}
			<a href={link.href} class="nav-link" class:active={page.url.pathname === link.href}>
				{link.label}
			</a>
		{/each}
	</div>

	<ThemeToggler />
</nav>

<style>
	.settings-nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid var(--button-stroke-color);
		padding-bottom: 0.5rem;
	}

	.nav-links {
		display: flex;
		gap: 16px;
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

	@media (max-width: 600px) {
		.settings-nav {
			flex-direction: row;
			gap: 0.5rem;
		}

		.nav-links {
			width: auto;
			gap: 4px;
		}

		.nav-link {
			font-size: 0.95rem;
			padding: 6px 10px;
			flex: 0 1 auto;
		}
	}
</style>
