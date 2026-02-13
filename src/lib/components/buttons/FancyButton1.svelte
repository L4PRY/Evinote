<script lang="ts">
	let { onclick, style, children }: { onclick: () => any; style: string; children: () => any } =
		$props();
</script>

<div>
	<button class="fancybutton" {style} {onclick}>
		{@render children()}
	</button>
</div>

<style>
	button {
		background: var(--fancygradient);
		color: #efefec;
		border: none;
		padding: 8px 12px;
		box-sizing: border-box;
		border-radius: var(--border-radius);
		background-color: var(--default-blur-color);
		color: var(--default-text-color);
		/* backdrop-filter: blur(5px); */
		cursor: pointer;
		transition: all 0.05s ease-in-out;
		font-size: 0.875rem;
	}

	button:hover {
		background: var(--fancygradient);
		color: #efefec;
		text-shadow: 0px 0px 20px var(--fancycolor-2);
		filter: brightness(1.1);
	}

	button:active {
		text-shadow: 0px 0px 20px skyblue;
		filter: brightness(1.2);
		transform-style: flat;
		transform: scale(0.95);
	}

	div {
		display: inline-block;
		width: fit-content;
	}
</style>
