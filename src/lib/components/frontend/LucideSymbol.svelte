<script lang="ts">
	import * as icons from '@lucide/svelte';
	import type { Icon as IconType } from '@lucide/svelte';
	let { symbol, size, strokeWidth }: { symbol: string; size?: number; strokeWidth?: number } =
		$props();

	const Icon = $derived((icons as Record<string, any>)[symbol]);
</script>

{#if Icon}
	<Icon
		style="display: inline-block;"
		class="icon"
		size={size || 32}
		strokeWidth={strokeWidth || 1}
	/>
{/if}
