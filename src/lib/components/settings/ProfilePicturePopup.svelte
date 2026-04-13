<script lang="ts">
	import LucideSymbol from "../frontend/LucideSymbol.svelte";

	interface Props {
		user: { username: string; id: number };
		profilePictures: { id: number; date: Date; hash: string }[];
		onClose: () => void;
	}

	const { user, profilePictures, onClose }: Props = $props();

	let uploading = $state(false);

	// Current picture is the latest (first in array)
	const currentPfp = $derived(
		profilePictures && profilePictures.length > 0 ? profilePictures[0] : null
	);

	// Previous pictures are the rest (up to 5)
	const previousPfps = $derived(profilePictures.slice(1, 6));

	function getCurrentPfpUrl(): string {
		if (currentPfp?.hash) {
			return `/api/files/${currentPfp.hash}`;
		}
		return `https://ui-avatars.com/api/?name=${user.username}&background=random`;
	}

	function getPfpUrl(hash: string): string {
		return `/api/files/${hash}`;
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

			if (pfpRes.ok) {
				window.location.reload();
			}
		} catch (err) {
			console.error('File upload error:', err);
			alert('Failed to upload profile picture. Please try again.');
		} finally {
			uploading = false;
		}
	}
</script>

<div
	class="modal-overlay"
	role="button"
	tabindex="0"
	onclick={onClose}
	onkeydown={e => {
		if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
			onClose();
		}
	}}
>
	<div
		class="modal-content"
		role="dialog"
		tabindex="0"
		onclick={e => e.stopPropagation()}
		onkeydown={e => e.stopPropagation()}
	>
		<div class="modal-header">
			<h2>Change Profile Picture</h2>
			<button class="close-btn" onclick={onClose}><LucideSymbol symbol="X" size={24} strokeWidth={2} /></button>
		</div>

		<div class="pfp-popup-body">
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
							<div class="pfp-item">
								<button
									type="button"
									class="pfp-button"
									title="Set as profile picture"
									onclick={async () => {
										const formData = new FormData();
										formData.append('id', pfp.id.toString());
										const res = await fetch('?/setPfp', {
											method: 'POST',
											body: formData
										});
										if (res.ok) window.location.reload();
									}}
								>
									<img src={getPfpUrl(pfp.hash)} alt="Previous profile option" class="pfp-thumbnail" />
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
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
		padding-top: 1.5rem;
		max-width: 500px;
		width: 90%;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.modal-header h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--default-text-color);
		margin: 0;
	}

	.close-btn {
		background: none;
		border: none;
		color: var(--default-text-color);
		cursor: pointer;
		opacity: 0.5;
		transition: opacity 0.2s;
		height: fit-content;
	}

	.close-btn:hover {
		opacity: 1;
	}

	.pfp-popup-body {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.current-pfp {
		display: flex;
		justify-content: center;
	}

	.current-pfp-img {
		width: 180px;
		height: 180px;
		border-radius: 50%;
		object-fit: cover;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		border: 4px solid rgba(255, 255, 255, 0.1);
	}

	.upload-section {
		border: 2px dashed var(--fancycolor-2);
		border-radius: 8px;
		text-align: center;
		background-color: rgba(255, 255, 255, 0.02);
		transition: all 0.2s ease;
	}

	.upload-section:hover {
		background-color: rgba(255, 255, 255, 0.05);
		border-color: var(--fancycolor-3);
	}

	.upload-label {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		font-weight: 500;
		color: var(--fancycolor-2);
		padding: 1rem 1rem;
		width: 100%;
		transition: color 0.2s;
	}

	.upload-label:hover {
		color: var(--fancycolor-3);
	}

	.file-input {
		display: none;
	}

	.uploading-text {
		padding-bottom: 1.5rem;
		color: var(--default-text-color);
		opacity: 0.7;
		font-size: 0.9rem;
	}

	.previous-pfps h4 {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--default-text-color);
		margin-bottom: 1rem;
		opacity: 0.7;
	}

	.pfps-row {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		justify-content: center;
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
		transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		border: 2px solid transparent;
	}

	.pfp-button:hover {
		transform: scale(1.1);
		box-shadow: 0 4px 12px rgba(204, 204, 204, 0.2);
		border-color: var(--fancycolor-2);
	}

	.pfp-thumbnail {
		width: 60px;
		height: 60px;
		object-fit: cover;
		display: block;
	}
</style>
