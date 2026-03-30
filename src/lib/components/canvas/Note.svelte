<script lang="ts">
	import type { NoteData } from '$lib/types/canvas/NoteData';
	import type { File } from '$lib/types/canvas/File';
	import { bringToFront, initializeZIndex } from '$lib/stores/noteZIndex';
	import { parseColor } from '$lib/parseColor';
	import LucideSymbol from '$lib/components/frontend/LucideSymbol.svelte';
	import DOMPurify from 'isomorphic-dompurify';
	import { onMount } from 'svelte';
	import { zoomLevel } from '$lib/stores/zoomLevel';
	import { canvasSize } from '$lib/stores/viewport';

	let { data = $bindable(), remove }: { data: NoteData; remove: () => void } = $props();

	let note: HTMLDivElement;

	// Capture initial position as static value for position plugin (non-reactive)
	const initialPosition = { x: data.position?.x ?? 0, y: data.position?.y ?? 0 };

	let notePosition = $state(data.position ?? { x: 0, y: 0, z: 1 });
	let noteSize = $state(data.size ?? { width: 200, height: 200 });
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

	function dragNote(node: HTMLElement) {
		let isDragging = false;
		let startClientX = 0;
		let startClientY = 0;
		let startNoteX = 0;
		let startNoteY = 0;

		function onPointerDown(e: PointerEvent) {
			const handle = node.querySelector('.handle');
			if (!handle || !handle.contains(e.target as Node)) return;
			if (e.button !== 0) return;

			isDragging = true;
			startClientX = e.clientX;
			startClientY = e.clientY;
			startNoteX = notePosition.x;
			startNoteY = notePosition.y;

			node.setPointerCapture(e.pointerId);

			const z = bringToFront(notePosition.z);
			notePosition = { ...notePosition, z };
			data = { ...data, position: notePosition };
			e.preventDefault();
		}

		function onPointerMove(e: PointerEvent) {
			if (!isDragging) return;

			const physicalDx = e.clientX - startClientX;
			const physicalDy = e.clientY - startClientY;

			let newX = startNoteX + physicalDx / $zoomLevel;
			let newY = startNoteY + physicalDy / $zoomLevel;

			newX = Math.round(newX / 5) * 5;
			newY = Math.round(newY / 5) * 5;

			const w = Math.max(0, $canvasSize.width - node.offsetWidth);
			const h = Math.max(0, $canvasSize.height - node.offsetHeight);

			newX = Math.max(0, Math.min(newX, w));
			newY = Math.max(0, Math.min(newY, h));

			notePosition = { x: newX, y: newY, z: notePosition.z };
			data = { ...data, position: notePosition };
		}

		function onPointerUp(e: PointerEvent) {
			if (!isDragging) return;
			isDragging = false;
			node.releasePointerCapture(e.pointerId);
		}

		node.addEventListener('pointerdown', onPointerDown);
		node.addEventListener('pointermove', onPointerMove);
		node.addEventListener('pointerup', onPointerUp);
		node.addEventListener('pointercancel', onPointerUp);

		return {
			destroy() {
				node.removeEventListener('pointerdown', onPointerDown);
				node.removeEventListener('pointermove', onPointerMove);
				node.removeEventListener('pointerup', onPointerUp);
				node.removeEventListener('pointercancel', onPointerUp);
			}
		};
	}
	function resizeNote(node: HTMLElement, direction: string) {
		let isResizing = false;
		let startClientX = 0;
		let startClientY = 0;
		let startWidth = 0;
		let startHeight = 0;
		let startX = 0;
		let startY = 0;

		function onPointerDown(e: PointerEvent) {
			if (e.button !== 0) return;
			isResizing = true;
			startClientX = e.clientX;
			startClientY = e.clientY;
			startWidth = noteSize.width;
			startHeight = noteSize.height;
			startX = notePosition.x;
			startY = notePosition.y;

			node.setPointerCapture(e.pointerId);
			e.stopPropagation();
			e.preventDefault();
		}

		function onPointerMove(e: PointerEvent) {
			if (!isResizing) return;

			const dx = (e.clientX - startClientX) / $zoomLevel;
			const dy = (e.clientY - startClientY) / $zoomLevel;

			let newWidth = startWidth;
			let newHeight = startHeight;
			let newX = startX;
			let newY = startY;

			// Horizontal resizing logic
			if (direction.includes('e')) {
				newWidth = Math.max(150, Math.min(startWidth + dx, 500));
			} else if (direction.includes('w')) {
				const maxDx = startWidth - 150;
				const clampedDx = Math.min(dx, maxDx);
				newWidth = startWidth - clampedDx;
				newX = startX + clampedDx;
			}

			// Vertical resizing logic
			if (direction.includes('s')) {
				newHeight = Math.max(100, startHeight + dy);
			} else if (direction.includes('n')) {
				const maxDy = startHeight - 100;
				const clampedDy = Math.min(dy, maxDy);
				newHeight = startHeight - clampedDy;
				newY = startY + clampedDy;
			}

			noteSize = { width: newWidth, height: newHeight };
			notePosition = { x: newX, y: newY, z: notePosition.z };
			data = { ...data, size: noteSize, position: notePosition };
		}

		function onPointerUp(e: PointerEvent) {
			if (!isResizing) return;
			isResizing = false;
			node.releasePointerCapture(e.pointerId);
		}

		node.addEventListener('pointerdown', onPointerDown);
		window.addEventListener('pointermove', onPointerMove);
		window.addEventListener('pointerup', onPointerUp);
		window.addEventListener('pointercancel', onPointerUp);

		return {
			destroy() {
				node.removeEventListener('pointerdown', onPointerDown);
				window.removeEventListener('pointermove', onPointerMove);
				window.removeEventListener('pointerup', onPointerUp);
				window.removeEventListener('pointercancel', onPointerUp);
			}
		};
	}
