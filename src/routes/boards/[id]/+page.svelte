<script lang="ts">
	// components
	import Note from '$lib/components/canvas/Note.svelte';
	import FancyButton1 from '$lib/components/buttons/FancyButton1.svelte';
	import Canvas from '$lib/components/canvas/Canvas.svelte';
	import ZoomControl from '$lib/components/canvas/ZoomControl.svelte';
	import MiniViewport from '$lib/components/canvas/MiniViewport.svelte';
	import SettingsSidebar from '$lib/components/settings/SettingsSidebar.svelte';
	import LucideSymbol from '$lib/components/frontend/LucideSymbol.svelte';


	// types and utils
	import type { NoteData } from '$lib/types/canvas/NoteData';
	import type { Color } from '$lib/types/canvas/Color';
	import { initializeZIndex } from '$lib/stores/noteZIndex';
	import { position, getViewportPosition, getViewportCenter, getScrollFromCenter } from '$lib/stores/viewport';
	import { zoomLevel } from '$lib/stores/zoomLevel';
	import { get } from 'svelte/store';
	import { validateUrl } from '$lib/parseInput';
	import { generateSecureRandomString } from '$lib/randomString';
	import { validateCanvasData, validateNoteData } from '$lib/canvas/validation';
	import { notifications } from '$lib/stores/notifications';

	import type { PageProps } from './$types';
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	const { params, data, form }: PageProps = $props();
	
	// Show toast if form action returns success or error
	$effect(() => {
		if (form) {
			if (form.success) {
				notifications.add({
					title: 'Saved',
					message: 'Board notes updated successfully',
					type: 'success'
				});
			} else if (form.error) {
				notifications.add({
					title: 'Error Saving',
					message: form.error,
					type: 'error'
				});
			}
		}
	});

	let dialog = null! as HTMLDialogElement;
	let showDialog = $state(false);
	let settingsOpen = $state(false);

	let contextMenuData = $state<{ show: boolean; x: number; y: number; canvasX: number; canvasY: number }>({
		show: false,
		x: 0,
		y: 0,
		canvasX: 0,
		canvasY: 0
	});

	let newNoteTitle = $state('');
	let newNoteColor = $state('#1e1e1e');

	function handleCanvasContextMenu(e: MouseEvent, canvasX: number, canvasY: number) {
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
		
		const title = newNoteTitle.trim() || null;
		const color: Color = { type: 'hex', value: newNoteColor };
		
		notes.push({
			id: generateSecureRandomString(),
			title,
			position: { x: contextMenuData.canvasX, y: contextMenuData.canvasY, z: 0 },
			size: { width: 200, height: 200 },
			color,
			content: ['']
		});
		
		contextMenuData.show = false;
	}

	let newNoteTitle = $state('');
	let newNoteColor = $state('#1e1e1e');

	const id = $derived(data.id);
	const user = $derived(data.user);
	const board = $derived(data.board);
	const perms = $derived(data.perms);
	const hasWritePermission = $derived(board && (board.owner === user?.id || perms?.perm === 'Write'));

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
		
		const title = newNoteTitle.trim() || null;
		const color: Color = { type: 'hex', value: newNoteColor };
		
		notes.push({
			id: generateSecureRandomString(),
			title,
			position: { x: contextMenuData.canvasX, y: contextMenuData.canvasY, z: 0 },
			size: { width: 200, height: 200 },
			color,
			content: ['']
		});
		
		contextMenuData.show = false;
	}

	// svelte-ignore state_referenced_locally
	let notes = $state((data.board?.notes ?? []).map(validateNoteData));

	function addNote() {
		const titleInput = document.getElementById('note-title-input') as HTMLInputElement;
		const colorTypeSelect = document.getElementById('color-type-select') as HTMLSelectElement;
		const colorValueInput = document.getElementById('color-value-input') as HTMLInputElement;
		const contentTextarea = document.getElementById('note-data-input') as HTMLTextAreaElement;

		const title = titleInput.value.trim() || null;
		const colorType = colorTypeSelect.value as Color['type'];
		const colorValueStr = colorValueInput.value.trim() || '0,0,0'; // default to black if empty
		const contentStr = contentTextarea.value.trim();

		let color: NoteData['color'] =
			colorType === 'hex'
				? { type: 'hex', value: colorValueStr }
				: {
						type: colorType,
						value: colorValueStr.split(',').map(v => parseFloat(v.trim())) as [
							number,
							number,
							number
						]
					};

		// Parse comma-separated content
		const parseContent = async (contentStr: string): Promise<NoteData['content']> => {
			const contentArray = contentStr.split(',').map(s => s.trim());

			// Process each entry asynchronously
			const processedContent = await Promise.all(
				contentArray.map(async s => {
					console.log('validating', s);
					if (validateUrl(s)) {
						try {
							// Perform HEAD request to determine MIME type
							const response = await fetch(`/proxy?url=${encodeURIComponent(s)}`, {
								method: 'HEAD',

								headers: {
									'User-Agent': 'Evinote/1.0 (github.com/L4PRY/Evinote)' // Set a custom User-Agent
								}
							});
							if (response.ok) {
								const mime = response.headers.get('Content-Type') ?? '';
								console.log('mime type', mime);
								return { mime, location: s };
							} else {
								console.log('failed to fetch url, treating as text', s);
								return s;
							}
						} catch (err) {
							console.log('error fetching url, treating as text', s, err);
							return s;
						}
					} else {
						console.log('not a valid url, treating as text', s);
						return s;
					}
				})
			);

			return processedContent;
		};

		// Call the async function and wait for the content to be processed
		(async () => {
			const content = await parseContent(contentStr);

			// Prepend an empty text entry if the parsed content has no text entries
			const contentWithDefault = content.length === 0 ? [''] : content;
			notes.push({
				id: generateSecureRandomString(),
				title,
				position: { x: 0, y: 0, z: 0 },
				size: { width: 200, height: 200 },
				color,
				content: contentWithDefault
			});
		})();

		// Clear inputs after adding
		titleInput.value = '';
		colorValueInput.value = '';
		contentTextarea.value = '';

		// Hide the dialog
		showDialog = false;
	}

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
			
			localStorage.setItem(`board-${id}-viewport`, JSON.stringify({
				centerX,
				centerY,
				zoom: currentZoom
			}));
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

		window.addEventListener('beforeunload', saveOnUnload);
		window.addEventListener('click', handleWindowClick);
		return () => {
			window.removeEventListener('beforeunload', saveOnUnload);
			window.removeEventListener('click', handleWindowClick);
		};
	});

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
		if (notes.length > 0) initializeZIndex(notes);
		$inspect(notes);
	});
	function handleKeydown(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
			e.preventDefault();
			const saveForm = document.getElementById('save-notes-form') as HTMLFormElement;
			if (saveForm) {
				saveForm.requestSubmit();
			}
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
		<form method="post" use:enhance id="save-notes-form">
			<input type="hidden" name="notes" value={JSON.stringify(notes)} />
			<button type="submit" class="save-button" title="Save notes (Ctrl+S)">
				<LucideSymbol symbol="Save" size={16} strokeWidth={2} />
				<span>Save</span>
			</button>
		</form>
	</div>
{/if}

<!-- <Canvas
	data={

	}
>
	{#each notes as _, i}
		{console.log('added note')}
		<Note bind:data={notes[i]} />
	{/each}
	<Note
		data={{
			title: 'uhm',
			position: { x: 0, y: 0, z: 0 },
			color: { type: 'oklch', value: [28, 19, 287] },
			content: [
				'Hi',
				'<b>Is this thing working?</b>',
				{
					mime: 'image/ico',
					location:
						'https://cdn.discordapp.com/attachments/750471165260071022/890684717416996954/ezgif-7-adbb629925f9.gif?ex=6984f2c8&is=6983a148&hm=1e1dfd6777c961e4f40ad1b7003d1d39971b9efbfb8ee88a26451540cce81e16&'
				},
				{
					mime: 'audio/mpeg',
					location: 'https://files.catbox.moe/ax3njl.mp3'
				},
				{
					mime: 'video/mp4',
					location:
						'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
				}
			]
		}}
	/>
</Canvas> -->
<Canvas
	data={validateCanvasData(data.board?.canvas)}
	contextmenu={handleCanvasContextMenu}
>
	{@const gridSnap = 5}
	{#each notes as _, i}
		{console.log('added note')}
		<Note bind:data={notes[i]} {gridSnap} remove={() => notes.splice(i, 1)} readonly={!hasWritePermission} />
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
			onclick={(e) => e.stopPropagation()}
			oncontextmenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
		>
			<div class="ctx-header">New Note</div>
			<input
				type="text"
				bind:value={newNoteTitle}
				placeholder="Enter title..."
				class="ctx-input"
				autofocus
				onkeydown={(e) => {
					if (e.key === 'Enter') addNoteFromCtx();
					if (e.key === 'Escape') closeContextMenu();
				}}
			/>
			<label class="ctx-color-label" title="Background Color">
				<input type="color" bind:value={newNoteColor} class="ctx-color-picker" />
				<div class="ctx-color-swatch" style:background-color={newNoteColor}></div>
				<span>Choose Color</span>
			</label>
			<FancyButton1 onclick={addNoteFromCtx} style="width: 100%; margin-top: 4px;">Create Note</FancyButton1>
			<div class="ctx-arrow"></div>
		</div>
	{/if}
</Canvas>

<MiniViewport {notes} />
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

<button
	class="backpedal"
	type="button"
	onclick={() => goto("/dashboard")}>
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

	.settings-toggle:hover {
		background: var(--editor-interface-background, rgba(30, 30, 45, 0.95));
		border-color: var(--editor-interface-border, rgba(255, 255, 255, 0.25));
		transform: translateY(-2px);
	}

	.settings-toggle:active {
		transform: scale(0.93);
	}

	.settings-toggle.active {
		background: var(--fancygradient, linear-gradient(135deg, rgba(108, 99, 255, 0.3), rgba(168, 85, 247, 0.3)));
		border: 1px solid transparent;
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
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.2);
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
		from { opacity: 0; transform: var(--menu-transform-base) translateY(8px) scale(0.95); }
		to { opacity: 1; transform: var(--menu-transform-base) translateY(0) scale(1); }
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
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
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

</style>
