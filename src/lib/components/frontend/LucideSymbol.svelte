<script lang="ts">
	import * as icons from '@lucide/svelte';
	let {
		symbol,
		size,
		strokeWidth,
		fill
	}: {
		symbol: string;
		size?: number;
		strokeWidth?: number;
		fill?: string;
	} = $props();

	const Icon = $derived((icons as Record<string, any>)[symbol]);
</script>

{#if Icon}
	<Icon
		style="display: inline-block;"
		class="icon"
		size={size || 32}
		strokeWidth={strokeWidth || 1}
		{fill}
	/>
{/if}
