<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import SettingsTab from '$lib/components/settings/SettingsTab.svelte';
	import ProfilePicturePopup from '$lib/components/settings/ProfilePicturePopup.svelte';
	import { goto } from '$app/navigation';
	import type { SettingsFormReturn } from '$lib/types/dashboard/SettingsForm';
	import LucideSymbol from '$lib/components/frontend/LucideSymbol.svelte';
	import { notifications } from '$lib/stores/notifications';

	let { data }: { data: PageData } = $props();
	const user = $derived(data.user);
	const email = $derived(data.email);
	const profilePictures = $derived(data.profilePictures);

	// Current picture is the latest (first in array)
	const currentPfp = $derived(
		profilePictures && profilePictures.length > 0 ? profilePictures[0] : null
	);

	// Previous pictures are the rest (up to 5)
	const previousPfps = $derived(profilePictures.slice(1, 6));

	let doHide = $state(false);
	let uploading = $state(false);
	let showPfpPopup = $state(false);
	let selectedPfpId: string | null = null;

	// Form state for user properties
	// svelte-ignore state_referenced_locally
	let formUsername = $state(user.username);
	// svelte-ignore state_referenced_locally
	let formEmail = $state(email);
	let formPassword = $state(''); // For profile confirmation
	let formOldPassword = $state('');
	let formNewPassword = $state('');

	let profileResponse = $state<SettingsFormReturn | undefined>();
	let profileSuccess = $state(false);

	let passwordResponse = $state<SettingsFormReturn | undefined>();
	let passwordSuccess = $state(false);

	let isEditingUsername = $state(false);
	let isEditingEmail = $state(false);
	let isEditingPassword = $state(false);

	// Delete account state
	let showDeleteModal = $state(false);
	let showConfirmDeleteModal = $state(false);
	let deleteUsername = $state('');
	let deletePassword = $state('');
	let deleteAllFiles = $state(false);

	function toggleHide() {
		doHide = !doHide;
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

	function openDeleteModal() {
		showDeleteModal = true;
		deleteUsername = '';
		deletePassword = '';
		deleteAllFiles = false;
	}

	function closeDeleteModal() {
		showDeleteModal = false;
		deleteUsername = '';
		deletePassword = '';

		showConfirmDeleteModal = false;
	}

	function openConfirmDeleteModal() {
		if (!deleteUsername || !deletePassword) {
			alert('Please enter both username and password');
			return;
		}
		showConfirmDeleteModal = true;
	}

	function closeConfirmDeleteModal() {
		showConfirmDeleteModal = false;
		closeDeleteModal();
	}

	async function submitDeleteAccount() {
		const form = new FormData();
		form.append('username', deleteUsername);
		form.append('password', deletePassword);
		form.append('files', deleteAllFiles ? 'yes' : 'no');

		const res = await fetch('?/deleteAccount', {
			method: 'POST',
			body: form
		});
		const data = await res.json();
		
		if (data.type === 'success') {
			// After deletion, log the user out and redirect to homepage
			goto(resolve('/auth'));
			notifications.add({
				title: 'Success',
				message: 'Account deleted successfully.',
				type: 'success',
				duration: 3000
			});
		} else {
			notifications.add({
				title: 'Error during account deletion',
				message: data.data,
				type: 'error',
				duration: 3000
			});
		}
	}

	onMount(() => {
		document.title = 'Evinote • Settings';
	});

	$effect(() => {
		$inspect(profileResponse);
		$inspect(passwordResponse);
	});
</script>

<!-- Account Header -->
<div class="account-settings-container">
	<div class="account-settings">
		<button
			class="pfp-trigger-btn"
			onclick={() => (showPfpPopup = true)}
			title="Change profile picture"
		>
			<img
				src={getCurrentPfpUrl()}
				alt="User icon for {user.username}"
				class="avatar-img h-24 w-24 rounded-full"
			/>
			<div class="avatar-overlay">
				<LucideSymbol symbol="Pencil" size={32} strokeWidth={2} />
			</div>
		</button>
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

<div class="settings-layout-container">
	<!-- Profile Settings Form Section -->
	<div class="settings-section">
		<!-- Username Section -->
		<div class="setting-item">
			<span class="setting-title">Username</span>
			<div class="setting-row">
				{#if isEditingUsername}
					<form
						method="post"
						action="?/updateProfile"
						class="inline-edit-form"
						use:enhance={() => {
							return async ({ result }) => {
								if (result.type === 'success' || result.type === 'failure') {
									profileResponse = result.data?.formReturn as SettingsFormReturn;
									profileSuccess = result.type === 'success';
									if (profileSuccess) {
										isEditingUsername = false;
										formPassword = '';
									}
								}
							};
						}}
					>
						<div class="edit-inputs">
							<input
								type="text"
								name="username"
								bind:value={formUsername}
								class="form-input"
								autofocus
							/>
							<input
								type="password"
								name="password"
								bind:value={formPassword}
								class="form-input"
								placeholder="Confirm password"
							/>
						</div>
						<div class="edit-actions">
							<button type="submit" class="save-btn">Save</button>
							<button type="button" class="cancel-btn" onclick={() => (isEditingUsername = false)}
								>Cancel</button
							>
						</div>
					</form>
				{:else}
					<p class="setting-paragraph">{user.username}</p>
					<button class="edit-btn" onclick={() => (isEditingUsername = true)}> Edit </button>
				{/if}
			</div>
			{#if profileResponse?.username}
				{@const success = profileResponse.username.success}
				<p class={(success ? 'success' : 'failure') + ' form-feedback'}>
					{profileResponse.username.message}
				</p>
			{/if}
		</div>

		<!-- Email Section -->
		<div class="setting-item">
			<span class="setting-title">Email</span>
			<div class="setting-row">
				{#if isEditingEmail}
					<form
						method="post"
						action="?/updateProfile"
						class="inline-edit-form"
						use:enhance={() => {
							return async ({ result }) => {
								if (result.type === 'success' || result.type === 'failure') {
									profileResponse = result.data?.formReturn as SettingsFormReturn;
									profileSuccess = result.type === 'success';
									if (profileSuccess) {
										isEditingEmail = false;
										formPassword = '';
									}
								}
							};
						}}
					>
						<div class="edit-inputs">
							<input
								type="email"
								name="email"
								bind:value={formEmail}
								class="form-input"
								autofocus
							/>
							<input
								type="password"
								name="password"
								bind:value={formPassword}
								class="form-input"
								placeholder="Confirm password"
							/>
						</div>
						<div class="edit-actions">
							<button type="submit" class="save-btn">Save</button>
							<button type="button" class="cancel-btn" onclick={() => (isEditingEmail = false)}
								>Cancel</button
							>
						</div>
					</form>
				{:else}
					<p class="setting-paragraph">{email}</p>
					<button class="edit-btn" onclick={() => (isEditingEmail = true)}> Edit </button>
				{/if}
			</div>
			{#if profileResponse?.email}
				{@const success = profileResponse.email.success}
				<p class={(success ? 'success' : 'failure') + ' form-feedback'}>
					{profileResponse.email.message}
				</p>
			{/if}
		</div>

		{#if profileResponse?.oldPassword && (isEditingUsername || isEditingEmail)}
			{@const success = profileResponse.oldPassword.success}
			<p class={(success ? 'success' : 'failure') + ' form-feedback'}>
				{profileResponse.oldPassword.message}
			</p>
		{/if}

		<div class="setting-item">
			<span class="setting-title">Password</span>
			<div class="setting-row">
				{#if isEditingPassword}
					<form
						method="post"
						action="?/changePassword"
						class="inline-edit-form password-form"
						use:enhance={() => {
							return async ({ result }) => {
								if (result.type === 'success' || result.type === 'failure') {
									passwordResponse = result.data?.formReturn as SettingsFormReturn;
									passwordSuccess = result.type === 'success';
									if (passwordSuccess) {
										isEditingPassword = false;
										formOldPassword = '';
										formNewPassword = '';
									}
								}
							};
						}}
					>
						<div class="edit-inputs">
							<input
								type="password"
								name="oldPassword"
								bind:value={formOldPassword}
								class="form-input"
								placeholder="Current password"
								autofocus
							/>
							<input
								type="password"
								name="newPassword"
								bind:value={formNewPassword}
								class="form-input"
								placeholder="New password"
							/>
						</div>
						<div class="edit-actions">
							<button type="submit" class="save-btn">Change</button>
							<button type="button" class="cancel-btn" onclick={() => (isEditingPassword = false)}
								>Cancel</button
							>
						</div>
					</form>
				{:else}
					<p class="setting-paragraph" style="opacity: 0.5;">••••••••••••</p>
					<button class="edit-btn" onclick={() => (isEditingPassword = true)}> Change </button>
				{/if}
			</div>
			{#if passwordResponse?.oldPassword}
				{@const success = passwordResponse.oldPassword.success}
				<p class={(success ? 'success' : 'failure') + ' form-feedback'}>
					{passwordResponse.oldPassword.message}
				</p>
			{/if}
			{#if passwordResponse?.newPassword}
				{@const success = passwordResponse.newPassword.success}
				<p class={(success ? 'success' : 'failure') + ' form-feedback'}>
					{passwordResponse.newPassword.message}
				</p>
			{/if}
		</div>
	</div>

	<!-- Delete Account Section -->
	<div class="delete-account-section">
		<h3>Delete Account</h3>
		<p style="margin-bottom: 1rem; opacity: 0.7;">
			Permanently delete your account and all associated data. This action cannot be undone.
		</p>
		<button class="delete-account-btn" onclick={openDeleteModal}>Delete Account</button>
	</div>

	<!-- Delete Account Credentials Modal -->
	{#if showDeleteModal}
		<div
			class="modal-overlay"
			role="presentation"
			onclick={closeDeleteModal}
			onkeydown={e => e.key === 'Escape' && closeDeleteModal()}
		>
			<div
				class="modal-content"
				role="dialog"
				tabindex="0"
				onclick={e => e.stopPropagation()}
				onkeydown={e => e.key === 'Escape' && closeDeleteModal()}
			>
				<h2>Delete Account</h2>
				<p>Enter your credentials to proceed with account deletion.</p>

				<div class="modal-form-group">
					<label for="delete-username">Username</label>
					<input
						id="delete-username"
						type="text"
						bind:value={deleteUsername}
						placeholder="Enter your username"
					/>
				</div>

				<div class="modal-form-group">
					<label for="delete-password">Password</label>
					<input
						id="delete-password"
						type="password"
						bind:value={deletePassword}
						placeholder="Enter your password"
					/>
				</div>

				<div class="modal-buttons">
					<button class="modal-btn modal-btn-primary" onclick={openConfirmDeleteModal}
						>Continue</button
					>
					<button class="modal-btn modal-btn-secondary" onclick={closeDeleteModal}>Cancel</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Delete Account Confirmation Modal -->
	{#if showConfirmDeleteModal}
		<div
			class="modal-overlay"
			role="presentation"
			onclick={closeConfirmDeleteModal}
			onkeydown={e => e.key === 'Escape' && closeConfirmDeleteModal()}
		>
			<div
				class="modal-content confirm-modal-content"
				role="alertdialog"
				tabindex="-1"
				onclick={e => e.stopPropagation()}
				onkeydown={e => e.key === 'Escape' && closeConfirmDeleteModal()}
			>
				<h2>Are you sure?</h2>
				<p>This action will permanently delete your account and cannot be undone.</p>

				<div class="checkbox-group">
					<label>
						<input type="checkbox" bind:checked={deleteAllFiles} />
						<span
							>Also delete all files (profile pictures, images, videos, etc.) that I've uploaded.</span
						>
					</label>
				</div>

				<div class="confirm-buttons">
					<button class="confirm-btn-no" onclick={closeConfirmDeleteModal}>No</button>
					<button class="confirm-btn-yes" onclick={submitDeleteAccount}>Yes</button>
				</div>
			</div>
		</div>
	{/if}
</div>

{#if showPfpPopup}
	<ProfilePicturePopup
		user={{ username: user.username, id: user.id }}
		{profilePictures}
		onClose={() => (showPfpPopup = false)}
	/>
{/if}

<style>
	.settings-layout-container {
		display: flex;
		flex-direction: row;
		gap: 2rem;
		width: 100%;
		flex-wrap: wrap;
	}

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

	.pfp-trigger-btn {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		position: relative;
		border-radius: 50%;
		overflow: hidden;
		width: 100px;
		height: 100px;
		transition: transform 0.2s ease-in-out;
	}

	.pfp-trigger-btn:hover {
		transform: scale(1.05);
	}

	.pfp-trigger-btn:hover .avatar-overlay {
		opacity: 1;
	}

	.avatar-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.4);
		display: flex;
		justify-content: center;
		align-items: center;
		opacity: 0;
		transition: opacity 0.2s ease-in-out;
		color: white;
		font-weight: 600;
		font-size: 0.9rem;
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
		color: var(--default-text-color-o5);
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

	.settings-section {
		margin-top: 3rem;
		padding: 2.5rem;
		border-radius: 12px;
		background-color: rgba(255, 255, 255, 0.02);
		border: var(--default-border-visible);
		backdrop-filter: blur(5px);
		width: 100%;
	}

	.setting-item {
		margin-bottom: 2rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}

	.setting-item:last-child {
		border-bottom: none;
		margin-bottom: 0;
		padding-bottom: 0;
	}

	.setting-title {
		display: block;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--default-text-color-o5);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.75rem;
	}

	.setting-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.setting-paragraph {
		font-size: 1.1rem;
		font-weight: 500;
		color: var(--default-text-color);
		margin: 0;
	}

	.edit-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background-color: rgba(255, 255, 255, 0.05);
		border: var(--default-border-visible);
		border-radius: 6px;
		color: var(--default-text-color);
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease-in-out;
	}

	.edit-btn:hover {
		background-color: var(--default-bar-active);
		border: 1px solid transparent;
		transform: translateY(-1px);
		color: white;
	}

	.inline-edit-form {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.edit-inputs {
		display: flex;
		flex-direction: row;
		gap: 1rem;
		width: 100%;
	}

	.edit-inputs .form-input {
		flex: 1;
	}

	.password-form .edit-inputs {
		flex-direction: column;
	}

	.edit-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
	}

	.save-btn {
		padding: 0.5rem 1.5rem;
		background-color: var(--fancycolor-2);
		color: white;
		border: none;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease-in-out;
	}

	.save-btn:hover {
		opacity: 0.9;
		transform: scale(1.02);
	}

	.cancel-btn {
		padding: 0.5rem 1.5rem;
		background-color: transparent;
		color: var(--default-text-color-o5);
		border: var(--default-border-visible);
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease-in-out;
	}

	.cancel-btn:hover {
		color: var(--default-text-color-o8);
		border-color: var(--default-text-color-o5);
	}

	.form-group {
		margin-bottom: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-input {
		padding: 0.75rem;
		border: var(--default-border-visible);
		border-radius: 6px;
		background-color: rgba(255, 255, 255, 0.05);
		font-size: 1rem;
		transition: all 0.2s ease-in-out;
	}

	.form-input:focus {
		outline: none;
		border-color: var(--fancycolor-2);
		background-color: rgba(255, 255, 255, 0.08);
	}

	.form-input::placeholder {
		color: var(--default-text-color-o5);
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

	.form-feedback.failure {
		color: #ff6b6b;
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

	.delete-account-section {
		margin-top: 3rem;
		padding: 2.5rem;
		border-radius: 12px;
		background-color: rgba(255, 0, 0, 0.02);
		border: 1px solid #ff6b6b3c;
		backdrop-filter: blur(5px);
		width: 100%;
	}

	.delete-account-section h3 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #ff6b6b;
		margin-bottom: 1rem;
	}

	.delete-account-btn {
		padding: 0.75rem 2rem;
		background-color: transparent;
		color: #ff6b6b;
		border: 2px solid #ff6b6b;
		border-radius: 6px;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s ease-in-out;
	}

	.delete-account-btn:hover {
		background-color: #ff6b6b;
		color: white;
	}

	.delete-account-btn:active {
		transform: scale(0.95);
	}

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: var(--default-bg-color-transparent);
		backdrop-filter: blur(14px);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.modal-content {
		background-color: var(--default-bg-color);
		border-radius: 10px;
		padding: 2rem;
		max-width: 500px;
		width: 90%;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
	}

	.modal-content h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--default-text-color);
		margin-bottom: 1rem;
	}

	.modal-content p {
		color: var(--default-text-color-o8);
		margin-bottom: 1.5rem;
	}

	.modal-form-group {
		margin-bottom: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.modal-form-group label {
		font-weight: 500;
		color: var(--default-text-color);
		font-size: 0.95rem;
	}

	.modal-form-group input {
		padding: 0.75rem;
		border: var(--default-border-visible);
		border-width: 2px;
		border-radius: 6px;
		background-color: rgba(255, 255, 255, 0.05);
		color: var(--default-text-color);
		font-size: 1rem;
		transition: all 0.2s ease-in-out;
		box-sizing: content-box;
	}

	.modal-form-group input:focus {
		outline: none;
		border-color: #ff6b6b;
		border-width: 2px;
		background-color: rgba(255, 255, 255, 0.08);
		box-sizing: content-box;
	}

	.modal-buttons {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
	}

	.modal-btn {
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease-in-out;
		border: none;
	}

	.modal-btn-primary {
		background-color: var(--fancycolor-2);
		color: white;
	}

	.modal-btn-primary:hover {
		opacity: 0.9;
		box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
	}

	.modal-btn-secondary {
		background-color: transparent;
		color: var(--default-text-color-o5);
		border: var(--default-border-visible);
	}

	.modal-btn-secondary:hover {
		color: var(--default-text-color-o8);
		border-color: var(--default-text-color-o5);
	}

	.confirm-modal-content {
		text-align: center;
	}

	.confirm-modal-content h2 {
		font-size: 1.25rem;
		margin-bottom: 1.5rem;
		color: #ff6b6b;
	}

	.confirm-modal-content p {
		margin-bottom: 1.5rem;
		font-size: 1rem;
	}

	.checkbox-group {
		margin-bottom: 2rem;
		padding: 1rem;
		background-color: rgba(255, 255, 255, 0.05);
		border-radius: 6px;
		text-align: left;
	}

	.checkbox-group label {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		cursor: pointer;
		color: var(--default-text-color);
		font-size: 0.95rem;
	}

	.checkbox-group input[type='checkbox'] {
		width: 18px;
		height: 18px;
		cursor: pointer;
	}

	.confirm-buttons {
		display: flex;
		gap: 1rem;
		justify-content: center;
	}

	.confirm-btn-yes {
		padding: 0.75rem 2rem;
		background-color: transparent;
		color: #ff6b6b;
		border: 2px solid #ff6b6b;
		border-radius: 6px;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s ease-in-out;
	}

	.confirm-btn-yes:hover {
		background-color: #ff6b6b;
		color: white;
		box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
	}

	.confirm-btn-yes:active {
		transform: scale(0.95);
	}

	.confirm-btn-no {
		padding: 0.75rem 2rem;
		color: var(--default-text-color-o5);
		border: 2px solid var(--border-colors-visible);
		border-radius: 6px;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s ease-in-out;
	}

	.confirm-btn-no:hover {
		color: var(--default-text-color-o8);
		border-color: var(--default-text-color-o5);
	}

	.confirm-btn-no:active {
		transform: scale(0.95);
	}

	/* Mobile Layout adjustments */
	@media (max-width: 600px) {
		.account-settings-container {
			flex-direction: column;
			align-items: center;
			padding-right: 0;
			text-align: center;
		}

		.account-settings {
			flex-direction: column;
		}

		.account-settings-info {
			align-items: center;
		}

		.form-right {
			width: 100%;
		}

		.sign-out {
			width: 100%;
		}

		.settings-section, .delete-account-section {
			padding: 1.5rem;
			margin-top: 1.5rem;
		}

		.setting-row {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.setting-paragraph {
			font-size: 1rem;
			word-break: break-all;
		}

		.edit-btn {
			width: 100%;
			justify-content: center;
		}

		.edit-inputs {
			flex-direction: column;
		}

		.edit-actions {
			flex-direction: column;
			width: 100%;
		}

		.save-btn, .cancel-btn {
			width: 100%;
			text-align: center;
		}

		.modal-buttons, .confirm-buttons {
			flex-direction: column;
			gap: 0.75rem;
		}

		.modal-btn, .confirm-btn-yes, .confirm-btn-no {
			width: 100%;
		}
	}
</style>
