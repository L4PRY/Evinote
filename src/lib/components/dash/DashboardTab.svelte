<script lang="ts">
	const { children }: { children: any } = $props();
	import { page } from '$app/state';
</script>

<div>
	<h1>{@render children()}</h1>
</div>

<style>
	div {
		display: flex;
		gap: 0.7rem;
		width: 100%;
		height: fit-content;
		background: linear-gradient(180deg,
			light-dark(transparent, rgba(200, 200, 200, 0.05)),
			light-dark(rgba(0, 0, 0, 0.05), transparent)
		);
		border-radius: 5px;
		border: 1px solid var(--default-stroke-color);
		padding: 10px;
		margin-bottom: 20px;
		box-sizing: border-box;
	}

	h1 {
		font-size: 1.5rem;
		font-weight: 500;
	}
</style>
