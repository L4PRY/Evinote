<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import SettingsTab from '$lib/components/settings/SettingsTab.svelte';

	export let data: PageData;
	const user = data!.user;

	let doHide = false;

	function toggleHide() {
		doHide = !doHide;
	}

	onMount(() => {
		document.title = 'Evinote • Settings';
	});
</script>

<!-- <SettingsTab title="Account" /> -->
<div class="account-settings-container">
	<div class="account-settings">
		<img
			src="https://ui-avatars.com/api/?name={user.username}&background=random"
			alt="User icon for {user.username}"
			class="h-24 w-24 rounded-full"
		/>
		<div class="account-settings-info">
			<h2>{user.username}</h2>
			<!-- <p>Your user ID is {user.id}.</p> -->
			<p>{user.role}</p>
		</div>
	</div>
	<div class="form-right">
		<form method="post" action=".?/logout" use:enhance>
			<button class="sign-out" on:click={toggleHide} class:hide={doHide}>Sign out</button>
		</form>
	</div>
</div>

<style>
	.account-settings-container {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		gap: 2rem;
		padding-right: 3rem;
	}
	.account-settings {
		display: flex;
		flex-direction: row;
		gap: 1rem;
	}

	.account-settings-info {
		display: inline-flex;
		flex-direction: column;
		justify-content: center;
		gap: 0;
	}

	.account-settings img {
		width: 100px;
		height: 100px;
		border-radius: 50%;
	}

	.account-settings-info h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--default-text-color);
	}

	.account-settings-info p {
		font-size: 1rem;
		font-weight: 500;
		font-style: italic;
		opacity: 0.5;
		color: var(--default-text-color);
	}

	.form-right {
		display: flex;
		justify-content: center;
		align-items: center;
		text-align: center;
	}

	.sign-out {
		background-color: var(--fancycolor-2);
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 5px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 600;
		transition: all 0.2s ease-in-out;
		border: 2px solid var(--fancycolor-2);
		background-color: transparent;
		color: var(--fancycolor-2);
	}

	.sign-out:hover {
		background-color: var(--fancycolor-2);
		color: white;
		text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
	}

	.sign-out:active {
		transform: scale(0.9);
	}

	.hide {
		display: none;
	}
</style>
