<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	export let data: PageData;
	const user = data!.user;
	const boards = data!.boards;
</script>

<h1>Hi, {user.username}!</h1>
<p>Your user ID is {user.id}.</p>
<p>You are a {user.role}</p>
<a href={resolve('/dashboard/sessions')} aria-label="view sessions">View sessions</a>
<p>Your boards:</p>
{#await boards then resolvedBoards}
	{#if resolvedBoards.length === 0}
		<p>You have no boards yet.</p>
		<a href={resolve('/boards/new')} aria-label="create a new board">create one?</a>
	{/if}
	<ul>
		{#each resolvedBoards as board (board.id)}
			<li>
				<a href={resolve(`/boards/${board.id}`)}>{board.name}</a>
			</li>
		{/each}
	</ul>
{/await}

<form method="post" action="?/logout" use:enhance>
	<button>Sign out</button>
</form>
