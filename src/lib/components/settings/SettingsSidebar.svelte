<script lang="ts">
	import type { CanvasData } from '$lib/types/canvas/CanvasData';
	import { validateCanvasData, getBackgroundDefaults } from '$lib/canvas/validation';
	import type { Grid } from '$lib/types/canvas/Grid';
	import type { Color } from '$lib/types/canvas/Color';
	import LucideSymbol from '$lib/components/frontend/LucideSymbol.svelte';
	import { invalidateAll } from '$app/navigation';


	interface Contributor {
		id: number;
		username: string | null;
		permission: string;
	}

	interface Board {
		id: number;
		name: string;
		type: string;
		owner: number;
		canvas?: CanvasData | null;
	}

	interface Props {
		open: boolean;
		board: Board;
		contributors: Contributor[];
		canModify: boolean;
		isOwner: boolean;
		boardId: string;
	}

	let { open = $bindable(), board, contributors: initialContributors, canModify, isOwner, boardId }: Props = $props();

	// svelte-ignore state_referenced_locally
	let contributors = $state(initialContributors);

	// Sync local state when prop changes (e.g. after a page refresh or navigation)
	$effect(() => {
		contributors = initialContributors;
	});

	// Sync settings state when board prop changes
	$effect(() => {
		const vCanvas = validateCanvasData(board.canvas);
		const solidDefault = getBackgroundDefaults('Solid');
		const gridDefault = getBackgroundDefaults('Grid');
		
		settings.boardName = board.name;
		settings.boardType = board.type;
		settings.canvasWidth = vCanvas.size.width;
		settings.canvasHeight = vCanvas.size.height;
		settings.backgroundType = vCanvas.background.type;
		settings.backgroundValue =
			vCanvas.background.type === 'Solid'
				? (vCanvas.background.value as Color).value
				: vCanvas.background.type === 'Custom'
					? vCanvas.background.value
					: (solidDefault.value as Color).value;
		settings.thumbnail = vCanvas.thumbnail?.location;
		settings.gridType =
			vCanvas.background.type === 'Grid'
				? (vCanvas.background.value as Grid).type
				: (gridDefault.value as Grid).type;
		settings.gridColor =
			vCanvas.background.type === 'Grid'
				? (vCanvas.background.value as Grid).color.value
				: (gridDefault.value as Grid).color.value;
		settings.gridLineWidth =
			vCanvas.background.type === 'Grid' &&
			(vCanvas.background.value as Grid).type === 'Line'
				? (vCanvas.background.value as { type: 'Line'; background: Color; width: number; color: Color }).width
				: (gridDefault.value as any).width || 1;
		settings.gridDotSize =
			vCanvas.background.type === 'Grid' &&
			(vCanvas.background.value as Grid).type === 'Dot'
				? (vCanvas.background.value as { type: 'Dot'; background: Color; size: number; color: Color }).size
				: (gridDefault.value as any).size || 20;
		settings.gridBg =
			vCanvas.background.type === 'Grid'
				? (vCanvas.background.value as Grid).background.value
				: (gridDefault.value as Grid).background.value;
	});

	// State for add contributor dialog
	let showAddContributorDialog = $state(false);

	// State for delete dialog
	let showDeleteDialog = $state(false);
	let deleteEmail = $state('');
	let deletePassword = $state('');
	let deleteError = $state('');

	// Active tab
	let activeTab = $state<'general' | 'canvas' | 'contributors' | 'danger'>('general');

	// svelte-ignore state_referenced_locally
	const vCanvas = validateCanvasData(board.canvas);
	const solidDefault = getBackgroundDefaults('Solid');
	const gridDefault = getBackgroundDefaults('Grid');

	// svelte-ignore state_referenced_locally
	let settings = $state({
		boardName: board.name,
		boardType: board.type,
		canvasWidth: vCanvas.size.width,
		canvasHeight: vCanvas.size.height,
		backgroundType: vCanvas.background.type,
		backgroundValue:
			vCanvas.background.type === 'Solid'
				? (vCanvas.background.value as Color).value
				: vCanvas.background.type === 'Custom'
					? vCanvas.background.value
					: (solidDefault.value as Color).value,
		thumbnail: vCanvas.thumbnail?.location,
		gridType:
			vCanvas.background.type === 'Grid'
				? (vCanvas.background.value as Grid).type
				: (gridDefault.value as Grid).type,
		gridColor:
			vCanvas.background.type === 'Grid'
				? (vCanvas.background.value as Grid).color.value
				: (gridDefault.value as Grid).color.value,
		gridLineWidth:
			vCanvas.background.type === 'Grid' &&
			(vCanvas.background.value as Grid).type === 'Line'
				? (vCanvas.background.value as { type: 'Line'; background: Color; width: number; color: Color }).width
				: (gridDefault.value as any).width || 1,
		gridDotSize:
			vCanvas.background.type === 'Grid' &&
			(vCanvas.background.value as Grid).type === 'Dot'
				? (vCanvas.background.value as { type: 'Dot'; background: Color; size: number; color: Color }).size
				: (gridDefault.value as any).size || 20,
		gridBg:
			vCanvas.background.type === 'Grid'
				? (vCanvas.background.value as Grid).background.value
				: (gridDefault.value as Grid).background.value
	});

	let saveStatus = $state<'idle' | 'saving' | 'success' | 'error'>('idle');
	let saveMessage = $state('');

	function buildBackgroundObject(): CanvasData['background'] {
		if (settings.backgroundType === 'Grid') {
			if (settings.gridType === 'Line') {
				return {
					type: 'Grid',
					value: {
						type: 'Line',
						background: { type: 'hex', value: settings.gridBg } as Color,
						width: Number(settings.gridLineWidth ?? 1),
						color: { type: 'hex', value: settings.gridColor } as Color
					}
				};
			} else {
				return {
					type: 'Grid',
					value: {
						type: 'Dot',
						background: { type: 'hex', value: settings.gridBg } as Color,
						size: Number(settings.gridDotSize ?? 20),
						color: { type: 'hex', value: settings.gridColor } as Color
					}
				};
			}
		} else if (settings.backgroundType === 'Solid') {
			return {
				type: 'Solid',
				value: { type: 'hex', value: settings.backgroundValue } as Color
			};
		} else if (settings.backgroundType === 'Image') {
			return {
				type: 'Image',
				value: settings.backgroundValue as unknown as URL
			};
		} else {
			return {
				type: 'Custom',
				value: settings.backgroundValue as string
			};
		}
	}

	async function handleSaveSubmit(e: SubmitEvent) {
		e.preventDefault();
		saveStatus = 'saving';
		const form = new FormData();
		form.append('name', settings.boardName);
		form.append('type', settings.boardType);
		form.append(
			'size',
			JSON.stringify({ width: settings.canvasWidth, height: settings.canvasHeight })
		);
		form.append('thumbnail', settings.thumbnail?.toString() ?? '');
		form.append('background', JSON.stringify(buildBackgroundObject()));

		try {
			const response = await fetch(`/boards/${boardId}/settings?/save`, {
				method: 'POST',
				body: form
			});

			if (response.ok) {
				saveStatus = 'success';
				saveMessage = 'Settings saved!';
				await invalidateAll();
				setTimeout(() => (saveStatus = 'idle'), 2500);
			} else {
				saveStatus = 'error';
				saveMessage = 'Failed to save settings.';
				setTimeout(() => (saveStatus = 'idle'), 3000);
			}
		} catch (error) {
			saveStatus = 'error';
			saveMessage = 'An error occurred.';
			setTimeout(() => (saveStatus = 'idle'), 3000);
		}
	}

	async function removeContributor(userId: number) {
		const formData = new FormData();
		formData.append('userId', userId.toString());

		try {
			const response = await fetch(`/boards/${boardId}/settings?/removeuser`, {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				contributors = contributors.filter((c) => c.id !== userId);
			} else {
				console.error('Failed to remove contributor');
			}
		} catch (error) {
			console.error('Error removing contributor:', error);
		}
	}

	async function handleAddUserSubmit(e: SubmitEvent) {
		e.preventDefault();
		const form = e.target as HTMLFormElement;
		const formData = new FormData(form);

		try {
			const response = await fetch(`/boards/${boardId}/settings?/adduser`, {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				await invalidateAll();
				showAddContributorDialog = false;
				form.reset();
			} else {
				console.error('Failed to add contributor');
			}
		} catch (error) {
			console.error('Error adding contributor:', error);
		}
	}

	async function handleBoardDelete(e: SubmitEvent) {
		e.preventDefault();
		deleteError = '';
		const form = e.target as HTMLFormElement;
		const formData = new FormData(form);

		try {
			const response = await fetch(`/boards/${boardId}/settings?/delete`, {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				window.location.href = '/boards';
			} else {
				// Handle 403 or other errors from SvelteKit error()
				try {
					const data = await response.json();
					deleteError = data.message || 'Incorrect credentials or permission denied';
				} catch (e) {
					deleteError = 'Incorrect credentials or permission denied';
				}
				console.error('Failed to delete board');
			}
		} catch (error) {
			console.error('Error deleting board:', error);
			deleteError = 'A connection error occurred. Please try again.';
		}
	}


</script>

<!-- Settings toggle button is rendered externally; sidebar below -->
<aside class="settings-sidebar" class:open>
		<!-- Header -->
		<div class="sidebar-header">
			<div class="header-title">
				<span>Board Settings</span>
			</div>

		</div>

		<!-- Board name badge -->
		<div class="board-name-badge">
			<span class="board-name-text">{board.name}</span>
			<span class="board-type-badge">{board.type}</span>
		</div>

		<!-- Tabs -->
		<nav class="tabs">
			<button
				class="tab"
				class:active={activeTab === 'general'}
				onclick={() => (activeTab = 'general')}
			>
				General
			</button>
			<button
				class="tab"
				class:active={activeTab === 'canvas'}
				onclick={() => (activeTab = 'canvas')}
			>
				Canvas
			</button>
			{#if canModify}
				<button
					class="tab"
					class:active={activeTab === 'contributors'}
					onclick={() => (activeTab = 'contributors')}
				>
					Contributors
				</button>
			{/if}
			{#if isOwner}
				<button
					class="tab danger-tab"
					class:active={activeTab === 'danger'}
					onclick={() => (activeTab = 'danger')}
				>
					Danger
				</button>
			{/if}
		</nav>

		<!-- Content -->
		<div class="sidebar-content">
			{#if activeTab === 'general' || activeTab === 'canvas'}
				{#if !canModify}
					<div class="read-only-banner">
						<LucideSymbol symbol="CircleAlert" size={14} />

						Read-only — you cannot modify settings.
					</div>
				{/if}

				<form onsubmit={handleSaveSubmit}>
					{#if activeTab === 'general'}
						<!-- General Settings -->
						<div class="form-group">
							<label class="form-label" for="boardName">Board Name</label>
							<input
								id="boardName"
								class="form-input"
								type="text"
								name="boardName"
								bind:value={settings.boardName}
								disabled={!canModify}
							/>
						</div>

						<div class="form-group">
							<label class="form-label" for="boardType">Visibility</label>
							<select
								id="boardType"
								class="form-select"
								bind:value={settings.boardType}
								disabled={!canModify}
							>
								<option value="Public">Public</option>
								<option value="Private">Private</option>
								<option value="Unlisted">Unlisted</option>
							</select>
						</div>

						<div class="form-group">
							<label class="form-label" for="thumbnail">Thumbnail Image URL</label>
							<input
								id="thumbnail"
								class="form-input"
								type="text"
								name="thumbnail"
								placeholder="https://example.com/image.png"
								bind:value={settings.thumbnail}
								disabled={!canModify}
							/>
						</div>
					{:else if activeTab === 'canvas'}
						<!-- Canvas Settings -->
						<div class="form-row">
							<div class="form-group">
								<label class="form-label" for="canvasWidth">Width (px)</label>
								<input
									id="canvasWidth"
									class="form-input"
									type="number"
									name="canvasWidth"
									bind:value={settings.canvasWidth}
									disabled={!canModify}
								/>
							</div>
							<div class="form-group">
								<label class="form-label" for="canvasHeight">Height (px)</label>
								<input
									id="canvasHeight"
									class="form-input"
									type="number"
									name="canvasHeight"
									bind:value={settings.canvasHeight}
									disabled={!canModify}
								/>
							</div>
						</div>

						<div class="form-group">
							<label class="form-label" for="backgroundType">Background Type</label>
							<select
								id="backgroundType"
								class="form-select"
								bind:value={settings.backgroundType}
								disabled={!canModify}
							>
								<option value="Solid">Solid Color</option>
								<option value="Image">Image</option>
								<option value="Grid">Grid</option>
								<option value="Custom">Custom CSS</option>
							</select>
						</div>

						{#if settings.backgroundType === 'Solid'}
							<div class="form-group">
								<label class="form-label" for="bgColor">Color (Hex)</label>
								<div class="color-input-row">
									<div class="colors-swatch-div">
										<input
											type="color"
											class="color-swatch"
											value={settings.backgroundValue?.toString() ?? '#ffffff'}
											oninput={(e) => (settings.backgroundValue = (e.target as HTMLInputElement).value)}
											disabled={!canModify}
										/>
									</div>
									<input
										id="bgColor"
										class="form-input"
										type="text"
										placeholder="#ffffff"
										bind:value={settings.backgroundValue}
										disabled={!canModify}
									/>
								</div>
							</div>
						{:else if settings.backgroundType === 'Image'}
							<div class="form-group">
								<label class="form-label" for="bgImage">Image URL</label>
								<input
									id="bgImage"
									class="form-input"
									type="url"
									bind:value={settings.backgroundValue}
									disabled={!canModify}
								/>
							</div>
						{:else if settings.backgroundType === 'Grid'}
							<div class="form-group">
								<label class="form-label" for="gridType">Grid Style</label>
								<select
									id="gridType"
									class="form-select"
									bind:value={settings.gridType}
									disabled={!canModify}
								>
									<option value="Dot">Dots</option>
									<option value="Line">Lines</option>
								</select>
							</div>
							<div class="form-row">
								<div class="form-group">
									<label class="form-label" for="gridColor">Grid Color</label>
									<div class="color-input-row">
										<div class="colors-swatch-div">
											<input
												type="color"
												class="color-swatch"
												value={settings.gridColor ?? '#cccccc'}
												oninput={(e) => (settings.gridColor = (e.target as HTMLInputElement).value)}
												disabled={!canModify}
											/>
										</div>
										<input
											id="gridColor"
											class="form-input"
											type="text"
											placeholder="#cccccc"
											bind:value={settings.gridColor}
											disabled={!canModify}
										/>
									</div>
								</div>
								<div class="form-group">
									<label class="form-label" for="gridBg">Background</label>
									<div class="color-input-row">
										<div class="colors-swatch-div">
											<input
												type="color"
												class="color-swatch"
												value={settings.gridBg ?? '#ffffff'}
												oninput={(e) => (settings.gridBg = (e.target as HTMLInputElement).value)}
												disabled={!canModify}
											/>
										</div>
										<input
											id="gridBg"
											class="form-input"
											type="text"
											placeholder="#ffffff"
											bind:value={settings.gridBg}
											disabled={!canModify}
										/>
									</div>
								</div>
							</div>
							{#if settings.gridType === 'Line'}
					<div class="form-group">
						<label class="form-label" for="gridLineWidth">Line Width (px)</label>
						<input
							id="gridLineWidth"
							class="form-input"
							type="number"
							min="1"
							max="20"
							bind:value={settings.gridLineWidth}
							disabled={!canModify}
						/>
					</div>
				{:else}
					<div class="form-group">
						<label class="form-label" for="gridDotSize">Dot Size (px)</label>
						<input
							id="gridDotSize"
							class="form-input"
							type="number"
							min="2"
							max="50"
							bind:value={settings.gridDotSize}
							disabled={!canModify}
						/>
					</div>
				{/if}
						{:else if settings.backgroundType === 'Custom'}
							<div class="form-group">
								<label class="form-label" for="customCss">Custom CSS</label>
								<textarea
									id="customCss"
									class="form-textarea"
									bind:value={settings.backgroundValue}
									disabled={!canModify}
									placeholder="e.g. conic-gradient(#dc57af 90deg, ...)"
								></textarea>
							</div>
						{/if}
					{/if}

					{#if canModify}
						<div class="form-actions">
							{#if saveStatus === 'success'}
								<span class="save-msg success"><LucideSymbol symbol="Check" size={14} /> {saveMessage}</span>
							{:else if saveStatus === 'error'}
								<span class="save-msg error"><LucideSymbol symbol="X" size={14} /> {saveMessage}</span>
							{/if}

							<button type="submit" class="btn-primary" disabled={saveStatus === 'saving'}>
								{saveStatus === 'saving' ? 'Saving…' : 'Save Settings'}
							</button>
						</div>
					{/if}
				</form>

			{:else if activeTab === 'contributors'}
				<div class="contributors-section">
					<div class="section-header">
						<h3 class="section-title">Members</h3>
						{#if canModify}
							<button class="btn-secondary small" onclick={() => (showAddContributorDialog = true)}>
								<LucideSymbol symbol="Plus" size={16} strokeWidth={2}/> 
								<span style="font-size: 0.8rem; font-weight: 700;">Add</span>
							</button>

						{/if}
					</div>

					{#if contributors.length === 0}
						<p class="empty-state">No contributors yet.</p>
					{:else}
						<ul class="contributor-list">
							{#each contributors as contributor (contributor.id)}
								<li class="contributor-item">
									<div class="contributor-avatar">
										{(contributor.username?.[0] ?? 'U').toUpperCase()}
									</div>
									<div class="contributor-info">
										<span class="contributor-name">{contributor.username ?? 'Unknown'}</span>
										<span class="contributor-perm">{contributor.permission}</span>
									</div>
									{#if canModify}
										<button
											class="btn-danger small"
											onclick={() => removeContributor(contributor.id)}
											aria-label="Remove contributor"
										>
											<LucideSymbol symbol="Trash2" size={14} />

										</button>
									{/if}
								</li>
							{/each}
						</ul>
					{/if}
				</div>

				{#if showAddContributorDialog}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="modal-backdrop" onclick={() => (showAddContributorDialog = false)}>
						<div class="modal" onclick={(e) => e.stopPropagation()}>
							<h3 class="modal-title">Add Contributor</h3>
							<form onsubmit={handleAddUserSubmit}>
								<div class="form-group">
									<label class="form-label" for="addUsername">Username</label>
									<input
										id="addUsername"
										class="form-input"
										type="text"
										name="username"
										required
									/>
								</div>
								<div class="form-group">
									<label class="form-label" for="addPermission">Permission</label>
									<select id="addPermission" class="form-select" name="permission" required>
										<option value="Read" selected>Read</option>
										<option value="Write">Write</option>
									</select>
								</div>
								<div class="modal-actions">
									<button
										type="button"
										class="btn-secondary"
										onclick={() => (showAddContributorDialog = false)}>Cancel</button
									>
									<button type="submit" class="btn-primary">Add</button>
								</div>
							</form>
						</div>
					</div>
				{/if}

			{:else if activeTab === 'danger'}
				<div class="danger-zone">
					<div class="danger-header">
						<LucideSymbol symbol="TriangleAlert" size={18} />

						<h3>Danger Zone</h3>
					</div>
					<p class="danger-desc">
						Permanently delete this board and all its content. This action cannot be undone.
					</p>
					<button class="btn-danger" onclick={() => (showDeleteDialog = true)}>
						Delete Board
					</button>

					{#if showDeleteDialog}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div class="modal-backdrop" onclick={() => (showDeleteDialog = false)}>
							<div class="modal modal-danger" onclick={(e) => e.stopPropagation()}>
								<h3 class="modal-title">Confirm Board Deletion</h3>
								<p class="modal-desc">
									This action is permanent. Enter your credentials to confirm.
								</p>
								
								{#if deleteError}
									<div class="delete-error-banner">
										{deleteError}
									</div>
								{/if}

								<form onsubmit={handleBoardDelete}>
									<div class="form-group">
										<label class="form-label" for="deleteEmail">Email</label>
										<input
											id="deleteEmail"
											class="form-input"
											type="email"
											name="email"
											bind:value={deleteEmail}
											required
										/>
									</div>
									<div class="form-group">
										<label class="form-label" for="deletePassword">Password</label>
										<input
											id="deletePassword"
											class="form-input"
											type="password"
											name="password"
											bind:value={deletePassword}
											required
										/>
									</div>
									<div class="modal-actions">
										<button
											type="button"
											class="btn-secondary"
											onclick={() => (showDeleteDialog = false)}>Cancel</button
										>
										<button type="submit" class="btn-danger">Delete Permanently</button>
									</div>
								</form>
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</aside>

<style>
	.settings-sidebar {
		position: fixed;
		top: 0;
		right: 0;
		width: 360px;
		height: 100vh;
		display: flex;
		flex-direction: column;
		background: var(--editor-interface-background, rgba(20, 20, 30, 0.92));
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border-left: 1px solid var(--editor-interface-border, rgba(255, 255, 255, 0.1));
		overflow: hidden;
		z-index: 900;
		transform: translateX(100%);
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		pointer-events: none;
	}

	.settings-sidebar.open {
		transform: translateX(0);
		pointer-events: auto;
	}

	/* Header */
	.sidebar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 18px 20px 14px;
		border-bottom: 1px solid var(--editor-interface-border, rgba(255, 255, 255, 0.08));
		flex-shrink: 0;
	}

	.header-title {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--default-text-color);
		letter-spacing: 0.01em;
	}





	/* Board name badge */
	.board-name-badge {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		padding: 10px 20px;
		border-bottom: 1px solid var(--editor-interface-border, rgba(255, 255, 255, 0.06));
		flex-shrink: 0;
	}

	.board-name-text {
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--default-text-color);
		opacity: 0.75;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 220px;
	}

	.board-type-badge {
		font-size: 0.65rem;
		font-weight: 600;
		padding: 2px 8px;
		border-radius: 999px;
		background: var(--fancygradient, linear-gradient(135deg, #6c63ff, #a855f7));
		color: #fff;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		flex-shrink: 0;
		float: right;
	}

	/* Tabs */
	.tabs {
		display: flex;
		gap: 2px;
		padding: 10px 12px 0;
		border-bottom: 1px solid var(--editor-interface-border, rgba(255, 255, 255, 0.06));
		flex-shrink: 0;
	}

	.tab {
		padding: 7px 14px;
		border: none;
		background: transparent;
		color: var(--default-text-color);
		font-size: 0.78rem;
		font-weight: 500;
		cursor: pointer;
		border-radius: 6px 6px 0 0;
		opacity: 0.5;
		transition: opacity 0.15s, background 0.15s;
		position: relative;
	}

	.tab:hover {
		opacity: 0.8;
		background: var(--default-blur-hover-color, rgba(255, 255, 255, 0.05));
	}

	.tab.active {
		opacity: 1;
		background: var(--default-blur-color, rgba(255, 255, 255, 0.08));
	}

	.tab.active::after {
		content: '';
		position: absolute;
		bottom: -1px;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--fancygradient, linear-gradient(90deg, #6c63ff, #a855f7));
		border-radius: 2px 2px 0 0;
	}

	.tab.danger-tab.active::after {
		background: linear-gradient(90deg, #ef4444, #dc2626);
	}

	.tab.danger-tab {
		color: #f87171;
	}

	/* Scrollable content */
	.sidebar-content {
		flex: 1;
		overflow-y: auto;
		padding: 20px;
		scrollbar-width: thin;
		scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
	}

	.sidebar-content::-webkit-scrollbar {
		width: 4px;
	}

	.sidebar-content::-webkit-scrollbar-track {
		background: transparent;
	}

	.sidebar-content::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 2px;
	}

	/* Form elements */
	.form-group {
		margin-bottom: 16px;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}

	.form-label {
		display: block;
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--default-text-color);
		opacity: 0.6;
		margin-bottom: 6px;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	.form-input,
	.form-select,
	.form-textarea {
		width: 100%;
		box-sizing: border-box;
		padding: 9px 12px;
		background: var(--default-blur-color, rgba(255, 255, 255, 0.05));
		border: 1px solid var(--editor-interface-border, rgba(255, 255, 255, 0.1));
		border-radius: 8px;
		color: var(--default-text-color);
		font-size: 0.85rem;
		outline: none;
		transition: border-color 0.15s;
	}

	.form-input:focus,
	.form-select:focus,
	.form-textarea:focus {
		border-color: rgba(108, 99, 255, 0.6);
	}

	.form-input:disabled,
	.form-select:disabled,
	.form-textarea:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.form-textarea {
		min-height: 100px;
		resize: vertical;
		font-family: 'Fira Mono', monospace;
		font-size: 0.78rem;
	}

	.form-select option {
		background: #1e1e2e;
	}

	.color-input-row {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.colors-swatch-div {
		width: 3rem;
		aspect-ratio: 1;
		border-radius: 8px;
		border: 1px solid var(--editor-interface-border, rgba(255, 255, 255, 0.1));
		overflow: hidden;
	}

	.color-swatch {
		width: 120%;
		height: 120%;
		margin: -10%;
		border-radius: 8px;
		cursor: pointer;
		background: none;
	}

	.color-swatch:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	/* Buttons */
	.btn-primary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 9px 18px;
		background: var(--fancygradient, linear-gradient(135deg, #6c63ff, #a855f7));
		color: #fff;
		border: none;
		border-radius: 8px;
		font-size: 0.83rem;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.15s, transform 0.1s;
	}

	.btn-primary:hover:not(:disabled) {
		opacity: 0.88;
	}

	.btn-primary:active:not(:disabled) {
		transform: scale(0.97);
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-secondary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 9px 16px;
		background: var(--default-blur-color, rgba(255, 255, 255, 0.07));
		color: var(--default-text-color);
		border: 1px solid var(--editor-interface-border, rgba(255, 255, 255, 0.1));
		border-radius: 8px;
		font-size: 0.83rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s;
	}

	.btn-secondary:hover {
		background: var(--default-blur-hover-color, rgba(255, 255, 255, 0.12));
	}

	.btn-secondary.small {
		display: flex;
		padding: 5px 12px;
		font-size: 0.76rem;
		gap: 4px;
		align-items: center;
		justify-content: center;

	}

	.btn-danger {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 9px 18px;
		background: rgba(239, 68, 68, 0.15);
		color: #f87171;
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 8px;
		font-size: 0.83rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s;
	}

	.btn-danger:hover {
		background: rgba(239, 68, 68, 0.25);
	}

	.btn-danger.small {
		padding: 5px 10px;
		font-size: 0.78rem;
	}



	/* Form actions */
	.form-actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 12px;
		margin-top: 8px;
		padding-top: 16px;
		border-top: 1px solid var(--editor-interface-border, rgba(255, 255, 255, 0.06));
	}

	.save-msg {
		font-size: 0.78rem;
		font-weight: 500;
	}

	.save-msg.success {
		color: #4ade80;
	}

	.save-msg.error {
		color: #f87171;
	}

	.delete-error-banner {
		padding: 10px 14px;
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.2);
		border-radius: 8px;
		font-size: 0.78rem;
		color: #f87171;
		font-weight: 500;
	}

	/* Read-only banner */
	.read-only-banner {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 14px;
		background: rgba(250, 204, 21, 0.08);
		border: 1px solid rgba(250, 204, 21, 0.2);
		border-radius: 8px;
		font-size: 0.78rem;
		color: #fbbf24;
		margin-bottom: 16px;
	}



	/* Contributors */
	.contributors-section {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.section-title {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--default-text-color);
		margin: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
	}

	.contributor-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.contributor-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 12px;
		background: var(--default-blur-color, rgba(255, 255, 255, 0.04));
		border: 1px solid var(--editor-interface-border, rgba(255, 255, 255, 0.06));
		border-radius: 10px;
	}

	.contributor-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: var(--fancygradient, linear-gradient(135deg, #6c63ff, #a855f7));
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.78rem;
		font-weight: 700;
		color: #fff;
		flex-shrink: 0;
	}

	.contributor-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.contributor-name {
		font-size: 0.83rem;
		font-weight: 500;
		color: var(--default-text-color);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.contributor-perm {
		font-size: 0.68rem;
		color: var(--default-text-color);
		opacity: 0.5;
	}

	.empty-state {
		font-size: 0.82rem;
		opacity: 0.45;
		text-align: center;
		padding: 24px 0;
	}

	/* Danger zone */
	.danger-zone {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.danger-header {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.danger-header h3 {
		margin: 0;
		font-size: 0.9rem;
		font-weight: 700;
		color: #f87171;
	}



	.danger-desc {
		font-size: 0.8rem;
		color: var(--default-text-color);
		opacity: 0.6;
		line-height: 1.5;
		margin: 0;
	}

	/* Modal */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		z-index: 2000;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.modal {
		background: var(--default-bg-color, #1a1a2e);
		border: 1px solid var(--editor-interface-border, rgba(255, 255, 255, 0.12));
		border-radius: 14px;
		padding: 24px;
		width: 320px;
		max-width: 90vw;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.modal-danger {
		border-color: rgba(239, 68, 68, 0.3);
	}

	.modal-title {
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--default-text-color);
		margin: 0;
	}

	.modal-desc {
		font-size: 0.8rem;
		color: var(--default-text-color);
		opacity: 0.6;
		margin: 0;
		line-height: 1.5;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
	}
</style>
