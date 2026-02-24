<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';
	import { onMount } from 'svelte';

	export let data: PageData;
	const user = data!.user;

	onMount(() => {
		document.title = 'Evinote • Settings';
	});
</script>

<div class="site-content">
    <h1>{user.username}</h1>
    <p>Your user ID is {user.id}.</p>
    <p>You are a {user.role}</p>
    <a href={resolve('/dashboard/settings/sessions')} aria-label="view sessions">View sessions</a>
    <form method="post" action=".?/logout" use:enhance>
	<button>Sign out</button>
    </form>
</div>

<style>
    .site-content {
        padding: 2rem;
        margin-left: 150px;
    }
</style>
