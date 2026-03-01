<script lang="ts">
	import * as icons from '@lucide/svelte';
	let { symbol, size, strokeWidth }: { symbol: string, size?: number, strokeWidth?: number } = $props();

	const Icon = icons[symbol];
</script>

{#if symbol}
	<Icon style="display: inline-block;" size={size || 32} strokeWidth={strokeWidth || 1} />
{/if}

<style>
</style>
