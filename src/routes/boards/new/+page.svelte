<script lang="ts">
	import { enhance } from '$app/forms';

	const { form }: { form: { message?: string } } = $props();
</script>

<h1>create new board</h1>
<form method="post" action="?/create" use:enhance>
	<label for="name">Board name:</label>
	<input type="text" id="name" name="name" required />
	<label for="access">privacy level:</label>
	<select name="access" id="access_select">
		<option value="Private" selected>private</option>
		<option value="Public">public</option>
		<option value="Unlisted">unlisted</option>
	</select>
	<button type="submit">Create</button>

	<p style="color: red">{form?.message ?? ''}</p>
</form>