</script>

<div
	use:dragNote
	class="note"
	title={data.title}
	id={data.id ?? data.title}
	style:background-color={color}
	style:z-index={notePosition.z}
	style:left={notePosition.x + 'px'}
	style:top={notePosition.y + 'px'}
	bind:this={note}
	bind:clientWidth={noteSize.width}
	bind:clientHeight={noteSize.height}
	style:width={noteSize.width + 'px'}
	style:height={noteSize.height + 'px'}
>
	<div class="top-container">
		<div class="handle" unselectable="on">Drag me</div>
		<button onclick={remove} aria-label="Delete note" title="Delete note"
			>Delete me <LucideSymbol symbol={'x'} size={42} strokeWidth={1.5} /></button
		>
	</div>

	<h1>{data.title}</h1>
	<code>[{Math.floor(notePosition.x)}x {Math.floor(notePosition.y)}y {notePosition.z}z]</code>
	<code>[{Math.floor(noteSize.width)}w x {Math.floor(noteSize.height)}h]</code>
	<div class="note-content-wrapper">
		<div class="note-content">
			{#each sanitizedContent as entry, i}
				<div class="entry">
					{#if typeof entry === 'string'}
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
							<audio controls preload="metadata" src={url}>
								Your browser does not support the audio element.
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

	<!-- Edge resize handles -->
	<div class="resize-handle n" use:resizeNote={'n'}></div>
	<div class="resize-handle s" use:resizeNote={'s'}></div>
	<div class="resize-handle e" use:resizeNote={'e'}></div>
	<div class="resize-handle w" use:resizeNote={'w'}></div>

	<!-- Corner resize handles -->
	<div class="resize-handle nw" use:resizeNote={'nw'}></div>
	<div class="resize-handle ne" use:resizeNote={'ne'}></div>
	<div class="resize-handle sw" use:resizeNote={'sw'}></div>
	<div class="resize-handle se" use:resizeNote={'se'}>
		<LucideSymbol symbol={'maximize-2'} size={14} strokeWidth={2} />
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
		box-shadow: 0 0 10px var(--default-text-color);
		margin-bottom: 16px;
		width: fit-content;
		height: fit-content;
		position: absolute;
		border-radius: 0 0 5px 5px;
		min-width: 150px;
		max-width: 500px;
		min-height: 100px;
		max-height: max-content;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.note-content-wrapper {
		flex: 1;
		overflow: scroll;
		scrollbar-width: none;
		overscroll-behavior: none;
	}

	.resize-handle {
		position: absolute;
		z-index: 100;
		background: transparent;
		transition: background 0.2s;

		&:hover {
			background: rgba(255, 255, 255, 0.05);
		}
	}

	/* Edge handles */
	.resize-handle.n { top: 0; left: 8px; right: 8px; height: 6px; cursor: ns-resize; }
	.resize-handle.s { bottom: 0; left: 8px; right: 8px; height: 6px; cursor: ns-resize; }
	.resize-handle.e { top: 8px; bottom: 8px; right: 0; width: 6px; cursor: ew-resize; }
	.resize-handle.w { top: 8px; bottom: 8px; left: 0; width: 6px; cursor: ew-resize; }

	/* Corner handles */
	.resize-handle.nw { top: 0; left: 0; width: 12px; height: 12px; cursor: nwse-resize; }
	.resize-handle.ne { top: 0; right: 0; width: 12px; height: 12px; cursor: nesw-resize; }
	.resize-handle.sw { bottom: 0; left: 0; width: 12px; height: 12px; cursor: nesw-resize; }
	.resize-handle.se {
		bottom: 0;
		right: 0;
		width: 20px;
		height: 20px;
		cursor: nwse-resize;
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgba(255, 255, 255, 0.5);
		transition: color 0.2s;

		&:hover {
			color: white;
			background: rgba(255, 255, 255, 0.1);
		}
	}

	.note > * {
		/*color: var(--default-text-color);*/
		color: white;
	}

	.entry img {
		object-fit: cover;
		width: 100%;
		border-radius: 5px;
		padding: 10px;
		height: auto;
	}
</style>
