<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import SettingsTab from '$lib/components/settings/SettingsTab.svelte';

	export let data: PageData;
	const user = data!.user;

	onMount(() => {
		document.title = 'Evinote • Settings';
	});
</script>

<!-- <SettingsTab title="Account" /> -->
<h1>{user.username}</h1>
<p>Your user ID is {user.id}.</p>
<p>You are a {user.role}</p>
<form method="post" action=".?/logout" use:enhance>
	<button>Sign out</button>
</form>
