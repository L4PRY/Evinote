<script lang="ts">
	let { children, href, symbol } : {children: any, href? : string, symbol?: any} = $props();
	import { page } from '$app/state';
	import * as icons from '@lucide/svelte';

	const Icon = icons[symbol];
	function isActive(path : string) {
		return page.url.pathname === path;
	}
</script>

<a href={href}>
	<div class:active={isActive(href || "inactive")}>
		{#if Icon}<Icon class="symbol" />{/if}
		{@render children()}
	</div>
</a>

<style>
    div {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        /*justify-content: center;*/
        padding-left: 1.3rem;
        width: 100%;
        transition: all 0.3s ease-in-out;
        cursor: pointer;
    }

    div:not(.active):hover {
        background-color: rgba(200,200,255, 0.05);
    }

    .active {
        background-color: var(--default-bar-active);
        color: var(--default-bar-color);
    }

</style>
