<script lang="ts">
	import './layout.css';
	import Navbar from '$lib/components/navigation/Navbar.svelte';
	import Footer from '$lib/components/footer/Footer.svelte';
	import ToastModal from '$lib/components/frontend/ToastModal.svelte';
	import { onNavigate, afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	let { children } = $props();


	const disallowedPaths = ['/dashboard', '/boards', '/auth'];

	// Optional: Derived state for better readability
	const isDisallowed = $derived(
		disallowedPaths.some(path => page.url.pathname.startsWith(path)) &&
		!(page.url.pathname === '/boards/trending' && !page.data.user)
	);
	
	onNavigate(navigation => {
		if (!document.startViewTransition) return;

		return new Promise(resolve => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});

	function applyTheme() {
		if (typeof window === 'undefined') return;
		
		let path = page.url.pathname as string;
		if (path !== '/' && path.endsWith('/')) {
			path = path.slice(0, -1);
		}

		const forcedDarkPaths = (window as any).__forceDark || [];
		const forcedLightPaths = (window as any).__forceLight || [];
		
		if (!page.data.user) {
			document.documentElement.style.colorScheme = 'dark';
			return;
		}

		if (forcedDarkPaths.includes(path)) {
			document.documentElement.style.colorScheme = 'dark';
			return;
		}
		if (forcedLightPaths.includes(path)) {
			document.documentElement.style.colorScheme = 'light';
			return;
		}

		const storedTheme = localStorage.getItem('theme');
		if (storedTheme === 'light' || storedTheme === 'dark') {
			document.documentElement.style.colorScheme = storedTheme;
		} else {
			document.documentElement.style.colorScheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
		}
	}

	onMount(() => {
		applyTheme();

		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const listener = () => {
			if (!localStorage.getItem('theme') || localStorage.getItem('theme') === 'system') {
				applyTheme();
			}
		};
		mediaQuery.addEventListener('change', listener);
		return () => mediaQuery.removeEventListener('change', listener);
	});

	afterNavigate(() => {
		applyTheme();
	});

</script>

<svelte:head></svelte:head>

{#if !isDisallowed && page.status != 404}
	<div class="public-layout">
		<Navbar />
		<main class="main-content">
			{@render children()}
		</main>
		<Footer />
	</div>
{:else}
	{@render children()}
{/if}

<ToastModal />

<style>
	.public-layout {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.main-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}
</style>

