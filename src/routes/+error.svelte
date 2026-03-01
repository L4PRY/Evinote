<script>
	import { page } from '$app/state';
	import LucideSymbol from '$lib/components/frontend/LucideSymbol.svelte';
	import { onMount } from 'svelte';
</script>

<div class="main">
	<div class="infobox">
		<div class="top">
			<a
				href="#"
				class="backpedal"
				onclick={e => {
					e.preventDefault();
					window.history.back();
				}}
			>
				<LucideSymbol symbol="CornerDownLeft" />
				Back to last page
			</a>
		</div>
		<h1>{page.status}</h1>
		<p class="error-msg">{page.error.message ? page.error.message : 'Uknown error'}</p>
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
		transform: translate(-50%, -7.5%);
	}

	.infobox {
		text-align: center;
		width: fit-content;
		margin: auto;
	}

	.top {
		width: 100%;
	}

	.backpedal {
		font-size: 1.5rem;
		filter: opacity(0.3);
		text-decoration: underline;
		transition: filter 0.1s ease-in-out;
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
