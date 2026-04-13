<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount, onDestroy } from 'svelte';
	import LucideSymbol from '$lib/components/frontend/LucideSymbol.svelte';
	let scrollY = $state(0);
	let outerWidth = $state(0);
	let navVisible = $state(false);
	let hamburgerVisible = $state(false);

	let isExpanded = $derived(outerWidth > 600 && scrollY > 50);

	function navbarAnimationToggle() {
		// Logic handled by CSS to avoid transition conflicts
	}

	function navHide() {
		navVisible = false;
	}

	function navShow() {
		navVisible = true;
	}

	function hamburgerToggle() {
		hamburgerVisible = !hamburgerVisible;
	}

	function closeHamburger() {
		if (hamburgerVisible) {
			hamburgerToggle();
		}
	}

	onMount(() => {
		if (!navVisible) navShow();
	});
</script>

<svelte:window bind:scrollY bind:outerWidth on:resize={navbarAnimationToggle} />

<div class="main">
	<nav class:expanded={isExpanded} class:visible={navVisible} class:hamburger-open={hamburgerVisible}>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<a
			class="float-left"
			href="/"
			onclick={() => {
				closeHamburger();
				goto(resolve('/'));
			}}
			style="cursor: pointer;"
			aria-label="Home"><img src="/Logo.svg" alt="Evinote" id="logo" /></a
		>
		<div class="nav-island">
			<button
				onclick={() => {
					closeHamburger();
					goto(resolve('/features'));
				}}>Features</button
			>
			<div class="nav-island-divider" aria-hidden="true"></div>
			<button
				onclick={() => {
					closeHamburger();
					goto(resolve('/boards/trending'));
				}}>Trending</button
			>
			<div class="nav-island-divider" aria-hidden="true"></div>
			<button
				onclick={() => {
					closeHamburger();
					goto(resolve('/about'));
				}}>About</button
			>
			<button
				class="login-island"
				onclick={() => {
					closeHamburger();
					goto(resolve('/auth'));
				}}>Login</button
			>
		</div>
		<div class="float-right">
			<button
				class="login"
				onclick={() => {
					goto(resolve('/auth'));
				}}>Login</button
			>
			<div class="hamburger">
				<button style="cursor: pointer;" onclick={hamburgerToggle}>
					<LucideSymbol symbol={'Menu'} size={64} strokeWidth={2} />
				</button>
			</div>
		</div>
	</nav>
</div>

