<script lang="ts">
	let {
		length,
		children
	}: { length: string; bordercolor: string; shadowcolor: string; children: () => any } = $props();
</script>

<div class="divider" style="{length === 'full' ? 'width: 95vw;' : 'width: 100%'};">
	{@render children()}
</div>

<style>
	.divider {
		border: none;
		border-top: 1px solid var(--fancy-color-1);
		position: relative;
		margin-top: 2rem;
	}
</style>
