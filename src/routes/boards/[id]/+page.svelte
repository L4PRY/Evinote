<script lang="ts">
	import Note from '$lib/components/Note.svelte';
	import { enhance } from '$app/forms';
	import FancyButton1 from '$lib/components/buttons/FancyButton1.svelte';
	import type { PageProps } from './$types';
	import type { NoteData } from '$lib/types/NoteData';
	import { onMount } from 'svelte';

	const { params, data, form }: PageProps = $props();
	let dialog = null! as HTMLDialogElement;
	let showDialog = $state(false);

	let notes: NoteData[] = $state([]);

	function addNote() {
		const titleInput = document.getElementById('note-title-input') as HTMLInputElement;
		const colorTypeSelect = document.getElementById('color-type-select') as HTMLSelectElement;
		const colorValueInput = document.getElementById('color-value-input') as HTMLInputElement;
		const contentTextarea = document.getElementById('note-data-input') as HTMLTextAreaElement;

		const title = titleInput.value.trim() || null;
		const colorType = colorTypeSelect.value as 'hex' | 'rgb' | 'hsl' | 'oklch';
		const colorValueStr = colorValueInput.value.trim();
		const contentStr = contentTextarea.value;

		// Parse color value based on type
		let color: NoteData['color'];
		if (colorType === 'hex') {
			color = { type: 'hex', value: colorValueStr };
		} else {
			// Parse comma-separated numbers for rgb, hsl, oklch
			const colorValues = colorValueStr.split(',').map(v => parseFloat(v.trim()));
			color = { type: colorType, value: colorValues as [number, number, number] };
		}

		// Parse comma-separated content
		const content = contentStr
			.split(',')
			.map(s => s.trim())
			.filter(s => s.length > 0);

		notes.push({
			title,
			position: { x: 0, y: 0, z: 0 },
			color,
			content
		});

		// Clear inputs after adding
		titleInput.value = '';
		colorValueInput.value = '';
		contentTextarea.value = '';

		// Hide the dialog
		showDialog = false;
	}
	onMount(() => {
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
</script>

<div class="note-creator">
	<FancyButton1 onclick={() => (showDialog = true)} width="100px">Add Note</FancyButton1>
	<form method="post" use:enhance>
		<input type="hidden" name="notes" value={JSON.stringify(notes)} />
		<button type="submit">Save notes</button>
	</form>
</div>
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
<div class="note-container">
	{#each notes as _, i}
		{console.log('added note')}
		<Note data={notes[i]} />
	{/each}
	<!-- <Note
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
	/> -->
</div>

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
	.note-container {
		position: absolute;
		margin: 0;
		left: 0;
		top: 0;
		box-sizing: border-box;
		width: 100%;
		height: 100vh;
		overflow: hidden;
		border: 5px solid var(--default-text-color);
	}
</style>
