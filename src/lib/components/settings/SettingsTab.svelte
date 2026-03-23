<script lang="ts">
	const { title }: { title: string } = $props();
</script>

<div class="settings-tab">
	<h3 class="tab-title">{title}</h3>
	<div class="separator" role="separator" aria-orientation="horizontal"></div>
</div>

<style>
	.settings-tab {
		display: flex;
		flex-direction: column;
		width: 100%;
		margin: 24px 0 16px 0;
		margin-top: 0;
	}
    
	.tab-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--default-text-color);
		margin: 0 0 8px 4px;
		opacity: 0.7;
	}

	.separator {
		width: 100%;
		height: 1px;
		background-color: var(--button-stroke-color);
	}
</style>
