<script lang="ts">
	// components
	import Note from '$lib/components/canvas/Note.svelte';
	import FancyButton1 from '$lib/components/buttons/FancyButton1.svelte';
	import Canvas from '$lib/components/canvas/Canvas.svelte';
	import MiniViewport from '$lib/components/canvas/MiniViewport.svelte';
	import SettingsSidebar from '$lib/components/settings/SettingsSidebar.svelte';
	import LucideSymbol from '$lib/components/frontend/LucideSymbol.svelte';

	// types and utils
	import type { NotesRecord } from '$lib/types/canvas/NoteData';
	import type { Color } from '$lib/types/canvas/Color';
	import { initializeZIndex } from '$lib/stores/noteZIndex';
	import { position, getViewportCenter, getScrollFromCenter } from '$lib/stores/viewport';
	import { zoomLevel } from '$lib/stores/zoomLevel';
	import { get } from 'svelte/store';
	import { generateSecureRandomString } from '$lib/randomString';
	import { validateCanvasData } from '$lib/canvas/validation';
	import { notifications } from '$lib/stores/notifications';

	import type { PageProps } from './$types';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	const { params, data, form }: PageProps = $props();

	let dialog = null! as HTMLDialogElement;
	let settingsOpen = $state(false);

	let contextMenuData = $state<{
		show: boolean;
		x: number;
		y: number;
		canvasX: number;
		canvasY: number;
	}>({
		show: false,
		x: 0,
		y: 0,
		canvasX: 0,
		canvasY: 0
	});

	let newNoteTitle = $state('');
	let newNoteColor = $state('#1e1e1e');

	const id = $derived(data.id);
	const user = $derived(data.user);
	const board = $derived(data.board);
	const perms = $derived(data.perms);
	const hasWritePermission = $derived(
		board && (board.owner === user?.id || perms?.perm === 'Write')
	);

	function handleCanvasContextMenu(e: MouseEvent, canvasX: number, canvasY: number) {
		if (!hasWritePermission) return;
		contextMenuData = {
			show: true,
			x: e.clientX,
			y: e.clientY,
			canvasX,
			canvasY
		};
		newNoteTitle = '';
		newNoteColor = '#1e1e1e';
	}

	function closeContextMenu() {
		contextMenuData.show = false;
	}

	function addNoteFromCtx(e?: Event) {
		if (e) e.stopPropagation();

		// Check if color is valid before adding note
		if (!newNoteColor) {
			notifications.add({
				title: 'Invalid Color',
				message: 'Please select a valid color',
				type: 'error'
			});
			return;
		}

		const title = newNoteTitle.trim() || null;
		const color: Color = { type: 'hex', value: newNoteColor };

		const id = generateSecureRandomString();
		notes[id] = {
			id,
			title,
			position: { x: contextMenuData.canvasX, y: contextMenuData.canvasY, z: 0 },
			size: { width: 200, height: 200 },
			color,
			content: ['']
		};

		contextMenuData.show = false;
	}

	// svelte-ignore state_referenced_locally
	let notes = $state<NotesRecord>(data.board?.notes!);

	// filter out records where value is null
	let validNotes = $derived.by<NotesRecord>(() =>
		Object.fromEntries(Object.entries(notes).filter(([_, value]) => value !== null))
	);

	onMount(() => {
		document.title = `Evinote • ${board?.name ?? 'Loading...'}`;

		dialog = document.getElementById('add-dialog') as HTMLDialogElement;
		console.log(dialog);

		try {
			const saved = localStorage.getItem(`board-${id}-viewport`);
			if (saved) {
				const { centerX, centerY, zoom, left, top } = JSON.parse(saved);

				// Restore zoom first to ensure correct scroll dimensions
				if (zoom) zoomLevel.set(zoom);

				// Calculate scroll from center if available, fallback to old left/top format
				if (centerX !== undefined && centerY !== undefined) {
					// Use a small timeout to let the canvas resize after zoom before centering
					setTimeout(() => {
						const scroll = getScrollFromCenter(centerX, centerY, zoom || 1);
						position.setPosition(scroll.left, scroll.top);
					}, 50);
				} else if (left !== undefined && top !== undefined) {
					position.setPosition(left, top);
				}
			}
		} catch (err) {
			console.error('Failed to parse viewport from localStorage:', err);
			notifications.add({
				title: 'Viewport Error',
				message: 'Could not restore previous viewport position',
				type: 'error'
			});
		}

		// Check if data loaded correctly or has an error
		if (data.error) {
			notifications.add({
				title: 'Board Error',
				message: data.error,
				type: 'error'
			});
		} else if (!data.board) {
			notifications.add({
				title: 'Loading Issue',
				message: 'Some board data might be missing.',
				type: 'error'
			});
		}

		// Expose notes to window for debugging in dev mode
		(window as any).notes = notes;

		const saveOnUnload = () => {
			const currentZoom = get(zoomLevel);
			const { centerX, centerY } = getViewportCenter(currentZoom);

			localStorage.setItem(
				`board-${id}-viewport`,
				JSON.stringify({
					centerX,
					centerY,
					zoom: currentZoom
				})
			);
			console.log('saved center-point/zoom to localStorage', { centerX, centerY }, currentZoom);
		};

		const handleWindowClick = () => closeContextMenu();

		window.addEventListener('beforeunload', saveOnUnload);
		window.addEventListener('click', handleWindowClick);
		return () => {
			window.removeEventListener('beforeunload', saveOnUnload);
			window.removeEventListener('click', handleWindowClick);
		};
	});

	// set localstorage variable on unload

	// function saveNotes() {
	// 	// ok how do i
	// 	// uhh
	// 	// wait holon id just use a form for it i think
	// 	// so what else needs work now...
	// 	// adding note-sub components to notes (more related to notes though)
	// 	// programmatically extracing the data from said notes thing
	// 	// make this fucking thing be hidden for once god damn it
	// 	//
	// }

	$effect(() => {
		const notesArray = Object.values(notes);
		if (notesArray.length > 0)
			initializeZIndex(notesArray.filter(n => typeof n === 'object' && n !== null));
		$inspect(notes);
	});

	async function saveNotes() {
		if (hasWritePermission) {
			const form = new FormData();

			// Filter out null notes before saving

			form.append('notes', JSON.stringify(notes));

			console.log('notes before sendoff', $state.snapshot(notes));
			const req = await fetch('?/save', {
				method: 'POST',
				body: form
			});

			const body = await req.json();

			if (req.ok && body.type === 'success') {
				notifications.add({
					title: 'Saved',
					message: 'Board notes updated successfully',
					type: 'success'
				});
			} else {
				const errorText = await req.text();
				notifications.add({
					title: 'Error Saving',
					message: errorText || 'An unknown error occurred while saving.',
					type: 'error'
				});
			}
		}
	}
	function handleKeydown(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
			e.preventDefault();
			saveNotes();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Canvas viewport wrapper — shrinks when sidebar is open -->
<div class="canvas-viewport" class:sidebar-open={settingsOpen}>
	<div class="board-title-container">
		<div class="board-title">
			<LucideSymbol symbol="Layout" size={16} strokeWidth={2} />
			<span>{board?.name ?? 'Loading...'}</span>
		</div>
	</div>

	<!-- if perms then check for write or if board.owner == perm.uid, otherwise check for board.owner = checkLogin().id-->
	{#if hasWritePermission}
		<div class="note-creator">
			<form
				method="post"
				id="save-notes-form"
				onsubmit={e => {
					e.preventDefault();
					saveNotes();
				}}
			>
				<button type="submit" class="save-button" title="Save notes (Ctrl+S)">
					<LucideSymbol symbol="Save" size={16} strokeWidth={2} />
					<span>Save</span>
				</button>
			</form>
		</div>
	{/if}

	<Canvas data={validateCanvasData(data.board?.canvas)} contextmenu={handleCanvasContextMenu}>
		{@const gridSnap = 5}
		{console.log('rendering canvas with notes', validNotes)}
		{#each Object.values(validNotes) as note (note?.id)}
			{console.log('added note', note)}
			<Note
				bind:data={notes[note!.id]!}
				{gridSnap}
				remove={() => {
					// set value of note at key 'id' to null
					notes[note!.id] = null;
				}}
				readonly={!hasWritePermission}
			/>
		{/each}

		{#if contextMenuData.show}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="canvas-context-menu"
				style:left="{contextMenuData.canvasX}px"
				style:top="{contextMenuData.canvasY}px"
				style="--menu-transform-base: translate(-50%, calc(-100% - 12px))"
				style:transform="var(--menu-transform-base)"
				onclick={e => e.stopPropagation()}
				oncontextmenu={e => {
					e.preventDefault();
					e.stopPropagation();
				}}
			>
				<div class="ctx-header">New Note</div>
				<input
					type="text"
					bind:value={newNoteTitle}
					placeholder="Enter title..."
					class="ctx-input"
					autofocus
					onkeydown={e => {
						if (e.key === 'Enter') addNoteFromCtx();
						if (e.key === 'Escape') closeContextMenu();
					}}
				/>
				<label class="ctx-color-label" title="Background Color">
					<input type="color" bind:value={newNoteColor} class="ctx-color-picker" />
					<div class="ctx-color-swatch" style:background-color={newNoteColor}></div>
					<span>Choose Color</span>
				</label>
				<FancyButton1 onclick={addNoteFromCtx} style="width: 100%; margin-top: 4px;"
					>Create Note</FancyButton1
				>
				<div class="ctx-arrow"></div>
			</div>
		{/if}
	</Canvas>

	<MiniViewport notes={validNotes} />
</div>

<!-- Settings toggle button (top-right) -->
<button
	class="settings-toggle"
	style:right={settingsOpen ? '380px' : '20px'}
	onclick={() => (settingsOpen = !settingsOpen)}
	aria-label="Toggle board settings"
	aria-expanded={settingsOpen}
	class:active={settingsOpen}
>
	<LucideSymbol symbol="Settings" size={20} strokeWidth={2} />
</button>

<!-- Settings Sidebar -->
<SettingsSidebar
	bind:open={settingsOpen}
	board={data.board!}
	contributors={(data.contributors ?? []).map(c => ({ ...c, permission: c.permission ?? '' }))}
	canModify={data.canModify ?? false}
	isOwner={data.user?.id === data.board?.owner}
	boardId={data.id}
/>

<button class="backpedal" type="button" onclick={() => goto('/dashboard')}>
	<LucideSymbol symbol="ArrowLeft" size={24} strokeWidth={2} />
</button>

<style>
	.note-creator {
		position: fixed;
		top: 20px;
		left: 60px;
		z-index: 1000;
		display: flex;
		gap: 12px;
	}

	.save-button {
		height: 38px;
		display: flex;
		align-items: center;
		gap: 8px;
		background: var(--editor-interface-background, rgba(20, 20, 30, 0.85));
		border: 1px solid var(--editor-interface-border, rgba(255, 255, 255, 0.12));
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		border-radius: 12px;
		padding: 0 16px;
		color: var(--default-text-color, #fff);
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.save-button:hover {
		background: var(--editor-interface-background, rgba(30, 30, 45, 0.95));
		border-color: var(--editor-interface-border, rgba(255, 255, 255, 0.25));
		transform: translateY(-2px);
	}

	.save-button:active {
		transform: scale(0.95);
	}

	.save-button span {
		opacity: 0.8;
		font-weight: 600;
		font-size: 0.85rem;
	}

	/* Canvas viewport wrapper — transitions its right padding when sidebar is open */
	.canvas-viewport {
		position: fixed;
		inset: 0;
		transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		right: 0;
	}

	.canvas-viewport.sidebar-open {
		right: 360px;
	}

	@media (max-width: 600px) {
		.canvas-viewport.sidebar-open {
			right: 100%;
		}
	}

	/* Settings toggle button — fixed top-right */
	.settings-toggle {
		position: fixed;
		top: 20px;
		right: 20px;
		z-index: 1001;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border-radius: 12px;
		border: 1px solid var(--editor-interface-border, rgba(255, 255, 255, 0.12));
		background: var(--editor-interface-background, rgba(20, 20, 30, 0.85));
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		color: var(--default-text-color);
		cursor: pointer;
		transition:
			background 0.15s,
			border-color 0.15s,
			transform 0.1s,
			right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	:global(.canvas-viewport.sidebar-open) ~ .settings-toggle {
		right: 380px;
	}

	@media (max-width: 600px) {
		:global(.canvas-viewport.sidebar-open) ~ .settings-toggle {
			opacity: 0;
			pointer-events: none;
		}
	}

	.settings-toggle:hover {
		background: var(--editor-interface-background, rgba(30, 30, 45, 0.95));
		border-color: var(--editor-interface-border, rgba(255, 255, 255, 0.25));
		transform: translateY(-2px);
	}

	.settings-toggle:active {
		transform: scale(0.93);
	}

	.settings-toggle.active {
		background: var(
			--fancygradient,
			linear-gradient(135deg, rgba(108, 99, 255, 0.3), rgba(168, 85, 247, 0.3))
		);
		border: 1px solid transparent;
		color: white;
	}

	.canvas-context-menu {
		position: absolute;
		transform-origin: bottom center;
		background: #1e1e1e;
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 8px;
		padding: 12px;
		min-width: 180px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.4),
			0 0 0 1px rgba(0, 0, 0, 0.2);
		z-index: 2000;
		color: white;
		animation: menuFadeIn 0.15s ease-out;
		pointer-events: auto;
	}

	.ctx-arrow {
		position: absolute;
		bottom: -6px;
		left: 50%;
		transform: translateX(-50%) rotate(45deg);
		width: 12px;
		height: 12px;
		background: #1e1e1e;
		border-right: 1px solid rgba(255, 255, 255, 0.15);
		border-bottom: 1px solid rgba(255, 255, 255, 0.15);
		z-index: -1;
	}

	@keyframes menuFadeIn {
		from {
			opacity: 0;
			transform: var(--menu-transform-base) translateY(8px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: var(--menu-transform-base) translateY(0) scale(1);
		}
	}

	.ctx-header {
		font-size: 0.85rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.8);
		margin-bottom: -4px;
	}

	.ctx-input {
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		color: white;
		font-size: 0.85rem;
		padding: 6px 10px;
		width: 100%;
		outline: none;
		box-sizing: border-box;
		transition: border-color 0.2s;
	}

	.ctx-input:focus {
		border-color: rgba(255, 255, 255, 0.3);
	}

	.ctx-color-label {
		display: flex;
		align-items: center;
		gap: 8px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 6px;
		padding: 6px 10px;
		cursor: pointer;
		font-size: 0.8rem;
		transition: background 0.2s;
	}

	.ctx-color-label:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	@media (max-width: 600px) {
		.sidebar-open .note-creator {
			opacity: 0;
			pointer-events: none;
		}
	}

	.ctx-color-picker {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}

	.ctx-color-swatch {
		width: 16px;
		height: 16px;
		border-radius: 3px;
		border: 1px solid rgba(255, 255, 255, 0.2);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	.backpedal {
		position: absolute;
		top: 20px;
		left: 20px;
		text-align: center;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 38px;
		height: 38px;
		border-radius: 12px;
		border: 1px solid var(--editor-interface-border, rgba(255, 255, 255, 0.12));
		background: var(--editor-interface-background, rgba(20, 20, 30, 0.85));
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

		&:hover {
			background: var(--editor-interface-background, rgba(30, 30, 45, 0.95));
			border-color: var(--editor-interface-border, rgba(255, 255, 255, 0.25));
			transform: translateX(-3px);
		}

		&:active {
			transform: scale(0.95);
		}
	}

	.board-title-container {
		position: fixed;
		top: 20px;
		left: 0;
		right: 0;
		display: flex;
		justify-content: center;
		pointer-events: none;
		z-index: 1000;
	}

	.board-title {
		height: 38px;
		display: flex;
		align-items: center;
		gap: 10px;
		background: var(--editor-interface-background, rgba(20, 20, 30, 0.85));
		border: 1px solid var(--editor-interface-border, rgba(255, 255, 255, 0.12));
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border-radius: 12px;
		padding: 0 18px;
		color: var(--default-text-color, #fff);
		font-size: 0.9rem;
		font-weight: 600;
		letter-spacing: 0.01em;
		pointer-events: auto;
		max-width: 300px;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.board-title span {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		opacity: 0.9;
	}

	@media (max-width: 768px) {
		.board-title-container {
			display: none; /* Hide on small screens to avoid overlap */
		}
	}

	@media (max-width: 600px) {
		.sidebar-open .board-title-container {
			display: none;
		}
	}
</style>
