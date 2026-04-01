<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import SettingsTab from '$lib/components/settings/SettingsTab.svelte';

	const { data } = $props();
	const { user, email, profilePictures } = data;

	// Current picture is the latest (first in array)
	const currentPfp = $derived(
		profilePictures && profilePictures.length > 0 ? profilePictures[0] : null
	);

	// Previous pictures are the rest (up to 5)
	const previousPfps = $derived(profilePictures.slice(1, 6));

	let doHide = $state(false);
	let uploading = $state(false);
	let selectedPfpId: string | null = null;

	// Form state for user properties
	let formUsername = $derived(user.username);
	let formEmail = $derived(email);
	let formOldPassword = $state('');
	let formNewPassword = $state('');
	let formResponse = $state<any>(null);

	function toggleHide() {
		doHide = !doHide;
	}

	async function handleFileUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		uploading = true;
		try {
			const fileForm = new FormData();
			fileForm.append('file', file);

			const fileRes = await fetch('/api/files/upload', {
				method: 'POST',
				body: fileForm
			});

			if (!fileRes.ok) {
				throw new Error('Upload failed');
			}

			const result = (await fileRes.json()) as { id: number; url: string; mime: string };

			// Auto-submit the setPfp form after successful upload
			const pfpForm = new FormData();
			pfpForm.append('id', result.id.toString());

			const pfpRes = await fetch('?/setPfp', {
				method: 'POST',
				body: pfpForm
			});
		} catch (err) {
			console.error('File upload error:', err);
			alert('Failed to upload profile picture. Please try again.');
		} finally {
			uploading = false;
			// Reset input
		}
	}

	function getCurrentPfpUrl(): string {
		if (currentPfp?.hash) {
			return `/api/files/${currentPfp.hash}`;
		}
		return `https://ui-avatars.com/api/?name=${user.username}&background=random`;
	}

	function getPfpUrl(hash: string): string {
		return `/api/files/${hash}`;
	}

	onMount(() => {
		document.title = 'Evinote • Settings';
	});
</script>

<!-- Account Header -->
<div class="account-settings-container">
	<div class="account-settings">
		<img
			src={getCurrentPfpUrl()}
			alt="User icon for {user.username}"
			class="h-24 w-24 rounded-full"
		/>
		<div class="account-settings-info">
			<h2>{user.username}</h2>
			<p>{user.role}</p>
		</div>
	</div>
	<div class="form-right">
		<form method="post" action=".?/logout" use:enhance>
			<button class="sign-out" onclick={toggleHide} class:hide={doHide}>Sign out</button>
		</form>
	</div>
</div>

