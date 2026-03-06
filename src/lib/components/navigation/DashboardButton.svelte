<script lang="ts">
	const { children, href, symbol }: { children: any; href?: string; symbol?: string } = $props();
	import { page } from '$app/state';
	import LucideSymbol from '../frontend/LucideSymbol.svelte';

	function isActive(path: string) {
		return page.url.pathname === path;
	}
</script>

<a {href}>
	<div class:active={isActive(href || 'inactive')}>
		{#if symbol}
			<LucideSymbol symbol={symbol} size={42} strokeWidth={1.5} />
		{/if}
		{@render children()}
	</div>
</a>
{/if}

<style>
	div {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		padding: 0.75rem;
		cursor: pointer;
		transition: all 0.2s ease-in-out;
		z-index: 99;
		width: 200px;
		height: 60px;

		justify-content: center;
		/*padding-left: 1.3rem;*/
		box-sizing: content-box;
		margin-left: 7.5px;
		margin-right: 7.5px;
		border-radius: 30px;

		transform: scale(0.5);
		font-size: 2rem;
		transform-origin: 20px;
	}

	div:not(.active):hover {
		transition: all 0.1s ease-in;
		background-color: rgba(200, 200, 255, 0.05);
		box-sizing: content-box;
		border-radius: 10px;
		text-shadow: 2px 2px 2px 5px white;
	}

	.active {
		transition:
			all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275),
			color 0s;
		background-color: var(--default-bar-active);
		color: var(--default-bar-color);
		transform-origin: 0;
		transform: scale(0.6);
		box-shadow: 0 5px 6px 3px rgba(0, 0, 0, 0.2);
	}
</style>
