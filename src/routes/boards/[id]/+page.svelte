<script lang="ts">
	import Note from '$lib/components/canvas/Note.svelte';
	import { enhance } from '$app/forms';
	import FancyButton1 from '$lib/components/buttons/FancyButton1.svelte';
	import type { PageProps } from './$types';
	import Canvas from '$lib/components/canvas/Canvas.svelte';
	import ZoomControl from '$lib/components/canvas/ZoomControl.svelte';

	import type { NoteData } from '$lib/types/canvas/NoteData';
	import { onMount } from 'svelte';
	import { initializeZIndex } from '$lib/stores/noteZIndex';
	import MiniViewport from '$lib/components/canvas/MiniViewport.svelte';
	import { validateUrl } from '$lib/parseInput';
	import type { File } from '$lib/types/canvas/File';
	import type { Color } from '$lib/types/canvas/Color';

	const { params, data, form }: PageProps = $props();
	let dialog = null! as HTMLDialogElement;
	let showDialog = $state(false);

	// svelte-ignore state_referenced_locally
	const { id, user, board, perms } = data;

	// svelte-ignore state_referenced_locally
	let notes: NoteData[] = $state(board.notes || []);

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
							const response = await fetch(s, {
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
				title,
				position: { x: 0, y: 0, z: 0 },
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
	});

	function saveNotes() {
		// ok how do i
		// uhh
		// wait holon id just use a form for it i think
		// so what else needs work now...
		// adding note-sub components to notes (more related to notes though)
		// programmatically extracing the data from said notes thing
		// make this fucking thing be hidden for once god damn it
		//
	}

	$effect(() => {
		if (notes.length > 0) initializeZIndex(notes);
	});
</script>

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
	data={data.board.canvas ?? {
		size: {
			width: 3200,
			height: 3200
		},
		background: {
			type: 'Custom',
			value:
				'conic-gradient(#dc57af 90deg,#a80f75 90deg 180deg,#dc57af 180deg 270deg,#a80f75 270deg);'
		}
	}}
>
	{#each notes as _, i}
		{console.log('added note')}
		<Note bind:data={notes[i]} remove={() => notes.splice(i, 1)} />
	{/each}
</Canvas>
<MiniViewport {notes} />

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
</style>
