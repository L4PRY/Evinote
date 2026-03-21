<script lang="ts">
	import { page } from '$app/state';
	import LucideSymbol from '$lib/components/frontend/LucideSymbol.svelte';
	import { onMount } from 'svelte';

	let bckpdl: HTMLButtonElement;
	onMount(() => {
		document.title = `Evinote • ${page.status}`;
		if (bckpdl) {
			bckpdl.style.transition =
				'transform 0.3s cubic-bezier(0.38,1.07,0.65,0.99), filter 0.2s ease-in-out';
			bckpdl.style.transform = 'translateY(50%) translateX(42.5%)';
			bckpdl.style.filter = 'opacity(0.3)';
			setInterval(() => {
				bckpdl.style.transition = 'filter 0.2s ease-in-out';
			}, 800);
		}
	});
</script>

<div class="main">
	<div class="infobox">
		<div class="top">
			<button
				id="backpedal"
				class="backpedal"
				bind:this={bckpdl}
				onclick={e => {
					e.preventDefault();
					window.history.back();
				}}
			>
				<LucideSymbol symbol="CornerDownLeft" />
				Back to last page
			</button>
		</div>
		<h1>{page.status}</h1>
		<p class="error-msg">{page.error?.message ?? 'Uknown error'}</p>
	</div>
</div>

<style>
	.main {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100vh;
		position: fixed;
		left: 50%;
		top: 50vh;
		transform: translate(-50%, -50%);
	}

	.infobox {
		text-align: center;
		width: fit-content;
		margin: auto;
	}

	.top {
		width: 100%;
		display: flex;
	}

	.backpedal {
		position: relative;
		font-size: 1.5rem;
		text-decoration: underline;
		width: fit-content;
		filter: opacity(0);
		transform-origin: left;
		transform: translateY(-100%) translateX(42.5%);
	}

	.backpedal:hover {
		filter: opacity(0.6);
		cursor: pointer;
	}

	h1 {
		font-family: 'Google Sans Code', sans-serif;
		font-size: 15rem;
		color: var(--default-text-color);
		background: var(--textgradient);
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		display: inline-block;
		height: 320px;
	}

	.error-msg {
		font-size: 2rem;
		filter: opacity(0.2);
	}
</style>
