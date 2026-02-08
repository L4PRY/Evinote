<script>
</script>
 
<button>
    <slot />
</button>

<style>
	button {
		background:
			linear-gradient(var(--default-bg-color) 0 0) padding-box,
			linear-gradient(to right, var(--fancycolor-1), var(--fancycolor-2)) border-box;
		box-sizing: border-box;
		transition: all 0.5s ease-in-out;
		padding: 8px;
		box-sizing: border-box;
		width: 100px;
		border: var(--default-border);
		border-radius: var(--border-radius);
		background-color: var(--default-blur-color);
		color: var(--default-text-color);
		/* backdrop-filter: blur(5px); */
		cursor: pointer;
		transition: all 0.15s ease-in-out;
		font-size: 0.875rem;
	}

	button:hover {
		background:
			linear-gradient(var(--default-bg-color) 0 0) padding-box,
			linear-gradient(to right, var(--fancycolor-1), var(--fancycolor-2)) border-box;
		border: 2px solid transparent;
		box-sizing: border-box;
		cursor: pointer;
	}
</style>
