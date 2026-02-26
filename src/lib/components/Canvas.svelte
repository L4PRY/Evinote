<script lang="ts">
	const {
		children,
		size
	}: {
		children: () => any;
		size?: { width: number; height: number; zoom: number };
	} = $props();
</script>

<div
	id="canvas"
	style:width={`${size?.width}px`}
	style:height={`${size?.height}px`}
	style:zoom={size?.zoom}
>
	{@render children()}
</div>

<style>
	#canvas {
		scrollbar-width: none;
		scrollbar-color: transparent transparent;
		position: absolute;
		margin: 0;
		left: 0;
		top: 0;
		box-sizing: border-box;
		width: 100%;
		height: 100vh;
		overflow: hidden;
		border: 5px solid var(--default-text-color);
	}
</style>
