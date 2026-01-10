<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageServerData } from './$types';

	let { data }: { data: PageServerData } = $props();
</script>

<h1>hi</h1>
<div>here are ur sessions</div>
{#each data.sessions as session (session.id)}
	<div>
		<p>Session ID: {session.id}</p>
		<p>Created At: {new Date(session.iat).toLocaleString()}</p>
		<p>User Agent: {session.description}</p>
		<form method="post" action="?/invalidate" use:enhance>
			<input type="hidden" name="session_id" value={session.id} />
			<button>Sign out of this session</button>
		</form>
	</div>
{/each}
