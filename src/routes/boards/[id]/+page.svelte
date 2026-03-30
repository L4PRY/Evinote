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
	import { validateUrl } from '$lib/parseInput';
	import { generateSecureRandomString } from '$lib/randomString';
	import { validateCanvasData, validateNoteData } from '$lib/canvas/validation';

	import type { PageProps } from './$types';
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';

	const { params, data, form }: PageProps = $props();
	let dialog = null! as HTMLDialogElement;
	let showDialog = $state(false);
	let settingsOpen = $state(false);
	let viewport = $state();

	// svelte-ignore state_referenced_locally
	const { id, user, board, perms } = data;

	// svelte-ignore state_referenced_locally
	let notes = $state((data.board.notes ?? []).map(validateNoteData));

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

			notes.push({
				id: generateSecureRandomString(),
				title,
				position: { x: 0, y: 0, z: 0 },
				size: { width: 200, height: 200 },
				color,
				content
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
		document.title = `Evinote • ${board.name}`;

		dialog = document.getElementById('add-dialog') as HTMLDialogElement;
		console.log(dialog);

		if (localStorage.getItem(`board-${id}-viewport`)) {
			viewport = JSON.parse(localStorage.getItem(`board-${id}-viewport`)!);
		}

		// Expose notes to window for debugging in dev mode
		(window as any).notes = notes;

		window.addEventListener('beforeunload', () => {
			localStorage.setItem(`board-${id}-viewport`, JSON.stringify(viewport));
			console.log('saved viewport to localStorage', viewport);
		});
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
		if (notes.length > 0) initializeZIndex(notes);
		$inspect(notes);
		$inspect(viewport);
		// localStorage.setItem(`board-${id}-viewport`, JSON.stringify(viewport));
	});
</script>

<!-- Canvas viewport wrapper — shrinks when sidebar is open -->
<div class="canvas-viewport" class:sidebar-open={settingsOpen}>

<!-- if perms then check for write or if board.owner == perm.uid, otherwise check for board.owner = checkLogin().id-->

{#if board.owner === user?.id || perms?.perm === 'Write'}
	<div class="note-creator">
		<FancyButton1 onclick={() => (showDialog = true)} style="width: 100px">Add Note</FancyButton1>
		<form method="post" use:enhance>
			<input type="hidden" name="notes" value={JSON.stringify(notes)} />
			<button type="submit">Save notes</button>
		</form>
	</div>
{/if}
{#if showDialog}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="dialog-container" id="add-dialog" onclick={() => (showDialog = false)}>
		<dialog open class="dialog" onclick={e => e.stopPropagation()}>
			<input type="text" id="note-title-input" placeholder="note title" />
			<div>
				<select name="values" id="color-type-select">
					<option value="oklch">oklch</option>
					<option value="rgb" selected>rgb</option>
					<option value="hsl">hsl</option>
					<option value="hex">hex</option>
				</select> <input type="text" id="color-value-input" placeholder="color value" />
			</div>
			<textarea id="note-data-input" placeholder="enter comma separated contents"></textarea>
			<FancyButton1 onclick={addNote}>Add note</FancyButton1>
		</dialog>
	</div>
{/if}

<ZoomControl />
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
	data={validateCanvasData(data.board.canvas)}
>
	{#each notes as _, i}
		{console.log('added note')}
		<Note bind:data={notes[i]} remove={() => notes.splice(i, 1)} />
	{/each}
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
	<LucideSymbol symbol="Settings" size={20} />

</button>

<!-- Settings Sidebar -->
<SettingsSidebar
	bind:open={settingsOpen}
	board={data.board}
	contributors={(data.contributors ?? []).map(c => ({ ...c, permission: c.permission ?? '' }))}
	canModify={data.canModify ?? false}
	isOwner={data.user?.id === data.board.owner}
	boardId={data.id}
/>

<style>
	.dialog-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1001;
		background-color: rgb(0 0 0 / 0.5);
		backdrop-filter: blur(4px);
	}

	.dialog {
		position: static;
		margin: 0;
		background-color: var(--default-bg-color);
		color: var(--default-text-color);
		border: 1px solid var(--default-text-color);
		border-radius: 8px;
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		min-width: 300px;
		max-width: 90vw;
	}

	.dialog input[type='text'],
	.dialog textarea,
	.dialog select {
		background-color: var(--default-bg-color, #2a2a2a);
		color: var(--default-text-color, #fff);
		border: 1px solid var(--default-text-color, #444);
		border-radius: 4px;
		padding: 8px 12px;
		font-size: 14px;
	}

	.dialog textarea {
		min-height: 120px;
		resize: vertical;
	}

	.dialog div {
		display: flex;
		gap: 8px;
	}

	.dialog div select {
		flex-shrink: 0;
	}

	.dialog div input {
		flex: 1;
	}
	.note-creator {
		position: fixed;
		top: 20px;
		left: 20px;
		z-index: 1000;
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
		background: var(--default-blur-hover-color, rgba(255, 255, 255, 0.1));
	}

	.settings-toggle:active {
		transform: scale(0.93);
	}

	.settings-toggle.active {
		background: var(--fancygradient, linear-gradient(135deg, rgba(108, 99, 255, 0.3), rgba(168, 85, 247, 0.3)));
		border: 1px solid transparent;
	}


</style>
