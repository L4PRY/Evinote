<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount, onDestroy } from 'svelte';
	import LucideSymbol from '$lib/components/frontend/LucideSymbol.svelte';
	let scrollY = $state(0);
	let outerWidth = $state(0);
	let navVisible = $state(false);
	let hamburgerVisible = $state(false);

	function navbarExpand() {
		const nav = document.querySelector('nav');
		if (!nav) return;

		if (outerWidth > 600) {
			if (scrollY > 50) {
				nav.style.transition = 'all 0.15s ease-in-out';
				nav.style.backdropFilter = 'blur(5px)';
				nav.style.width = '70vw';
				nav.style.border = '1px solid var(--button-stroke-color)';
			} else {
				// Reset to default styles
				nav.style.transition = 'all 0.15s ease-in-out';
				nav.style.backdropFilter = 'none';
				nav.style.border = '1px solid transparent';
				nav.style.width = '50vw';
			}
		}
	}

	function navbarAnimationToggle() {
		const nav = document.querySelector('nav');
		if (nav) {
			nav.style.transition = 'none';
		}
	}

	function navHide() {
		const nav = document.querySelector('nav');
		if (nav) {
			nav.style.transition = 'none';
			nav.style.transform = 'translateY(0)';
			navVisible = false;
		}
	}

	function navShow() {
		const nav = document.querySelector('nav');
		if (nav) {
			nav.style.transition = 'transform 0.8s ease-in-out';
			nav.style.transform = 'translateY(170px)';
			navVisible = true;
		}
	}

	function hamburgerToggle() {
		const navIsland = document.querySelector('.nav-island');
		const nav = document.querySelector('nav');
		if (navIsland) {
			if (!hamburgerVisible) {
				navIsland.style.display = 'flex';
				navIsland.style.height = 'fit-content';
				nav.style.borderRadius = '20px 20px 5px 5px';
				hamburgerVisible = true;
			} else {
				navIsland.style.display = 'none';
				navIsland.style.height = '0vh';
				nav.style.borderRadius = '20px';
				hamburgerVisible = false;
			}
		}
	}

	function closeHamburger() {
		if (hamburgerVisible) {
			hamburgerToggle();
		}
	}

	onMount(() => {
		if (!navVisible) navShow();

		// Add scroll event listener
		window.onscroll = () => {
			scrollY = window.scrollY;
			navbarExpand();
		};

		// Cleanup on destroy
		onDestroy(() => {
			window.onscroll = null;
		});
	});
</script>

<svelte:window bind:scrollY bind:outerWidth on:resize={navbarAnimationToggle} />

<div class="main">
	<nav>
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
			aria-label="Home"><img src="Logo.svg" alt="Evinote" id="logo" /></a
		>
		<div class="nav-island">
			<button onclick={closeHamburger}>Explore</button>
			<div class="nav-island-divider" aria-hidden="true"></div>
			<button onclick={closeHamburger}>Dashboard</button>
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
			display: flex;
			box-sizing: border-box;
			align-items: center;
			justify-content: space-between;
			height: 50px;
			background-color: transparent;
			width: 50vw;
			min-width: fit-content;
			max-width: 100%;
			position: fixed;
			top: 0;
			margin: auto;
			z-index: 10;
			margin-top: -150px;
			border-radius: var(--border-radius);
			transition: all 0.15s ease-in-out;
			backdrop-filter: none;
			border: 1px solid transparent;
			gap: 20px;
		}

		nav #logo {
			height: 50px;
			width: 50px;
			overflow: visible;
			object-fit: cover;
			transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
			transform: scale(0.97);
		}
		.float-left {
			font-size: 1.5rem;
			justify-self: flex-start;
			margin-left: 20px;
		}
		.float-right {
			justify-self: flex-end;
			margin-right: 10px;
		}
		.float-right .hamburger {
			display: none;
		}
		.nav-island {
			display: flex;
			gap: 0;
			text-align: center;
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
			display: flex;
			box-sizing: border-box;
			align-items: center;
			justify-content: space-between;
			height: 50px;
			background-color: transparent;
			width: 90vw;
			margin-left: 5vw;
			min-width: fit-content;
			max-width: 100%;
			position: fixed;
			z-index: 10;
			top: 0;
			margin-top: -150px;
			gap: 20px;
			background: linear-gradient(
				180deg,
				light-dark(transparent, rgba(200, 200, 250, 0.05)),
				light-dark(rgba(0, 0, 100, 0.05), transparent)
			);
			border-radius: 20px;
			/*border: 1px solid var(--default-stroke-color);*/
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
			margin-left: 20px;
		}

		.nav-island {
			position: fixed;
			display: flex;
			gap: 2px;
			flex-direction: column;
			align-items: center;
			text-align: center;
			top: 52px;
			width: 90vw;
			/*background-color: light-dark(#e2dde2, #13091a);*/

			background: linear-gradient(
				180deg,
				light-dark(rgba(0, 0, 100, 0.05), transparent),
				light-dark(transparent, rgba(200, 200, 250, 0.05))
			);

			border-radius: 5px 5px 20px 20px;
			/*border: 1px solid var(--default-stroke-color);*/
			height: 0;
			display: none;
			overflow: hidden;
			transition: all 0.5s ease-in-out;
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
