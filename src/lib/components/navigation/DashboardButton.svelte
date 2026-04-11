<script lang="ts">
	const {
		children,
		href,
		symbol,
		fullwidth = false
	}: { children: any; href?: string; symbol?: string; fullwidth?: boolean } = $props();
	import { page } from '$app/state';
	import LucideSymbol from '$lib/components/frontend/LucideSymbol.svelte';

	function isActive(path: string) {
		let targetPath = path;
		try {
			targetPath = new URL(path, page.url.href).pathname;
		} catch (e) {
		}

		if (page.url.pathname === targetPath) return true;

		if (targetPath === '/' || targetPath === '/dashboard') return false;

		const targetWithSlash = targetPath.endsWith('/') ? targetPath : targetPath + '/';
		return page.url.pathname.startsWith(targetWithSlash);
	}
</script>

<a {href}>
	<div class:active={isActive(href || 'inactive')} class:fullwidth>
		{#if symbol}
			<LucideSymbol {symbol} size={42} strokeWidth={1.5} />
		{/if}
		{@render children()}
	</div>
</a>

<style>
	div {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		padding: 0.75rem;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
		z-index: 99;
		width: 200px;
		height: 60px;

		justify-content: center;
		/*padding-left: 1.3rem;*/
		box-sizing: content-box;
		margin-left: 7.5px;
		margin-right: 7.5px;
		border-radius: 30px;
		transform-origin: 15px;

		transform: scale(0.5) translateX(7px);
		font-size: 2rem;
	}

	div:not(.active):not(.fullwidth):hover {
		background-color: var(--default-blur-hover-color);
		box-sizing: content-box;
		border-radius: 15px;
		transform: scale(0.52) translateX(2.5px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	div:not(.active):active {
		transition:
			all 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275);
		transform: scale(0.48) translateX(10px);
	}

	.active {
		transition:
			all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275),
			color 0s;
		background-color: var(--default-bar-active);
		color: var(--default-bar-color);
		transform: scale(0.6);
		transform-origin: 0px;
		box-shadow: 0 5px 6px 3px rgba(0, 0, 0, 0.2);
	}

	@media (max-width: 600px) {
		.fullwidth {
			width: 100%;
			height: 50px;
			transform: none !important;
			font-size: 1.2rem;
			box-sizing: border-box;
			margin: 0;
			border-radius: 0;
			justify-content: flex-start;
			padding-left: 20px;
		}

		.fullwidth.active {
			background-color: var(--default-bar-active);
			color: var(--default-bar-color);
			border-radius: 0;
			box-shadow: none;
		}

		.fullwidth :global(svg) {
			width: 24px;
			height: 24px;
		}
	}
</style>
