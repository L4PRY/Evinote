<script lang="ts">
	import {
		draggable,
		grid,
		controls,
		ControlFrom,
		bounds,
		BoundsFrom,
		position,
		events
	} from '@neodrag/svelte';
	import type { NoteData } from '$lib/types/NoteData';
	import type { File } from '$lib/types/File';
	// import DOMPurify from 'dompurify';

	let { data }: { data: NoteData } = $props();

	// svelte-ignore state_referenced_locally
	let notePosition = $state(data.position);
	let color = $state('var(--default-bg-color)');

	// what the fuck vite, messing with my imports and shit
	let sanitizedContent = $derived(
		data.content.map(
			entry => entry
			// typeof entry === 'string'
			// ? DOMPurify.sanitize(entry, {
			// ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li']
			// })
			// : entry
		)
	);

	$effect(() => {
		// set colors
		if (data.color)
			switch (data.color.type) {
				case 'oklch': {
					const [l, c, h, a] = data.color.value;
					color = `oklch(${l}% ${c} ${h}deg ${a ? '/ ' + a : ''})`;
					break;
				}
				case 'rgb': {
					const [r, g, b, a] = data.color.value;
					color = `rgb(${r}, ${g}, ${b} ${a ? '/ ' + a : ''})`;
					break;
				}
				case 'hsl': {
					const [h, s, l, a] = data.color.value;
					color = `hsl(${h} ${s}% ${l}%) ${a ? '/ ' + a : ''}`;
					break;
				}
				case 'hex':
					color = data.color.value;
					break;
				default:
					break;
			}
	});
</script>

<div
	{@attach draggable([
		grid([5, 5]),
		bounds(BoundsFrom.parent()),
		controls({ allow: ControlFrom.selector('.handle') }),
		// position({ default: { ...notePosition } }),
		events({
			onDrag: data => {
				// get z-index style of the note and add 1 to it, then set it as the new z-index and also update the note position
				const z = parseInt(getComputedStyle(document.querySelector('.note')!).zIndex || '0') + 1;
				notePosition = { ...data.offset, z };
			}
		})
	])}
	class="note"
	title={data.title}
	style:background-color={color}
	style:z-index={notePosition.z}
>
	<div class="handle" unselectable="on">Drag me</div>
	<h1>{data.title}</h1>
	<code>[{Math.floor(notePosition.x)}, {Math.floor(notePosition.y)}, {notePosition.z}]</code>
	<div class="note-content">
		{#each sanitizedContent as entry, i}
			<div class="entry">
				{#if typeof entry === 'string'}
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					<p>{@html entry}</p>
				{:else}
					{@const file = entry as File}
					{@const mimeType = file.mime.toString()}
					{@const url = file.location.toString()}

					{#if mimeType.startsWith('image/')}
						<img src={url} alt="" loading="lazy" />
					{:else if mimeType.startsWith('video/')}
						<video controls preload="metadata">
							<source src={url} type={mimeType} />
							<track kind="captions" />
							Your browser does not support the video tag.
						</video>
					{:else if mimeType.startsWith('audio/')}
						<audio controls preload="metadata">
							<source src={url} type={mimeType} />
							Your browser does not support the audio tag.
						</audio>
					{:else if mimeType === 'application/pdf'}
						<object
							data={url}
							aria-labelledby="note"
							type="application/pdf"
							width="100%"
							height="500px"
						>
							<p>
								Unable to display PDF. <button onclick={() => window.open(url, '_blank')}
									>Download</button
								> instead.
							</p>
						</object>
					{:else if mimeType.startsWith('text/')}
						<iframe src={url} title="Text content" sandbox="allow-same-origin"></iframe>
					{:else}
						<button onclick={() => window.open(url, '_blank')}>Download file ({mimeType})</button>
					{/if}
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.handle {
		background-color: oklch(28% 19% 287deg);
		text-align: center;
		cursor: grab;
		color: white;
		&:hover {
			background-color: oklch(55% 45% 285deg);
		}
	}

	.note-content {
		display: flex;
		flex-direction: column;
		gap: 15px;
	}

	.entry {
		border-top: var(--default-border);
	}

	.note {
		background-color: var(--default-bg-color);
		color: var(--default-text-color);
		box-shadow: 0 0 10px var(--default-text-color);
		margin-bottom: 16px;
		width: 15rem;
		height: fit-content;
		position: absolute;
		border-radius: 5px;
	}
</style>
