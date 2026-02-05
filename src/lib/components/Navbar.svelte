<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import FancyButton1 from './buttons/FancyButton1.svelte';
	let scrollY = $state(0);
	let outerWidth = $state(0);

	function navbarExpand() {
		const nav = document.querySelector('nav');
		const navWidth = nav?.offsetWidth;

		if (scrollY > 5 || outerWidth < 600) {
			nav?.style.setProperty('transition', 'all 0.15s ease-in-out');
			nav?.style.setProperty('backdrop-filter', 'blur(5px)');
			nav?.style.setProperty('border', 'var(--default-border)');
			nav?.style.setProperty('width', `clamp(50vw, calc(${navWidth}px + 20%), calc(50vw + 20%))`);
		} else {
			nav?.style.setProperty('backdrop-filter', 'none');
			nav?.style.setProperty('border', '1px solid transparent');
			nav?.style.setProperty('width', "50vw");
		}
	}

	function navbarAnimationToggle() {
		const nav = document.querySelector('nav');
		nav?.style.setProperty('transition', 'none');
	}

	function navHide() {
		const nav = document.querySelector('nav');
		if (nav) {
			nav.style.transition = 'none'; 
			nav.style.transform = 'translateY(-500%)';
		}
	}

	onMount(() => {
		navHide();
		setTimeout(() => {
			const nav = document.querySelector('nav');
			if (nav) {
				nav.style.transition = 'transform 0.5s ease-in-out';
				nav.style.transform = 'translateY(0)';
			}
		}, 100);
	});
</script>

<svelte:window bind:scrollY bind:outerWidth on:scroll={navbarExpand} on:resize={navbarAnimationToggle}/>

<div class="main">
	<nav>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<a class="float-left" href="/" onclick={() => goto(resolve('/'))} style="cursor: pointer;" aria-label="Home">Evinote</a>
		<div class="nav-island">
			<button>Explore</button>
			<div class="nav-island-divider"></div>
			<button>Dashboard</button>
			<div class="nav-island-divider"></div>
			<button onclick={() => goto(resolve('/about'))}>About</button>
		</div>
		<div class="float-right">
			<button onclick={() => goto(resolve('/auth'))}>{}</button>
		</div>
	</nav>
</div>

<style>
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
		margin-top: 20px;
		border-radius: var(--border-radius);
		transition: all 0.15s ease-in-out;
		backdrop-filter: none;
		border: 1px solid transparent;
		gap: 20px;
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
	.nav-island {
		display: flex;
		gap: 0;
		text-align: center;
	}
	.nav-island-divider {
		width: 1.5px;
		background: linear-gradient(
			0deg,
			var(--default-blur-color) 20%,
			var(--button-stroke-color) 40%,
			var(--button-stroke-color) 50%,
			var(--default-blur-color) 80%
		);
		backdrop-filter: blur(10px);
		border-top: var(--default-border);
		border-bottom: var(--default-border);
		cursor: pointer;
	}
	button {
		padding: 8px;
		box-sizing: border-box;
		width: 100px;
		border: var(--default-border);
		border-radius: var(--border-radius);
		background-color: var(--default-blur-color);
		color: var(--default-text-color);
		/* backdrop-filter: blur(5px); */
		cursor: pointer;
		transition: width 0.15s ease-in-out, text-shadow 0.05s ease-in-out;
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
	.nav-island button:last-child {
		border-left: none;
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
	}
	.nav-island button:not(:first-child):not(:last-child) {
		border-left: none;
		border-right: none;
		border-radius: 0;
	}
</style>
