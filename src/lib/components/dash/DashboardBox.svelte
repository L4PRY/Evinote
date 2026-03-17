<script lang="ts">
	const { href, name }: { href: any; name: string } = $props();
</script>

<a href={href}>
	<div class="container">
		<div class="inner">
			<img class="preview" alt="Board" src="https://placehold.co/600x400" />
		</div>
	</div>
</a>

<style>
    .container {
        width: 20vw;
        border-radius: var(--border-radius);
        background-color: white;
    }
    .preview {
        width: 80%;
    }
</style>
