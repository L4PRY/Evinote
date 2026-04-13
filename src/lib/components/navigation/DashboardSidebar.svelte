<script lang="ts">
	import DashboardButton from './DashboardButton.svelte';
	import LucideSymbol from '$lib/components/frontend/LucideSymbol.svelte';

	let hamburgerVisible = $state(false);

	function hamburgerToggle() {
		hamburgerVisible = !hamburgerVisible;
	}
	import { onMount } from 'svelte';

	let isMobile = $state(false);

	onMount(() => {
		const checkMobile = () => (isMobile = window.innerWidth <= 600);
		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	});
</script>

<aside class:hamburger-open={hamburgerVisible}>
	<div class="logo-container">
		<img class="logo" alt="Evinote" src="/Logo.svg" />
		<button class="hamburger-btn" onclick={hamburgerToggle} aria-label="Toggle Navigation">
			<LucideSymbol symbol="ChevronDown" size={32} strokeWidth={2} />
		</button>
	</div>
	<nav class:mobile-hidden={!hamburgerVisible}>
		<ul>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<li onclick={hamburgerToggle}>
				<DashboardButton symbol="LayoutDashboard" href="/dashboard" fullwidth={isMobile}>Overview</DashboardButton>
			</li>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<li onclick={hamburgerToggle}>
				<DashboardButton symbol="Users" href="/dashboard/collaboration" fullwidth={isMobile}>Shared</DashboardButton>
			</li>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<li onclick={hamburgerToggle}><DashboardButton symbol="TrendingUp" href="/boards/trending" fullwidth={isMobile}>Trending</DashboardButton></li>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<li class="mobile-only" onclick={hamburgerToggle}>
				<DashboardButton symbol="Settings" href="/dashboard/settings" fullwidth={isMobile}>Settings</DashboardButton>
			</li>
		</ul>
		<ul class="lower desktop-only">
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<li onclick={hamburgerToggle}>
				<DashboardButton symbol="Settings" href="/dashboard/settings" fullwidth={isMobile}>Settings</DashboardButton>
			</li>
		</ul>
	</nav>
</aside>

<!-- <div class="bottom-bar"></div> -->

<style>
	.mobile-only {
		display: none;
	}

	.logo {
		font-size: 1.5em;
		margin: auto;
		width: 100%;
		height: 50px;
		object-fit: cover;
		transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
		transform: scale(0.9);
		padding-left: 10px;
	}

	ul {
		list-style: none;
		padding: 0;
		margin: 0;
		border-top: var(--default-border);
		display: flex;
		flex-direction: column;
	}

	ul:first-child {
		padding-top: 5px;
	}

	ul:last-child {
		padding-bottom: 5px;
	}

	li {
		margin-bottom: -15px;
		margin-top: -15px;
	}

	.lower {
		position: absolute;
		bottom: 0px;
		width: 100%;
	}

	aside {
		position: fixed;
		width: 150px;
		box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
		background-color: var(--default-bar-color);
		border-right: var(--default-border);
		height: 100%;
		transition:
			box-shadow 0.3s ease,
			border-color 0.3s ease;
	}

	aside:hover {
		box-shadow: 4px 0 16px rgba(0, 0, 0, 0.4);
		border-color: var(--button-stroke-color);
	}

	.hamburger-btn {
		display: none;
		background: none;
		border: none;
		color: var(--default-text-color);
		padding: 10px;
		cursor: pointer;
	}

	.hamburger-btn :global(svg) {
		transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.hamburger-open .hamburger-btn :global(svg) {
		transform: rotate(-180deg);
	}

	@media (max-width: 600px) {
		aside {
			width: 100%;
			height: 50px;
			top: 0;
			left: 0;
			z-index: 1000;
			display: flex;
			flex-direction: column;
		}

		.logo-container {
			display: flex;
			justify-content: space-between;
			align-items: center;
			width: 100%;
			height: 50px;
			background-color: var(--default-bar-color);
			z-index: 1001; /* Stay above nav absolute */
			border-radius: 0 0 20px 20px;
			transition: border-radius 0.4s ease-in-out;
		}

		.hamburger-open .logo-container {
			border-radius: 0;
		}

		.logo {
			width: auto;
			padding-left: 20px;
			height: 42px;
			margin: 0;
		}

		.hamburger-btn {
			display: block;
			margin-right: 15px;
		}

		nav {
			display: flex;
			flex-direction: column;
			background-color: var(--default-bar-color);
			position: absolute;
			top: 50px;
			width: 100%;
			box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
			border-bottom: var(--default-border);
			z-index: 1000;
			transform: translateY(0);
			opacity: 1;
			border-radius: 0 0 20px 20px;
			transition: 
				transform 0.4s ease-in-out,
				opacity 0.4s ease-in-out,
				box-shadow 0.4s ease-in-out;
		}

		.mobile-hidden {
			transform: translateY(-100%);
			opacity: 0;
			box-shadow: none;
			border-bottom-color: transparent;
			pointer-events: none;
		}

		.lower.desktop-only {
			display: none;
		}

		.mobile-only {
			display: block;
		}

		ul {
			border-top: none;
			padding-bottom: 20px;
		}
		
		ul:first-child {
			padding-top: 15px;
		}

		li {
			margin: 0;
		}
	}
</style>