<style>
	nav {
		display: flex;
		box-sizing: border-box;
		align-items: center;
		justify-content: space-between;
		height: 50px;
		background-color: transparent;
		min-width: fit-content;
		max-width: 100%;
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		margin: auto;
		z-index: 10;
		margin-top: -150px;
		border-radius: var(--border-radius);
		transition: 
			width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275),
			transform 0.8s cubic-bezier(0.4, 0, 0.2, 1),
			padding 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275),
			backdrop-filter 0.4s cubic-bezier(0.4, 0, 0.2, 1),
			border 0.4s cubic-bezier(0.4, 0, 0.2, 1),
			border-radius 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
		backdrop-filter: none;
		border: 1px solid transparent;
		gap: 20px;
	}

	nav.visible {
		transform: translateY(170px);
	}

	nav #logo {
		height: 48px;
		width: auto;
		display: block;
		object-fit: contain;
		transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}


	@media (min-width: 600px) {
		.main {
			margin-left: auto;
			margin-right: auto;
			display: flex;
			justify-content: center;
			align-items: center;
			width: 80%;
			height: 60px;
		}
		nav {
			width: 50vw;
			display: grid;
			grid-template-columns: 1fr auto 1fr;
		}

		nav.expanded {
			width: 70vw;
			backdrop-filter: blur(5px);
			border: 1px solid var(--button-stroke-color);
		}

		nav #logo:hover {
			transform: scale(1.1);
		}

		.float-left {
			font-size: 1.5rem;
			justify-self: start;
			margin-left: 5px;
		}
		.float-right {
			justify-self: end;
			margin-right: 10px;
		}
		.float-right .hamburger {
			display: none;
		}
		.nav-island {
			display: flex;
			gap: 0;
			text-align: center;
			justify-self: center;
		}
		.nav-island-divider {
			width: 2px;
			background: linear-gradient(
				0deg,
				var(--default-blur-color) 20%,
				var(--button-stroke-color) 40%,
				var(--button-stroke-color) 50%,
				var(--default-blur-color) 80%
			);
			backdrop-filter: blur(10px);
			border-top: 1px solid var(--button-stroke-color);
			border-bottom: 1px solid var(--button-stroke-color);
			cursor: pointer;
		}
		.login-island {
			display: none;
		}
		button {
			padding: 8px;
			box-sizing: border-box;
			width: 100px;
			border: 1px solid var(--button-stroke-color);
			border-radius: var(--border-radius);
			background-color: var(--default-blur-color);
			color: var(--default-text-color);
			/* backdrop-filter: blur(5px); */
			cursor: pointer;
			transition:
				width 0.15s ease-in-out,
				text-shadow 0.05s ease-in-out;
			font-size: 0.875rem;
		}
		.nav-island button:hover {
			text-shadow: 0px 0px 20px var(--fancycolor-2);
			filter: brightness(1.1);
			width: 110px;
		}
		.float-right button {
			width: fit-content;
			padding: 8px 16px;
		}
		.float-right button:hover {
			text-shadow: 0px 0px 20px var(--fancycolor-1);
			filter: brightness(1.1);
		}
		button:active {
			text-shadow: 0px 0px 20px skyblue;
		}
		.nav-island button:first-child {
			border-right: none;
			border-top-right-radius: 0;
			border-bottom-right-radius: 0;
		}
		.nav-island button:not(:first-child) {
			border-left: none;
			border-top-left-radius: 0;
			border-bottom-left-radius: 0;
		}
		.nav-island button:nth-child(3) {
			border-left: none;
			border-right: none;
			border-radius: 0;
		}
	}

	/*----------------Mobile-----------------*/

	@media (max-width: 600px) {
		.main {
			width: 100%;
		}

		nav {
			width: 90vw;
			margin-left: auto;
			margin-right: auto;
			background: linear-gradient(
				180deg,
				light-dark(transparent, rgba(200, 200, 250, 0.05)),
				light-dark(rgba(0, 100, 0.05), transparent)
			);
			border-radius: 20px;
			transition: height 0.5s ease-in-out;
		}

		.float-right .login {
			display: none;
		}

		.hamburger {
			display: flex;
			padding: 2px;
		}

		.hamburger button {
			transform: scale(0.5);
			transform-origin: center;
			transition: all 0.1s ease-in-out;
		}

		.hamburger button:active {
			transform: scale(0.45);
		}

		.float-left {
			font-size: 1.5rem;
			margin-left: 10px;
		}

		.nav-island {
			position: fixed;
			display: none;
			gap: 2px;
			flex-direction: column;
			align-items: center;
			text-align: center;
			top: 52px;
			width: 90vw;
			left: 0;
			right: 0;
			margin: auto;
			background: linear-gradient(
				180deg,
				light-dark(rgba(0, 100, 0.05), transparent),
				light-dark(transparent, rgba(200, 250, 200, 0.05))
			);
			border-radius: 5px 5px 20px 20px;
			height: 0;
			overflow: hidden;
			transition: all 0.5s ease-in-out;
		}

		nav.hamburger-open {
			border-radius: 20px 20px 5px 5px;
		}

		nav.hamburger-open .nav-island {
			display: flex;
			height: fit-content;
		}

		.nav-island button {
			background-color: var(--default-blur-color);
		}

		.nav-island button:hover {
			backdrop-filter: opacity(5);
		}

		nav::before,
		.nav-island::before {
			backdrop-filter: blur(5px);
			content: '';
			display: block;
			height: 100%;
			width: 100%;
			position: absolute;
			left: 0;
			top: 0;
			z-index: -99;
			border-radius: inherit;
			border: 1px solid var(--default-stroke-color);
		}

		.login-island {
			margin-top: 1px;
			display: inline-block;
		}

		.nav-island button {
			width: 100%;
			padding: 15px;
			font-size: 1.2rem;
			cursor: pointer;
		}
	}
</style>
