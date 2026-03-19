<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	let { mode = 'fixed' }: { mode?: 'fixed' | 'scroll' | 'hidden' } = $props();

	let scrollY = $state(0);
	let visible = $state(false);

	function handleScroll() {
		if (mode === 'scroll') {
			visible = scrollY > 100;
		}
	}
</script>

<svelte:window bind:scrollY on:scroll={handleScroll} />

{#if mode !== 'hidden'}
	<footer class:visible={mode === 'fixed' || visible}>
		<div class="footer-inner">
			<div class="footer-left">
				<span>© 2026 Evinote</span>
			</div>

			<div class="footer-island">
				<button onclick={() => goto(resolve('/privacy'))}>Privacy</button>
				<div class="footer-island-divider"></div>
				<button onclick={() => goto(resolve('/terms'))}>Terms</button>
				<div class="footer-island-divider"></div>
				<button onclick={() => goto(resolve('/contact'))}>Contact</button>
			</div>

			<div class="footer-right">
				<button onclick={() => goto(resolve('/about'))}>About</button>
			</div>
		</div>
	</footer>
{/if}

<style>
	footer {
		position: fixed;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 70px;

		display: flex;
		justify-content: center;
		align-items: center;

		backdrop-filter: blur(8px);
		border-top: var(--default-border);
		background: rgba(0, 0, 0, 0.2);

		transform: translateY(100%);
		transition: transform 0.35s ease-in-out;
		z-index: 100;
	}

	footer.visible {
		transform: translateY(0);
	}

	.footer-inner {
		width: 80%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
	}

	.footer-island {
		display: flex;
	}

	.footer-island-divider {
		width: 1.5px;
		background: linear-gradient(
			0deg,
			var(--default-blur-color) 20%,
			var(--button-stroke-color) 40%,
			var(--button-stroke-color) 50%,
			var(--default-blur-color) 80%
		);
		border-top: var(--default-border);
		border-bottom: var(--default-border);
	}

	button {
		padding: 8px;
		width: 100px;
		border: var(--default-border);
		border-radius: var(--border-radius);
		background-color: var(--default-blur-color);
		color: var(--default-text-color);
		cursor: pointer;
		font-size: 0.875rem;
		transition: 0.15s ease-in-out;
	}

	button:hover {
		filter: brightness(1.1);
		text-shadow: 0px 0px 15px var(--fancycolor-2);
	}
</style>
