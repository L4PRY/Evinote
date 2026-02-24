<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import { onMount } from 'svelte';

	interface FormProps {
		message?: string;
	}

	onMount(() => {
		document.title = 'Evinote • Sessions';
	});

	let { data, form }: { data: PageProps['data']; form: FormProps } = $props();
</script>

<div class="site-content">
	<h1>hi</h1>
	<div>here are ur sessions</div>
	{#each data.sessions as session (session.id)}
		<div>
			<p>Session ID: {session.id}</p>
			<p>Created At: {new Date(session.iat).toLocaleString()}</p>
			<p>User Agent: {session.description}</p>
			<form method="post" action="?/invalidate" use:enhance>
				<input type="hidden" name="session_id" value={session.id} />
				<button
					formaction="?/invalidate"
					disabled={data.user.sessionToken === session.token}
					style:color={data.user.sessionToken === session.token ? 'red' : 'green'}
					>Sign out of this session</button
				>
			</form>
		</div>
	{/each}
	<!-- <p style="color: red">{form.message ?? ''}</p> -->
</div>

<style>
    .site-content {
        padding: 2rem;
        margin-left: 150px;
    }
</style>
