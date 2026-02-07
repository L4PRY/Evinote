<script lang="ts">
	import Note from '$lib/components/Note.svelte';
	import FancyButton1 from '$lib/components/buttons/FancyButton1.svelte';
	import { mount } from 'svelte';
	import type { PageProps } from './$types';
	const { params, data, form }: PageProps = $props();

	const notes = $state(data.notes);

	function addNote() {
		// add a note to the note container with default values
		const noteContainer = document.querySelector('.note-container');
		if (!noteContainer) return;

		mount(Note, {
			target: noteContainer,
			props: {
				data: {
					title: 'New Note',
					position: { x: 500, y: 500, z: 0 },
					color: { type: 'oklch', value: [28, 19, 287] },
					content: ['This is a new note!']
				}
			}
		});
	}
</script>

<div class="note-creator">
	<FancyButton1 onclick={addNote} width="100px">Add Note</FancyButton1>
	<FancyButton1 width="100px">Save Notes</FancyButton1>
</div>
<div class="note-container">
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
</div>

<style>
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
