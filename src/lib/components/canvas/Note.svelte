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
	import type { NoteData } from '$lib/types/canvas/NoteData';
	import type { File } from '$lib/types/canvas/File';
	import { bringToFront, initializeZIndex } from '$lib/stores/noteZIndex';
	import { parseColor } from '$lib/parseColor';
	import LucideSymbol from '$lib/components/frontend/LucideSymbol.svelte';
	import DOMPurify from 'isomorphic-dompurify';

	let { data = $bindable(), remove }: { data: NoteData; remove: () => void } = $props();

	// Capture initial position as static value for position plugin (non-reactive)
	const initialPosition = { x: data.position.x, y: data.position.y };

	// svelte-ignore state_referenced_locally
	let notePosition = $state(data.position);
	let color = $state('var(--default-bg-color)');

	let sanitizedContent = $derived(
		data.content?.map(entry =>
			// entry
			typeof entry === 'string'
				? DOMPurify.sanitize(entry, {
						ALLOWED_TAGS: ['code', 'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li']
					})
				: entry
		)
	);

	$effect(() => {
		// set colors
		if (typeof data.color !== 'string') color = parseColor(data.color);
	});
</script>

<div
	{@attach draggable([
		grid([5, 5]),
		bounds(BoundsFrom.parent()),
		controls({ allow: ControlFrom.selector('.handle') }),
		position({ default: initialPosition }),
		events({
			onDragStart: () => {
				// Bring this note to front using the shared z-index store
				const z = bringToFront(notePosition.z);
				notePosition = { ...notePosition, z };
				// Sync back to parent
				data = { ...data, position: notePosition };
			},
			onDrag: dragData => {
				// Update position while keeping the current z-index
				notePosition = { ...dragData.offset, z: notePosition.z };
				data = { ...data, position: notePosition };
			}
		})
	])}
	class="note"
	title={data.title}
	id={data.title ?? undefined}
	style:background-color={color}
	style:z-index={notePosition.z}
>
	<div class="top-container">
		<div class="handle" unselectable="on">Drag me</div>
		<button onclick={remove} aria-label="Delete note" title="Delete note"
			>Delete me <LucideSymbol symbol={'x'} size={42} strokeWidth={1.5} /></button
		>
	</div>

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

					<!-- todo later, get and check types via the server, then validate if its on the allowlist, if not then do something to stop it from loading idk -->
					{#if mimeType.startsWith('image/')}
						<img src={url} alt="" loading="lazy" />
					{:else if mimeType.startsWith('video/')}
						<video crossorigin="anonymous" controls preload="metadata">
							<source src={url} type={mimeType} />
							<track kind="captions" />
							Your browser does not support the video tag.
						</video>
					{:else if mimeType.startsWith('audio/')}
						<audio crossorigin="anonymous" preload="metadata">
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
		word-wrap: break-word;
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
