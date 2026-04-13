<script lang="ts">
	import { enhance } from '$app/forms';
	import LucideSymbol from '$lib/components/frontend/LucideSymbol.svelte';
	import { notifications } from '$lib/stores/notifications';
	
	let dialog: HTMLDialogElement;
	let error = $state('');

	export function show() {
		dialog.showModal();
	}

	export function close() {
		error = '';
		dialog.close();
	}

	function handleEnhance() {
		return async ({ result, update }: any) => {
			if (result.type === 'failure') {
				error = result.data?.message || 'Failed to create board';
			} else {
				close();
				notifications.add({
					title: 'Board Created!',
					message: 'Your new board is ready to go.',
					type: 'success'
				});
				await update();
			}
		};
	}
</script>

<dialog bind:this={dialog} onclose={() => close()}>
	<div class="modal-content">
		<div class="modal-header">
			<h2>Create new board</h2>
			<button type="button" class="close-btn" onclick={close} aria-label="Close dialog">
				<LucideSymbol symbol="X" size={24} strokeWidth={1.5} />
			</button>
		</div>

		<form method="post" action="/boards/new?/create" use:enhance={handleEnhance}>
			<div class="form-group">
				<label for="name">Board name</label>
				<input type="text" id="name" name="name" placeholder="Enter board name" required autocomplete="off" />
			</div>
			
			<div class="form-group">
				<label for="access">Privacy level</label>
				<div class="custom-select">
					<select name="access" id="access_select">
						<option value="Private" selected>Private</option>
						<option value="Unlisted">Unlisted</option>
						<option value="Public">Public</option>
					</select>
					<div class="select-icon">
						<LucideSymbol symbol="ChevronDown" size={16} strokeWidth={2} />
					</div>
				</div>
			</div>

			{#if error}
				<p class="error-message">{error}</p>
			{/if}

			<div class="modal-actions">
				<button type="button" class="btn-secondary" onclick={close}>Cancel</button>
				<button type="submit" class="btn-primary">Create Board</button>
			</div>
		</form>
	</div>
</dialog>

<style>
	dialog {
		padding: 0;
		border: none;
		border-radius: var(--border-radius, 12px);
		background: transparent;
		color: var(--default-text-color, #e2e8f0);
		width: 100%;
		height: 100%;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
		z-index: 10;
	}

	dialog[open] {
		display: flex;
		align-items: center;
		justify-content: center;
		animation: fadeDialog 0.3s ease-out forwards;
	}

	@keyframes fadeDialog {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	dialog::backdrop {
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		animation: fadeBackdrop 0.3s ease-out forwards;
	}

	@keyframes fadeBackdrop {
		from { opacity: 0; backdrop-filter: blur(0px); }
		to { opacity: 1; backdrop-filter: blur(4px); }
	}

	dialog[open] .modal-content {
		animation: modalScaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	@keyframes modalScaleUp {
		from { opacity: 0; transform: scale(0.96); }
		to { opacity: 1; transform: scale(1); }
	}

	.modal-content {
		background-color: var(--default-bg-color, #1a202c);
		border: 1px solid var(--default-stroke-color, #2d3748);
		border-radius: var(--border-radius, 12px);
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		max-width: 450px;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.close-btn {
		background: transparent;
		border: none;
		color: var(--default-text-color);
		opacity: 0.6;
		cursor: pointer;
		padding: 0.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
		transition: all 0.2s ease;
	}

	.close-btn:hover {
		opacity: 1;
		background: var(--default-stroke-color, rgba(255, 255, 255, 0.1));
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	label {
		font-size: 0.875rem;
		font-weight: 500;
		opacity: 0.9;
	}

	input[type="text"], select {
		width: 100%;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		border: 1px solid var(--default-stroke-color, #4a5568);
		background-color: rgba(0, 0, 0, 0.1);
		color: var(--default-text-color);
		font-size: 1rem;
		transition: all 0.2s ease;
		appearance: none;
		outline: none;
	}
	
	select option {
		background-color: var(--default-bg-color, #1a202c);
		color: var(--default-text-color);
	}

	input[type="text"]:focus, select:focus {
		border-color: #3182ce;
		box-shadow: 0 0 0 2px rgba(49, 130, 206, 0.2);
	}

	.custom-select {
		position: relative;
	}

	.select-icon {
		position: absolute;
		right: 1rem;
		top: 50%;
		transform: translateY(-50%);
		pointer-events: none;
		opacity: 0.7;
	}

	.error-message {
		color: #fc8181;
		font-size: 0.875rem;
		margin: 0;
	}

	.modal-actions {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	button {
		padding: 0.625rem 1.25rem;
		border-radius: 8px;
		font-size: 0.95rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-secondary {
		background: transparent;
		border: 1px solid var(--default-stroke-color, #4a5568);
		color: var(--default-text-color);
	}

	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.btn-primary {
		background: #3182ce;
		border: none;
		color: white;
	}

	.btn-primary:hover {
		background: #2b6cb0;
	}
</style>
