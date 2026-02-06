<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';
	import DashboardSidebar from '$lib/components/navigation/DashboardSidebar.svelte';

	export let data: PageData;
	const user = data!.user;
</script>

<DashboardSidebar />
<div class="main">
	<h1>Hi, {user.username}!</h1>
	<p>Your user ID is {user.id}.</p>
	<p>You are a {user.role}</p>
	<a href={resolve('/dashboard/sessions')} aria-label="view sessions">View sessions</a>
	<form method="post" action="?/logout" use:enhance>
		<button>Sign out</button>
	</form>
</div>

<style>
	.main {
		padding: 2rem;
		margin-left: 250px;
	}
</style>