<!-- Profile Picture Section -->
<div class="pfp-section">
	<h3>Profile Picture</h3>

	<div class="current-pfp">
		<img
			src={getCurrentPfpUrl()}
			alt="Current profile picture for {user.username}"
			class="current-pfp-img"
		/>
	</div>

	<div class="upload-section">
		<label for="pfp-upload" class="upload-label">
			<span>Upload New Profile Picture</span>
		</label>
		<input
			id="pfp-upload"
			type="file"
			accept="image/*"
			onchange={handleFileUpload}
			disabled={uploading}
			class="file-input"
		/>
		{#if uploading}
			<p class="uploading-text">Uploading...</p>
		{/if}
	</div>

	{#if previousPfps.length > 0}
		<div class="previous-pfps">
			<h4>Previous Profile Pictures</h4>
			<div class="pfps-row">
				{#each previousPfps as pfp (pfp.id)}
					<form method="post" action="?/setPfp" use:enhance class="pfp-item">
						<input type="hidden" name="id" value={pfp.id} />
						<button type="submit" class="pfp-button" title="Set as profile picture">
							<img src={getPfpUrl(pfp.hash!)} alt="Previous profile option" class="pfp-thumbnail" />
						</button>
					</form>
				{/each}
			</div>
		</div>
	{/if}
</div>

<!-- User Settings Form Section -->
<div class="settings-section">
	<h3>Account Settings</h3>

	<form
		method="post"
		action="?/setUserProps"
		use:enhance={() => {
			return async ({ result }) => {
				if (result.type === 'success' || result.type === 'failure') {
					formResponse = result.data;
				}
			};
		}}
	>
		<!-- Username Field -->
		<div class="form-group">
			<label for="username">Username</label>
			<input
				id="username"
				type="text"
				name="username"
				bind:value={formUsername}
				class="form-input"
			/>
			{#if formResponse?.formReturn?.username}
				<p
					class="form-feedback"
					class:success={!formResponse.formReturn.username.message.includes('taken')}
				>
					{formResponse.formReturn.username.message}
				</p>
			{/if}
		</div>

		<!-- Email Field -->
		<div class="form-group">
			<label for="email">Email</label>
			<input id="email" type="email" name="email" bind:value={formEmail} class="form-input" />
			{#if formResponse?.formReturn?.email}
				<p
					class="form-feedback"
					class:success={!formResponse.formReturn.email.message.includes('in use')}
				>
					{formResponse.formReturn.email.message}
				</p>
			{/if}
		</div>

		<!-- Old Password Field -->
		<div class="form-group">
			<label for="oldPassword">Current Password</label>
			<input
				id="oldPassword"
				type="password"
				name="oldPassword"
				bind:value={formOldPassword}
				class="form-input"
			/>
			{#if formResponse?.formReturn?.oldPassword}
				<p
					class="form-feedback"
					class:success={formResponse.formReturn.oldPassword.message.includes('correct')}
				>
					{formResponse.formReturn.oldPassword.message}
				</p>
			{/if}
		</div>

		<!-- New Password Field -->
		<div class="form-group">
			<label for="newPassword">New Password</label>
			<input
				id="newPassword"
				type="password"
				name="newPassword"
				bind:value={formNewPassword}
				class="form-input"
			/>
			{#if formResponse?.formReturn?.newPassword}
				<p
					class="form-feedback"
					class:success={formResponse.formReturn.newPassword.message.includes('good')}
				>
					{formResponse.formReturn.newPassword.message}
				</p>
			{/if}
		</div>

		<!-- Submit Button -->
		<button type="submit" class="submit-btn">Update Account</button>
	</form>
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
		object-fit: cover;
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

	.pfp-section {
		margin-top: 3rem;
		padding: 2rem;
		border-radius: 10px;
		background-color: rgba(255, 255, 255, 0.05);
	}

	.pfp-section h3 {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--default-text-color);
		margin-bottom: 1.5rem;
	}

	.current-pfp {
		display: flex;
		justify-content: center;
		margin-bottom: 2rem;
	}

	.current-pfp-img {
		width: 200px;
		height: 200px;
		border-radius: 50%;
		object-fit: cover;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.upload-section {
		margin-bottom: 2rem;
		padding: 1.5rem;
		border: 2px dashed var(--fancycolor-2);
		border-radius: 8px;
		text-align: center;
	}

	.upload-label {
		display: block;
		cursor: pointer;
		font-weight: 500;
		color: var(--fancycolor-2);
		margin-bottom: 0.5rem;
	}

	.file-input {
		display: block;
		margin: 0 auto;
		cursor: pointer;
	}

	.file-input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.uploading-text {
		margin-top: 0.5rem;
		color: var(--default-text-color);
		opacity: 0.7;
		font-size: 0.9rem;
	}

	.previous-pfps {
		margin-top: 2rem;
	}

	.previous-pfps h4 {
		font-size: 1rem;
		font-weight: 600;
		color: var(--default-text-color);
		margin-bottom: 1rem;
	}

	.pfps-row {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.pfp-item {
		all: unset;
	}

	.pfp-button {
		all: unset;
		cursor: pointer;
		display: block;
		border-radius: 50%;
		overflow: hidden;
		transition:
			transform 0.2s ease-in-out,
			box-shadow 0.2s ease-in-out;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		border: 2px solid transparent;
	}

	.pfp-button:hover {
		transform: scale(1.1);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
		border-color: var(--fancycolor-2);
	}

	.pfp-button:active {
		transform: scale(0.95);
	}

	.pfp-thumbnail {
		width: 80px;
		height: 80px;
		object-fit: cover;
		display: block;
	}

	.settings-section {
		margin-top: 3rem;
		padding: 2rem;
		border-radius: 10px;
		background-color: rgba(255, 255, 255, 0.05);
	}

	.settings-section h3 {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--default-text-color);
		margin-bottom: 1.5rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group label {
		font-weight: 500;
		color: var(--default-text-color);
		font-size: 0.95rem;
	}

	.form-input {
		padding: 0.75rem;
		border: 2px solid rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		background-color: rgba(255, 255, 255, 0.05);
		color: var(--default-text-color);
		font-size: 1rem;
		transition: all 0.2s ease-in-out;
	}

	.form-input:focus {
		outline: none;
		border-color: var(--fancycolor-2);
		background-color: rgba(255, 255, 255, 0.08);
		box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
	}

	.form-input::placeholder {
		color: rgba(255, 255, 255, 0.4);
	}

	.form-feedback {
		font-size: 0.85rem;
		margin: 0;
		padding: 0.25rem 0;
		color: #ff6b6b;
		transition: color 0.2s ease-in-out;
	}

	.form-feedback.success {
		color: #51cf66;
	}

	.submit-btn {
		margin-top: 1rem;
		padding: 0.75rem 2rem;
		background-color: var(--fancycolor-2);
		color: white;
		border: none;
		border-radius: 6px;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s ease-in-out;
	}

	.submit-btn:hover {
		background-color: var(--fancycolor-2);
		opacity: 0.9;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
	}

	.submit-btn:active {
		transform: translateY(0);
	}
</style>
