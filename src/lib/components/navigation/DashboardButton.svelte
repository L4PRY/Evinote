<script lang="ts">
	let { children } = $props();
</script>

<a href="/dashboard">
	<div>
		<img src="https://placehold.it/72x72?text=%40" alt="" />
		{@render children()}
	</div>
</a>

<style>
</style>
